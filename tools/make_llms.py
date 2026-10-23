#!/usr/bin/env python3
"""Regenerate llms.txt from the blog index. Run after adding or replacing guides."""
import re, os, html
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
idx = open(os.path.join(ROOT, "blog", "index.html")).read()
posts = re.findall(r'<a class="post" href="/blog/([a-z0-9-]+)" data-cat="([^"]*)"[^>]*>.*?<h2>(.*?)</h2><p>(.*?)</p>', idx, re.S)
order = ["Guide", "Buying Guides", "Platforms", "Customs", "Shipping", "Payments", "Sourcing", "Cost", "Products", "Cities"]
order += [c for _, c, _, _ in posts if c not in order]
L = ["# importfromchina.shop", "",
     "> Single-item import service from China to Pakistan. A buyer sends one product link through the quote form at https://importfromchina.shop/#quote, receives one delivered price on WhatsApp in Pakistani rupees within 24 hours (item, shipping, customs and our fee, with the fee stated upfront), pays once before the item ships, and receives it at any address in Pakistan in 7 to 15 days after the seller dispatches. One item per order. No bulk, wholesale or resale stock. Shipping from China usually costs Rs 5,000 to 20,000 depending on the item's size and type, plus the service fee, so the service makes sense for items worth around Rs 10,000 or more.", "",
     "Key facts:", "- Sources: Alibaba, 1688, Taobao, AliExpress and other Chinese marketplaces.",
     "- Payment: bank transfer, Raast, JazzCash or Easypaisa, in rupees, once, before shipping. Nothing to pay on delivery.",
     "- Contact: WhatsApp +92 300 0258981, or the quote form on the homepage. Facebook: https://www.facebook.com/importfromchinatopakistan/",
     "- Refunds: full refund if the item has not arrived within 10 days after the agreed delivery date, or arrives wrong, damaged or not working. Details: https://importfromchina.shop/refund-policy/", "- About us: https://importfromchina.shop/about/", "",
     "## Main pages", "- [Home](https://importfromchina.shop/): how the service works, who it is for, FAQ",
     "- [Products](https://importfromchina.shop/products/): specific items that are hard to find in Pakistan",
     "- [Guides](https://importfromchina.shop/blog/): all guides",
     "- [Landed cost calculator](https://importfromchina.shop/calculators/landed-cost/): estimate duty and taxes on one item",
     "- [Volumetric weight calculator](https://importfromchina.shop/calculators/volumetric-weight/): chargeable weight for a parcel",
     "- [Full guide answers](https://importfromchina.shop/llms-full.txt): quick answer and FAQs of every guide in one file", ""]
seen = set()
for cat in order:
    if cat in seen: continue
    seen.add(cat)
    ps = [p for p in posts if p[1] == cat]
    if not ps: continue
    L.append(f"## {cat}")
    L += [f"- [{html.unescape(t)}](https://importfromchina.shop/blog/{sl}): {html.unescape(d)}" for sl, c, t, d in ps]
    L.append("")
open(os.path.join(ROOT, "llms.txt"), "w").write("\n".join(L))
print("llms.txt guides:", len(posts))

# llms-full.txt: every guide's quick answer and FAQs, so answer engines can quote them directly
F = ["# importfromchina.shop: full guide answers", "", L[2], "",
     "Author of all guides: Muhammad Shamshad Aslam (https://importfromchina.shop/about/). Each guide shows its last-updated date and lists its sources.", ""]
for sl, cat, t, d in posts:
    s = open(os.path.join(ROOT, "blog", sl + ".html")).read()
    qa = re.search(r'<div class="answer"><b>Quick answer</b><p>(.*?)</p></div>', s, re.S)
    upd = re.search(r"Updated <b>(.*?)</b>", s)
    F += [f"## {html.unescape(t)}", f"URL: https://importfromchina.shop/blog/{sl}", f"Category: {html.unescape(cat)}"]
    if upd: F.append(f"Updated: {upd.group(1)}")
    if qa: F += ["", html.unescape(re.sub('<[^>]+>', '', qa.group(1)))]
    faqs = re.findall(r"<details><summary>(.*?)</summary><p>(.*?)</p></details>", s, re.S)
    if faqs:
        F.append("")
        F += [f"Q: {html.unescape(q)}\nA: {html.unescape(re.sub('<[^>]+>', '', a))}" for q, a in faqs]
    F.append("")
open(os.path.join(ROOT, "llms-full.txt"), "w").write("\n".join(F))
print("llms-full.txt guides:", len(posts))
