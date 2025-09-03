import { useOctocatApi } from "../OctocatApiProvider";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { OctocatState } from "../types/OctocatState";
import { useUser } from "../../auth/UserContextProvider";

const useFetchOctocats = (): UseQueryResult<OctocatState[], unknown> => {
  const { user, isLoggedIn } = useUser();
  const octocaptApi = useOctocatApi();

  const getOwnedOctocats = async () => {
    if (isLoggedIn) {
      return octocaptApi.fetchUserOctocats(user!.id);
    }
    return [];
  };

  const query = useQuery({
    queryKey: ["octocats", user?.id],
    queryFn: async () => {
      const [allCats, ownedCats] = await Promise.all([
        octocaptApi.fetchAllOctocats(),
        getOwnedOctocats(),
      ]);
      return allCats.map(
        (octocat): OctocatState => ({
          ...octocat,
          owned: ownedCats.some((ownedCat) => ownedCat.id === octocat.id),
        }),
      );
    },
  });

  return query;
};

export { useFetchOctocats };
