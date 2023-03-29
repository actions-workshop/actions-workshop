import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { BaseStyles, ThemeProvider } from "@primer/react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./layout/Layout";
import { createInMemoryOctocatApi } from "./api/InMemoryOctocatApi";
import { createFetchOctocatApi } from "./api/FetchOctocatApi";
import { OctocatApiProvider } from "./api/OctocatApiProvider";
import { UserContextProvider } from "./auth/UserContextProvider";
import { MockOctocats } from "./api/types/MockOctocats";
import { QueryClient, QueryClientProvider } from "react-query";

const MODE = import.meta.env.MODE;
const API_URL = import.meta.env.API_URL ?? "https://octocatapi.com";

const queryClient = new QueryClient();

function App() {
  const octocatApi =
    MODE !== "production"
      ? createInMemoryOctocatApi(MockOctocats)
      : createFetchOctocatApi(API_URL);

  return (
    <BrowserRouter>
      <OctocatApiProvider octocatApi={octocatApi}>
        <QueryClientProvider client={queryClient}>
          <UserContextProvider>
            <ThemeProvider>
              <BaseStyles>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                  </Routes>
                </Layout>
              </BaseStyles>
            </ThemeProvider>
          </UserContextProvider>
        </QueryClientProvider>
      </OctocatApiProvider>
    </BrowserRouter>
  );
}

export { App };
