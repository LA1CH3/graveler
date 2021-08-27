import { EditIcon, DeleteIcon } from "@chakra-ui/icons";
import { Box, IconButton, Link } from "@chakra-ui/react";
import React from "react";
import NextLink from "next/link";
import { useDeletePostMutation, useMeQuery } from "../generated/graphql";

interface EditDeletePostButtonsProps {
  id: number;
  creatorId: number;
}

export const EditDeletePostButtons: React.FC<EditDeletePostButtonsProps> = ({
  id,
  creatorId,
}) => {
  const [{ data }] = useMeQuery();

  const [, deletePost] = useDeletePostMutation();

  if (data?.me?._id !== creatorId) {
    return null;
  }

  return (
    <Box>
      <NextLink href="/post/edit/[id]" as={`/post/edit/${id}`}>
        <IconButton
          as={Link}
          mr={3}
          icon={<EditIcon w={6} h={6} />}
          aria-label="Edit Post"
        ></IconButton>
      </NextLink>
      <IconButton
        onClick={() => {
          deletePost({ id });
        }}
        icon={<DeleteIcon w={6} h={6} />}
        aria-label="Delete Post"
      ></IconButton>
    </Box>
  );
};
