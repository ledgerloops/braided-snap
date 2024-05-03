import { startServer, sendTransaction } from './shared.mjs';

async function run() {
  const serverPromise = startServer("alice");
  sendTransaction({
    "sender": "bob",
    "recipient": "bob",
    "amount": 5,
    "description": "payment for your invoice #5398753"
  });
  return serverPromise;
}
// ...
run();