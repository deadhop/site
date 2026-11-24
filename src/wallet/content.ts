// Copy for /wallet/. The page and its Markdown twin render from this.
import { at } from '../paths';
import type { Tool } from '../tool';

export const wallet: Tool = {
  id: 'wallet',
  title: 'deadhop wallet: sweep your payments to cold storage',
  description:
    'deadhop wallet moves the balance of deadhop’s generated wallet to your cold wallet once it reaches a threshold, by a plain send, a PayJoin or a CoinJoin.',
  stamp: 'sweeper · send · PayJoin · CoinJoin',
  headline: 'What you received, moved to cold storage on its own.',
  lede: 'deadhop can generate its own wallet so you can start today. The sweeper keeps that wallet small: past a threshold you set, it sends everything to a fresh address of your cold wallet.',
  hero: {
    src: '/shots/wallet-warning.webp',
    light: '/shots/wallet-warning-light.webp',
    width: 1600,
    height: 622,
    alt: 'The dashboard Overview with the warning: the wallet was generated on this host and its recovery phrase has not been backed up.',
  },
  flowTitle: 'How a sweep travels',
  flow: [
    { kicker: 'service', title: 'Takes payments', body: 'To fresh addresses of the generated wallet. It holds only the public key.' },
    { kicker: 'wallet', title: 'Keeps the words offline', body: 'In a container with no network at all. The sweeper reads them, read-only, and never makes new ones.' },
    { kicker: 'sweeper', title: 'Checks, then signs', body: 'Only its own coins in, at least the right amount to your cold wallet, no more than the fee cap lost.' },
    { kicker: 'cold wallet', title: 'Receives it all', body: 'At its next unused address, by a send, a PayJoin, or the far side of a CoinJoin.' },
  ],
  gallery: [
    {
      src: '/shots/wallet-sweep.webp',
      light: '/shots/wallet-sweep-light.webp',
      width: 1400,
      height: 290,
      alt: 'A terminal: the sweeper holding below its threshold, then moving 195,273 of 203,000 sats to the cold wallet in one transaction, and the same sweep in its status.',
      caption: 'The sweeper on a test chain: it holds until the confirmed balance passes the threshold, then moves everything to your cold wallet in one transaction. Until you write the generated wallet’s words down, the dashboard warns on every visit (above).',
    },
  ],
  points: [
    { title: 'Nobody can redirect it from afar', body: 'The destination, mode, threshold and fee cap come from the host’s environment. Nothing reachable over Nostr can change where money goes.' },
    { title: 'Checks every transaction', body: 'Whoever built it, a PayJoin receiver or CoinJoin peers included: its own coins only, the right amount out, the fee within the cap.' },
    { title: 'Waits rather than overpays', body: 'Above the fee cap, without a fresh PayJoin URI, or when a CoinJoin round does not fill, it holds and tries again later.' },
    { title: 'Finds every coin', body: 'deadhop hands out an address per invoice, paid or not. The sweeper scans every address deadhop used, not just the first 20.' },
    { title: 'Off until you ask', body: 'A separate container that starts only with its own profile, and holds without even reading a key until a destination is set.' },
    { title: 'Three ways out', body: 'A plain send, a BIP-78 PayJoin with a receiver you run, or a joinstr CoinJoin round over Nostr.' },
  ],
  ways: [
    { title: 'Plain send to cold storage', body: 'Everything confirmed, past the threshold, to the next address of your cold wallet.', href: at('/docs/wallet/sweep.html') },
    { title: 'PayJoin', body: 'The receiver adds a coin of its own, so the transaction does not show which inputs are whose.', href: at('/docs/wallet/payjoin.html') },
    { title: 'CoinJoin', body: 'Mixed with equal-amount outputs of other peers before it reaches your cold wallet.', href: at('/docs/wallet/coinjoin.html') },
  ],
  setupTitle: 'Three lines and a profile',
  setup: [
    { cmd: 'echo DEADHOP_WALLET_DESTINATION=zpub6… >> .env', note: 'your cold wallet’s account key' },
    { cmd: 'echo DEADHOP_WALLET_THRESHOLD_SAT=2000000 >> .env', note: 'sweep once 0.02 BTC is confirmed' },
    { cmd: 'docker compose --profile sweep up -d --build', note: 'start the sweeper next to deadhop' },
  ],
};
