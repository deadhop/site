---
title: Gateway configuration
description: Configure lnaddr-gateway with a TOML file or environment variables, serve one or many domains and nodes, and set its limits.
---

# Gateway configuration

The gateway has the same first three layers as the node: built-in (`LNADDR_GATEWAY_BUILTIN` at build time), a TOML file (`lnaddr-gateway --config FILE` or `LNADDR_GATEWAY_CONFIG`; `--config` wins), then the `LNADDR_GATEWAY_*` environment variables, later ones winning. Its only remote settings are its relays and proxies, changed from the network console by the keys in `admins` (see [relays and proxies](#relays-and-proxies)). Two variables are enough to start:

```sh
LNADDR_GATEWAY_DOMAIN=yourdomain.com
LNADDR_GATEWAY_NODE=npub1node…
```

## The TOML file

### Layout

The file has **top-level keys**, three tables (`[limits]`, `[admin]`, `[sources]`) and a list of nodes, one `[[nodes]]` block each.

- **Top-level keys come first,** before the first `[table]` or `[[nodes]]` line. A key below a header belongs to it: `relays = […]` written under `[[nodes]]` sets that node's relays, not the gateway's, and `socks5` under `[limits]` is an error.
- **`[[nodes]]` (double brackets) adds one node to the list** each time it appears; its keys follow it until the next header. Single brackets (`[nodes]`) are an error (`invalid type: map, expected a sequence`).
- **Unknown keys are refused.** A misspelled or misplaced key stops the gateway at start with an error naming it (`unknown field …`).
- **Values have TOML types:** text in double quotes, lists in brackets, numbers bare, switches `true` or `false` (not `"on"`).
- **Tables can be inline:** `sources = { remote = true }` at the top level is the same as a `[sources]` table with `remote = true`. Nodes can be inline too: `nodes = [{ pubkey = "npub1…" }, { pubkey = "npub1…", names = ["shop"] }]`.

### A complete file

Every key is shown; only `domains` and one node's `pubkey` are required.

```toml
# Top-level keys: before any [table] or [[nodes]].
data_dir = "/var/lib/lnaddr-gateway"
listen = "127.0.0.1:8080"              # or "unix:/run/lnaddr/gateway.sock"
domains = ["yourdomain.com", "other.org"]
# scheme = "http"                      # only for local testing
trusted_proxies = ["127.0.0.1", "10.0.0.0/8"]
relays = ["wss://relay.contextvm.org", "wss://relay2.contextvm.org"]
socks5 = "127.0.0.1:9050"              # the one proxy for relay connections
proxy_locked = true                    # proxies stay host-only, even for admins
admins = ["npub1you…"]                 # may manage the relays and proxies from the network console

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

[sources]
remote = true                          # let admins change the relays and proxies (off by default)
```

## Every setting

### Top level

| TOML key | Environment variable | Value | Default |
| --- | --- | --- | --- |
| `data_dir` | `LNADDR_GATEWAY_DATA_DIR` | a directory path; holds the keys and the admin token | `~/.local/share/deadhop-lnaddr/gateway` (`/data` in the image) |
| `listen` | `LNADDR_GATEWAY_LISTEN` | `IP:port`, or `unix:/path` for a Unix socket | `127.0.0.1:8080` (`0.0.0.0:8080` in the image) |
| `domains` | `LNADDR_GATEWAY_DOMAIN` / `_DOMAINS` | lower-case domain names, each with an optional `:port` | required |
| `scheme` | `LNADDR_GATEWAY_SCHEME` | `https`, or `http` to build http callback URLs for local testing | `https` (`http` for `.onion` domains) |
| `trusted_proxies` | `LNADDR_GATEWAY_TRUSTED_PROXIES` | addresses or networks (`10.0.0.0/8`) whose `X-Forwarded-For` and `X-Forwarded-Host` are believed | none |
| `relays` | `LNADDR_GATEWAY_RELAYS` | relay URLs: `wss://`, or `ws://` for loopback, `.onion` and `.i2p` only | `["wss://relay.contextvm.org", "wss://relay2.contextvm.org"]` |
| `socks5` | `LNADDR_GATEWAY_SOCKS5` | proxy for relay connections: `host:port` (SOCKS5), or a `socks5://`, `http://` or `https://` URL | none: straight connections |
| `proxy_locked` | `LNADDR_GATEWAY_PROXY_LOCKED` | keep the proxies host-only | `false` |
| `admins` | `LNADDR_GATEWAY_ADMINS` | keys (npub or hex) that may sign in from the network console | none: no console server |

`LNADDR_GATEWAY_DOMAIN` and `_DOMAINS` are the same setting; if both are set, `_DOMAINS` is used. The same holds for `LNADDR_GATEWAY_NODE` and `_NODES`.

### `[[nodes]]`

One block per node. The environment can only give keys: `LNADDR_GATEWAY_NODE` (or `_NODES`) is a comma-separated list of node keys, each with the defaults below. For names, relays or a payee per node, use the file.

| TOML key | Value | Default |
| --- | --- | --- |
| `pubkey` | the node's key (npub or hex), from `lnaddr-node pubkey` | required |
| `names` | the names this gateway asks this node for (`a-z 0-9 - _ .`); `["*"]` for whatever the node lists | `["*"]` |
| `relays` | this node's relays, replacing the top-level `relays` for it | the top-level `relays` |
| `payee` | the Lightning node key (66 hex characters) every invoice from this node must be signed by | none: not checked |

### `[limits]`

These variables have no `LIMITS_` in their names.

| TOML key | Environment variable | Value | Default |
| --- | --- | --- | --- |
| `limits.per_ip_per_minute` | `LNADDR_GATEWAY_PER_IP_PER_MINUTE` | invoices per client per minute (lookups and verifications: 4× each), at least 1 | `30` |
| `limits.global_per_minute` | `LNADDR_GATEWAY_GLOBAL_PER_MINUTE` | invoices per minute for all clients, at least 1 | `600` |
| `limits.timeout_secs` | `LNADDR_GATEWAY_TIMEOUT_SECS` | the deadline for answering a wallet, 2 to 60 | `15` |
| `limits.cache_secs` | `LNADDR_GATEWAY_CACHE_SECS` | how often each node's address list is refreshed, 5 to 3600 | `60` |
| `limits.max_connections` | `LNADDR_GATEWAY_MAX_CONNECTIONS` | open HTTP connections at once, 16 to 65536 | `1024` |

Values outside these ranges are brought into them, without an error.

### `[admin]`

| TOML key | Environment variable | Value | Default |
| --- | --- | --- | --- |
| `admin.listen` | `LNADDR_GATEWAY_ADMIN_LISTEN` | where the [admin web interface](./admin.md) listens: `IP:port` or `unix:/path`; must differ from `listen` | none: the web interface is off |
| `admin.secure_cookie` | `LNADDR_GATEWAY_ADMIN_SECURE_COOKIE` | mark the sign-in cookie HTTPS-only | `true`, or `false` when `admin.listen` is loopback or a Unix socket |

### `[sources]`

| TOML key | Environment variable | Value | Default |
| --- | --- | --- | --- |
| `sources.file` | none | read the file | `true` |
| `sources.env` | none | read the `LNADDR_GATEWAY_*` variables | `true` |
| `sources.remote` | `LNADDR_GATEWAY_REMOTE` | let `admins` change the relays and proxies | `false` |

As on the node, a source switched off stays off.

### Environment only

| Variable | Meaning |
| --- | --- |
| `LNADDR_GATEWAY_CONFIG` | the TOML file to read (`--config` wins) |
| `LNADDR_GATEWAY_LOG` | log filter, e.g. `debug` (default `warn,deadhop_lnaddr=info`) |
| `LNADDR_GATEWAY_BUILTIN` | at **build** time: the TOML text compiled in as the built-in layer |

## How the layers combine

| Kind | Settings | A later layer… |
| --- | --- | --- |
| single values | `data_dir`, `listen`, `scheme`, `socks5`, `proxy_locked`, every `limits.*` and `admin.*` key | replaces that value; the other keys of the same table stay |
| lists | `domains`, `trusted_proxies`, `relays`, `admins` | replaces the **whole list** |
| nodes | `[[nodes]]` | replaces the **whole node list** |
| sources | `sources.*` | can switch a source off for good, or switch on one nobody switched off |

So `LNADDR_GATEWAY_NODE=npub1…` next to a file with `[[nodes]]` blocks replaces them all with that one node, serving every name it lists. Keep the nodes in one place. An empty variable counts as unset.

## From environment variables to TOML

Drop `LNADDR_GATEWAY_` and write the rest in lower case. The exceptions:

| Environment variable | TOML |
| --- | --- |
| `LNADDR_GATEWAY_DOMAIN`, `_DOMAINS` | `domains = [ … ]` |
| `LNADDR_GATEWAY_NODE`, `_NODES` | one `[[nodes]]` block per key, with `pubkey = "…"` |
| `LNADDR_GATEWAY_PER_IP_PER_MINUTE`, `_GLOBAL_PER_MINUTE`, `_TIMEOUT_SECS`, `_CACHE_SECS`, `_MAX_CONNECTIONS` | `per_ip_per_minute` … `max_connections` in `[limits]` |
| `LNADDR_GATEWAY_ADMIN_LISTEN`, `_ADMIN_SECURE_COOKIE` | `listen`, `secure_cookie` in `[admin]` |
| `LNADDR_GATEWAY_REMOTE=on` | `remote = true` in `[sources]` |
| comma-separated lists | TOML lists: `"a,b"` becomes `["a", "b"]` |
| `on` / `off` | `true` / `false` |

In the environment, switches take `1`, `true`, `yes` or `on` and `0`, `false`, `no` or `off`.

For example, this environment:

```sh
LNADDR_GATEWAY_DOMAIN=yourdomain.com
LNADDR_GATEWAY_NODE=npub1node…
LNADDR_GATEWAY_TRUSTED_PROXIES=127.0.0.1
LNADDR_GATEWAY_RELAYS=wss://relay.contextvm.org,wss://relay.example.com
LNADDR_GATEWAY_PER_IP_PER_MINUTE=20
LNADDR_GATEWAY_ADMIN_LISTEN=127.0.0.1:8081
```

is this file:

```toml
domains = ["yourdomain.com"]
trusted_proxies = ["127.0.0.1"]
relays = ["wss://relay.contextvm.org", "wss://relay.example.com"]

[[nodes]]
pubkey = "npub1node…"

[limits]
per_ip_per_minute = 20

[admin]
listen = "127.0.0.1:8081"
```

## Domains

- With **one** domain, every request is for it, whatever `Host` says. Proxies that rewrite `Host` (nginx's default) need nothing extra.
- With **several**, the request's `Host` (or `X-Forwarded-Host` from a trusted proxy) picks one from the list. Anything else gets `404`.
- An address may be limited to some domains on the node (`domains`).
- Callback URLs are `https://<domain>/.well-known/lnurlp/<name>/callback`, or `http://` for `.onion` domains. `scheme = "http"` forces http for local testing. Verify URLs are built the same way.

## Payment verification (LUD-21)

The callback's answer carries a `verify` URL, `https://<domain>/.well-known/lnurlp/<name>/verify/<payment hash>`, when the node answers `verify_invoice` (nodes from before it do not, and then there is no `verify`):

```json
{ "pr": "lnbc210n1…", "routes": [], "verify": "https://pay.example/.well-known/lnurlp/alice/verify/e25b31b5…" }
```

`GET` it to learn whether the invoice was paid:

```json
{ "status": "OK", "settled": false, "preimage": null, "pr": "lnbc210n1…" }
{ "status": "OK", "settled": true, "preimage": "386192ea…", "pr": "lnbc210n1…" }
```

- The answer is never cached (`Cache-Control: no-store`), so a CDN in front must pass it through.
- An unknown or malformed payment hash, or one made for another address (name or domain), gets `{"status":"ERROR","reason":"Not found"}` (404). An unreachable node or backend gets `503`.
- Verifications have their own rate budget per client (four times the invoice budget), so a wallet polling does not use up invoices. The node asks its backend about one invoice at most every 2 seconds, at most 30 times a minute in all, and never again once paid.
- The gateway checks the node's answer before passing it on: the invoice must be for that payment hash, and a preimage must hash to it. A preimage is never passed on for an unpaid invoice.
- The answer says nothing about the address or the payer's comment. Those are only in the node's [`list_invoices` and `lookup_invoice`](./node.md#invoices-and-payments), for admins.

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
- So is any change (of relays or proxies) that would leave the gateway key a node it could reach before with no relay it may use: every shared relay blocked by the default route or a rule.
- `get_network` and `get_health` warn about any node a key shares no relay with (for example after the configuration changed under saved relays).

While nothing reachable is left on the default route, the offline policy decides per lane: `kill_switch` connects neither, `admin_only` connects the admin lane straight (the console can reach the gateway; no invoices), `invoicing_only` the gateway lane (invoices; no console or node admin), and `open` both.

Both lanes are judged when relays change: the console's server (when `admins` are set) must reach a relay, and the gateway key at least one node, within 30 seconds, or the previous relays come back. Saved relays on which either has had nothing connected for 10 minutes (or none at start) give way to the configured ones; a console server with no route at all counts as one that reaches nothing. This holds with no `admins` too, judged by the gateway key alone. After a change of proxies, if none of the new ones is reachable within 3 minutes the previous proxies come back, and on the gateway that includes going back to straight connections when there was no proxy before (its address is public anyway).

The gateway never stops for its network. A console server that cannot start, stops or cannot be remade, or a `network.json` that cannot be read or does not fit, is logged and named in `get_network` and `get_health` (`warnings`): the LNURL side keeps serving (on the configured relays and proxy when the saved ones are not used), and the server is tried again every 30 seconds.

`get_info` reports the bitcoin network its nodes report (`bitcoin` before any answered), the smallest and largest amounts of their addresses, and 600 seconds for the invoice expiry (the nodes set it). The privacy audit counts the gateway's public HTTP listener under "Ports are open next to the service": it is meant to be public.

## Files in the data directory

| File | What |
| --- | --- |
| `gateway.key` | the key that asks nodes for invoices |
| `admin.key` | the key the nodes list as admin, and the console's sign-in identity |
| `admin.token` | the web interface's sign-in token |
| `network.json` | relays and proxies saved by an admin, as changes over the configuration (owner-only; read and written only while remote settings are on; one that cannot be read or does not fit is not used, and the warnings say why) |
| `audit.jsonl` | one JSON line per network change, by admin key or `gateway` for what the gateway did itself; kept under 1 MiB |

## Health

`GET /healthz` answers `{"status":"ok"}` (200) while at least one node answers, `{"status":"degraded"}` (503) otherwise, and nothing more.

The gateway keeps no record of invoices or payments: the node keeps them (see [node configuration](./node.md#invoices-and-payments)).
