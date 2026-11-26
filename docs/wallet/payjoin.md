---
title: Sweep with PayJoin
description: Sweep deadhop's generated wallet by a BIP-78 PayJoin to a receiver you run, so the transaction does not show which inputs are whose.
---

# Sweep with PayJoin

In a [PayJoin](https://github.com/bitcoin/bips/blob/master/bip-0078.mediawiki) the receiver adds one of its own coins to the transaction. An outside observer can no longer assume that all inputs belong to the sender.

Know three things before you choose it:

- **The receiver is online.** It must answer the sweeper and sign a coin of its own, so it is a hot wallet or a payment server you run that supports receiving BIP-78 PayJoins (BTCPay Server and JoinMarket are two that do). It is not your cold storage.
- **The money goes to the receiver.** The sweep pays the address in the receiver's `bitcoin:` URI. `DEADHOP_WALLET_DESTINATION` is not used for it. Move the funds on to cold storage from the receiver yourself.
- **It is not hands-off.** Each URI is paid once, so you write a fresh one before every sweep. Without one, the sweeper waits.

For cold storage without any of that, use a [plain send](./sweep.md).

Set the sweeper up as in [Sweep to your cold wallet](./sweep.md) first. Then:

## 1. A URI for every sweep

The receiver gives you a `bitcoin:` URI with a `pj=` endpoint. Leave the amount out. Write it to a file on the host:

```sh
mkdir -p payjoin
echo 'bitcoin:bc1q…?pj=https://payjoin.example/…' > payjoin/uri
```

Whoever can write this file decides where the whole balance goes. Keep it on the host, and mount it read-only.

## 2. Mount it and switch the mode

Add the folder to the `sweeper` service in `compose.override.yaml` (Compose merges it with `compose.yaml`, so a `git pull` never conflicts):

```yaml
services:
  sweeper:
    volumes:
      - ./payjoin:/payjoin:ro
```

and in `.env`:

```sh
DEADHOP_WALLET_MODE=payjoin
DEADHOP_WALLET_PAYJOIN_URI_FILE=/payjoin/uri
# DEADHOP_WALLET_PAYJOIN_CERT_SHA256=…   pin a self-hosted receiver's certificate
# DEADHOP_WALLET_PROXY=socks5://…        needed for a .onion endpoint
```

```sh
docker compose --profile sweep up -d
```

## 3. A fresh URI each time

Each URI is paid once; the sweeper remembers the ones it has used. Write a new one before the next sweep is due. Without a fresh URI it waits, and says `the URI in /payjoin/uri was already paid; waiting for a fresh one`.

## If the receiver fails

If the receiver is unreachable, answers with an error, or proposes a transaction that fails a check, the sweeper broadcasts the signed original instead: an ordinary payment to the receiver's address. BIP-78 lets the receiver broadcast it too. The URI counts as used either way.

## Limits

BIP-78 (v1) only: no BIP-77 directory, no OHTTP. Tested in [deadhop/wallet](https://github.com/deadhop/wallet)'s regtest suite against a receiver built on the `payjoin` crate, including the fallback.

## Not run yet

PayJoin sweeps run in deadhop/wallet's regtest tests, but this Compose setup (the override and the URI file) has not been run end to end.
