/**
 * An error that is safe to show to the client.
 * `code` is a stable machine-readable identifier (the front end translates it);
 * `message` is a plain English fallback for API consumers.
 */
export class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
