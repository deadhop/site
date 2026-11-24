---
title: Quick start
description: Run lnaddr-node next to your Lightning node and lnaddr-gateway on a public host, pair their keys, and pay your new Lightning address.
---

# Quick start

You need a Lightning node (LND, Core Lightning, phoenixd or LNbits), a public host with a domain, and a reverse proxy that terminates TLS for that domain. Each service is one static binary, or one image.

## 1. Build the two images

There are no published images yet. From a checkout of the repository:

```sh
git clone https://github.com/sandwichfarm/deadhop
cd deadhop
docker build -f lnaddr/Dockerfile --target node    -t deadhop-lnaddr-node .
docker build -f lnaddr/Dockerfile --target gateway -t deadhop-lnaddr-gateway .
```

Or build the binaries with Rust 1.88 or newer: `cd lnaddr && cargo build --release`.

## 2. Make both keys

Each service makes its Nostr key on first use and keeps it in its data directory (owner-only).

```sh
# on the public host
docker run --rm -v gateway-data:/data deadhop-lnaddr-gateway pubkey
npub1gw…

# next to the Lightning node
docker run --rm -v node-data:/data deadhop-lnaddr-node pubkey
npub1node…
```

## 3. Run the node service

Give it an invoice-only credential (see [Lightning backends](./backends.md)), the gateway's key, and the names to serve. Here `/path/to/lnd-secrets` holds LND's `invoice.macaroon` and `tls.cert`:

```sh
docker run -d --name lnaddr-node --restart unless-stopped \
  -v node-data:/data -v /path/to/lnd-secrets:/secrets:ro \
  -e LNADDR_NODE_BACKEND=lnd \
  -e LNADDR_NODE_BACKEND_URL=https://lnd:8080 \
  -e LNADDR_NODE_BACKEND_SECRET_FILE=/secrets/invoice.macaroon \
  -e LNADDR_NODE_BACKEND_TLS_CERT_FILE=/secrets/tls.cert \
  -e LNADDR_NODE_GATEWAYS=npub1gw… \
  -e LNADDR_NODE_ADDRESSES=you \
  deadhop-lnaddr-node
```

It publishes no port. To confirm the backend works before pairing, run the same image once with `check` (the same `-v` and `-e` options, `--rm` instead of `-d --name … --restart …`, and `check` at the end): it makes a 1 sat test invoice and checks it.

- **Reaching LND.** `https://lnd:8080` is LND's REST port seen from this container: here LND runs in a container named `lnd` on a Docker network that `lnaddr-node` joins (add `--network <that network>`). Use your own address. LND must listen for REST on an address the container can reach (`restlisten=0.0.0.0:8080` in `lnd.conf`). The `tls.cert` you mount is pinned exactly, so its host name does not have to match. `127.0.0.1` would be the container itself.
- **Relays.** Both sides use `wss://relay.contextvm.org` and `wss://relay2.contextvm.org` unless you set `LNADDR_NODE_RELAYS` and `LNADDR_GATEWAY_RELAYS` ([node](./node.md), [gateway](./gateway.md)).

## 4. Run the gateway

```sh
docker run -d --name lnaddr-gateway --restart unless-stopped \
  -v gateway-data:/data -p 127.0.0.1:8080:8080 \
  -e LNADDR_GATEWAY_DOMAIN=yourdomain.com \
  -e LNADDR_GATEWAY_NODE=npub1node… \
  -e LNADDR_GATEWAY_TRUSTED_PROXIES=172.16.0.0/12 \
  deadhop-lnaddr-gateway
```

`LNADDR_GATEWAY_TRUSTED_PROXIES` names your reverse proxy, so per-client rate limits see the real client address ([why](./reverse-proxies.md)). `172.16.0.0/12` covers Docker's default networks, which is where a reverse proxy on the host appears from inside the container; use your proxy's address if it differs.

The public host needs your domain's DNS pointing at it and ports 80 and 443 open for the reverse proxy. Your node needs inbound liquidity to receive.

Point your reverse proxy's `/.well-known/lnurlp/` at `127.0.0.1:8080` ([examples](./reverse-proxies.md)).

## 5. Check it end to end

```sh
docker exec lnaddr-gateway /lnaddr-gateway test you 21
you@yourdomain.com
  callback   https://yourdomain.com/.well-known/lnurlp/you/callback
  range      1–1000000 sat, comments 0
  invoice    lnbc210n1…
  checked    amount 21 sat, description hash, network, expiry
  timing     lookup 2 ms, invoice 310 ms over ContextVM
```

Then pay `you@yourdomain.com` from any wallet.
