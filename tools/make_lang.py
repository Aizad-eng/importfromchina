#!/usr/bin/env python3
"""Set language, direction and hreflang for Urdu and Roman Urdu guides. Run after add_articles.py.

Usage: python3 tools/make_lang.py
URDU maps each Urdu-script guide to its English pair. ROMAN lists Roman Urdu guides (no pair).
"""
import os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLOG = os.path.join(ROOT, "blog")
SITE = "https://importfromchina.shop/blog/"
URDU = {
    "china-se-saman-kaise-mangwayen-urdu": "how-to-import-from-china-to-pakistan",
    "china-se-customs-duty-urdu": "customs-duty-china-to-pakistan",
    "china-se-shipping-cost-urdu": "cost-to-ship-one-item-from-china-to-pakistan",
}
ROMAN = ["china-se-online-shopping-kaise-karein"]
RTL_CSS = ('<style>html[dir="rtl"] article,html[dir="rtl"] .hero h1,html[dir="rtl"] .answer,html[dir="rtl"] .faq{font-family:"Noto Nastaliq Urdu",Inter,serif;line-height:2.1}'
           'html[dir="rtl"] .hero h1{line-height:1.8}html[dir="rtl"] article table{direction:rtl}'
           'html[dir="rtl"] .answer{border-left:1px solid var(--line);border-right:5px solid var(--gold)}'
           'html[dir="rtl"] ul,html[dir="rtl"] ol{padding-right:1.4em;padding-left:0}</style>')

def edit(slug, fn):
    p = os.path.join(BLOG, slug + ".html")
    if not os.path.exists(p): print("missing", slug); return
    s = open(p).read(); n = fn(s)
    if n != s: open(p, "w").write(n)

def alt_links(ur, en):
    return (f'<link rel="alternate" hreflang="en" href="{SITE}{en}">\n'
            f'<link rel="alternate" hreflang="ur" href="{SITE}{ur}">\n'
            f'<link rel="alternate" hreflang="x-default" href="{SITE}{en}">\n')

def put_alts(s, links):
    s = re.sub(r'<link rel="alternate" hreflang="[^"]*" href="[^"]*">\n', "", s)
    return s.replace('<link rel="canonical"', links + '<link rel="canonical"', 1)

for ur, en in URDU.items():
    def urdu(s, ur=ur, en=en):
        s = re.sub(r'<html lang="[^"]*"( dir="[^"]*")?>', '<html lang="ur" dir="rtl">', s, count=1)
        s = s.replace('"inLanguage": "en"', '"inLanguage": "ur"')
        if "html[dir=\"rtl\"]" not in s:
            s = s.replace("</head>", RTL_CSS + "\n</head>", 1)
        s = s.replace('<div class="answer"><b>Quick answer</b>', '<div class="answer"><b>فوری جواب</b>')
        s = s.replace('>Frequently asked questions<', '>اکثر پوچھے جانے والے سوالات<')
        return put_alts(s, alt_links(ur, en))
    edit(ur, urdu)
    edit(en, lambda s, ur=ur, en=en: put_alts(s, alt_links(ur, en)))
for rs in ROMAN:
    edit(rs, lambda s: re.sub(r'<html lang="[^"]*">', '<html lang="ur-Latn">', s, count=1).replace('"inLanguage": "en"', '"inLanguage": "ur-Latn"'))
print("urdu pairs:", len(URDU), "roman:", len(ROMAN))
