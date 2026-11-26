---
title: Your first real payment
description: A start-to-finish tutorial. Run deadhop with Docker Compose next to your bitcoin node, invoice yourself, pay it, and see the bitcoin arrive in your wallet.
---

# Your first real payment

In this tutorial you run deadhop next to your own bitcoin node, invoice yourself 10,000 sats, pay it from another wallet, and watch it arrive in a wallet only you can spend from. It takes about an hour, most of it waiting for a build and a block.

We make the choices for you: Docker Compose, a generated wallet, the dashboard opened on the machine itself. Once it works, [Choose a setup](./install.md) shows the other ways.

::: tip Payments straight to your hardware wallet?
Follow the same steps with your wallet's key: in step 3 add `DEADHOP_XPUB` from [your wallet's guide](./xpub/index.md), skip step 5, and in step 6 use your wallet as its guide says (or watch that key in Sparrow).
:::

::: warning Must nobody learn where it runs?
Set up [Hide the service](./hide.md) before step 4: relays see the address from the first connection.
:::

## What you need

- A bitcoin node with **Fulcrum or electrs**, on this machine or your local network.
- **Docker** with Compose v2, on a Linux machine that can reach the node.
- A **Nostr browser extension** (NIP-07) holding a key you will sign in with. Copy its public key (`npub1…`).
- **Sparrow Wallet** on your computer, to see the money arrive.
- Another wallet with a little bitcoin, to pay with.

## 1. Get the compose file

```sh
git clone https://github.com/deadhop/stack
cd stack
```

## 2. Find your Electrum server

Find your Electrum server's address and port in your node's app or settings. Fulcrum usually offers TLS on `50002`; electrs often offers only plain TCP on `50001`.

**With a TLS port**, read its certificate's fingerprint:

```sh
docker compose run --rm --no-deps deadhop fingerprint 192.168.1.20:50002
```

The command builds the image the first time, so give it a few minutes. It prints two lines starting with `DEADHOP_ELECTRUM`. Keep them. [Connect your Electrum server](./electrum.md) explains how to check the fingerprint on the node.

**With plain TCP only**, use `DEADHOP_ELECTRUM=192.168.1.20:50001` in the next step, on your own network. The service will warn that the link is unencrypted ([why](./electrum.md#a-server-with-no-tls-port)).

## 3. Write `.env`

Create `.env` next to `compose.yaml`:

```sh
DEADHOP_ELECTRUM=tls://192.168.1.20:50002
DEADHOP_ELECTRUM_CERT_SHA256=<the fingerprint>
DEADHOP_ADMINS=npub1…your key…
DEADHOP_NAME=My first deadhop
```

No `DEADHOP_XPUB`: deadhop will generate a wallet for you (unless you follow the hardware-wallet tip above).

## 4. Start it

```sh
docker compose up -d --build
docker compose ps
```

Wait until `wallet`, `deadhop` and `dashboard` say `healthy`. Then:

```sh
docker compose logs deadhop | grep "first receive address"
```

```text
INFO deadhop::app: first receive address (index 0): check that your wallet lists it address=bc1q…
```

Note the address.

## 5. Write down the words

```sh
docker compose exec wallet deadhop wallet export
```

Write the 24 words on paper. They are the only way to spend what deadhop receives. Keep them offline.

## 6. Watch the wallet in Sparrow

You watch the wallet with its **account key** only: Sparrow sees every payment, and your 24 words stay on paper.

In Sparrow, name a wallet and choose **New Wallet**. Leave the policy at single signature and the script type at **Native Segwit (P2WPKH)**, the default. As the keystore choose **xPub / Watch Only Wallet**, paste the `account key` that `deadhop wallet export` printed (the `zpub…`), and choose **Apply**. Sparrow's [quick start](https://sparrowwallet.com/docs/quick-start.html) describes these choices.

Check that the first address on the **Addresses** tab is the one from step 4. If it differs, stop here and check the key you pasted.

Then raise the gap limit: **Settings**, **Advanced**, a gap limit of 100, **Close**, **Apply** ([Sparrow FAQ](https://sparrowwallet.com/docs/faq.html)). deadhop uses a new address for every invoice, paid or not.

## 7. Open the dashboard

Create `compose.override.yaml` next to `compose.yaml`:

```yaml
services:
  dashboard:
    ports:
      - "127.0.0.1:8080:8080"
```

```sh
docker compose up -d
```

Open <http://127.0.0.1:8080> on that machine. From your laptop, forward the port first: `ssh -L 8080:127.0.0.1:8080 you@that-machine`.

Choose **Use browser extension** and approve. You see the operator Overview: the service running, relays connected, the chain's height.

## 8. Invoice yourself

**Invoices → New invoice**. Amount `10000`, note `My first payment`, **Create invoice**. The drop shows a QR code and a fresh address, one that has never been used.

For a customer you would send **Copy payment link**: it opens this invoice on its own page. That needs the dashboard on a public HTTPS address, hosted away from home ([Sending an invoice to a customer](./dashboard.md#sending-an-invoice-to-a-customer)); or send the address and amount yourself. For this tutorial, pay it yourself.

## 9. Pay it

Pay the exact amount from your other wallet. Within a few seconds the drop says **Payment seen, confirming**. After one block, about ten minutes, it says **Paid**.

## 10. See it arrive

In Sparrow, the payment appears on the **Transactions** tab, to an address deadhop made from your wallet's key. The payment service never had a key that could spend it. The words that can are on your paper, and in the `wallet` container, which has no network. To spend it later, restore the 24 words in a wallet: see [Spending what the service generated](./xpub/sparrow.md#spending-what-the-service-generated), or move it out automatically with the [sweeper](./wallet/sweep.md).

## What you have

A payment service with no open port, taking payments to a wallet you hold the words for.

Next:

- Put the dashboard behind HTTPS: [Host the dashboard](./dashboard.md).
- Move the balance to cold storage on its own: [Sweep to your cold wallet](./wallet/sweep.md).
- Hide where it runs: [Hide the service](./hide.md). If the location must never show, set that up before step 4: relays see the address from the first connection.
- Before you share it: [Production checklist](./deployment.md).

## Tested

Every step here was run on a regtest chain with the same `compose.yaml` (see [Run it with Docker Compose](./deploy-compose.md#tested)), except paying from another wallet on mainnet and watching it in Sparrow. Watching an account key in Sparrow is covered by Sparrow's own documentation.
