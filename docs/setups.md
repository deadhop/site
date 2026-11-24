---
title: Deployment setups
description: Ten ways to deploy deadhop and its tools, from one box next to your node to a hidden service with its own onion relay. What runs where, the settings, the steps.
---

# Deployment setups

Each setup below says which machine runs what, the settings that make it, and the guides to follow in order. Start from the one closest to what you want; most combine. [Choose a setup](./install.md) explains the three choices behind them.

Settings go in `.env` next to `compose.yaml` (or the service's environment under systemd). Only what differs from the defaults is shown.

## 1. Shop next to the node

You invoice customers yourself from the dashboard. One machine does everything.

| Machine | Runs |
| --- | --- |
| Your node box | Bitcoin Core and Fulcrum or electrs (already there); deadhop with Compose: `wallet`, `deadhop`, `dashboard`; Caddy for HTTPS |

```sh
DEADHOP_ELECTRUM=192.168.1.20:50001       # the box's address on your network, not 127.0.0.1
DEADHOP_ADMINS=npub1you…
DEADHOP_NAME=Corner Bakery
```

1. [Run it with Docker Compose](./deploy-compose.md), steps 1 to 7.
2. [Host the dashboard](./dashboard.md#with-compose): Caddy in front of `127.0.0.1:8080`.
3. [Production checklist](./deployment.md).

**Tested** on regtest with this `compose.yaml`, except Caddy.

## 2. Straight to cold storage

Payments go to your hardware wallet. The server holds nothing that can spend, and there is no recovery phrase on it to back up.

| Machine | Runs |
| --- | --- |
| Your node box | As in setup 1 |
| Your computer | Sparrow (or your wallet's app), watching the same account, with a raised gap limit |

```sh
DEADHOP_ELECTRUM=192.168.1.20:50001
DEADHOP_ADMINS=npub1you…
DEADHOP_XPUB=zpub6…                       # your hardware wallet's Native SegWit account
```

1. [Receive to your own wallet](./xpub/index.md): copy the key from your wallet's guide.
2. [Run it with Docker Compose](./deploy-compose.md). The `wallet` container sees `DEADHOP_XPUB` and generates nothing.
3. Compare the logged first address with your wallet's first address.
4. Raise the gap limit in your wallet, and again as **addresses created** grows.

## 3. Hands-off cold storage

You start with a generated wallet, and the sweeper moves its balance to your cold wallet past a threshold.

| Machine | Runs |
| --- | --- |
| Your node box | As in setup 1, plus `sweeper` (the `sweep` profile) |
| Anywhere | Your cold wallet, which only needs to receive |

```sh
DEADHOP_ELECTRUM=192.168.1.20:50001
DEADHOP_ADMINS=npub1you…
DEADHOP_WALLET_DESTINATION=zpub6…         # your cold wallet's account key
DEADHOP_WALLET_THRESHOLD_SAT=2000000
DEADHOP_WALLET_MAX_FEE_RATE=20
```

1. [Run it with Docker Compose](./deploy-compose.md), and write down the words.
2. [Sweep to your cold wallet](./wallet/sweep.md): `docker compose --profile sweep up -d --build`.
3. For more privacy on the way out: [PayJoin](./wallet/payjoin.md) or [CoinJoin](./wallet/coinjoin.md).

**Tested** on regtest: a send sweep of two paid invoices.

## 4. Pay button on your website

Visitors create invoices from your web page. Each request carries proof of work and is rate limited; your backend checks the payment before it ships anything.

| Machine | Runs |
| --- | --- |
| Your node box | deadhop, as in setup 1 or 2 |
| Your web server | Your site, with `@deadhop/react`, `@deadhop/solid`, `@deadhop/svelte` or `@deadhop/client`; a check of each invoice before fulfilment |

```sh
DEADHOP_ELECTRUM=192.168.1.20:50001
DEADHOP_ADMINS=npub1you…
DEADHOP_XPUB=zpub6…
DEADHOP_PUBLIC_INVOICING=true
DEADHOP_POW_BITS=20                       # the default; raise it if you are flooded
```

1. Setup 1 or 2 for the service.
2. [Add payments to your app](./integrate.md), then your framework's guide.
3. [Backend](./integrate-backend.md#check-before-you-fulfil): check every invoice with `getInvoice(id)` before you fulfil.

The page needs the service's public key (`docker compose run --rm --no-deps deadhop pubkey`) and the relays it listens on.

## 5. Your shop's backend creates invoices

Nobody but you and your backend can create an invoice. Your backend makes one per order and the page only shows it.

| Machine | Runs |
| --- | --- |
| Your node box | deadhop, as in setup 1 or 2 |
| Your web server | Your backend, with `@deadhop/client` and a key of its own |

```sh
DEADHOP_ELECTRUM=192.168.1.20:50001
DEADHOP_ADMINS=npub1you…,npub1backend…   # your key and the backend's
DEADHOP_XPUB=zpub6…
```

1. Setup 1 or 2 for the service.
2. [Backend](./integrate-backend.md): give it a key, create invoices, check before you fulfil.
3. Show the invoice with your framework's `Invoice` component ([Add payments to your app](./integrate.md)).

An operator key can also manage the service: keep the backend's key on the server, never in a browser.

## 6. Nobody can find it

Relays learn nothing about where the service runs. Combine with any setup above.

| Machine | Runs |
| --- | --- |
| Your node box | deadhop, and Tor with its SOCKS port reachable from the service |
| Optional, anywhere | Your own [relay as an onion service](./relay/networks.md) |

```sh
DEADHOP_PROXY=socks5://<tor address>:9050
DEADHOP_PROXY_LOCKED=true                 # nobody can change it from the dashboard
DEADHOP_PROXY_OFFLINE=kill_switch         # the default: no proxy, no relay connections
DEADHOP_RELAYS=wss://relay.contextvm.org,ws://<your relay>.onion
```

1. [Hide the service](./hide.md).
2. Optionally, setup 7 with the relay on Tor.
3. Check the privacy score on the dashboard's Overview.

**Not run** against a real Tor daemon. With Compose, `<tor address>` is a Tor container on the same Docker network or the host's address on your network; `127.0.0.1` would be the container itself.

## 7. Your own relay next to public ones

A relay that carries only your service's messages, so a busy or unfriendly public relay never stands between you and your customers.

| Machine | Runs |
| --- | --- |
| Your node box | deadhop |
| A small VPS (or the node box) | `deadhop-relay`, with Caddy for TLS |

On the relay's host:

```sh
DEADHOP_RELAY_WHITELIST=invoices=npub1…,admin=npub1…
DEADHOP_RELAY_PUBLIC_URLS=wss://relay.example.com
```

On the deadhop host:

```sh
DEADHOP_RELAYS=wss://relay.example.com,wss://relay.contextvm.org,wss://nos.lol
```

1. The service's two keys: `docker compose run --rm --no-deps deadhop pubkey` and `… pubkey admin` (as `npub`, use the dashboard's Overview).
2. [Relay quick start](./relay/quickstart.md), then [Deploy it](./relay/deployment.md).
3. Restart deadhop with the new relay list, or add the relay under **Network** in the dashboard.

deadhop sends every reply to every relay and takes the first that accepts it, so one more relay never slows anything down.

## 8. Admin traffic stays at home

Customers use public relays; you reach the dashboard through a relay on your own network.

| Machine | Runs |
| --- | --- |
| Your node box | deadhop, and `deadhop-relay` whitelisting the admin key only |

See the relay's [On your home network, for admin traffic](./relay/deployment.md#on-your-home-network-for-admin-traffic). In the dashboard's **Network** tab, give the home relay to the administration key only, and set `DEADHOP_DASHBOARD_ADMIN_RELAYS` to it with Compose.

## 9. Lightning too

A Lightning address for your Lightning node, next to on-chain payments. lnaddr is separate from the payment service: run either or both.

| Machine | Runs |
| --- | --- |
| Your node box | Your Lightning node (LND, Core Lightning, phoenixd or LNbits), and `lnaddr-node` |
| A small VPS with your domain | `lnaddr-gateway`, behind your reverse proxy |

1. [lnaddr quick start](./lnaddr/quickstart.md).
2. [Connect your Lightning backend](./lnaddr/backends.md) with an invoice-only credential.
3. [Put it behind a reverse proxy](./lnaddr/reverse-proxies.md).

## 10. No Docker

One binary under systemd, your own wallet's key, and the dashboard as static files.

| Machine | Runs |
| --- | --- |
| Your node box | `deadhop` under systemd |
| Any static host | The dashboard's `dist/` with its `config.json` |

1. [Run it under systemd](./deploy-systemd.md).
2. [Host the dashboard](./dashboard.md#anywhere-else).
3. [Production checklist](./deployment.md).

**Not run** end to end on a systemd host.
