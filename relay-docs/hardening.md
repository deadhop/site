---
title: Flood resistance
description: How deadhop relay keeps serving its whitelisted keys under floods of connections, junk, spam requests and slow readers, and the limits you can tune.
---

# Flood resistance

A relay that serves one service has one job under attack: keep the service's own traffic moving. Each defence below costs an attacker more than it costs the relay, and none of them touches a connection that authenticated as a whitelisted key.

## At the door

| Defence | Default | Setting |
| --- | --- | --- |
| Request head size | 8 KiB | fixed |
| Time to send the request head | 10 s | `HANDSHAKE_SECS` |
| Open connections, all addresses | 512 | `MAX_CONNECTIONS` |
| Open connections per address (IPv4, or IPv6 /64) | 8 | `CONNECTIONS_PER_IP` |
| Half-open handshakes | `MAX_CONNECTIONS` + `RESERVED_CONNECTIONS` | fixed |

A connection over either limit is not turned away at once: it goes on **probation**. It gets the AUTH challenge and has `AUTH_GRACE_SECS` (5 s) to prove a whitelisted key. If it does, it stays, with no limits. If it does not, it is closed. Its subscriptions wait for the AUTH. At most `RESERVED_CONNECTIONS` (32) connections are on probation at once, and at most 2 from any one address. Past that, the relay answers `503`.

So filling the ordinary slots does not lock out your service: deadhop authenticates as soon as it is challenged, which earns it a reserved slot. To keep the reserved slots full as well, an attacker needs at least 16 addresses each reconnecting every few seconds; a firewall limit on new connections per address (below) makes that much harder.

## On each connection

| Defence | Default | Setting |
| --- | --- | --- |
| Message size | 128 KiB | `MAX_MESSAGE_BYTES` |
| Messages per second (burst of 3 seconds' worth) | 50 | `MESSAGES_PER_SEC` |
| Subscriptions | 8 | `MAX_SUBSCRIPTIONS` |
| Filters per subscription | 4 | `MAX_FILTERS` |
| Idle time before close (the relay pings first) | 300 s | `IDLE_SECS` |
| Outgoing queue | 1 MiB | `QUEUE_BYTES` |

Over the message rate, each message is answered `rate-limited:`. After 50 of those, the connection is closed.

## On each write

| Defence | Default | Setting |
| --- | --- | --- |
| Requests per address per minute | 600 | `PUBLIC_EVENTS_PER_MIN` |
| Size of a request (whitelisted keys may send up to `MAX_MESSAGE_BYTES`) | 32 KiB | `PUBLIC_MAX_EVENT_BYTES` |
| Requests while the service's queue is more than half full | refused | `TRUSTED_QUEUE_BYTES` |
| Oldest request accepted | 10 min | `MAX_EVENT_AGE_SECS` |
| Proof of work on requests (NIP-13) | off | `MIN_POW` |
| Relay health checks per minute, all addresses | 30 | `PROBES_PER_MIN` |

Every check runs before the signature check. Duplicates are answered from a list of recent ids, without checking the signature again.

## Behind a reverse proxy

Behind a proxy, every client seems to come from the proxy's address, and per-address limits would apply to everyone at once. List the proxy in `DEADHOP_RELAY_TRUSTED_PROXIES`: for connections from those addresses, the relay uses the **last** address in `X-Forwarded-For`, the one the proxy added. Earlier entries, and `X-Real-IP`, can come from the client and are ignored. Make sure your proxy appends to or overwrites `X-Forwarded-For` (Caddy and Traefik do by default; see [Deployment](./deployment.md) for nginx).

## What stays out of reach

- **Reading requests.** A request is delivered only to a connection authenticated as its recipient. Subscribing to a service's `#p` without that AUTH gets nothing.
- **Amplification.** No event is copied to an attacker-chosen crowd: requests go only to their recipient, and replies only come from whitelisted keys.
- **Evicting replies.** Requests and replies have separate storage budgets.

## What it cannot stop

- **Floods bigger than the link.** A volumetric attack on the network fills the pipe before the relay sees it. Run a second relay elsewhere: deadhop sends each reply to every relay and uses whichever answers first.
- **Valid requests within budget.** A request that passes every check reaches the service. The service has its own limits: proof of work on invoices, and rate limits per key and overall. An attacker with thousands of addresses can send more than the service can read; the relay then refuses requests to it (legitimate ones too) until it catches up, rather than accepting and losing them. `MIN_POW` makes each address's requests costly.
- **Holding the door.** The handshake budget is shared: about 544 sockets that never send a request head block new connections for up to `HANDSHAKE_SECS`. And connections that answer pings may stay idle and hold every ordinary slot; a whitelisted key then still gets in on probation, unless many addresses also keep the reserved slots full. A firewall rate limit on new connections per address (nftables, or your provider's) closes both gaps.
