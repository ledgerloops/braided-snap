import { startServer } from './shared.mjs';

async function run() {
  const serverPromise = startServer("bob");
  return serverPromise;
}
// ...
run();