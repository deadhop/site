---
title: Commands
description: 'Every deadhop command-line command: run the service, read its public keys, read an Electrum server''s TLS fingerprint, and the offline wallet''s serve and export.'
---

# Commands

The `deadhop` binary runs the service when started with no arguments. A few subcommands help set it up. All read the same `DEADHOP_*` environment variables as the service.

| Command | What it does |
| --- | --- |
| `deadhop` | Run the service, configured by the environment ([Configuration](./configuration.md)). |
| `deadhop pubkey` | Print the public invoices key (hex), creating the service's keys in `DEADHOP_DATA_DIR` if needed. This is the key customers and apps use. |
| `deadhop pubkey admin` | Print the administration key (hex). Operators sign in through it; it is never announced. |
| `deadhop pubkey ID` | Print the public key of an invoice key added from the dashboard, such as `deadhop pubkey shop`. Such a key is only ever made by the service; this prints nothing for an id it has not made. |
| `deadhop fingerprint HOST:PORT` | Read an Electrum server's TLS certificate and print its SHA-256 fingerprint, with the two settings that pin it. It trusts whatever answers, so compare it on the server. |
| `deadhop wallet serve` | The offline wallet service: generate a wallet on first start, write its account public key to `DEADHOP_XPUB_FILE`, then stay up. Compose runs it with no network. |
| `deadhop wallet export` | Print the generated wallet's 24 words and how to restore them. Refused when the service uses your own `DEADHOP_XPUB`. |

Anything else prints the usage and exits with status 2.

## With Docker Compose

The images pass their arguments to `deadhop`:

```sh
docker compose exec wallet deadhop wallet export                       # while it runs
docker compose run --rm --no-deps deadhop pubkey admin                 # the administration key
docker compose run --rm --no-deps deadhop fingerprint node.lan:50002   # an Electrum server's certificate
```

## The other binaries

- `deadhop-wallet` (the sweeping wallet): `run`, `once`, `status`. See [Configuration and commands](./wallet/configuration.md).
- `deadhop-relay`: run the relay, or `check` its configuration. See the [relay's configuration](./relay/configuration.md).
- `lnaddr-node` and `lnaddr-gateway`: see the [node](./lnaddr/node.md) and [gateway](./lnaddr/gateway.md) configuration.
