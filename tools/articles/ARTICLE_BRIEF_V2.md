# Brief v2: deep, verified guides for importfromchina.shop

Read ARTICLE_BRIEF.md in the same folder first. Everything in it still applies (service rules, fact sheet, call format, no em dashes, no prices from us, single items only, NEVER claim we inspect/test/open/photograph items, one price paid once before shipping, fee stated upfront). This brief raises the bar and overrides length and link rules.

## Quality bar
- 1,400 to 2,200 words of body text. Depth over padding: every section must teach something specific.
- 8 to 12 H2 sections, phrased as the questions people actually type.
- At least one comparison or reference table. Where it fits, one numbered step-by-step section and one "Common mistakes" section.
- Exactly 6 FAQs.
- Quick answer: 60 to 90 words, directly answers the title.
- Concrete specifics beat generic advice: model numbers, exact menu names, real settings, real compatibility constraints.
- Write like a knowledgeable person in Pakistan explaining to a friend. Plain, specific, no hype words ("ultimate", "seamless", "game-changer", "unlock", "elevate", "dive into", "navigate the world of").

## Verification (mandatory)
- Every factual claim about a product, platform, law, fee structure or process must come from a page you actually opened in this task with WebFetch or found via WebSearch. Prefer official sources: brand sites, FBR / Pakistan Customs, PTA, DRAP, platform help centres.
- If you cannot verify something, leave it out or clearly hedge it ("at the time of writing", "check the current rule").
- Never state a tax rate, PTA amount, or price for a specific product.
- End the body with:
  <h2>Sources</h2><ul><li><a href="https://...">Short source name</a></li>...</ul>
  3 to 6 sources you actually opened. External links are allowed ONLY in this Sources list.

## First-hand angle (only these facts)
We recently sourced one TDH39/DD45-type audiometric headset from a verified Alibaba supplier and delivered it in Pakistan. You may mention it where relevant. Do not invent any other orders, customers, cities, timings or quotes.

## Internal links
3 to 5 internal links per article, to /blog/<slug> from the ALLOWED SLUGS list in ARTICLE_BRIEF.md, to slugs in your own batch, or to /products/ . Product buying guides must link to /products/ .

## Product buying guides (if your task includes them)
Title pattern: "How to Get the <Product> in Pakistan" (or very close). Cover: what it is and who it suits; verified key specs; which variant/version to pick and why (colours, connectors, regional versions, bundles to avoid); compatibility in Pakistan (voltage/plugs if relevant, apps and region locks, cars or devices it works with); whether it is on Daraz (say only "not listed on Daraz when we checked in October 2026" if you verify that yourself again, otherwise say nothing about Daraz); realistic alternatives already sold in Pakistan; how importing one works with us (link required, one price, pay once, 7-15 days, no bulk); what to check when it arrives. Category: "Buying Guides".

## Output
Python file of article() calls exactly as in articles2.py, then a SEO_EXTRA dict (Google title <= 60 chars keyword-first, meta <= 155 chars) for every slug. Run the parse check from ARTICLE_BRIEF.md before replying. Reply with the slug list and anything you could not verify.
