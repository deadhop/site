---
title: Sweep to your cold wallet
description: Turn on deadhop's sweeper with Docker Compose so the generated wallet's balance moves to a fresh address of your cold wallet past a threshold.
---

# Sweep to your cold wallet

This guide turns on the sweeper next to a deadhop that runs with [Docker Compose](../deploy-compose.md) and a generated wallet. It uses the default mode, a plain send.

## 1. Get your cold wallet's account key

The sweeper sends to a fresh address of your cold wallet every time, so it needs that wallet's **account public key**, the same kind of key deadhop itself takes. Follow your wallet's guide in [Receive to your own wallet](../xpub/index.md): a single-sig Native SegWit account, as `xpub` or `zpub`.

Use a different wallet from the one deadhop generated. That is the point.

## 2. Add three lines to `.env`

```sh
DEADHOP_WALLET_DESTINATION=zpub6…        # your cold wallet's account key
DEADHOP_WALLET_THRESHOLD_SAT=2000000     # sweep once 0.02 BTC is confirmed (at least 10,000)
DEADHOP_WALLET_MAX_FEE_RATE=20           # never pay more than 20 sat/vB; wait instead
```

The destination and limits are read from this file only. Nobody can change them over Nostr, the dashboard included.

## 3. Start the sweeper

The sweeper starts only with the `sweep` profile:

```sh
docker compose --profile sweep up -d --build
docker compose --profile sweep logs sweeper
```

```text
INFO deadhop_wallet::run: sweeping by send once 2000000 sat are confirmed
```

It checks every 5 minutes (`DEADHOP_WALLET_POLL_SECS`).

## 4. Watch a sweep

Once the confirmed balance reaches the threshold, the log shows the transaction. On a test chain, with a threshold of 60,000 sats and two paid invoices, it looked like this:

```text
INFO deadhop_wallet::run: sweeping by send once 60000 sat are confirmed
INFO deadhop_wallet::run: send: moved 96409 sat of 100000 to bcrt1qkh5nhkj8an3c7vw8dlzyq4vzk07g90xjte5ah2 in 7205568a…51c3fd9b
```

The history keeps it:

```sh
docker compose --profile sweep exec sweeper deadhop-wallet status
```

```text
1795518681 send moved 96409 of 100000 sat to bcrt1qkh5nhkj8an3c7vw8dlzyq4vzk07g90xjte5ah2 in 7205568a…51c3fd9b
```

Each line starts with the time (Unix seconds). The address is the next unused one of your cold wallet; check that your cold wallet lists it.

## When it waits

The sweeper never forces a transaction. It logs why it is waiting and tries again at the next poll:

| Log | Why | What to do |
| --- | --- | --- |
| `due with … confirmed, but waiting: fees are above the cap of 20 sat/vB` | The fee estimate is above `DEADHOP_WALLET_MAX_FEE_RATE` | Wait, or raise the cap |
| `holding 0 BTC confirmed and 0.00168000 BTC unconfirmed, below the threshold` | The confirmed balance is below the threshold (here, payments still waiting for a block) | Wait |
| `holding: no destination is set, so nothing is swept, no key is read and no connection is made` | `DEADHOP_WALLET_DESTINATION` is empty | Set it |
| `DEADHOP_XPUB is set: that wallet's keys are not on this host, …` | deadhop receives to your own wallet; there is nothing here to sweep | Nothing: your wallet already holds the funds |

## Tested

On a regtest chain with this `compose.yaml`: two paid invoices (100,000 sats) were swept to the destination wallet's first address in one transaction, and `status` listed the sweep. On regtest the fee estimate is high, so the cap had to be raised for the test.
