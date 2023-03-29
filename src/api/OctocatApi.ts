import { Octocat } from "./types/Octocat";
import { User } from "./types/User";

type UserPassword = {
  userName: string;
  password: string;
};

interface OctocatApi {
  // Returns the updated octocat collection of the user
  addOctocatToUser: ({
    itemId,
    userId,
  }: {
    itemId: string;
    userId: string;
  }) => Promise<Octocat[]>;
  removeOctocatFromUser: ({
    itemId,
    userId,
  }: {
    itemId: string;
    userId: string;
  }) => Promise<Octocat[]>;
  fetchAllOctocats: () => Promise<Octocat[]>;
  fetchUserOctocats: (userId: string) => Promise<Octocat[]>;
  loginUser: ({ userName, password }: UserPassword) => Promise<User>;
  logout: () => Promise<void>;
}

export type { OctocatApi, UserPassword };
