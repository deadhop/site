---
title: Your first real payment
description: A start-to-finish tutorial. Run deadhop with Docker Compose next to your bitcoin node, invoice yourself, pay it, and see the bitcoin arrive in your wallet.
---

# Your first real payment

In this tutorial you run deadhop next to your own bitcoin node, invoice yourself 10,000 sats, pay it from another wallet, and watch it arrive in a wallet only you can spend from. It takes about an hour, most of it waiting for a build and a block.

We make the choices for you: Docker Compose, a generated wallet, the dashboard opened on the machine itself. Once it works, [Choose a setup](./install.md) shows the other ways.

## What you need

- A bitcoin node with **Fulcrum or electrs**, on this machine or your local network.
- **Docker** with Compose v2, on a Linux machine that can reach the node.
- A **Nostr browser extension** (NIP-07) holding a key you will sign in with. Copy its public key (`npub1…`).
- **Sparrow Wallet** on your computer, to see the money arrive.
- Another wallet with a little bitcoin, to pay with.

## 1. Get the source

```sh
git clone https://github.com/sandwichfarm/deadhop
cd deadhop
```

## 2. Find your Electrum server

If it runs on another machine, read its certificate's fingerprint (Fulcrum's TLS port is usually `50002`):

```sh
docker compose run --rm --no-deps deadhop fingerprint 192.168.1.20:50002
```

The command builds the image the first time, so give it a few minutes. It prints two lines starting with `DEADHOP_ELECTRUM`. Keep them. [Connect your Electrum server](./electrum.md) explains how to check the fingerprint on the node.

## 3. Write `.env`

Create `.env` next to `compose.yaml`:

```sh
DEADHOP_ELECTRUM=tls://192.168.1.20:50002
DEADHOP_ELECTRUM_CERT_SHA256=<the fingerprint>
DEADHOP_ADMINS=npub1…your key…
DEADHOP_NAME=My first deadhop
```

No `DEADHOP_XPUB`: deadhop will generate a wallet for you.

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

In Sparrow, **File → New Wallet**, name it, choose **New or Imported Software Wallet**, then **Mnemonic Words (BIP39)**, choose 24 words, type the words in and choose **Import Keystore**. Leave the script type at **Native Segwit (P2WPKH)** and the path at `m/84'/0'/0'`, with no passphrase, and choose **Apply**.

Check two things:

- The key on the **Settings** tab is the `account key` that `deadhop wallet export` printed (Sparrow may show it as `xpub`; copy it as `zpub` to compare).
- The first address on the **Addresses** tab is the one from step 4.

If either differs, stop here and check the words.

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

## 9. Pay it

Pay the exact amount from your other wallet. Within a few seconds the drop says **Payment seen, confirming**. After one block, about ten minutes, it says **Paid**.

## 10. See it arrive

In Sparrow, the payment appears on the **Transactions** tab, to an address deadhop made from your wallet's key. deadhop never had a key that could spend it, and still does not.

## What you have

A payment service with no open port, taking payments to a wallet you hold the words for.

Next:

- Put the dashboard behind HTTPS: [Host the dashboard](./dashboard.md).
- Move the balance to cold storage on its own: [Sweep to your cold wallet](./wallet/sweep.md).
- Hide where it runs: [Hide the service](./hide.md).
- Before you share it: [Production checklist](./deployment.md).
