# Brief: guides for importfromchina.shop (single-item import service, China -> Pakistan)

You are writing SEO/AEO guides for Pakistani readers who want ONE item from China. Output is Python source: a series of `article(...)` calls in a file. Nothing else in the file except the SEO_EXTRA dict at the end (no imports, no defs).

## Exact call format (copy precisely)
article(
"slug-in-kebab-case",
"Human Title For The H1",
"Meta description, 140-160 chars, plain, specific.",
9,                      # reading minutes (integer)
"Quick answer paragraph, plain text, no HTML.",
"""
<h2>Question-style heading?</h2>
<p>...</p>
... Use <p>, <ul>/<ol>, <li>, <strong>, <table><thead><tr><th>..</th></tr></thead><tbody><tr><td>..</td></tr></tbody></table>, <a href="/blog/other-slug">anchor</a>. No <h1>, no <h3>, no images, no scripts, no inline styles.
""",
[
 ("FAQ question?", "Answer in 1-3 sentences, plain text, no HTML."),
],
"Category", "emoji")   # Category from the allowed list in your task. Emoji: one unicode emoji.

SEO_EXTRA = {
 "your-slug": ("Google Title Under 60 Chars", "Meta description under 155 chars."),
}

Plain English, short sentences, no em dashes (use commas or full stops), no exclamation marks, no "In conclusion".

## THE SERVICE (first person plural, sparingly: 1-2 mentions per article, usually near the end)
- Single-item import service. One item per order. We do NOT do bulk, wholesale, OEM, resale stock, or "just 30 units". Say this plainly when relevant.
- Flow: customer sends a product link on WhatsApp (link is required) -> within 24 hours we send ONE price in rupees (item + shipping + Pakistan customs + our fee, fee stated upfront) -> customer pays once, before it ships (bank transfer, Raast, JazzCash, Easypaisa) -> we buy from the seller, ship by air, clear customs -> delivered to any address in Pakistan in 7-15 days after the seller dispatches. Nothing to pay on delivery.
- We buy from rated sellers on Alibaba, 1688, Taobao, AliExpress (and can source Temu/Shein-style items from the same Chinese suppliers).
- NEVER claim we inspect, open, test, photograph or video items before shipping. NEVER mention pre-shipment photos or quality checks by us, not even to say we don't do them. (Generic advice that a buyer can ask a SELLER for photos is fine.)
- NEVER itemise our price as product/shipping/customs lines. It is one number.
- Do not invent customer stories, testimonials, order counts, prices we charged.

## FACTS YOU MAY USE (hedge with "typically", "commonly", "at the time of writing")
- Pakistan import taxes: Customs Duty per HS/PCT code (slabs commonly 0%, 3%, 11%, 16%, 20%, higher on some goods); Additional Customs Duty typically 2-7%; Regulatory Duty on some listed goods; Sales Tax 18%; advance income tax around 5.5% for commercial importers. Combined commonly 25-60% of customs value. Rates change with budgets/SROs; tell readers to confirm. Post/courier parcels worth Rs 1,000 or less are duty-free under s.19C (amended 2025; was Rs 5,000). Customs value = CIF. Valuation rulings set minimum values for many goods. No meaningful duty-free threshold for commercial parcels.
- WeBOC / Pakistan Single Window; NTN + STRN + WeBOC registration for commercial import in own name; individuals receive parcels via courier/agent clearance with CNIC.
- CPFTA: reduced/zero customs duty for listed goods with a valid Certificate of Origin; sales tax and income tax still apply.
- Phones: PTA registration (DIRBS); tax depends on model; blocked after a grace period if unpaid. Never state amounts.
- Drones need prior permission; medicines/supplements need DRAP; counterfeits seized; weapons/lookalikes banned; loose lithium batteries/power banks restricted by air; devices with built-in batteries usually fine; aerosols/flammable liquids/perfumes restricted by air.
- Shipping: air express 5-10 days; air freight 7-15 days door to door incl. customs; sea LCL 25-45 days; FCL 20-35 days. Volumetric weight L*W*H(cm)/6000. Ports: Karachi Port, Port Qasim. Airports: Karachi, Lahore, Islamabad.
- Platforms: Alibaba.com (international, English, Trade Assurance, MOQ-1 "Ready to Ship" exists, courier shipping for single pieces is expensive); 1688 (Chinese domestic wholesale, Chinese payment only, ships within China only, typically 20-40% below Alibaba); Taobao (Chinese consumer, Chinese payment, ships within China only); AliExpress (ships to Pakistan for most listings, 25-60 days by post, Pakistani Visa/Mastercard sometimes work with international enabled, PayPak never); Temu DOES deliver to Pakistan (temu.com/pk-en, launched Sep 2024, prices in Rs, free standard shipping, JazzCash/Easypaisa/cards, no cash on delivery, buyer is the importer and pays any extra duty customs assesses); Shein ships to Pakistan through its global site (no local site); DHgate/Banggood shipping to Pakistan unconfirmed, do not name them; PayPal not available in Pakistan; JazzCash/Easypaisa/Raast not accepted on Chinese platforms.
- Chinese New Year closures roughly 2-4 weeks late Jan to mid Feb. 11.11 and 618 sales slow logistics afterwards.
- Pakistan 220-240V 50Hz, plugs C/D; China 220V 50Hz, plugs A/C/I; US-market 110V items need a converter.
- Daraz: local marketplace, 2-7 day delivery, returns policy.

## ALLOWED SLUGS for internal links (existing guides)
how-to-import-from-china-to-pakistan, customs-duty-china-to-pakistan, shipping-from-china-to-pakistan-cost-time, alibaba-vs-1688-pakistan, best-products-to-import-from-china-to-pakistan, how-to-find-reliable-chinese-suppliers, china-sourcing-agent-pakistan, how-to-buy-from-aliexpress-in-pakistan, how-to-buy-from-taobao-in-pakistan, does-temu-deliver-to-pakistan, buy-one-item-from-alibaba-pakistan, how-to-pay-chinese-sellers-from-pakistan, cheapest-way-to-get-one-item-from-china-to-pakistan, what-you-cannot-import-from-china-to-pakistan, daraz-vs-importing-from-china, how-to-buy-from-1688-in-pakistan, alibaba-vs-aliexpress-for-pakistani-buyers, alibaba-trade-assurance-explained-pakistan, how-to-search-taobao-and-1688-by-image, what-is-a-landed-price, import-glossary-china-to-pakistan, is-it-safe-to-order-from-china-to-pakistan, import-timeline-china-to-pakistan-day-by-day, how-to-track-a-parcel-from-china-to-pakistan, customs-clearance-process-pakistan-air-cargo, how-to-find-the-hs-code-for-your-product-pakistan, parcel-stuck-at-customs-pakistan-what-to-do, china-pakistan-free-trade-agreement-cpfta-explained, refunds-and-returns-when-importing-from-china, rmb-to-pkr-how-prices-work-when-importing, import-a-laptop-from-china-to-pakistan, import-a-mobile-phone-from-china-to-pakistan-pta, import-earbuds-smartwatch-wearables-from-china, import-car-and-bike-spare-parts-from-china-to-pakistan, import-kitchen-and-home-appliances-from-china-voltage, import-camera-and-photography-gear-from-china, chinese-brands-worth-buying-from-china
(You may also link to slugs in your own batch, and to /products/.)

## Product facts
For product buying guides, the public product list is at /Users/muhammadshamshadaslam/test_projects/importfromchina/products/products.json (names, verified specs). Source links were not kept, so find the official page again yourself.
