// Copy for /lud16-lnaddr/. The page and its Markdown twin render from this.
import { at } from '../paths';

export const lnaddr = {
  name: 'deadhop lnaddr',
  title: 'deadhop lnaddr: a Lightning address with no open port',
  description:
    'A Lightning address (LUD-16) for a node with no public address: a gateway asks your node for each invoice over Nostr. No VPN, no tunnel, no forwarded port.',
  headline: 'A Lightning address for a node nobody can reach.',
  lede: 'Your node stays home, behind NAT, with no port open. A small gateway on any public host serves you@yourdomain and asks your node for each invoice over encrypted Nostr messages.',
};

export const flow = [
  { kicker: 'wallet', title: 'Pays you@yourdomain', body: 'Fetches /.well-known/lnurlp/you from your domain, as with any Lightning address.' },
  { kicker: 'gateway', title: 'Answers from its cache', body: 'Range and metadata come from the gateway. Only the invoice needs your node.' },
  { kicker: 'relays', title: 'Carry one encrypted request', body: 'Gift-wrapped to your node’s key, ephemeral, first relay wins.' },
  { kicker: 'node', title: 'Makes and checks the invoice', body: 'With an invoice-only credential, within its own limits. The gateway checks it again.' },
];

export const points = [
  { title: 'Nothing to reach at home', body: 'lnaddr-node only dials out to relays. No VPN, no Tailscale, no tunnel, no forwarded port, no dynamic DNS.' },
  { title: 'Nothing to spend in public', body: 'The gateway holds no Lightning credential. The node holds an invoice-only one: a macaroon, rune, limited password or invoice key.' },
  { title: 'Any proxy, any host', body: 'One path prefix to forward. Caddy, nginx, Traefik, HAProxy, Apache, a Unix socket or a Tor onion service.' },
  { title: 'Two static binaries', body: 'About 8 MB each, no runtime and no system libraries. Configure by file, environment, built-in values or, if you allow it, over Nostr.' },
  { title: 'Every invoice checked twice', body: 'Amount, description hash, network, expiry and, if pinned, the signing node: by the node, then by the gateway.' },
  { title: 'Keeps going', body: 'One working relay is enough. Node restarts need no gateway restart, and lookups are served from cache while the node is away.' },
];

export const backends = ['LND', 'Core Lightning', 'phoenixd', 'LNbits'];

export const setup = [
  { cmd: 'lnaddr-gateway pubkey', note: 'on the public host: the key your node will answer' },
  { cmd: 'lnaddr-node check', note: 'next to your node: a test invoice from your backend' },
  { cmd: 'lnaddr-gateway test you 21', note: 'a real invoice, fetched and checked as a wallet would' },
];

export const docs = [
  { title: 'Quick start', href: at('/lud16-lnaddr/docs/quickstart.html') },
  { title: 'Architecture', href: at('/lud16-lnaddr/docs/architecture.html') },
  { title: 'Security', href: at('/lud16-lnaddr/docs/security.html') },
  { title: 'Reverse proxies', href: at('/lud16-lnaddr/docs/reverse-proxies.html') },
];
