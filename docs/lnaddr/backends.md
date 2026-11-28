---
title: Lightning backends
description: Connect lnaddr-node to LND, Core Lightning, phoenixd or LNbits with an invoice-only credential, so the node can make and read invoices and never spend.
---

# Lightning backends

The node only ever creates invoices and reads them back, to see whether they were paid. Give it a credential that can do nothing else.

## LND

```sh
LNADDR_NODE_BACKEND=lnd
LNADDR_NODE_BACKEND_URL=https://127.0.0.1:8080          # lnaddr-node and LND on the same host, without Docker
LNADDR_NODE_BACKEND_SECRET_FILE=/lnd/data/chain/bitcoin/mainnet/invoice.macaroon
LNADDR_NODE_BACKEND_TLS_CERT_FILE=/lnd/tls.cert
```

`invoice.macaroon` allows creating and reading invoices (and new on-chain addresses), and cannot spend. It is binary; the node reads it as hex for the `Grpc-Metadata-macaroon` header. The node calls `POST /v1/invoices` with `value_msat`, `description_hash`, `expiry` and `private: true`, so invoices carry route hints for private channels: a home node often has no public channel, and without hints nobody could route to it. To see whether one was paid, it calls `GET /v1/invoice/<payment hash>` (`state` `SETTLED`, and the preimage).

## Core Lightning (clnrest)

Make a rune that can only call `invoice` and `listinvoices`, optionally rate-limited:

```sh
lightning-cli createrune restrictions='[["method=invoice","method=listinvoices"],["rate=60"]]'
```

The alternatives inside one inner list are "or", the lists are "and". A rune made for `method=invoice` alone still makes invoices, but cannot see payments: LUD-21 `verify` and `list_invoices` then fail with `backend_failed`. Make a new rune to replace it.

```sh
LNADDR_NODE_BACKEND=cln
LNADDR_NODE_BACKEND_URL=https://127.0.0.1:3010
LNADDR_NODE_BACKEND_SECRET_FILE=/secrets/rune
LNADDR_NODE_BACKEND_TLS_CERT_FILE=/cln/bitcoin/clnrest/server.pem   # or the SHA-256
```

The node calls `POST /v1/invoice` with `amount_msat`, a unique `label`, the metadata as `description` and `deschashonly: true`, so the invoice carries only its hash. Core Lightning adds route hints for private channels when the node has no public ones. To see whether one was paid, it calls `POST /v1/listinvoices` with the `payment_hash` (`status` `paid`, `payment_preimage`, `paid_at`).

## phoenixd

```sh
LNADDR_NODE_BACKEND=phoenixd
LNADDR_NODE_BACKEND_URL=http://127.0.0.1:9740
LNADDR_NODE_BACKEND_SECRET_FILE=/secrets/phoenix-limited-password
```

Use `http-password-limited-access` from `phoenix.conf`: it can create invoices and read incoming payments, but not pay or withdraw. The node reads `GET /payments/incoming/<payment hash>` and trusts the preimage only when `isPaid` is true (phoenixd fills it in either way). phoenixd takes whole satoshis, so amounts that are not a multiple of 1000 msat are refused, and every address must allow at least one whole satoshi amount.

## LNbits

```sh
LNADDR_NODE_BACKEND=lnbits
LNADDR_NODE_BACKEND_URL=https://lnbits.example.com
LNADDR_NODE_BACKEND_SECRET_FILE=/secrets/lnbits-invoice-key
```

Use the wallet's **invoice/read key**, not the admin key. The node calls `POST /api/v1/payments` with `out: false` and a `description_hash`, and reads the invoice from `bolt11` (or `payment_request`, for older versions). To see whether one was paid, it reads `GET /api/v1/payments/<payment hash>` (`paid`, `preimage`). LNbits takes whole satoshis, like phoenixd.

## Plain http and pinning

- `http://` is accepted for loopback, private addresses, container names (no dot), `.local`, `.internal`, `.onion` and `.i2p`. Anywhere else, use https or set `LNADDR_NODE_BACKEND_INSECURE_HTTP=on`.
- With `TLS_CERT_FILE` or `TLS_CERT_SHA256`, only that exact certificate is accepted. Without them, https backends are checked against the web roots compiled into the binary.

## Checking

`lnaddr-node check` prints the configuration (the credential as `(set)`) and makes a test invoice for the first address's smallest amount, then checks it:

```text
backend    ok: made a 1 sat test invoice for you (lnbc10n1pn…)
```
