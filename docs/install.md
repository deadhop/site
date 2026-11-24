---
title: Choose a setup
description: Pick how you run deadhop, where payments land and who creates invoices, then follow the guides for that setup, from getting the source to the first payment.
---

# Choose a setup

deadhop runs next to your own bitcoin node. Three choices decide your setup. Each answer below links to the guide that does it.

<div class="choices">
  <a href="./quickstart.html"><strong>Just looking?</strong><span>Run everything on a throwaway test chain on your laptop and pay an invoice. Nothing to configure.</span><em>Tutorial · 10 minutes</em></a>
  <a href="./first-payment.html"><strong>Ready for real money?</strong><span>The whole path on one machine next to your node, from the source to a payment you can spend.</span><em>Tutorial · about an hour</em></a>
</div>

## What you need

- **A bitcoin node with an Electrum server**: Bitcoin Core with Fulcrum or electrs, which most node packages offer. deadhop asks it about your addresses, so use your own. See [Connect your Electrum server](./electrum.md).
- **A machine to run deadhop on**: the node itself is fine. It needs outbound access to the internet and to the Electrum server, and nothing inbound.
- **Docker with Compose**, or Rust 1.88 and Node 22 to build it yourself.
- **A Nostr key for yourself**, in a browser extension (NIP-07). It is how you sign in to the dashboard. There are no accounts or passwords.

## Get the source

Every deadhop product is built from this repository:

```sh
git clone https://github.com/sandwichfarm/deadhop
cd deadhop
```

There are no published images or binaries yet: the guides build them from the source.

## 1. How it runs

| | What you get | Guide |
| --- | --- | --- |
| **Docker Compose** (recommended) | The service, an offline wallet, the dashboard, and an optional sweeper, each locked down: read-only, no capabilities, no published port except the dashboard's | [Run it with Docker Compose](./deploy-compose.md) |
| **systemd** | One binary under a supervisor, and the dashboard as static files on any web server | [Run it under systemd](./deploy-systemd.md) |

## 2. Where payments land

deadhop never holds a key that can spend. It only needs your wallet's **account public key** to make a fresh address for every invoice. [Why that is safe](./watch-only.md).

| | Choose it when | Guide |
| --- | --- | --- |
| **Your own wallet** | You already have a wallet or a hardware wallet. Payments go straight to it, and the server holds nothing worth stealing. | [Receive to your own wallet](./xpub/index.md) |
| **A generated wallet** | You want to start now. Compose makes a wallet in a container with no network; you write down its 24 words. Meant for small balances. | [Run it with Docker Compose](./deploy-compose.md#_4-write-down-the-recovery-phrase) |
| **Generated, then swept** | You want the generated wallet's balance moved to your cold wallet on its own, by a plain send, a PayJoin or a CoinJoin. | [Sweep to your cold wallet](./wallet/sweep.md) |

## 3. Who creates invoices

| | Choose it when | Guide |
| --- | --- | --- |
| **Only you** (the default) | You send invoices yourself from the dashboard. Nobody else can create one. | [Host the dashboard](./dashboard.md) |
| **Your shop's backend** | Your server creates an invoice per order with an operator key, and the page only shows it. | [Backend](./integrate-backend.md) |
| **Anyone, with proof of work** | A pay button or a donation page where the visitor's browser creates the invoice. Each request costs some work and is rate limited. | [Add payments to your app](./integrate.md) |

## Common setups

<div class="choices">
  <a href="./first-payment.html"><strong>Shop next to the node</strong><span>Compose on the node box, a generated wallet, the dashboard behind your TLS proxy. You invoice customers by hand.</span><em>Compose · generated wallet · only you</em></a>
  <a href="./xpub/index.html"><strong>Straight to cold storage</strong><span>Your hardware wallet's account key, so nothing on the server can spend. Raise the wallet's gap limit and you are done.</span><em>Compose · your own wallet · only you</em></a>
  <a href="./integrate.html"><strong>Pay button on a website</strong><span>React, Solid, Svelte or plain JavaScript components. Your backend checks every payment before it ships the order.</span><em>Any · your own wallet · your backend</em></a>
  <a href="./wallet/sweep.html"><strong>Hands-off cold storage</strong><span>A generated wallet takes the payments; the sweeper moves them to your cold wallet past a threshold you set.</span><em>Compose · generated, then swept</em></a>
  <a href="./hide.html"><strong>Nobody can find it</strong><span>All relay traffic through Tor or a VPN, the proxy locked against remote changes, onion relays, and nothing listening.</span><em>Any · add to any setup</em></a>
  <a href="./relay/quickstart.html"><strong>Your own relay</strong><span>deadhop relay carries only your service's messages, on clearnet, Tor, I2P or FIPS. Use it next to public relays.</span><em>Tool · add to any setup</em></a>
  <a href="./lnaddr/quickstart.html"><strong>Lightning too</strong><span>deadhop lnaddr gives your Lightning node an address like you@yourdomain, with no port open at home.</span><em>Tool · separate from payments</em></a>
</div>

## Before the first real payment

Go through the [production checklist](./deployment.md). Two items matter most:

1. **The first address.** The service logs the address at index 0 when it starts. Your wallet must list that exact address. If it does not, stop: payments would go where your wallet cannot see them.
2. **The recovery phrase.** With a generated wallet, write the 24 words down before you take a payment (`deadhop wallet export`). The dashboard warns until you have.
