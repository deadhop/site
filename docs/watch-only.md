---
title: Watch-only wallets
description: Why deadhop holds only an account public key, how it turns that key into a fresh address per invoice, and why your wallet needs a higher gap limit.
---

# Watch-only wallets

deadhop can create addresses for you but can never spend from them. This page explains how, and the one thing it asks of your wallet in return.

## One key, many addresses

A modern bitcoin wallet is a tree of keys grown from its recovery phrase (BIP-32). One branch of that tree is an **account**: for Native SegWit addresses, the branch at `m/84'/0'/0'` (BIP-84).

The account has a private half, which signs, and a public half, the **account public key**, written `xpub…` or `zpub…`. From the public half alone, anyone can work out every receive address of the account, in order: index 0, 1, 2, and so on. Nobody can sign with it.

That is all deadhop holds. Each invoice gets the next index, so each invoice has its own address, never reused. The address tells deadhop which invoice a payment belongs to, and tells outsiders nothing about your other payments.

## What a stolen server gives away

Someone who takes over the server gets the account public key. With it they can list your addresses and see what you received, which is a privacy loss. They cannot move a single satoshi already received, because no signing key is there.

They could change where future invoices point only by changing the key, and the key cannot be changed remotely: it is set on the host, and a database that has handed out addresses refuses a different one.

## Where the key comes from

- **Your own wallet.** You copy its account public key into deadhop. [Receive to your own wallet](./xpub/index.md).
- **A generated wallet.** With Docker Compose, a separate container with no network makes a recovery phrase on first start, keeps it, and hands the service only the public key. You write the words down. It is meant for small balances, swept regularly to colder storage, by hand or by the [sweeping wallet](./wallet/index.md).

## The gap limit

When a wallet restores or refreshes, it checks addresses in order and stops after a run of unused ones, usually 20. That is the **gap limit**.

deadhop hands out an address for every invoice, paid or not. If 30 customers open an invoice and walk away, and the 31st pays, that payment sits past a gap of 30 unused addresses. A wallet with a gap limit of 20 does not look that far, and shows a balance that is too low. Nothing is lost: raise the limit and it appears.

So raise your wallet's gap limit to at least the number of addresses the dashboard shows as **addresses created**, plus 20. The wallet guides show where.

## Why one address type

deadhop makes Native SegWit (P2WPKH, `bc1q…`) addresses only. They are the cheapest common type to spend and every wallet supports them. The catch: an account public key does not say which address type it was made for. A key from a Nested SegWit or Taproot account is still accepted, and deadhop makes `bc1q` addresses from it that the wallet does not show. That is why every setup starts by comparing the first address.
