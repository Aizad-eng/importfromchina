// Redirect www to the main domain (301) and the old /quote/ page to the homepage form,
// record visits sent by site.js (/api/hit), serve the password-protected /admin panel,
// then serve the static site.
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.hostname === "www.importfromchina.shop") {
      url.hostname = "importfromchina.shop";
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }
    // The old separate quote page now lives on the homepage form.
    if (url.pathname === "/quote" || url.pathname === "/quote/") return Response.redirect("https://importfromchina.shop/#quote", 301);
    if (url.pathname === "/api/hit" && request.method === "POST") {
      const text = await request.text();   // read the body now; it is gone once the response is sent
      ctx.waitUntil(recordHit(request, env, text).catch((e) => console.log("hit failed", e && e.message)));
      return new Response(null, { status: 204 });
    }
    if (url.pathname === "/api/subscribe" && request.method === "POST") return subscribe(request, env, ctx);
    if (url.pathname === "/api/unsubscribe") return unsubscribe(url, env);
    if (url.pathname === "/api/order" && request.method === "POST") return order(request, env, ctx);
    if (url.pathname === "/admin" || url.pathname === "/admin/") return admin(request, env, url);
    return env.ASSETS.fetch(request);
  },
};

/* ---------- recording ---------- */
const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|whatsapp|monitor|curl|python|wget/i;
const SOURCES = [
  [/chatgpt\.com|chat\.openai\.com|openai/, "ChatGPT"], [/perplexity/, "Perplexity"], [/gemini\.google/, "Gemini"],
  [/copilot\.microsoft|bing\.com\/chat/, "Copilot"], [/claude\.ai/, "Claude"], [/google\./, "Google"], [/bing\.com/, "Bing"],
  [/duckduckgo/, "DuckDuckGo"], [/yahoo\./, "Yahoo"], [/yandex/, "Yandex"],
  [/facebook\.com|fb\.com|fb\.me|messenger/, "Facebook"], [/instagram\.com/, "Instagram"], [/tiktok/, "TikTok"],
  [/youtube|youtu\.be/, "YouTube"], [/reddit/, "Reddit"], [/(^|\.)t\.co$|twitter|x\.com/, "X"], [/linkedin|lnkd/, "LinkedIn"],
  [/quora/, "Quora"], [/pakwheels/, "PakWheels"], [/wa\.me|whatsapp/, "WhatsApp"], [/tally\.so/, "Tally"],
];
function classify(refHost, utm) {
  const s = (utm || "").toLowerCase();
  if (s) { for (const [re, name] of SOURCES) if (re.test(s) || s === name.toLowerCase() || s === "ig" && name === "Instagram" || s === "fb" && name === "Facebook") return name; return s.slice(0, 40); }
  if (!refHost) return "Direct";
  if (refHost.endsWith("importfromchina.shop")) return "Internal";
  for (const [re, name] of SOURCES) if (re.test(refHost)) return name;
  return refHost.replace(/^www\./, "");
}
async function recordHit(request, env, text) {
  const ua = request.headers.get("user-agent") || "";
  if (BOT.test(ua)) return;
  let body = null;
  try { body = JSON.parse(text); } catch (e) {}
  if (!body || typeof body.p !== "string") return;
  let refHost = "";
  try { refHost = body.r ? new URL(body.r).hostname : ""; } catch (e) {}
  const q = new URLSearchParams(typeof body.q === "string" ? body.q : "");
  const utm = (k) => (q.get(k) || "").slice(0, 80) || null;
  const now = Date.now(), day = pkDay(now);
  const ip = request.headers.get("cf-connecting-ip") || "";
  const visitor = await sha(`${ip}|${ua}|${day}|ifc`);
  const cf = request.cf || {};
  const device = /iPad|Tablet/i.test(ua) ? "Tablet" : /Mobi|Android|iPhone/i.test(ua) ? "Mobile" : "Desktop";
  const event = body.e === "quote" ? "quote" : "view";
  await env.DB.prepare(
    "INSERT INTO hits (ts, day, event, path, source, ref_host, utm_source, utm_medium, utm_campaign, country, city, device, visitor) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)"
  ).bind(now, day, event, body.p.slice(0, 200), classify(refHost, utm("utm_source")), refHost.slice(0, 120) || null,
    utm("utm_source"), utm("utm_medium"), utm("utm_campaign"), cf.country || null, cf.city || null, device, visitor).run();
}
const pkDay = (ms) => new Date(ms + 5 * 3600e3).toISOString().slice(0, 10);
async function sha(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* ---------- newsletter sign-ups (from the site.js pop-up) ---------- */
const SUBS_TABLE = `CREATE TABLE IF NOT EXISTS subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER NOT NULL, email TEXT NOT NULL UNIQUE,
  path TEXT, country TEXT, city TEXT, device TEXT)`;
const EMAIL_RE = /^[^\s@<>()"',;:]{1,64}@[^\s@<>()"',;:]+\.[a-z]{2,24}$/i;
async function subscribe(request, env, ctx) {
  const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  let body = null;
  try { body = JSON.parse(await request.text()); } catch (e) {}
  if (!body) return json({ ok: false, error: "bad request" }, 400);
  if (body.hp) return json({ ok: true });   // honeypot filled in: a bot, pretend it worked
  const email = String(body.email || "").trim().toLowerCase().slice(0, 254);
  if (!EMAIL_RE.test(email)) return json({ ok: false, error: "Please enter a valid email address." }, 400);
  const ua = request.headers.get("user-agent") || "", cf = request.cf || {};
  const device = /iPad|Tablet/i.test(ua) ? "Tablet" : /Mobi|Android|iPhone/i.test(ua) ? "Mobile" : "Desktop";
  await env.DB.prepare(SUBS_TABLE).run();
  const res = await env.DB.prepare("INSERT OR IGNORE INTO subscribers (ts, email, path, country, city, device) VALUES (?,?,?,?,?,?)")
    .bind(Date.now(), email, String(body.p || "").slice(0, 200) || null, cf.country || null, cf.city || null, device).run();
  const isNew = !!(res && res.meta && res.meta.changes);
  if (env.BREVO_API_KEY) ctx.waitUntil(toBrevo(email, isNew, request, env).catch((e) => console.log("brevo failed", e && e.message)));
  return json({ ok: true });
}

/* ---------- Brevo: add each sign-up to the newsletter list, send the welcome email ---------- */
// Secrets/vars: BREVO_API_KEY (secret), BREVO_LIST_ID (default 6), WELCOME_TEMPLATE_ID (unset = no welcome email).
async function brevo(env, method, path, body) {
  // Brevo sometimes answers 401/403/429/5xx for a few seconds after account changes: retry a few times.
  for (let attempt = 1; ; attempt++) {
    const r = await fetch("https://api.brevo.com/v3" + path, {
      method, headers: { "api-key": env.BREVO_API_KEY, "content-type": "application/json", accept: "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (r.ok || r.status === 204) return r.status === 204 ? null : r.json().catch(() => null);
    const retry = [401, 403, 429].includes(r.status) || r.status >= 500;
    if (!retry || attempt >= 4) throw new Error(`${method} ${path} ${r.status} ${(await r.text()).slice(0, 200)}`);
    await new Promise((res) => setTimeout(res, 1500 * attempt));
  }
}
async function unsubToken(email, env) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${env.ADMIN_KEY}|unsub|${email}`));
  return [...new Uint8Array(buf)].slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function toBrevo(email, isNew, request, env) {
  const list = Number(env.BREVO_LIST_ID || 6);
  await brevo(env, "POST", "/contacts", { email, listIds: [list], updateEnabled: true });
  if (!isNew || !env.WELCOME_TEMPLATE_ID) return;
  const unsub = `https://importfromchina.shop/api/unsubscribe?e=${encodeURIComponent(email)}&t=${await unsubToken(email, env)}`;
  await brevo(env, "POST", "/smtp/email", { templateId: Number(env.WELCOME_TEMPLATE_ID), to: [{ email }], params: { unsub },
    sender: { name: "Shamshad from importfromchina.shop", email: "hello@importfromchina.shop" },
    headers: { "List-Unsubscribe": `<${unsub}>` } });
}
async function unsubscribe(url, env) {
  const page = (msg) => new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribe</title><body style="font-family:system-ui,sans-serif;max-width:520px;margin:15vh auto;padding:0 20px;color:#17181c;line-height:1.5"><h1 style="font-size:22px">${msg}</h1><p><a href="/" style="color:#0f6b3a">Back to importfromchina.shop</a></p></body>`, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
  const email = String(url.searchParams.get("e") || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || url.searchParams.get("t") !== (await unsubToken(email, env))) return page("This unsubscribe link is not valid.");
  if (env.BREVO_API_KEY) await brevo(env, "PUT", "/contacts/" + encodeURIComponent(email), { emailBlacklisted: true }).catch((e) => console.log("unsub failed", e && e.message));
  await env.DB.prepare("DELETE FROM subscribers WHERE email = ?").bind(email).run().catch(() => {});
  return page("You are unsubscribed. You won't get the weekly email any more.");
}

/* ---------- in-stock orders (from the /in-stock/ page) ---------- */
// Items we already hold in Pakistan. The page posts the item id and the buyer's details; we save the order,
// email the owner (secret ORDER_NOTIFY_EMAIL, via Brevo) and confirm with the buyer on WhatsApp by hand.
const IN_STOCK = { "press-on-nails-black-flowers": { name: "Press-on nails, black with flower print", price: 2000 } };
const ORDERS_TABLE = `CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER NOT NULL, item TEXT NOT NULL, price INTEGER NOT NULL,
  name TEXT NOT NULL, phone TEXT NOT NULL, city TEXT NOT NULL, address TEXT NOT NULL, note TEXT,
  country TEXT, device TEXT)`;
async function order(request, env, ctx) {
  const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  let b = null;
  try { b = JSON.parse(await request.text()); } catch (e) {}
  if (!b) return json({ ok: false, error: "Something went wrong. Please try again." }, 400);
  if (b.hp) return json({ ok: true });   // honeypot filled in: a bot
  const item = IN_STOCK[String(b.item || "")];
  if (!item) return json({ ok: false, error: "This item is no longer listed." }, 400);
  const clean = (v, n) => String(v || "").replace(/\s+/g, " ").trim().slice(0, n);
  const name = clean(b.name, 80), city = clean(b.city, 60), address = clean(b.address, 300), note = clean(b.note, 300);
  const phone = String(b.phone || "").replace(/[^\d+]/g, "").replace(/^(\+92|0092|92)/, "0");
  if (!name) return json({ ok: false, error: "Please enter your name." }, 400);
  if (!/^03\d{9}$/.test(phone)) return json({ ok: false, error: "Please enter a WhatsApp number like 03xx xxxxxxx." }, 400);
  if (!city) return json({ ok: false, error: "Please enter your city." }, 400);
  if (address.length < 8) return json({ ok: false, error: "Please enter your full delivery address." }, 400);
  const ua = request.headers.get("user-agent") || "", cf = request.cf || {};
  const device = /iPad|Tablet/i.test(ua) ? "Tablet" : /Mobi|Android|iPhone/i.test(ua) ? "Mobile" : "Desktop";
  await env.DB.prepare(ORDERS_TABLE).run();
  await env.DB.prepare("INSERT INTO orders (ts, item, price, name, phone, city, address, note, country, device) VALUES (?,?,?,?,?,?,?,?,?,?)")
    .bind(Date.now(), item.name, item.price, name, phone, city, address, note || null, cf.country || null, device).run();
  if (env.BREVO_API_KEY && env.ORDER_NOTIFY_EMAIL) {
    const rows = [["Item", item.name], ["Price", "Rs " + item.price.toLocaleString("en-US") + " delivered"], ["Name", name], ["WhatsApp", phone], ["City", city], ["Address", address], ["Note", note || "-"]];
    ctx.waitUntil(brevo(env, "POST", "/smtp/email", {
      sender: { name: "importfromchina.shop orders", email: "hello@importfromchina.shop" },
      to: [{ email: env.ORDER_NOTIFY_EMAIL }],
      subject: `New order: ${item.name} (${city})`,
      htmlContent: `<p>New in-stock order on importfromchina.shop:</p><table>${rows.map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#6d707a">${k}</td><td style="padding:4px 0"><b>${esc(v)}</b></td></tr>`).join("")}</table><p>WhatsApp them to confirm: <a href="https://wa.me/92${phone.slice(1)}">wa.me/92${phone.slice(1)}</a></p>`,
    }).catch((e) => console.log("order email failed", e && e.message)));
  }
  return json({ ok: true });
}

/* ---------- admin panel ---------- */
// Login: open /admin?key=YOUR_KEY once. That sets a year-long cookie on this browser,
// so after that plain /admin just works. No key and no cookie = page looks like it doesn't exist.
async function adminToken(env) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${env.ADMIN_KEY}|ifc-admin`));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function authorised(request, env) {
  if (!env.ADMIN_KEY) return false;
  const m = (request.headers.get("cookie") || "").match(/(?:^|;\s*)ifc_admin_auth=([a-f0-9]{64})/);
  return !!m && m[1] === (await adminToken(env));
}
const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const COUNTRY = (c) => { try { return new Intl.DisplayNames(["en"], { type: "region" }).of(c); } catch (e) { return c; } };

async function admin(request, env, url) {
  const key = url.searchParams.get("key");
  if (key && env.ADMIN_KEY && key === env.ADMIN_KEY) {
    return new Response(null, { status: 302, headers: {
      location: "/admin",
      "set-cookie": `ifc_admin_auth=${await adminToken(env)}; Path=/admin; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`,
      "cache-control": "no-store" } });
  }
  if (!(await authorised(request, env))) return new Response("Not found", { status: 404, headers: { "cache-control": "no-store" } });
  await env.DB.prepare(SUBS_TABLE).run();
  if (url.searchParams.get("export") === "subscribers") {
    const rows = await env.DB.prepare("SELECT ts, email, path, country, city, device FROM subscribers ORDER BY ts").all().then((r) => r.results);
    const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = ["signed_up_pkt,email,page,country,city,device"].concat(rows.map((r) =>
      [new Date(r.ts + 5 * 3600e3).toISOString().slice(0, 16).replace("T", " "), r.email, r.path, r.country, r.city, r.device].map(cell).join(","))).join("\n");
    return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="newsletter-subscribers.csv"', "cache-control": "no-store" } });
  }
  await env.DB.prepare(ORDERS_TABLE).run();
  const orders = await env.DB.prepare("SELECT ts, item, price, name, phone, city, address, note FROM orders ORDER BY ts DESC LIMIT 50").all().then((r) => r.results);
  const subsTotal = (await env.DB.prepare("SELECT COUNT(*) n FROM subscribers").first())?.n || 0;
  const subs = await env.DB.prepare("SELECT ts, email, path, country, city FROM subscribers ORDER BY ts DESC LIMIT 50").all().then((r) => r.results);
  const days = Math.min(Math.max(parseInt(url.searchParams.get("days") || "7", 10) || 7, 1), 90);
  const from = pkDay(Date.now() - (days - 1) * 864e5);
  const q = (sql, ...b) => env.DB.prepare(sql).bind(from, ...b).all().then((r) => r.results);
  const [tot] = await q("SELECT COUNT(DISTINCT visitor) v, SUM(event='view') pv, SUM(event='quote') qc FROM hits WHERE day >= ?");
  const sources = await q("SELECT source, COUNT(DISTINCT visitor) v, COUNT(*) n FROM hits WHERE day >= ? AND event='view' AND source <> 'Internal' GROUP BY source ORDER BY v DESC LIMIT 20");
  const quoteBySource = await q(`SELECT s.source, COUNT(DISTINCT h.visitor) n FROM hits h
    JOIN (SELECT visitor, day, MIN(ts) t FROM hits WHERE day >= ? AND event='view' AND source <> 'Internal' GROUP BY visitor, day) f ON f.visitor=h.visitor AND f.day=h.day
    JOIN hits s ON s.visitor=f.visitor AND s.ts=f.t
    WHERE h.event='quote' GROUP BY s.source`);
  const qmap = Object.fromEntries(quoteBySource.map((r) => [r.source, r.n]));
  const campaigns = await q(`SELECT s.utm_campaign c, s.source, COUNT(DISTINCT s.visitor) v,
      COUNT(DISTINCT CASE WHEN h.event='quote' THEN h.visitor END) qc
    FROM (SELECT visitor, day, MIN(ts) t FROM hits WHERE day >= ? AND event='view' AND utm_campaign IS NOT NULL GROUP BY visitor, day) f
    JOIN hits s ON s.visitor=f.visitor AND s.ts=f.t
    LEFT JOIN hits h ON h.visitor=f.visitor AND h.day=f.day AND h.event='quote'
    GROUP BY s.utm_campaign, s.source ORDER BY v DESC LIMIT 30`);
  const pages = await q("SELECT path, COUNT(*) n, COUNT(DISTINCT visitor) v FROM hits WHERE day >= ? AND event='view' GROUP BY path ORDER BY n DESC LIMIT 20");
  const landings = await q("SELECT path, source, COUNT(*) n FROM hits WHERE day >= ? AND event='view' AND source <> 'Internal' GROUP BY path, source ORDER BY n DESC LIMIT 15");
  const countries = await q("SELECT country, COUNT(DISTINCT visitor) v FROM hits WHERE day >= ? GROUP BY country ORDER BY v DESC LIMIT 10");
  const devices = await q("SELECT device, COUNT(DISTINCT visitor) v FROM hits WHERE day >= ? GROUP BY device ORDER BY v DESC");
  const daily = await q("SELECT day, COUNT(DISTINCT visitor) v, SUM(event='quote') qc FROM hits WHERE day >= ? GROUP BY day ORDER BY day");
  const recent = await env.DB.prepare("SELECT ts, event, path, source, country, city, device FROM hits ORDER BY ts DESC LIMIT 40").all().then((r) => r.results);

  const maxDay = Math.max(1, ...daily.map((d) => d.v));
  const time = (ms) => new Date(ms + 5 * 3600e3).toISOString().slice(5, 16).replace("T", " ");
  const table = (head, rows) => `<table><thead><tr>${head.map((h) => h.includes('class="num"') ? `<th class="num">${h.replace(/<\/?span[^>]*>/g, "")}</th>` : `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.length ? rows.join("") : `<tr><td colspan="${head.length}" class="muted">No data yet</td></tr>`}</tbody></table>`;
  const tabs = [1, 7, 30, 90].map((d) => `<a href="?days=${d}" class="${d === days ? "on" : ""}">${d === 1 ? "Today" : d + " days"}</a>`).join("");

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Visitors | importfromchina admin</title>
<style>
:root{--bg:#faf8f3;--card:#fff;--ink:#17181c;--ink2:#3d4047;--ink3:#6d707a;--line:#e3dfd5;--green:#0f6b3a;--greenSoft:#e7f2ec;--red:#c8102e}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.45 Inter,system-ui,-apple-system,sans-serif}
.wrap{max-width:1100px;margin:0 auto;padding:24px 16px 60px}
h1{font-size:22px;margin:0}h2{font-size:16px;margin:0 0 12px}
.top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:20px}
.tabs a{display:inline-block;padding:7px 14px;border-radius:999px;color:var(--ink2);text-decoration:none;border:1px solid var(--line);background:#fff;margin-left:6px;font-size:14px}
.tabs a.on{background:var(--ink);color:#fff;border-color:var(--ink)}
.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px}
.kpi{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px}
.kpi b{display:block;font-size:30px;letter-spacing:-.02em}.kpi span{color:var(--ink3);font-size:13px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px;overflow-x:auto}
.full{grid-column:1/-1}
table{width:100%;border-collapse:collapse;font-size:14px}th,td{text-align:left;padding:8px 6px;border-bottom:1px solid var(--line);white-space:nowrap}
th{color:var(--ink3);font-weight:600;font-size:12px}td.num,th.num{text-align:right}
tr:last-child td{border-bottom:0}.muted{color:var(--ink3)}
.src{display:inline-block;padding:2px 8px;border-radius:999px;background:var(--greenSoft);color:var(--green);font-size:12px;font-weight:600}
.src.Direct{background:#f1eee6;color:var(--ink2)}
.bars{display:flex;align-items:flex-end;gap:4px;height:120px;padding-top:8px}
.bars div{flex:1;background:var(--green);border-radius:4px 4px 0 0;min-height:2px;position:relative}
.bars div i{position:absolute;bottom:-20px;left:50%;transform:translateX(-50%);font-style:normal;font-size:10px;color:var(--ink3)}
.bars-wrap{padding-bottom:22px}
.path{max-width:340px;overflow:hidden;text-overflow:ellipsis;display:inline-block;vertical-align:bottom}
@media(max-width:760px){.grid{grid-template-columns:1fr}.kpis{grid-template-columns:1fr 1fr 1fr}.kpi b{font-size:22px}.tabs a{margin:4px 4px 0 0}}
</style></head><body><div class="wrap">
<div class="top"><h1>Visitors</h1><div class="tabs">${tabs}</div></div>
<div class="kpis">
  <div class="kpi"><b>${tot?.v || 0}</b><span>Visitors</span></div>
  <div class="kpi"><b>${tot?.pv || 0}</b><span>Page views</span></div>
  <div class="kpi"><b>${tot?.qc || 0}</b><span>Clicked "Get a price"</span></div>
</div>
<div class="grid">
  <div class="card full"><h2>In-stock orders <span class="muted" style="font-weight:500">(${orders.length})</span></h2>${table(["Ordered (PKT)", "Item", "Name", "WhatsApp", "City", "Address", "Note"],
    orders.map((r) => `<tr><td>${time(r.ts)}</td><td>${esc(r.item)}</td><td><b>${esc(r.name)}</b></td><td><a href="https://wa.me/92${esc(r.phone.slice(1))}" style="color:var(--green);font-weight:600">${esc(r.phone)}</a></td><td>${esc(r.city)}</td><td style="white-space:normal;min-width:220px">${esc(r.address)}</td><td style="white-space:normal">${esc(r.note || "")}</td></tr>`))}</div>
  <div class="card full"><h2>Visitors per day</h2><div class="bars-wrap"><div class="bars">${daily.map((d) => `<div style="height:${Math.round((d.v / maxDay) * 100)}%" title="${d.day}: ${d.v} visitors, ${d.qc} quote clicks"><i>${d.day.slice(8)}</i></div>`).join("") || '<span class="muted">No data yet</span>'}</div></div></div>
  <div class="card"><h2>Where visitors came from</h2>${table(["Source", '<span class="num">Visitors</span>', '<span class="num">Got a price</span>'],
    sources.map((r) => `<tr><td><span class="src ${esc(r.source)}">${esc(r.source)}</span></td><td class="num">${r.v}</td><td class="num">${qmap[r.source] || 0}</td></tr>`))}</div>
  <div class="card full"><h2>Influencers and campaigns</h2>${table(["Link name", "Source", '<span class="num">Visitors</span>', '<span class="num">Got a price</span>'],
    campaigns.map((r) => `<tr><td><b>${esc(r.c)}</b></td><td>${esc(r.source)}</td><td class="num">${r.v}</td><td class="num">${r.qc}</td></tr>`))}
    <p class="muted" style="font-size:13px;margin:12px 0 0">Give each influencer their own link: <code>https://importfromchina.shop/?utm_source=instagram&amp;utm_campaign=NAME</code> (replace NAME with theirs, no spaces). Their visitors show up here.</p></div>
  <div class="card"><h2>Landing pages by source</h2>${table(["Page", "Source", '<span class="num">Visits</span>'],
    landings.map((r) => `<tr><td><span class="path">${esc(r.path)}</span></td><td>${esc(r.source)}</td><td class="num">${r.n}</td></tr>`))}</div>
  <div class="card"><h2>Top pages</h2>${table(["Page", '<span class="num">Views</span>', '<span class="num">Visitors</span>'],
    pages.map((r) => `<tr><td><span class="path">${esc(r.path)}</span></td><td class="num">${r.n}</td><td class="num">${r.v}</td></tr>`))}</div>
  <div class="card"><h2>Countries and devices</h2>${table(["Country", '<span class="num">Visitors</span>'],
    countries.map((r) => `<tr><td>${esc(r.country ? COUNTRY(r.country) : "Unknown")}</td><td class="num">${r.v}</td></tr>`))}
    <div style="height:14px"></div>${table(["Device", '<span class="num">Visitors</span>'], devices.map((r) => `<tr><td>${esc(r.device)}</td><td class="num">${r.v}</td></tr>`))}</div>
  <div class="card full"><h2>Newsletter sign-ups <span class="muted" style="font-weight:500">(${subsTotal} total)</span></h2>${table(["Signed up (PKT)", "Email", "Page", "Where"],
    subs.map((r) => `<tr><td>${time(r.ts)}</td><td><b>${esc(r.email)}</b></td><td><span class="path">${esc(r.path || "")}</span></td><td>${esc([r.city, r.country].filter(Boolean).join(", "))}</td></tr>`))}
    <p style="margin:12px 0 0"><a href="?export=subscribers" style="color:var(--green);font-weight:600">Download all as CSV</a></p></div>
  <div class="card full"><h2>Latest activity</h2>${table(["Time (PKT)", "What", "Page", "Source", "Where", "Device"],
    recent.map((r) => `<tr><td>${time(r.ts)}</td><td>${r.event === "quote" ? '<b style="color:var(--green)">Get a price</b>' : "Viewed"}</td><td><span class="path">${esc(r.path)}</span></td><td>${esc(r.source)}</td><td>${esc([r.city, r.country].filter(Boolean).join(", "))}</td><td>${esc(r.device)}</td></tr>`))}</div>
</div>
<p class="muted" style="margin-top:18px;font-size:13px">Visitors are counted once per day per browser. No IP addresses are stored. Your own visits are not counted once you've opened this page on a browser.</p>
</div></body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "set-cookie": "ifc_admin=1; Path=/; Max-Age=31536000; SameSite=Lax; Secure" } });
}
