import React, { PropsWithChildren, useContext, useState } from "react";
import { FunctionComponent, ReactElement } from "react";
import { useOctocatApi } from "../api/OctocatApiProvider";
import { User } from "../api/types/User";

type LoginFunc = ({
  userName,
  password,
}: {
  userName: string;
  password: string;
}) => Promise<void>;
type UserContextValue = {
  login: LoginFunc;
  logout: () => Promise<void>;
  user?: User;
};

const UserContext = React.createContext<UserContextValue | undefined>(
  undefined
);

interface UserContextProviderProps extends PropsWithChildren {
  initialUser?: User;
}

const UserContextProvider: FunctionComponent<UserContextProviderProps> = ({
  children,
  initialUser,
}): ReactElement => {
  const octocatApi = useOctocatApi();
  const [user, setUser] = useState<User | undefined>(initialUser);

  const login: LoginFunc = async ({ userName, password }) => {
    return octocatApi
      .loginUser({ userName, password })
      .then((user) => setUser(user));
  };

  const logout = async () => {
    await octocatApi.logout();
    setUser(undefined);
    // queryClient.invalidateQueries("octocats");
  };

  return (
    <UserContext.Provider
      value={{
        login,
        logout,
        user,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

type UserState = {
  isLoggedIn: boolean;
  user?: User;
  login: LoginFunc;
  logout: () => Promise<void>;
};

const useUser = (): UserState => {
  const userContext = useContext(UserContext);

  if (!userContext) {
    throw new Error(
      'No UserContextProvider - Wrap your App with the <UserContextProvider> before using the "useUser"-hook.'
    );
  }

  return {
    isLoggedIn: Boolean(userContext.user),
    user: userContext.user,
    login: userContext.login,
    logout: userContext.logout,
  };
};

export { UserContextProvider, useUser };
