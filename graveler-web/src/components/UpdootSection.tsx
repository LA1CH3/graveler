import { ChevronUpIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { Flex, IconButton, Box, Heading, Text } from "@chakra-ui/react";
import React, { useState } from "react";
import { PostSnippetFragment, useVoteMutation } from "../generated/graphql";

// pull from the PostsQuery/PostSnippetFragment as it will contain only the fields we are getting with the query
// otherwise, if we pull from the generated Post type from the server schema, that would contain ALL fields, even some that we may not be querying
interface UpdootSectionProps {
  post: PostSnippetFragment;
}

export const UpdootSection: React.FC<UpdootSectionProps> = ({ post }) => {
  const [loadingState, setLoadingState] = useState<
    "updoot-loading" | "downdoot-loading" | "not-loading"
  >("not-loading");
  const [, vote] = useVoteMutation();
  // console.log(operation?.variables?.value)

  return (
    <Flex direction="column" alignItems="center" justifyContent="center" mr={8}>
      <IconButton
        onClick={async () => {
          if (post.voteStatus === 1) {
            return;
          }
          setLoadingState("updoot-loading");
          await vote({
            value: 1,
            postId: post._id,
          });
          setLoadingState("not-loading");
        }}
        colorScheme={post.voteStatus === 1 ? "green" : undefined}
        isLoading={loadingState === "updoot-loading"}
        aria-label="upvote"
        icon={<ChevronUpIcon w={6} h={6} />}
      />
      <Box textAlign="center">{post.points}</Box>
      <IconButton
        onClick={async () => {
          if (post.voteStatus === -1) {
            return;
          }
          setLoadingState("downdoot-loading");
          await vote({
            value: -1,
            postId: post._id,
          });
          setLoadingState("not-loading");
        }}
        colorScheme={post.voteStatus === -1 ? "red" : undefined}
        isLoading={loadingState === "downdoot-loading"}
        aria-label="downvote"
        icon={<ChevronDownIcon w={6} h={6} />}
      />
    </Flex>
  );
};
