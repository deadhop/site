// One documentation site for every deadhop product, under /docs/. The
// sidebars, the kind of each page (tutorial, how-to, explanation, reference)
// and each product's install page come from scripts/docs-map.mjs.
import { resolve } from 'node:path';
import { defineConfig, type DefaultTheme, type HeadConfig } from 'vitepress';
import { basePath, siteUrl } from '../../scripts/site-url.mjs';
import { KINDS, PRODUCTS, htmlOf, pageOf, productOf } from '../../scripts/docs-map.mjs';

const SITE = siteUrl();
const BASE = `${basePath()}docs/`;
const HOME = new URL(basePath(), SITE).href;
const DESCRIPTION =
  'Documentation for deadhop and its tools: on-chain payments with no open port, a Lightning address, a private relay and a sweeping wallet.';

const stemOf = (relativePath: string) => relativePath.replace(/\.md$/, '');

// "relay/quickstart.md" -> "/docs/relay/quickstart.html" (canonical) and "/docs/relay/quickstart.md".
function urls(relativePath: string) {
  const stem = stemOf(relativePath);
  return { html: new URL(`${BASE}${htmlOf(stem)}`, SITE).href, md: `${BASE}${stem}.md` };
}

const link = (path: string) => `/${htmlOf(path).replace(/\.html$/, '')}`;

/** A product's sidebar: its docs home, then one group per kind of document. */
function sidebar(product: (typeof PRODUCTS)[number]): DefaultTheme.SidebarItem[] {
  const pages = product.pages.map(([path, kind, title, parent]) => ({ path, kind, title, parent }));
  const home = pages[0];
  const items = (kind: string) =>
    pages
      .filter((p) => p.kind === kind && !p.parent && p !== home)
      .map((p) => {
        const children = pages.filter((c) => c.parent === p.path).map((c) => ({ text: c.title, link: link(c.path) }));
        return children.length ? { text: p.title, link: link(p.path), collapsed: true, items: children } : { text: p.title, link: link(p.path) };
      });
  return [
    { text: product.label, items: [{ text: 'Overview', link: link(home.path) }] },
    ...Object.entries(KINDS)
      .map(([kind, k]) => ({ text: k.group, items: items(kind) }))
      .filter((g) => g.items.length),
  ];
}

const sidebars: DefaultTheme.SidebarMulti = {};
for (const p of PRODUCTS) {
  if (p.dir) sidebars[`/${p.dir}/`] = sidebar(p);
}
sidebars['/xpub/'] = sidebar(PRODUCTS[0]);
sidebars['/'] = sidebar(PRODUCTS[0]);

export default defineConfig({
  base: BASE,
  outDir: resolve(import.meta.dirname, '../../dist/docs'),
  lang: 'en',
  title: 'deadhop docs',
  titleTemplate: ':title · deadhop docs',
  description: DESCRIPTION,
  cleanUrls: false,
  lastUpdated: false,
  appearance: true,
  head: [
    ['link', { rel: 'icon', href: `${BASE}favicon.svg`, type: 'image/svg+xml' }],
    ['link', { rel: 'apple-touch-icon', href: `${basePath()}apple-touch-icon.png` }],
    ['meta', { name: 'referrer', content: 'no-referrer' }],
    ['meta', { name: 'robots', content: 'index, follow' }],
    ['meta', { property: 'og:site_name', content: 'deadhop' }],
    ['meta', { property: 'og:image', content: new URL(`${basePath()}og.png`, SITE).href }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['link', { rel: 'alternate', type: 'text/plain', href: `${basePath()}llms.txt`, title: 'llms.txt' }],
  ],
  // The kind, product and next step of every page come from the map, not from
  // each file, so a page cannot claim to be something the sidebar says it is not.
  transformPageData(pageData) {
    const stem = stemOf(pageData.relativePath);
    const page = pageOf(stem);
    const product = productOf(stem);
    if (!page || !product) return;
    pageData.frontmatter.kind = page.kind;
    pageData.frontmatter.kindLabel = KINDS[page.kind as keyof typeof KINDS].label;
    pageData.frontmatter.product = product.label;
    pageData.frontmatter.productName = product.name;
    pageData.frontmatter.productPage = new URL(`${basePath()}${product.page.replace(/^\//, '')}`, SITE).pathname;
    if (stem !== product.install) {
      pageData.frontmatter.install = `${BASE}${htmlOf(product.install)}`;
      pageData.frontmatter.installTitle = pageOf(product.install)!.title;
    }
    if (product.id !== 'payments') pageData.titleTemplate = `:title · ${product.name} docs`;
  },
  transformHead({ pageData }): HeadConfig[] {
    if (pageData.isNotFound) return [['meta', { name: 'robots', content: 'noindex' }]];
    const { html, md } = urls(pageData.relativePath);
    const product = productOf(stemOf(pageData.relativePath));
    const site = product && product.id !== 'payments' ? `${product.name} docs` : 'deadhop docs';
    const title = pageData.title ? `${pageData.title} · ${site}` : site;
    const description = pageData.description || DESCRIPTION;
    const article = {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: pageData.title,
      description,
      url: html,
      inLanguage: 'en',
      isPartOf: { '@type': 'WebSite', name: 'deadhop', url: HOME },
      about: { '@type': 'SoftwareApplication', name: product?.name ?? 'deadhop', applicationCategory: 'FinanceApplication' },
      encoding: { '@type': 'MediaObject', encodingFormat: 'text/markdown', contentUrl: new URL(md, SITE).href },
    };
    return [
      ['link', { rel: 'canonical', href: html }],
      ['link', { rel: 'alternate', type: 'text/markdown', href: md, title: 'Markdown version' }],
      ['meta', { property: 'og:type', content: 'article' }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { property: 'og:url', content: html }],
      ['script', { type: 'application/ld+json' }, JSON.stringify(article).replace(/</g, '\\u003c')],
    ];
  },
  themeConfig: {
    logo: { light: '/mark.svg', dark: '/mark-fog.svg', alt: '' },
    siteTitle: 'deadhop',
    nav: [
      { text: 'Home', link: HOME, target: '_self' },
      {
        text: 'Products',
        items: PRODUCTS.map((p) => ({ text: p.label, link: link(p.pages[0][0]) })),
      },
      { text: 'Install', link: '/install' },
    ],
    sidebar: sidebars,
    outline: { level: [2, 3] },
    search: { provider: 'local' },
    docFooter: { prev: 'Previous', next: 'Next' },
    footer: { message: 'deadhop 0.1.0 · Every page is also available as Markdown: replace .html with .md.' },
  },
});
