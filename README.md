# braided-snap
An implementation of [SNAP](https://michielbdejong.com/blog/20.html) using [Braid](https://braid.org)

Alice and Bob both run a server.
The each have a copy of the ledger, which is structured as two lists of transactions.
When a server receives a new transaction from the local client, it validates it and posts it to the other server.

A ledger version is defined as two numbers with a `:` in between, the first number is the number of transactions from Alice,
the second number is the number of transactions from Bob.

Transaction id's are formed by the sender name, followed by a `-`, followed by the number of previous transactions from this sender.
So for instance if Alice sends 5 USD to Bob, the transaction id is `alice-0` and the ledger version goes from `0:0` to `1:0`.

The bearer token used from Alice's client to Alice's server, as well as from Alice's server to Bob's server, is `alice-secret`.
The bearer token used from Bob's client to Bob's server, as well as from Bob's server to Alice's server, is `bob-secret`.
Alice's server runs on port 9935 and Bob's server runs on port 9936. You can use this information to do curl requests once the demo is running.

In one window:
```
node alice.mjs
```

In another window:
```
node bob.mjs
```

In a third window:
```
curl -H 'Authorization: Bearer alice-secret' http://localhost:9935/
curl -H 'Authorization: Bearer bob-secret' http://localhost:9936/
curl -H 'Authorization: Bearer bob-secret' http://localhost:9936/transaction/alice-0
```
