import { createServer } from 'http';
import { http_server as braidify } from 'braid-http';

const SECRETS = {
  "alice": "alice-secret",
  "bob": "bob-secret",
};

export class Server {
  server;
  actor;
  port;
  transactions = [];
  constructor(actor, port) {
    this.server = createServer((req, res) => {
        this.handleRequest(req, res);
    });
    this.actor = actor;
    this.port = port;
  }
  run() {
    this.server.listen(this.port);
  }
  addTransaction(transaction) {
    transaction.id = this.transactions.length;
    console.log('transaction added', transaction);
    this.transactions.push(transaction);
    return transaction.id;
  }
  getState() {
    let balance = 0;
    for (const transaction of this.transactions) {
      if (transaction.sender === this.actor) {
        balance -= transaction.amount;
      } else if (transaction.recipient === this.actor) {
        balance += transaction.amount;
      }
    }
    return { balance };
  }
  handleRequest(req, res) {
    console.log(req.url, req.method);
    braidify(req, res);
    if (req.method === 'POST') {
      let body = [];
      req
      .on('data', chunk => {
        body.push(chunk);
      })
      .on('end', () => {
        body = Buffer.concat(body).toString();
        const transaction = JSON.parse(body);
        console.log(JSON.stringify(req.headers));
        if (req.headers['authorization'] == 'Bearer ' + SECRETS[transaction.sender]) {
          const newTransactionId = this.addTransaction(transaction);
          res.setHeader('Location', `/transaction/${newTransactionId}`);
        }
        res.end();
      });
    } else if (req.method === 'GET' && req.url.startsWith('/transaction/')) {
      const transactionId = parseInt(req.url.split('/')[2]);
      if (transactionId < this.transactions.length) {
        res.end(JSON.stringify(this.transactions[transactionId]));
      } else {
        res.statusCode = 404;
        res.end();
      }
     } else if (req.method === 'GET' && req.url === '/') {
      res.end(JSON.stringify(this.getState()));
     }
  }
}