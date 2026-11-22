---
title: Testing
description: How deadhop lnaddr is tested. Whole-system tests over a real relay, fake backends that sign real invoices, and enforced 100% line and function coverage.
---

# Testing

```sh
cd lnaddr
cargo fmt --check && cargo clippy --all-targets -- -D warnings
cargo llvm-cov --all-targets --fail-under-lines 100 --fail-under-functions 100
```

Coverage is enforced at 100% of lines and functions, including both binaries. The binaries are run as processes and stopped with SIGINT and SIGTERM.

## What the tests run

- **Whole system**: an in-process Nostr relay, the node service, a fake Lightning backend and the gateway on real sockets. A test plays the wallet: it fetches the parameters, calls back, and checks the invoice commits to the metadata it was shown.
- **Fake backends** for LND, Core Lightning, phoenixd and LNbits, following each API's documentation (paths, headers, field names, units). They sign real BOLT11 invoices with a test key, so every check runs on real invoices. TLS tests use self-signed certificates over TLS 1.3 and 1.2.
- **Failures**: a relay that accepts connections and never answers; a node that stops and comes back; a backend that fails, times out, answers garbage or signs the wrong amount; a pinned payee that does not match; stale caches; rate limits on both sides; a full connection table.
- **Security**: strangers' keys are ignored; gateway keys cannot use admin tools; stale requests are refused; remote settings cannot touch the backend; every admin path is `404` on the public listener; forged forms and cross-site posts are refused; sign-in attempts are limited; sessions expire.
- **Configuration**: every layer, every lock, every variable and every mistake, each with the message an operator sees.

## Not covered

No test runs against a live LND, Core Lightning, phoenixd or LNbits. The fakes follow the APIs as documented; run `lnaddr-node check` against yours before pairing.
