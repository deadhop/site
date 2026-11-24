// Markdown twin of /lud16-lnaddr/, for agents.
import type { APIRoute } from 'astro';
import { backends, docs, flow, lnaddr, points, setup } from '../../lnaddr/content';

export const GET: APIRoute = () => {
  const out = [
    `# ${lnaddr.name}`,
    '',
    `> ${lnaddr.description}`,
    '',
    `**${lnaddr.headline}**`,
    '',
    lnaddr.lede,
    '',
    '## How a payment travels',
    '',
    ...flow.map((s, i) => `${i + 1}. **${s.kicker}: ${s.title}.** ${s.body}`),
    '',
    '## Why it is built this way',
    '',
    ...points.map((p) => `- **${p.title}.** ${p.body}`),
    '',
    `Lightning backends: ${backends.join(', ')}.`,
    '',
    '## Three commands to a working address',
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
