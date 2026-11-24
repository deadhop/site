---
title: Quick start
description: Run deadhop relay in a few minutes, whitelist your deadhop invoice and admin keys, and point the service and the dashboard at it.
---

# Quick start

## 1. Find your service's keys

deadhop has two keys: **invoices** (the public one customers reach) and **admin** (operators only). Their public keys are in deadhop's data directory, in `server.pubkey` and `admin.pubkey`, and at the bottom of the dashboard's **Overview**, where each key is shown with a copy button.

Whitelist the keys you want this relay to carry. For an admin-only relay on your own network, the admin key is enough.

## 2. Run the relay

With Docker, from the repository root:

```sh
docker build -f relay/Dockerfile -t deadhop-relay .
docker run -d --name deadhop-relay --restart unless-stopped \
  -p 7447:7447 -p 127.0.0.1:7448:7448 \
  -e DEADHOP_RELAY_WHITELIST="invoices=npub1…,admin=npub1…" \
  deadhop-relay
```

Or build the binary (Rust 1.88 or later):

```sh
cd relay && cargo build --release
DEADHOP_RELAY_WHITELIST="invoices=npub1…,admin=npub1…" ./target/release/deadhop-relay
```

Check the configuration without starting:

```sh
DEADHOP_RELAY_WHITELIST="admin=npub1…" deadhop-relay check
```

Without a whitelist, the relay exits with an error that says what to set. To run a public ContextVM relay instead, for any key, set `DEADHOP_RELAY_PUBLIC=on` (see [Public mode](./security.md#public-mode)).

## 3. Put TLS in front of it

Browsers and deadhop on mainnet need `wss://`. With Caddy:

```text
relay.example.com {
	reverse_proxy 127.0.0.1:7447
}
```

Then set `DEADHOP_RELAY_TRUSTED_PROXIES=127.0.0.1` so the relay limits each client by its real address, and `DEADHOP_RELAY_PUBLIC_URLS=wss://relay.example.com` so AUTH accepts that name. See [Deployment](./deployment.md) for nginx, Traefik and systemd.

## 4. Point deadhop at it

- **Service:** add `wss://relay.example.com` in the dashboard under **Network › Relays** (or to `DEADHOP_RELAYS`). The service authenticates on its own when the relay asks.
- **Dashboard and checkout:** add the same URL to `relays` in the dashboard's `config.json`, or to the relays your checkout passes to `@deadhop/client`. With Compose, `config.json` is written at every start: set `DEADHOP_DASHBOARD_RELAYS` (and `DEADHOP_DASHBOARD_ADMIN_RELAYS` for the administration key) instead.

Open `https://relay.example.com/` to see the status page. On the relay's host, `http://127.0.0.1:7448/` shows the operator page: each whitelisted key with a green dot while the service is connected and authenticated.
