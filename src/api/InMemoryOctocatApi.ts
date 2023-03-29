import { Octocat } from "./types/Octocat";
import { OctocatApi, UserPassword } from "./OctocatApi";
import { AuthenticationError } from "./errors/AuthenticationError";

interface InMemoryOctocatApi extends OctocatApi {
  addOctocats: (givenCats: Octocat[]) => Promise<void>;
  addUser: ({ userName, password }: UserPassword) => Promise<void>;
}

const createInMemoryOctocatApi = (
  initialCats: Octocat[] = []
): InMemoryOctocatApi => {
  let allOctoCats = [...initialCats];
  let personalOctoCats: Record<string, Octocat[]> = {};
  const users: UserPassword[] = [
    {
      userName: "test",
      password: "test",
    },
  ];

  return {
    addOctocatToUser: ({ itemId, userId }) => {
      const foundCat = allOctoCats.find(({ id }) => id === itemId);

      if (!foundCat) {
        throw new Error("Cat not found!");
      }

      const existingUserCats = personalOctoCats[userId] ?? [];
      personalOctoCats = {
        ...personalOctoCats,
        [userId]: [...existingUserCats, foundCat],
      };

      return Promise.resolve(personalOctoCats[userId]);
    },
    removeOctocatFromUser: async ({ itemId, userId }) => {
      const existingUserCats = personalOctoCats[userId] ?? [];
      personalOctoCats[userId] = existingUserCats.filter(
        (cat) => cat.id !== itemId
      );
      return Promise.resolve(personalOctoCats[userId]);
    },
    addOctocats: async (givenCats: Octocat[]) => {
      allOctoCats = [...allOctoCats, ...givenCats];

      return;
    },
    fetchAllOctocats: () => Promise.resolve(allOctoCats),
    fetchUserOctocats: (userId: string) =>
      Promise.resolve(personalOctoCats[userId] ?? []),
    addUser: async ({ userName, password }) => {
      users.push({ userName, password });
      return;
    },
    loginUser: ({ userName, password }) => {
      const foundUserIndex = users.findIndex((user) => {
        return user.userName === userName && user.password === password;
      });

      if (foundUserIndex === -1) {
        throw new AuthenticationError("Invalid  authentication.");
      }

      return Promise.resolve({
        id: `id_${foundUserIndex}`,
        name: userName,
      });
    },
    logout: () => Promise.resolve(),
  };
};

export { createInMemoryOctocatApi };
