import { useMutation, useQueryClient } from "react-query";
import { useOctocatApi } from "../OctocatApiProvider";
import { OctocatState } from "../types/OctocatState";
import { useUser } from "../../auth/UserContextProvider";

const useToggleOwnedCat = () => {
  const octocatApi = useOctocatApi();
  const { user } = useUser();
  const queryClient = useQueryClient();

  const mutation = useMutation(
    (octocat: OctocatState) => {
      const apiMethod = octocat.owned
        ? octocatApi.removeOctocatFromUser
        : octocatApi.addOctocatToUser;

      return apiMethod({ itemId: octocat.id, userId: user!.id });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("octocats");
      },
    }
  );

  return mutation;
};

export { useToggleOwnedCat };
