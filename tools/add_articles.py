#!/usr/bin/env python3
"""Add guides to the blog using an existing published guide as the page template.

Usage: python3 tools/add_articles.py [--replace] batch1.py [batch2.py ...]
  --replace  re-render guides whose slug already exists (same URL) and refresh their index card
Each batch file contains article(...) calls and a SEO_EXTRA dict:
  article(slug, title, description, minutes, answer, body_html, faqs, category, emoji)
  SEO_EXTRA = {slug: (google_title, meta_description)}

Writes blog/<slug>.html for each new guide, adds cards to blog/index.html,
refreshes the category chips, and appends URLs to sitemap.xml.
Existing guides are never modified. A slug that already exists is skipped.
"""
import sys, os, re, json, html, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLOG = os.path.join(ROOT, "blog")
SITE = "https://importfromchina.shop"
TEMPLATE = os.path.join(BLOG, "customs-duty-china-to-pakistan.html")
TODAY = datetime.date.today()

def slugify(t):
    return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")[:60]

def add_ids(body):
    toc = []
    def rep(m):
        text = re.sub("<[^>]+>", "", m.group(1))
        hid = slugify(text)
        toc.append((hid, text))
        return f'<h2 id="{hid}">{m.group(1)}</h2>'
    return re.sub(r"<h2>(.*?)</h2>", rep, body), toc

def load(paths):
    arts, seo = [], {}
    for p in paths:
        ns = {"article": lambda *a: arts.append(dict(zip(
            ["slug", "title", "description", "minutes", "answer", "body", "faqs", "category", "emoji"], a)))}
        exec(open(p).read(), ns)
        seo.update(ns.get("SEO_EXTRA", {}))
    return arts, seo

def existing_posts():
    idx = open(os.path.join(BLOG, "index.html")).read()
    return re.findall(r'<a class="post" href="/blog/([a-z0-9-]+)" data-cat="([^"]*)"[^>]*>.*?<h2>(.*?)</h2>.*?<small>.*?(\d+) min read</small></a>', idx, re.S)

def jsonld(a, url, seo_title, seo_desc):
    logo = {"@type": "ImageObject", "url": SITE + "/assets/logo-mark-512.png"}
    data = [
        {"@context": "https://schema.org", "@type": "Article", "headline": a["title"], "description": seo_desc,
         "datePublished": TODAY.isoformat(), "dateModified": TODAY.isoformat(), "inLanguage": "en", "mainEntityOfPage": url,
         "author": {"@type": "Person", "name": "Muhammad Shamshad Aslam", "url": SITE + "/about/", "worksFor": {"@type": "Organization", "name": "importfromchina.shop", "url": SITE}},
         "publisher": {"@type": "Organization", "name": "importfromchina.shop", "url": SITE, "logo": logo},
         "image": SITE + "/assets/og-image.png", "about": ["Importing from China to Pakistan", a["category"]]},
        {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": x}} for q, x in a["faqs"]]},
        {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": "Blog", "item": SITE + "/blog/"},
            {"@type": "ListItem", "position": 3, "name": a["title"], "item": url}]},
    ]
    return "\n".join('<script type="application/ld+json">' + json.dumps(d, ensure_ascii=False) + "</script>" for d in data)

def render(a, seo, related, tpl):
    url = f"{SITE}/blog/{a['slug']}"
    st, sd = seo.get(a["slug"], (a["title"], a["description"]))
    body, toc = add_ids(a["body"])
    body = re.sub(r'<a href="(https?://[^"]+)"', r'<a href="\1" target="_blank" rel="noopener"', body)
    s = tpl
    def swap(pattern, repl, flags=re.S):
        nonlocal s
        new, n = re.subn(pattern, lambda m: repl, s, count=1, flags=flags)
        if n != 1: raise SystemExit(f"template marker not found: {pattern[:60]}")
        s = new
    e = html.escape
    swap(r"<title>.*?</title>", f"<title>{e(st)}</title>")
    swap(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{e(sd)}">')
    swap(r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="{url}">')
    swap(r'<meta property="og:title" content="[^"]*">', f'<meta property="og:title" content="{e(st)}">')
    swap(r'<meta property="og:description" content="[^"]*">', f'<meta property="og:description" content="{e(sd)}">')
    swap(r'<meta property="og:url" content="[^"]*">', f'<meta property="og:url" content="{url}">')
    s = re.sub(r'<script type="application/ld\+json">.*?</script>\n?', "", s, flags=re.S)
    s = s.replace('<link rel="stylesheet" href="/blog/blog.css">', '<link rel="stylesheet" href="/blog/blog.css">\n' + jsonld(a, url, st, sd), 1)
    swap(r'(<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/blog/">Blog</a> › ).*?(</nav>)', None) if False else None
    s = re.sub(r'(<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/blog/">Blog</a> › ).*?(</nav>)', lambda m: m.group(1) + e(a["category"]) + m.group(2), s, count=1)
    s = re.sub(r'(<div class="hero">\s*<span class="cat">).*?(</span>\s*<h1>).*?(</h1>)', lambda m: m.group(1) + e(a["category"]) + m.group(2) + e(a["title"]) + m.group(3), s, count=1, flags=re.S)
    s = re.sub(r"Updated <b>.*?</b>", "Updated <b>" + TODAY.strftime("%B %-d, %Y") + "</b>", s, count=1)
    s = re.sub(r"<b>\d+ min</b> read", f"<b>{a['minutes']} min</b> read", s, count=1)
    s = re.sub(r'(<div class="answer"><b>Quick answer</b><p>).*?(</p></div>)', lambda m: m.group(1) + e(a["answer"]) + m.group(2), s, count=1, flags=re.S)
    s = re.sub(r'(<div class="answer">.*?</div>)\s*.*?(\s*<section class="faq">)', lambda m: m.group(1) + "\n      " + body + "\n      " + m.group(2).strip(), s, count=1, flags=re.S)
    faqs = "".join(f"<details><summary>{e(q)}</summary><p>{e(x)}</p></details>" for q, x in a["faqs"])
    s = re.sub(r'(<h2 id="faq">Frequently asked questions</h2>).*?(</section>)', lambda m: m.group(1) + faqs + m.group(2), s, count=1, flags=re.S)
    cards = "".join(f'<a class="card" href="/blog/{sl}"><span class="e">{em}</span><b>{e(t)}</b><small>{mi} min read</small></a>' for sl, t, mi, em in related)
    s = re.sub(r'(<div class="cards">).*?(</div>\s*</section>)', lambda m: m.group(1) + cards + m.group(2), s, count=1, flags=re.S)
    toc_html = "".join(f'<a href="#{i}">{e(t)}</a>' for i, t in toc) + '<a href="#faq">Frequently asked questions</a>'
    s = re.sub(r'(<nav class="toc">).*?(</nav>)', lambda m: m.group(1) + toc_html + m.group(2), s, count=1, flags=re.S)
    return s

def main(paths, replace=False):
    tpl = open(TEMPLATE).read()
    arts, seo = load(paths)
    have = {f[:-5] for f in os.listdir(BLOG) if f.endswith(".html") and f != "index.html"}
    new = [a for a in arts if a["slug"] not in have]
    upd = [a for a in arts if a["slug"] in have] if replace else []
    skipped = [] if replace else [a["slug"] for a in arts if a["slug"] in have]
    old = existing_posts()
    old_meta = {sl: (html.unescape(t), int(mi)) for sl, cat, t, mi in old}
    # related: same category among new + old, else anything
    pool_new = [(a["slug"], a["title"], a["minutes"], a["emoji"], a["category"]) for a in new]
    idx = open(os.path.join(BLOG, "index.html")).read()
    old_emoji = dict(re.findall(r'<a class="post" href="/blog/([a-z0-9-]+)"[^>]*><span class="e">(.*?)</span>', idx))
    pool_old = [(sl, html.unescape(t), int(mi), old_emoji.get(sl, "📦"), cat) for sl, cat, t, mi in old]
    for a in new + upd:
        same = [p for p in pool_new + pool_old if p[4] == a["category"] and p[0] != a["slug"]]
        rest = [p for p in pool_new + pool_old if p[0] != a["slug"] and p not in same]
        rel = [(p[0], p[1], p[2], p[3]) for p in (same + rest)[:3]]
        open(os.path.join(BLOG, a["slug"] + ".html"), "w").write(render(a, seo, rel, tpl))
    # blog index: append cards, rebuild chips
    cards = "".join(
        f'<a class="post" href="/blog/{a["slug"]}" data-cat="{html.escape(a["category"])}" data-text="{html.escape((a["title"] + " " + a["description"]).lower())}"><span class="e">{a["emoji"]}</span><h2>{html.escape(a["title"])}</h2><p>{html.escape(a["description"])}</p><small>{html.escape(a["category"])} · {a["minutes"]} min read</small></a>'
        for a in new)
    idx = re.sub(r'(<div class="list">.*?)(</div>\s*<p class="empty")', lambda m: m.group(1) + cards + m.group(2), idx, count=1, flags=re.S)
    for a in upd:
        card = f'<a class="post" href="/blog/{a["slug"]}" data-cat="{html.escape(a["category"])}" data-text="{html.escape((a["title"] + " " + a["description"]).lower())}"><span class="e">{a["emoji"]}</span><h2>{html.escape(a["title"])}</h2><p>{html.escape(a["description"])}</p><small>{html.escape(a["category"])} · {a["minutes"]} min read</small></a>'
        idx, n = re.subn(r'<a class="post" href="/blog/' + re.escape(a["slug"]) + r'".*?</a>', lambda m: card, idx, count=1, flags=re.S)
        if n != 1: raise SystemExit("index card not found for " + a["slug"])
    cats_all = re.findall(r'<a class="post" href="/blog/[a-z0-9-]+" data-cat="([^"]*)"', idx)
    order = []
    for c in cats_all:
        if c not in order: order.append(c)
    chips = f'<button class="on" data-cat="">All ({len(cats_all)})</button>' + "".join(
        f'<button data-cat="{c}">{c} ({cats_all.count(c)})</button>' for c in order)
    idx = re.sub(r'(<div class="filters">).*?(<input type="search")', lambda m: m.group(1) + chips + m.group(2), idx, count=1, flags=re.S)
    open(os.path.join(BLOG, "index.html"), "w").write(idx)
    # sitemap
    sm_path = os.path.join(ROOT, "sitemap.xml"); sm = open(sm_path).read()
    add = "".join(f"  <url><loc>{SITE}/blog/{a['slug']}</loc><lastmod>{TODAY.isoformat()}</lastmod><priority>0.9</priority></url>\n" for a in new if f"/blog/{a['slug']}<" not in sm)
    sm = sm.replace("</urlset>", add + "</urlset>")
    for a in upd:
        sm = re.sub(r"(<loc>" + re.escape(f"{SITE}/blog/{a['slug']}") + r"</loc><lastmod>)[^<]*", lambda m: m.group(1) + TODAY.isoformat(), sm)
    open(sm_path, "w").write(sm)
    print(f"added {len(new)} guides; replaced {len(upd)}; skipped existing: {skipped}; blog total {len(cats_all)}; sitemap urls {sm.count('<loc>')}")

if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if a != "--replace"]
    if not args: raise SystemExit(__doc__)
    main(args, replace="--replace" in sys.argv)
