---
title: Ledger
description: Find the xpub of a Native SegWit account in Ledger Wallet (formerly Ledger Live) for deadhop, check the first address, and set a custom gap limit.
---

# Ledger

These steps follow [Ledger's support articles](https://support.ledger.com) for **Ledger Wallet**, the app formerly called Ledger Live. Older guides and screenshots may use the old name.

## 1. Use a Native SegWit account

Native SegWit is the default for new Bitcoin accounts. To pick it explicitly: **Accounts → +Add account**, turn on **Show all address types**, choose **Native SegWit** ([address types](https://support.ledger.com/article/115005195945-zd)). Its addresses start with `bc1q`.

## 2. Copy the key

Open the account, choose the **wrench icon → Edit account**, and expand **Advanced**. The key there starts with `xpub` ([xpub](https://support.ledger.com/article/360011069619-zd)).

::: warning The prefix proves nothing here
Ledger Wallet shows `xpub` for every account type. Make sure the account is Native SegWit (its receive addresses start with `bc1q`) before you copy the key, and do step 4.
:::

## 3. Give it to deadhop

```sh
DEADHOP_XPUB=xpub6…
```

## 4. Compare the first address

**Receive**, choose the account, connect and unlock the device, and compare the address with the device's screen ([receive](https://support.ledger.com/article/8413894337949-zd)). It is the next unused address, so it is index 0 only on an account that has never received. Use a fresh account for deadhop.

## 5. The gap limit

Ledger's own article warns about this case: another wallet may create more than 20 unused addresses, and Ledger Wallet may then not show the coins ([xpub](https://support.ledger.com/article/360011069619-zd)). Raise it under **Settings → Experimental features → Custom gap limit**, then clear the cache under **Help → Clear** ([custom gap limit](https://support.ledger.com/article/360010892360-zd)). Ledger describes the setting as meant for recovery and says high values slow syncing. For day-to-day use, pairing the Ledger with [Sparrow](./sparrow.md) gives you a permanent setting.
