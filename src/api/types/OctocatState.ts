import { Octocat } from "./Octocat";

type OctocatState = Octocat & {
  owned: boolean;
};

export type { OctocatState };
