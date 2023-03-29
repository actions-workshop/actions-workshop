import { Box, Button, Flash, FormControl, TextInput } from "@primer/react";
import { FunctionComponent, ReactElement, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AUTHENTICATION_ERROR } from "../api/errors/AuthenticationError";
import { SERVER_UNAVAILABLE_ERROR } from "../api/errors/ServerUnavailableError";
import { useUser } from "../auth/UserContextProvider";

const mapErrorMessage = (error: Error) => {
  switch (error.name) {
    case AUTHENTICATION_ERROR:
      return "Invalid username or password.";
    case SERVER_UNAVAILABLE_ERROR:
      return "Authentication server not available. Please try again later.";
    default:
      return "Unexpected Error. Please contact the administrator.";
  }
};

const Login: FunctionComponent = (): ReactElement => {
  const navigate = useNavigate();

  const { login } = useUser();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>();

  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    setError(undefined);
    await login({ userName: username, password })
      .then((): void => {
        navigate("/");
      })
      .catch((err: Error): void => {
        setError(mapErrorMessage(err));
      });
  };

  return (
    <Box display="grid" gridGap={3} width={300} m="auto">
      <form onSubmit={handleSubmit}>
        <FormControl>
          <FormControl.Label>Username</FormControl.Label>
          <TextInput
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </FormControl>
        <FormControl>
          <FormControl.Label>Password</FormControl.Label>
          <TextInput
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </FormControl>
        <Button>Sign in</Button>
        {error && <Flash variant="danger">{error}</Flash>}
      </form>
    </Box>
  );
};

export { Login };
