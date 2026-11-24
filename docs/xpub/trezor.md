---
title: Trezor
description: Show the public key of a Trezor SegWit account in Trezor Suite for deadhop, verify the first address on the device, and handle Suite's fixed gap limit.
---

# Trezor

These steps follow [Trezor's guides](https://trezor.io/guides) for Trezor Suite.

## 1. Use a SegWit account

Trezor Suite calls BIP-84 **SegWit**, not "Native SegWit", and it is the default. **Legacy SegWit** is BIP-49 and is not the one. An account's type cannot be changed after it is created ([manage accounts](https://trezor.io/guides/trezor-suite/manage-accounts-in-trezor-suite)). The first SegWit account, "Bitcoin account #1", is `m/84'/0'/0'`.

## 2. Copy the public key

Select the account, open the **Details** tab and choose **Show public key**. The key appears in Suite and on the device as text and QR; check that they match ([what is a public key](https://trezor.io/learn/supported-assets/bitcoin/what-is-a-public-key-xpub)). The Details tab also shows the derivation path: it must be `m/84'/0'/0'` (or `m/84'/0'/1'` for a second account).

## 3. Give it to deadhop

```sh
DEADHOP_XPUB=xpub6…        # or the zpub, whichever Suite shows
```

## 4. Compare the first address

**Receive**, choose the account, then **Verify**: the device shows the full address ([receive](https://trezor.io/guides/sending-receiving-staking-funds/trading-crypto-in-trezor-suite/receive-crypto-in-trezor-suite)). This is the next unused address, so it is index 0 only on an account that has never received. Use a fresh account for deadhop.

## 5. The gap limit: use Sparrow

Trezor's guide says Suite can generate 20 new unused addresses, and describes no setting to change that ([addresses](https://trezor.io/guides/trezor-suite/addresses-transaction-history)). Payments past that gap stay safe on your Trezor, but Suite may not show them. Connect the Trezor to [Sparrow](./sparrow.md) and raise the gap limit there; Sparrow then shows and spends them with the Trezor signing.
