import { Box, Button, Flex, Heading, Link } from "@chakra-ui/react";
import NextLink from "next/link";
import React from "react";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";
import { useRouter } from "next/router";

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
  const [{ fetching: logoutFetching }, logout] = useLogoutMutation();
  const [{ data, fetching }] = useMeQuery();
  const router = useRouter();

  let body = null;

  // data loading
  if (fetching) {
    // user not logged in
  } else if (!data?.me) {
    body = (
      <>
        <NextLink href="/login">
          <Link mr={2} color="white">
            login
          </Link>
        </NextLink>
        <NextLink href="/register">
          <Link color="white">register</Link>
        </NextLink>
      </>
    );
    // user logged in
  } else {
    body = (
      <Flex alignItems="center">
        <NextLink href="/create-post">
          <Button mr={8} as={Link}>
            create post
          </Button>
        </NextLink>
        <Box mr={3}>{data.me.username}</Box>
        <Button
          isLoading={logoutFetching}
          variant="link"
          onClick={async () => {
            await logout();
            router.reload();
          }}
        >
          logout
        </Button>
      </Flex>
    );
  }

  return (
    <Flex
      position="sticky"
      alignItems="center"
      top="0"
      zIndex={1}
      bg="teal"
      p={4}
    >
      <Flex mx="auto" flex="1" maxW={800}>
        <NextLink href="/">
          <Link>
            <Heading>graveler</Heading>
          </Link>
        </NextLink>
        <Box ml="auto">{body}</Box>
      </Flex>
    </Flex>
  );
};
