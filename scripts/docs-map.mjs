// The documentation map: every docs page, which product it belongs to and
// what kind of document it is. The VitePress sidebars, the badge on each page,
// the "next step" box, llms.txt, the sitemap and the site checks are all built
// from this one list, so they cannot disagree.
//
// Four kinds, after Diátaxis (https://diataxis.fr):
//   tutorial   learn by doing, start to finish, on a setup we chose for you
//   howto      do one job on your own setup
//   explainer  understand how and why it works
//   reference  look something up

export const KINDS = {
  tutorial: { label: 'Tutorial', group: 'Tutorials', blurb: 'Learn by doing, start to finish.' },
  howto: { label: 'How-to guide', group: 'How-to guides', blurb: 'Do one job on your own setup.' },
  explainer: { label: 'Explanation', group: 'Explanations', blurb: 'How it works and why.' },
  reference: { label: 'Reference', group: 'Reference', blurb: 'Every setting, tool and command.' },
};

// Paths are relative to the docs root, without ".md". "index" pages are the
// product's docs home. `install` is where that product's funnel ends: the
// page that gets the software running.
export const PRODUCTS = [
  {
    id: 'payments',
    name: 'deadhop',
    label: 'Payments',
    tagline: 'On-chain bitcoin invoices from your own node, with no open port.',
    page: '/',
    dir: '',
    install: 'install',
    pages: [
      ['index', 'explainer', 'Overview'],
      ['quickstart', 'tutorial', 'Try it on regtest'],
      ['first-payment', 'tutorial', 'Your first real payment'],
      ['install', 'howto', 'Choose a setup'],
      ['setups', 'howto', 'Deployment setups'],
      ['deploy-compose', 'howto', 'Run it with Docker Compose'],
      ['deploy-systemd', 'howto', 'Run it under systemd'],
      ['electrum', 'howto', 'Connect your Electrum server'],
      ['xpub/index', 'howto', 'Receive to your own wallet'],
      ['xpub/sparrow', 'howto', 'Sparrow', 'xpub/index'],
      ['xpub/electrum', 'howto', 'Electrum', 'xpub/index'],
      ['xpub/blockstream', 'howto', 'Blockstream app', 'xpub/index'],
      ['xpub/coldcard', 'howto', 'COLDCARD', 'xpub/index'],
      ['xpub/trezor', 'howto', 'Trezor', 'xpub/index'],
      ['xpub/ledger', 'howto', 'Ledger', 'xpub/index'],
      ['hide', 'howto', 'Hide the service'],
      ['dashboard', 'howto', 'Host the dashboard'],
      ['deployment', 'howto', 'Production checklist'],
      ['integrate', 'howto', 'Add payments to your app'],
      ['integrate-react', 'howto', 'React', 'integrate'],
      ['integrate-solid', 'howto', 'Solid', 'integrate'],
      ['integrate-svelte5', 'howto', 'Svelte 5', 'integrate'],
      ['integrate-svelte4', 'howto', 'Svelte 4', 'integrate'],
      ['integrate-javascript', 'howto', 'Plain JavaScript', 'integrate'],
      ['integrate-backend', 'howto', 'Backend', 'integrate'],
      ['how-it-works', 'explainer', 'How it works'],
      ['watch-only', 'explainer', 'Watch-only wallets'],
      ['design', 'explainer', 'Design decisions'],
      ['security', 'explainer', 'Security'],
      ['testing', 'explainer', 'Testing'],
      ['configuration', 'reference', 'Configuration'],
      ['cli', 'reference', 'Commands'],
      ['api', 'reference', 'Tools API'],
      ['roadmap', 'reference', 'Roadmap'],
      ['agents', 'reference', 'Markdown and llms.txt'],
    ],
  },
  {
    id: 'lnaddr',
    name: 'deadhop lnaddr',
    label: 'Lightning address',
    tagline: 'A Lightning address for a node with no open port.',
    page: '/lud16-lnaddr/',
    dir: 'lnaddr',
    install: 'lnaddr/quickstart',
    pages: [
      ['lnaddr/index', 'explainer', 'Overview'],
      ['lnaddr/quickstart', 'tutorial', 'Quick start'],
      ['lnaddr/backends', 'howto', 'Connect your Lightning backend'],
      ['lnaddr/reverse-proxies', 'howto', 'Put it behind a reverse proxy'],
      ['lnaddr/admin', 'howto', 'Manage it from the web or CLI'],
      ['lnaddr/architecture', 'explainer', 'Architecture'],
      ['lnaddr/hardening', 'explainer', 'Hardening'],
      ['lnaddr/security', 'explainer', 'Security'],
      ['lnaddr/performance', 'explainer', 'Performance'],
      ['lnaddr/testing', 'explainer', 'Testing'],
      ['lnaddr/node', 'reference', 'Node configuration'],
      ['lnaddr/gateway', 'reference', 'Gateway configuration'],
    ],
  },
  {
    id: 'relay',
    name: 'deadhop relay',
    label: 'Relay',
    tagline: 'A Nostr relay that carries your service and nothing else.',
    page: '/relay/',
    dir: 'relay',
    install: 'relay/quickstart',
    pages: [
      ['relay/index', 'explainer', 'Overview'],
      ['relay/quickstart', 'tutorial', 'Quick start'],
      ['relay/deployment', 'howto', 'Deploy it'],
      ['relay/networks', 'howto', 'Serve it on Tor, I2P and FIPS'],
      ['relay/architecture', 'explainer', 'How it works'],
      ['relay/hardening', 'explainer', 'Flood resistance'],
      ['relay/security', 'explainer', 'Security'],
      ['relay/performance', 'explainer', 'Performance'],
      ['relay/testing', 'explainer', 'Testing'],
      ['relay/configuration', 'reference', 'Configuration'],
      ['relay/status-pages', 'reference', 'Status pages'],
    ],
  },
  {
    id: 'wallet',
    name: 'deadhop wallet',
    label: 'Sweeping wallet',
    tagline: 'Moves what you received to your cold wallet, on its own.',
    page: '/wallet/',
    dir: 'wallet',
    install: 'wallet/sweep',
    pages: [
      ['wallet/index', 'explainer', 'Overview'],
      ['wallet/sweep', 'howto', 'Sweep to your cold wallet'],
      ['wallet/payjoin', 'howto', 'Sweep with PayJoin'],
      ['wallet/coinjoin', 'howto', 'Sweep with CoinJoin'],
      ['wallet/how-it-works', 'explainer', 'How sweeping works'],
      ['wallet/configuration', 'reference', 'Configuration and commands'],
    ],
  },
];

/** Every page: { path, kind, title, parent, product }. */
export const PAGES = PRODUCTS.flatMap((p) =>
  p.pages.map(([path, kind, title, parent]) => ({ path, kind, title, parent, product: p.id })),
);

export const pageOf = (path) => PAGES.find((p) => p.path === path);
export const productOf = (path) => PRODUCTS.find((p) => p.id === pageOf(path)?.product);

/** The page's URL under the docs base: "relay/index" -> "relay/", "api" -> "api.html". */
export const htmlOf = (path) => (path === 'index' ? '' : path.endsWith('/index') ? path.slice(0, -5) : `${path}.html`);
