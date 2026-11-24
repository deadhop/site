---
title: Configuration
description: Every deadhop relay setting, read from DEADHOP_RELAY_* environment variables at startup, with its default value and its allowed range.
---

# Configuration

Settings are read once, at startup, from environment variables. Run `deadhop-relay check` to see what the relay understood, without starting it. An empty value counts as unset.

## Whitelist or public mode

One of the two is required.

| Variable | What |
| --- | --- |
| `DEADHOP_RELAY_WHITELIST` | The keys this relay serves, comma-separated. Each is `label=key` or just `key`; a key is an `npub1…` or 64 hex characters. Example: `invoices=npub1…,admin=npub1…`. |
| `DEADHOP_RELAY_WHITELIST_FILE` | Or a file with one entry per line. `#` starts a comment. Both may be used; the lists are joined. |
| `DEADHOP_RELAY_PUBLIC` | `on` carries ContextVM traffic for every key, not only whitelisted ones (default `off`). See [Public mode](./security.md#public-mode). |

Without a whitelisted key and without `DEADHOP_RELAY_PUBLIC=on`, the relay exits with status 2 and says what to set: an empty or mistyped whitelist never opens the relay by accident. Labels are up to 32 printable ASCII characters and appear on the operator page.

A public relay may still have a whitelist. Whitelisted keys then keep everything they have on a private relay: their own store budget, their large queue, and requests to them that only they can read.

## Listening and naming

| Variable | Default | What |
| --- | --- | --- |
| `DEADHOP_RELAY_LISTEN` | `0.0.0.0:7447` | WebSocket and public pages, on clearnet. `off` only when the relay is served on Tor, I2P or FIPS instead ([Tor, I2P and FIPS](./networks.md)) |
| `DEADHOP_RELAY_STATS_LISTEN` | `127.0.0.1:7448` | The operator page (no sign-in). `off` turns it off. |
| `DEADHOP_RELAY_PUBLIC_URLS` | none | The `ws://` or `wss://` addresses clients use, shown on the status page. When set, AUTH must name one of them; when unset, the host the client dialled. Set it on any relay reachable from the internet. |
| `DEADHOP_RELAY_TRUSTED_PROXIES` | none | IP addresses of reverse proxies whose `X-Forwarded-For` (its last entry) is believed |
| `DEADHOP_RELAY_NAME` | `deadhop relay` | Shown on the pages and in NIP-11, at most 64 characters |
| `DEADHOP_RELAY_DESCRIPTION` | one sentence | NIP-11 description and status page lead |
| `DEADHOP_RELAY_ALLOW_PROBE` | `true` | Accept deadhop's relay health check (see [Security](./security.md)) |

## Tor, I2P and FIPS

`DEADHOP_RELAY_TOR_*`, `DEADHOP_RELAY_I2P_*` and `DEADHOP_RELAY_FIPS_*` serve the relay on those networks too, each on a listener of its own. They are all off by default. See [Tor, I2P and FIPS](./networks.md) for every variable and how to set up each daemon.

## Limits

All names start with `DEADHOP_RELAY_`.

| Variable | Default | Range | What |
| --- | --- | --- | --- |
| `MAX_CONNECTIONS` | 512 | 1–1,000,000 | Open connections before new ones go on probation |
| `RESERVED_CONNECTIONS` | 32 | 0–10,000 | Connections on probation at once |
| `CONNECTIONS_PER_IP` | 8 | 1–100,000 | Per IPv4 address or IPv6 /64, before probation |
| `AUTH_GRACE_SECS` | 5 | 1–120 | Time to authenticate, on probation or for a held subscription |
| `HANDSHAKE_SECS` | 10 | 1–120 | Time to send the HTTP request head |
| `IDLE_SECS` | 300 | 2–86,400 | Silence before a connection is closed (pinged every third of it) |
| `MAX_MESSAGE_BYTES` | 131,072 | 1 KiB–16 MiB | Largest message |
| `PUBLIC_MAX_EVENT_BYTES` | 32,768 | 512–16 MiB | Largest event from a key that is not whitelisted |
| `MESSAGES_PER_SEC` | 50 | 1–100,000 | Per connection, with a burst of three seconds' worth; whitelisted connections are exempt |
| `MAX_SUBSCRIPTIONS` | 8 | 1–256 | Per connection |
| `MAX_FILTERS` | 4 | 1–64 | Per subscription |
| `MAX_LIMIT` | 500 | 1–100,000 | Stored events returned per subscription |
| `PUBLIC_EVENTS_PER_MIN` | 600 | 1–1,000,000 | Events per address per minute from keys that are not whitelisted (burst of one minute's worth) |
| `MAX_EVENT_AGE_SECS` | 600 | 10–604,800 | Oldest request accepted |
| `MIN_POW` | 0 | 0–32 | NIP-13 bits required on requests |
| `PROBES_PER_MIN` | 30 | 1–100,000 | Health checks per minute, all addresses together |
| `STORE_TTL_SECS` | 3,600 | 0–604,800 | How long gift wraps (1059) are kept |
| `HOLD_SECS` | 30 | 0–3,600 | How long ephemeral messages are held for late subscribers |
| `STORE_MAX_EVENTS` | 20,000 | 0–10,000,000 | Kept events written by whitelisted keys |
| `PUBLIC_STORE_MAX_EVENTS` | 1,000 | 0–10,000,000 | Kept events written by anyone else (at most 32 MiB with the default size cap) |
| `OPEN_MAX_EVENT_BYTES` | 131,072 | 512–16 MiB | Public mode: largest event between keys that are not whitelisted (a whole reply, so larger than requests) |
| `OPEN_STORE_MAX_EVENTS` | 5,000 | 0–10,000,000 | Public mode: kept events between keys that are not whitelisted, their announcements included |
| `QUEUE_BYTES` | 1 MiB | 64 KiB–1 GiB | Outgoing queue per connection |
| `TRUSTED_QUEUE_BYTES` | 64 MiB | 1 MiB–16 GiB | Outgoing queue for connections authenticated as a whitelisted key; past half of it, requests to that key are refused until it drains |

A value outside its range stops the relay at startup with a message naming the variable.

## Behind more than one proxy

The relay believes only the last `X-Forwarded-For` entry, the one the nearest proxy added. When requests pass through two proxies (for example an edge proxy in front of a platform proxy), that entry is the first proxy's address, and every client looks the same. Per-address limits then act as limits for everyone together: raise `CONNECTIONS_PER_IP` and `PUBLIC_EVENTS_PER_MIN` to totals you are willing to accept, and keep the edge proxy's own rate limits on.

## Sizing for a small VPS

The defaults fit a 512 MiB machine. Memory grows mostly with open connections (about 50–100 KiB each when busy) and with kept events (about 1 KiB each). On 256 MiB, lower `MAX_CONNECTIONS` to 256 and `STORE_MAX_EVENTS` to 5,000. Raise the open-file limit: every connection is a file descriptor (`LimitNOFILE=65536` in the systemd unit).
