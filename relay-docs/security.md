---
title: Security
description: What deadhop relay protects, what it can see, what it trusts, and what it deliberately leaves to the deadhop service and to TLS.
---

# Security

## What the relay sees

ContextVM messages to deadhop are end-to-end encrypted (deadhop requires encryption; NIP-44, usually inside a NIP-59 gift wrap). The relay sees:

- the recipient of each message (its `p` tag);
- when it was sent, and how big it is;
- the address it came from;
- for a plain ContextVM message, the sender's key. For a gift wrap, the sender's key is a random key used once.

It never sees the content. The status page shows only totals. The operator page also shows the whitelisted keys and their message counts.

## What it trusts

- **The whitelist.** Messages signed by a listed key, or sent on a connection that proved a listed key with NIP-42 AUTH, are trusted as the service's own.
- **The proxies you list** in `DEADHOP_RELAY_TRUSTED_PROXIES`, for clients' addresses: only the last `X-Forwarded-For` entry, which the proxy itself added.

An AUTH must name this relay, answer this connection's challenge, and be within 10 minutes of the relay's clock. "This relay" means one of `DEADHOP_RELAY_PUBLIC_URLS` when they are set. Only without them does the relay accept the host the client dialled: that name is the client's to choose, so another relay the service uses could otherwise pass this relay's challenge to the service and replay its answer here. Any key may authenticate, as NIP-42 expects, but only a whitelisted key earns anything.

## What it does not do

- **It does not replace deadhop's own checks.** Proof of work on invoices, rate limits per key, replay protection and operator permissions all live in the service. The relay passes a valid request through whether or not the service will accept it.
- **It does not terminate TLS.** Run it behind Caddy, nginx, Traefik or HAProxy. Plain `ws://` is fine on loopback and inside Tor, I2P or FIPS, which encrypt the path themselves.
- **The operator page has no sign-in.** It listens on loopback by default (`127.0.0.1:7448`). Do not publish it.
- **It keeps nothing across restarts.** Gift wraps held in memory are gone after a restart. deadhop does not depend on stored messages: each request is answered while the client waits for it.

## The health-check exception

deadhop's dashboard checks each relay by sending a test event from one random key to another and watching for it. Neither key is whitelisted. To keep that check meaningful, the relay accepts exactly that event: kind 25910 with the check's fixed text and a single `p` tag. It counts against the sender's per-address budget, then against `PROBES_PER_MIN` (30) across all addresses, and is never stored. Many addresses together can still use up the 30 a minute; the dashboard then shows this relay as rate-limiting, while the service itself is unaffected. Set `DEADHOP_RELAY_ALLOW_PROBE=false` to refuse it; the dashboard will then show this relay as not forwarding events, even though the service works.
