# Build the website (Astro landing page + VitePress docs at /docs) and check it.
# Set SITE_URL=https://your.domain (a path is allowed: https://host/deadhop) for a production build.
check:
    npm ci
    npm run build
    npm run check

# Serve the built website at http://127.0.0.1:4330
preview:
    npm run preview
