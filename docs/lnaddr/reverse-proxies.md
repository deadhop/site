---
title: Reverse proxies
description: Put lnaddr-gateway behind Caddy, nginx, Traefik, HAProxy, Apache or a Tor onion service. One path prefix to forward, nothing else.
---

# Reverse proxies

The gateway speaks plain HTTP/1.1 on a TCP port or a Unix socket and leaves TLS to your proxy. Forward **one** prefix: `/.well-known/lnurlp/`. Both LNURL requests live under it. If you also want the health check, forward `/healthz`.

Set `trusted_proxies` to the proxy's address so per-client rate limits use the real client address from `X-Forwarded-For`. The gateway takes the last address in that header that is not a trusted proxy, so the proxy must **append** the client's address (nginx's `$proxy_add_x_forwarded_for`, HAProxy's `option forwardfor`, Caddy and Traefik by default), not pass on the client's own header.

A Unix socket has no proxy address to check. On a socket, `X-Forwarded-For` is read only once `trusted_proxies` is set (any entry will do, e.g. `["127.0.0.1"]`, plus any proxies in front of yours). That setting is your statement that the proxy appends. Without it, the gateway ignores the header and every client shares one rate-limit budget, and it logs a warning at startup saying so.

## Caddy

```text
yourdomain.com {
    handle /.well-known/lnurlp/* {
        reverse_proxy 127.0.0.1:8080
    }
}
```

## nginx

```nginx
location /.well-known/lnurlp/ {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Host $host;   # only needed when the gateway serves several domains
}
```

Or over a socket: `listen = "unix:/run/lnaddr/gateway.sock"` and `proxy_pass http://unix:/run/lnaddr/gateway.sock;`.

## Traefik (Docker labels)

```yaml
labels:
  - traefik.http.routers.lnaddr.rule=Host(`yourdomain.com`) && PathPrefix(`/.well-known/lnurlp/`)
  - traefik.http.routers.lnaddr.tls.certresolver=le
  - traefik.http.services.lnaddr.loadbalancer.server.port=8080
```

## HAProxy

```text
frontend https
    bind :443 ssl crt /etc/haproxy/yourdomain.pem
    acl lnurlp path_beg /.well-known/lnurlp/
    use_backend lnaddr if lnurlp
backend lnaddr
    option forwardfor
    server gw 127.0.0.1:8080
```

## Apache

```apache
ProxyPass        "/.well-known/lnurlp/" "http://127.0.0.1:8080/.well-known/lnurlp/"
ProxyPassReverse "/.well-known/lnurlp/" "http://127.0.0.1:8080/.well-known/lnurlp/"
```

## Tor onion service

```text
HiddenServiceDir /var/lib/tor/lnaddr/
HiddenServicePort 80 127.0.0.1:8080
```

List the `.onion` name in `domains`. Its callback URLs use `http://`, as LUD-16 asks.
