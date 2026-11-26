---
title: Production checklist
description: 'Everything to check before deadhop takes real payments: the wallet key, the Electrum server, invoicing, network placement, backups and monitoring.'
---

# Production checklist

Go through this before the first real payment. Each item links to the guide that does it.

1. **Run it:** [Docker Compose](./deploy-compose.md) or [systemd](./deploy-systemd.md).
2. **Your node:** [Connect your Electrum server](./electrum.md).
3. **Where payments land:** [your own wallet](./xpub/index.md), or the generated one with its words written down.
4. **Who sees it:** [Hide the service](./hide.md).
5. **The page:** [Host the dashboard](./dashboard.md).

## Checklist

- [ ] Electrum server is your own and reachable only locally or over a private network
- [ ] If it is not on the same machine: `tls://` with a pinned `DEADHOP_ELECTRUM_CERT_SHA256`, or plain TCP only on a network you trust ([details](./electrum.md#a-server-with-no-tls-port))
- [ ] Either `DEADHOP_XPUB` is your wallet's BIP-84 account key and the first receive
      address logged at startup appears in that wallet, or the wallet was generated and its
      recovery phrase has been exported (`deadhop wallet export`) and stored offline
- [ ] Wallet gap limit raised: every invoice uses a new address, paid or not ([why](./watch-only.md#the-gap-limit))
- [ ] Public invoicing off unless you need it; `DEADHOP_POW_BITS` at 20 or more if on
- [ ] `DEADHOP_MIN_CONFIRMATIONS` chosen for your amounts
- [ ] Service runs as its own user, behind a VPN or Tor, with inbound traffic dropped
- [ ] A supervisor restarts the process if it exits
- [ ] Two or more relays, at least one you control, all `wss://` (or `ws://` to `.onion`, `.i2p` or `.fips` relays, which encrypt the path themselves)
- [ ] Data directory backed up with its permissions intact
- [ ] Dashboard served over HTTPS with the headers in [Host the dashboard](./dashboard.md)
- [ ] Operators use a browser extension and a key made only for this service
- [ ] Someone watches for `chain_ok = false` and `watch_errors > 0` in the operator view
- [ ] `DEADHOP_PROXY` and `DEADHOP_PROXY_LOCKED=true` set on the host if the service's location
      must stay hidden even from someone holding an operator key
- [ ] Backups in `<data dir>/backups` are copied off the host regularly

## Testing against a real Electrum server

A read-only smoke test asks a server for its genesis hash and chain tip. In a checkout of
[deadhop/server](https://github.com/deadhop/server), put the host in the gitignored `.env.local`:

```sh
# .env.local:  DEADHOP_TEST_ELECTRUM_HOST=...   [DEADHOP_TEST_ELECTRUM_PORT=50001]
just live-electrum
```
