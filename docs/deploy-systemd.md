---
title: Run it under systemd
description: Build the deadhop binary, give it its own user, an environment file and a hardened systemd unit, and run it with your own wallet's account key.
---

# Run it under systemd

One binary, about 8 MB, with SQLite inside. No Docker.

Under systemd, give the service your own wallet's account key (`DEADHOP_XPUB`). The generated wallet, kept in a container with no network, is set up by [Docker Compose](./deploy-compose.md).

## 1. Build it

Rust 1.88 or newer:

```sh
git clone https://github.com/sandwichfarm/deadhop
cd deadhop/server && cargo build --release
sudo install -m 0755 target/release/deadhop /usr/local/bin/deadhop
```

## 2. A user and a data directory

```sh
sudo useradd --system --home /var/lib/deadhop --shell /usr/sbin/nologin deadhop
sudo install -d -o deadhop -g deadhop -m 0700 /var/lib/deadhop
```

The data directory holds the SQLite database, backups and the service's Nostr keys. The service refuses to start if a key file is readable by others.

## 3. The environment file

`/etc/deadhop/env`, readable by root and the service only:

```sh
DEADHOP_RELAYS=wss://relay.contextvm.org,wss://nos.lol,wss://relay.damus.io
DEADHOP_ELECTRUM=127.0.0.1:50001
DEADHOP_XPUB=zpub6…
DEADHOP_ADMINS=npub1…
DEADHOP_DATA_DIR=/var/lib/deadhop
```

See [Connect your Electrum server](./electrum.md), [Receive to your own wallet](./xpub/index.md) and every other setting in [Configuration](./configuration.md).

```sh
sudo install -d -m 0750 -g deadhop /etc/deadhop
sudo chmod 0640 /etc/deadhop/env && sudo chgrp deadhop /etc/deadhop/env
```

## 4. The unit

`/etc/systemd/system/deadhop.service`:

```ini
[Unit]
Description=deadhop
After=network-online.target
Wants=network-online.target

[Service]
User=deadhop
EnvironmentFile=/etc/deadhop/env
WorkingDirectory=/var/lib/deadhop
ExecStart=/usr/local/bin/deadhop
Restart=always
MemoryMax=256M
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/deadhop
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

If the request loop stops and cannot be brought back, the process exits instead of staying up deaf, and `Restart=always` brings it back. `MemoryMax` matters: the service keeps about 7 KiB for every request it receives and never frees it, most likely a task leak in a dependency (`rmcp`) that is not fixed yet. Under a flood that adds up in minutes; the limit and `Restart=always` give you a fresh process instead of a stuck host.

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now deadhop
journalctl -u deadhop | grep -E "serving|first receive address"
```

Compare the first receive address with your wallet's first address before taking a payment.

## 5. The dashboard

Build it and serve it from any web server: [Host the dashboard](./dashboard.md). `deadhop pubkey` and `deadhop pubkey admin`, run as the `deadhop` user with the same `DEADHOP_DATA_DIR`, print the keys for its `config.json`.

## 6. Back up

Copy `/var/lib/deadhop` with its permissions intact, and the backups the dashboard writes to `/var/lib/deadhop/backups` (the newest 10 are kept). The data directory holds the service's key: a new one means a new address for customers to reach.
