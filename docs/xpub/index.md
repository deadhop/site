---
title: Receive to your own wallet
description: Give deadhop your wallet's account public key so payments go straight to a wallet you already have. Which key, how to check it, and the gap limit.
---

# Receive to your own wallet

deadhop needs one thing from your wallet: its **account public key** (an `xpub` or `zpub`). From it, the service makes a fresh address for every invoice. The key cannot spend, so a server holding it holds nothing worth stealing. [More on why](../watch-only.md).

The same key, from a different wallet, is what the [sweeping wallet](../wallet/sweep.md) needs as its destination.

## The key deadhop accepts

| | deadhop needs |
| --- | --- |
| **Wallet type** | Single signature. Not multisig. |
| **Address type** | Native SegWit, BIP-84: addresses that start with `bc1q`. Not Taproot (`bc1p`), not Nested SegWit (`3…`), not Legacy (`1…`). |
| **Which key** | The **account** key, for the path `m/84'/0'/0'` (`m/84'/1'/0'` on test networks). Not the master key. |
| **Format** | `xpub…` or `zpub…` (`tpub…` or `vpub…` on test networks). A `ypub` is refused. An output descriptor is not accepted: paste only the key inside it. |

::: warning A wrong key can look right
An `xpub` carries no address type. A key from a Nested SegWit or Taproot account, or the master key, is accepted, and deadhop makes valid `bc1q` addresses from it that your wallet never shows. Your seed still controls those addresses, but only a wallet set up with the matching custom derivation path will show and spend them. **Always do step 3.**
:::

## Steps

1. **Copy the key from your wallet.** Pick your wallet below. Each guide follows that wallet's own documentation and links to it.
2. **Give it to deadhop before the first invoice.** Set `DEADHOP_XPUB` (in `.env` with [Compose](../deploy-compose.md), or the service's environment). A database that has already handed out addresses refuses a different key, so this cannot be changed later by mistake.
3. **Compare the first address.** On start, the service logs the address at index 0:

   ```text
   INFO deadhop::app: first receive address (index 0): check that your wallet lists it address=bc1q…
   ```

   Your wallet's **first** receive address must be exactly that one. Each guide says where to find it. If they differ, stop the service and check which account you copied.
4. **Raise the wallet's gap limit.** Wallets stop looking after 20 unused addresses in a row. deadhop uses a new address for every invoice, and many invoices are never paid, so a payment can land past that gap. Set the gap limit to at least the number of **addresses created** on the dashboard's Overview, plus 20, and raise it as that number grows.

## Your wallet

<div class="choices">
  <a href="./sparrow.html"><strong>Sparrow</strong><span>Desktop. Shows the key, lists addresses by index, and has a gap limit setting. Also the easiest companion for hardware wallets.</span><em>Recommended</em></a>
  <a href="./electrum.html"><strong>Electrum</strong><span>Desktop. Shows a <code>zpub</code> for Native SegWit. The gap limit is raised from its console.</span><em>Good fit</em></a>
  <a href="./blockstream.html"><strong>Blockstream app</strong><span>Mobile and desktop. Singlesig Bitcoin accounts; a custom gap limit on Android.</span><em>Good fit</em></a>
  <a href="./coldcard.html"><strong>COLDCARD</strong><span>Exports the BIP-84 account key from the device, by QR, NFC or file. Pair it with Sparrow for the gap limit.</span><em>Hardware</em></a>
  <a href="./trezor.html"><strong>Trezor</strong><span>Trezor Suite shows each account's public key. Suite's gap limit is fixed at 20, so pair it with Sparrow.</span><em>Hardware</em></a>
  <a href="./ledger.html"><strong>Ledger</strong><span>Ledger Wallet (formerly Ledger Live) shows the key under the account's advanced settings, and has an experimental gap limit.</span><em>Hardware</em></a>
</div>

| Wallet | Key it shows | First address | Gap limit |
| --- | --- | --- | --- |
| Sparrow | `xpub`, with a copy as `zpub` | Addresses tab | Settings → Advanced |
| Electrum | `zpub` | Addresses tab | Console command |
| Blockstream app | `zpub` (from the app's source) | Receive → List of Addresses | Android: App Settings |
| COLDCARD | `xpub`, or `zpub` on request | Address Explorer, on the device | In the companion app |
| Trezor Suite | Public key, on the device too | Receive → Verify (unused account) | Fixed at 20: use Sparrow |
| Ledger Wallet | `xpub` for every account type | Receive (unused account) | Experimental setting |

## Wallets that do not fit well

- **BlueWallet** shows a `zpub` and can watch one, but its gap limit is fixed at 20 in its code and has no setting. It may not see payments to invoices made after a run of unpaid ones. Fine for trying deadhop, not for receiving.
- **Nunchuk** documents no way to show a single-sig account key, only a wallet configuration file for multisig.
- **Specter Desktop** documents neither where a single-sig wallet shows its key nor how to list its addresses by index.

If your wallet is not listed: anything that shows the account key of a single-sig Native SegWit account and lets you raise the gap limit will do. Most hardware wallets work with Sparrow.

## Spending

deadhop never spends. You spend from your wallet as usual: the payments are ordinary outputs to your own addresses.
