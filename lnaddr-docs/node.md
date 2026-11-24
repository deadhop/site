---
title: Node configuration
description: Configure lnaddr-node with built-in values, a TOML file, environment variables, or remote settings from an admin key, and lock any source.
---

# Node configuration

## Where settings come from

Four layers, later ones winning (see [architecture](./architecture.md#configuration-layers)):

1. **Built-in**: compile a TOML file into the binary: `LNADDR_NODE_BUILTIN="$(cat node.toml)" cargo build --release`. Use it for appliances and images that should carry their own settings. Point at secret files; never put secrets in it.
2. **File**: `lnaddr-node --config /etc/lnaddr/node.toml` or `LNADDR_NODE_CONFIG`.
3. **Environment**: `LNADDR_NODE_*` (below).
4. **Remote**: addresses and limits saved over ContextVM by an admin key, when switched on.

To run **only** on built-in values, build with:

```toml
sources = { file = false, env = false, remote = false }
```

A source switched off by one layer stays off.

## Example file

```toml
data_dir = "/var/lib/lnaddr-node"
relays = ["wss://relay.contextvm.org", "wss://relay2.contextvm.org"]
gateways = ["npub1gw…"]          # may ask for invoices
admins = ["npub1admin…"]         # may also read status and change addresses
network = "bitcoin"              # bitcoin, testnet, signet or regtest
# socks5 = "127.0.0.1:9050"      # reach relays through Tor
sources = { remote = true }      # let admins change addresses and limits

[backend]
kind = "lnd"                     # lnd, cln, phoenixd or lnbits
url = "https://127.0.0.1:8080"
secret_file = "/var/lib/lnd/invoice.macaroon"
tls_cert_file = "/var/lib/lnd/tls.cert"   # pinned exactly
timeout_secs = 10

[limits]
invoices_per_minute = 120        # all callers together
per_caller_per_minute = 60       # one calling key
concurrent = 8                   # backend calls at once
invoice_expiry_secs = 600

[addresses.you]
min_sendable = 1000              # millisatoshis
max_sendable = 1000000000
description = "Pay you"
comment_allowed = 140            # LUD-12; 0 for none
domains = ["yourdomain.com"]     # empty: any domain the gateway serves
```

## Environment variables

| Variable | Meaning |
| --- | --- |
| `LNADDR_NODE_CONFIG` | TOML file to read |
| `LNADDR_NODE_DATA_DIR` | key and saved settings (default `~/.local/share/deadhop-lnaddr/node`; `/data` in the image) |
| `LNADDR_NODE_RELAYS` | comma-separated relay URLs |
| `LNADDR_NODE_GATEWAYS`, `LNADDR_NODE_ADMINS` | comma-separated npub or hex keys |
| `LNADDR_NODE_ADDRESSES` | comma-separated names, each 1 to 1,000,000 sat, "Pay NAME", no comments |
| `LNADDR_NODE_NETWORK` | `bitcoin` (default), `testnet`, `signet`, `regtest` |
| `LNADDR_NODE_SOCKS5` | SOCKS5 proxy for relay connections, `IP:port` |
| `LNADDR_NODE_BACKEND` | `lnd`, `cln`, `phoenixd`, `lnbits` |
| `LNADDR_NODE_BACKEND_URL` | default: the backend's usual local address |
| `LNADDR_NODE_BACKEND_SECRET_FILE` | credential file (a binary macaroon is read as hex) |
| `LNADDR_NODE_BACKEND_SECRET` | the credential itself (prefer the file) |
| `LNADDR_NODE_BACKEND_TLS_CERT_FILE` | the backend's certificate, pinned exactly |
| `LNADDR_NODE_BACKEND_TLS_CERT_SHA256` | or its SHA-256 fingerprint |
| `LNADDR_NODE_BACKEND_TIMEOUT_SECS` | 1 to 60, default 10 |
| `LNADDR_NODE_BACKEND_INSECURE_HTTP` | allow `http://` to a public host |
| `LNADDR_NODE_REMOTE` | `on` to let admins change addresses and limits |
| `LNADDR_NODE_LOG` | log filter, e.g. `debug` |

## Commands

```text
lnaddr-node [serve]   run the node service
lnaddr-node pubkey    print the node's npub, creating its key if needed
lnaddr-node check     print the configuration (no secrets) and make a test invoice
lnaddr-node version
```

## Remote settings

With remote settings on, an admin key listed in `admins` can call `set_address`, `remove_address` and `set_limits`. The first change saves the whole address table to `remote.toml`, and from then on that table replaces the configured one. Delete `remote.toml` to go back to the configured addresses. `concurrent`, the backend, the keys and the relays are never remote.
