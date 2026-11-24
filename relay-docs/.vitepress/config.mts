// deadhop relay docs, served at /relay/docs/. A separate VitePress
// root so the main docs (and their sidebar, sitemap and llms.txt) stay as
// they are until the two are tied together.
import { resolve } from 'node:path';
import { defineConfig, type HeadConfig } from 'vitepress';
import { basePath, siteUrl } from '../../scripts/site-url.mjs';

const SITE = siteUrl();
const BASE = `${basePath()}relay/docs/`;
const DESCRIPTION =
  'Documentation for deadhop relay: a small Nostr relay that carries only deadhop ContextVM requests and replies, for the keys you whitelist.';

function urls(relativePath: string) {
  const stem = relativePath.replace(/\.md$/, '');
  const html = stem === 'index' ? BASE : `${BASE}${stem}.html`;
  return { html: new URL(html, SITE).href, md: `${BASE}${stem}.md` };
}

export default defineConfig({
  base: BASE,
  outDir: resolve(import.meta.dirname, '../../dist/relay/docs'),
  cacheDir: resolve(import.meta.dirname, 'cache'),
  lang: 'en',
  title: 'deadhop relay docs',
  titleTemplate: ':title · deadhop relay',
  description: DESCRIPTION,
  cleanUrls: false,
  lastUpdated: false,
  appearance: true,
  head: [
    ['link', { rel: 'icon', href: `${BASE}favicon.svg`, type: 'image/svg+xml' }],
    ['meta', { name: 'referrer', content: 'no-referrer' }],
    ['meta', { property: 'og:site_name', content: 'deadhop' }],
    ['meta', { property: 'og:image', content: new URL(`${basePath()}og.png`, SITE).href }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ],
  transformHead({ pageData }): HeadConfig[] {
    if (pageData.isNotFound) return [['meta', { name: 'robots', content: 'noindex' }]];
    const { html, md } = urls(pageData.relativePath);
    const title = pageData.title ? `${pageData.title} · deadhop relay` : 'deadhop relay docs';
    const description = pageData.description || DESCRIPTION;
    const article = {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: pageData.title,
      description,
      url: html,
      inLanguage: 'en',
      about: { '@type': 'SoftwareApplication', name: 'deadhop relay', applicationCategory: 'DeveloperApplication' },
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
    siteTitle: 'deadhop relay',
    nav: [
      { text: 'Overview', link: new URL(`${basePath()}relay/`, SITE).href, target: '_self' },
      { text: 'Quick start', link: '/quickstart' },
      { text: 'Security', link: '/security' },
    ],
    sidebar: [
      {
        text: 'Start',
        items: [
          { text: 'Overview', link: '/' },
          { text: 'Quick start', link: '/quickstart' },
        ],
      },
      {
        text: 'Design',
        items: [
          { text: 'How it works', link: '/architecture' },
          { text: 'Flood resistance', link: '/hardening' },
          { text: 'Performance', link: '/performance' },
          { text: 'Security', link: '/security' },
        ],
      },
      {
        text: 'Operate',
        items: [
          { text: 'Configuration', link: '/configuration' },
          { text: 'Deployment', link: '/deployment' },
          { text: 'Tor, I2P and FIPS', link: '/networks' },
          { text: 'Status pages', link: '/status-pages' },
        ],
      },
      {
        text: 'Trust',
        items: [{ text: 'Testing', link: '/testing' }],
      },
    ],
    outline: { level: [2, 3] },
    search: { provider: 'local' },
    docFooter: { prev: 'Previous', next: 'Next' },
    footer: { message: 'deadhop relay 0.1.0 · Every page is also available as Markdown: replace .html with .md.' },
  },
});
