import { createInMemoryOctocatApi } from "../api/InMemoryOctocatApi";
import { createTestOctocat } from "../api/OctocatMockFactory";
import { Home } from "./Home";
import { renderWithProviders } from "../../test/renderWithProviders";
import { User } from "../api/types/User";
import { useUser } from "../auth/UserContextProvider";
import userEvent from "@testing-library/user-event";
import { cleanup, screen } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { Route, Routes } from "react-router-dom";

describe("<Home />", (): void => {
  afterEach((): void => {
    cleanup();
  });

  it("renders the octocats returned from the API.", async (): Promise<void> => {
    const inMemoryAPI = createInMemoryOctocatApi();
    inMemoryAPI.addOctocats([
      createTestOctocat({ id: "#1", name: "Octocat 1" }),
      createTestOctocat({ id: "#2", name: "Octocat 2" }),
    ]);

    renderWithProviders({ component: <Home />, inMemoryApi: inMemoryAPI });

    expect(await screen.findByText("Octocat 1")).toBeDefined();
    expect(screen.getByText("Octocat 2")).toBeDefined();
  });

  it("renders an 'Add to collection' Button for each octocat when not logged in.", async (): Promise<void> => {
    const inMemoryAPI = createInMemoryOctocatApi();
    inMemoryAPI.addOctocats([
      createTestOctocat({ id: "#1", name: "Octocat 1" }),
    ]);

    renderWithProviders({ component: <Home />, inMemoryApi: inMemoryAPI });

    await screen.findByLabelText("Add Octocat 1 to your collection");
  });

  it("redirects user to login page if Octocat is added while logged out.", async (): Promise<void> => {
    const inMemoryAPI = createInMemoryOctocatApi();
    inMemoryAPI.addOctocats([
      createTestOctocat({ id: "#1", name: "Octocat 1" }),
    ]);

    const MockLoginPage = () => <p data-testid="loginpage">Loginpage</p>;

    renderWithProviders({
      component: (
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<MockLoginPage />} />
        </Routes>
      ),
      inMemoryApi: inMemoryAPI,
    });

    const addButton = await screen.findByLabelText(
      "Add Octocat 1 to your collection"
    );

    await userEvent.click(addButton);

    expect(await screen.findByTestId("loginpage")).toBeDefined();
  });

  it("renders a 'Remove form collection' button if octocat belongs to user.", async (): Promise<void> => {
    const user: User = { id: "id1", name: "testuser" };
    const inMemoryAPI = createInMemoryOctocatApi();
    inMemoryAPI.addOctocats([
      createTestOctocat({ id: "#1", name: "Octocat 1" }),
    ]);
    await inMemoryAPI.addOctocatToUser({ itemId: "#1", userId: "id1" });

    renderWithProviders({
      component: <Home />,
      inMemoryApi: inMemoryAPI,
      initialUser: user,
    });

    expect(
      await screen.findByLabelText("Remove Octocat 1 from your collection")
    ).toBeDefined();
  });

  it("adds given cat to user if clicked on add button.", async (): Promise<void> => {
    const user: User = { id: "id1", name: "testuser" };
    const inMemoryAPI = createInMemoryOctocatApi();
    inMemoryAPI.addOctocats([
      createTestOctocat({ id: "#1", name: "Octocat 1" }),
    ]);

    renderWithProviders({
      component: <Home />,
      inMemoryApi: inMemoryAPI,
      initialUser: user,
    });

    const addButton = await screen.findByLabelText(
      "Add Octocat 1 to your collection"
    );

    await userEvent.click(addButton);

    expect(
      await screen.findByLabelText("Remove Octocat 1 from your collection")
    ).toBeDefined();
  });

  it("removes Octocat from users collection if clicked on remove button", async (): Promise<void> => {
    const user: User = { id: "id1", name: "testuser" };
    const inMemoryAPI = createInMemoryOctocatApi();
    inMemoryAPI.addOctocats([
      createTestOctocat({ id: "#1", name: "Octocat 1" }),
    ]);
    await inMemoryAPI.addOctocatToUser({ itemId: "#1", userId: "id1" });

    renderWithProviders({
      component: <Home />,
      inMemoryApi: inMemoryAPI,
      initialUser: user,
    });

    const removeButton = await screen.findByLabelText(
      "Remove Octocat 1 from your collection"
    );
    await userEvent.click(removeButton);

    expect(
      await screen.findByLabelText("Add Octocat 1 to your collection")
    ).toBeDefined();
  });

  it("removes mark of all owned cats if user logs out.", async (): Promise<void> => {
    const user: User = { id: "id1", name: "testuser" };
    const inMemoryAPI = createInMemoryOctocatApi();
    inMemoryAPI.addOctocats([
      createTestOctocat({ id: "#1", name: "Octocat 1" }),
    ]);
    await inMemoryAPI.addOctocatToUser({ itemId: "#1", userId: "id1" });

    const LogoutButton = () => {
      const { logout } = useUser();
      return (
        <button data-testid="logoutbutton" onClick={() => logout()}>
          Logout
        </button>
      );
    };

    renderWithProviders({
      component: (
        <>
          <Home />
          <LogoutButton />
        </>
      ),
      inMemoryApi: inMemoryAPI,
      initialUser: user,
    });

    await screen.findByLabelText("Remove Octocat 1 from your collection");

    await userEvent.click(screen.getByTestId("logoutbutton"));

    expect(
      await screen.findByLabelText("Add Octocat 1 to your collection")
    ).toBeDefined();
  });
});
