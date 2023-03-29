const AUTHENTICATION_ERROR = "AuthenticationError";
class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = AUTHENTICATION_ERROR;
  }
}

export { AuthenticationError, AUTHENTICATION_ERROR };
