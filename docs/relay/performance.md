---
title: Performance
description: Benchmark results for deadhop relay, with round trips per second, latency, memory and drop counts under sustained load and message floods.
---

# Performance

## How it was measured

`bench/` in [deadhop/relay](https://github.com/deadhop/relay) starts the relay and plays every part over real WebSockets:

- **the service:** one connection that authenticates as the whitelisted key, subscribes to its requests, and answers each one with a signed ContextVM reply, as deadhop does;
- **clients:** each one on its own connection and its own address, sending requests at a fixed rate and waiting for the answers;
- **attackers:** connections from rotating addresses that send as fast as they can. They send valid spam requests to the service, duplicates, refused kinds, garbage, unscoped and snooping subscriptions, and oversized events. When the relay closes a connection, the attacker reconnects from a new address.

Every connection claims its own address through `X-Forwarded-For`, with the bench's loopback listed as a trusted proxy, so the per-address limits act as they would on the internet.

**Dropped** counts requests the relay accepted that never reached the service, plus answers it accepted that never reached their client.

## Results

Run on 2026-11-23 inside one Linux container limited to **2 CPUs and 1 GiB of memory** (OrbStack on an Apple Silicon laptop), with the relay, every client and every attacker sharing those two CPUs. Results are in `relay/bench/results/2026-11-23/`.

| Run | Clients × rate | Attackers | Round trips/s | Dropped | Refused | p50 / p99 latency | Attack messages | Peak memory |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| load-2k | 400 × 5/s | 0 | 1,969 | **0** of 60,000 | 0 | 7.9 / 34.2 ms | 0 | 47 MiB |
| load-5k | 1,000 × 5/s | 0 | 4,823 | **0** of 150,000 | 0 | 10.6 / 27.5 ms | 0 | 71 MiB |
| flood | 200 × 5/s | 32 | 992 | **0** of 30,000 | 0 | 28.8 / 63.2 ms | 29,426,592 | 50 MiB |
| flood-big | 400 × 5/s | 64 | 1,954 | **0** of 60,000 | 0 | 92.8 / 178.2 ms | 25,340,831 | 72 MiB |

A round trip is a request delivered to the service and its answer delivered back to the client: four messages through the relay. Idle, the relay uses about 2.7 MiB.

In the floods, the attackers sent about 973,000 (flood) and 825,000 (flood-big) messages a second, including gift wraps of 30 and 40 KB and valid subscriptions that make the relay search its store. The relay refused them, answered them as duplicates, or closed the connection that sent them; attacker connections were closed and reopened 620–820 times a second. What got through was the attackers' distinct valid requests, each within its address's budget (12,544 and 25,088), and those reached only the service. The service's own traffic was never refused and never lost. Latency rose because attackers, clients, service and relay all shared two CPUs.

When the service cannot keep up at all, the relay refuses new requests to it (`rate-limited:`) instead of accepting them and losing them. An earlier run on the bare laptop, with no CPU limit, reached that point: about a fifth of the requests were refused, none was dropped.

Do not run the floods on a desktop: they open thousands of sockets and can exhaust the machine's network buffers. Use a limited container, as here, or a server.

## Why it is fast

- **Cheap checks first.** Kind, time, whitelist, budget and duplicates are all checked before the Schnorr signature.
- **Indexed fan-out.** An event visits only the subscriptions of its author and recipients.
- **Serialised once.** Subscribers get the exact bytes the event arrived as.
- **Nothing waits on a socket.** Each connection has its own writer and a queue measured in bytes. A slow reader affects nobody else.
- **Small buffers.** 8 KiB of WebSocket buffer each way per connection, instead of the usual 128 KiB.

## Run it yourself

```sh
just bench                # in deadhop/relay: about 4 minutes, in a 2-CPU, 1 GiB container; writes bench/results/<date>/
```

Or run one case: `bench/target/release/deadhop-relay-bench <relay binary> <out.json> <clients> <rate/s> <secs> <attackers>`.
