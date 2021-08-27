import { Link } from "@chakra-ui/layout";
import { Box, Button, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { withUrqlClient } from "next-urql";
import NextLink from "next/link";
import React, { useState } from "react";
import { EditDeletePostButtons } from "../components/EditDeletePostButtons";
import { Layout } from "../components/Layout";
import { UpdootSection } from "../components/UpdootSection";
import { useMeQuery, usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";

const Index = () => {
  const [variables, setVariables] = useState({
    limit: 15,
    cursor: null as string | null,
  });

  const [{ data: meData }] = useMeQuery();

  const [{ data, error, fetching }] = usePostsQuery({
    variables,
  });

  if (!fetching && !data) {
    return (
      <>
        <div>posts query failed</div>
        <div>{error?.message}</div>
      </>
    );
  }

  return (
    <Layout>
      {!data && fetching && <div>loading...</div>}
      {data && (
        <>
          <Stack spacing={8}>
            {data.posts.posts.map((p) =>
              !p ? null : (
                <Flex key={p._id} p={5} shadow="md" borderWidth="1px">
                  <UpdootSection post={p} />
                  <Box width="100%">
                    <NextLink href="/post/[id]" as={"/post/" + p._id}>
                      <Link>
                        <Heading fontSize="xl">{p.title}</Heading>
                      </Link>
                    </NextLink>
                    <Text>posted by {p.creator.username}</Text>
                    <Flex mt={4} alignItems="center">
                      <Text>{p.textSnippet}</Text>
                      <Box ml="auto">
                        <EditDeletePostButtons
                          id={p._id}
                          creatorId={p.creator._id}
                        />
                      </Box>
                    </Flex>
                  </Box>
                </Flex>
              )
            )}
          </Stack>
          {data.posts.hasMore && (
            <Flex justify="center">
              <Button
                isLoading={fetching}
                my={8}
                onClick={() =>
                  setVariables({
                    limit: variables.limit,
                    cursor:
                      data.posts.posts[data.posts.posts.length - 1][
                        "createdAt"
                      ],
                  })
                }
              >
                Load more
              </Button>
            </Flex>
          )}
        </>
      )}
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
