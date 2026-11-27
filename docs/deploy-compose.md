---
title: Run it with Docker Compose
description: Build and run deadhop, its offline wallet and the dashboard with Docker Compose next to your node, write down the recovery phrase and sign in.
---

# Run it with Docker Compose

`compose.yaml` in [deadhop/stack](https://github.com/deadhop/stack) runs four containers:

| Container | What it does | Network |
| --- | --- | --- |
| `wallet` | Generates a wallet on first start and keeps its recovery phrase. Hands only the account public key to the service. Idle if you give your own key. | **none at all** |
| `deadhop` | The payment service. Watch-only. | outbound only: relays and your Electrum server |
| `dashboard` | The dashboard as static files, on port 8080 inside Docker. | serves HTTP |
| `sweeper` | Optional, off unless you ask for it: moves the balance to your cold wallet. See [Sweep to your cold wallet](./wallet/sweep.md). | outbound only |

Every container has a read-only root filesystem, no Linux capabilities and a memory limit. None publishes a port to the host unless you add one.

You need Docker with Compose v2, and an [Electrum server](./electrum.md) the service can reach.

## 1. Get the compose file

```sh
git clone https://github.com/deadhop/stack
cd stack
```

`docker compose up --build` builds each image from its repository's `main` branch on GitHub;
`git pull` here picks up changes to the compose file itself.

## 2. Write `.env`

Compose reads a file named `.env` next to `compose.yaml`. It is in `.gitignore`.

Not sure what to put in it? Skip this step and start the stack without a `.env`. The service waits in setup mode, and the dashboard asks a few questions and gives you the `.env` to paste: see [Set up from the dashboard](./dashboard.md#set-up-from-the-dashboard).

```sh
# Your Electrum server: tls:// with a pinned certificate across a network,
# or plain host:port on a network you trust (the service warns).
DEADHOP_ELECTRUM=tls://node.lan:50002
DEADHOP_ELECTRUM_CERT_SHA256=<fingerprint>

# You: the Nostr public key you sign in to the dashboard with.
DEADHOP_ADMINS=npub1…

# Optional. Your own wallet's account key; leave it out to have one generated.
# DEADHOP_XPUB=zpub6…

# Optional. Default: wss://relay.contextvm.org, wss://nos.lol, wss://relay.damus.io
# DEADHOP_RELAYS=wss://…,wss://…

# Optional. A name for the dashboard header.
# DEADHOP_NAME=Corner Bakery
```

- **Electrum:** see [Connect your Electrum server](./electrum.md) for the address and the fingerprint. Inside a container, `127.0.0.1` is the container itself: use the host's address on your network, or the Electrum container's name if it is on a Docker network the service joins.
- **Your own wallet:** set `DEADHOP_XPUB` before the first start, following [Receive to your own wallet](./xpub/index.md). It cannot be changed once addresses have been handed out.
- Every variable in [Configuration](./configuration.md) can go here. Anything unset keeps its default.

## 3. Start it

```sh
docker compose up -d --build
docker compose ps
```

The first build takes several minutes. Then the three that start by default (`wallet`, `deadhop`, `dashboard`) report `healthy`. The service is healthy once it has connected to its relays:

```sh
docker compose logs deadhop | grep -E "serving|first receive address"
```

```text
INFO deadhop::app: deadhop is serving pubkey=a0c6…bea5 network=bitcoin relays=3 via_proxy=false paused=false
INFO deadhop::app: first receive address (index 0): check that your wallet lists it address=bc1q…
```

Started with none of `DEADHOP_ELECTRUM`, `DEADHOP_ADMINS` and `DEADHOP_PUBLIC_INVOICING` on an empty data volume, the service waits in **setup mode**: connected to nothing, it logs what is missing and the dashboard shows the setup page. If only some required settings are set, or one is wrong, the service logs which one and restarts until it is fixed.

If nobody must learn where the service runs, set up [Hide the service](./hide.md) before this step.

## 4. Write down the recovery phrase

Only with a generated wallet (no `DEADHOP_XPUB`):

```sh
docker compose exec wallet deadhop wallet export
```

```text
Recovery phrase (24 words). Anyone who has these words can spend the funds.
Write them down and keep them offline. Do not photograph or paste them.

  1. ……………      2. ……………      3. ……………      4. ……………
  …

To spend, restore the words in any bitcoin wallet (for example Sparrow, BlueWallet or Nunchuk):
- wallet type: native segwit (BIP-84), derivation path m/84'/0'/0', no passphrase
- account key, to check it is the same wallet: zpub6…
- if the balance looks too low, raise the wallet's gap limit to the number of
  addresses the dashboard shows as created, plus 20
```

The wallets the export names are examples. To watch the payments over time, use one whose gap limit you can raise, such as [Sparrow](./xpub/sparrow.md); see [Wallets that do not fit well](./xpub/index.md#wallets-that-do-not-fit-well).

Write the words on paper. The dashboard warns until they have been exported. The `wallet` container has no network, so the words leave it only through this command, and, read-only, to the [sweeper](./wallet/index.md) if you turn it on.

The generated wallet is meant for small balances. Sweep it to a wallet you keep offline, by hand or with the [sweeper](./wallet/sweep.md).

## 5. Check the first address

Watch the `account key` the export printed in a wallet, without the words: in [Sparrow](./xpub/sparrow.md), a **xPub / Watch Only Wallet** keystore. With your own `DEADHOP_XPUB`, look in your own wallet. Its first receive address must be the one the service logged. Do this before the first real payment.

## 6. Reach the dashboard

The dashboard listens on port 8080 inside Docker and publishes nothing. If a reverse proxy on the same Docker network (Traefik, Coolify, Caddy in Docker) fronts it, point the proxy at `dashboard:8080`.

Otherwise publish it on loopback with a `compose.override.yaml`, which Compose reads on its own:

```yaml
services:
  dashboard:
    ports:
      - "127.0.0.1:8080:8080"
```

```sh
docker compose up -d
```

and put your TLS proxy in front of `127.0.0.1:8080`. [Host the dashboard](./dashboard.md) has a Caddy example and the headers to send.

## 7. Sign in

Open the dashboard and choose **Use browser extension**. Your key is in `DEADHOP_ADMINS`, so you get the operator view: Overview, Invoices, Network, Settings, Operators and Maintenance. **Invoices → New invoice** creates one, and **Copy payment link** gives you a link to send the customer ([Sending an invoice to a customer](./dashboard.md#sending-an-invoice-to-a-customer)).

Any other key, or **Continue as guest**, gets the invoice form only if public invoicing is on. It is off by default, and a guest sees:

```text
This key is not an operator of this service, and public invoicing is switched off.
```

To let customers create invoices themselves, see [Who creates invoices](./install.md#_3-who-creates-invoices).

## Updating

```sh
git pull
docker compose up -d --build                    # add --profile sweep if you run the sweeper
```

State lives in named volumes and survives rebuilds. The volumes keep the project's old name, `cvmpay-…`, on purpose: a renamed volume would start the service with an empty one, a new service key and a new wallet.

## Tested

These steps were run on a regtest chain with this `compose.yaml`: the three containers came up healthy, the first address was logged, the export printed 24 words, and an invoice created from the dashboard was paid and confirmed.
