import { MemoryRouter } from "react-router-dom";
import { OctocatApi } from "../src/api/OctocatApi";
import { OctocatApiProvider } from "../src/api/OctocatApiProvider";
import { render } from "@testing-library/react";
import { User } from "../src/api/types/User";
import { UserContextProvider } from "../src/auth/UserContextProvider";
import { QueryClient, QueryClientProvider } from "react-query";

const renderWithProviders = ({
  component,
  inMemoryApi,
  initialUser,
  initialRoute = "/",
}: {
  component: React.ReactNode;
  inMemoryApi: OctocatApi;
  initialUser?: User;
  initialRoute?: string;
}): void => {
  const testQueryClient = new QueryClient({
    defaultOptions: {
      mutations: {
        retry: 0,
      },
      queries: {
        retry: 0,
      },
    },
  });
  render(
    <QueryClientProvider client={testQueryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <OctocatApiProvider octocatApi={inMemoryApi}>
          <UserContextProvider initialUser={initialUser}>
            {component}
          </UserContextProvider>
        </OctocatApiProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

export { renderWithProviders };
