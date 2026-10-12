(function () {
// Shared config: set your WhatsApp number here (country code + number, digits only)
const WHATSAPP_NUMBER = "923000258981";
const WHATSAPP_MESSAGE = "Hi! I want to import a product from China. Here are the details:";
const waLink = (text) => "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(text);
const waHref = waLink(WHATSAPP_MESSAGE);
document.querySelectorAll(".wa-link").forEach(a => a.href = waHref);
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
/* paste helper */
.paste{right:18px;bottom:88px;width:min(340px,calc(100vw - 36px));padding:16px}
.paste::after{content:"";position:absolute;right:26px;bottom:-8px;width:16px;height:16px;background:#fff;border-right:1px solid #e3dfd5;border-bottom:1px solid #e3dfd5;transform:rotate(45deg)}
.paste .t{font:700 16px/1.3 Sora,Inter,sans-serif;padding-right:30px}
.paste .s{font-size:13px;color:#6d707a;margin-top:4px}
.paste input{width:100%;margin-top:12px;border:1px solid #e3dfd5;border-radius:12px;padding:12px;font:500 14px Inter,system-ui,sans-serif;color:#17181c;background:#faf8f3;outline:none}
.paste input:focus{border-color:#0f6b3a;background:#fff}
.paste .hint{font-size:12.5px;margin-top:8px;line-height:1.4;display:none}
.paste .hint.on{display:block}
.paste .cheap{font-size:12px;line-height:1.4;color:#5c4400;background:#fdf3d6;border-radius:10px;padding:8px 10px;margin:10px 0 2px}
.paste .hint.err{color:#c8102e}
.paste .hint.info{color:#3d4047;background:#fdf3d6;border-radius:10px;padding:8px 10px}
.paste .alt{display:block;text-align:center;margin-top:10px;font-size:13px;color:#0f6b3a;font-weight:600;text-decoration:underline;text-underline-offset:3px}
${reduceMotion ? ".ifc-card{transition:none}" : ""}`;
const style = document.createElement("style"); style.textContent = css; document.head.appendChild(style);

const WA_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.2-.6-.4zM12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2z"/></svg>';
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
const fab = document.querySelector(".fab");

/* ---------- 1. paste-a-link helper, opened by the WhatsApp button ---------- */
let paste = null;
function openPaste() {
  if (!paste) {
    paste = makeCard("paste", `
      <button class="x" aria-label="Close">×</button>
      <div class="t">Get a price for one item</div>
      <div class="s">Paste the product link. You'll get one delivered price in rupees within 24 hours.</div>
      <div class="cheap"><b>Best for items worth Rs 10,000+.</b> Shipping from China usually costs Rs 5,000 to 20,000 plus our fee, which can be more than a cheap item is worth.</div>
      <input type="url" inputmode="url" placeholder="https://… Alibaba, 1688, Taobao, AliExpress" aria-label="Product link">
      <div class="hint"></div>
      <button class="go" type="button">${WA_SVG}Send on WhatsApp</button>
      <a class="alt" href="${waHref}" target="_blank" rel="noopener">Or just chat with us</a>
      <div class="nb">Single items only · No bulk</div>`, "Get a price for one item");
    const input = paste.querySelector("input"), hint = paste.querySelector(".hint"), go = paste.querySelector(".go");
    const showHint = (msg, kind) => { hint.textContent = msg; hint.className = "hint on " + kind; };
    input.addEventListener("input", () => {
      const v = input.value.trim().toLowerCase();
      if (/temu\./.test(v)) showHint("Temu delivers to Pakistan, so check whether it ships this item before you send it to us. If it doesn't, send it anyway.", "info");
      else hint.className = "hint";
    });
    go.addEventListener("click", () => {
      const v = input.value.trim();
      const m = v.match(/https?:\/\/\S+/i) || (/^[\w-]+(\.[\w-]+)+\/\S*/.test(v) ? [v] : null);
      if (!m) { showHint("Please paste the product link. It's the one thing we need to price it.", "err"); input.focus(); return; }
      window.open(waLink("Hi! I'd like a price for this one item, delivered to Pakistan:\n" + m[0]), "_blank", "noopener");
      hide(paste);
    });
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") go.click(); if (e.key === "Escape") hide(paste); });
    paste.querySelector(".x").addEventListener("click", () => hide(paste));
    paste.querySelector(".alt").addEventListener("click", () => hide(paste));
  }
  cards.forEach((c) => c !== paste && hide(c));
  paste.classList.add("show");
  setTimeout(() => paste.querySelector("input").focus(), 50);
}
if (fab) {
  fab.addEventListener("click", (e) => {
    e.preventDefault();
    prompted = true; store.set("ifc_prompted", "1", true);   // they reached out; no more prompts this visit
    const b = fab.querySelector(".badge"); if (b) b.remove();
    if (paste && paste.classList.contains("show")) hide(paste); else openPaste();
  });
}
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && paste) hide(paste); });

/* ---------- 2. guide nudge: appears 60% through a guide, about the guide's product ---------- */
if (isGuide && !dismissedRecently("ifc_nudge_closed")) {
  const h1 = (document.querySelector("h1") || {}).textContent || "";
  const m = h1.match(/How to Get (?:the )?(.+?) in Pakistan/i);
  const product = m ? m[1].trim() : null;
  whenEngaged(() => {
    if (!claimPrompt()) return;
    const title = product ? `Want the ${esc(product)}?` : "Got a product link?";
    const sub = product ? "We bring one to your door in Pakistan. One price, customs included." : "Send it to us and get one delivered price in rupees within 24 hours.";
    const msg = product ? `Hi! I'd like a price for one ${product}, delivered to Pakistan.` : WHATSAPP_MESSAGE;
    const el = makeCard("nudge", `
      <button class="x" aria-label="Close">×</button>
      <div class="k">From this guide</div>
      <div class="t">${title}</div>
      <div class="s">${sub}</div>
      <a class="go" href="${waLink(msg)}" target="_blank" rel="noopener">${WA_SVG}${product ? "Get it priced" : "Send the link"}</a>`, "Get a price");
    el.querySelector(".x").addEventListener("click", () => hide(el, "ifc_nudge_closed"));
    el.querySelector(".go").addEventListener("click", () => hide(el));
    requestAnimationFrame(() => el.classList.add("show"));
  }, { scroll: 0.6, seconds: 0 });
}

/* ---------- 3. chat teaser on other pages: after real engagement, once per visit ---------- */
if (fab && !isGuide && !QUIET_PAGE && !dismissedRecently("ifc_teaser_closed")) {
  const msgs = [
    "Salam! Got a product link from China? Send it here and you'll have a delivered price in rupees within 24 hours.",
    "One price, paid once before shipping. Our fee is in it and you know it upfront. Nothing extra at your door.",
    "Didn't arrive, or arrived not working? Full refund. One item per order, delivered anywhere in Pakistan.",
  ];
  whenEngaged(() => {
    if (!claimPrompt()) return;
    const el = makeCard("teaser", `
      <button class="x" aria-label="Close">×</button>
      <div class="hd"><div class="av"><img src="/assets/logo-mark.svg?v=2" alt=""></div><div><div class="nm">importfromchina.shop</div><div class="st"><i></i>Online · replies within hours</div></div></div>
      <div class="bd"><div class="msg">${esc(msgs[Math.floor(Math.random() * msgs.length)])}</div>
      <button class="go" type="button">${WA_SVG}Paste a link for a price</button>
      <div class="nb">Single items only · No bulk</div></div>`, "Chat with us on WhatsApp");
    const badge = document.createElement("span"); badge.className = "badge"; badge.textContent = "1"; fab.appendChild(badge);
    const close = (remember) => { hide(el, remember ? "ifc_teaser_closed" : null); badge.remove(); };
    el.querySelector(".x").addEventListener("click", () => close(true));
    el.querySelector(".go").addEventListener("click", () => { close(false); openPaste(); });
    requestAnimationFrame(() => el.classList.add("show"));
  }, { scroll: 0.4, seconds: 20 });
}
})();
