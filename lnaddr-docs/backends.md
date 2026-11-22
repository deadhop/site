---
title: Lightning backends
description: Connect lnaddr-node to LND, Core Lightning, phoenixd or LNbits with an invoice-only credential, so the node can make invoices and never spend.
---

# Lightning backends

The node only ever creates invoices. Give it a credential that can do nothing else.

## LND

```sh
LNADDR_NODE_BACKEND=lnd
LNADDR_NODE_BACKEND_URL=https://127.0.0.1:8080
LNADDR_NODE_BACKEND_SECRET_FILE=/lnd/data/chain/bitcoin/mainnet/invoice.macaroon
LNADDR_NODE_BACKEND_TLS_CERT_FILE=/lnd/tls.cert
```

`invoice.macaroon` only allows invoice methods. It is binary; the node reads it as hex for the `Grpc-Metadata-macaroon` header. The node calls `POST /v1/invoices` with `value_msat`, `description_hash` and `expiry`.

## Core Lightning (clnrest)

Make a rune that can only call `invoice`, optionally rate-limited:

```sh
lightning-cli createrune restrictions='[["method=invoice"],["rate=60"]]'
```

```sh
LNADDR_NODE_BACKEND=cln
LNADDR_NODE_BACKEND_URL=https://127.0.0.1:3010
LNADDR_NODE_BACKEND_SECRET_FILE=/secrets/rune
LNADDR_NODE_BACKEND_TLS_CERT_FILE=/cln/bitcoin/clnrest/server.pem   # or the SHA-256
```

The node calls `POST /v1/invoice` with `amount_msat`, a unique `label`, the metadata as `description` and `deschashonly: true`, so the invoice carries only its hash.

## phoenixd

```sh
LNADDR_NODE_BACKEND=phoenixd
LNADDR_NODE_BACKEND_URL=http://127.0.0.1:9740
LNADDR_NODE_BACKEND_SECRET_FILE=/secrets/phoenix-limited-password
```

Use `http-password-limited-access` from `phoenix.conf`: it can create invoices but not pay or withdraw. phoenixd takes whole satoshis, so amounts that are not a multiple of 1000 msat are refused, and every address must allow at least one whole satoshi amount.

## LNbits

```sh
LNADDR_NODE_BACKEND=lnbits
LNADDR_NODE_BACKEND_URL=https://lnbits.example.com
LNADDR_NODE_BACKEND_SECRET_FILE=/secrets/lnbits-invoice-key
```

Use the wallet's **invoice/read key**, not the admin key. The node calls `POST /api/v1/payments` with `out: false` and a `description_hash`. LNbits takes whole satoshis, like phoenixd.

## Plain http and pinning

- `http://` is accepted for loopback, private addresses, container names (no dot), `.local`, `.internal`, `.onion` and `.i2p`. Anywhere else, use https or set `LNADDR_NODE_BACKEND_INSECURE_HTTP=on`.
- With `TLS_CERT_FILE` or `TLS_CERT_SHA256`, only that exact certificate is accepted. Without them, https backends are checked against the web roots compiled into the binary.

## Checking

`lnaddr-node check` prints the configuration (the credential as `(set)`) and makes a test invoice for the first address's smallest amount, then checks it:

```text
backend    ok: made a 1 sat test invoice for you (lnbc10n1pn…)
```
