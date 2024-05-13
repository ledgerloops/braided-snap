async function sendTransaction(transaction, senderSecret, recipientPort) {
  const res = await fetch(`http://localhost:${recipientPort}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + senderSecret,
    },
    body: JSON.stringify(transaction),
  });
  console.log(`Transaction sent to ${transaction.recipient}, ${res.status} ${res.statusText}`);
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
  await sendTransaction({
    "sender": "alice",
    "recipient": "bob",
    "amount": 5,
    "description": "payment for your invoice #5398753"
  }, 'alice-secret', 9936);
  await getBalance('alice-secret', 9936);
}
// ...
run();