import { AuthenticationError } from "./errors/AuthenticationError";
import { ServerUnavailableError } from "./errors/ServerUnavailableError";
import { OctocatApi } from "./OctocatApi";
import { Octocat } from "./types/Octocat";
import { User } from "./types/User";

const checkErrors = (response: Response) => {
  if (!response.ok) {
    throw new Error(
      `Call to "${response.url}" returned "${response.status} - ${response.statusText}"`
    );
  }
  return response;
};

const parseResponse = async (response: Response) => response.json();

const createFetchOctocatApi = (endpoint: string): OctocatApi => {
  return {
    addOctocatToUser: async ({ itemId, userId }): Promise<Octocat[]> => {
      return fetch(`${endpoint}/user/${userId}/octocats`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          itemId,
        }),
      })
        .then(checkErrors)
        .then(parseResponse);
    },
    removeOctocatFromUser: async ({ itemId, userId }): Promise<Octocat[]> => {
      return fetch(`${endpoint}/user/${userId}/octocats`, {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          itemId,
        }),
      })
        .then(checkErrors)
        .then(parseResponse);
    },
    fetchAllOctocats: async (): Promise<Octocat[]> => {
      return fetch(`${endpoint}/octocats`, {
        method: "GET",
        headers: {
          "content-type": "application/json",
        },
      })
        .then(checkErrors)
        .then((res) => res.json());
    },
    fetchUserOctocats: async (userId: string): Promise<Octocat[]> => {
      return fetch(`${endpoint}/user/${userId}/octocats`, {
        method: "GET",
        headers: {
          "content-type": "application/json",
        },
      })
        .then(checkErrors)
        .then(parseResponse);
    },
    loginUser: async ({ userName, password }): Promise<User> => {
      return fetch(`${endpoint}/login`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          userName,
          password,
        }),
      })
        .then((response) => {
          if (!response.ok) {
            console.error(
              `Received Error from Backend with status ${response.status} and body ${response.statusText}`
            );
            if (response.status >= 500) {
              throw new ServerUnavailableError("Server Unavailable.");
            }

            throw new AuthenticationError("Login Failed.");
          }
          return response;
        })
        .then(parseResponse);
    },
    logout: async (): Promise<void> => {
      return fetch(`${endpoint}/logout`, {
        method: "POST",
      })
        .then(checkErrors)
        .then(() => undefined);
    },
  };
};

export { createFetchOctocatApi };
