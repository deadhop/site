// Markdown version of the landing page, for agents (linked with rel="alternate").
import { at } from '../paths';
import type { APIRoute } from 'astro';
import { benefits, components, docLinks, limits, needs, paths, pricing, product, shots, steps } from '../content';
import { products } from '../products';
import { faq } from '../seo';

const md = (href: string) => at(href.replace(/\.html$/, '.md').replace(/\/$/, '/index.md'));

export const GET: APIRoute = () => {
  const out = [
    `# ${product.name}`,
    '',
    `> ${product.tagline}`,
    '',
    `**${product.motto}**`,
    '',
    product.summary,
    '',
    `Install: [Choose a setup](${md('/docs/install.html')}). Try it first: [Try it on regtest](${md('/docs/quickstart.html')}).`,
    '',
    '## Where do you start?',
    '',
    ...paths.map((p) => `- [${p.title}](${md(p.href)}) (${p.kind.toLowerCase()}): ${p.body}`),
    '',
    '## What you get',
    '',
    `- ![${shots.hero.alt}](${at(shots.hero.src)})`,
    ...shots.gallery.map((s) => `- ![${s.alt}](${at(s.src)}) ${s.caption}`),
    '',
    '## How a payment travels',
    '',
    ...steps.flatMap((s) => [`### ${s.title}`, '', s.body, '']),
    '## Tools built the same way',
    '',
    ...products.filter((p) => p.id !== 'payments').map((p) => `- [${p.name}](${p.href}index.md): ${p.blurb}`),
    '',
    '## Security benefits',
    '',
    ...benefits.map((b) => `- **${b.title}.** ${b.body}`),
    '',
    '## What it does not protect against',
    '',
    ...limits.map((l) => `- ${l}`),
    '',
    '## What you run',
    '',
    ...components.map((c) => `- **${c.name}:** ${c.body}`),
    '',
    `**Price:** ${pricing}`,
    '',
    '## Questions',
    '',
    ...faq.flatMap((f) => [`**${f.q}**`, '', f.a, '']),
    '## Install',
    '',
    'You need:',
    '',
    ...needs.map((n) => `- ${n}`),
    '',
    '```sh',
    'git clone https://github.com/deadhop/stack',
    'cd stack',
    '```',
    '',
    `Then [choose a setup](${md('/docs/install.html')}).`,
    '',
    '## Documentation',
    '',
    ...docLinks.map((d) => `- [${d.title}](${md(d.href)}) (${d.kind.toLowerCase()}): ${d.body}`),
    '',
  ].join('\n');
  return new Response(out, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
