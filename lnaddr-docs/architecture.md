---
title: Architecture
description: The two services, the ContextVM tools between them, the configuration layers, and why the work is split this way.
---

# Architecture

## The problem

LUD-16 makes a Lightning address an HTTPS endpoint on your domain. Two requests make up one payment:

1. `GET /.well-known/lnurlp/<name>`: the address's parameters (amount range, metadata, callback URL).
2. `GET <callback>?amount=<msat>[&comment=…]`: a BOLT11 invoice for that amount, whose description hash is the SHA-256 of the metadata from step 1.

Only step 2 needs the Lightning node. A node at home normally cannot be reached from the internet, and should not be.

## The split

| | `lnaddr-node` | `lnaddr-gateway` |
| --- | --- | --- |
| Runs | next to the Lightning node | on a public host, behind a reverse proxy |
| Listens on | nothing | one HTTP port or Unix socket (plus an optional admin port) |
| Holds | an invoice-only Lightning credential; its Nostr key | its Nostr key; optionally an admin key |
| Talks to | relays (outbound websockets); the Lightning backend | relays (outbound); wallets (inbound HTTP) |
| Decides | which keys may call; every bound on every invoice | which domains and names it serves; who it rate-limits |

The two meet only through Nostr relays. Each request is a ContextVM (MCP over Nostr) call, NIP-44 encrypted and gift-wrapped to the node's key, as an ephemeral event (kind 21059) that relays forward and do not store.

## The tools on the node

The node is an MCP server with seven tools. Gateways may call the first two; admins may call all seven.

| Tool | Who | What |
| --- | --- | --- |
| `list_addresses` | gateways, admins | every address with its range, description, comment length and domains; the network; the Lightning key that signed the last invoice |
| `make_invoice` | gateways, admins | an invoice for `name@domain` and an amount, committing to the LUD-06 metadata |
| `get_status` | admins | backend, counters, last error, uptime |
| `get_config` | admins | the configuration in effect, secrets shown as `(set)` |
| `set_address` / `remove_address` | admins | change the address table (when remote settings are on) |
| `set_limits` | admins | change invoice rates and expiry (when remote settings are on) |

Inputs refuse unknown fields; outputs have published JSON schemas.

## One payment, step by step

1. The wallet asks the gateway for `/.well-known/lnurlp/you`. The gateway answers **from its cache** of the node's `list_addresses`. Nothing crosses Nostr.
2. The wallet calls back with an amount. The gateway checks the name, domain, amount and comment against the cached values, rate-limits the client, and calls `make_invoice` on the node.
3. The node checks the caller's key, the request's timestamp, its **own** bounds and its own rate limits. It builds the metadata string itself, asks the backend for an invoice committing to its SHA-256, and checks the invoice it gets back.
4. The gateway checks the invoice again (amount, description hash, network, expiry and, if pinned, the signing node key) and returns it to the wallet.

Both sides build the metadata with the same function, so the string the wallet saw in step 1 is byte for byte the string the invoice commits to in step 3.

## Configuration layers

The node takes its settings from up to four layers, each later one winning:

1. **Built-in**: TOML compiled into the binary (`LNADDR_NODE_BUILTIN` at build time).
2. **File**: TOML at `LNADDR_NODE_CONFIG` or `--config FILE`.
3. **Environment**: `LNADDR_NODE_*`.
4. **Remote**: addresses and limits saved by an admin over ContextVM, kept in `remote.toml` in the data directory.

Any layer can switch a later source off with `sources = { file = false, env = false, remote = false }`, and nothing later can switch it back on. A binary built with every later source off runs on its built-in values only. Remote settings are off unless switched on. They can only ever touch addresses and limits: never the backend, the credential, the certificate pin, the allowed keys, the relays or the data directory. The gateway has the first three layers.

## Why this shape

- **Stateless calls.** The gateway's ContextVM client answers the MCP handshake locally and sends each call as one request event. Neither side keeps a session, so a restarted node is usable at once and there is no session to go stale.
- **The node trusts nothing from the gateway.** The gateway is the box on the internet. The node enforces amounts, comments, domains and rates itself, so a compromised gateway can only ask for invoices the node would make anyway.
- **One public prefix.** The callback lives under the address's own path (`/.well-known/lnurlp/<name>/callback`), so a reverse proxy forwards one location and nothing else.
