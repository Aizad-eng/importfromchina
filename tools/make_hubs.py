#!/usr/bin/env python3
"""Build cluster hub pages from the blog index, then link each guide's category breadcrumb to its hub.

Usage: python3 tools/make_hubs.py
Writes tools/articles/hubs.py, renders it with add_articles.py --replace (hubs are re-rendered every run),
then rewrites the category crumb in every guide to point at its hub.
Run after adding guides, before make_llms.py.
"""
import os, re, html, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLOG = os.path.join(ROOT, "blog")

HUBS = [
    ("pakistan-customs-guides", "Pakistan Customs Guides for Parcels From China", ["Customs", "Glossary"], "Customs", "🛃",
     "Every guide on Pakistan customs for parcels from China: duty and taxes, the Rs 1,000 courier limit, HS codes, valuation, clearance, NTN and personal-use rules.",
     "Pakistan customs for a parcel from China comes down to four things: the item's HS code, its customs value, the duty and taxes for that code, and whether it is a personal or commercial import. Parcels worth Rs 1,000 or less by post or courier are not charged under section 19C. These guides cover each step."),
    ("chinese-marketplaces-guides", "Chinese Shopping Sites From Pakistan: All Marketplace Guides", ["Platforms"], "Platforms", "🛒",
     "Guides to buying from Temu, AliExpress, Shein, Alibaba, 1688, Taobao, Pinduoduo, Xianyu and JD.com from Pakistan: delivery, payment, returns and safety.",
     "Temu, Shein, AliExpress and Alibaba.com deliver to Pakistan directly. Taobao, 1688, Pinduoduo, Xianyu and most of JD.com sell inside China only, so you need someone in China to buy for you. These guides cover each site: delivery times, payment from Pakistan, returns and what to watch for."),
    ("import-by-product-category", "Importing From China by Product: Category and Buying Guides", ["Products", "Buying Guides"], "Products", "📦",
     "Guides to importing one item from China to Pakistan by product: electronics, phones and PTA, drones, medical equipment, parts, hobby gear and specific models.",
     "What you can bring from China, and how, depends on the product. Phones need PTA registration, drones need permission, medical devices may need DRAP approval and loose batteries cannot fly. These guides cover each category, plus buying guides for specific models that are hard to find in Pakistan."),
    ("shipping-and-payment-guides", "Shipping, Cost and Payment Guides: China to Pakistan", ["Shipping", "Cost", "Payments"], "Shipping", "✈️",
     "Shipping times, costs, volumetric weight, tracking and payment from Pakistan to Chinese sellers, collected in one place.",
     "Shipping one item from China to Pakistan usually takes 7 to 15 days by air and costs Rs 5,000 to 20,000 depending on size and type. Paying Chinese sites from Pakistan works with some cards and wallets but not others. These guides cover timing, cost, tracking and payment."),
    ("import-from-china-by-city", "Import From China to Your City in Pakistan", ["Cities"], "Cities", "🏙️",
     "City guides for getting one item from China delivered in Lahore, Karachi, Islamabad, Rawalpindi, Faisalabad, Multan, Peshawar, Quetta and Sialkot.",
     "We deliver single items from China anywhere in Pakistan, usually 7 to 15 days after the seller dispatches. These city guides cover the nearest cargo airports, courier delivery and address tips for each city."),
]

def posts():
    idx = open(os.path.join(BLOG, "index.html")).read()
    return re.findall(r'<a class="post" href="/blog/([a-z0-9-]+)" data-cat="([^"]*)"[^>]*>.*?<h2>(.*?)</h2><p>(.*?)</p>', idx, re.S)

def main():
    ps = posts()
    hub_slugs = {h[0] for h in HUBS}
    out = []
    for slug, title, cats, cat_label, emoji, desc, answer in HUBS:
        body = ""
        if slug in ("pakistan-customs-guides", "shipping-and-payment-guides"):
            body += ('<h2>Is there a calculator?</h2>\n<ul>\n'
                     '<li><a href="/calculators/landed-cost/">Duty and landed cost calculator</a>: estimate customs duty, sales tax and income tax on one item with 2026-27 FBR rates.</li>\n'
                     '<li><a href="/calculators/volumetric-weight/">Volumetric weight calculator</a>: work out the chargeable weight of a parcel for couriers and air cargo.</li>\n</ul>\n')
        for c in cats:
            items = [p for p in ps if p[1] == c and p[0] not in hub_slugs]
            if not items: continue
            heading = {"Buying Guides": "Which specific models have buying guides?", "Glossary": "What do the customs and shipping terms mean?",
                       "Cost": "What does it cost?", "Payments": "How do you pay from Pakistan?", "Shipping": "How long does shipping take, and how is it tracked?",
                       "Customs": "What do I need to know about customs?", "Platforms": "Which Chinese sites can I buy from?",
                       "Products": "What are the rules for each kind of product?", "Cities": "Which cities have a guide?"}.get(c, c)
            body += f"<h2>{heading}</h2>\n<ul>\n" + "".join(
                f'<li><a href="/blog/{sl}">{t}</a>: {d}</li>\n' for sl, _, t, d in items) + "</ul>\n"
        body += ('<h2>Want one item from China priced?</h2>\n<p>Send the product link through <a href="/#quote">our quote form</a>. '
                 "We reply on WhatsApp within 24 hours with one price in rupees that includes shipping, customs and our fee, stated upfront. "
                 "You pay once, before it ships. Single items only, no bulk.</p>\n")
        faqs = [("Where should I start?", answer.split(". ")[0] + "."),
                ("Are these guides kept up to date?", "Each guide shows the date it was last updated and lists the official pages it was checked against. Rates and rules change with Pakistan's budgets, so check the date before relying on a number."),
                ("Do you handle bulk or wholesale orders?", "No. We bring single items for personal or professional use. For bulk or stock, use a cargo company or the commercial import route.")]
        out.append((slug, title, desc, 3, answer, body, faqs, cat_label, emoji))
    path = os.path.join(ROOT, "tools", "articles", "hubs.py")
    with open(path, "w") as f:
        for a in out:
            f.write("article(" + ",\n".join(repr(x) for x in a) + ")\n\n")
        f.write("SEO_EXTRA = {\n" + "".join(f"  {a[0]!r}: ({a[1][:60]!r}, {a[2][:155]!r}),\n" for a in out) + "}\n")
    subprocess.run([sys.executable, os.path.join(ROOT, "tools", "add_articles.py"), "--replace", path], check=True)
    # link category crumbs to hubs
    cat_hub = {}
    for slug, _, cats, *_ in HUBS:
        for c in cats: cat_hub[c] = slug
    n = 0
    for sl, cat, _, _ in posts():
        if sl in hub_slugs or cat not in cat_hub: continue
        f = os.path.join(BLOG, sl + ".html"); s = open(f).read()
        new = re.sub(r'(<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/blog/">Blog</a> › )(?:<a href="/blog/[a-z0-9-]+">)?([^<]*)(?:</a>)?(</nav>)',
                     lambda m: f'{m.group(1)}<a href="/blog/{cat_hub[cat]}">{m.group(2)}</a>{m.group(3)}', s, count=1)
        if new != s: open(f, "w").write(new); n += 1
    print("hubs:", len(out), "crumbs linked:", n)

if __name__ == "__main__":
    main()
