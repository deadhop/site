---
title: Gateway configuration
description: Configure lnaddr-gateway with a TOML file or environment variables, serve one or many domains and nodes, and set its limits.
---

# Gateway configuration

The gateway has the same first three layers as the node (built-in, file, environment) and no remote settings. Two variables are enough to start:

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
| `LNADDR_GATEWAY_SOCKS5` | SOCKS5 proxy for relay connections |
| `LNADDR_GATEWAY_SCHEME` | `http` to build http callback URLs |
| `LNADDR_GATEWAY_PER_IP_PER_MINUTE`, `_GLOBAL_PER_MINUTE`, `_TIMEOUT_SECS`, `_CACHE_SECS`, `_MAX_CONNECTIONS` | limits |
| `LNADDR_GATEWAY_ADMIN_LISTEN`, `_ADMIN_SECURE_COOKIE` | the web interface |
| `LNADDR_GATEWAY_LOG` | log filter |

## Health

`GET /healthz` answers `{"status":"ok"}` (200) while at least one node answers, `{"status":"degraded"}` (503) otherwise, and nothing more.
