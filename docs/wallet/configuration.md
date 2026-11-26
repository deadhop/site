---
title: Configuration and commands
description: Every environment variable of deadhop's sweeping wallet, its default and meaning, and the deadhop-wallet commands run, once and status.
---

# Configuration and commands

## Commands

| Command | What it does |
| --- | --- |
| `deadhop-wallet run` | The default: poll until stopped. |
| `deadhop-wallet once` | One poll, then exit. |
| `deadhop-wallet status` | The recent sweeps: time (Unix seconds), mode, amount, destination, transaction id, and whether the transaction is confirmed (with its block), still unconfirmed, or abandoned (dropped without being mined, so the coins did not move). |

With Compose: `docker compose --profile sweep exec sweeper deadhop-wallet status`.

## Environment

The destination, mode, threshold and fee cap come from the environment only.

| Variable | Default | Meaning |
|---|---|---|
| `DEADHOP_NETWORK` | `bitcoin` | `bitcoin`, `testnet`, `signet` or `regtest` |
| `DEADHOP_DATA_DIR` | `data` | Holds `wallet.mnemonic` (only read) |
| `DEADHOP_XPUB_FILE` | `<data>/account.xpub` | The account key the payment service watches |
| `DEADHOP_XPUB` | unset | When set, the keys are elsewhere: the process says so and idles |
| `DEADHOP_INDEX_FILE` | unset | The payment service's next unused address index |
| `DEADHOP_WALLET_STATE_DIR` | the data directory | Where `sweeper.json` is kept (must be writable) |
| `DEADHOP_ELECTRUM`, `DEADHOP_ELECTRUM_CERT_SHA256` | none | As for the payment service. Required to sweep |
| `DEADHOP_WALLET_MODE` | `send` | `send`, `payjoin` or `coinjoin` |
| `DEADHOP_WALLET_DESTINATION` | unset | Account key (`xpub`/`zpub`, `tpub`/`vpub`) of the wallet to move funds to. With nothing to sweep to (no destination, and in payjoin mode no URI file) the process holds: it reads no key and connects nowhere |
| `DEADHOP_WALLET_THRESHOLD_SAT` | `1000000` | Confirmed balance that triggers a sweep (at least 10,000) |
| `DEADHOP_WALLET_MAX_FEE_RATE` | `20` | Highest fee rate in sat/vB. Above it, the sweep waits |
| `DEADHOP_WALLET_FEE_TARGET_BLOCKS` | `6` | Confirmation target asked of the server's fee estimate |
| `DEADHOP_WALLET_MIN_CONFIRMATIONS` | `1` | Confirmations a coin needs before it counts |
| `DEADHOP_WALLET_POLL_SECS` | `300` | Time between polls |
| `DEADHOP_WALLET_GAP` | `50` | Unused addresses scanned past the last used one |
| `DEADHOP_WALLET_MAX_INDEX_HINT` | `1000000` | The highest `DEADHOP_INDEX_FILE` value believed (1000 to 100000000). A larger value is clamped and logged, so a runaway or hostile file costs at most this many addresses per poll |
| `DEADHOP_WALLET_PROXY` | unset | `socks5://…` (e.g. Tor) for PayJoin requests and the CoinJoin relay. Needed for `.onion` endpoints |
| `DEADHOP_WALLET_PAYJOIN_URI_FILE` | unset | `payjoin` mode: a file with the receiver's `bitcoin:…?pj=…` URI, without an amount. Write a fresh one for every sweep. It decides where the whole balance goes: keep it on the host and mount it read-only |
| `DEADHOP_WALLET_PAYJOIN_CERT_SHA256` | unset | Pin the receiver's certificate (self-hosted receivers) |
| `DEADHOP_WALLET_COINJOIN_RELAY` | unset | `coinjoin` mode: the one relay pools use |
| `DEADHOP_WALLET_COINJOIN_DENOMINATION_SAT` | `1000000` | Amount each peer mixes. The threshold must be at least this plus 500 |
| `DEADHOP_WALLET_COINJOIN_PEERS` | `5` | Peers per round, this wallet included |
| `DEADHOP_WALLET_COINJOIN_TIMEOUT_SECS` | `1800` | How long a round may take before it is abandoned |

## Tests

```sh
cargo test                                                # in deadhop/wallet; hermetic
DEADHOP_WALLET_REGTEST=1 cargo test --test regtest        # needs the regtest stack: send, PayJoin, fallback, three-wallet CoinJoin
```
