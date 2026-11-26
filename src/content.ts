// Single source for the landing page copy. The HTML page, its Markdown twin
// (/index.md) and llms.txt are all rendered from this, so they cannot drift.

export const product = {
  name: 'deadhop',
  title: 'deadhop: on-chain bitcoin payments with no public server',
  motto: 'Dials out. Never listens.',
  headline: 'Accept bitcoin on your own node. Open no port.',
  pitch: 'Invoices, a checkout and a dashboard, confirmed by your own node. Nothing it holds can spend.',
  tagline: 'Accept on-chain bitcoin payments without exposing a server.',
  summary:
    'deadhop creates bitcoin invoices, watches the chain and reports payments. Customers and operators reach it only through Nostr relays. It opens no ports and holds no spending keys.',
  description:
    'Self-hosted on-chain bitcoin invoicing over Nostr. No inbound ports, end-to-end encryption, proof of work against abuse and a watch-only wallet.',
};

export interface Step {
  id: string;
  kicker: string;
  title: string;
  body: string;
}

// The scroll story. Each step drives one stage of the 3D scene.
export const steps: Step[] = [
  {
    id: 'no-address',
    kicker: '01 · Reachability',
    title: 'Nothing to connect to',
    body: 'The service only dials out, to Nostr relays. There is no listening socket, HTTP endpoint or login form, so there is nothing to port-scan, nothing to DDoS by IP and no web stack to exploit.',
  },
  {
    id: 'relays',
    kicker: '02 · Transport',
    title: 'Relays carry ciphertext',
    body: 'Requests and responses are ContextVM (MCP over Nostr), NIP-44 encrypted and gift-wrapped (NIP-59). Relays forward them without being able to read or alter them. Plaintext requests are refused.',
  },
  {
    id: 'work',
    kicker: '03 · Abuse resistance',
    title: 'Proof of work on public invoices',
    body: 'A non-operator who creates an invoice must mine NIP-13 proof of work into the signed request. The work is bound to the caller’s key, to this service and to one use. Rate limits and daily caps apply after it.',
  },
  {
    id: 'watch-only',
    kicker: '04 · Funds',
    title: 'Watch-only: it cannot spend',
    body: 'The service holds only an account public key (xpub). It derives a fresh native segwit address for every invoice. Taking over the server does not move funds already received.',
  },
  {
    id: 'confirmations',
    kicker: '05 · Settlement',
    title: 'Confirmed by your own node',
    body: 'Payments are read from your Electrum server (Fulcrum or electrs). The service re-hashes every transaction it is given, counts confirmations itself, and pins the chain’s genesis block on every reconnect.',
  },
];

export const benefits: { title: string; body: string }[] = [
  { title: 'No IP address to attack', body: 'Outbound connections only. Run it behind a VPN or Tor and relays see the exit, not you.' },
  { title: 'End-to-end encryption', body: 'NIP-44 with NIP-59 gift wrap. Relays can see that someone talks to the service key, when and how much, but not what is said.' },
  { title: 'No passwords or accounts', body: 'Callers are identified by the Nostr key that signed the request. Operators are a list of public keys.' },
  { title: 'Strictly typed interface', body: 'Every tool has published JSON schemas. Unknown fields are rejected; the dashboard validates every response with strict schemas.' },
  { title: 'Proof of work and rate limits', body: 'NIP-13 work for public invoice creation, per-key and global budgets, open-invoice and daily caps.' },
  { title: 'Replay protection', body: 'Every invoice request must be fresh, addressed to this service and never seen before, operators included.' },
  { title: 'Cannot spend', body: 'The payment service holds a watch-only BIP-84 key: taking it over cannot move funds received. With your own wallet’s key, nothing on the host can.' },
  { title: 'Verified payment data', body: 'Transactions are re-hashed against their ids, sums are capped, and one bad invoice cannot stall the others.' },
  { title: 'Small, tested code', body: 'One Rust binary, no HTTP stack, SQLite. 100% line and function coverage, plus end-to-end tests on regtest.' },
  { title: 'Remote control without remote risk', body: 'Operators manage relays, proxy, limits and keys from the dashboard. Every change is one-time, audited, and can never touch the wallet or the Electrum server.' },
  { title: 'Hardened dashboard', body: 'Static Svelte page with a strict Content-Security-Policy, frame refusal and text-only rendering of server data.' },
];

// Stated plainly so nobody has to dig for them.
export const limits: string[] = [
  'Your Electrum server is trusted. Run your own and keep it on a private network.',
  'Public invoicing slows abuse down but a determined attacker can still degrade it. A shop back end can hold an operator key instead.',
  'Relays see metadata: timing, sizes and the IP that connects. Use a VPN or Tor.',
  'Only “confirmed” means paid. Use more confirmations for larger amounts.',
];

export const components: { name: string; body: string }[] = [
  { name: 'Service', body: 'Rust. One binary, SQLite, watch-only wallet.' },
  { name: 'Dashboard', body: 'Svelte. Checkout, plus health, statistics, settings and backups for operators. Sign in with a Nostr key.' },
  { name: 'Your node', body: 'Any Electrum server: Fulcrum or electrs next to Bitcoin Core.' },
];

export const pricing = 'Self-hosted software. No fees, no custodian, no account.';

// "Where do you start?": each card leads into the docs, and each of those
// pages ends at its install page.
export const paths: { title: string; body: string; kind: string; href: string }[] = [
  { title: 'I sell things and want bitcoin for them', body: 'Run it next to your node, invoice a customer, and see the payment arrive in a wallet only you can spend from.', kind: 'Tutorial', href: '/docs/first-payment.html' },
  { title: 'Payments should land on my hardware wallet', body: 'Give it your wallet’s account public key. Guides for Sparrow, Electrum, the Blockstream app, COLDCARD, Trezor and Ledger.', kind: 'How-to', href: '/docs/xpub/' },
  { title: 'I want a pay button on my website', body: 'Components for React, Solid and Svelte, or plain JavaScript, and checking each payment from your backend.', kind: 'How-to', href: '/docs/integrate.html' },
  { title: 'Nobody should know where it runs', body: 'Relay traffic through Tor or a VPN, the proxy locked against remote changes, and nothing listening.', kind: 'How-to', href: '/docs/hide.html' },
  { title: 'I want a Lightning address', body: 'you@yourdomain for the Lightning node you run at home, with no port open there. LND, Core Lightning, phoenixd or LNbits.', kind: 'Tutorial', href: '/docs/lnaddr/quickstart.html' },
  { title: 'I just want to see it work', body: 'The whole system on a throwaway test chain on your laptop: Rust, Node, Docker and just, no configuration. Pay an invoice minutes after the first build.', kind: 'Tutorial', href: '/docs/quickstart.html' },
];

// What every part shares, said under the hero.
export const principles: { title: string; body: string }[] = [
  { title: 'Home only dials out', body: 'Nothing at home listens: no port to scan and no IP to attack. Tor or a VPN hides even where it dials from.' },
  { title: 'Encrypted over Nostr', body: 'Requests and replies are gift-wrapped ContextVM messages. Relays carry them and cannot read them.' },
  { title: 'Public parts cannot spend', body: 'An account public key, an invoice-only credential, or no key at all. Taking one over moves nothing.' },
  { title: 'Small, yours, open', body: 'One Rust binary each, on your own hardware. MIT licensed, no fees, no account.' },
];

// The hero's diagram: what runs at home and what is public, joined by Nostr.
export const system = {
  home: [
    { label: 'On-chain payments', href: '#tour', main: true },
    { label: 'Lightning address', href: '/lud16-lnaddr/' },
    { label: 'Sweeper', href: '/wallet/' },
  ],
  public: [
    { label: 'Relays', href: '/relay/', main: true },
    { label: 'Address gateway', href: '/lud16-lnaddr/' },
    { label: 'Checkout page', href: '/docs/integrate.html' },
  ],
  caption: 'Home only dials out. Public parts cannot spend.',
};

// What installing needs, said once on the landing page and in the docs.
export const needs: string[] = [
  'A bitcoin node with Fulcrum or electrs',
  'Docker with Compose, or Rust and Node to build it',
  'A Nostr key in your browser, to sign in',
];

export const docLinks: { href: string; title: string; body: string; kind: string }[] = [
  { href: '/docs/install.html', title: 'Choose a setup', body: 'How it runs, where payments land, who creates invoices.', kind: 'How-to' },
  { href: '/docs/first-payment.html', title: 'Your first real payment', body: 'From the source to a payment you can spend, on your own node.', kind: 'Tutorial' },
  { href: '/docs/xpub/', title: 'Receive to your own wallet', body: 'Which key to give it, and a guide per wallet.', kind: 'How-to' },
  { href: '/docs/how-it-works.html', title: 'How it works', body: 'Request path, proof of work, addresses, invoice states.', kind: 'Explanation' },
  { href: '/docs/security.html', title: 'Security', body: 'Threat model, findings and the risks you accept.', kind: 'Explanation' },
  { href: '/docs/configuration.html', title: 'Configuration', body: 'Every setting and its default.', kind: 'Reference' },
];
