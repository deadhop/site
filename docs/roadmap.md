---
title: Roadmap
description: What deadhop does not do yet, including driving the sweeper from the dashboard, PayJoin v2, CoinJoin interoperability, SPV verification and push notifications.
---

# Roadmap

Not built yet:

- **Driving the sweeper from the dashboard.** The sweeping wallet
  ([`deadhop-wallet`](https://github.com/sandwichfarm/deadhop/tree/main/wallet)) is built. It
  makes a simple send, a PayJoin or a CoinJoin once the balance reaches a threshold, with its
  destination and limits set on the host. The sweep policy in the dashboard is still a separate,
  stored setting that the sweeper does not read.
- **CoinJoin interoperability**: PSBT version 2 and the LSAG recovery phase of joinstr, and
  rounds tested against joinstr's other clients. **PayJoin v2** (BIP-77, asynchronous, through
  a directory).
- **SPV verification**: merkle proofs against a header chain, to reduce trust in the Electrum
  server.
- **Push notifications** of status changes instead of polling, and webhooks for shop back
  ends.
- **Taproot (BIP-86)** receive addresses.
- **Signed address attestations** from an offline key, so customers can verify an address
  belongs to the merchant.
