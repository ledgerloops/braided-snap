import { Server } from './server.mjs';

async function run() {
  const server = new Server("bob", 9936);
  server.run();
}
// ...
run();