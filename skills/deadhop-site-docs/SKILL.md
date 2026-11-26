---
name: deadhop-site-docs
description: Write, change, move or review a page of the deadhop documentation at deadhop.run/docs, or a landing page of deadhop.run, in the deadhop/site repository. Covers choosing the page's Diátaxis kind (tutorial, how-to, explanation, reference), registering it in scripts/docs-map.mjs, the front matter the build needs, VitePress docs vs the Astro landing pages, what `just check` and scripts/check.mjs fail on, the check that docs only name real DEADHOP_* and LNADDR_* settings, the generated Markdown twins and llms.txt, the copied brand files, and the house style. Use it whenever someone asks to document a deadhop feature, fix or add a docs page, fix a typo on deadhop.run, add a how-to or tutorial for the relay, lnaddr, wallet, payments or JS packages, or make the site build or check pass.
license: MIT
metadata:
  repository: https://github.com/deadhop/site
---

# Writing deadhop.run docs

[deadhop/site](https://github.com/deadhop/site) is the website and the documentation for every
deadhop component. Doc fixes for any component come here, not to the component's repository.
Two sites build into one `dist/` folder:

- `docs/` is [VitePress](https://vitepress.dev), served at `/docs/`. Almost every docs change is
  here.
- `src/` is [Astro](https://astro.build): the landing page `/` and the product pages
  `/lud16-lnaddr/`, `/relay/` and `/wallet/`. Their text lives in `src/content.ts` (landing
  page), `src/<product>/content.ts`, `src/products.ts` and the pages under `src/pages/`, and each page has an `index.md.ts` that
  produces its Markdown twin.

Requirements: Node 24 and [`just`](https://github.com/casey/just).

## 1. Decide the page's kind

Every docs page has exactly one kind, after [Diátaxis](https://diataxis.fr). Pick it before you
write, and keep to it.

| Kind | Its job | Write it as |
| --- | --- | --- |
| `tutorial` | learn by doing, start to finish, on a setup chosen for the reader | numbered steps that always work, with the result shown |
| `howto` | do one job on the reader's own setup | the steps for that one job, with the choices the reader must make |
| `explainer` | understand how and why it works | prose, no step lists |
| `reference` | look something up | tables and exact names, no narrative |

A how-to does one job. If a page drifts into explaining design, move that part to an explainer
and link it. If a request mixes kinds ("document the relay's flood limits and how to tune them"),
propose two pages to the user, or add to the existing pages of each kind.

Before writing a new page, read `scripts/docs-map.mjs` and the product's existing pages: the
answer often belongs in a page that already exists.

## 2. Register the page in `scripts/docs-map.mjs`

Every docs page is listed in `scripts/docs-map.mjs`, under its product in `PRODUCTS`, as
`[path, kind, title]` or `[path, kind, title, parent]`:

- `path` is relative to `docs/` without `.md` (`relay/networks` is `docs/relay/networks.md`);
  `index` is a product's docs home.
- `parent` nests the page under another in the sidebar, like the per-wallet guides (Sparrow,
  COLDCARD and the others) under `xpub/index`.
- Order matters: the sidebars and `llms.txt` list pages in map order, grouped by kind.

The sidebars, the kind badge above each title, the "next step" box (which points at the
product's `install` page), `llms.txt`, the sitemap and the checks are all built from this one
list, so they cannot disagree. A page file without a map entry, or a map entry without a file,
fails the check. Moving or renaming a page means changing both, and every link to it.

## 3. Write the page

Start each file with flat, single-line front matter. `scripts/build.mjs` parses only plain
`key: value` lines, so no multi-line YAML:

```markdown
---
title: Serve it on Tor, I2P and FIPS
description: One sentence of 50 to 170 characters that says what the reader gets from this page.
---

# Serve it on Tor, I2P and FIPS
```

- The HTML `<title>` becomes `title · deadhop docs` (or `· deadhop relay docs` and so on for the
  other products) and must be 10 to 70 characters in total.
- The page has exactly one `# ` heading, and it comes first. A line starting with `# ` anywhere
  else outside a ```` ``` ```` fence (for example a shell comment in a `~~~` block) fails the
  Markdown twin check.
- Link other docs pages relatively, with `.md` (`[Integrate payments](./integrate.md)`). Every
  internal link and `#anchor` must resolve.
- Link a component's repository as `https://github.com/deadhop/<repo>`, and its files by their
  path inside that repository.

## 4. Name only settings that exist

The docs may name only `DEADHOP_*` and `LNADDR_*` settings that the source code defines. Grep the
component's source for every name before you write it, and copy the default from the code, not
from memory.

`scripts/check.mjs` enforces this, but only when the other deadhop repositories sit next to this
one, in the parent folder. That is the layout of a [deadhop/stack](https://github.com/deadhop/stack)
checkout after `just clone`, which clones server, js, lnaddr, wallet and relay into it; clone
deadhop/site into the same folder as well. A lone clone of this repository, and its pull request
CI, skip the check and print `settings check skipped`. So when you change a page that names
settings, run the check in that layout before calling the change done.

## 5. Check it

```sh
just check     # npm ci, npm run build, npm run check
just preview   # serve dist/ at http://127.0.0.1:4330
npm run docs:dev   # live reload for the docs (npm run dev for the Astro pages)
```

`npm run check` runs `scripts/check.mjs` against `dist/`. It fails on:

- a broken internal link or `#anchor`;
- a page without exactly one `<h1>`, `<main>`, `<header>`, `<nav>` and a footer, without
  `lang="en"`, or with a title or description outside the lengths above;
- missing canonical link, Open Graph tags, JSON-LD or Markdown twin;
- a docs page missing from the map, or a map entry with no page;
- a docs page without its kind badge, or (other than the product's install page) without a
  working next step;
- a product page without a screenshot from `/shots/` or a real terminal shot, without a link to
  its install page, or without the shared header;
- an inline script or missing Content-Security-Policy on the landing page;
- an `llms.txt` or sitemap entry that does not resolve, or a Markdown twin that does not start
  with a single `# ` heading;
- a served brand file that differs from its copy in `brand/`;
- a `DEADHOP_*` or `LNADDR_*` name the source does not define (only with the repositories side by
  side, see above).

Pull requests run the same build and check in CI. The site deploys on push to `main`.

## 6. Generated files: do not edit them

`npm run build` (`scripts/build.mjs`) writes, after Astro and VitePress:

- a Markdown twin of every docs page at `/docs/<path>.md`, with the description inserted as a
  `> ` line under the title;
- `llms.txt` (an index in map order) and `llms-full.txt` (everything in one file);
- `sitemap.xml` and `robots.txt`.

They come from the pages and the map. Fix the source page or `docs-map.mjs`, never `dist/`.
The [Markdown and llms.txt](https://deadhop.run/docs/agents.md) page describes them for readers.

## 7. Brand files are copies

`brand/` holds copies of the fonts, icons, mark and social card from
[deadhop/brand](https://github.com/deadhop/brand), and `public/` and `docs/public/` serve copies
of those. Change deadhop/brand first, then copy the files into `brand/`, `public/` and
`docs/public/` here. Never edit a brand file only in this repository.

## House style

- Plain, specific sentences. Say what happens and what the reader types or sees, with real
  commands and real output. No marketing adjectives.
- Address the reader as "you", in the imperative for steps.
- Explain why a rule exists instead of shouting it.
- Use placeholders such as `npub1…` and `zpub6…`, never real keys, and never ask the reader to
  paste an `nsec` anywhere.
- One idea per paragraph; tables for settings and choices; code blocks for anything to type.
- A how-to does one job. Link out for background instead of explaining it inline.

## Verify before you finish

1. The page is in `scripts/docs-map.mjs` with the kind you chose.
2. `just check` passes, and the settings check ran (not skipped) if the page names settings.
3. `just preview` shows the page in the right sidebar group, with its kind badge and next step.
4. The page's Markdown twin at `dist/docs/<path>.md` reads well on its own.
