---
title: Overview
description: deadhop documentation. On-chain bitcoin payments from your own node with no open port, and the tools built the same way, by tutorial, how-to and reference.
---

# deadhop documentation

deadhop takes on-chain bitcoin payments for you from your own node. It never listens on a port: customers and operators reach it only through Nostr relays, with end-to-end encrypted messages ([ContextVM](https://contextvm.org)). It holds only your wallet's public key, so it cannot spend.

<div class="choices">
  <a href="./install.html"><strong>Install it</strong><span>Choose how it runs, where payments land and who creates invoices, then follow the guides for your setup.</span><em>Start here</em></a>
  <a href="./quickstart.html"><strong>Try it first</strong><span>The whole system on a throwaway test chain on your laptop, and an invoice paid, in ten minutes.</span><em>Tutorial</em></a>
  <a href="./integrate.html"><strong>Add it to a website</strong><span>Pay buttons and invoices for React, Solid, Svelte or plain JavaScript, and checking payments from your backend.</span><em>How-to</em></a>
</div>

## Four kinds of page

Every page says at the top which kind it is.

| Kind | Read it when | For example |
| --- | --- | --- |
| **Tutorial** | You are new and want to get something working, start to finish, on a setup chosen for you | [Your first real payment](./first-payment.md) |
| **How-to guide** | You know what you want and need the steps for your own setup | [Receive to your own wallet](./xpub/index.md) |
| **Explanation** | You want to understand how it works and why | [Watch-only wallets](./watch-only.md) |
| **Reference** | You need an exact setting, tool or command | [Configuration](./configuration.md) |

## Payments

| | |
| --- | --- |
| **Tutorials** | [Try it on regtest](./quickstart.md) · [Your first real payment](./first-payment.md) |
| **How-to guides** | [Choose a setup](./install.md) · [Docker Compose](./deploy-compose.md) · [systemd](./deploy-systemd.md) · [Your Electrum server](./electrum.md) · [Your own wallet](./xpub/index.md) · [Hide the service](./hide.md) · [Host the dashboard](./dashboard.md) · [Production checklist](./deployment.md) · [Add payments to your app](./integrate.md) |
| **Explanations** | [How it works](./how-it-works.md) · [Watch-only wallets](./watch-only.md) · [Design decisions](./design.md) · [Security](./security.md) · [Testing](./testing.md) |
| **Reference** | [Configuration](./configuration.md) · [Commands](./cli.md) · [Tools API](./api.md) · [Roadmap](./roadmap.md) · [Markdown and llms.txt](./agents.md) |

## Tools built the same way

Each one does one job with nothing to reach from outside.

| Tool | What it does | Start |
| --- | --- | --- |
| [Lightning address](./lnaddr/index.md) | you@yourdomain for a Lightning node at home with no open port. A gateway on a public host asks your node for each invoice over Nostr. | [Quick start](./lnaddr/quickstart.md) |
| [Relay](./relay/index.md) | A small Nostr relay that carries your service's messages and nothing else, on clearnet, Tor, I2P or FIPS. | [Quick start](./relay/quickstart.md) |
| [Sweeping wallet](./wallet/index.md) | Moves the generated wallet's balance to your cold wallet once it reaches a threshold, by a send, a PayJoin or a CoinJoin. | [Sweep to your cold wallet](./wallet/sweep.md) |

## Components of the payment service

| Part | Technology | Role |
| --- | --- | --- |
| Service (`server/`) | Rust, one binary (about 8 MB), SQLite | Issues invoices, polls the chain, answers requests |
| Dashboard (`dashboard/`) | Svelte 5 static page | Checkout for customers, overview for operators |
| Chain backend | Fulcrum or electrs | Reports transactions for each invoice address |
| Transport | Any Nostr relays | Carry encrypted requests and responses |

```
 customer / operator           relays                 your machine
 ┌──────────────────┐  wss  ┌────────────┐  wss  ┌──────────────────────────┐
 │ Svelte dashboard ├──────►│ Nostr      │◄──────┤ deadhop (Rust)           │
 │  Nostr identity  │       │ relay(s)   │       │  outbound only           │
 │  NIP-44 + NIP-13 │       │ ciphertext │       │  watch-only xpub, SQLite │
 └──────────────────┘       └────────────┘       └────────────┬─────────────┘
                                                              │ Electrum protocol
                                                      ┌───────▼────────┐
                                                      │ Fulcrum/electrs│
                                                      └────────────────┘
```
