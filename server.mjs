import { createServer } from 'http';
import { http_server as braidify, fetch } from 'braid-http';

const SECRETS = {
  "alice": "alice-secret",
  "bob": "bob-secret",
};

export class Server {
  server;
  actor;
  peer;
  port;
  peerPort;
  overdraftLimit;
  transactionsIn = [];
  transactionsOut = [];
  listeners = [];
  constructor(actor, peer, port, peerPort, overdraftLimit) {
    this.server = createServer((req, res) => {
        this.handleRequest(req, res);
    });
    this.actor = actor;
    this.peer = peer;
    this.port = port;
    this.peerPort = peerPort;
    this.overdraftLimit = overdraftLimit;
    console.log('server created', { actor, peer, port, peerPort, overdraftLimit });
  }
  run() {
    this.server.listen(this.port);
    console.log('server listening on port', this.port);
  }
  checkOverdraft(transaction) {
    let balance = 0;
    for (const transaction of this.transactionsOut) {
      balance -= transaction.amount;
    }
    for (const transaction of this.transactionsIn) {
      balance += transaction.amount;
    }
    console.log(`Overdraft limit check, balance ${balance}, transaction amount ${transaction.amount}, overdraft limit ${this.overdraftLimit}`);
    if (balance + transaction.amount > this.overdraftLimit) {
      throw new Error('Overdraft limit exceeded');
    }
  }
  addTransaction(transaction) {
    console.log('transaction added', transaction);
    if (this.actor === transaction.sender) {
      this.checkOverdraft(transaction);
      transaction.id = `${this.actor}-${this.transactionsOut.length}`;
      this.transactionsOut.push(transaction);
    } else if (this.peer === transaction.sender) {
      this.checkOverdraft(transaction);
      transaction.id = `${this.peer}-${this.transactionsIn.length}`;
      this.transactionsIn.push(transaction);
    } else {
      throw new Error(`Invalid transaction, unknown sender ${transaction.sender}`);
    }
    this.listeners.forEach(res => {
      res.sendUpdate({
        version: [ this.getVersion() ],
        body: JSON.stringify(this.getState(), null, 2) + '\n' + '\n'
      });
    });
    return transaction.id;
  }
  getState() {
    let balance = 0;
    for (const transaction of this.transactionsOut) {
      balance -= transaction.amount;
    }
    for (const transaction of this.transactionsIn) {
      balance += transaction.amount;
    }
    return { 
      balance: {
        [this.actor]: balance,
        [this.peer]: -balance
      },
      transactions: {
        [this.actor]: this.transactionsOut,
        [this.peer]: this.transactionsIn
      }
    };
  }
  getVersion() {
    if (this.actor < this.peer) {
      return `${this.transactionsOut.length}:${this.transactionsIn.length }`;
    } else {
      return `${this.transactionsIn.length }:${this.transactionsOut.length}`;
    
    }
  }
  async sendTransaction(transaction) {
    const res = await fetch(`http://localhost:${this.peerPort}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + SECRETS[transaction.sender],
      },
      body: JSON.stringify(transaction, null, 2) + '\n',
    });
    console.log(`Transaction to ${transaction.recipient} sent to remote server, ${res.status} ${res.statusText}`);
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
          let newTransactionId;
          try {
            newTransactionId = this.addTransaction(transaction);
          } catch (e) {
            res.statusCode = 400;
            res.end(e.message);
            return;
          }
          res.setHeader('Location', `/transaction/${newTransactionId}`);
          if (transaction.sender === this.actor) {
            this.sendTransaction(transaction);
          }
        }
        res.end();
      });
    } else if (req.method === 'GET' && req.url.startsWith('/transaction/')) {
      const transactionId = req.url.split('/')[2];
      console.log('looking up transaction', transactionId);
      const parts = transactionId.split('-');
      if (parts[0] === this.actor) {
        res.end(JSON.stringify(this.transactionsOut[parts[1]], null, 2) + '\n');
      } else if (parts[0] === this.peer) {
        res.end(JSON.stringify(this.transactionsIn[parts[1]], null, 2) + '\n');
      } else {
        res.statusCode = 404;
        res.end();
      }
     } else if (req.method === 'GET' && req.url === '/') {
      if (req.subscribe) {
        res.startSubscription({ onClose: _=> null });
        this.listeners.push(res);
      } else {
        res.statusCode = 200
      }
      // Send the current version
      res.sendUpdate({
          version: [ this.getVersion() ],
          body: JSON.stringify(this.getState(), null, 2) + '\n'
      });
    }
  }
}