# importfromchina.shop

Landing page for a China-to-Pakistan product sourcing service.

Single static file: `index.html` (no build step, no dependencies).

## Setup

The WhatsApp number used by every button on the site is set in `site.js`:

```js
const WHATSAPP_NUMBER = "923000258981"; // country code + number, digits only
```

Every WhatsApp button on the page uses this value.

## Deploy on Cloudflare Pages

1. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git.
2. Pick this repo, branch `main`.
3. Framework preset: **None**. Build command: leave empty. Build output directory: `/`.
4. Save and deploy, then add `importfromchina.shop` under Custom domains.
