---
title: Sparrow
description: Copy the account key of a Sparrow Native SegWit wallet for deadhop, check the first address and raise the gap limit, following Sparrow's own docs.
---

# Sparrow

[Sparrow Wallet](https://sparrowwallet.com) is a desktop wallet. It works on its own, or as the companion of a hardware wallet. These steps follow Sparrow's [quick start](https://sparrowwallet.com/docs/quick-start.html) and [FAQ](https://sparrowwallet.com/docs/faq.html).

## 1. Use a Native SegWit wallet

Sparrow makes a single signature wallet with the **Native Segwit (P2WPKH)** script type by default. Name the wallet and choose **New Wallet**, then a keystore: **Connected Hardware Wallet**, **Airgapped Hardware Wallet**, **New or Imported Software Wallet**, or **xPub / Watch Only Wallet**.

With a hardware wallet, choose **Connected Hardware Wallet** (plugged in over USB) or **Airgapped Hardware Wallet** (a file or QR code from the device) as the keystore: Sparrow imports the device's account key, and the device keeps signing. Sparrow's [quick start](https://sparrowwallet.com/docs/quick-start.html) lists both.

On an existing wallet, the **Settings** tab shows the policy and script type. It must read Single Signature and Native Segwit (P2WPKH).

## 2. Copy the account key

Sparrow calculates the key for the derivation path, `m/84'/0'/0'`, and shows it on the **Settings** screen. The **…** button beside it switches between `xpub` and its alias `zpub`. Copy either: deadhop accepts both.

Neither form is a secret, but anyone who has it can see every payment you receive. Treat it as private.

## 3. Give it to deadhop

In `.env` with [Docker Compose](../deploy-compose.md#_2-write-env), or the service's environment under [systemd](../deploy-systemd.md#_3-the-environment-file), before the first start:

```sh
DEADHOP_XPUB=xpub6…        # in .env with Compose, or the service's environment
```

Start the service and find the logged first address (`first receive address (index 0)`).

## 4. Compare the first address

Open the **Addresses** tab. The first receive address in the list must be the one the service logged. If it is not, check the script type and the derivation path in **Settings** before you take a payment.

## 5. Raise the gap limit

In the **Settings** tab, choose **Advanced**, raise the gap limit, choose **Close**, then **Apply**. The default is 20. Set at least the number of addresses the deadhop dashboard shows as created, plus 20. A higher limit only makes loading the wallet slower.

## Spending what the service generated

deadhop's [generated wallet](../deploy-compose.md#_4-write-down-the-recovery-phrase) can be restored in Sparrow from its 24 words: a **New Wallet** with a **New or Imported Software Wallet** keystore, **Mnemonic Words (BIP39)**, 24 words. Sparrow's quick start shows that screen for new words (**Generate New**); type the existing words into the same fields instead (this step is from the app; Sparrow's documentation covers generating words, not entering existing ones). To only watch the payments, you do not need the words at all: an **xPub / Watch Only Wallet** keystore with the account key is enough, and Sparrow documents it. Keep the script type Native Segwit and the path `m/84'/0'/0'`, no passphrase, choose **Import Keystore**, then **Apply**. Compare the account key Sparrow shows with the one `deadhop wallet export` prints.
