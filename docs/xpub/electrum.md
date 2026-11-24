---
title: Electrum
description: Get the zpub of an Electrum native segwit wallet for deadhop, check the first address and raise Electrum's gap limit from its console.
---

# Electrum

[Electrum](https://electrum.org) is a desktop wallet. These steps follow its [documentation](https://electrum.readthedocs.io). Where the documentation is silent, they say so and point at Electrum's source code instead.

## 1. Use a native segwit wallet

Electrum encodes the address type in the key's prefix: a native segwit wallet's key starts with `zpub` ([xpub version bytes](https://electrum.readthedocs.io/en/latest/xpub_version_bytes.html)). Electrum's own seed type "Segwit" makes P2WPKH wallets ([seed phrase](https://electrum.readthedocs.io/en/latest/seedphrase.html)).

## 2. Copy the key

**Wallet → Information** shows the **Master Public Key** ([cold storage](https://electrum.readthedocs.io/en/latest/coldstorage.html)). For a native segwit wallet it starts with `zpub`. That is the account key deadhop needs, despite the name. Copy it.

If it starts with `xpub`, the wallet is not native segwit: Electrum shows `xpub` for legacy (`1…`) wallets. Do not use it.

## 3. Give it to deadhop

```sh
DEADHOP_XPUB=zpub6…
```

## 4. Compare the first address

Open the **Addresses** tab. If it is hidden, Electrum's **View** menu shows it (from the app; the documentation only names the tab). The first receiving address must be the one deadhop logged as index 0.

## 5. Raise the gap limit

Electrum's documentation says the gap limit is 20 and may need raising, but not how ([FAQ](https://electrum.readthedocs.io/en/latest/faq.html)). From Electrum's source: open the **Console** tab (shown from the **View** menu in the app; not in the documentation) and run

```python
wallet.change_gap_limit(200)
```

with at least the number of addresses deadhop shows as created, plus 20. The command-line equivalent is `electrum changegaplimit 200 --iknowwhatimdoing` ([wallet.py](https://github.com/spesmilo/electrum/blob/master/electrum/wallet.py), [commands.py](https://github.com/spesmilo/electrum/blob/master/electrum/commands.py)).

## Watching only

To watch the payments in Electrum without its seed on that machine: **File → New/Restore**, **Standard wallet**, **Use public or private keys**, paste the `zpub`, **Next** ([cold storage](https://electrum.readthedocs.io/en/latest/coldstorage.html)). Paste the `zpub`, not an `xpub`: Electrum reads an `xpub` as a legacy wallet.
