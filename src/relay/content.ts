// Copy for /relay/. The page and its Markdown twin render from this.
import { at } from '../paths';
import type { Tool } from '../tool';

export const relay: Tool = {
  id: 'relay',
  title: 'deadhop relay: a Nostr relay for your deadhop service',
  description:
    'A small Nostr relay that carries your deadhop service’s ContextVM requests and replies, on clearnet, Tor, I2P or FIPS. Whitelist your keys, or open it to all.',
  stamp: 'Nostr relay · ContextVM only · dropped: 0',
  headline: 'A relay that carries your service and nothing else.',
  lede: 'Whitelist your deadhop invoice and admin keys. Anyone can reach them with a request; only they can answer. Everything else is refused before it costs a signature check.',
  hero: {
    src: '/shots/relay-operator.webp',
    light: '/shots/relay-operator-light.webp',
    width: 1600,
    height: 938,
    alt: 'The relay operator page: uptime, connections, events relayed, nothing dropped, and a card per network: clearnet, Tor, I2P and FIPS.',
  },
  facts: [
    { value: '0', label: 'dropped of 300,000 round trips' },
    { value: '4,823/s', label: 'round trips on 2 CPUs' },
    { value: '970k/s', label: 'attack messages absorbed' },
    { value: '2 MB', label: 'static binary, 2.7 MiB idle' },
  ],
  flowTitle: 'How a request travels',
  flow: [
    { kicker: 'customer', title: 'Sends a request', body: 'An encrypted ContextVM message to your invoice key. Anyone may, within a budget per address.' },
    { kicker: 'relay', title: 'Hands it to the service alone', body: 'Only a connection that proved the key with NIP-42 AUTH can read it. Nobody else can subscribe to it.' },
    { kicker: 'service', title: 'Answers', body: 'From the authenticated connection. Answers from anyone else are refused.' },
    { kicker: 'customer', title: 'Gets the answer', body: 'Queued to every subscriber that may read it, without waiting on any socket. Nothing accepted is dropped.' },
  ],
  gallery: [
    {
      src: '/shots/relay-status.webp',
      width: 1600,
      height: 888,
      alt: 'The public status page: the relay’s clearnet, Tor, I2P and FIPS addresses, traffic and the last hour.',
      caption: 'The public status page: where to reach it on each network, and what it carried in the last hour. No JavaScript.',
    },
    {
      src: '/shots/relay-operator.webp',
      light: '/shots/relay-operator-light.webp',
      width: 1600,
      height: 938,
      alt: 'The operator page with a card per network.',
      caption: 'The operator page, on loopback: each network’s connections against its cap, and your whitelisted keys.',
    },
  ],
  points: [
    { title: 'Nothing dropped', body: '0 of 300,000 round trips lost in the benchmark, with and without floods. Requests that arrive while the service reconnects are held for it.' },
    { title: 'Built for floods', body: 'Per-address connection and write budgets, rate limits, size caps and timeouts. Over a limit, only a whitelisted key that authenticates gets in.' },
    { title: 'Requests stay private', body: 'No firehose: every subscription names keys, and requests go only to the key they are for.' },
    { title: 'Clearnet, Tor, I2P and FIPS', body: 'Served on any of them, or all at once, through adapters your own daemons forward to. Each network has its own cap and its own numbers.' },
    { title: 'Whitelist, or public on purpose', body: 'Without a whitelist it refuses to start and says what to set. Public mode, for every key under public limits, is a switch you turn on yourself.' },
    { title: 'Small', body: 'One static binary of about 2 MB. About 2.7 MiB of memory idle, no disk, no database, no runtime.' },
  ],
  ways: [
    { title: 'Next to deadhop, for admin traffic', body: 'On your own network, whitelisting the admin key, so the dashboard never needs a public relay.', href: at('/docs/relay/deployment.html') },
    { title: 'On a tiny VPS', body: 'Your service’s main relay, or a fallback next to public ones. One more relay never slows a reply.', href: at('/docs/relay/deployment.html') },
    { title: 'As an onion service', body: 'On Tor, I2P or FIPS as well as clearnet, or instead of it, with each network’s numbers.', href: at('/docs/relay/networks.html') },
  ],
  setupTitle: 'Three commands to a running relay',
  setup: [
    { cmd: 'export DEADHOP_RELAY_WHITELIST=admin=npub1…', note: 'the keys this relay serves: your deadhop admin and/or invoice keys' },
    { cmd: 'deadhop-relay check', note: 'read the whitelist and limits, start nothing' },
    { cmd: 'deadhop-relay', note: 'serve on :7447; the operator page on 127.0.0.1:7448' },
  ],
};
