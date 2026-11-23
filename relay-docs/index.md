---
title: Overview
description: deadhop relay is a small Nostr relay that carries only deadhop's ContextVM requests and replies, for the service keys you whitelist.
---

# deadhop relay

deadhop is reachable only over [ContextVM](https://contextvm.org) (MCP over Nostr): the service and the dashboard talk through Nostr relays. Public relays work, but they are shared with everyone, rate-limit you with everyone else, and decide on their own what to keep and for how long.

deadhop relay is a relay that carries **one service's traffic and nothing else**. You give it the public keys of your deadhop service (the invoice key, the admin key, or both). It then accepts:

- **requests** (ContextVM messages and gift wraps, kinds 25910, 1059 and 21059) addressed to one of those keys, from anyone;
- **replies** from those keys, and only from them: by their signature, or from a connection that proved the key with NIP-42 AUTH;
- those keys' **announcements** (profile, relay list, ContextVM server and tool announcements).

Everything else is refused before it costs a signature check. The relay will not start without a whitelist.

```text
customer / dashboard ──wss──▶ deadhop relay ◀──wss── deadhop service (AUTH as a whitelisted key)
     requests to the service: anyone           replies: whitelisted keys only
```

## What you get

- **Nothing is dropped.** An event the relay accepts is queued to every live subscriber that may read it. Requests that arrive while the service is reconnecting are held for 30 seconds and delivered when it comes back. In the benchmark, 0 of 300,000 round trips were lost or refused, including runs under floods of up to 970,000 messages a second, on two CPUs. See [Performance](./performance.md).
- **Built for floods.** Per-address connection and write budgets, message rate limits, size caps, timeouts, and connections reserved for whitelisted keys that authenticate. See [Flood resistance](./hardening.md).
- **Requests stay private.** Only a connection authenticated as the key a request is addressed to can read it. Nobody can subscribe to your service's incoming traffic.
- **Small.** One static binary of about 2 MB with no dependencies, about 3 MiB of memory when idle, and about 70 MiB with a thousand busy connections. Nothing is written to disk.
- **A status page** and an operator page, rendered on the server with no JavaScript. See [Status pages](./status-pages.md).

## Where to run it

- **On your own network**, next to deadhop, for the dashboard's admin traffic. Put TLS in front of it (deadhop refuses plain `ws://` relays on mainnet unless they are on loopback, `.onion`, `.i2p` or `.fips`).
- **On a tiny VPS**, as your service's main relay or as a fallback next to public ones. deadhop sends each reply to every relay and uses the first that accepts it, so one more relay never slows anything down.

Next: [Quick start](./quickstart.md).
