---
title: Connect your Electrum server
description: Point deadhop at your own Fulcrum or electrs server, on the same machine or across a network with a pinned TLS certificate, and check that it answers.
---

# Connect your Electrum server

deadhop learns about payments from an Electrum server: [Fulcrum](https://github.com/cculianu/Fulcrum) or [electrs](https://github.com/romanz/electrs), running next to Bitcoin Core. Most node packages offer one of them. It must be **yours**: the server learns every address you issue, and it decides what deadhop believes was paid. [Why Electrum](./design.md#electrum-not-bitcoin-core-rpc).

deadhop does not trust it blindly. It re-hashes every transaction it is given against its id, counts confirmations itself, and checks the chain's genesis block on every reconnect.

## On the same machine

Use the plain TCP port. Fulcrum and electrs listen on `50001` by default:

```sh
DEADHOP_ELECTRUM=127.0.0.1:50001
```

With [Compose](./deploy-compose.md), `127.0.0.1` is the container, not the host: use the host's address on your network instead.

## Across a network: TLS with a pinned certificate

Use the server's TLS port (Fulcrum's default is `50002`) and pin its certificate.

1. Read the fingerprint from the server:

   ```sh
   deadhop fingerprint node.lan:50002
   ```

   ```text
   TLS certificate of node.lan:50002, SHA-256:
     3f:a1:…

   To pin it:
     DEADHOP_ELECTRUM=tls://node.lan:50002
     DEADHOP_ELECTRUM_CERT_SHA256=3f:a1:…
   ```

   With Compose: `docker compose run --rm --no-deps deadhop fingerprint node.lan:50002`.

2. **Compare it on the node.** The command trusts whatever answered. On the machine that runs Fulcrum:

   ```sh
   openssl x509 -in /path/to/fulcrum/cert.pem -noout -fingerprint -sha256
   ```

   The two must match.

3. Set both lines it printed.

A pinned certificate is accepted whatever its name, issuer or expiry, which suits a self-signed Fulcrum certificate. The server must still prove it holds the certificate's key on every connection. While you rotate a certificate, list both fingerprints, comma-separated.

Without a pin, `tls://` checks the certificate against the public authorities and the service warns that it is not pinned.

## A server with no TLS port

electrs, and some node packages, offer plain TCP only. On a network you trust, the plain address works across machines:

```sh
DEADHOP_ELECTRUM=192.168.1.20:50001
```

The service then warns on every start, and on the dashboard: *DEADHOP_ELECTRUM is not on this machine: the link is unencrypted and whoever runs or can intercept that server decides which invoices look paid.* Use it only on your own network, or put a TLS proxy in front of the server and pin that.

## Check it

The service refuses to start if the server is on another chain than `DEADHOP_NETWORK`, or if the certificate does not match the pin. Once it runs, the dashboard's Overview shows the chain's height under **Chain**, and when it was last polled.

`just live-electrum` in a checkout of [deadhop/server](https://github.com/deadhop/server) runs a read-only check against a server named in `.env.local` (`DEADHOP_TEST_ELECTRUM_HOST`, `DEADHOP_TEST_ELECTRUM_PORT`).

## Keep it private

Put the Electrum server on the same machine or a private network, never on the internet. The service reaches it directly, never through the relay proxy.
