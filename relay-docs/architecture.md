---
title: How it works
description: The write and read rules of deadhop relay, how events fan out to subscribers, what it keeps in memory, and why nothing accepted is dropped.
---

# How it works

## Who may write what

Every `EVENT` is judged in order of cost. The cheap checks come first, so junk is refused before it costs a Schnorr signature check.

1. **Time.** More than 15 minutes in the future is refused.
2. **Announcements** (kinds 0, 10002, 11316–11320): only from a whitelisted key.
3. **Other kinds:** only ContextVM messages (25910) and gift wraps (1059, 21059). Anything else is `blocked:`.
4. **From a whitelisted key**, or on a connection that authenticated as one (NIP-42): accepted. This is how replies get through: a gift-wrapped reply is signed by a random key, so the relay can only know it comes from the service by the connection it arrives on.
5. **To a whitelisted key** (a `p` tag): a request. It must be at most 32 KiB and at most 10 minutes old, fit within the sender's address budget, and carry proof of work if you require it (NIP-13). If the service's connection is backed up (its queue more than half full), the request is refused with `rate-limited:`; it is not accepted and then lost. `@deadhop/client` reports such a refusal as the service not being reachable, and the customer or dashboard can try again.
6. **deadhop's relay health check** (a fixed text to one random key): accepted within its own small budget, so the dashboard's relay check works. It is never stored.
7. **Anything else** is refused: `auth-required:` without AUTH, `restricted:` with AUTH as a key that is not whitelisted.

Then duplicates are answered `duplicate:` (and not sent again), and the id and signature are checked.

## Who may read what

- Every filter must name `#p` or `authors`. There is no firehose.
- A request (written by anyone, addressed to a whitelisted key) is delivered **only to connections authenticated as that key**. A subscription to a whitelisted key's `#p` waits up to 5 seconds for AUTH, then is closed. deadhop authenticates as soon as it is challenged, so in practice it never waits.
- Replies and announcements from whitelisted keys go to any matching subscription. The client reading its replies subscribes to its own `#p`.

So the costly path, one request copied to many readers, does not exist: a request has exactly one kind of reader.

## Fan-out

Subscriptions are indexed by the keys they name. An event visits only the subscriptions of its author and its recipients, however many connections are open.

Each connection has a writer task and an outgoing queue measured in bytes: 1 MiB for ordinary connections, 64 MiB for connections authenticated as a whitelisted key. Fan-out never waits on a socket. An ordinary connection that stops reading and fills its queue is closed, and nobody else slows down. A whitelisted connection is never closed for that; writers to it are refused well before its queue is full.

Short-lived socket errors (the kernel out of buffers, a write that would block) are retried for up to 2 seconds. If a socket fails for good, the whole connection is closed, so the client reconnects instead of staying attached to a writer that is gone.

## What it keeps

Everything lives in memory. Nothing is written to disk.

| What | How long |
| --- | --- |
| Gift wraps (1059) | `DEADHOP_RELAY_STORE_TTL_SECS` (1 hour) |
| Ephemeral messages (25910, 21059) | `DEADHOP_RELAY_HOLD_SECS` (30 s), so a reconnecting service still gets them; a connection authenticated as the recipient gets all of them back, not only the newest `MAX_LIMIT` |
| Announcements | the latest per key and kind, until replaced |
| Event ids | the last 200,000, to answer duplicates |

Writes from anyone and writes from whitelisted keys have separate budgets (`PUBLIC_STORE_MAX_EVENTS`, 1,000; `STORE_MAX_EVENTS`, 20,000), so a flood of requests can never push out a reply. The first is also the bound on what can be held for an absent service: if more than 1,000 requests arrive while it is away, the oldest are gone when it returns.

## Why nothing accepted is dropped

"Dropped" here means: the relay answered `OK true`, and a live subscription that may read the event never received it.

- An event is stored before it fans out, and a subscription is registered before it reads the store. Whatever the timing, a new subscription sees the event at least once.
- Fan-out queues without waiting, and whitelisted connections have room for 64 MiB of backlog.
- When the service cannot keep up, new requests to it are refused (`rate-limited:`), not accepted and lost. A refused request is the client's to retry; an accepted one is the relay's to deliver.
- If a connection's socket fails, the connection is closed. Its client reconnects and finds the messages held for it.
- The only way left to lose a delivery is an ordinary reader that stops reading until its queue overflows. That connection is closed, and the event is counted on the status pages as **Dropped**. In every benchmark run that count stayed at 0.
