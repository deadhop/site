---
title: Overview
description: deadhop wallet sweeps the generated wallet's balance to your cold wallet once it reaches a threshold, by a plain send, a PayJoin or a CoinJoin.
---

# deadhop wallet

The sweeping wallet moves what deadhop received to a wallet you keep somewhere safer, on its own, once the balance is worth moving.

deadhop's [generated wallet](../deploy-compose.md#_4-write-down-the-recovery-phrase) is convenient but sits on a server. `deadhop-wallet` holds its funds and, once the confirmed balance reaches a threshold you set, sends everything to a fresh address of your cold wallet:

| Mode | What happens |
| --- | --- |
| `send` (default) | One transaction pays every confirmed coin to the next unused address of your cold wallet. |
| `payjoin` | A [BIP-78](https://github.com/bitcoin/bips/blob/master/bip-0078.mediawiki) PayJoin to an online receiver you run, named by a fresh URI for each sweep. The receiver adds a coin of its own, so the transaction does not show which inputs are whose. The funds go to that receiver, not to your cold wallet. |
| `coinjoin` | A [joinstr](https://docs.joinstr.xyz/protocol/) round over Nostr: your coins are mixed with equal-amount outputs of other peers before they reach your cold wallet. |

## What it will not do

- **Change where money goes from afar.** The destination, mode, threshold and fee cap come from the host's environment only. Nothing reachable over Nostr can change them.
- **Make a wallet.** It reads the recovery phrase the offline `wallet` container made, read-only. A missing phrase never turns into a new, empty wallet.
- **Run with the wrong wallet.** It refuses to start if the phrase is not the wallet the payment service watches.
- **Sign blindly.** Before every signature it checks that it spends only its own coins, that the destination gets at least what it should, and that it loses no more than the allowed fee.

## When to use it

Use it with the generated wallet, when you want payments to end up in cold storage without doing it by hand. If deadhop already receives to [your own wallet](../xpub/index.md), there is nothing to sweep: it says so and idles.

## Where to go next

- [Sweep to your cold wallet](./sweep.md): set it up, with a plain send.
- [Sweep with PayJoin](./payjoin.md) or [with CoinJoin](./coinjoin.md).
- [How sweeping works](./how-it-works.md): finding the coins, the checks, what happens when something fails.
- [Configuration and commands](./configuration.md).
