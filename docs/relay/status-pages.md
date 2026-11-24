---
title: Status pages
description: The deadhop relay web interface, with a public status page, an operator page on loopback, NIP-11 relay information and JSON counters.
---

# Status pages

The relay serves two small pages. Both are rendered on the server with no JavaScript, under a Content-Security-Policy that allows only the relay's own stylesheet and fonts. They refresh themselves every 15 seconds.

## The public status page

On the relay's main address, for a browser (`GET /`):

- the relay's name, description and public addresses;
- uptime, open connections, events relayed, deliveries, **dropped** (green at 0, red otherwise) and refused;
- the last hour as bars: events accepted per minute above the line, refusals below it;
- what the relay carries, in one paragraph.

It names no keys. Anyone can see how busy the relay is, but not whose traffic it carries.

![The public status page](/relay/status.png)

## The operator page

On `DEADHOP_RELAY_STATS_LISTEN` (`127.0.0.1:7448` by default), with no sign-in, so keep it on loopback:

- the same numbers and chart;
- **the whitelist**: each key's label and npub, a green dot while a connection is authenticated as it, requests in and events published;
- **traffic**: events by writer (whitelisted keys, anyone, health checks), events held for a later subscriber, events in memory, connections turned away, on probation and closed, AUTH results, bytes in and out;
- **refusals** by reason (`invalid`, `restricted`, `auth-required`, `rate-limited`, `pow`, `duplicate`, `blocked`);
- **limits**: every limit in effect.

![The operator page during a flood](/relay/operator.png)

When the relay is also served on Tor, I2P or FIPS, the operator page adds links between networks in its header, and a **Networks** row of cards. Each card shows open connections against the network's cap, the last hour as bars, and that hour's events and refusals. Each card opens the network's own page (`/networks/tor`, and so on) with only what arrived over it. The public page then lists every network's address, and no per-network numbers. See [Tor, I2P and FIPS](./networks.md#watching-each-network). With clearnet alone, neither page changes.

## For programs

| Path | Listener | What |
| --- | --- | --- |
| `/` with `Accept: application/nostr+json` | main | NIP-11: name, description, supported NIPs (1, 11, 13, 42, 59), limits, retention |
| `/stats.json` | main | The public numbers and the last hour |
| `/stats.json` | operator | Adds a `networks` list (per-network numbers and history) when the relay is served on more than clearnet |
| `/stats.json` | operator | Everything on the operator page |
| `/health` | both | `ok` |

`/stats.json` and NIP-11 allow any origin (CORS), so other pages can show them.
