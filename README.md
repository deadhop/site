# deadhop website and docs

The source of https://deadhop.run: an Astro landing page and tool pages (`src/`), and the
VitePress docs served at `/docs/` (`docs/`). The docs cover every deadhop component: the
service ([deadhop/server](https://github.com/deadhop/server)), the JavaScript packages and
dashboard ([deadhop/js](https://github.com/deadhop/js)), [lnaddr](https://github.com/deadhop/lnaddr),
the [relay](https://github.com/deadhop/relay) and the [wallet](https://github.com/deadhop/wallet).
Doc fixes for any of them come here.

```sh
just check     # npm ci, build, then scripts/check.mjs: links, metadata, llms.txt, sitemap, brand copies
just preview   # serve dist/ at http://127.0.0.1:4330
```

`SITE_URL` sets the public origin (canonical links, sitemap, Open Graph, `llms.txt`); it may
include a path. Local builds fall back to the preview server.

**Checks that need the other repositories.** `scripts/check.mjs` verifies that every
`DEADHOP_*` and `LNADDR_*` setting the docs name exists in the source. It reads the other
deadhop repositories from the parent directory (as they are checked out in the deadhop
workspace) and skips the check when they are not there.

**Brand copies.** `brand/` holds copies from [deadhop/brand](https://github.com/deadhop/brand);
`public/` and `docs/public/` serve some of them, and the check fails if those drift from `brand/`.

## Deploy

`.github/workflows/site.yml` builds, checks and deploys to bunny.net (site `deadhop`) on every
push to `main`. It needs the `BUNNYNET_API_KEY` secret and the `SITE_URL` repository variable
(`https://deadhop.run`). The deploy ID is the commit's short sha, so after changing
`SITE_URL` push a commit. Roll back with `bunny sites deployments publish --previous --force`.

On bunny: `deadhop.run` is a Bunny DNS zone whose apex is a PullZone record for the site,
with a Let's Encrypt certificate and forced HTTPS. An edge rule on the pull zone serves
`*.md` as `text/markdown; charset=utf-8`.

## License

[MIT](LICENSE).
