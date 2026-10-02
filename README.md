# importfromchina.shop

Landing page for a China-to-Pakistan product sourcing service.

Single static file: `index.html` (no build step, no dependencies).

## Setup

Open `index.html` and set your WhatsApp number near the bottom of the file:

```js
const WHATSAPP_NUMBER = "92XXXXXXXXXX"; // country code + number, digits only
```

Every WhatsApp button on the page uses this value.

## Deploy on Cloudflare Pages

1. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git.
2. Pick this repo, branch `main`.
3. Framework preset: **None**. Build command: leave empty. Build output directory: `/`.
4. Save and deploy, then add `importfromchina.shop` under Custom domains.
