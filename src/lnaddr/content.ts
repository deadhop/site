// Copy for /lud16-lnaddr/. The page and its Markdown twin render from this.
import { at } from '../paths';
import type { Tool } from '../tool';

export const lnaddr: Tool = {
  id: 'lnaddr',
  title: 'deadhop lnaddr: a Lightning address with no open port',
  description:
    'A Lightning address (LUD-16) for a node with no public address: a gateway asks your node for each invoice over Nostr. No VPN, no tunnel, no forwarded port.',
  stamp: 'LUD-16 · home node · ports open: 0',
  headline: 'A Lightning address for a node with no open port.',
  lede: 'Your node stays home, behind NAT, with no port open. A small gateway on any public host serves you@yourdomain and asks your node for each invoice over encrypted Nostr messages.',
  hero: {
    src: '/shots/lnaddr-overview.webp',
    light: '/shots/lnaddr-overview-light.webp',
    width: 1600,
    height: 939,
    alt: 'The gateway’s admin page: invoices, lookups, failures, latency, the node, and the addresses it serves.',
  },
  flowTitle: 'How a payment travels',
  flow: [
    { kicker: 'wallet', title: 'Pays you@yourdomain', body: 'Fetches /.well-known/lnurlp/you from your domain, as with any Lightning address.' },
    { kicker: 'gateway', title: 'Answers from its cache', body: 'Range and metadata come from the gateway. Only the invoice needs your node.' },
    { kicker: 'relays', title: 'Carry one encrypted request', body: 'Gift-wrapped to your node’s key, ephemeral, first relay wins.' },
    { kicker: 'node', title: 'Makes and checks the invoice', body: 'With an invoice-only credential, within its own limits. The gateway checks it again.' },
  ],
  gallery: [
    {
      src: '/shots/lnaddr-wallet-view.webp',
      light: '/shots/lnaddr-wallet-view-light.webp',
      width: 1400,
      height: 701,
      alt: 'A terminal: the LNURL pay request for alice, an invoice from the callback, a refused amount, and the health check.',
      caption: 'What a wallet sees: the pay request, an invoice made by the node (here a test backend), and an amount out of range refused.',
    },
    {
      src: '/shots/lnaddr-overview.webp',
      light: '/shots/lnaddr-overview-light.webp',
      width: 1600,
      height: 939,
      alt: 'The gateway’s admin page.',
      caption: 'The optional admin page: each node’s latency, the addresses it serves, recent failures.',
    },
  ],
  points: [
    { title: 'No open port at home', body: 'lnaddr-node only dials out to relays. No VPN, no Tailscale, no tunnel, no forwarded port, no dynamic DNS.' },
    { title: 'No spending credential in public', body: 'The gateway holds no Lightning credential. The node holds an invoice-only one: a macaroon, rune, limited password or invoice key.' },
    { title: 'Any proxy, any host', body: 'One path prefix to forward. Caddy, nginx, Traefik, HAProxy, Apache, a Unix socket or a Tor onion service.' },
    { title: 'Two static binaries', body: 'About 8 MB each, no runtime and no system libraries. Configure by file, environment, built-in values or, if you allow it, over Nostr.' },
    { title: 'Every invoice checked twice', body: 'Amount, description hash, network, expiry and, if pinned, the signing node: by the node, then by the gateway.' },
    { title: 'Keeps going', body: 'One working relay is enough. Node restarts need no gateway restart, and lookups are served from cache while the node is away.' },
  ],
  chips: { label: 'Lightning backends', items: ['LND', 'Core Lightning', 'phoenixd', 'LNbits'] },
  ways: [
    { title: 'Node at home, gateway on a VPS', body: 'The usual setup: the node behind NAT, the gateway behind your reverse proxy on a small public host.', href: at('/docs/lnaddr/quickstart.html') },
    { title: 'Your backend, invoice-only', body: 'LND, Core Lightning, phoenixd or LNbits, each with a credential that can only make invoices.', href: at('/docs/lnaddr/backends.html') },
    { title: 'Behind the proxy you already run', body: 'Caddy, nginx, Traefik, HAProxy, Apache, or as a Tor onion service.', href: at('/docs/lnaddr/reverse-proxies.html') },
  ],
  setupTitle: 'Three commands to a working address',
  setup: [
    { cmd: 'lnaddr-gateway pubkey', note: 'on the public host: the key your node will answer' },
    { cmd: 'lnaddr-node check', note: 'next to your node: a test invoice from your backend' },
    { cmd: 'lnaddr-gateway test you 21', note: 'a real invoice, fetched and checked as a wallet would' },
  ],
};
