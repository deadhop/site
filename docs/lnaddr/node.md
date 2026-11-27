---
title: Node configuration
description: Configure lnaddr-node with built-in values, a TOML file, environment variables or settings from an admin key (addresses, limits, relays, proxies), and lock any source.
---

# Node configuration

## Where settings come from

Four layers, later ones winning (see [architecture](./architecture.md#configuration-layers)):

1. **Built-in**: compile a TOML file into the binary: `LNADDR_NODE_BUILTIN="$(cat node.toml)" cargo build --release`. Use it for appliances and images that should carry their own settings. Point at secret files; never put secrets in it.
2. **File**: `lnaddr-node --config /etc/lnaddr/node.toml`, or `LNADDR_NODE_CONFIG=/etc/lnaddr/node.toml`. `--config` wins when both are given.
3. **Environment**: `LNADDR_NODE_*` (below).
4. **Remote**: addresses and limits, and relays and proxies, saved over ContextVM by an admin key, when switched on.

The built-in layer and the file are both TOML with the same keys. The environment covers most of them, but not all: the [table of every setting](#every-setting) shows which name each setting has in each.

`lnaddr-node check` prints the configuration in effect (secrets as `(set)`) and which sources were read. Run it after every change.

## The TOML file

### Layout

The file has **top-level keys** and four **tables**: `[backend]`, `[limits]`, `[sources]`, and one `[addresses.NAME]` per address.

- **Top-level keys come first,** before the first `[table]` line. A key below a table header belongs to that table: `socks5 = "…"` written under `[backend]` means `backend.socks5`, which does not exist.
- **Unknown keys are refused.** A misspelled or misplaced key stops the node at start with an error naming it (`unknown field …`), so nothing is ever ignored silently.
- **Values have TOML types:** text in double quotes (`"lnd"`), lists in brackets (`["wss://a", "wss://b"]`), numbers bare (`600`), switches `true` or `false` (not `"on"`).
- **A table can be written three ways,** all equal. Use whichever reads best:

  ```toml
  sources = { remote = true }     # an inline table, at the top level
  # or
  sources.remote = true           # a dotted key, at the top level
  # or
  [sources]                       # a table header
  remote = true
  ```

- **Address names with a dot need quotes** in the header: `[addresses."first.last"]`. Names without one need none: `[addresses.you]`.

### A complete file

Every key is shown; all are optional except `backend.kind`, the credential, and `gateways` or `admins`.

```toml
# Top-level keys: before any [table].
data_dir = "/var/lib/lnaddr-node"
relays = ["wss://relay.contextvm.org", "wss://relay2.contextvm.org"]
gateways = ["npub1gw…"]          # may ask for invoices
admins = ["npub1admin…"]         # may also read status and change addresses
network = "bitcoin"              # bitcoin, testnet, signet or regtest
socks5 = "127.0.0.1:9050"        # reach relays through Tor (or an http:// / https:// CONNECT proxy)
proxy_locked = true              # proxies can only be changed here, never remotely

[backend]
kind = "lnd"                     # lnd, cln, phoenixd or lnbits
url = "https://127.0.0.1:8080"
secret_file = "/var/lib/lnaddr-node/invoice.macaroon"
tls_cert_file = "/var/lib/lnd/tls.cert"   # pinned exactly
# tls_cert_sha256 = "3f:a1:…"    # or the certificate's fingerprint
timeout_secs = 10
# insecure_http = false

[limits]
invoices_per_minute = 120        # all callers together
per_caller_per_minute = 60       # one calling key
concurrent = 8                   # backend calls at once
invoice_expiry_secs = 600

[sources]
remote = true                    # let admins change addresses, limits, relays and proxies

[addresses.you]
min_sendable = 1000              # millisatoshis
max_sendable = 1000000000
description = "Pay you"
comment_allowed = 140            # LUD-12; 0 for none
domains = ["yourdomain.com"]     # empty: any domain the gateway serves

[addresses."shop.tips"]
min_sendable = 21000
max_sendable = 100000000
description = "Tips for the shop"
```

## Every setting

### Top level

| TOML key | Environment variable | Value | Default |
| --- | --- | --- | --- |
| `data_dir` | `LNADDR_NODE_DATA_DIR` | a directory path; holds the key and saved settings | `~/.local/share/deadhop-lnaddr/node` (`/data` in the image) |
| `relays` | `LNADDR_NODE_RELAYS` | relay URLs: `wss://`, or `ws://` for loopback, `.onion` and `.i2p` only; no user name or password | `["wss://relay.contextvm.org", "wss://relay2.contextvm.org"]` |
| `gateways` | `LNADDR_NODE_GATEWAYS` | keys (npub or hex) that may ask for invoices | none; `gateways` or `admins` must list a key |
| `admins` | `LNADDR_NODE_ADMINS` | keys (npub or hex) that may also read status and change settings | none |
| `network` | `LNADDR_NODE_NETWORK` | `bitcoin` (or `mainnet`), `testnet`, `signet`, `regtest` | `bitcoin` |
| `socks5` | `LNADDR_NODE_SOCKS5` | proxy for relay connections: `IP:port` (SOCKS5), or a `socks5://`, `http://` or `https://` (CONNECT) URL | none: straight connections |
| `proxy_locked` | `LNADDR_NODE_PROXY_LOCKED` | keep the proxies host-only: admins cannot change them, test new ones or look up I2P names | `false` |

### `[backend]`

| TOML key | Environment variable | Value | Default |
| --- | --- | --- | --- |
| `backend.kind` | `LNADDR_NODE_BACKEND` | `lnd`, `cln` (or `clnrest`), `phoenixd`, `lnbits` | required |
| `backend.url` | `LNADDR_NODE_BACKEND_URL` | `https://`, or `http://` to loopback, private addresses, container names, `.local`, `.internal`, `.onion`, `.i2p` | LND `https://127.0.0.1:8080`, CLN `https://127.0.0.1:3010`, phoenixd `http://127.0.0.1:9740`, LNbits `http://127.0.0.1:5000` |
| `backend.secret_file` | `LNADDR_NODE_BACKEND_SECRET_FILE` | path to the credential; a binary file (an LND macaroon) is read as hex. Must be readable by its owner only (`chmod 600`) | one of `secret_file` and `secret` is required |
| `backend.secret` | `LNADDR_NODE_BACKEND_SECRET` | the credential itself (prefer the file) | none |
| `backend.tls_cert_file` | `LNADDR_NODE_BACKEND_TLS_CERT_FILE` | the backend's PEM certificate (LND's `tls.cert`); its first certificate is pinned exactly | none |
| `backend.tls_cert_sha256` | `LNADDR_NODE_BACKEND_TLS_CERT_SHA256` | the certificate's SHA-256 fingerprint in hex (colons allowed); several comma-separated while rotating | none: checked against the public authorities |
| `backend.timeout_secs` | `LNADDR_NODE_BACKEND_TIMEOUT_SECS` | seconds per backend call; values outside 1 to 60 are brought into it | `10` |
| `backend.insecure_http` | `LNADDR_NODE_BACKEND_INSECURE_HTTP` | allow `http://` to a public host (sends the credential in the clear) | `false` |

If both `secret` and `secret_file` are set, `secret` is used. If both `tls_cert_sha256` and `tls_cert_file` are set, `tls_cert_sha256` is used. This holds whichever layers they come from: a `backend.secret` in the file beats `LNADDR_NODE_BACKEND_SECRET_FILE` in the environment.

### `[limits]`

File only (built-in or file): no environment variables. With remote settings on, an admin can change all but `concurrent`.

| TOML key | Value | Default |
| --- | --- | --- |
| `limits.invoices_per_minute` | invoices per minute for all callers together, at least 1 | `120` |
| `limits.per_caller_per_minute` | invoices per minute for one calling key, at least 1 | `60` |
| `limits.concurrent` | backend calls at once, 1 to 256 | `8` |
| `limits.invoice_expiry_secs` | how long each invoice stays payable, 60 to 86400 | `600` |

A value out of range stops the node at start with the reason.

### `[addresses.NAME]`

One table per address. `NAME` is the part before the `@`: 1 to 64 characters of lower-case `a-z`, `0-9`, `-`, `_` and `.`.

| TOML key | Value | Default |
| --- | --- | --- |
| `min_sendable` | smallest payment, in **millisatoshis** (1000 = 1 sat), at least 1 | required |
| `max_sendable` | largest payment, in millisatoshis, at least `min_sendable` and at most 10,000,000,000,000 | required |
| `description` | what the payer's wallet shows, 1 to 640 printable characters | required |
| `comment_allowed` | longest comment a payer may attach (LUD-12), 0 to 2000; 0 for none | `0` |
| `domains` | lower-case domains this address is served under | `[]`: any domain the gateway serves |

phoenixd and LNbits make invoices in whole satoshis, so with them the range must hold at least one whole satoshi.

The environment can only give names: `LNADDR_NODE_ADDRESSES=alice,bob` serves each with `min_sendable = 1000` (1 sat), `max_sendable = 1000000000` (1,000,000 sat), `description = "Pay alice"`, no comments and any domain. For other values, use the file.

### `[sources]`

| TOML key | Environment variable | Value | Default |
| --- | --- | --- | --- |
| `sources.file` | none | read the file | `true` |
| `sources.env` | none | read the `LNADDR_NODE_*` variables | `true` |
| `sources.remote` | `LNADDR_NODE_REMOTE` | let admins change addresses, limits, relays and proxies | `false` |

A source switched off by one layer stays off: a later layer cannot switch it back on. So only the built-in layer can switch off the file, and the built-in layer or the file can switch off the environment. To run **only** on built-in values, build with:

```toml
sources = { file = false, env = false, remote = false }
```

### Environment only

| Variable | Meaning |
| --- | --- |
| `LNADDR_NODE_CONFIG` | the TOML file to read (`--config` wins) |
| `LNADDR_NODE_LOG` | log filter, e.g. `debug` (default `warn,deadhop_lnaddr=info`) |
| `LNADDR_NODE_BUILTIN` | at **build** time: the TOML text compiled in as the built-in layer |

## How the layers combine

Each layer only changes what it sets. For each kind of setting:

| Kind | Settings | A later layer… |
| --- | --- | --- |
| single values | `data_dir`, `network`, `socks5`, `proxy_locked`, every `backend.*` and `limits.*` key | replaces that value; the other keys of the same table stay |
| lists | `relays`, `gateways`, `admins` | replaces the **whole list**: lists are never added together |
| addresses | `[addresses.NAME]` | adds its names; a name already defined is **replaced whole** |
| sources | `sources.*` | can switch a source off for good, or switch on one nobody switched off |

What that means in practice:

- `LNADDR_NODE_RELAYS=wss://relay.example.com` drops the file's relays (and the defaults). List every relay you want.
- `LNADDR_NODE_ADDRESSES=you` next to a file with `[addresses.you]` replaces your custom range and description with the defaults (1 to 1,000,000 sat, "Pay you"). Define each address in one place.
- An empty variable (`LNADDR_NODE_RELAYS=`) counts as unset.
- With remote settings on, a saved address table (`remote.toml`) replaces the whole configured table, and saved limits replace the keys they set.

## From environment variables to TOML

The rule: drop `LNADDR_NODE_`, write the rest in lower case, and put `BACKEND_*` variables in `[backend]`. The exceptions:

| Environment variable | TOML |
| --- | --- |
| `LNADDR_NODE_BACKEND=lnd` | `kind = "lnd"` in `[backend]` |
| `LNADDR_NODE_BACKEND_URL`, `_SECRET_FILE`, `_SECRET`, `_TLS_CERT_FILE`, `_TLS_CERT_SHA256`, `_TIMEOUT_SECS`, `_INSECURE_HTTP` | `url`, `secret_file`, `secret`, `tls_cert_file`, `tls_cert_sha256`, `timeout_secs`, `insecure_http` in `[backend]` |
| `LNADDR_NODE_REMOTE=on` | `remote = true` in `[sources]` |
| `LNADDR_NODE_ADDRESSES=you,shop` | one `[addresses.NAME]` table per name, each with `min_sendable`, `max_sendable` and `description` |
| comma-separated lists | TOML lists: `"a,b"` becomes `["a", "b"]` |
| `on` / `off` | `true` / `false` |

In the environment, lists are comma-separated (spaces around entries are dropped), switches take `1`, `true`, `yes` or `on` and `0`, `false`, `no` or `off`, and numbers are plain digits.

For example, this environment:

```sh
LNADDR_NODE_BACKEND=lnd
LNADDR_NODE_BACKEND_URL=https://127.0.0.1:8080
LNADDR_NODE_BACKEND_SECRET_FILE=/var/lib/lnaddr-node/invoice.macaroon
LNADDR_NODE_BACKEND_TLS_CERT_FILE=/var/lib/lnd/tls.cert
LNADDR_NODE_GATEWAYS=npub1gw…
LNADDR_NODE_RELAYS=wss://relay.contextvm.org,wss://relay.example.com
LNADDR_NODE_SOCKS5=127.0.0.1:9050
LNADDR_NODE_PROXY_LOCKED=on
LNADDR_NODE_ADDRESSES=you
```

is this file:

```toml
gateways = ["npub1gw…"]
relays = ["wss://relay.contextvm.org", "wss://relay.example.com"]
socks5 = "127.0.0.1:9050"
proxy_locked = true

[backend]
kind = "lnd"
url = "https://127.0.0.1:8080"
secret_file = "/var/lib/lnaddr-node/invoice.macaroon"
tls_cert_file = "/var/lib/lnd/tls.cert"

[addresses.you]
min_sendable = 1000
max_sendable = 1000000000
description = "Pay you"
```

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

The standalone network console (`console/` in [deadhop/js](https://github.com/deadhop/js)) manages these settings from a browser: it signs in with an admin key over ContextVM and reads `get_info`, `get_network`, `get_health`, `get_relay_history`, `check_relays`, `check_proxy`, `resolve_i2p_name` and `get_privacy_audit`, and saves with `update_network`. Only admins are answered; a gateway never sees these tools. The node's `get_info` answers in the shape the console expects (the payment fields are fixed: no public invoicing, no proof of work). The node accepts only ephemeral gift wraps (kind 21059), so the console's client must send those.

The privacy audit on the node has no Electrum checks (it has no chain backend), never announces itself, and names `LNADDR_NODE_PROXY_LOCKED` for the proxy lock (or, with remote settings off, `LNADDR_NODE_REMOTE`).

The gateway runs its relays on the same engine and serves the same console tools to its own admins: see [gateway configuration](./gateway.md#relays-and-proxies).
