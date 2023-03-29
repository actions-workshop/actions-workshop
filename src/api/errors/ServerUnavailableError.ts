const SERVER_UNAVAILABLE_ERROR = "ServerUnavailableError";
class ServerUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = SERVER_UNAVAILABLE_ERROR;
  }
}

export { ServerUnavailableError, SERVER_UNAVAILABLE_ERROR };
