---
title: Sweep with CoinJoin
description: Sweep deadhop's generated wallet through a joinstr CoinJoin round over Nostr, so the coins reach your cold wallet mixed with other peers' coins.
---

# Sweep with CoinJoin

In `coinjoin` mode the sweeper takes part in a [joinstr](https://docs.joinstr.xyz/protocol/) round, coordinated over a Nostr relay. Several peers each put in the same amount and each get the same amount out, so the outputs cannot be matched to the inputs.

Set the sweeper up as in [Sweep to your cold wallet](./sweep.md) first. Then in `.env`:

```sh
DEADHOP_WALLET_MODE=coinjoin
DEADHOP_WALLET_COINJOIN_RELAY=wss://relay.example.com   # the one relay pools use
DEADHOP_WALLET_COINJOIN_DENOMINATION_SAT=1000000        # what each peer mixes
DEADHOP_WALLET_COINJOIN_PEERS=5                         # peers per round, this wallet included
DEADHOP_WALLET_THRESHOLD_SAT=1000500                    # at least the denomination plus 500
```

```sh
docker compose --profile sweep up -d
```

## What happens

1. The confirmed coins are consolidated into one premix coin, sent to the wallet's own change.
2. That coin joins a pool of peers with the same denomination.
3. The mixed output goes to the next address of your cold wallet.

Every signature covers every output (`ALL|ANYONECANPAY`): whatever set of inputs ends up combined, this wallet's output gets its amount, or the transaction is invalid. An abandoned round spends nothing. The most a round may cost is joinstr's 15,000 sats.

## Limits

- **Peers.** Without enough peers, rounds keep being abandoned. The premix coin stays in the wallet and nothing leaves until a round fills, or you switch the mode. There is no fallback.
- **Compatibility.** The message flow and field names follow the joinstr spec, but PSBTs are version 0 and the LSAG recovery phase is not implemented. Rounds have only been run between deadhop wallets, not with joinstr's Python or Kotlin clients.
- **Script type.** P2WPKH (BIP-84) coins only.
