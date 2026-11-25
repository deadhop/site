---
title: Security
description: The threat model of deadhop lnaddr. What a compromised gateway, relay, admin key or node host can and cannot do, and how each is limited.
---

# Security

## What each part can do if it is taken

| Compromised | Can | Cannot |
| --- | --- | --- |
| **The gateway host** | serve its own invoices instead of yours (any LNURL-pay server can: wallets trust the server they fetch from); ask your node for invoices within the node's own limits; see payers' IP addresses and comments | spend anything; reach your node's network; change the node's backend, credential, allowed keys or relays; read your node's address |
| **A relay** | delay or drop messages (another relay still carries them); see that two keys exchange messages; resend a captured request within 5 minutes, which makes the node create one more unpaid invoice (within its rate limits) and sends the answer to the gateway, not to the relay | read them (NIP-44 encrypted, gift-wrapped); forge them (signed); store them (ephemeral events); resend one older than 5 minutes (the node checks the signed timestamp) |
| **An admin key** | change addresses and limits, and the node's relays and proxies, if remote settings are switched on; with proxies not locked, point the node at a proxy it controls and so learn the node's IP address | change the backend, the credential or the allowed keys; change proxies when `proxy_locked` is set; with remote settings off (the default), change anything |
| **The node's host** | everything the invoice credential allows: make invoices | spend, with an invoice-only credential |

Using an invoice-only credential matters most. See [Lightning backends](./backends.md) for each one.

## The node

- **No listening socket.** Only outbound websockets to relays and one HTTP connection to the backend.
- **Allowlist at the transport.** Requests from keys not listed as gateways or admins are dropped before they are parsed. Admin tools additionally check the key; gateway keys get `unauthorized`.
- **Gateways see two tools.** The node has one key for gateways and admins, so its tool list is filtered by caller: a gateway is shown `list_addresses` and `make_invoice` only, and is refused every other tool (the network tools, which open connections from the node's machine, included) before it runs. A test checks this over Nostr for every tool.
- **Network settings are for admins only.** Relays and proxies change only through `update_network` and `reset_network`, from an admin key, while remote settings are on; `proxy_locked` keeps the proxies host-only. Changes are saved in `network.json` and recorded in `audit.jsonl`, both owner-only files in the data directory. The configured relays stay the way back: the node returns to them when saved ones stay unreachable.
- **Its own bounds.** Amounts, comment length, domains, the per-key and global rates and concurrency are the node's own, whatever the gateway sends.
- **Fresh requests only.** A request whose signed timestamp is more than 5 minutes off is refused.
- **Credentials stay put.** The backend URL, credential and certificate pin are host-only settings. A remote change can only touch addresses and limits, relays and proxies, and only if remote settings were switched on.
- **Credentials in the clear stay local.** Plain `http://` to the backend is accepted only for loopback, private addresses, container names, `.local`, `.internal` and overlay hosts, unless `insecure_http` says otherwise.
- **Pinned TLS.** LND and Core Lightning use self-signed certificates: give the certificate file (or its SHA-256), and only that exact certificate is accepted.
- **Private files.** Keys, saved settings and secret files must be owner-only; a secret file others can read is refused, not used.

## The gateway

- **Only LNURL paths in public.** The public listener serves `/.well-known/lnurlp/…` and `/healthz`, nothing else. The admin interface has its own listener (loopback by default); a test checks that every admin path is `404` in public.
- **Domains from configuration.** Callback URLs are built from configured domains, never from the request's `Host`. With several domains, the request's host picks one from the list; `X-Forwarded-Host` counts only from configured `trusted_proxies` or a Unix socket, and `X-Forwarded-For` only from configured `trusted_proxies`. On a Unix socket without them, all clients share one rate-limit budget.
- **Every invoice checked** before a wallet sees it: amount, description hash, network, expiry and the optional pinned payee.
- **Rate limits and connection limits** (see [hardening](./hardening.md)).

## The admin web interface

- Off unless `admin.listen` is set. It refuses to share the public listener.
- Sign-in token in `admin.token` (owner-only), compared in constant time, 5 attempts per minute per address.
- Sessions are random 256-bit cookies, `HttpOnly`, `SameSite=Strict`, `Secure` unless on loopback, 12 hours, at most 32 at once. A `Secure` session cookie is named `__Host-lnaddr_session`, so a browser refuses it from a subdomain or a plain-HTTP response.
- Every form carries the session's CSRF token, and a request whose `Origin` is another site is refused.
- Pages are rendered on the server with no JavaScript, under `default-src 'none'` with `frame-ancestors 'none'`.

## Known limits

- LNURL-pay trusts the HTTPS server. Whoever controls your domain's TLS or the gateway host can hand out other invoices. Pin your node's key on the gateway (`payee`) so the gateway at least refuses invoices your node did not sign.
- Comments and payer IPs pass through the gateway. Run it somewhere you trust as much as your web server. Comments end up in the node's log (one escaped line per invoice) and nowhere else.
- Not tested against a live LND, Core Lightning, phoenixd or LNbits in CI. The backend clients are tested against fakes that follow each API's documentation and sign real invoices.
