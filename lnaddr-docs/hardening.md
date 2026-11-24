---
title: Hardening
description: What deadhop lnaddr does so invoices keep flowing through relay outages, node restarts, slow backends, floods and bad replies.
---

# Hardening

The rule: **as long as one relay works and the node is up, invoices flow.** Everything else fails fast, clearly, and recovers by itself.

## Relays

- Every event goes to every configured relay; the first relay to accept it wins. A relay that hangs or refuses is skipped, not waited for.
- Relays reconnect by themselves. A test takes the only relay away and brings it back on the same address: while it is gone invoices fail with `503`, and once it is back they resume with neither service restarted. The gateway and node can each list their own relays; they only need one in common.
- Encrypted messages are **ephemeral gift wraps** (kind 21059). Relays forward them and store nothing, so a stored reply can never be replayed to a later request. Tests found this: with persistent gift wraps (kind 1059) a restarted client could receive an old reply.

## Node restarts

- Calls are stateless, so there is no session to lose. The first invoice after a node restart works without restarting the gateway.
- While the node is down, lookups are still answered from the gateway's cache, and invoices fail within the deadline with a clear LNURL error (`503`). A gateway that has never reached its node answers `503` too, not "no such address".
- A call that times out is retried once if the deadline allows. Each call is a fresh request; at worst the backend makes one extra unpaid invoice that expires.
- A client whose relay connection died is rebuilt on the next call.

## Backends

- Every backend call has a timeout (10 s by default) and a bound on calls in flight. Beyond it, callers get `busy` after half a timeout instead of queuing forever.
- Backend errors are logged on the node in one printable line of at most 200 characters. The gateway and the wallet only learn that the node did not make an invoice.
- Every invoice is checked twice, by the node and again by the gateway: amount, description hash, network, at least 30 s left before expiry, and (if pinned) the signing key. If the description changed on the node since the gateway's last refresh, the gateway refreshes once and checks again before refusing.

## Floods and abuse

- The gateway rate-limits by client address, per minute: invoices and lookups each have their own budget (lookups get four times as much, since they are cached).
- The node rate-limits by calling key, globally and per key, whatever the gateway does.
- The gateway holds at most `max_connections` open connections. A client that sends nothing, or idles on a kept-alive connection, is dropped after 10 s, so it cannot hold a slot (tested with one slot: a silent socket and an idle keep-alive client both give way).
- Unknown names, bad amounts and long comments are refused before anything is sent to the node.

## Process

- Each service stops cleanly on SIGINT or SIGTERM, installed at start so a signal during start-up is not lost.
- If the node's request loop ever ends, the process exits with an error, so the supervisor (Docker, systemd) restarts it.
- Logs are quiet by default: libraries that would log every refused or undecryptable event are silenced, so junk traffic cannot fill the disk.
