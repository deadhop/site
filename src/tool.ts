// The shape of a tool page (/lud16-lnaddr/, /relay/, /wallet/). Each tool's
// content file fills one in; components/ToolPage.astro renders it, and
// toolMarkdown renders its Markdown twin, so the two cannot drift.
import { at } from './paths';
import { product, type ProductId } from './products';
// @ts-expect-error: a plain ES module shared with VitePress and the build scripts.
import { KINDS, PRODUCTS, htmlOf } from '../scripts/docs-map.mjs';

export interface Picture {
  src: string;
  light?: string;
  width: number;
  height: number;
  alt: string;
  caption?: string;
}

export interface Tool {
  id: ProductId;
  title: string;
  description: string;
  stamp: string;
  headline: string;
  lede: string;
  hero?: Picture;
  /** Real terminal output, shown as text in a window when there is no screen to show. */
  term?: { title: string; lines: string[] };
  facts?: { value: string; label: string }[];
  flowTitle: string;
  flow: { kicker: string; title: string; body: string }[];
  gallery: Picture[];
  points: { title: string; body: string }[];
  chips?: { label: string; items: string[] };
  ways: { title: string; body: string; href: string }[];
  setupTitle: string;
  setup: { cmd: string; note: string }[];
}

export interface DocGroup {
  kind: string;
  label: string;
  blurb: string;
  links: { title: string; href: string }[];
}

/** A tool's docs, grouped by kind, from scripts/docs-map.mjs. */
export function docGroups(id: ProductId): DocGroup[] {
  const p = PRODUCTS.find((x: { id: string }) => x.id === id);
  return Object.entries(KINDS as Record<string, { group: string; blurb: string }>)
    .map(([kind, k]) => ({
      kind,
      label: k.group,
      blurb: k.blurb,
      links: (p.pages as [string, string, string, string?][])
        .filter(([, k2, , parent]) => k2 === kind && !parent)
        .map(([path, , title]) => ({ title, href: at(`/docs/${htmlOf(path)}`) })),
    }))
    .filter((g) => g.links.length);
}

export function toolMarkdown(t: Tool): string {
  const me = product(t.id);
  const md = (href: string) => href.replace(/\.html$/, '.md').replace(/\/$/, '/index.md');
  return [
    `# ${me.name}`,
    '',
    `> ${t.description}`,
    '',
    `**${t.headline}**`,
    '',
    t.lede,
    '',
    `Install: [${me.installLabel}](${md(me.install)}).`,
    '',
    ...(t.facts ?? []).map((f) => `- **${f.value}** ${f.label}`),
    ...(t.facts ? [''] : []),
    '## What you get',
    '',
    ...(t.hero ? [`- ![${t.hero.alt}](${at(t.hero.src)})`] : []),
    ...t.gallery.map((s) => `- ![${s.alt}](${at(s.src)})${s.caption ? ` ${s.caption}` : ''}`),
    ...(t.term ? ['', `${t.term.title}:`, '', '```text', ...t.term.lines, '```'] : []),
    '',
    `## ${t.flowTitle}`,
    '',
    ...t.flow.map((s, i) => `${i + 1}. **${s.kicker}: ${s.title}.** ${s.body}`),
    '',
    '## Why it is built this way',
    '',
    ...t.points.map((p) => `- **${p.title}.** ${p.body}`),
    ...(t.chips ? ['', `${t.chips.label}: ${t.chips.items.join(', ')}.`] : []),
    '',
    '## Ways to run it',
    '',
    ...t.ways.map((w) => `- [${w.title}](${md(w.href)}): ${w.body}`),
    '',
    `## ${t.setupTitle}`,
    '',
    '```sh',
    ...t.setup.map((s) => `${s.cmd}    # ${s.note}`),
    '```',
    '',
    '## Documentation',
    '',
    ...docGroups(t.id).flatMap((g) => [`### ${g.label}`, '', ...g.links.map((l) => `- [${l.title}](${md(l.href)})`), '']),
  ].join('\n');
}
