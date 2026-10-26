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
  <div class="card full"><h2>Latest activity</h2>${table(["Time (PKT)", "What", "Page", "Source", "Where", "Device"],
    recent.map((r) => `<tr><td>${time(r.ts)}</td><td>${r.event === "quote" ? '<b style="color:var(--green)">Get a price</b>' : "Viewed"}</td><td><span class="path">${esc(r.path)}</span></td><td>${esc(r.source)}</td><td>${esc([r.city, r.country].filter(Boolean).join(", "))}</td><td>${esc(r.device)}</td></tr>`))}</div>
</div>
<p class="muted" style="margin-top:18px;font-size:13px">Visitors are counted once per day per browser. No IP addresses are stored. Your own visits are not counted once you've opened this page on a browser.</p>
</div></body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "set-cookie": "ifc_admin=1; Path=/; Max-Age=31536000; SameSite=Lax; Secure" } });
}
