import { createServer } from 'http';
import { http_server as braidify } from 'braid-http';


const PORTS = {
  "alice": 9935,
  "bob": 9936,
};
export async function startServer(actor) {
  let balance = 0;
  function processTransaction(transaction) {
    if (transaction.sender === actor) {
      balance += transaction.amount;
    } else if (transaction.recipient === actor) {
      balance -= transaction.amount;
    }
  }
  const server = createServer((req, res) => {
    // Add braid stuff to req and res
    braidify(req, res);

    // Now use it
    if (req.subscribe) {
      res.startSubscription({ onClose: _ => null })
      // startSubscription automatically sets statusCode = 209
    } else {
      res.statusCode = 200
    }
    if (req.method === 'POST') {
      let body = [];
      req
      .on('data', chunk => {
        // console.log('chunk', chunk.toString());
        body.push(chunk);
      })
      .on('end', () => {
        body = Buffer.concat(body).toString();
        // at this point, `body` has the entire request body stored in it as a string
        const transaction = JSON.parse(body);
        console.log('received transaction', transaction);
        processTransaction(transaction);
        // Send the current version
        res.sendUpdate({
          version: [balance.toString()],
          body: JSON.stringify({ balance }),
          'Last-Transaction-Id': transaction.id,
          'Last-Transaction-Sender': transaction.sender,
          'Last-Transaction-Recipient': transaction.recipient,
          'Last-Transaction-Amount': transaction.amount.toString(),
          'Last-Transaction-Description': transaction.description,
        });
        console.log('update sent');
      });
    }
  });
  console.log(`Server for ${actor} started on port ${PORTS[actor]}`);
  server.listen(PORTS[actor]);
}

export async function sendTransaction(transaction) {
  const recipientPort = PORTS[transaction.recipient];
  if (!recipientPort) {
    throw new Error(`Recipient ${transaction.recipient} not found`);
  }
  const res = await fetch(`http://localhost:${recipientPort}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(transaction),
  });
  const body = await res.json();
  const headers = res.headers.entries();
  let header = headers.next();
  while (!header.done){
    console.log(header.value);
    header = headers.next();
  }
  console.log(`Transaction sent to ${transaction.recipient}, ${res.status} ${res.statusText}`, body);
}

export async function getBalance(actor) {
  const recipientPort = PORTS[actor];
  if (!recipientPort) {
    throw new Error(`Recipient ${actor} not found`);
  }
  const res = await fetch(`http://localhost:${recipientPort}/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return res.json();
}