---
title: Testing
description: How deadhop lnaddr is tested. Whole-system tests over a real relay, fake backends that sign real invoices, and enforced 100% line and function coverage.
---

# Testing

In a checkout of [deadhop/lnaddr](https://github.com/deadhop/lnaddr) (its CI runs the same):

```sh
just check   # cargo fmt --check, clippy -D warnings, cargo llvm-cov at 100% lines and functions
```

Coverage is enforced at 100% of lines and functions, including both binaries. The binaries are run as processes and stopped with SIGINT and SIGTERM.

## What the tests run

- **Whole system**: an in-process Nostr relay, the node service, a fake Lightning backend and the gateway on real sockets. A test plays the wallet: it fetches the parameters, calls back, and checks the invoice commits to the metadata it was shown.
- **Fake backends** for LND, Core Lightning, phoenixd and LNbits, following each API's documentation (paths, headers, field names, units). Core Lightning's clnrest documents `POST /v1/<method>` and the `Rune` header; the JSON body of named parameters is the usual clnrest form but is not spelled out in its docs, so check it with `lnaddr-node check`. They sign real BOLT11 invoices with a test key, so every check runs on real invoices. TLS tests use self-signed certificates over TLS 1.3 and 1.2.
- **Failures**: a relay that accepts connections and never answers; the only relay going away and coming back; a node that stops and comes back; a backend that fails, times out, answers garbage or signs the wrong amount; a pinned payee that does not match; stale caches; rate limits on both sides; a full connection table.
- **Security**: strangers' keys are ignored; gateway keys cannot use admin tools; stale requests are refused; remote settings cannot touch the backend; every admin path is `404` on the public listener; forged forms and cross-site posts are refused; sign-in attempts are limited; sessions expire.
- **Configuration**: every layer, every lock, every variable and every mistake, each with the message an operator sees.

## Against live relays

The demo stage (`demo/` in deadhop/lnaddr) with the default relays `relay.contextvm.org` and `relay2.contextvm.org` gives a full flow in 170 to 280 ms per invoice (see [performance](./performance.md)).

## Not covered

No test runs against a live LND, Core Lightning, phoenixd or LNbits. The fakes follow the APIs as documented; run `lnaddr-node check` against yours before pairing.
