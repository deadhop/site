---
title: Tools API
description: Reference for the deadhop MCP tools served over ContextVM, for invoicing and for operator management, with inputs, outputs and error codes.
---

# Tools API

deadhop is an MCP server reached over Nostr with [ContextVM](https://contextvm.org).
Any MCP client that speaks the ContextVM transport can call it. Results come back as MCP
`structuredContent` that matches each tool's published output schema.

## Connecting

You need the service's public key (`<data dir>/server.pubkey`) and its relay list. With the
TypeScript SDK:

```ts
import { Client } from '@contextvm/mcp-sdk/client/index.js';
import { EncryptionMode, NostrClientTransport, PrivateKeySigner } from '@contextvm/sdk';

const transport = new NostrClientTransport({
  signer: new PrivateKeySigner(myHexSecretKey),
  relayHandler: ['wss://relay.one.example'],
  serverPubkey: SERVICE_PUBKEY_HEX,
  encryptionMode: EncryptionMode.REQUIRED, // the service refuses plaintext
});
const client = new Client({ name: 'my-shop', version: '1.0.0' });
await client.connect(transport);

const info = await client.callTool({ name: 'get_info', arguments: {} });
```

A non-operator calling `create_invoice` must mine NIP-13 proof of work into the signed
request event: add a `["nonce", "<counter>", "<target bits>"]` tag and vary the counter until
the event id has at least `pow_bits` leading zero bits. The dashboard's `src/lib/pow.ts` is a
working implementation that wraps any signer.

## Tools

All inputs reject unknown fields.

### `get_info`

Anyone. No arguments. Returns the service parameters for this caller.

| Field | Type | Meaning |
| --- | --- | --- |
| `name`, `version` | string | Service name and version |
| `network` | string | `bitcoin`, `testnet`, `signet` or `regtest` |
| `public_invoicing` | boolean | Whether non-operators may create invoices |
| `pow_bits` | integer | Required proof of work for non-operators |
| `pow_window_secs` | integer | Accepted age of a request event |
| `min_confirmations` | integer | Confirmations before `confirmed` |
| `default_expiry_secs` | integer | Lifetime when none is requested |
| `max_expiry_secs` | integer | Longest lifetime this caller may request |
| `min_amount_sat`, `max_amount_sat` | integer | Amount bounds |
| `is_admin` | boolean | Whether the caller is an operator |

### `create_invoice`

Operators, and the public when `public_invoicing` is on (with proof of work).

| Argument | Type | Meaning |
| --- | --- | --- |
| `amount_sat` | integer, required | Amount in satoshis, within the bounds above |
| `memo` | string, optional | Note stored with the invoice, at most 200 characters, no control or invisible characters |
| `expiry_secs` | integer, optional | Lifetime in seconds, from 60 up to `max_expiry_secs` |

Returns an **Invoice**:

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | string | 32 lowercase hex characters (128 random bits). Whoever holds it can read the invoice. |
| `address` | string | Fresh native segwit address |
| `amount_sat` | integer | Requested amount |
| `memo` | string | Note, empty if none |
| `status` | string | `pending`, `detected`, `confirmed` or `expired` |
| `received_sat` | integer | Total seen, confirmed or not |
| `confirmed_sat` | integer | Total with enough confirmations |
| `created_at`, `expires_at` | integer | Unix seconds |
| `settled_at` | integer or null | When it became `confirmed` |
| `bip21` | string | `bitcoin:` URI with address and amount |
| `confirmations_required` | integer | Confirmations this invoice needs |

### `get_invoice`

Anyone holding the id. Argument: `id` (32 lowercase hex characters). Returns an Invoice.

### `list_invoices`

Operators only. Newest first.

| Argument | Type | Meaning |
| --- | --- | --- |
| `status` | string, optional | Only invoices in this state |
| `before` | integer, optional | Only derivation indices below this (pagination cursor) |
| `limit` | integer, optional | Page size, 1 to 200, default 50 |

Returns `{ invoices, next_before }`. Each entry is an Invoice plus `index` (derivation index)
and `creator` (hex key that created it). Pass `next_before` as `before` for the next page; it
is absent on the last page.

### `get_stats`

Operators only. No arguments.

| Field | Type | Meaning |
| --- | --- | --- |
| `pending`, `detected`, `confirmed`, `expired` | integer | Invoice counts per state |
| `confirmed_sat`, `detected_sat` | integer | Amounts in those states |
| `next_index` | integer | Next derivation index |
| `tip_height` | integer or null | Last chain tip seen |
| `last_poll_at` | integer or null | Unix seconds of the last poll |
| `chain_ok` | boolean | Whether the last poll reached the chain backend |
| `watch_errors` | integer | Invoices that could not be read in the last poll |

## Management tools

Operators only. Every tool that changes something needs a fresh request event addressed
to this service that was never used before (ids are remembered across restarts) and is
recorded in the audit log.

| Tool | Arguments | Returns |
| --- | --- | --- |
| `get_health` | none | `service` (version, start, uptime, online since, paused, restarts), `relays` (url, status, connected), `proxy` (the proxy in use now, password hidden), `proxy_check` (the last test of that proxy, or null), `proxy_pool` (the default route of the public invoices key: `default` (a destination), `state` (`transparent`, `direct`, `active`, `suspended`, `offline` or `blocked`), `active` (a proxy id), `reachable`; then `posture`; `offline`; `transparent`; `total`; `next_switch_at` (the soonest switch of any group a key uses); `proxies`, each `{ id, name, url, reachable, checked_at, status, reason }`; `lanes`, per key `{ key, default, state, active, reachable, next_switch_at, uses_default, groups }`, where `groups` lists each group the key may use as `{ group, state, active, reachable, next_switch_at }`; and `routes`, per key and relay `{ key, relay, rule, via, proxy, reason }`), `chain`, `database` (integrity, size, invoices, backups), `warnings` |
| `get_metrics` | none | `addresses_created`, `invoices`, `payments`, `received_sat`, `windows` for `24h`, `7d`, `30d`, `365d` with `available` (false until the service has been online that long), `sweep` status |
| `get_payment_series` | `range`: `day`, `week`, `month` or `year` | `points` of `{ start, count, sat }`: 24 hourly, 7 or 30 daily, or 52 weekly buckets, gap-filled |
| `get_settings` | none | `settings` (live), `defaults` (environment), `overridden` (names), `fixed` (host-only values), `operators`, `restart_pending`, `warnings` |
| `update_settings` | `patch`: only the settings to change; `sweep` and `proxies` may be partial; `proxies.list` replaces the whole proxy list (entries `{ id?, name?, url, i2p? }`; a new entry may bring its own `id` (`[a-z0-9_-]`, at most 24) so that groups, rules and the default route in the same patch can name it, or have one made; a url shown with `***` keeps its saved password); `proxy: ""` (the old single-address form) still works | Same as `get_settings` |
| `reset_settings` | none | Same as `get_settings` |
| `add_operator` | `pubkey` (hex, `npub` or `nprofile`), optional `label` | Same as `get_settings` |
| `remove_operator` | `pubkey` | Same as `get_settings`; environment keys are refused |
| `control_service` | `action`: `stop` (refuse new invoices), `start`, `restart` (reconnect relays in-process) | `{ paused, restart_pending }` |
| `backup_database` | none | `{ file, size_bytes, created_at }`, written to `<data dir>/backups` |
| `list_backups` | none | `backups`: each `{ file, size_bytes, created_at }`, newest first. Only files named like the service's own backups are listed |
| `wipe_database` | `confirm: "WIPE"`, optional `include_settings`, `force` | `{ deleted, backup }` |
| `get_audit_log` | optional `limit` (1 to 200) | `entries` of `{ at, actor, action, detail }` |
| `check_proxy` | optional `id` (a listed proxy, tested with its saved password) or `proxy` (an address); neither tests the proxy in use. An address that is not in the list is refused when `DEADHOP_PROXY_LOCKED` is set, and a listed proxy is tried only against relays it may carry, so one that no rule, group or default route points at yet is refused | `{ proxy, status, checked_at, relays }`: `status` is `connected`, `partial`, `failed` or `direct`; each relay has `ok`, `code` (`SOCKS5 04`, `HTTP 407`, `ECONNREFUSED`, …), `reason` and `ms`. Admitted and recorded like a change; one at a time, 6 per minute |
| `resolve_i2p_name` | `name`: a lowercase `.i2p` name (not `.b32.i2p`). Needs an I2P router proxy (`i2p: true`) and at least one entry in `proxies.i2p_registries`; refused when `DEADHOP_PROXY_LOCKED` is set; four per minute, one at a time | `{ name, address, registry, agreeing, disagreeing: [{ registry, address }], unknown, unreachable }`: `address` is the `.b32.i2p` address from the first registry (in list order) that knew the name; every registry is asked, through the I2P proxy only |
| `check_relays` | none | `relays`: per live relay `{ relay, status, connects, forwards, rate_limited, ms, detail, checked_at }`. `status` is `ok` (connects, carries an ephemeral ContextVM event from one connection to another, not rate-limiting), `degraded` (connects, but a check failed) or `down` (cannot connect). Runs under a throwaway key through the live proxy; also runs every 5 minutes and shows in `get_health` as `relay_health`. A few per minute |
| `get_relay_history` | optional `window`: `15m`, `1h` (default), `12h`, `1d` or `1w` | `{ window, bucket_secs, since, until, relays }`; each relay has `checks`, `check_failures`, `sends` (replies sent through it), `send_failures`, `avg_ms` and `points` (`{ start, ok, fail }` per bucket, for plotting). Results are kept for 8 days |
| `get_network` | none | The network part of the settings, for network views such as the standalone console: `settings` (live, proxy passwords hidden), `defaults` (environment), `overridden`, `chain` (`bitcoin`, `testnet`, `signet` or `regtest`), `keys` (the service's keys that relays, rules and per-key default routes are assigned to), `proxy_locked`, `restart_pending`, `warnings` |
| `update_network` | `patch`: any of `relays`, `relay_keys` (replaces the whole map), `relay_names`, `proxies`; anything left out stays | Same as `get_network`. The same checks, storage, audit entry and reconnection as `update_settings` |
| `get_privacy_audit` | none | `{ score, checked, total, ran_at, checks }`; each check has `id`, `area`, `title`, `result` (`pass`, `to_fix`, `fail`, `note`, `not_checked`), `points`, `summary`, `evidence`, `fix`. The score counts only checks that ran |

Settings that can be patched: `name`, `relays`, `public_invoicing`, `pow_bits`,
`pow_window_secs`, `min_confirmations`, `default_expiry_secs`, `max_expiry_secs`,
`min_amount_sat`, `max_amount_sat`, `max_open_invoices`, `max_invoices_per_day`,
`rate_global_per_min`, `rate_per_key_per_min`, `rate_requests_per_min`,
`rate_requests_per_key_per_min`, `poll_secs`, `late_grace_secs`, `proxies` (`list`; `groups`, each
`{ id, name, proxies, strategy, rotate_secs, chaos_min_secs, chaos_max_secs }` with `strategy`
`failover`, `round_robin` or `chaos`; `default` and `default_keys` (key id to destination);
`offline`; `transparent`; `rules`, each `{ name, match, keys, to, fallback }`; `i2p_registries`.
`list`, `groups`, `default_keys`, `rules` and `i2p_registries` each replace the whole value.
A destination is `"direct"`, `"block"`, `{ "proxy": id }` or `{ "group": id }`; a fallback is
`"offline"`, `"policy"` or `{ "to": destination }`. The fields from before proxy groups,
`mode`, `rotate_secs`, `chaos_min_secs`, `chaos_max_secs` and a proxy's `pool` and `keys`,
are refused) and
`sweep` (`enabled`, `mode` = `payjoin` or `coinjoin`, `threshold_sat`,
`max_fee_rate_sat_vb`, `min_anonymity_set`). Unknown fields are refused.

A request sent while the service is reconnecting is not answered; clients should time
out and retry.

## Errors

Errors are JSON-RPC errors with a stable `data.code`. Internal error text never reaches the
caller.

| JSON-RPC code | `data.code` | Meaning |
| --- | --- | --- |
| -32602 | `invalid_params` | Arguments out of range or malformed |
| -32001 | `unauthorized` | Operator-only tool, or public invoicing is off |
| -32002 | `not_found` | No invoice with that id |
| -32003 | `pow_rejected` | Missing or insufficient work, stale, replayed or not addressed to this service |
| -32004 | `rate_limited` | A rate limit was hit; retry later |
| -32005 | `capacity` | Open-invoice or daily cap reached |
| -32006 | `paused` | Invoicing is stopped by an operator |
| -32603 | `internal` | Something failed on the service side |

Arguments that do not match the input schema at all (wrong types, unknown fields) come back
as a tool result with `isError: true` rather than a JSON-RPC error.
