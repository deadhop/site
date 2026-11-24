---
title: Testing
description: How deadhop relay is tested, with 100 percent line and function coverage, real sockets, real nostr-sdk clients, and deadhop's own end-to-end suites.
---

# Testing

## Unit and socket tests

```sh
just relay
```

This runs `cargo fmt --check` and `cargo clippy -D warnings`, then every test under `cargo llvm-cov` with **100% line and function coverage enforced**, then the release build.

The tests use real sockets throughout. They cover:

- **the ContextVM round trip through nostr-sdk** (the library deadhop uses): the service is challenged and authenticates on its own, a request reaches it, its gift-wrapped reply reaches the client, and a client cannot reply on anyone's behalf;
- **probation through nostr-sdk**: with the relay full of strangers, deadhop's client is let in on probation, authenticates, and its held subscription starts;
- **held requests**: a request sent while the service is away is delivered when it subscribes and authenticates, including through nostr-sdk's own reconnect and resubscribe, and with no `MAX_LIMIT` cut for the recipient;
- **probation per address**: one address gets two probation slots and then `503`, while the service, from another address, still gets in;
- **AUTH binding**: with public URLs set, an AUTH naming any other host (such as the one the client dialled) is refused;
- **the service is never cut off**: a backed-up service makes the relay refuse new requests to it, and a full queue refuses messages without closing the connection; transient write errors are retried, permanent ones close the connection;
- **read privacy**: a subscription to a whitelisted key's requests waits for that key's AUTH and is closed without it;
- **limits**: probation over the per-address and total limits, reserved slots, `503` when they are full, the handshake budget, message-rate strikes, per-address write budgets, oversized messages, silent peers (pinged, then closed), and a reader that stops reading (cut off alone);
- **every refusal**: malformed messages, unknown verbs, unscoped and oversized subscriptions, refused kinds, bad signatures and duplicates;
- **the pages**: NIP-11, both status pages, assets, `HEAD`, methods, and the trusted-proxy header (only its last `X-Forwarded-For` entry);
- **the binary**: exit codes, the whitelist file, a busy port, and a clean stop on SIGTERM and SIGINT;
- **event ids**: property tests compare the relay's NIP-01 ids with nostr-sdk's for arbitrary text, including control characters, quotes and non-ASCII.

## With deadhop itself

The relay was checked against the real deadhop service and dashboard on the regtest stack (`just up`), with the relay as the **only** relay, both service keys whitelisted:

| Suite | Tests | Result |
| --- | ---: | --- |
| Dashboard end-to-end (`management`, `payment`, `browser` in real Chrome) | 11 | pass |
| Components (`packages/e2e`: each framework's PayButton from click to paid, and the proof-of-work miners) | 6 | pass |
| Client (`packages/client` checkout) | 4 | pass |

Across those runs the relay refused nothing and dropped nothing. deadhop's relay health check passed against it, and both keys showed as authenticated on the operator page.

## Load

See [Performance](./performance.md): `just relay-bench` (in a container, never on a desktop).
