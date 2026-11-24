---
title: Tor, I2P and FIPS
description: Serve deadhop relay as an onion service, an I2P server tunnel or on a FIPS address, alone or all at once, with each network's numbers for the operator.
---

# Tor, I2P and FIPS

The relay can be reached on Tor, I2P and FIPS as well as on clearnet, or on any of them alone. Each network is an **adapter**: a listener of its own that your Tor daemon, I2P router or FIPS node forwards connections to. The relay does not run or configure those daemons. You set them up, and tell the relay where they forward to and which address clients use.

Every adapter knows how its network tells clients apart. That keeps the per-client limits working (connections, events per minute, probation), even though every Tor or I2P connection arrives from the daemon on the same machine.

| Network | Clients told apart | Accepted only from |
| --- | --- | --- |
| Clearnet | by address (the last `X-Forwarded-For` entry behind a trusted proxy) | anyone |
| Tor | by circuit, from the PROXY line Tor writes | the Tor daemon |
| I2P | by destination, from the `X-I2P-DestHash` header the tunnel adds | the I2P router |
| FIPS | by node, from the peer's FIPS address | FIPS addresses (fd00::/8) |

With clearnet alone, nothing changes: no new settings, and the same pages, numbers and output as before.

## Settings

Each adapter is turned on by its `_LISTEN` variable, and needs the address clients use.

| Variable | Default | What |
| --- | --- | --- |
| `DEADHOP_RELAY_TOR_LISTEN` | off | Where Tor forwards to, e.g. `127.0.0.1:7451` |
| `DEADHOP_RELAY_TOR_URLS` | required with `_LISTEN` | The onion address, e.g. `ws://….onion` |
| `DEADHOP_RELAY_TOR_DAEMONS` | `127.0.0.1,::1` | The Tor daemon's addresses; only they may connect |
| `DEADHOP_RELAY_TOR_MAX_CONNECTIONS` | 128 | Open connections over Tor, at most |
| `DEADHOP_RELAY_I2P_LISTEN` | off | Where the I2P server tunnel forwards to, e.g. `127.0.0.1:7452` |
| `DEADHOP_RELAY_I2P_URLS` | required with `_LISTEN` | The tunnel's address, e.g. `ws://….b32.i2p` |
| `DEADHOP_RELAY_I2P_DAEMONS` | `127.0.0.1,::1` | The router's addresses; only they may connect |
| `DEADHOP_RELAY_I2P_MAX_CONNECTIONS` | 128 | Open connections over I2P, at most |
| `DEADHOP_RELAY_FIPS_LISTEN` | off | This node's FIPS address and a port, e.g. `[fd12:…]:7447`, or `[::]:7447` |
| `DEADHOP_RELAY_FIPS_URLS` | required with `_LISTEN` | `ws://npub1….fips:7447` |
| `DEADHOP_RELAY_FIPS_MAX_CONNECTIONS` | 128 | Open connections over FIPS, at most |

Addresses must end in `.onion`, `.i2p` or `.fips` respectively. `ws://` is right on all three: each network encrypts the path itself.

**Clearnet off.** With at least one adapter, `DEADHOP_RELAY_LISTEN=off` serves the relay only on the overlays. Without that, clearnet stays on at its default `0.0.0.0:7447`, so an onion-only operator must turn it off.

**Each overlay has its own cap.** New circuits and destinations cost nothing, so per-client limits alone cannot stop a flood over Tor or I2P. Past its `_MAX_CONNECTIONS`, a network's new connections go on probation, as they do past the relay's own limit: they stay only if they authenticate as a whitelisted key. A flood over one network leaves the others, and clearnet, open. Keep the caps together below `DEADHOP_RELAY_MAX_CONNECTIONS` (512) to keep room on clearnet.

**AUTH names the network's own address.** A service that authenticates (NIP-42) over Tor names the onion address, over I2P the `.i2p` address, and so on. Clearnet keeps its rule (`DEADHOP_RELAY_PUBLIC_URLS`, or the host dialled).

## Tor

In `torrc`, an onion service whose port forwards to the adapter, with the circuit exported:

```text
HiddenServiceDir /var/lib/tor/deadhop-relay/
HiddenServicePort 80 127.0.0.1:7451
HiddenServiceExportCircuitID haproxy
```

Reload Tor, read the address from `/var/lib/tor/deadhop-relay/hostname`, and set:

```sh
DEADHOP_RELAY_TOR_LISTEN=127.0.0.1:7451
DEADHOP_RELAY_TOR_URLS=ws://<that address>.onion
```

`HiddenServiceExportCircuitID haproxy` is required. With it, Tor starts each connection with a PROXY protocol line that names the circuit. Without it, the relay refuses the connection, since every client would look the same. It is an option of the C Tor daemon, for v3 onion services.

If Tor runs in another container, list its address in `DEADHOP_RELAY_TOR_DAEMONS` and keep the adapter's port off the host's public interfaces.

## I2P (i2pd)

In i2pd's `tunnels.conf`, a server tunnel of type `http` pointing at the adapter:

```text
[deadhop-relay]
type = http
host = 127.0.0.1
port = 7452
keys = deadhop-relay.dat
```

Restart i2pd, find the tunnel's `.b32.i2p` address on its web console (under I2P tunnels), and set:

```sh
DEADHOP_RELAY_I2P_LISTEN=127.0.0.1:7452
DEADHOP_RELAY_I2P_URLS=ws://<that address>.b32.i2p
```

The type must be `http`. Such a tunnel removes any `X-I2P-*` header a client sends, adds `X-I2P-DestHash` naming the client's destination, and passes WebSocket upgrades through. A plain `server` tunnel adds nothing, and the relay refuses its WebSocket connections with a message saying so. Pages (the status page, `/health`) work either way.

This was checked against i2pd's source. The Java I2P router's HTTP server tunnel also adds `X-I2P-DestHash`, but it has not been tested with the relay.

## FIPS

[FIPS](https://github.com/jmcorgan/fips) gives each node an address in fd00::/8, derived from its Nostr key, and a name `<npub>.fips`. Bind the adapter to your node's FIPS address, or to `[::]`:

```sh
DEADHOP_RELAY_FIPS_LISTEN=[::]:7447
DEADHOP_RELAY_FIPS_URLS=ws://npub1….fips:7447
```

Peers arrive from their own FIPS address, so each node is one client. Connections from outside fd00::/8 are turned away on this listener, so `[::]` cannot be used to reach the relay around its clearnet limits. If clearnet also listens on `[::]`, give the two different ports.

## Watching each network

When the relay is served on more than clearnet, the [operator page](./status-pages.md) shows a card per network:
- open connections against the network's cap;
- the last hour as a strip of bars;
- the events and refusals in that hour.

Each card opens the network's own page, `/networks/<clearnet|tor|i2p|fips>`. It counts only what arrived over that network:
- connections, clients now, services, events, refusals and connections turned away (by a peer that is not the daemon, a missing PROXY line or header, or the cap);
- how the network is reached;
- which whitelisted keys are connected over it.

The public status page lists each network's address and no per-network numbers. On a small anonymous network, per-network counts and minute-by-minute histories could help someone match up users, so they stay on the operator listener.
