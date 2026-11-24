---
title: COLDCARD
description: Export the BIP-84 account key from a COLDCARD for deadhop, check the first address on the device, and set the gap limit in its companion app.
---

# COLDCARD

These steps follow Coinkite's [COLDCARD documentation](https://coldcard.com/docs/). The device itself has no gap limit; the wallet app you pair it with does.

## 1. The account

COLDCARD names BIP-84 **Segwit (BIP-84)** in its menus, with account number 0 by default ([derivation paths](https://coldcard.com/docs/paths/)). There is nothing to create.

## 2. Export the account key

**Advanced/Tools → Export Wallet → Export XPUB → Segwit (BIP-84)**, by QR or NFC. The default format is `xpub`; press **2** for `zpub` ([advanced](https://coldcard.com/docs/advanced/)). deadhop accepts either.

Or **Advanced/Tools → Export Wallet → Generic JSON** writes `coldcard-export.json`. Use its `bip84.xpub` value. Its `bip84.first` is the first address, for step 4 ([format](https://github.com/Coldcard/firmware/blob/master/docs/generic-wallet-export.md)).

::: danger Not these
- **The top-level `"xpub"`** in `coldcard-export.json`, or anything labelled **Master XPUB**: that is the master key.
- **Dump Summary**: its BIP-84 line is the key one level above the account (`m/84'/0'`).

deadhop would accept both and make addresses your wallets never show.
:::

## 3. Give it to deadhop

```sh
DEADHOP_XPUB=xpub6…
```

## 4. Compare the first address on the device

**Address Explorer**, choose the **Segwit… bc1** type: the first entry is index 0, on the COLDCARD's own screen ([address explorer](https://coldcard.com/docs/address-explorer/)). If you use a BIP-39 passphrase, apply it first. The address must match deadhop's logged one.

## 5. The gap limit

Set it in the wallet app you pair the COLDCARD with. Coinkite's guide for [COLDCARD with Sparrow](https://coldcard.com/guides/wallets/coldcard-sparrow-wallet-setup) sets the wallet up; then raise the gap limit as in [Sparrow](./sparrow.md#_5-raise-the-gap-limit).
