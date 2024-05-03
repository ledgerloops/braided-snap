import { startServer, sendTransaction, getBalance } from './shared.mjs';

async function run() {
  // const serverPromise = startServer("alice");
  await sendTransaction({
    "sender": "alice",
    "recipient": "bob",
    "amount": 5,
    "description": "payment for your invoice #5398753"
  });
  const balance = await getBalance('bob');
  console.log(balance);
  // return serverPromise;
}
// ...
run();