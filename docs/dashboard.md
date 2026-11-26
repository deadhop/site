---
title: Host the dashboard
description: Serve deadhop's static dashboard over HTTPS with the right headers and config.json, behind Caddy or any web server, and sign in with your Nostr key.
---

# Host the dashboard

The dashboard is a static page. It talks to the service only through the relays, so it can live anywhere: on the node, on a small server, or on a static host.

## With Compose

The `dashboard` container serves it on port 8080 inside Docker and writes its `config.json` at start, from the service's public keys and your relays: `DEADHOP_DASHBOARD_RELAYS` if set, otherwise `DEADHOP_RELAYS`. If the administration key listens on other relays than the public key, list those in `DEADHOP_DASHBOARD_ADMIN_RELAYS`. [Run it with Docker Compose](./deploy-compose.md#_6-reach-the-dashboard) shows how to publish that port on loopback. Then put TLS in front, for example with Caddy:

```text
pay.example.com {
	reverse_proxy 127.0.0.1:8080
	header {
		Content-Security-Policy "frame-ancestors 'none'"
		X-Content-Type-Options nosniff
		Referrer-Policy no-referrer
	}
}
```

## Anywhere else

1. Build it from [deadhop/js](https://github.com/deadhop/js) (Node 22 or newer):

   ```sh
   git clone https://github.com/deadhop/js && cd js
   npm ci && npm run build --workspace dashboard      # → dashboard/dist/
   ```

2. Put a `config.json` next to `index.html`, from `dashboard/public/config.example.json`:

   ```json
   {
     "serverPubkey": "<deadhop pubkey>",
     "adminPubkey": "<deadhop pubkey admin>",
     "relays": ["wss://relay.example.com"]
   }
   ```

   `deadhop pubkey` and `deadhop pubkey admin` print the two keys on the service's host; with Compose, `docker compose run --rm --no-deps deadhop pubkey` and `… pubkey admin` ([Commands](./cli.md)). `relays` are the relays the service listens on.

3. Serve `dist/` over HTTPS with these headers. A `<meta>` policy cannot express the first:

   ```text
   Content-Security-Policy: frame-ancestors 'none'
   X-Content-Type-Options: nosniff
   Referrer-Policy: no-referrer
   ```

## Sending an invoice to a customer

On **Invoices**, choose the drop and **Copy payment link**. The link opens the invoice's own page (`…/#/pay/<id>`) on your dashboard, without signing in, and follows the payment live: awaiting, seen, paid. **Open payment page** shows it to you.

For a customer to open that link, the dashboard must be reachable over HTTPS at a public address. That is only the static page: the service behind it still opens no port.

**Do not publish it from home.** Forwarding a port on your router to the dashboard puts your home address on every payment link. Host the page somewhere else instead: a static host or a small server ([Anywhere else](#anywhere-else)). It talks to the service through the relays, so it can live anywhere.

**Or send the payment details yourself.** Without a public dashboard, open the drop, **Copy address** and send it with the amount, or show the QR code. The service sees the payment either way; the customer just does not get the live status page.

## What the page does

- It has a strict Content-Security-Policy and requests nothing but `config.json` and the relay websockets.
- It refuses to run inside a frame.
- It shows the service key it talks to at the bottom, so customers can compare it with the one you publish.
- It follows relay changes you make from the dashboard: the service writes its live relays to a shared `relays.json` that the page reads (Compose sets this up).

## Sign in

Use a browser extension that holds a Nostr key (NIP-07) and choose **Use browser extension**. A key listed in `DEADHOP_ADMINS`, or added under **Operators**, gets the operator view. Use a key made only for this service.

Pasting a secret key also works; the page keeps it in memory only.

## Tested

The Caddy example was run with Caddy 2, with the site address changed to `localhost`: it served the dashboard over HTTPS with the three headers above. The Compose dashboard behind a loopback port was tested on regtest.
