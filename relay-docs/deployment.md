---
title: Deployment
description: Run deadhop relay on a tiny VPS with systemd or Docker, behind Caddy, nginx or Traefik, or on your home network next to deadhop.
---

# Deployment

The relay is one static binary. It needs no disk, and no database or runtime. Everything below is in `relay/deploy/` in the repository.

## On a small VPS with systemd

```sh
cd relay && cargo build --release        # or copy the binary out of the Docker image
sudo install -m 0755 target/release/deadhop-relay /usr/local/bin/
sudo install -m 0600 deploy/deadhop-relay.env.example /etc/deadhop-relay.env   # then edit it
sudo install -m 0644 deploy/deadhop-relay.service /etc/systemd/system/
sudo systemctl enable --now deadhop-relay
journalctl -u deadhop-relay              # "listening on 0.0.0.0:7447 for 2 whitelisted key(s)"
```

The unit runs the relay as a throwaway user with no write access anywhere. It allows 65,536 open files and caps memory at 256 MiB.

## With Docker

```sh
docker build -f relay/Dockerfile -t deadhop-relay .           # from the repository root; about 2 MB
DEADHOP_RELAY_WHITELIST="invoices=npub1…" docker compose -f relay/deploy/compose.yaml up -d
```

The image is the binary on an empty base, running as an unprivileged user. Inside a container the operator page listens on `0.0.0.0:7448`, so publish it to the host's loopback only (`127.0.0.1:7448:7448`, as the compose file does).

## TLS in front

Browsers, and deadhop on mainnet, need `wss://`. Any reverse proxy that passes WebSockets will do. Tell the relay about it:

```sh
DEADHOP_RELAY_TRUSTED_PROXIES=127.0.0.1           # the proxy's address, as the relay sees it
DEADHOP_RELAY_PUBLIC_URLS=wss://relay.example.com
```

**Caddy**

```text
relay.example.com {
	reverse_proxy 127.0.0.1:7447
}
```

**nginx**

```nginx
location / {
    proxy_pass http://127.0.0.1:7447;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $remote_addr;   # overwrite: the relay reads the last entry
    proxy_read_timeout 600s;
}
```

**Traefik** (Docker labels)

```yaml
labels:
  - traefik.http.routers.relay.rule=Host(`relay.example.com`)
  - traefik.http.routers.relay.tls.certresolver=letsencrypt
  - traefik.http.services.relay.loadbalancer.server.port=7447
```

With Traefik in Docker, the relay sees the proxy's container address. Put that address in `DEADHOP_RELAY_TRUSTED_PROXIES`.

## On your home network, for admin traffic

Run the relay next to deadhop and whitelist only the admin key. The dashboard then reaches the service through a relay you control, and public relays never see your admin traffic.

- Give it a name with TLS (for example behind the same Traefik as the dashboard), or reach it over Tor, I2P or FIPS. On mainnet, deadhop accepts plain `ws://` relays only on loopback and on `.onion`, `.i2p` and `.fips` hosts.
- In the dashboard, under **Network › Relays**, add the relay and set it as the admin key's relay. Keep at least one other relay for the admin key until this one has proved itself.
- Add it to `relays` in the dashboard's `config.json` so the browser uses it too.

## As a fallback next to public relays

deadhop sends each reply to every relay it uses and returns as soon as one accepts it, so adding this relay never slows anything down. Customers' checkouts can list it next to public relays. If the public relays rate-limit or drop messages, this one still carries them.

## Checking it

- `https://relay.example.com/` shows the status page.
- `curl -H 'Accept: application/nostr+json' https://relay.example.com/` returns the NIP-11 document.
- `curl http://127.0.0.1:7448/stats.json` on the relay's host returns every counter. A whitelisted key with `"sessions": 1` means the service is connected and authenticated.
- `/health` answers `ok`, for load balancers and uptime checks.
