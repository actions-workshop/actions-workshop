import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOctocatApi } from "../OctocatApiProvider";
import { OctocatState } from "../types/OctocatState";
import { useUser } from "../../auth/UserContextProvider";

const useToggleOwnedCat = () => {
  const octocatApi = useOctocatApi();
  const { user } = useUser();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (octocat: OctocatState) => {
      const apiMethod = octocat.owned
        ? octocatApi.removeOctocatFromUser
        : octocatApi.addOctocatToUser;

      return apiMethod({ itemId: octocat.id, userId: user!.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["octocats"] });
    },
  });

  return mutation;
};

export { useToggleOwnedCat };
