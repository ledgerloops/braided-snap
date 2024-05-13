# braided-snap
An implementation of [SNAP](https://michielbdejong.com/blog/20.html) using [Braid](https://braid.org)

This implementation uses two half-ledgers.
Transactions from Alice to Bob live on Bob's server.
Transactions from Bob to Alice live on Alice's server.
To create a new transactions:
```HTTP
POST /
{
    "amount": 5,
    "description": "payment for your invoice #5398753"
}

200 OK
Location: /d4d71820-14e3-4d64-8c46-7ecf637ae7c0
```
If the amount is so large that it would make the balance go under the overdraft, it will fail:

```HTTP
POST /
{
    "amount": 500,
    "description": "payment for your invoice #5398753"
}

403 Forbidden
```

`GET /`:
```JSON
{
    "currency": "USD",
    "overdraft": -50,
    "balance": -13.5
}
```

```HTTP
GET /d4d71820-14e3-4d64-8c46-7ecf637ae7c0
200 OK

{
    "amount": 5,
    "description": "payment for your invoice #5398753"
}
```

Netting works with a form of XCAT. Alice posts to Bob with a negative amount, and subscribes:
```HTTP
POST /
{
    "amount": -50,
    "condition": {
        "challenge": "SHA256",
        "hash": "2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b"
    }
    "description": "Netting"
}

200 OK
Location: /c9f5e0e4-8381-4974-8ca9-0691d5abee3d
```
Bob posts the same to Alice and subscribes:
```HTTP
POST /
{
    "amount": -50,
    "condition": {
        "challenge": "SHA256",
        "hash": "2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b"
    }
    "description": "Netting"
}

200 OK
Location: /af0af922-29da-4f85-a886-dc9ad872c481
```
Then Alice commits using a server-to-client update notification for the second transaction,
and Bob does the same for the first transaction.