import { OctocatApi } from "./OctocatApi";
import { FunctionComponent, PropsWithChildren, ReactElement } from "react";
import React, { useContext } from "react";

const ApiContext = React.createContext<OctocatApi | undefined>(undefined);

interface ApiProviderProps extends PropsWithChildren {
  octocatApi: OctocatApi;
}

const OctocatApiProvider: FunctionComponent<ApiProviderProps> = ({
  octocatApi,
  children,
}): ReactElement => (
  <ApiContext.Provider value={octocatApi}>{children}</ApiContext.Provider>
);

const useOctocatApi = (): OctocatApi => {
  const octocatApi = useContext(ApiContext);

  if (!octocatApi) {
    throw new Error(
      'No OctocatApiProvider - Wrap your App with the <OctoatCollectionApiProvider> before using the "useOctocapApi"-hook.'
    );
  }

  return octocatApi;
};

export { OctocatApiProvider, useOctocatApi };
