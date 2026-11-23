// Copy for /relay/. The page and its Markdown twin render from this.
import { at } from '../paths';

export const relay = {
  name: 'deadhop relay',
  title: 'deadhop relay: a Nostr relay for one deadhop service',
  description:
    'A small Nostr relay that carries only your deadhop service’s ContextVM requests and replies. Whitelist your keys, run it at home or on a tiny VPS.',
  headline: 'A relay that carries your service and nothing else.',
  lede: 'Whitelist your deadhop invoice and admin keys. Anyone can reach them with a request; only they can answer. Everything else is refused before it costs a signature check.',
};

export const flow = [
  { kicker: 'customer', title: 'Sends a request', body: 'An encrypted ContextVM message to your invoice key. Anyone may, within a budget per address.' },
  { kicker: 'relay', title: 'Hands it to the service alone', body: 'Only a connection that proved the key with NIP-42 AUTH can read it. Nobody else can subscribe to it.' },
  { kicker: 'service', title: 'Answers', body: 'From the authenticated connection. Answers from anyone else are refused.' },
  { kicker: 'customer', title: 'Gets the answer', body: 'Queued to every subscriber that may read it, without waiting on any socket. Nothing accepted is dropped.' },
];

export const points = [
  { title: 'Nothing dropped', body: '0 of 300,000 round trips lost in the benchmark, with and without floods. Requests that arrive while the service reconnects are held for it.' },
  { title: 'Built for floods', body: 'Per-address connection and write budgets, rate limits, size caps and timeouts. Over a limit, only a whitelisted key that authenticates gets in.' },
  { title: 'Requests stay private', body: 'No firehose: every subscription names keys, and requests go only to the key they are for.' },
  { title: 'Small', body: 'One static binary of about 2 MB. About 2.7 MiB of memory idle, no disk, no database, no runtime.' },
  { title: 'Will not start open', body: 'Without a whitelist it refuses to start and says what to set. There is no open mode.' },
  { title: 'A status page', body: 'Traffic, refusals and the last hour, rendered on the server with no JavaScript. An operator page on loopback lists your keys.' },
];

export const facts = [
  { value: '0', label: 'dropped of 300,000 round trips' },
  { value: '4,823/s', label: 'round trips on 2 CPUs' },
  { value: '970k/s', label: 'attack messages absorbed' },
  { value: '2 MB', label: 'static binary, 2.7 MiB idle' },
];

export const setup = [
  { cmd: 'export DEADHOP_RELAY_WHITELIST=admin=npub1…', note: 'the keys this relay serves: your deadhop admin and/or invoice keys' },
  { cmd: 'deadhop-relay check', note: 'read the whitelist and limits, start nothing' },
  { cmd: 'deadhop-relay', note: 'serve on :7447; the operator page on 127.0.0.1:7448' },
];

export const docs = [
  { title: 'Quick start', href: at('/relay/docs/quickstart.html') },
  { title: 'How it works', href: at('/relay/docs/architecture.html') },
  { title: 'Flood resistance', href: at('/relay/docs/hardening.html') },
  { title: 'Performance', href: at('/relay/docs/performance.html') },
  { title: 'Deployment', href: at('/relay/docs/deployment.html') },
  { title: 'Configuration', href: at('/relay/docs/configuration.html') },
];
