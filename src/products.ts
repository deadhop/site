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
  docs: string;
  blurb: string;
}

export const products: Product[] = [
  {
    id: 'payments',
    label: 'Payments',
    name: 'deadhop',
    page: '/',
    href: at('/'),
    install: at('/docs/install.html'),
    installLabel: 'Choose a setup',
    docs: at('/docs/'),
    blurb: 'On-chain bitcoin invoices from your own node, with no open port and no spending key.',
  },
  {
    id: 'lnaddr',
    label: 'Lightning address',
    name: 'deadhop lnaddr',
    page: '/lud16-lnaddr/',
    href: at('/lud16-lnaddr/'),
    install: at('/docs/lnaddr/quickstart.html'),
    installLabel: 'Quick start',
    docs: at('/docs/lnaddr/'),
    blurb: 'you@yourdomain for a Lightning node at home, with no port open at home.',
  },
  {
    id: 'relay',
    label: 'Relay',
    name: 'deadhop relay',
    page: '/relay/',
    href: at('/relay/'),
    install: at('/docs/relay/quickstart.html'),
    installLabel: 'Quick start',
    docs: at('/docs/relay/'),
    blurb: 'A Nostr relay that carries your service and nothing else, on clearnet, Tor, I2P or FIPS.',
  },
  {
    id: 'wallet',
    label: 'Sweeping wallet',
    name: 'deadhop wallet',
    page: '/wallet/',
    href: at('/wallet/'),
    install: at('/docs/wallet/sweep.html'),
    installLabel: 'Sweep to your cold wallet',
    docs: at('/docs/wallet/'),
    blurb: 'Moves what you received to your cold wallet once it is worth moving, by a send, a PayJoin or a CoinJoin.',
  },
];

export const product = (id: ProductId) => products.find((p) => p.id === id)!;
