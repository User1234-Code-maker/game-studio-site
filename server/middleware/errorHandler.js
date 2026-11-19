import { HttpError } from "../lib/httpError.js";

export { HttpError };

export function notFound(_req, _res, next) {
  next(new HttpError(404, "not_found", "Not found"));
}

// Express recognises error handlers by their four arguments.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (res.headersSent) return;

  if (err.type === "entity.parse.failed") err = new HttpError(400, "invalid_json", "Invalid JSON body");
  else if (err.type === "entity.too.large") err = new HttpError(413, "body_too_large", "Request body is too large");

  // Stripe outage, bad key, network error: the client sees a clear "payment provider" problem.
  if (typeof err.type === "string" && err.type.startsWith("Stripe") && !(err instanceof HttpError)) {
    console.error(`[${req.id ?? "-"}] Stripe error: ${err.type} ${err.code ?? ""}`);
    err = new HttpError(502, "payment_provider_error", "The payment provider is unavailable. Please try again later.");
  }

  const status = Number.isInteger(err.status) && err.status >= 400 ? err.status : 500;
  // Our own HttpError texts are written for clients; anything else (a bug,
  // a library error) is logged here and replaced with a generic message.
  const safe = err instanceof HttpError;
  if (status >= 500 && !safe) console.error(`[${req.id ?? "-"}]`, err);

  res.status(status).json({
    error: status >= 500 && !safe ? "Something went wrong on our side." : err.message,
    code: status >= 500 && !safe ? "server_error" : err.code ?? "error",
    ...(safe && err.details ? { details: err.details } : {}),
  });
}
