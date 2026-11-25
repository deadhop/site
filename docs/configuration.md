---
title: Configuration
description: Every deadhop environment variable, its default and what it controls, plus the startup checks the service performs.
---

# Configuration

The payment service's settings. The tools have their own: the [sweeping wallet](./wallet/configuration.md), the [relay](./relay/configuration.md), and lnaddr's [node](./lnaddr/node.md) and [gateway](./lnaddr/gateway.md).

All configuration is environment variables. Nothing has a network-reaching default.

| Variable | Default | Meaning |
| --- | --- | --- |
| `DEADHOP_RELAYS` | required | Comma-separated `wss://` relay URLs. On mainnet plain `ws://` is accepted only for a relay on this machine, or on Tor (`.onion`), I2P (`.i2p`) or FIPS (`.fips`), which encrypt the connection themselves; those need a proxy that can reach them |
| `DEADHOP_ELECTRUM` | required | Electrum server: `host:port` (plain TCP) or `tls://host:port` |
| `DEADHOP_ELECTRUM_CERT_SHA256` | none | Pin the server's TLS certificate: SHA-256 fingerprint(s), comma-separated |
| `DEADHOP_XPUB` | see below | Your wallet's BIP-84 **account** key (`xpub`/`zpub`, or `tpub`/`vpub` on test networks). Unset: one is generated (Compose) |
| `DEADHOP_XPUB_FILE` | none | Read the account key from this file when `DEADHOP_XPUB` is unset (the wallet service writes it) |
| `DEADHOP_INDEX_FILE` | none | Write the next unused address index here after every poll, for the sweeping wallet's scan (Compose sets it) |
| `DEADHOP_NETWORK` | `bitcoin` | `bitcoin`, `testnet`, `signet` or `regtest` |
| `DEADHOP_ADMINS` | none | Comma-separated operator public keys (hex or `npub`) |
| `DEADHOP_PUBLIC_INVOICING` | `false` | Let non-operators create invoices (with proof of work) |
| `DEADHOP_POW_BITS` | `20` | NIP-13 difficulty for non-operators |
| `DEADHOP_POW_WINDOW_SECS` | `600` | Accepted age and clock skew of a request event |
| `DEADHOP_MIN_CONFIRMATIONS` | `1` | Confirmations before `confirmed` |
| `DEADHOP_DEFAULT_EXPIRY_SECS` | `3600` | Invoice lifetime when none is requested |
| `DEADHOP_MAX_EXPIRY_SECS` | `86400` | Longest lifetime an operator may request |
| `DEADHOP_MIN_AMOUNT_SAT` | `1000` | Smallest invoice |
| `DEADHOP_MAX_AMOUNT_SAT` | `100000000` | Largest invoice |
| `DEADHOP_MAX_OPEN_INVOICES` | `500` | Open invoices before the public is refused |
| `DEADHOP_MAX_INVOICES_PER_DAY` | `2000` | Invoices (address indices) per 24 h before the public is refused |
| `DEADHOP_RATE_GLOBAL_PER_MIN` | `30` | Public invoice creations per minute, all callers |
| `DEADHOP_RATE_PER_KEY_PER_MIN` | `6` | Public invoice creations per minute, per key |
| `DEADHOP_RATE_REQUESTS_PER_MIN` | `1200` | Public tool calls per minute, all callers |
| `DEADHOP_RATE_REQUESTS_PER_KEY_PER_MIN` | `120` | Public tool calls per minute, per key |
| `DEADHOP_POLL_SECS` | `10` | Chain polling interval |
| `DEADHOP_LATE_GRACE_SECS` | `86400` | How long expired invoices are still watched |
| `DEADHOP_DATA_DIR` | `data` | Database and the service's Nostr key (created `0700`) |
| `DEADHOP_PUBLIC_DIR` | none | A directory shared with the dashboard (`/public` in `compose.yaml`). The service writes `relays.json` there: the `wss://` relays each key listens on now, without `.onion`, `.i2p` or `.fips` addresses. The dashboard adds them to its own list |
| `DEADHOP_ANNOUNCE` | `false` | Publish public ContextVM discovery announcements |
| `DEADHOP_NAME` | `deadhop` | Name shown in the dashboard |
| `DEADHOP_PROXY` | none | A proxy for relay connections only: `socks5://`, `https://` or `http://`, optionally `user:pass@`. The first entry of the proxy list (id `env1`) |
| `DEADHOP_PROXIES` | none | More proxies, comma-separated, after `DEADHOP_PROXY` (at most 8 in all; ids `env2`, `env3`, …) |
| `DEADHOP_PROXY_MODE` | `off` | Where relays go by default: `off` (the first proxy is the default route), or `failover`, `round_robin` or `chaos`, which with two or more proxies make a group "Default" (id `default`) of them all with that strategy, and point the default route at it. With one proxy, that proxy is the default route |
| `DEADHOP_PROXY_ROTATE_SECS` | `3600` | Round robin: seconds between changes in that group (60 to 604800) |
| `DEADHOP_PROXY_CHAOS_MIN_SECS` / `DEADHOP_PROXY_CHAOS_MAX_SECS` | `300` / `900` | Chaos: shortest and longest time before that group's next change |
| `DEADHOP_PROXY_OFFLINE` | `kill_switch` | When the default route has nothing reachable (and for rules that follow this policy): `kill_switch` (no connection), `admin_only` (the administration key connects straight, the public invoices key stays off), `invoicing_only` (the public invoices key connects straight, the administration key stays off) or `open` (both connect straight) |
| `DEADHOP_TRANSPARENT_PROXY` | `false` | You run a transparent proxy around this service: nothing is checked or rotated, the proxies, groups and rules are not used and the privacy audit says it cannot see the path |
| `DEADHOP_PROXY_LOCKED` | `false` | Refuse every proxy setting (proxies, groups, default route, rules, offline policy, transparent, I2P registries) from the dashboard |
| `DEADHOP_LOG` | `warn,deadhop=info,contextvm_sdk=off,rmcp=off` | Log filter |

At least one of `DEADHOP_ADMINS` or `DEADHOP_PUBLIC_INVOICING=true` is required.
`DEADHOP_ADMINS` accepts hex, `npub` and `nprofile` keys, with or without `nostr:`.

## Changing settings from the dashboard

Operators can change the relays, proxy, proof of work, rate limits, amount and lifetime
limits, confirmations, caps, polling, the late-payment grace and the PayJoin/CoinJoin
policy at runtime, and add or remove operator keys. Changes are stored in the database as
overrides on top of the environment and survive restarts. *Reset to environment* drops
them all.

- A new relay list reconnects the service. If no relay connects within 30
  seconds, the previous one is restored. A changed proxy list is probed at once; if none
  of the new proxies is reachable, the previous list is restored (recorded in the audit
  log).
- If later no relay is connected for 10 minutes, the service drops the relay override
  and goes back to `DEADHOP_RELAYS` by itself (recorded in
  the audit log). The same happens at startup when no saved relay connects within 30
  seconds, so restarting the host is a way back too. Saved relays otherwise take
  precedence over `DEADHOP_RELAYS`.
- Values are checked against the same bounds as the environment.
- If the environment later changes so that stored overrides no longer fit, they are
  ignored and a warning is shown.
- These stay host-only: `DEADHOP_XPUB`, `DEADHOP_NETWORK`, `DEADHOP_ELECTRUM`,
  `DEADHOP_DATA_DIR`, `DEADHOP_ANNOUNCE` and the keys in `DEADHOP_ADMINS`. With
  `DEADHOP_PROXY_LOCKED=true` the proxy is host-only too.

## Electrum over TLS

For an Electrum server that is not on this machine, use its TLS port and pin its
certificate:

```sh
deadhop fingerprint node.lan:50002     # prints the certificate's SHA-256 and the settings below
export DEADHOP_ELECTRUM=tls://node.lan:50002
export DEADHOP_ELECTRUM_CERT_SHA256=<fingerprint printed above>
```

- The command trusts whatever answers, so compare the fingerprint with the certificate on
  the node, for example `openssl x509 -in <fulcrum cert> -noout -fingerprint -sha256`.
- A pinned certificate is accepted whatever its name, issuer or expiry, which suits
  self-signed Fulcrum certificates. The server must still prove it holds the
  certificate's private key, on every connection.
- List two fingerprints, comma-separated, while rotating a certificate.
- Without a pin, `tls://` checks the certificate against the public authorities (and the
  service warns that it is not pinned).
- A certificate that does not match stops the service at startup and fails every
  reconnection.

## Proxy

Only connections to Nostr relays go through the proxy; the Electrum server is always
reached directly.

| Form | Use |
| --- | --- |
| `socks5://127.0.0.1:9050` | Tor or a VPN's SOCKS server; host names are resolved by the proxy, so `.onion` relays work |
| `https://user:pass@proxy.example:443` | An HTTPS proxy (TLS to the proxy, checked against the public web roots, then `CONNECT`) |
| `http://127.0.0.1:3128` | A plain HTTP `CONNECT` proxy on this machine or a private network |

Operators are exempt from proof of work and rate limits. The public cannot request a
lifetime longer than `DEADHOP_DEFAULT_EXPIRY_SECS`.

## Startup checks

- **Keys.** On first start the service creates one Nostr key per purpose in `<data dir>`
  (mode `0600`) and writes the public keys beside them. `server.nsec` / `server.pubkey` is
  the public invoices key: it serves `get_info`, `create_invoice` and `get_invoice`, it is
  the one apps and customers use, and the only one that is announced. `admin.nsec` /
  `admin.pubkey` is the administration key: it serves every tool to operators only and is
  never announced (`deadhop pubkey admin` prints it). The Network tab can give a relay to
  some keys only, and send one key's relays another way with a rule for that key or a default
  route of its own; the default is every key. A key left with no relay, or with every relay
  blocked, is refused, and the administration key keeps one relay from `DEADHOP_RELAYS`. The service refuses to
  start if a key file is readable by others.
- **Chain.** It refuses to start if the Electrum server's genesis block does not match
  `DEADHOP_NETWORK`.
- **Warnings.** It logs a warning for a remote Electrum server, weak proof of work with
  public invoicing on, and `ws://` relays on mainnet.
- **First address.** It logs the receive address at index 0. Confirm that your wallet shows
  that exact address before taking real payments. A wrong account key (for example BIP-49
  instead of BIP-84) still produces valid addresses, but your wallet will not show payments
  to them.

## Example

```sh
export DEADHOP_RELAYS=wss://relay.one.example,wss://relay.two.example
export DEADHOP_ELECTRUM=127.0.0.1:50001
export DEADHOP_XPUB=zpub...                # BIP-84 account key, public only
export DEADHOP_ADMINS=npub1...             # your operator key
export DEADHOP_MIN_CONFIRMATIONS=2
deadhop
```

## Proxies

Relay connections (and only those) can go through proxies. In the dashboard they are under
**Network**: *Proxies* holds the proxy list and the groups, and *Rules* decides where each
relay goes. From the environment, `DEADHOP_PROXY` is the first proxy and `DEADHOP_PROXIES`
adds more.

A proxy counts as reachable when a tunnel through it can be opened to at least one live
relay. Every proxy is probed once a minute, and the result is on the Overview and in
`get_health` (`proxy_pool`).

**Where relays go.** The rules are checked from the top, and the first one that matches a
relay (for that key) decides its route. A rule points at one destination: a proxy, a group,
direct, or block. The **default route** is the last rule, "Everything else": where the
relays that no rule matches go, pointing at a destination like any rule. A key can have a
default route of its own. A default route that blocks makes a rules-only setup. With no
proxy, the default route is direct; the first proxy added in the dashboard becomes the
default route (the page says so, and it can be changed in the last row of Rules).

**Groups.** A group is two or more proxies, in order, and a strategy that picks one of them.
A proxy joins a group only when you put it there, so a proxy added for one rule (Tor for
`*.onion`) never rotates with the others. At most 8 groups.

| Strategy | Use |
| --- | --- |
| Failover | The first reachable proxy in the group's order. When one earlier in the order comes back, the service goes back to it only after it has stayed up for 2 minutes. |
| Round robin | The group's reachable proxies in turn, one change every interval (`rotate_secs`), never per connection. |
| Chaos | A random other reachable proxy after a random time between a shortest and a longest interval (for example 5 to 15 minutes). |

There is no "off" strategy: pointing the default route (or a rule) at one proxy is off.
Nothing rotates, and while that proxy is down the offline policy (or the rule's fallback)
applies, so the address relays see never changes.

A change of proxy reconnects only the relays whose route changed, which is why intervals
are at least a minute. Round robin and chaos need two reachable proxies in the group. With
only one, rotation is **suspended** and that proxy keeps carrying traffic until a second one
is back.

**Fallbacks.** A rule through a proxy or a group says what its relays do while it has
nothing reachable: *stay offline* (the default; a rule through one proxy keeps retrying
it), *follow the offline policy* (as the default route does), or *another destination*
(and if that has nothing reachable either, the offline policy decides). The dashboard says
when a route can end in a direct connection. Tor and I2P relays are never connected
directly: a rule for them cannot go, or fall back, direct.

**When nothing is reachable**, `DEADHOP_PROXY_OFFLINE` (or the setting in the dashboard)
decides what happens to the relays of the default route, and of rules that follow the
offline policy, until a proxy returns. The service checks the proxies all the while, so it
recovers by itself.

| Policy | Those relays |
| --- | --- |
| `kill_switch` (default) | stay disconnected: nothing reaches a relay without a proxy |
| `admin_only` | connect straight for the administration key (the relays see this machine's IP address), so the proxies can be repaired from the dashboard unless they are locked; the public invoices key stays off |
| `invoicing_only` | connect straight for the public invoices key; the administration key stays off |
| `open` | connect straight for every key |

**Settings saved before groups.** Saved settings from an earlier version convert by
themselves at the first start, and routing stays exactly as it was. The proxies that were
"in the default route" become a group "Default" with the old strategy and intervals (or,
with one proxy or the strategy off, the default route points at that proxy). Proxies kept
to some keys become per-key default routes. A rule to the default route points at its
destination and follows the offline policy, and "fall back to the default route" becomes a
fallback to that destination. The old saved settings stay in the database, under
`settings_pre_groups`. A client that still sends `mode`, `rotate_secs`, `chaos_min_secs`,
`chaos_max_secs`, or proxies with `pool` or `keys`, is refused with an error that names
what replaced them. After upgrading, do not start an older version against the same data
directory: it cannot read the new shape and would drop the saved settings.

**Saved routes name the environment's proxies by position.** The proxies from
`DEADHOP_PROXY` and `DEADHOP_PROXIES` are `env1`, `env2`, … in that order, and saved
groups, default routes and rules refer to them by those ids. Reordering the variables
changes which proxy each id is; removing one leaves a saved route pointing at nothing. When
the saved proxy settings no longer fit the environment, the service starts with the
environment's proxies instead, keeps every other saved setting, says so in health, and
keeps the saved proxy settings aside under `settings_dropped_proxies`.

**Transparent proxy.** If you have set up a transparent proxy yourself (the host's
routing, a Tor gateway, a VPN), tell the service with `DEADHOP_TRANSPARENT_PROXY=true`
or the toggle on the Network tab. It then does not probe or use any proxy, and the privacy audit
reports that it cannot check the path. There is no check on purpose: there are too many
ways to build one, and nothing in this process could tell them apart. The proxies, groups
and rules stay saved but inactive. A wrong claim leaks the address, so `DEADHOP_PROXY_LOCKED` covers it.
