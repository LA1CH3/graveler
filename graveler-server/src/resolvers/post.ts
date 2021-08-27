import { isAuth } from "../middleware/isAuth";
import { MyContext } from "src/types";
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { Post } from "../entities/Post";
import { getConnection } from "typeorm";
import { Updoot } from "../entities/Updoot";
import { User } from "../entities/User";

@InputType()
class PostInput {
  @Field()
  title: string;
  @Field()
  text: string;
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];
  @Field()
  hasMore: boolean;
}

@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 50);
  }

  @FieldResolver(() => User)
  creator(@Root() post: Post, @Ctx() { userLoader }: MyContext) {
    return userLoader.load(post.creatorId);
  }

  @FieldResolver(() => Int, { nullable: true })
  async voteStatus(
    @Root() post: Post,
    @Ctx() { updootLoader, req }: MyContext
  ) {
    if (!req.session.userId) {
      return null;
    }

    const updoot = await updootLoader.load({
      userId: req.session.userId,
      postId: post._id,
    });

    return updoot ? updoot.value : null;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg("postId", () => Int) postId: number,
    @Arg("value", () => Int) value: number,
    @Ctx() { req }: MyContext
  ) {
    const isUpdoot = value !== -1;
    const dootValue = isUpdoot ? 1 : -1;
    const { userId } = req.session;

    const updoot = await Updoot.findOne({ where: { postId, userId } });

    if (updoot && updoot.value !== dootValue) {
      // user has voted on post before and changing vote
      await getConnection().transaction(async (tm) => {
        tm.query(
          `
          update updoot
          set value = $1
          where "userId" = $2 and "postId" = $3
        `,
          [dootValue, userId, postId]
        );

        await tm.query(
          `
        update post
        set points = points + $1
        where _id = $2;
        `,
          // because a change in vote is both taking away the previous upvote/downvote, and then applying the new point as well
          [2 * dootValue, postId]
        );
      });
    } else if (!updoot) {
      // havent voted before
      await getConnection().transaction(async (tm) => {
        await tm.query(
          `
        insert into updoot ("userId", "postId", value)
        values ($1,$2,$3);
        `,
          [userId, postId, dootValue]
        );

        await tm.query(
          `
        update post
        set points = points + $1
        where _id = $2;
        `,
          [dootValue, postId]
        );
      });

      // await getConnection().query(
      //   `
      //   START TRANSACTION;

      //   COMMIT;
      // `
      // );
    }

    // await Updoot.insert({
    //   userId,
    //   postId,
    //   value: dootValue,
    // });

    // await Post.update({
    //   _id:
    // })

    return true;
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
  ): Promise<PaginatedPosts> {
    // 20 -> 21
    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = realLimit + 1;

    const replacements: any = [realLimitPlusOne];

    if (cursor) {
      replacements.push(new Date(parseInt(cursor)));
    }

    const posts = await getConnection().query(
      `
      select p.*
      from post p
      ${cursor ? `where p."createdAt" < $2` : ""}
      order by p."createdAt" DESC
      limit $1
      `,
      replacements
    );

    // const qb = getConnection()
    //   .getRepository(Post)
    //   .createQueryBuilder("p")
    //   .innerJoinAndSelect("p.creator", "u", 'u._id = p."creatorId"')
    //   .orderBy('p."createdAt"', "DESC")
    //   .take(realLimitPlusOne);

    // if (cursor) {
    //   qb.where('p."createdAt" < :cursor', {
    //     cursor: new Date(parseInt(cursor)),
    //   });
    // }

    // const posts = await qb.getMany();

    return {
      posts: posts.slice(0, realLimit),
      hasMore: posts.length === realLimitPlusOne,
    };
  }

  @Query(() => Post, { nullable: true })
  async post(@Arg("id", () => Int) id: number): Promise<Post | undefined> {
    const post = await Post.findOne(id);

    // const post = await getConnection().query(
    //   `
    //   select p.*
    //   from post p
    //   inner join public.user u on u._id = p."creatorId"
    //   where p._id = $1
    //   limit 1
    // `,
    //   [id]
    // );

    console.log(post);
    return post;
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg("input") input: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<Post> {
    // 2 sql queries
    return Post.create({
      ...input,
      creatorId: req.session.userId,
    }).save();
  }

  @Mutation(() => Post, { nullable: true })
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("title") title: string,
    @Arg("text") text: string,
    @Ctx() { req }: MyContext
  ): Promise<Post | null> {
    // const post = await Post.findOne(id);

    // if (!post) {
    //   return null;
    // }

    const post = await getConnection()
      .createQueryBuilder()
      .update(Post)
      .set({ title, text })
      .where('_id = :id and "creatorId" = :creatorId', {
        id,
        creatorId: req.session.userId,
      })
      .returning("*")
      .execute();

    // return Post.update(
    //   { _id: id, creatorId: req.session.userId },
    //   { title, text }
    // );

    console.log(post.raw[0]);

    return post.raw[0] as any;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg("id", () => Int) id: number,
    @Ctx() { req }: MyContext
  ): Promise<boolean> {
    // not cascade
    // const post = await Post.findOne(id);

    // if (!post) {
    //   return false;
    // }

    // if (post.creatorId !== req.session.userId) {
    //   // user cant delete post bc they werent the one who created it
    //   throw new Error("not authorized");
    // }

    // // delete all upvotes related to this post
    // await Updoot.delete({ postId: id });
    // delete the actual post itself
    await Post.delete({ _id: id, creatorId: req.session.userId });

    return true;
  }
}
