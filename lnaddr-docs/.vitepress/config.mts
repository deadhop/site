// deadhop lnaddr docs, served at /lud16-lnaddr/docs/. A separate VitePress
// root so the main docs (and their sidebar, sitemap and llms.txt) stay as
// they are until the two are tied together.
import { resolve } from 'node:path';
import { defineConfig, type HeadConfig } from 'vitepress';
import { basePath, siteUrl } from '../../scripts/site-url.mjs';

const SITE = siteUrl();
const BASE = `${basePath()}lud16-lnaddr/docs/`;
const DESCRIPTION =
  'Documentation for deadhop lnaddr: a Lightning address for a node with no public address, served by a gateway that asks your node for invoices over ContextVM.';

function urls(relativePath: string) {
  const stem = relativePath.replace(/\.md$/, '');
  const html = stem === 'index' ? BASE : `${BASE}${stem}.html`;
  return { html: new URL(html, SITE).href, md: `${BASE}${stem}.md` };
}

export default defineConfig({
  base: BASE,
  outDir: resolve(import.meta.dirname, '../../dist/lud16-lnaddr/docs'),
  cacheDir: resolve(import.meta.dirname, 'cache'),
  lang: 'en',
  title: 'deadhop lnaddr docs',
  titleTemplate: ':title · deadhop lnaddr',
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
    const title = pageData.title ? `${pageData.title} · deadhop lnaddr` : 'deadhop lnaddr docs';
    const description = pageData.description || DESCRIPTION;
    const article = {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: pageData.title,
      description,
      url: html,
      inLanguage: 'en',
      about: { '@type': 'SoftwareApplication', name: 'deadhop lnaddr', applicationCategory: 'FinanceApplication' },
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
    siteTitle: 'deadhop lnaddr',
    nav: [
      { text: 'Overview', link: new URL(`${basePath()}lud16-lnaddr/`, SITE).href, target: '_self' },
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
          { text: 'Architecture', link: '/architecture' },
          { text: 'Performance', link: '/performance' },
          { text: 'Hardening', link: '/hardening' },
          { text: 'Security', link: '/security' },
        ],
      },
      {
        text: 'Operate',
        items: [
          { text: 'Node configuration', link: '/node' },
          { text: 'Gateway configuration', link: '/gateway' },
          { text: 'Reverse proxies', link: '/reverse-proxies' },
          { text: 'Lightning backends', link: '/backends' },
          { text: 'Admin web and CLI', link: '/admin' },
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
    footer: { message: 'deadhop lnaddr 0.1.0 · Every page is also available as Markdown: replace .html with .md.' },
  },
});
