// Markdown twin of /relay/, for agents.
import type { APIRoute } from 'astro';
import { docs, facts, flow, points, relay, setup } from '../../relay/content';

export const GET: APIRoute = () => {
  const out = [
    `# ${relay.name}`,
    '',
    `> ${relay.description}`,
    '',
    `**${relay.headline}**`,
    '',
    relay.lede,
    '',
    ...facts.map((f) => `- **${f.value}** ${f.label}`),
    '',
    '## How a request travels',
    '',
    ...flow.map((s, i) => `${i + 1}. **${s.kicker}: ${s.title}.** ${s.body}`),
    '',
    '## Why it is built this way',
    '',
    ...points.map((p) => `- **${p.title}.** ${p.body}`),
    '',
    '## Three commands to a running relay',
    '',
    '```sh',
    ...setup.map((s) => `${s.cmd}    # ${s.note}`),
    '```',
    '',
    '## Read more',
    '',
    ...docs.map((d) => `- [${d.title}](${d.href.replace(/\.html$/, '.md')})`),
    '',
  ];
  return new Response(out.join('\n'), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
