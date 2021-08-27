import { usePostQuery } from "../generated/graphql";
import { useGetIntId } from "./useGetIntId";

export const useGetPostFromUrl = () => {
  const intId = useGetIntId();

  return usePostQuery({
    // if intId is -1, it means we have a bad query param (we would never have a post with id of -1) so enable pause: true so we prevent making the network call
    pause: intId === -1,
    variables: {
      id: intId,
    },
  });
};
