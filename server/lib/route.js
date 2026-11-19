// Express 5 already forwards rejected promises, but keeping one tiny wrapper
// makes the intent explicit and works the same in older versions.
export const route = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
