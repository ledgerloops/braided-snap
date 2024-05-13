import { Server } from './server.mjs';
import { fetch } from 'braid-http';

async function sendTransaction(transaction, senderSecret, recipientPort) {
  const res = await fetch(`http://localhost:${recipientPort}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + senderSecret,
    },
    body: JSON.stringify(transaction),
  });
  console.log(`Transaction to ${transaction.recipient} sent to local server, ${res.status} ${res.statusText}`);
}

async function getBalance(senderSecret, recipientPort) {
  const res = await fetch(`http://localhost:${recipientPort}/`, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + senderSecret,
    },
  });
  console.log(await res.json());
}
async function run() {
  const server = new Server('alice', 'bob', 9935, 9936, 10);
  server.run();
  await sendTransaction({
    "sender": "alice",
    "recipient": "bob",
    "amount": 5,
    "description": "payment for your invoice #5398753"
  }, 'alice-secret', 9935);
}
// ...
run();