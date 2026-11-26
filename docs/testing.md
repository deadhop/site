---
title: Testing
description: How deadhop is tested. Unit and integration tests at enforced 100% coverage, end-to-end payments on regtest with a real browser, and linting.
---

# Testing

Each repository runs its own gate, and its CI runs the same on every pull request:

| Repository | Gate | Coverage (enforced) |
| --- | --- | --- |
| [deadhop/server](https://github.com/deadhop/server): the service and its crates | `just check`: rustfmt, clippy (warnings are errors), `cargo llvm-cov` for the service and each crate | 100% lines, 100% functions |
| [deadhop/js](https://github.com/deadhop/js): `@deadhop/client`, `react`, `solid`, `svelte`, `network-ui`, the dashboard and console | `just test` (`vitest`, v8), `just check` (tsc, svelte-check), `just packages` | 100% statements, branches, functions, lines |
| [deadhop/lnaddr](https://github.com/deadhop/lnaddr), [deadhop/relay](https://github.com/deadhop/relay) | `just check` | 100% lines, 100% functions |
| [deadhop/wallet](https://github.com/deadhop/wallet) | `just check` (hermetic); `just regtest` on the regtest stack | 100% functions on regtest |
| [deadhop/site](https://github.com/deadhop/site) | `just check`: build, links, metadata, `llms.txt`, sitemap, brand copies | n/a |

`just packages` packs the npm packages, installs them into fresh React, Solid, Svelte 5 and
Svelte 4 apps, builds them, and runs publint, Are the Types Wrong and a JSR dry run.
`@deadhop/svelte/svelte4` is also tested on the real Svelte 4 runtime.

End to end, on a regtest chain (bitcoind, Fulcrum, a real relay and the service), the
dashboard, the console, the built client and every framework's components pay real
invoices in Chrome.

## What the numbers mean

- The Rust figure is line and function coverage. Region coverage is about 98.9%; the rest is
  the error side of `?` on calls that are exercised but never fail in tests, such as
  individual SQLite column reads.
- Three conditions that cannot occur in practice are `expect`s rather than untestable error
  branches: bech32-encoding a valid key, non-hardened BIP-32 derivation from a valid key
  (fails with probability about 2⁻¹²⁷), and the operating system's random source.
- Unit tests are hermetic: an in-process relay and a scripted Electrum server. The
  end-to-end suite uses real bitcoind, Fulcrum, a real relay and Chrome.
- Proof of work in the browser is tested both ways: notemine mining in Web Workers when the
  page's Content-Security-Policy allows them, and the built-in miner taking over under the
  strict policy. Whatever miner is used, the client checks its result before signing.
- Proxy support is tested against in-process SOCKS5 (with and without a password), HTTP
  CONNECT and HTTPS proxies in front of a real relay. The relay-change revert is tested
  with a relay and a proxy that do not exist.
- The high-severity findings from the security review each have a test that reproduces the
  attack: `survives_a_stray_first_message`, `one_unreadable_invoice_does_not_stall_the_others`
  and `operator_requests_cannot_be_replayed_or_borrowed`.
