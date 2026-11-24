---
title: Choose a setup
description: Pick how you run deadhop, where payments land and who creates invoices, then follow the guides for that setup, from getting the source to the first payment.
---

# Choose a setup

deadhop runs next to your own bitcoin node. Three choices decide your setup. Each answer below links to the guide that does it.

<div class="choices">
  <a href="./quickstart.html"><strong>Just looking?</strong><span>Run everything on a throwaway test chain on your laptop and pay an invoice. Needs Rust, Node, Docker and just; nothing to configure.</span><em>Tutorial · minutes, after one build</em></a>
  <a href="./first-payment.html"><strong>Ready for real money?</strong><span>The whole path on one machine next to your node, from the source to a payment you can spend.</span><em>Tutorial · about an hour</em></a>
</div>

## What you need

- **A bitcoin node with an Electrum server**: Bitcoin Core with Fulcrum or electrs, which most node packages offer. deadhop asks it about your addresses, so use your own. See [Connect your Electrum server](./electrum.md).
- **A machine to run deadhop on**: the node itself is fine. It needs outbound access to the internet and to the Electrum server, and nothing inbound.

**On a node package** (Umbrel, Start9, RaspiBlitz, myNode and the like): these run Bitcoin Core with electrs or Fulcrum, and their app shows the Electrum server's address and port. deadhop is not packaged for any of them. Run it with Docker Compose wherever Compose runs: on the node box if your package allows it, or on another Linux machine on the same network, pointed at that address ([Connect your Electrum server](./electrum.md), including [a server with no TLS port](./electrum.md#a-server-with-no-tls-port)).
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
| **Docker Compose** (recommended) | The service, an offline wallet, the dashboard, and an optional sweeper, each locked down: read-only, no capabilities, no published port | [Run it with Docker Compose](./deploy-compose.md) |
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

Each one in detail, with what runs on which machine and its settings: [Deployment setups](./setups.md).

<div class="choices">
  <a href="./setups.html#_1-shop-next-to-the-node"><strong>Shop next to the node</strong><span>Compose on the node box, a generated wallet, the dashboard behind your TLS proxy. You invoice customers by hand.</span><em>Compose · generated wallet · only you</em></a>
  <a href="./setups.html#_2-straight-to-cold-storage"><strong>Straight to cold storage</strong><span>Your hardware wallet's account key, so nothing on the server can spend. Raise the wallet's gap limit and you are done.</span><em>Compose · your own wallet · only you</em></a>
  <a href="./setups.html#_3-hands-off-cold-storage"><strong>Hands-off cold storage</strong><span>A generated wallet takes the payments; the sweeper moves them to your cold wallet past a threshold you set.</span><em>Compose · generated, then swept</em></a>
  <a href="./setups.html#_4-pay-button-on-your-website"><strong>Pay button on your website</strong><span>Visitors create invoices with proof of work; your backend checks every payment before it ships the order.</span><em>Any · public invoicing</em></a>
  <a href="./setups.html#_5-your-shop-s-backend-creates-invoices"><strong>Your backend creates invoices</strong><span>One invoice per order from your server's own key; nobody else can create one.</span><em>Any · operator key on the backend</em></a>
  <a href="./setups.html#_6-nobody-can-find-it"><strong>Nobody can find it</strong><span>All relay traffic through Tor, the proxy locked against remote changes, onion relays, and nothing listening.</span><em>Add to any setup</em></a>
  <a href="./setups.html#_7-your-own-relay-next-to-public-ones"><strong>Your own relay</strong><span>deadhop relay carries only your service's messages, on clearnet, Tor, I2P or FIPS, next to public relays.</span><em>Tool · add to any setup</em></a>
  <a href="./setups.html#_8-admin-traffic-stays-at-home"><strong>Admin traffic stays at home</strong><span>Customers use public relays; your dashboard goes through a relay on your own network.</span><em>Tool · add to any setup</em></a>
  <a href="./setups.html#_9-lightning-too"><strong>Lightning too</strong><span>deadhop lnaddr gives your Lightning node an address like you@yourdomain, with no port open at home.</span><em>Tool · separate from payments</em></a>
  <a href="./setups.html#_10-no-docker"><strong>No Docker</strong><span>One binary under systemd, your own wallet's key, the dashboard on any static host.</span><em>systemd · your own wallet</em></a>
</div>

## Before the first real payment

Go through the [production checklist](./deployment.md). Two items matter most:

1. **The first address.** The service logs the address at index 0 when it starts. Your wallet must list that exact address. If it does not, stop: payments would go where your wallet cannot see them.
2. **The recovery phrase.** With a generated wallet, write the 24 words down before you take a payment (`deadhop wallet export`). The dashboard warns until you have.
