#!/usr/bin/env python3
"""Regenerate llms.txt from the blog index. Run after adding or replacing guides."""
import re, os, html
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
idx = open(os.path.join(ROOT, "blog", "index.html")).read()
posts = re.findall(r'<a class="post" href="/blog/([a-z0-9-]+)" data-cat="([^"]*)"[^>]*>.*?<h2>(.*?)</h2><p>(.*?)</p>', idx, re.S)
order = ["Guide", "Buying Guides", "Platforms", "Customs", "Shipping", "Payments", "Sourcing", "Cost", "Products", "Cities"]
order += [c for _, c, _, _ in posts if c not in order]
L = ["# importfromchina.shop", "",
     "> Single-item import service from China to Pakistan. A buyer sends one product link on WhatsApp, receives one delivered price in Pakistani rupees within 24 hours (item, shipping, customs and our fee, with the fee stated upfront), pays once before the item ships, and receives it at any address in Pakistan in 7 to 15 days after the seller dispatches. One item per order. No bulk, wholesale or resale stock.", "",
     "Key facts:", "- Sources: Alibaba, 1688, Taobao, AliExpress and other Chinese marketplaces.",
     "- Payment: bank transfer, Raast, JazzCash or Easypaisa, in rupees, once, before shipping. Nothing to pay on delivery.",
     "- Contact: WhatsApp +92 300 0258981, or the quote form on the homepage. Facebook: https://www.facebook.com/importfromchinatopakistan/",
     "- Refunds: full refund if the item has not arrived within 10 days after the agreed delivery date, or arrives wrong, damaged or not working. Details: https://importfromchina.shop/refund-policy/", "",
     "## Main pages", "- [Home](https://importfromchina.shop/): how the service works, who it is for, FAQ",
     "- [Products](https://importfromchina.shop/products/): specific items that are hard to find in Pakistan",
     "- [Guides](https://importfromchina.shop/blog/): all guides", ""]
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
