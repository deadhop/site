---
title: Performance
description: How deadhop lnaddr keeps a Lightning address fast, with cached parameters, one Nostr round trip per invoice, first relay wins and pooled backend connections.
---

# Performance

A wallet waits on two requests. Only the second needs your node, and that one costs a single round trip over Nostr.

## Parameters come from a cache

The first request (`/.well-known/lnurlp/<name>`) never leaves the gateway. The gateway keeps each node's `list_addresses` answer and refreshes it in the background every `cache_secs` (60 s by default). It also refreshes on a miss, at most once every 10 s, so a burst of lookups for names that do not exist cannot turn into a burst of node calls. Responses carry `Cache-Control: public, max-age=60`, so a CDN in front of the gateway may cache them too.

## One round trip per invoice

- **Stateless calls**: no MCP handshake per request and no session to rebuild after a restart. One encrypted request event, one encrypted reply.
- **First relay wins**: an event goes to every relay at once, and the send returns when the first relay accepts it. A relay that is slow, hanging or still connecting never delays an invoice that a working relay already carried. (The usual pool waits for every relay; one dead relay then adds its whole timeout to every request.)
- **Warm connections**: both services keep their relay websockets open, and the node keeps a pooled keep-alive HTTP connection to its backend.

## The node works in parallel, within limits

Up to `limits.concurrent` (8) backend calls run at once. Requests beyond that wait for at most half the backend timeout, then get `busy`, so a stuck backend sheds load instead of piling it up.

## What it costs

- Each binary is about 8 MB, statically linked, and starts in milliseconds.
- Measured with the default relays (`relay.contextvm.org` and `relay2.contextvm.org`), a gateway and a node on the same home connection, and a local backend:

```text
lookup 0.000433s   invoice 0.198533s
lookup 0.000496s   invoice 0.274767s
lookup 0.000370s   invoice 0.278624s
lookup 0.000930s   invoice 0.167624s
lookup 0.000635s   invoice 0.281922s
```

  Lookups are answered from the cache in under a millisecond. An invoice is one round trip through the relays, 170 to 280 ms here, plus your backend's own time. With an in-process relay (the test suite) the whole flow takes a few milliseconds. The `test` command prints the same split for your setup.

## Tuning

| Setting | Default | Effect |
| --- | --- | --- |
| gateway `cache_secs` | 60 | how stale a changed description or range may be before the next refresh (the invoice path refreshes at once if the node's metadata changed) |
| gateway `timeout_secs` | 15 | the wallet-facing deadline; each node call gets 45% of it, so one retry fits |
| node `limits.concurrent` | 8 | backend calls in flight |
| relays | `relay.contextvm.org`, `relay2.contextvm.org` | two or three relays near both services keep the round trip short |
