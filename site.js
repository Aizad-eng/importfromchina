(function () {
// Every contact goes through the quote form on the homepage (#quote).
const ON_HOME = location.pathname === "/" || location.pathname === "/index.html";
const QUOTE = ON_HOME ? "#quote" : "/#quote";
const yearEl = document.getElementById("year"); if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ---------- storage helpers (every access guarded: private mode can throw) ---------- */
const store = {
  get(k, s) { try { return (s ? sessionStorage : localStorage).getItem(k); } catch (e) { return null; } },
  set(k, v, s) { try { (s ? sessionStorage : localStorage).setItem(k, v); } catch (e) {} },
};
const WEEK = 7 * 864e5;
const dismissedRecently = (key) => { const t = +store.get(key); return t && Date.now() - t < WEEK; };

/* ---------- prompt coordinator: at most one prompt per visit, none on policy pages ---------- */
const path = location.pathname;
const QUIET_PAGE = /^\/refund-policy/.test(path);
const isGuide = /^\/blog\/[^/]+/.test(path) && !!document.querySelector("article .answer");
let prompted = store.get("ifc_prompted", true) === "1";
function claimPrompt() { if (prompted || QUIET_PAGE) return false; prompted = true; store.set("ifc_prompted", "1", true); return true; }
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Fire fn once, when the reader scrolls past `scroll` of the page or stays `seconds`, whichever is first.
function whenEngaged(fn, { scroll = 0.4, seconds = 20 } = {}) {
  let done = false, timer = null;
  const fire = () => { if (done) return; done = true; removeEventListener("scroll", onScroll); clearTimeout(timer); fn(); };
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    if (max > 0 && scrollY / max >= scroll) fire();
  };
  addEventListener("scroll", onScroll, { passive: true });
  if (seconds) timer = setTimeout(fire, seconds * 1000);
}

const css = `
.fab{width:auto!important;height:auto!important;border-radius:999px!important;padding:14px 22px!important;display:flex!important;align-items:center;gap:8px;color:#fff!important;font:600 15px/1 Inter,system-ui,sans-serif;text-decoration:none;letter-spacing:-.01em}
.fab::after{border-radius:999px!important}
.fab .badge{position:absolute;top:-3px;right:-3px;min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:#c8102e;color:#fff;font:700 11px/20px Inter,system-ui,sans-serif;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,.25)}
.ifc-card{position:fixed;z-index:59;background:#fff;border:1px solid #e3dfd5;border-radius:18px;box-shadow:0 2px 4px rgba(18,20,24,.06),0 24px 48px -16px rgba(18,20,24,.35);font-family:Inter,system-ui,sans-serif;color:#17181c;opacity:0;transform:translateY(12px);transition:opacity .35s ease,transform .35s ease;pointer-events:none}
.ifc-card.show{opacity:1;transform:none;pointer-events:auto}
.ifc-card .x{position:absolute;top:8px;right:8px;width:28px;height:28px;border:0;background:#f1eee6;border-radius:50%;color:#6d707a;font-size:16px;line-height:1;cursor:pointer}
.ifc-card .x:hover{background:#e3dfd5;color:#17181c}
.ifc-card .go{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:10px;background:#0f6b3a;color:#fff;border:0;border-radius:999px;padding:11px 14px;font:600 14px Inter,system-ui,sans-serif;text-decoration:none;cursor:pointer;width:100%}
.ifc-card .go:hover{background:#0a4d2a}
.ifc-card .go svg{width:18px;height:18px}
.ifc-card .nb{margin-top:8px;font-size:11.5px;color:#c8102e;font-weight:600;text-align:center}
/* teaser */
.teaser{right:18px;bottom:88px;width:min(320px,calc(100vw - 36px))}
.teaser::after{content:"";position:absolute;right:26px;bottom:-8px;width:16px;height:16px;background:#fff;border-right:1px solid #e3dfd5;border-bottom:1px solid #e3dfd5;transform:rotate(45deg)}
.teaser .hd{display:flex;align-items:center;gap:10px;padding:12px 40px 10px 14px;border-bottom:1px solid #f1eee6}
.teaser .av{width:38px;height:38px;border-radius:50%;background:#17181c;display:grid;place-items:center;flex:none}
.teaser .av img{width:26px;height:26px;display:block}
.teaser .nm{font:700 14px/1.2 Sora,Inter,sans-serif}
.teaser .st{font-size:12px;color:#6d707a;display:flex;align-items:center;gap:6px;margin-top:2px}
.teaser .st i{width:8px;height:8px;border-radius:50%;background:#22a35f;box-shadow:0 0 0 3px rgba(34,163,95,.25)}
.teaser .bd{padding:12px 14px 14px}
.teaser .msg{background:#f1eee6;border-radius:12px;border-top-left-radius:4px;padding:10px 12px;font-size:13.5px;line-height:1.45}
/* guide nudge */
.nudge{left:18px;bottom:18px;width:min(340px,calc(100vw - 110px));padding:16px 16px 14px}
.nudge .k{font:700 11px Inter,sans-serif;letter-spacing:.06em;color:#0f6b3a;text-transform:uppercase}
.nudge .t{font:700 16px/1.3 Sora,Inter,sans-serif;margin-top:6px;padding-right:26px}
.nudge .s{font-size:13.5px;color:#3d4047;margin-top:6px;line-height:1.45}
@media (max-width:600px){.nudge{left:12px;right:84px;width:auto;bottom:14px;padding:14px 14px 12px}.nudge .s{display:none}}
/* price check before the quote form */
.gate{position:fixed;inset:0;z-index:80;background:rgba(23,24,28,.55);display:flex;align-items:center;justify-content:center;padding:16px;opacity:0;transition:opacity .25s ease}
.gate.show{opacity:1}
.gate .box{position:relative;background:#fff;border-radius:22px;max-width:420px;width:100%;padding:26px 22px 20px;font-family:Inter,system-ui,sans-serif;color:#17181c;box-shadow:0 30px 60px -20px rgba(0,0,0,.45);text-align:center}
.gate .x{position:absolute;top:10px;right:10px;width:32px;height:32px;border:0;background:#f1eee6;border-radius:50%;color:#6d707a;font-size:18px;cursor:pointer}
.gate .ic{width:52px;height:52px;border-radius:50%;background:#fdf3d6;color:#b08000;display:grid;place-items:center;margin:0 auto 12px;font:800 26px Sora,Inter,sans-serif}
.gate h3{font:800 21px/1.25 Sora,Inter,sans-serif;letter-spacing:-.02em;margin:0 0 10px}
.gate p{font-size:15px;line-height:1.55;color:#3d4047;margin:0 0 8px}
.gate p b{color:#17181c}
.gate .ur{font-family:"Noto Nastaliq Urdu",serif;font-size:16px;line-height:2.1;color:#5c4400;direction:rtl}
.gate .q{font:700 16px/1.35 Sora,Inter,sans-serif;margin:14px 0 12px}
.gate button.b{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;border-radius:999px;padding:13px 16px;font:600 15px Inter,system-ui,sans-serif;cursor:pointer;border:0}
.gate .yes{background:#0f6b3a;color:#fff}.gate .yes:hover{background:#0a4d2a}.gate .yes svg{width:18px;height:18px}
.gate .no{background:#fff;color:#17181c;border:1.5px solid #e3dfd5 !important;margin-top:8px}.gate .no:hover{background:#faf8f3}
.gate .anyway{display:inline-block;margin-top:12px;font-size:13px;color:#6d707a;text-decoration:underline;text-underline-offset:3px;cursor:pointer;background:none;border:0}
@media (max-width:600px){.gate{align-items:flex-end;padding:0}.gate .box{max-width:none;border-radius:22px 22px 0 0;padding-bottom:24px}}
${reduceMotion ? ".ifc-card{transition:none}" : ""}`;
const style = document.createElement("style"); style.textContent = css; document.head.appendChild(style);

const FORM_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 3h6a1 1 0 0 1 1 1v1H8V4a1 1 0 0 1 1-1z"/><path d="M8 4H6a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-2"/><path d="M9 11h6M9 15h4"/></svg>';
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const cards = [];
function makeCard(cls, html, label) {
  const el = document.createElement("div");
  el.className = "ifc-card " + cls; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", label);
  el.innerHTML = html; document.body.appendChild(el); cards.push(el); return el;
}
function hide(el, rememberKey) {
  el.classList.remove("show");
  if (rememberKey) store.set(rememberKey, String(Date.now()));
}

/* ---------- price check: shown once per visit before anyone goes to the quote form ---------- */
let gateEl = null, gateUrl = "", gateLast = null;
const GATE_ASK = `
    <div class="ic">!</div>
    <h3 id="gate-t">Quick check before you ask for a price</h3>
    <p>Shipping one item from China usually costs <b>Rs 5,000 to 20,000</b>, plus our fee. So we're best for items worth <b>Rs 10,000 or more</b>.</p>
    <p class="ur" lang="ur">دس ہزار روپے سے کم کی چیز منگوانا مہنگا پڑے گا</p>
    <div class="q">Is your item worth Rs 10,000 or more?</div>
    <button class="b yes" type="button">${FORM_SVG}Yes, take me to the form</button>
    <button class="b no" type="button">No, it's cheaper</button>`;
const GATE_NO = `
    <div class="ic">i</div>
    <h3 id="gate-t">Then it's better to buy it in Pakistan</h3>
    <p>For an item under Rs 10,000, shipping from China alone would likely cost more than the item itself. Check Daraz or a local market first. You'll almost always pay less.</p>
    <button class="b yes ok" type="button">OK, got it</button>
    <button class="anyway" type="button">Go to the form anyway</button>`;
function closeGate() { if (!gateEl) return; gateEl.classList.remove("show"); const g = gateEl; setTimeout(() => g.remove(), 250); gateEl = null; if (gateLast) gateLast.focus(); }
function goTo(u) {
  if (u.charAt(0) === "#") { const t = document.querySelector(u); if (t) { if (window.__lenis) window.__lenis.scrollTo(t, { offset: -80 }); else t.scrollIntoView({ behavior: "smooth" }); } history.replaceState(null, "", u); }
  else location.href = u;
}
function passGate() { store.set("ifc_gate_ok", "1", true); const u = gateUrl; closeGate(); goTo(u); }
function fillGate(html) {
  const box = gateEl.querySelector(".box");
  box.innerHTML = '<button class="x" type="button" aria-label="Close">×</button>' + html;
  box.querySelector(".x").addEventListener("click", closeGate);
  const yes = box.querySelector(".yes:not(.ok)"), no = box.querySelector(".no"), ok = box.querySelector(".ok"), anyway = box.querySelector(".anyway");
  if (yes) yes.addEventListener("click", passGate);
  if (no) no.addEventListener("click", () => fillGate(GATE_NO));
  if (ok) ok.addEventListener("click", closeGate);
  if (anyway) anyway.addEventListener("click", passGate);
  (yes || ok).focus();
}
function gate(url) {
  if (store.get("ifc_gate_ok", true) === "1") { goTo(url); return; }
  gateUrl = url; gateLast = document.activeElement;
  cards.forEach((c) => hide(c));
  gateEl = document.createElement("div");
  gateEl.className = "gate"; gateEl.setAttribute("role", "dialog"); gateEl.setAttribute("aria-modal", "true"); gateEl.setAttribute("aria-labelledby", "gate-t");
  gateEl.innerHTML = '<div class="box"></div>';
  gateEl.addEventListener("click", (e) => { if (e.target === gateEl) closeGate(); });
  document.body.appendChild(gateEl); fillGate(GATE_ASK);
  requestAnimationFrame(() => gateEl && gateEl.classList.add("show"));
}
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && gateEl) closeGate(); });
// Catch every link to the quote form.
document.addEventListener("click", (e) => {
  const a = e.target.closest && e.target.closest('a.quote-link, a[href="/#quote"], a[href="#quote"]');
  if (!a) return;
  prompted = true; store.set("ifc_prompted", "1", true);   // they're heading to the form; no more prompts this visit
  document.querySelectorAll(".fab .badge").forEach((b) => b.remove());
  if (store.get("ifc_gate_ok", true) === "1") return;
  e.preventDefault(); gate(a.getAttribute("href"));
}, true);

const fab = document.querySelector(".fab");



/* ---------- 2. guide nudge: appears 60% through a guide, about the guide's product ---------- */
if (isGuide && !dismissedRecently("ifc_nudge_closed")) {
  const h1 = (document.querySelector("h1") || {}).textContent || "";
  const m = h1.match(/How to Get (?:the )?(.+?) in Pakistan/i);
  const product = m ? m[1].trim() : null;
  whenEngaged(() => {
    if (!claimPrompt()) return;
    const title = product ? `Want the ${esc(product)}?` : "Got a product link?";
    const sub = product ? "We bring one to your door in Pakistan. One price, customs included." : "Fill in the quote form and get one delivered price in rupees within 24 hours.";
    const el = makeCard("nudge", `
      <button class="x" aria-label="Close">×</button>
      <div class="k">From this guide</div>
      <div class="t">${title}</div>
      <div class="s">${sub}</div>
      <a class="go quote-link" href="${QUOTE}">${FORM_SVG}${product ? "Get it priced" : "Get a price"}</a>`, "Get a price");
    el.querySelector(".x").addEventListener("click", () => hide(el, "ifc_nudge_closed"));
    el.querySelector(".go").addEventListener("click", () => hide(el));
    requestAnimationFrame(() => el.classList.add("show"));
  }, { scroll: 0.6, seconds: 0 });
}

/* ---------- 3. chat teaser on other pages: after real engagement, once per visit ---------- */
if (fab && !isGuide && !QUIET_PAGE && !dismissedRecently("ifc_teaser_closed")) {
  const msgs = [
    "Salam! Got a product link from China? Fill in the quote form and you'll have a delivered price in rupees within 24 hours.",
    "One price, paid once before shipping. Our fee is in it and you know it upfront. Nothing extra at your door.",
    "Didn't arrive, or arrived not working? Full refund. One item per order, delivered anywhere in Pakistan.",
  ];
  whenEngaged(() => {
    if (!claimPrompt()) return;
    const el = makeCard("teaser", `
      <button class="x" aria-label="Close">×</button>
      <div class="hd"><div class="av"><img src="/assets/logo-mark.svg?v=2" alt=""></div><div><div class="nm">importfromchina.shop</div><div class="st"><i></i>Replies within 24 hours</div></div></div>
      <div class="bd"><div class="msg">${esc(msgs[Math.floor(Math.random() * msgs.length)])}</div>
      <a class="go quote-link" href="${QUOTE}">${FORM_SVG}Get a price</a>
      <div class="nb">Single items only · No bulk</div></div>`, "Get a price");
    const badge = document.createElement("span"); badge.className = "badge"; badge.textContent = "1"; fab.appendChild(badge);
    const close = (remember) => { hide(el, remember ? "ifc_teaser_closed" : null); badge.remove(); };
    el.querySelector(".x").addEventListener("click", () => close(true));
    el.querySelector(".go").addEventListener("click", () => close(false));
    requestAnimationFrame(() => el.classList.add("show"));
  }, { scroll: 0.4, seconds: 20 });
}
})();
