import { Octocat } from "./types/Octocat";

const defaultOctocat: Octocat = {
  id: "#1",
  imageUrl: "https://octodex/",
  name: "Octocat#1",
};

const createTestOctocat = (overwrites: Partial<Octocat> = {}): Octocat => ({
  ...defaultOctocat,
  ...overwrites,
});

export { createTestOctocat };
