---
title: Hide the service
description: Keep relays and everyone else from learning where deadhop runs. Route relay traffic through Tor or a VPN, lock the proxy, choose an offline policy.
---

# Hide the service

deadhop opens no port, so nobody can connect to it. What remains is the address it connects **from**: every relay it uses sees that IP address. This guide hides it.

## 1. Send relay traffic through a proxy

Run Tor (or your VPN's SOCKS server) on the host and point the service at it:

```sh
DEADHOP_PROXY=socks5://127.0.0.1:9050
```

Host names are resolved by the proxy, so `.onion` relays work too:

```sh
DEADHOP_RELAYS=wss://relay.example.com,ws://abcd…xyz.onion
```

Only relay connections use the proxy. The Electrum server is always reached directly, so keep it on the same machine or a private network.

With [Compose](./deploy-compose.md), `127.0.0.1` is the container: use the address of a Tor container on the same Docker network, or the host's address on your network.

## 2. Decide what happens when the proxy is down

`DEADHOP_PROXY_OFFLINE` decides what the service does while no proxy is reachable. It keeps checking, and recovers by itself.

| Policy | While the proxy is down |
| --- | --- |
| `kill_switch` (default) | Disconnects from every relay. Nothing is served, and nothing reveals the address. |
| `admin_only` | Connects straight, answers operators only, so you can repair it from the dashboard. Relays see the address. |
| `invoicing_only` | Connects straight, answers the public only. |
| `open` | Connects straight and carries on. |

Keep `kill_switch` if the address must never show.

## 3. Lock it

```sh
DEADHOP_PROXY_LOCKED=true
```

Without the lock, anyone holding an operator key could change the proxy from the dashboard, for example to one of their own that records the address. With it, every proxy setting can only change on the host.

## 4. More than one proxy (optional)

`DEADHOP_PROXIES` adds proxies after the first, and `DEADHOP_PROXY_MODE` chooses how they are used: `failover`, `round_robin` or `chaos` (a random other proxy after a random time). The modes and their timing are in [Configuration](./configuration.md#proxies).

## 5. Or route the whole host

If the host's routing already sends everything through Tor or a VPN, tell the service so it does not look for a proxy:

```sh
DEADHOP_TRANSPARENT_PROXY=true
```

The service cannot check this. The privacy audit then says it cannot see the path.

## 6. Drop inbound traffic

The service needs no inbound connection at all. Allow outbound connections to the relays (or the proxy) and to the Electrum server, and drop the rest.

## Check it

The dashboard's Overview shows the proxy and whether it is reachable, and a **privacy score**: the checks the service can run on itself, with what to fix. Open the audit from there.

## Further

- [Your own relay on Tor, I2P or FIPS](./relay/networks.md): with the relay as an onion service too, neither end of the conversation has a public address.
- [Security](./security.md) lists what relays can still see: timing, sizes, and which key talks to the service.
