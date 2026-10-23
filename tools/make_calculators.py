#!/usr/bin/env python3
"""Build /calculators/landed-cost/ and /calculators/volumetric-weight/ from the About page shell.

Usage: python3 tools/make_calculators.py
Rates were checked on 23 Oct 2026 against FBR documents (see SOURCES). Update RATES_CHECKED and the
numbers in the JS below whenever a budget or SRO changes them, then re-run.
"""
import os, re, json, html
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://importfromchina.shop"
RATES_CHECKED = "October 23, 2026"
shell = open(os.path.join(ROOT, "about", "index.html")).read()
head_end = shell.index("</head>")
header = shell[shell.index("<body>"):shell.index('<main class="wrap">')]
footer = shell[shell.index("</main>"):]

CSS = """<style>
.calc{background:var(--bg-2);border:1px solid var(--line);border-radius:22px;padding:24px;margin:8px 0 34px}
.calc .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.calc label{display:block;font-size:14px;font-weight:600;color:var(--ink-2);margin-bottom:6px}
.calc label small{font-weight:500;color:var(--ink-3)}
.calc input,.calc select{width:100%;font:500 16px Inter,system-ui,sans-serif;padding:11px 12px;border:1px solid var(--line);border-radius:12px;background:#fff;color:var(--ink)}
.calc input:focus,.calc select:focus{outline:2px solid var(--green);outline-offset:1px}
.calc .row2{display:grid;grid-template-columns:minmax(0,1fr) 120px;gap:8px}
.calc .full{grid-column:1/-1}
.res{margin-top:22px;background:#fff;border:1px solid var(--line);border-radius:16px;overflow:hidden}
.res table{width:100%;border-collapse:collapse;font-size:15px;margin:0;display:table}
.res td{padding:11px 16px;border-top:1px solid var(--line)}
.res tr:first-child td{border-top:0}
.res td:last-child{text-align:right;font-variant-numeric:tabular-nums;font-weight:600;white-space:nowrap}
.res tr.total td{background:var(--green-soft);font-weight:700;color:var(--green-dark)}
.res tr.big td{font-size:17px}
.note{font-size:13.5px;color:var(--ink-3);margin-top:12px}
.flag{margin-top:14px;padding:12px 16px;border-radius:12px;background:var(--gold-soft);border:1px solid var(--line);font-size:14.5px}
@media(max-width:620px){.calc{padding:18px}.calc .grid{grid-template-columns:minmax(0,1fr)}}
</style>"""

def page(slug, title, seo_title, desc, h1, answer, form, body, faqs, app_desc):
    url = f"{SITE}/calculators/{slug}/"
    h = shell[:head_end]
    e = html.escape
    h = re.sub(r"<title>.*?</title>", f"<title>{e(seo_title)}</title>", h)
    h = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{e(desc)}">', h)
    h = re.sub(r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="{url}">', h)
    h = re.sub(r'<meta property="og:title" content="[^"]*">', f'<meta property="og:title" content="{e(seo_title)}">', h)
    h = re.sub(r'<meta property="og:description" content="[^"]*">', f'<meta property="og:description" content="{e(desc)}">', h)
    h = re.sub(r'<meta property="og:url" content="[^"]*">', f'<meta property="og:url" content="{url}">', h)
    h = re.sub(r'<script type="application/ld\+json">.*?</script>', "", h, flags=re.S)
    h = re.sub(r"<style>.*?</style>", "", h, flags=re.S)
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "WebApplication", "name": title, "url": url, "description": app_desc, "applicationCategory": "FinanceApplication",
         "operatingSystem": "Any", "isAccessibleForFree": True, "inLanguage": "en",
         "author": {"@type": "Person", "name": "Muhammad Shamshad Aslam", "url": SITE + "/about/"},
         "publisher": {"@type": "Organization", "name": "importfromchina.shop", "url": SITE}},
        {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faqs]},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": title, "item": url}]}]}
    h += '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False) + "</script>\n" + CSS + "\n"
    faq_html = "".join(f"<details><summary>{e(q)}</summary><p>{e(a)}</p></details>" for q, a in faqs)
    main = f"""<main class="wrap">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/blog/">Guides</a> › {e(title)}</nav>
  <div class="hero">
    <span class="cat">Calculator</span>
    <h1>{e(h1)}</h1>
    <div class="meta"><span>By <b><a href="/about/" rel="author">Muhammad Shamshad Aslam</a></b></span><span>Rates checked <b>{RATES_CHECKED}</b></span></div>
  </div>
  <div class="layout" style="grid-template-columns:minmax(0,1fr)">
    <article>
      <div class="answer"><b>Quick answer</b><p>{e(answer)}</p></div>
{form}
{body}
      <section class="faq"><h2 id="faq">Frequently asked questions</h2>{faq_html}</section>
      <div class="cta">
        <h2>Rather have one fixed price?</h2>
        <p>Send the product link through our quote form. We reply on WhatsApp within 24 hours with one price in rupees that already includes shipping, customs and our fee, stated upfront. You pay once, before it ships. Single items only.</p>
        <a class="btn btn-wa quote-link" href="/#quote">Get a price</a>
      </div>
    </article>
  </div>
"""
    out = h + "</head>\n" + header + main + footer
    d = os.path.join(ROOT, "calculators", slug); os.makedirs(d, exist_ok=True)
    open(os.path.join(d, "index.html"), "w").write(out)
    return url

# ---------------- Landed cost / duty ----------------
LC_FORM = """      <form class="calc" id="lc" onsubmit="return false">
        <div class="grid">
          <div><label for="price">Item price <small>(what the seller charges)</small></label>
            <div class="row2"><input id="price" type="number" min="0" step="any" value="20000" inputmode="decimal">
            <select id="cur" aria-label="Currency"><option value="PKR">PKR</option><option value="USD">USD</option><option value="CNY">CNY</option></select></div></div>
          <div><label for="rate">Exchange rate to PKR <small>(only for USD or CNY)</small></label>
            <input id="rate" type="number" min="0" step="any" placeholder="Today's NBP rate" inputmode="decimal"></div>
          <div><label for="ship">Shipping to Pakistan, in PKR <small>(plus insurance, if any)</small></label>
            <input id="ship" type="number" min="0" step="any" value="6000" inputmode="decimal"></div>
          <div><label for="cd">Customs duty slab <small>(from the HS code)</small></label>
            <select id="cd"><option value="0">0%</option><option value="5">5%</option><option value="10">10%</option><option value="15">15%</option><option value="20" selected>20%</option><option value="25">25%</option><option value="30">30%</option><option value="35">35%</option></select></div>
          <div><label for="rd">Regulatory duty <small>(listed goods only, 0 to 20%)</small></label>
            <input id="rd" type="number" min="0" max="20" step="any" value="0" inputmode="decimal"></div>
          <div><label for="part">Income tax category <small>(section 148)</small></label>
            <select id="part"><option value="5.5" selected>Most finished goods (5.5%)</option><option value="2">Part II goods (2%)</option><option value="1">Part I goods (1%)</option></select></div>
          <div class="full"><label for="atl">Are you on FBR's Active Taxpayer List?</label>
            <select id="atl"><option value="1">Yes, I am a filer</option><option value="2" selected>No, or not sure (income tax doubles)</option></select></div>
        </div>
        <div class="res" aria-live="polite"><table id="out"></table></div>
        <div class="flag" id="flag" hidden></div>
        <p class="note">Estimate only. Customs can assess a different value under a valuation ruling, and the rate depends on your item's exact HS code. Sales tax is 18%. Additional customs duty is set automatically from the slab under SRO 1063(I)/2026: 0% up to the 15% slab, 2% on the 20% slab, 4% on 25% and above.</p>
      </form>
<script>
(function(){
  var $=function(i){return document.getElementById(i)};
  var f=function(n){return "Rs "+Math.round(n).toLocaleString("en-PK")};
  function acd(cd){return cd>=25?4:(cd>=20?2:0)}
  function calc(){
    var price=+$("price").value||0, cur=$("cur").value, rate=+$("rate").value||0, ship=+$("ship").value||0;
    var cd=+$("cd").value, rd=Math.min(20,Math.max(0,+$("rd").value||0)), it=(+$("part").value)*(+$("atl").value);
    $("rate").disabled=(cur==="PKR");
    var flag=$("flag"); flag.hidden=true;
    if(cur!=="PKR" && !rate){$("out").innerHTML='<tr><td>Enter today\\u2019s exchange rate to see the estimate.</td><td></td></tr>';return}
    var value=(cur==="PKR"?price:price*rate)+ship;
    if(value<=1000){
      $("out").innerHTML='<tr><td>Customs value (item + shipping)</td><td>'+f(value)+'</td></tr><tr class="total big"><td>Duties and taxes</td><td>Rs 0</td></tr>';
      flag.hidden=false; flag.textContent="Parcels sent by post or courier worth Rs 1,000 or less are not charged duties or taxes under section 19C of the Customs Act.";return}
    var a=acd(cd), CD=value*cd/100, ACD=value*a/100, RD=value*rd/100, ST=(value+CD+ACD+RD)*0.18, IT=(value+CD+ACD+RD+ST)*it/100;
    var tax=CD+ACD+RD+ST+IT;
    $("out").innerHTML=
      '<tr><td>Customs value (item + shipping)</td><td>'+f(value)+'</td></tr>'+
      '<tr><td>Customs duty '+cd+'%</td><td>'+f(CD)+'</td></tr>'+
      '<tr><td>Additional customs duty '+a+'%</td><td>'+f(ACD)+'</td></tr>'+
      (rd?'<tr><td>Regulatory duty '+rd+'%</td><td>'+f(RD)+'</td></tr>':'')+
      '<tr><td>Sales tax 18%</td><td>'+f(ST)+'</td></tr>'+
      '<tr><td>Income tax '+it+'%</td><td>'+f(IT)+'</td></tr>'+
      '<tr class="total"><td>Total duties and taxes</td><td>'+f(tax)+'</td></tr>'+
      '<tr class="total big"><td>Item + shipping + taxes</td><td>'+f(value+tax)+'</td></tr>'+
      '<tr><td>Taxes as a share of customs value</td><td>'+(tax/value*100).toFixed(1)+'%</td></tr>';
  }
  ["price","cur","rate","ship","cd","rd","part","atl"].forEach(function(i){$(i).addEventListener("input",calc);$(i).addEventListener("change",calc)});
  calc();
})();
</script>"""

LC_BODY = """      <h2 id="how-it-works">How are duties and taxes worked out on a parcel from China?</h2>
      <p>Customs works out the tax in a fixed order, each step on top of the last. The customs value is the item price plus shipping and insurance to Pakistan (the CIF value), converted to rupees at the exchange rate customs uses that day.</p>
      <ol>
        <li><strong>Customs duty</strong> = customs value × the duty rate for the item's HS code. Since the 2025-26 budget the slabs are 0, 5, 10, 15 and 20%, with some goods higher.</li>
        <li><strong>Additional customs duty</strong> = customs value × 0%, 2% or 4%, depending on the duty slab (SRO 1063(I)/2026, in force from 1 July 2026).</li>
        <li><strong>Regulatory duty</strong> = customs value × the listed rate, only for goods on the regulatory duty list. It is capped at 20% from 1 July 2026.</li>
        <li><strong>Sales tax</strong> = (customs value + all customs duties) × 18%.</li>
        <li><strong>Income tax under section 148</strong> = (customs value + duties + sales tax) × 1%, 2% or 5.5% for filers on the Active Taxpayer List, and double that for non-filers.</li>
      </ol>
      <p>Parcels by post or courier worth Rs 1,000 or less pay nothing under section 19C. Above Rs 1,000 the whole value is taxed, not only the part above the limit.</p>

      <h2 id="examples">What does that look like on real numbers?</h2>
      <p>Three worked examples, using a filer and the most common income tax rate of 5.5%. The rupee figures are examples, not quotes.</p>
      <table><thead><tr><th>Example</th><th>Customs value</th><th>Duty slab</th><th>Duties and taxes</th><th>Share of value</th></tr></thead><tbody>
      <tr><td>Phone case or cable, small parcel</td><td>Rs 900</td><td>Any</td><td>Rs 0 (under Rs 1,000)</td><td>0%</td></tr>
      <tr><td>Machine spare part</td><td>Rs 30,000</td><td>10%, no ACD</td><td>about Rs 11,080</td><td>about 36.9%</td></tr>
      <tr><td>Consumer gadget</td><td>Rs 30,000</td><td>20% + 2% ACD</td><td>about Rs 15,560</td><td>about 51.9%</td></tr>
      </tbody></table>
      <p>For the gadget: duty Rs 6,000, ACD Rs 600, sales tax 18% of Rs 36,600 = Rs 6,588, income tax 5.5% of Rs 43,188 = Rs 2,375. Total about Rs 15,563 for a filer. For a non-filer the income tax line doubles to about Rs 4,751.</p>

      <h2 id="limits">What can this calculator not tell you?</h2>
      <ul>
        <li><strong>Your exact HS code.</strong> The duty slab depends on it. See <a href="/blog/how-to-find-the-hs-code-for-your-product-pakistan">how to find the HS code for your product</a>.</li>
        <li><strong>Valuation rulings.</strong> For many goods customs uses a minimum value instead of your invoice. See <a href="/blog/how-customs-valuation-rulings-work-in-pakistan">how valuation rulings work</a>.</li>
        <li><strong>Retail-price goods.</strong> Some goods in the Sales Tax Act's Third Schedule are taxed on the printed retail price instead.</li>
        <li><strong>Phones.</strong> Phones also need PTA registration, which is a separate charge. See <a href="/blog/import-a-mobile-phone-from-china-to-pakistan-pta">importing a phone and PTA</a>.</li>
        <li><strong>Commercial imports.</strong> Commercial importers pay higher income tax rates and a 3% value addition tax. This calculator is for one item for your own use.</li>
      </ul>
      <p>For the full explanation, read our <a href="/blog/customs-duty-china-to-pakistan">customs duty guide</a> and <a href="/blog/what-is-de-minimis-customs-pakistan">the Rs 1,000 de minimis limit</a>.</p>

      <h2 id="sources">Sources</h2>
      <ul>
        <li><a href="https://download1.fbr.gov.pk/SROs/20266301763307131063-2026.pdf" target="_blank" rel="noopener">FBR: SRO 1063(I)/2026, additional customs duty</a></li>
        <li><a href="https://fbr.gov.pk/Budget2026-27/SalientFeatures/Salient-Feature.pdf" target="_blank" rel="noopener">FBR: Budget 2026-27 salient features (customs)</a></li>
        <li><a href="https://download1.fbr.gov.pk/Docs/202681113864992WithholdingTaxRatesCard2027.pdf" target="_blank" rel="noopener">FBR: withholding tax rate card, tax year 2027</a></li>
        <li><a href="https://download1.fbr.gov.pk/Docs/2025629106147620FInanceAct2025.pdf" target="_blank" rel="noopener">FBR: Finance Act 2025 (section 19C, Rs 1,000)</a></li>
        <li><a href="https://download1.fbr.gov.pk/Docs/202586148252375SalesTaxActupdatedupto2025-26.pdf" target="_blank" rel="noopener">FBR: Sales Tax Act 1990, updated to 2025-26</a></li>
      </ul>"""

LC_FAQS = [
    ("How much customs duty will I pay on a parcel from China?", "It depends on the item's HS code and value. Parcels by post or courier worth Rs 1,000 or less pay nothing. Above that, duties and taxes on a typical consumer item in the 20% slab come to roughly half the customs value for a filer, and less for goods in lower slabs."),
    ("Is shipping included in the customs value?", "Yes. Customs value is the CIF value: the item price plus shipping and insurance to Pakistan, converted to rupees."),
    ("Why does being a filer matter?", "Income tax at import under section 148 is doubled for people who are not on FBR's Active Taxpayer List. The other taxes are the same."),
    ("Is the Rs 1,000 limit applied to the part above Rs 1,000?", "No. If the parcel is worth more than Rs 1,000, duties and taxes apply to its whole value."),
    ("Is this calculator's result what customs will charge?", "It is an estimate. Customs decides the HS code and can use a valuation ruling instead of your invoice price, so the actual amount can differ."),
]

# ---------------- Volumetric weight ----------------
VW_FORM = """      <form class="calc" id="vw" onsubmit="return false">
        <div class="grid">
          <div><label for="L">Length (cm)</label><input id="L" type="number" min="0" step="any" value="40" inputmode="decimal"></div>
          <div><label for="W">Width (cm)</label><input id="W" type="number" min="0" step="any" value="30" inputmode="decimal"></div>
          <div><label for="H">Height (cm)</label><input id="H" type="number" min="0" step="any" value="20" inputmode="decimal"></div>
          <div><label for="kg">Actual weight (kg)</label><input id="kg" type="number" min="0" step="any" value="3" inputmode="decimal"></div>
          <div class="full"><label for="div">Shipping type</label>
            <select id="div"><option value="5000" selected>Express courier, e.g. DHL, FedEx, UPS (divide by 5,000)</option><option value="6000">Air cargo or freight forwarder (divide by 6,000)</option></select></div>
        </div>
        <div class="res" aria-live="polite"><table id="vout"></table></div>
        <p class="note">Chargeable weight is whichever is higher: the actual weight or the volumetric weight. Measure the outer box, not the product.</p>
      </form>
<script>
(function(){
  var $=function(i){return document.getElementById(i)};
  function calc(){
    var L=+$("L").value||0,W=+$("W").value||0,H=+$("H").value||0,kg=+$("kg").value||0,d=+$("div").value;
    var v=L*W*H/d, c=Math.max(v,kg);
    $("vout").innerHTML='<tr><td>Volumetric weight ('+L+' × '+W+' × '+H+' ÷ '+d.toLocaleString("en")+')</td><td>'+v.toFixed(2)+' kg</td></tr>'+
      '<tr><td>Actual weight</td><td>'+kg.toFixed(2)+' kg</td></tr>'+
      '<tr class="total big"><td>Chargeable weight</td><td>'+c.toFixed(2)+' kg</td></tr>'+
      '<tr><td>You are charged for</td><td>'+(v>kg?'size (volumetric)':'actual weight')+'</td></tr>';
  }
  ["L","W","H","kg","div"].forEach(function(i){$(i).addEventListener("input",calc);$(i).addEventListener("change",calc)});
  calc();
})();
</script>"""

VW_BODY = """      <h2 id="formula">What is the volumetric weight formula?</h2>
      <p>Volumetric weight in kg = length × width × height in centimetres ÷ a divisor. DHL Express, FedEx and UPS use 5,000 for international shipments. Air cargo and freight forwarders commonly use 6,000, the IATA standard. The carrier charges whichever is higher, the actual weight or the volumetric weight.</p>

      <h2 id="examples">Worked examples</h2>
      <table><thead><tr><th>Box (cm)</th><th>Actual weight</th><th>Volumetric (÷ 5,000)</th><th>Volumetric (÷ 6,000)</th><th>Charged as (courier)</th></tr></thead><tbody>
      <tr><td>20 × 15 × 10</td><td>1.2 kg</td><td>0.6 kg</td><td>0.5 kg</td><td>1.2 kg (actual)</td></tr>
      <tr><td>40 × 30 × 20</td><td>3 kg</td><td>4.8 kg</td><td>4.0 kg</td><td>4.8 kg (size)</td></tr>
      <tr><td>60 × 50 × 40</td><td>6 kg</td><td>24 kg</td><td>20 kg</td><td>24 kg (size)</td></tr>
      </tbody></table>
      <p>The last row is why a light but bulky item, like a chair or a large lamp, can cost more to ship than it is worth.</p>

      <h2 id="lower">How can you keep the chargeable weight down?</h2>
      <ul>
        <li>Ask the seller to ship in the smallest box that protects the item, without the retail box if the product allows it.</li>
        <li>Choose items that pack small. Parts, tools, gadgets and accessories usually ship on actual weight.</li>
        <li>For one item, a courier price is per parcel, so combining several small items in one box can be cheaper than sending them separately.</li>
      </ul>
      <p>See <a href="/blog/cost-to-ship-one-item-from-china-to-pakistan">how much it costs to ship one item from China</a> and <a href="/blog/what-is-volumetric-weight">what volumetric weight means</a>.</p>

      <h2 id="sources">Sources</h2>
      <ul>
        <li><a href="https://www.dhl.com/discover/en-sg/ship-with-dhl/start-shipping/how-to-calculate-dhl-volumetric-weight" target="_blank" rel="noopener">DHL: how to calculate volumetric weight</a></li>
        <li><a href="https://www.fedex.com/en-ca/resources-tools/dimensional-weight.html" target="_blank" rel="noopener">FedEx: dimensional weight</a></li>
        <li><a href="https://www.ups.com/ca/en/support/shipping-support/shipping-dimensions-weight" target="_blank" rel="noopener">UPS: shipping dimensions and weight</a></li>
        <li><a href="https://www.dhl.com/gb-en/home/global-forwarding/freight-forwarding-education-center/calculating-chargeable-weights.html" target="_blank" rel="noopener">DHL Global Forwarding: chargeable weight</a></li>
      </ul>"""

VW_FAQS = [
    ("What is the divisor for DHL volumetric weight?", "DHL Express divides length × width × height in centimetres by 5,000. FedEx and UPS use 5,000 for international shipments too."),
    ("Why is air cargo divided by 6,000?", "6,000 cubic centimetres per kilogram is the IATA standard used by airlines and freight forwarders. It gives a lower volumetric weight than the 5,000 couriers use."),
    ("Do I pay for actual weight or volumetric weight?", "You pay for the chargeable weight, which is the higher of the two."),
    ("Should I measure the product or the box?", "The box. Carriers measure the outer packaging, including any padding."),
]

u1 = page("landed-cost", "Landed Cost and Duty Calculator", "China to Pakistan Duty Calculator (2026 Rates)",
          "Estimate customs duty, sales tax and income tax on one item from China to Pakistan, with FY 2026-27 FBR rates and the Rs 1,000 courier limit.",
          "China to Pakistan duty and landed cost calculator",
          "Enter the item price, shipping and duty slab to estimate Pakistan customs duty, additional customs duty, regulatory duty, 18% sales tax and section 148 income tax. Parcels by post or courier worth Rs 1,000 or less pay nothing. Rates are from FBR's 2026-27 budget documents, checked " + RATES_CHECKED + ".",
          LC_FORM, LC_BODY, LC_FAQS, "Estimates Pakistan customs duty and taxes on a single item imported from China.")
u2 = page("volumetric-weight", "Volumetric Weight Calculator", "Volumetric Weight Calculator (cm, kg) for Couriers",
          "Work out volumetric and chargeable weight for a parcel from China: divide by 5,000 for DHL, FedEx and UPS, or by 6,000 for air cargo.",
          "Volumetric weight calculator",
          "Volumetric weight is length × width × height in cm divided by 5,000 for express couriers such as DHL, FedEx and UPS, or 6,000 for air cargo. You are charged for whichever is higher, the volumetric weight or the actual weight. Enter your box size and weight below.",
          VW_FORM, VW_BODY, VW_FAQS, "Calculates volumetric and chargeable weight for courier and air cargo shipments.")
print(u1, u2)
