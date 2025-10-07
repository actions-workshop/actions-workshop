import { createInMemoryOctocatApi } from "../api/InMemoryOctocatApi";
import { Login } from "./Login";
import { renderWithProviders } from "../../test/renderWithProviders";
import { screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, describe, it } from "vitest";
import { Route, Routes } from "react-router-dom";
import { OctocatApi } from "../api/OctocatApi";
import { ServerUnavailableError } from "../api/errors/ServerUnavailableError";

describe("<Login />", (): void => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach((): void => {
    user = userEvent.setup();
  });

  afterEach((): void => {
    cleanup();
  });

  it("renders the login form.", (): void => {
    const inMemoryApi = createInMemoryOctocatApi();
    renderWithProviders({ component: <Login />, inMemoryApi });

    expect(screen.getByLabelText("Username")).toBeDefined();
    expect(screen.getByLabelText("Password")).toBeDefined();
  });

  it("redirects to '/' after a sucessful login.", async (): Promise<void> => {
    const inMemoryApi = createInMemoryOctocatApi();
    await inMemoryApi.addUser({
      userName: "testUser",
      password: "testPassword",
    });

    const MockHomePage = () => <p data-testid="homepage">Home Page</p>;

    renderWithProviders({
      component: (
        <Routes>
          <Route path="/" element={<MockHomePage />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      ),
      inMemoryApi,
      initialRoute: "/login",
    });

    await user.type(screen.getByLabelText("Username"), "testUser");
    await user.type(screen.getByLabelText("Password"), "testPassword");
    await user.click(screen.getByText("Sign in"));

    expect(await screen.findByTestId("homepage")).toBeDefined();
  });

  it("shows error message if username / password is wrong.", async (): Promise<void> => {
    const inMemoryApi = createInMemoryOctocatApi();
    await inMemoryApi.addUser({
      userName: "testuser",
      password: "testpassword",
    });

    renderWithProviders({ component: <Login />, inMemoryApi });

    await user.type(screen.getByLabelText("Username"), "testuser");
    await user.type(screen.getByLabelText("Password"), "wrongpassword");
    await user.click(screen.getByText("Sign in"));

    expect(
      await screen.findByText("Invalid username or password."),
    ).toBeDefined();
  });

  it("shows server error if auth server is not reachable.", async (): Promise<void> => {
    const inMemoryApi: OctocatApi = {
      ...createInMemoryOctocatApi(),
      loginUser() {
        throw new ServerUnavailableError("Test Error");
      },
    };

    renderWithProviders({ component: <Login />, inMemoryApi });

    await user.type(screen.getByLabelText("Username"), "testuser");
    await user.type(screen.getByLabelText("Password"), "wrongpassword");
    await user.click(screen.getByText("Sign in"));

    expect(
      await screen.findByText(
        "Authentication server not available. Please try again later.",
      ),
    ).toBeDefined();
  });

  it("shows general error if api returns unknown error.", async (): Promise<void> => {
    const inMemoryApi: OctocatApi = {
      ...createInMemoryOctocatApi(),
      loginUser() {
        throw new Error("Unknown Error");
      },
    };

    renderWithProviders({ component: <Login />, inMemoryApi });

    await user.type(screen.getByLabelText("Username"), "testuser");
    await user.type(screen.getByLabelText("Password"), "wrongpassword");
    await user.click(screen.getByText("Sign in"));

    expect(
      await screen.findByText(
        "Unexpected Error. Please contact the administrator.",
      ),
    ).toBeDefined();
  });
});
