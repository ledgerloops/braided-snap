# braided-snap
An implementation of [SNAP](https://michielbdejong.com/blog/20.html) using [Braid](https://braid.org)

Both participants will http post a JSON body with Braid headers to the other one
Options for data structure:
1) post only the balance. This means that transactions cannot have a description, which makes it harder to use. So not a good idea probably
2) post the new balance and the description of the last new outgoing transaction. This solves the issue of not having descriptions but it's a bit weird to change the meaning of this field each time
3) a bit more generic: add an object with multiple new transactions, with explicit transaction amounts
4) in order to also support conditional transfers, it would be nice if the counterparty does the commit. so then the ledger state needs two arrays of pending transactions
5) to also support having more than 2 accounts in the data structure, list multiple balances, indexed by actor name.
6) to make it a bit nicer, use one URL per transaction

Let's pick option 6.

```HTTP
POST /
{
    "recipient": "bob",
    "amount": 5,
}

200 OK
Location: /d4d71820-14e3-4d64-8c46-7ecf637ae7c0
```


```HTTP
POST /
{
    "recipient": "bob",
    "amount": 500,
}

403 Forbidden
```

`GET /`:
```JSON
{
    "currency": "USD",
    "overdraft": {
        "alice": -50,
        "bob": -150
    },
    "balances": {
        "alice": -13.5,
        "bob": 13.5
    },
    "pending": {
        "alice": [
            {
                "id": "d4d71820-14e3-4d64-8c46-7ecf637ae7c0",
                "recipient": "bob",
                "amount": 5,
            }
        ]
    }
}
```

Invariants:
* balances sum to 0
* an actor's balance, minus the sum of amounts of their outgoing transactions, is equal to or greater than the overdraft amount for that actor
* only the sender can add pending transactions
* only the recipient can commit or roll back a pending transaction
* to roll back a transaction, just remove it from pending
* to commit it, remove it from pending, reduce the sender balance by the amount, increase the recipient balance by the amount