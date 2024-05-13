# braided-snap
An implementation of [SNAP](https://michielbdejong.com/blog/20.html) using [Braid](https://braid.org)

Alice and Bob both run a server.
The each have a copy of the ledger, which is structured as two lists of transactions.
When a server receives a new transaction from the local client, it validates it and posts it to the other server.

A transaction id is defined as `actor` plus `'-'` plus an incremental number starting at `0`.
So the first transaction from Alice has id `alice-1`.

A ledger state is defined by an alphabetical list of number of transactions from each actor, separated by `:`.

So for instance if Alice sends 5 USD to Bob, the transaction id is `alice-0` and the ledger version goes from `0:0` to `1:0`.

The bearer token used from Alice's client to Alice's server, as well as from Alice's server to Bob's server, is `alice-secret`.
The bearer token used from Bob's client to Bob's server, as well as from Bob's server to Alice's server, is `bob-secret`.
Alice's server runs on port 9935 and Bob's server runs on port 9936. You can use this information to do curl requests once the demo is running.

In one window:
```
node bob.mjs
```

In another window:
```
curl -H 'Authorization: Bearer bob-secret' -H 'Subscribe: true' http://localhost:9936/
```

In a third window:
```
node alice.mjs
```

In a fourth window:
```
curl -H 'Authorization: Bearer alice-secret' http://localhost:9935/
curl -H 'Authorization: Bearer bob-secret' http://localhost:9936/transaction/alice-0
```


While implementing this I ran through a lot of interesting questions.
In the end the key to the solution I chose is to:
* have a four-corner architecture (Alice client -> Alice server -> Bob server -> Bob client)
* servers don't subscribe to each other; they don't need to, because they immediately post every transaction to each other. but a client can subscribe to a server.
* only have two accounts, and two bearer tokens that give authority to send money from each of them
* simple overdraft check both on the sending server and the receiving server
* simple in-memory data storage (no way to recover from restart), see https://github.com/ledgerloops/braided-snap/issues/1
* treat the ledger as two arrays of transactions, balance is derived on-the-fly when needed
* transaction id's are derived simply from their place in the array
* ledger version numbers are a concatenation of number of transactions on record for each account
* but in alphabetical order by account name, so they two servers will label versions in the same way (see https://github.com/ledgerloops/braided-snap/issues/2)
