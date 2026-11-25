---
title: Admin web and CLI
description: Watch and manage deadhop lnaddr from the gateway's optional web interface or its command line, including changing addresses on the node over ContextVM.
---

# Admin web and CLI

Both are optional. The gateway serves wallets without either.

## The admin key

Changing a node from the gateway uses a separate **admin key**, not the gateway's invoice key:

```sh
lnaddr-gateway admin-pubkey      # creates admin.key in the data directory
npub1admin…
```

Add it to the node's `admins` and switch on remote settings there (`LNADDR_NODE_REMOTE=on`). Without the admin key, the web interface is read only and the `node` commands refuse.

## Command line

```text
lnaddr-gateway status                       every node: reachable?, latency, addresses
lnaddr-gateway test NAME[@DOMAIN] [SATS]    a real invoice, fetched and checked as a wallet would
lnaddr-gateway node status [N]              the node's backend, counters, last error
lnaddr-gateway node config [N]              the node's configuration (no secrets)
lnaddr-gateway node set-address N NAME MIN_SATS MAX_SATS DESCRIPTION [COMMENT_CHARS]
lnaddr-gateway node remove-address N NAME
lnaddr-gateway node set-limits N PER_MINUTE PER_CALLER EXPIRY_SECS
```

`N` is the node's position in the configuration, starting at 1. The commands talk to the node over ContextVM directly; the gateway does not have to be running.

```text
$ lnaddr-gateway node set-address 1 tips 1 50000 "Tips for you" 140
backend   lnd at https://127.0.0.1:8080 (credential (set), pin none)
network   bitcoin
…
address   tips             1–50000 sat  comments 140  Tips for you
address   you              1–1000000 sat  comments 0  Pay you
```

## Web interface

Set `admin.listen` (for example `127.0.0.1:8081`) and sign in with the token from `lnaddr-gateway admin-token`. Reach it over SSH (`ssh -L 8081:127.0.0.1:8081 host`) or your VPN; do not publish it.

- **Overview**: invoices, lookups, failures, invoice latency (p50/p95), every node with its relays and latency, every address under every domain, recent failures.
- **Node**: the node's backend, network, counters, uptime and last error; its addresses with edit and remove; forms to add an address and to change limits. Changes are saved on the node and the gateway's cache refreshes at once.

It uses no JavaScript and works under a strict Content-Security-Policy. See [security](./security.md#the-admin-web-interface) for sessions and CSRF.

## The node's relays and proxies

Neither the web interface nor the CLI changes the node's relays or proxies. The standalone network console does, signed in with a key listed in the node's `admins` (see [node configuration](./node.md#the-network-console)). Every change is recorded in the node's `audit.jsonl`.

The gateway's own relays and proxies are managed the same way: the console signs in to the gateway's admin key (`lnaddr-gateway admin-pubkey`) with a key listed in the gateway's `admins` (see [gateway configuration](./gateway.md#relays-and-proxies)). Changes are recorded in the gateway's `audit.jsonl`.
