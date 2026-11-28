---
title: Hardening
description: What deadhop lnaddr does so invoices keep flowing through relay outages, node restarts, slow backends, floods and bad replies.
---

# Hardening

The rule: **as long as one relay works and the node is up, invoices flow.** Everything else fails fast, clearly, and recovers by itself.

## Relays

- Every event goes to every configured relay; the first relay to accept it wins. A relay that hangs or refuses is skipped, not waited for.
- Relays reconnect by themselves. A test takes the only relay away and brings it back on the same address: while it is gone invoices fail with `503`, and once it is back they resume with neither service restarted. The gateway and node can each list their own relays; they only need one in common.
- The node's relays run on the network engine: proxies are probed every minute against the relays they carry, a proxy switch moves only the relays whose route changed, and every relay is checked end to end every 5 minutes. New relays that do not connect within 30 seconds are undone, and saved relays with nothing connected for 10 minutes (or none at start) give way to the configured ones. See [node configuration](./node.md#relays-and-proxies). The gateway's relays run on the same engine, a lane per key; a proxy switch moves each node pool in place when its relays stay the same (see [gateway configuration](./gateway.md#relays-and-proxies)).
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

- The gateway rate-limits by client address, per minute: invoices, lookups and verifications each have their own budget (lookups get four times as much, since they are cached; verifications too, since wallets poll them).
- A verification polled many times costs the backend one lookup every 2 seconds per invoice at most, none once the invoice is paid or long expired, and none for a payment hash the node did not make.
- The node's invoice record is bounded: unpaid invoices go an hour after they expired, and at most 100,000 are kept.
- The node rate-limits by calling key, globally and per key, whatever the gateway does.
- The gateway holds at most `max_connections` open connections. A client that sends nothing, or idles on a kept-alive connection, is dropped after 10 s, so it cannot hold a slot (tested with one slot: a silent socket and an idle keep-alive client both give way).
- Unknown names, bad amounts and long comments are refused before anything is sent to the node.

## Process

- Each service stops cleanly on SIGINT or SIGTERM, installed at start so a signal during start-up is not lost.
- If the node's request loop ever ends, or its relay connections cannot be remade, the process exits with an error, so the supervisor (Docker, systemd) restarts it.
- If the gateway's console server cannot start, ends or cannot be remade, or its saved network settings cannot be used, the gateway logs it, says so in `get_health`, and keeps serving LNURL; the server is brought back on the next look.
- The node's and the gateway's audit logs (`audit.jsonl`) are kept under 1 MiB, and its relay results in memory under 20,000 entries, so neither grows without bound.
- Logs are quiet by default: libraries that would log every refused or undecryptable event are silenced, so junk traffic cannot fill the disk.
