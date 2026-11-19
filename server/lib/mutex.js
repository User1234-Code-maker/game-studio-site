// Runs async tasks that share a key one after another.
// Used to make "check, then write" sequences on the same file atomic.
const tails = new Map();

export function withLock(key, task) {
  const previous = tails.get(key) ?? Promise.resolve();
  const run = previous.then(task, task);
  const tail = run.catch(() => {});
  tails.set(key, tail);
  // Forget the key once nothing is waiting, so the map cannot grow forever.
  tail.then(() => {
    if (tails.get(key) === tail) tails.delete(key);
  });
  return run;
}
