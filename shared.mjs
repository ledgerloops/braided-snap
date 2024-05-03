import { createServer } from 'http';
import { http_server as braidify} from 'braid-http';


const PORTS = {
    "alice": 9935,
    "bob": 9936,
};
export async function startServer(actor) {
  const server = createServer((req, res) => {
    // Add braid stuff to req and res
    braidify(req, res);
    
    // Now use it
    if (req.subscribe) {

      res.startSubscription({ onClose: _=> null })
      // startSubscription automatically sets statusCode = 209
    } else {
      res.statusCode = 200
    }
  
    // Send the current version
    res.sendUpdate({
      version: ['greg'],
      body: JSON.stringify({greg: 'greg'})
    });
    console.log('update sent');
  });
  server.listen(PORTS[actor]);
  console.log(`Server for ${actor} started on port ${PORTS[actor]}`);
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
  console.log(`Transaction sent to ${transaction.recipient}, ${res.status} ${res.statusText}`);
}