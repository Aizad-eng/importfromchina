// Shared config: set your WhatsApp number here (country code + number, digits only)
const WHATSAPP_NUMBER = "923000258981";
const WHATSAPP_MESSAGE = "Hi! I want to import a product from China. Here are the details:";
const waHref = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(WHATSAPP_MESSAGE);
document.querySelectorAll(".wa-link").forEach(a => a.href = waHref);
const y = document.getElementById("year"); if (y) y.textContent = new Date().getFullYear();

/* ---------- WhatsApp chat teaser next to the floating button ---------- */
(function () {
  const fab = document.querySelector(".fab");
  if (!fab) return;
  const KEY = "ifc_teaser_closed";
  try { const t = +localStorage.getItem(KEY); if (t && Date.now() - t < 7 * 864e5) return; } catch (e) {}

  const css = `
  .fab .badge{position:absolute;top:-3px;right:-3px;min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:#c8102e;color:#fff;font:700 11px/20px Inter,system-ui,sans-serif;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,.25)}
  .teaser{position:fixed;right:18px;bottom:88px;z-index:59;width:min(320px,calc(100vw - 36px));background:#fff;border:1px solid #e6e7ea;border-radius:18px;box-shadow:0 2px 4px rgba(18,20,24,.06),0 24px 48px -16px rgba(18,20,24,.35);font-family:Inter,system-ui,sans-serif;color:#121418;opacity:0;transform:translateY(12px) scale(.98);transition:opacity .35s ease,transform .35s ease;pointer-events:none}
  .teaser.show{opacity:1;transform:none;pointer-events:auto}
  .teaser::after{content:"";position:absolute;right:26px;bottom:-8px;width:16px;height:16px;background:#fff;border-right:1px solid #e6e7ea;border-bottom:1px solid #e6e7ea;transform:rotate(45deg)}
  .teaser .hd{display:flex;align-items:center;gap:10px;padding:12px 40px 10px 14px;border-bottom:1px solid #f0f1f3}
  .teaser .av{width:38px;height:38px;border-radius:50%;background:#121418;display:grid;place-items:center;flex:none}
  .teaser .av img{width:26px;height:26px;display:block}
  .teaser .nm{font:700 14px/1.2 Sora,Inter,sans-serif}
  .teaser .st{font-size:12px;color:#6b7280;display:flex;align-items:center;gap:6px;margin-top:2px}
  .teaser .st i{width:8px;height:8px;border-radius:50%;background:#25D366;box-shadow:0 0 0 3px rgba(37,211,102,.25)}
  .teaser .x{position:absolute;top:8px;right:8px;width:28px;height:28px;border:0;background:#f3f4f6;border-radius:50%;color:#6b7280;font-size:16px;line-height:1;cursor:pointer}
  .teaser .x:hover{background:#e6e7ea;color:#121418}
  .teaser .bd{padding:12px 14px 14px}
  .teaser .msg{background:#f3f4f6;border-radius:12px;border-top-left-radius:4px;padding:10px 12px;font-size:13.5px;line-height:1.45;min-height:42px}
  .teaser .dots{display:inline-flex;gap:4px;align-items:center;height:16px}
  .teaser .dots i{width:6px;height:6px;border-radius:50%;background:#9ca3af;animation:tdot 1.2s infinite}
  .teaser .dots i:nth-child(2){animation-delay:.2s}.teaser .dots i:nth-child(3){animation-delay:.4s}
  @keyframes tdot{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-4px);opacity:1}}
  .teaser .go{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:10px;background:#25D366;color:#fff;border-radius:999px;padding:11px 14px;font-weight:600;font-size:14px;text-decoration:none}
  .teaser .go:hover{background:#1da851}
  .teaser .go svg{width:18px;height:18px}
  .teaser .nb{margin-top:8px;font-size:11.5px;color:#c8102e;font-weight:600;text-align:center}
  @media (prefers-reduced-motion:reduce){.teaser{transition:none}.teaser .dots i{animation:none}}`;
  const style = document.createElement("style"); style.textContent = css; document.head.appendChild(style);

  const msgs = [
    "Salam! Got a product link from China? Send it here and you'll have a delivered price in rupees within 24 hours.",
    "Customs, taxes and shipping are all inside the price we send. Nothing extra to pay at your door.",
    "We only buy from rated sellers on Alibaba, 1688 and Taobao, and you never deal with Chinese payments yourself.",
    "Urdu ya English, jo aasan ho. One item per order, delivered anywhere in Pakistan in 7–15 days."
  ];

  const box = document.createElement("div");
  box.className = "teaser"; box.setAttribute("role", "dialog"); box.setAttribute("aria-label", "Chat with us on WhatsApp");
  box.innerHTML = `
    <button class="x" aria-label="Close">×</button>
    <div class="hd"><div class="av"><img src="/assets/logo-mark.svg?v=2" alt=""></div><div><div class="nm">importfromchina.shop</div><div class="st"><i></i>Online · replies within hours</div></div></div>
    <div class="bd">
      <div class="msg"><span class="dots"><i></i><i></i><i></i></span></div>
      <a class="go" href="${waHref}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.2-.6-.4zM12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2z"/></svg>Send the link on WhatsApp</a>
      <div class="nb">Single items only · No bulk</div>
    </div>`;
  document.body.appendChild(box);

  const badge = document.createElement("span"); badge.className = "badge"; badge.textContent = "1"; fab.appendChild(badge);

  const msgEl = box.querySelector(".msg");
  let i = 0, timer;
  function typeThen(text) {
    msgEl.innerHTML = '<span class="dots"><i></i><i></i><i></i></span>';
    setTimeout(() => { msgEl.textContent = text; }, 1100);
  }
  function cycle() { typeThen(msgs[i % msgs.length]); i++; timer = setTimeout(cycle, 7000); }
  function close(remember) {
    clearTimeout(timer); box.classList.remove("show"); badge.remove();
    if (remember) { try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {} }
    setTimeout(() => box.remove(), 400);
  }
  box.querySelector(".x").addEventListener("click", () => close(true));
  box.querySelector(".go").addEventListener("click", () => close(true));
  fab.addEventListener("click", () => close(true));

  setTimeout(() => { box.classList.add("show"); cycle(); }, 3500);
})();
