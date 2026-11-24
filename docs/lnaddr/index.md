---
title: Overview
description: deadhop lnaddr gives a Lightning node with no public address a Lightning address. A public gateway asks the node for each invoice over ContextVM.
---

# deadhop lnaddr

A Lightning address (`you@yourdomain`, [LUD-16](https://github.com/lnurl/luds/blob/luds/16.md)) is a web endpoint. A wallet fetches `https://yourdomain/.well-known/lnurlp/you`, then calls back for an invoice. From a node at home, that usually means a VPN, a tunnel or a forwarded port. Each gives your node's network a way in, and each needs looking after.

deadhop lnaddr splits the job in two:

- **The node service** (`lnaddr-node`) runs next to your Lightning node. It opens **no port**. It connects out to Nostr relays and answers invoice requests over [ContextVM](https://contextvm.org) (MCP over Nostr), end-to-end encrypted, and only from keys you list.
- **The gateway** (`lnaddr-gateway`) runs on any public host behind any reverse proxy. It serves the two LNURL paths. For every invoice it asks your node over Nostr, checks the invoice, and hands it to the wallet.

```text
wallet ──https──▶ reverse proxy ──▶ lnaddr-gateway ──Nostr relays──▶ lnaddr-node ──▶ LND / CLN / phoenixd / LNbits
                                     (public host)    (encrypted,       (your home,
                                                       outbound only)    no open port)
```

## What it is for

- **Nothing to reach at home.** The node service only dials out, so nothing at home listens, and changing ISP or network changes nothing.
- **Nothing to spend on the public host.** The gateway holds no Lightning credential. The node holds an invoice-only one: LND's `invoice.macaroon`, a Core Lightning rune limited to `method=invoice`, phoenixd's limited password, or an LNbits invoice key.
- **Two small static binaries.** No runtime, no system libraries, no certificates to install. Each image is about 8 MB on an empty base.

## Where to go next

- [Quick start](./quickstart.md): a node and a gateway in about ten minutes.
- [Architecture](./architecture.md): the parts, the messages between them, and why it is built this way.
- [Performance](./performance.md) and [hardening](./hardening.md): what keeps it fast and what keeps it up.
- [Security](./security.md): what each part can and cannot do if it is compromised.
