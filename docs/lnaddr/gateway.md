---
title: Gateway configuration
description: Configure lnaddr-gateway with a TOML file or environment variables, serve one or many domains and nodes, and set its limits.
---

# Gateway configuration

The gateway has the same first three layers as the node (built-in, file, environment). Its only remote settings are its relays and proxies, changed from the network console by the keys in `admins` (see [relays and proxies](#relays-and-proxies)). Two variables are enough to start:

```sh
LNADDR_GATEWAY_DOMAIN=yourdomain.com
LNADDR_GATEWAY_NODE=npub1node…
```

## Example file

```toml
data_dir = "/var/lib/lnaddr-gateway"
listen = "127.0.0.1:8080"              # or "unix:/run/lnaddr/gateway.sock"
domains = ["yourdomain.com", "other.org"]
trusted_proxies = ["127.0.0.1", "10.0.0.0/8"]
relays = ["wss://relay.contextvm.org", "wss://relay2.contextvm.org"]

[[nodes]]
pubkey = "npub1node…"
names = ["*"]                          # whatever the node lists (default)
payee = "02abc…"                       # optional: the Lightning key every invoice must be signed by

[[nodes]]
pubkey = "npub1other…"
names = ["shop", "donate"]
relays = ["wss://relay.example"]       # this node's own relays

[limits]
per_ip_per_minute = 30                 # invoices per client per minute (lookups: 4×)
global_per_minute = 600
timeout_secs = 15                      # wallet-facing deadline
cache_secs = 60                        # how often node address lists are refreshed
max_connections = 1024

[admin]
listen = "127.0.0.1:8081"              # the web interface; off when unset
# secure_cookie = true                 # default: on unless listening on loopback

# The network console (optional): who may manage the gateway's relays and proxies.
# admins = ["npub1you…"]
# sources = { remote = true }          # let them change anything (off by default)
# proxy_locked = true                  # proxies stay host-only even then
# socks5 = "127.0.0.1:9050"            # the one proxy for relay connections
```

## Domains

- With **one** domain, every request is for it, whatever `Host` says. Proxies that rewrite `Host` (nginx's default) need nothing extra.
- With **several**, the request's `Host` (or `X-Forwarded-Host` from a trusted proxy) picks one from the list. Anything else gets `404`.
- An address may be limited to some domains on the node (`domains`).
- Callback URLs are `https://<domain>/.well-known/lnurlp/<name>/callback`, or `http://` for `.onion` domains. `scheme = "http"` forces http for local testing.

## Environment variables

| Variable | Meaning |
| --- | --- |
| `LNADDR_GATEWAY_CONFIG` | TOML file to read |
| `LNADDR_GATEWAY_DATA_DIR` | keys and the admin token |
| `LNADDR_GATEWAY_LISTEN` | `IP:port` or `unix:/path` (default `127.0.0.1:8080`; `0.0.0.0:8080` in the image) |
| `LNADDR_GATEWAY_DOMAIN` / `_DOMAINS` | comma-separated |
| `LNADDR_GATEWAY_NODE` / `_NODES` | comma-separated node keys, each serving every name it lists |
| `LNADDR_GATEWAY_RELAYS` | comma-separated relay URLs |
| `LNADDR_GATEWAY_TRUSTED_PROXIES` | comma-separated addresses or networks |
| `LNADDR_GATEWAY_SOCKS5` | the proxy for relay connections (`host:port` for SOCKS5, or a `socks5://`, `http://` or `https://` URL) |
| `LNADDR_GATEWAY_ADMINS` | comma-separated keys (npub or hex) that may sign in to the gateway from the network console |
| `LNADDR_GATEWAY_REMOTE` | `on` to let them change the relays and proxies (off by default) |
| `LNADDR_GATEWAY_PROXY_LOCKED` | `on` to keep the proxies host-only |
| `LNADDR_GATEWAY_SCHEME` | `http` to build http callback URLs |
| `LNADDR_GATEWAY_PER_IP_PER_MINUTE`, `_GLOBAL_PER_MINUTE`, `_TIMEOUT_SECS`, `_CACHE_SECS`, `_MAX_CONNECTIONS` | limits |
| `LNADDR_GATEWAY_ADMIN_LISTEN`, `_ADMIN_SECURE_COOKIE` | the web interface |
| `LNADDR_GATEWAY_LOG` | log filter |

## Relays and proxies

The gateway's relay connections run on deadhop's network engine, as the node's do, with one lane per key:

| Lane | Key | Used for |
| --- | --- | --- |
| `gateway` | `gateway.key` | asking the nodes for invoices and address lists |
| `admin` | `admin.key` | the admin page and `node …` commands, and the network console's sign-in |

Each node is reached on the lane's relays that are also that node's relays in the configuration (`nodes[].relays`, or the global `relays`), so no request goes to a relay the node does not read. Each pool to a node is made when it is first needed, moved in place when a proxy switch changes only its routes, and remade when its relays change.

The configuration is the baseline: every node's relays, once each, and `socks5` (if set) as a list of one proxy with the default route through it and the kill switch while it is down, as before. Existing configurations keep working unchanged.

With `admins` set, the gateway runs a ContextVM server on its admin key (`admin.key`, made at start if missing; print it with `lnaddr-gateway admin-pubkey`). It answers only the keys in `admins`, accepts ephemeral gift wraps only and is never announced. It serves `get_info`, `get_network`, `update_network`, `reset_network`, `get_health` and the network engine's tools (`check_proxy`, `check_relays`, `get_relay_history`, `get_privacy_audit`, `resolve_i2p_name`). With remote settings on (`sources = { remote = true }` or `LNADDR_GATEWAY_REMOTE=on`), those admins can change the relays, relay names, proxies, groups, routing rules, the offline policy and the I2P registries, and go back to the configuration. The rules are the node's (see [node configuration](./node.md#relays-and-proxies)): `proxy_locked` keeps the proxies host-only, and while admins cannot change the proxies they can test only the listed ones and cannot look up I2P names.

The gateway and its nodes only meet on relays they share. So:

- A remote change of relays (or of which key uses which relay) that would leave a node with no relay in common with the gateway key is refused, naming the node and its relays.
- `get_network` and `get_health` warn about any node a key shares no relay with (for example after the configuration changed under saved relays).

While nothing reachable is left on the default route, the offline policy decides per lane: `kill_switch` connects neither, `admin_only` connects the admin lane straight (the console can reach the gateway; no invoices), `invoicing_only` the gateway lane (invoices; no console or node admin), and `open` both.

As on the node, new relays get 30 seconds to connect (judged by the console's server) or the previous ones come back, and saved relays with nothing connected for 10 minutes (or none at start) give way to the configured ones. Unlike the node, a console server that stops or cannot be remade does not stop the gateway: the LNURL side keeps serving and the server is brought back on the next look, every 30 seconds.

`get_info` reports the bitcoin network its nodes report (`bitcoin` before any answered), the smallest and largest amounts of their addresses, and 600 seconds for the invoice expiry (the nodes set it). The privacy audit counts the gateway's public HTTP listener under "Ports are open next to the service": it is meant to be public.

## Files in the data directory

| File | What |
| --- | --- |
| `gateway.key` | the key that asks nodes for invoices |
| `admin.key` | the key the nodes list as admin, and the console's sign-in identity |
| `admin.token` | the web interface's sign-in token |
| `network.json` | relays and proxies saved by an admin, as changes over the configuration (owner-only; read and written only while remote settings are on; one that does not fit stops the gateway at start) |
| `audit.jsonl` | one JSON line per network change, by admin key or `gateway` for what the gateway did itself; kept under 1 MiB |

## Health

`GET /healthz` answers `{"status":"ok"}` (200) while at least one node answers, `{"status":"degraded"}` (503) otherwise, and nothing more.
