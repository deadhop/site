// The products, for the header on every page and the cross-links between
// them. Each one's funnel ends at its install page in the docs.
import { at } from './paths';

export type ProductId = 'payments' | 'lnaddr' | 'relay' | 'wallet';

export interface Product {
  id: ProductId;
  label: string;
  name: string;
  /** The page's path without the base path, e.g. "/relay/". */
  page: string;
  href: string;
  install: string;
  installLabel: string;
  /** The repository to clone to install it (github.com/deadhop/<repo>). */
  repo: string;
  docs: string;
  blurb: string;
  /** The label stamped on its card, like the stamp on its own page. */
  stamp: string;
  /** Where its source lives (github.com/deadhop/<name>). */
  source: string[];
}

export const GITHUB = 'https://github.com/deadhop';
export const repoUrl = (name: string) => `${GITHUB}/${name}`;

export const products: Product[] = [
  {
    id: 'payments',
    label: 'Payments',
    name: 'deadhop',
    page: '/',
    href: at('/'),
    install: at('/docs/install.html'),
    installLabel: 'Choose a setup',
    repo: 'stack',
    docs: at('/docs/'),
    blurb: 'On-chain bitcoin invoices from your own node, a checkout for customers and a dashboard for you, with no open port and no spending key.',
    stamp: 'payments · ports open: 0',
    source: ['server', 'js'],
  },
  {
    id: 'lnaddr',
    label: 'Lightning address',
    name: 'deadhop lnaddr',
    page: '/lud16-lnaddr/',
    href: at('/lud16-lnaddr/'),
    install: at('/docs/lnaddr/quickstart.html'),
    installLabel: 'Quick start',
    repo: 'lnaddr',
    docs: at('/docs/lnaddr/'),
    blurb: 'you@yourdomain for a Lightning node at home, with no port open at home.',
    stamp: 'LUD-16 · home node',
    source: ['lnaddr'],
  },
  {
    id: 'relay',
    label: 'Relay',
    name: 'deadhop relay',
    page: '/relay/',
    href: at('/relay/'),
    install: at('/docs/relay/quickstart.html'),
    installLabel: 'Quick start',
    repo: 'relay',
    docs: at('/docs/relay/'),
    blurb: 'A Nostr relay that carries your service and nothing else, on clearnet, Tor, I2P or FIPS.',
    stamp: 'nostr relay · dropped: 0',
    source: ['relay'],
  },
  {
    id: 'wallet',
    label: 'Sweeping wallet',
    name: 'deadhop wallet',
    page: '/wallet/',
    href: at('/wallet/'),
    install: at('/docs/wallet/sweep.html'),
    installLabel: 'Sweep to your cold wallet',
    repo: 'stack',
    docs: at('/docs/wallet/'),
    blurb: 'Moves what you received to your cold wallet once it is worth moving, by a send, a PayJoin or a CoinJoin.',
    stamp: 'send · PayJoin · CoinJoin',
    source: ['wallet'],
  },
];

export const product = (id: ProductId) => products.find((p) => p.id === id)!;

// Every public repository, for the Source section and the footer.
export const repos: { name: string; body: string }[] = [
  { name: 'server', body: 'The payment service and the crates the other parts share. Rust.' },
  { name: 'js', body: 'The dashboard, the network console and the @deadhop packages.' },
  { name: 'lnaddr', body: 'The Lightning address node and gateway.' },
  { name: 'relay', body: 'The whitelist-only Nostr relay.' },
  { name: 'wallet', body: 'The sweeper.' },
  { name: 'stack', body: 'The Compose file and the regtest stack to try it all.' },
  { name: 'site', body: 'This website and every docs page.' },
  { name: 'brand', body: 'The logo, icons and fonts.' },
];
