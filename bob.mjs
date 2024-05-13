import { Server } from './server.mjs';

async function run() {
  const server = new Server('bob', 'alice', 9936, 9935, 10);
  server.run();
}
// ...
run();