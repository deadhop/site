---
title: Node configuration
description: Configure lnaddr-node with built-in values, a TOML file, environment variables or settings from an admin key (addresses, limits, relays, proxies), and lock any source.
---

# Node configuration

## Where settings come from

Four layers, later ones winning (see [architecture](./architecture.md#configuration-layers)):

1. **Built-in**: compile a TOML file into the binary: `LNADDR_NODE_BUILTIN="$(cat node.toml)" cargo build --release`. Use it for appliances and images that should carry their own settings. Point at secret files; never put secrets in it.
2. **File**: `lnaddr-node --config /etc/lnaddr/node.toml` or `LNADDR_NODE_CONFIG`.
3. **Environment**: `LNADDR_NODE_*` (below).
4. **Remote**: addresses and limits, and relays and proxies, saved over ContextVM by an admin key, when switched on.

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
# socks5 = "127.0.0.1:9050"      # reach relays through Tor (or an http:// / https:// CONNECT proxy)
# proxy_locked = true            # proxies can only be changed here, never remotely
sources = { remote = true }      # let admins change addresses, limits, relays and proxies

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
| `LNADDR_NODE_SOCKS5` | proxy for relay connections: `IP:port` (SOCKS5), or a `socks5://`, `http://` or `https://` (CONNECT) url |
| `LNADDR_NODE_PROXY_LOCKED` | `on` to keep the proxies host-only: admins cannot change them, test new ones or look up I2P names |
| `LNADDR_NODE_BACKEND` | `lnd`, `cln`, `phoenixd`, `lnbits` |
| `LNADDR_NODE_BACKEND_URL` | default: the backend's usual local address |
| `LNADDR_NODE_BACKEND_SECRET_FILE` | credential file (a binary macaroon is read as hex) |
| `LNADDR_NODE_BACKEND_SECRET` | the credential itself (prefer the file) |
| `LNADDR_NODE_BACKEND_TLS_CERT_FILE` | the backend's certificate, pinned exactly |
| `LNADDR_NODE_BACKEND_TLS_CERT_SHA256` | or its SHA-256 fingerprint |
| `LNADDR_NODE_BACKEND_TIMEOUT_SECS` | 1 to 60, default 10 |
| `LNADDR_NODE_BACKEND_INSECURE_HTTP` | allow `http://` to a public host |
| `LNADDR_NODE_REMOTE` | `on` to let admins change addresses, limits, relays and proxies |
| `LNADDR_NODE_LOG` | log filter, e.g. `debug` |

## Commands

```text
lnaddr-node [serve]   run the node service
lnaddr-node pubkey    print the node's npub, creating its key if needed
lnaddr-node check     print the configuration (no secrets) and make a test invoice
lnaddr-node version
```

## Remote settings

With remote settings on, an admin key listed in `admins` can call `set_address`, `remove_address` and `set_limits`. The first change saves the whole address table to `remote.toml`, and from then on that table replaces the configured one. Delete `remote.toml` to go back to the configured addresses. `concurrent`, the backend and the keys are never remote.

## Relays and proxies

The node's relay connections run on deadhop's network engine, the same one as the payment service, with one lane (`node`) for its one key. Each relay goes where the routing rules say: through a proxy, a proxy group (failover, round robin or chaos), straight, or nowhere; a relay no rule matches takes the default route. The node probes its proxies every minute against the relays they carry, moves only the relays whose route changed, and checks every relay end to end every 5 minutes.

The configuration is the baseline. `relays` are the relays, and `socks5` (if set) becomes a list of one proxy with the default route through it and the kill switch when it is down, so the node never connects straight, as before. Existing configurations keep working unchanged.

With remote settings on, an admin can change the relays, relay names, proxies, groups, routing rules, the offline policy and the I2P name registries (`update_network`), and go back to the configuration (`reset_network`). With `proxy_locked`, every proxy setting stays host-only: proxies saved in `network.json` are ignored and the configured one is used, and relays and relay names can still be changed. Whenever admins cannot change the proxies (`proxy_locked`, or remote settings off), they can test only the listed proxies, by id, and cannot look up I2P names, so no admin key can make the node connect out through a proxy of its choosing.

A remote relay list must keep at least one of the configured relays. The gateways were set up with those, and the node cannot know which relays they listen on: a list without any of them would cut every gateway off, and nothing would undo it, since the new relays do connect. While nothing reachable is left on the default route, the offline policy decides:

| Policy | Relays | Served |
| --- | --- | --- |
| `kill_switch` (default) | none | nobody, until a proxy is back |
| `admin_only` | straight | admins only; gateways get `unavailable` |
| `invoicing_only` | straight | gateways only; admins are refused (a key listed as both acts as a gateway) |
| `open` | straight | everyone |

The node protects its own way back in:

- A change that would point the default route at a proxy or group that is down now is refused.
- After a change of proxy list, if none of the new proxies is reachable within 3 minutes, the previous proxies come back.
- New relays get 30 seconds to connect; if none does, the previous relays come back.
- If saved relays have had nothing connected for 10 minutes, or none connects at start, the node goes back to the configured relays. Only the relays: saved proxies stay, and with them the offline policy, so the kill switch still holds.

## Files in the data directory

| File | What |
| --- | --- |
| `node.key` | the node's Nostr key |
| `remote.toml` | addresses and limits saved by an admin |
| `network.json` | relays and proxies saved by an admin, as changes over the configuration (proxy passwords included, owner-only). Read and written only while remote settings are on; one that no longer fits the configuration stops the node at start with the reason. `reset_network` empties it; deleting it does the same at the next start. |
| `audit.jsonl` | one JSON line per network change: when, which admin key (or `node` for what the node did itself, such as going back to the previous relays), what, and the change with proxy passwords hidden. Kept under 1 MiB: when an entry would pass that, the oldest entries are dropped until the log is at most half of it. |

Relay results (each health check and each reply sent) are kept in memory only, the last 20,000, for `get_relay_history`. They are gone after a restart.

## The network console

The standalone network console (`console/` in the repository) manages these settings from a browser: it signs in with an admin key over ContextVM and reads `get_info`, `get_network`, `get_health`, `get_relay_history`, `check_relays`, `check_proxy`, `resolve_i2p_name` and `get_privacy_audit`, and saves with `update_network`. Only admins are answered; a gateway never sees these tools. The node's `get_info` answers in the shape the console expects (the payment fields are fixed: no public invoicing, no proof of work). The node accepts only ephemeral gift wraps (kind 21059), so the console's client must send those.

The privacy audit on the node has no Electrum checks (it has no chain backend), never announces itself, and names `LNADDR_NODE_PROXY_LOCKED` for the proxy lock (or, with remote settings off, `LNADDR_NODE_REMOTE`).

The gateway runs its relays on the same engine and serves the same console tools to its own admins: see [gateway configuration](./gateway.md#relays-and-proxies).
