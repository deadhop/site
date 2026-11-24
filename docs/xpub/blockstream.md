---
title: Blockstream app
description: Use a singlesig Bitcoin account in the Blockstream app (formerly Green) with deadhop, find its key and first address, and set a custom gap limit.
---

# Blockstream app

The [Blockstream app](https://blockstream.com/app/) (formerly Blockstream Green) runs on phones and desktops. These steps follow [its help center](https://help.blockstream.com) and, where that is silent, its [changelog](https://github.com/Blockstream/green_android/blob/master/CHANGELOG.md) and source.

## 1. Use a Native SegWit Bitcoin account

New singlesig wallets get a Native SegWit Bitcoin account by default (changelog 4.0.11). Use that account: not a Liquid account, and not Legacy SegWit (now under **Advanced options**).

## 2. Copy the key

Open **Settings**, then **Watch-only** under **Wallet**, and copy the **extended public key** of the Bitcoin Native SegWit account ([set up a watch-only wallet](https://help.blockstream.com/blockstream-app-2/advanced/set-up-watch-only-wallet)). If the app offers only an **output descriptor**, copy the key from inside it, the part that starts with `zpub` or `xpub`, without the brackets and the `/0/*` after it.

The help pages do not say which encoding the app shows. The library behind it returns a `zpub` for Native SegWit accounts. deadhop accepts either.

## 3. Give it to deadhop

```sh
DEADHOP_XPUB=zpub6…
```

## 4. Compare the first address

**Receive → More Options (⋯) → List of Addresses** ([unexpected balance](https://help.blockstream.com/blockstream-app/troubleshooting/fix-issues-with-unexpected-wallet-balance)). The help center does not say how the list is ordered. On an account that has never received, the first address offered is index 0.

## 5. Raise the gap limit

On Android: **App Settings → Custom Server Gap Limit**, from 1 to 1000 (changelog 4.0.32 and 4.1.8). The help center does not document it, and on iOS the setting is not confirmed. If you cannot raise it, watch the same key in [Sparrow](./sparrow.md) as well.
