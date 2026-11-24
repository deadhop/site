// Offline agent-readiness and SEO checks against dist/. Mirrors what scanners
// such as amiagentready look for, since they cannot reach a local build:
// headings, landmarks, structured data, llms.txt, robots.txt, Markdown twins,
// sitemap, metadata, and every internal link resolving.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { basePath, siteUrl } from './site-url.mjs';
import { PAGES, PRODUCTS, htmlOf } from './docs-map.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const SITE = siteUrl();
const BASE = basePath();
const failures = [];
const fail = (where, msg) => failures.push(`${where}: ${msg}`);
let checks = 0;
const expect = (ok, where, msg) => {
  checks++;
  if (!ok) fail(where, msg);
};

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

/** URL path (under the base path) -> file in dist (same rules as the preview server). */
function fileOf(urlPath) {
  if (!urlPath.startsWith(BASE)) return null;
  const p = join(dist, decodeURIComponent(urlPath.slice(BASE.length - 1)));
  for (const c of [p, join(p, 'index.html'), `${p}.html`]) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
}

function exists(urlPath) {
  if (!urlPath.startsWith(BASE)) return false;
  const p = join(dist, decodeURIComponent(urlPath.slice(BASE.length - 1)));
  for (const c of [p, join(p, 'index.html'), `${p}.html`]) {
    if (existsSync(c) && statSync(c).isFile()) return true;
  }
  return false;
}

const all = walk(dist);
// Old tool-docs URLs are tiny redirect pages (scripts/build.mjs), checked on their own below.
const isRedirect = (f) => /<meta http-equiv="refresh"/.test(readFileSync(f, 'utf8'));
const redirects = all.filter((f) => f.endsWith('.html') && isRedirect(f));
const pages = all.filter((f) => f.endsWith('.html') && !f.endsWith('404.html') && !redirects.includes(f));
expect(pages.length >= 2, 'dist', 'expected the landing page and docs pages');

for (const file of pages) {
  const where = '/' + relative(dist, file);
  const html = readFileSync(file, 'utf8');
  const count = (re) => (html.match(re) ?? []).length;

  expect(/<html[^>]* lang="en"/.test(html), where, 'missing lang attribute');
  expect(count(/<h1[\s>]/g) === 1, where, `expected exactly one <h1>, found ${count(/<h1[\s>]/g)}`);
  expect(count(/<main[\s>]/g) === 1, where, 'expected one <main> landmark');
  expect(/<header[\s>]/.test(html), where, 'missing <header> landmark');
  expect(/<nav[\s>]/.test(html), where, 'missing <nav> landmark');
  expect(/<footer[\s>]/.test(html) || /class="VPFooter/.test(html) || /VPDocFooter/.test(html), where, 'missing footer');

  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
  expect(title.length >= 10 && title.length <= 70, where, `title length ${title.length} outside 10..70: "${title}"`);
  const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
  expect(desc.length >= 50 && desc.length <= 170, where, `meta description length ${desc.length} outside 50..170`);
  expect(/<meta name="viewport"/.test(html), where, 'missing viewport');

  const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
  expect(!!canonical && canonical.startsWith(SITE), where, `canonical missing or not on ${SITE}`);
  const og = html.match(/<meta property="og:image" content="([^"]*)"/)?.[1];
  expect(/<meta property="og:title"/.test(html) && !!og && og.startsWith(SITE) && exists(new URL(og).pathname), where, 'Open Graph tags missing or image unresolved');

  const md = html.match(/<link rel="alternate" type="text\/markdown" href="([^"]*)"/)?.[1];
  expect(!!md && exists(md), where, `Markdown twin missing or unresolved (${md})`);

  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  expect(ld.length > 0, where, 'no JSON-LD');
  for (const block of ld) {
    try {
      const data = JSON.parse(block);
      expect(typeof data['@type'] === 'string' && data['@context'] === 'https://schema.org', where, 'JSON-LD without @context/@type');
    } catch (e) {
      fail(where, `JSON-LD does not parse: ${e.message}`);
    }
  }

  // Every internal link and asset resolves.
  for (const [, ref] of html.matchAll(/(?:href|src)="([^"#?]+)[^"]*"/g)) {
    if (/^(https?:|mailto:|data:|\/\/)/.test(ref)) continue;
    const abs = new URL(ref, new URL(BASE + where.slice(1), 'http://x')).pathname;
    expect(exists(abs), where, `broken link ${ref}`);
  }

  // Every #fragment names an id on its target page.
  for (const [, ref, frag] of html.matchAll(/href="([^"#?]*)(?:\?[^"#]*)?#([^"]+)"/g)) {
    if (/^(https?:|mailto:|\/\/)/.test(ref)) continue;
    const target = ref === '' ? file : fileOf(new URL(ref, new URL(BASE + where.slice(1), 'http://x')).pathname);
    const id = decodeURIComponent(frag);
    expect(!!target && readFileSync(target, 'utf8').includes(`id="${id}"`), where, `broken anchor ${ref}#${frag}`);
  }

  // Content is visible without JavaScript: nothing hidden in the markup itself.
  expect(!/<(main|section|article|h1|h2|p)[^>]*style="[^"]*(opacity:\s*0|visibility:\s*hidden)/.test(html), where, 'content hidden in markup');
}

// Landing page specifics.
const landing = readFileSync(join(dist, 'index.html'), 'utf8');
const types = [...landing.matchAll(/"@type":"([A-Za-z]+)"/g)].map((m) => m[1]);
for (const t of ['SoftwareApplication', 'Offer', 'FAQPage', 'WebSite']) expect(types.includes(t), '/index.html', `JSON-LD lacks ${t}`);
expect(/Security benefits<\/h2>/.test(landing), '/index.html', 'security benefits section missing');
expect(/<meta http-equiv="Content-Security-Policy"/.test(landing), '/index.html', 'missing CSP');
expect(!/<script(?![^>]*(src=|application\/ld\+json))[^>]*>/.test(landing), '/index.html', 'inline script would violate the CSP');

// Brand files served from fixed paths are copies of brand/; they must not drift.
const brand = resolve(root, '..', 'brand');
for (const [served, source] of [
  ['favicon.svg', 'icons/favicon.svg'],
  ['og.png', 'og.png'],
  ['apple-touch-icon.png', 'icons/apple-touch-icon.png'],
  ['docs/favicon.svg', 'icons/favicon.svg'],
  ['docs/mark.svg', 'logo/mark.svg'],
  ['docs/mark-fog.svg', 'logo/mark-fog.svg'],
]) {
  const file = join(dist, served);
  expect(existsSync(file) && readFileSync(file).equals(readFileSync(join(brand, source))), `/${served}`, `differs from brand/${source}`);
}

// Root files for agents and crawlers.
const robots = existsSync(join(dist, 'robots.txt')) ? readFileSync(join(dist, 'robots.txt'), 'utf8') : '';
expect(robots.includes(`Sitemap: ${new URL(`${BASE}sitemap.xml`, SITE).href}`), '/robots.txt', 'missing Sitemap line');
for (const bot of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended']) expect(robots.includes(`User-agent: ${bot}`), '/robots.txt', `no rule for ${bot}`);
expect(!/^Disallow: \/$/m.test(robots), '/robots.txt', 'disallows everything');

const llms = existsSync(join(dist, 'llms.txt')) ? readFileSync(join(dist, 'llms.txt'), 'utf8') : '';
expect(/^# deadhop\n\n> .+/m.test(llms), '/llms.txt', 'must start with "# name" and a "> summary"');
for (const [, url] of llms.matchAll(/\]\(([^)]+)\)/g)) {
  expect(url.startsWith(SITE) && exists(new URL(url).pathname), '/llms.txt', `link does not resolve: ${url}`);
}
expect(existsSync(join(dist, 'llms-full.txt')) && statSync(join(dist, 'llms-full.txt')).size > 10_000, '/llms-full.txt', 'missing or too small');

const sitemap = existsSync(join(dist, 'sitemap.xml')) ? readFileSync(join(dist, 'sitemap.xml'), 'utf8') : '';
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
expect(locs.length === pages.length, '/sitemap.xml', `lists ${locs.length} URLs for ${pages.length} pages`);

// Redirects: each points at a page that exists, and is kept out of search.
expect(redirects.length > 0, 'redirects', 'the old /relay/docs/ and /lud16-lnaddr/docs/ URLs should redirect');
for (const f of redirects) {
  const html = readFileSync(f, 'utf8');
  const to = html.match(/url=([^"]+)"/)?.[1] ?? '';
  expect(/name="robots" content="noindex"/.test(html), '/' + relative(dist, f), 'redirect without noindex');
  expect(to.startsWith(SITE) && exists(new URL(to).pathname), '/' + relative(dist, f), `redirects to a missing page: ${to}`);
}

// The docs map and the docs agree: every page is in the map, every map entry has a page.
const docsRoot = join(root, 'docs');
const docFiles = walk(docsRoot)
  .filter((f) => f.endsWith('.md') && !relative(docsRoot, f).startsWith('.vitepress') && !relative(docsRoot, f).startsWith('public'))
  .map((f) => relative(docsRoot, f).replace(/\.md$/, ''));
for (const f of docFiles) expect(PAGES.some((p) => p.path === f), `/docs/${f}.md`, 'not in scripts/docs-map.mjs');
for (const p of PAGES) expect(docFiles.includes(p.path), `/docs/${p.path}.md`, 'in the docs map but missing');

// The funnel. Every product page shows the product (a screenshot or real terminal
// output) and links to its install page; every docs page says what kind it is and,
// except the install page itself, where to go next.
for (const prod of PRODUCTS) {
  const file = join(dist, prod.page.replace(/^\//, ''), 'index.html');
  const where = prod.page;
  const html = existsSync(file) ? readFileSync(file, 'utf8') : '';
  const install = `${BASE}docs/${htmlOf(prod.install)}`;
  expect(/<img [^>]*src="[^"]*\/shots\/[^"]+"/.test(html) || /class="shot t-termshot"/.test(html), where, 'no screenshot of the product');
  expect(html.includes(`href="${install}"`) && exists(install), where, `no working link to its install page ${install}`);
  expect(/<header[\s>]/.test(html) && /aria-label="Products"/.test(html), where, 'missing the shared header');
}
for (const p of PAGES) {
  const file = join(dist, 'docs', htmlOf(p.path) || 'index.html');
  const html = existsSync(file.endsWith('/') ? join(file, 'index.html') : file) ? readFileSync(file.endsWith('/') ? join(file, 'index.html') : file, 'utf8') : '';
  const where = `/docs/${htmlOf(p.path)}`;
  expect(/class="doc-kind"/.test(html), where, 'no kind badge');
  const prod = PRODUCTS.find((x) => x.id === p.product);
  if (p.path !== prod.install) {
    const next = html.match(/<aside class="next-step"[\s\S]*?href="([^"]+)"/)?.[1];
    expect(!!next && exists(next), where, `no working next step (${next})`);
  }
}

// Every setting the docs name exists in the source.
const repo = resolve(root, '..');
const sources = ['server/src', 'server/crates', 'server/tests', 'wallet/src', 'relay/src', 'lnaddr/src', 'dashboard/deploy', 'scripts', 'relay/deploy']
  .map((d) => join(repo, d))
  .filter(existsSync)
  .flatMap(walk)
  .concat(['compose.yaml', 'justfile'].map((f) => join(repo, f)).filter(existsSync))
  .filter((f) => /\.(rs|sh|ya?ml|ts|mjs|example)$|justfile$/.test(f));
const known = new Set(sources.flatMap((f) => readFileSync(f, 'utf8').match(/\b(?:DEADHOP|LNADDR)_[A-Z0-9_]+/g) ?? []));
// The relay reads DEADHOP_RELAY_ plus a name ("STORE_TTL_SECS"), and per network "{}_MAX_CONNECTIONS".
for (const f of sources.filter((f) => f.includes(`${'/'}relay${'/'}src${'/'}`))) {
  const text = readFileSync(f, 'utf8');
  for (const [, n] of text.matchAll(/"([A-Z][A-Z0-9_]+)"/g)) known.add(`DEADHOP_RELAY_${n}`);
  for (const [, n] of text.matchAll(/"\{\}_([A-Z0-9_]+)"/g)) for (const net of ['TOR', 'I2P', 'FIPS']) known.add(`DEADHOP_RELAY_${net}_${n}`);
}
// Names the docs ask the reader to define in their own code.
known.add('DEADHOP_BACKEND_NSEC');
if (known.size) {
  for (const f of docFiles) {
    const text = readFileSync(join(docsRoot, `${f}.md`), 'utf8');
    for (const v of new Set(text.match(/\b(?:DEADHOP|LNADDR)_[A-Z0-9_]*[A-Z0-9]\b/g) ?? [])) {
      expect(known.has(v) || [...known].some((k) => k.startsWith(v + '_')), `/docs/${f}.md`, `names ${v}, which the source does not define`);
    }
  }
}

for (const loc of locs) expect(loc.startsWith(SITE) && exists(new URL(loc).pathname), '/sitemap.xml', `unresolved ${loc}`);

// Every Markdown twin starts with a single top-level heading.
for (const f of all.filter((f) => f.endsWith('.md'))) {
  const text = readFileSync(f, 'utf8');
  const prose = text.replace(/^```[\s\S]*?^```/gm, '');
  expect(/^# .+/.test(text) && (prose.match(/^# /gm) ?? []).length === 1, '/' + relative(dist, f), 'Markdown twin needs exactly one "# " heading first');
}

// Private values must never ship. Read them without printing them.
const secrets = [];
const envLocal = join(root, '..', '.env.local');
if (existsSync(envLocal)) {
  for (const line of readFileSync(envLocal, 'utf8').split('\n')) {
    const v = line.split('=').slice(1).join('=').trim();
    if (v.length >= 6) secrets.push(v);
  }
}
if (process.env.CHECK_PRIVATE) secrets.push(...process.env.CHECK_PRIVATE.split(',').filter(Boolean));
for (const f of all) {
  const text = readFileSync(f, 'latin1');
  secrets.forEach((s, i) => expect(!text.includes(s), '/' + relative(dist, f), `contains private value #${i + 1}`));
}

if (failures.length) {
  console.error(`${failures.length} of ${checks} checks failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(`all ${checks} checks passed across ${pages.length} pages (${secrets.length} private values scanned for)`);
