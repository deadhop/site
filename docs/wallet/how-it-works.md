---
title: How sweeping works
description: How deadhop's sweeping wallet finds every coin, checks each transaction before signing, keeps state, and what it does when a sweep cannot go ahead.
---

# How sweeping works

## Three containers, one phrase

- The offline **`wallet`** container (`deadhop wallet serve`) generates the recovery phrase and keeps it. It has no network.
- The **payment service** sees only the account public key.
- The **sweeper** (`deadhop-wallet`) reads the phrase, read-only, and has network access to the Electrum server and, depending on the mode, the PayJoin receiver or the CoinJoin relay.

The sweeper refuses to start if the phrase does not belong to the account key the payment service watches (`DEADHOP_XPUB_FILE`). If the service uses your own `DEADHOP_XPUB`, the keys are elsewhere, and the sweeper says so and idles.

## Finding the coins

The payment service gives every invoice its own address, and most invoices are never paid. A wallet's usual scan, which stops after 20 unused addresses, would miss funds. So the payment service writes its next unused address index to a shared file after every poll (`DEADHOP_INDEX_FILE`). The sweeper scans every address below it, plus `DEADHOP_WALLET_GAP` (50) beyond the last used one.

## Before every signature

Whoever built the transaction (the sweeper itself, a PayJoin receiver, or CoinJoin peers), the sweeper checks three things before it signs:

1. It spends only its own coins, and their values are described correctly.
2. At least the expected amount reaches the approved scripts: the destination, or for a premix its own change.
3. It loses no more than the allowed cost: the fee cap for a send or a premix, the original's fee for a PayJoin, and joinstr's 15,000 sats for a CoinJoin.

## State

`sweeper.json` in `DEADHOP_WALLET_STATE_DIR` records the next destination and change index, every PayJoin URI already paid (each is paid once), and the last 100 sweeps (`deadhop-wallet status`).

## When something fails

- **Many coins.** At most 400 inputs go into one transaction, largest first. A coin worth less than the fee of its own input is left alone. The rest goes at the next poll.
- **Fees above the cap, no fresh PayJoin URI, a CoinJoin round that does not fill.** The balance stays where it is and the next poll tries again.
- **PayJoin receiver unreachable, or a proposal that fails a check.** The signed original is broadcast instead: an ordinary payment to the receiver's address.
- **CoinJoin.** Every signature covers every output, so this wallet's output gets its amount or the transaction is invalid. An abandoned round spends nothing.

## Limits

- PayJoin is BIP-78 (v1) only.
- joinstr: PSBT version 0, no LSAG recovery phase, tested only between deadhop wallets.
- P2WPKH (BIP-84) coins only.
- No CoinJoin fallback: without peers, nothing leaves until a round fills or you change the mode.

The open risks of holding funds on a server are in [Security](../security.md#open-risks-you-are-accepting).
