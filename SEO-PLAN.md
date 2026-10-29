# ANVEDA: search (SEO) and AI-answer (GEO) plan

Written 24 Oct 2026. For the owner first, and for any developer after. Update the "Status" lines as things are done.

## 0. The honest starting point

- **Nobody can promise "number one".** Marketplaces (Meesho, Amazon, Flipkart) fill most results for words like "bangles" and "glass bangles". A 2025 Ahrefs study found only 1.74% of newly published pages reach Google's top 10 within a year (it is a study of pages, not of shops, so treat it as a rough guide). The way a small new shop wins is by being the best answer to **narrower searches** (section 2), not by fighting for "bangles".
- **I cannot see Google's index from here.** I could not confirm whether anveda.in is indexed or how it ranks. Step 1 below (Google Search Console) is how we find out, and it is free. Everything in this plan is based on the site's own code and pages, real Google search suggestions, and Google's published guidance. It is not based on search-volume numbers, because I have no access to a tool that has them.
- **GEO (being named in AI answers)** has little hard evidence behind it. Google's own guidance says AI Overviews and AI Mode need no special files or markup, only pages that are indexed and worth quoting ([Google: AI features and your website](https://developers.google.com/search/docs/appearance/ai-features)). Most "GEO tricks" online come from vendor blogs, and the headline Princeton figures (about 30 to 40% more citations from adding quotes, statistics and sources) are second-hand and unchecked. So the plan below makes ANVEDA easy to find and easy to quote, and does not chase tricks.

## 1. Do this first (you, about 20 minutes)

Use the shop's Google account, anveda.in@gmail.com.

1. **Google Search Console.** Go to search.google.com/search-console, "Add property", choose **Domain**, type `anveda.in`. Google shows a line of text (a TXT record). In Cloudflare (dash.cloudflare.com, pick anveda.in, DNS, Records, Add record): Type `TXT`, Name `@`, Content = the text Google gave you, Save. Go back to Search Console and press Verify.
2. **Sitemap.** In Search Console, left menu "Sitemaps", type `sitemap.xml`, Submit.
3. **Ask Google to look at the home page.** Top search bar, paste `https://www.anveda.in/`, press Enter, then "Request indexing".
4. **Bing.** Go to bing.com/webmasters, "Import from Google Search Console". One click. Bing's results are also used by Copilot and DuckDuckGo.
5. **Instagram bio link:** make sure it says `https://www.anveda.in` (with www).
6. **Weekly, 5 minutes:** Search Console, Performance. Write down total clicks, impressions and the top 10 queries. This is our scoreboard.

Status: not done.

## 2. What people search (real Google suggestions, India, 24 Oct 2026)

These are the phrases Google itself offers while people type. They show what is searched, **not how often**. The "Meesho" word appears in many of them, which tells us price-sensitive shoppers compare there.

| Group | Real phrases people type | Page that should answer it | Fit |
|---|---|---|---|
| Glass bangles (core) | glass bangles, glass bangles for women, glass bangles set, glass bangles set with box, glass bangles set of 12, glass bangles online | Shop / Glass Bangles | Core, very competitive |
| Colour and style | pastel bangles, pastel bangles set, ghungroo bangles set of 12, bangles combo set | Pastel Palette, Gunghroo, Colours | Good, narrower |
| Matching an outfit | bangles for saree, for silk saree, for mysore silk saree, for red saree, for black saree, for pink silk saree, bangles for lehenga | New guide pages (Phase 2) | **Best chance**: shoppers ask "which bangles go with this?" and shops rarely answer |
| Occasion | glass bangles for karwa chauth, red bangles for karwa chauth, bangles for diwali, wedding bangles set | New seasonal guide pages | Good, must be published weeks before each festival |
| Fast delivery and Bengaluru | bangles online same day delivery, bangles online instant delivery, glass bangles online bangalore, handmade bangles in bangalore, bangles shop in bangalore | New Bengaluru delivery page | **Best chance**, only if same-day delivery is real (see decisions) |
| Kids | bangles for kids girls, bangles for baby girl (6 months, 1 year, 2 years, 3 years) | Kids Bangles + a kids guide | Good: parents search by age |
| Size help | (our own Sizing page) | Sizing guide | Good, helpful content |
| Brand | anveda bangles | Home | **Zero suggestions today**: nobody searches the brand yet. The name also sits close to "Aveda" and Ayurveda companies, so "anveda bangles" must be taught to Google |
| Not for us | wholesale, Chickpet, gold bangles, bracelet, silk thread, oxidised, kashmiri | none | We do not sell these. Do not chase them |

## 3. What is wrong today (audit of the live site, 24 Oct 2026)

| Finding | Why it matters | Fixed on the test copy? |
|---|---|---|
| Home page title is only "anveda.in" | The title is the blue headline in Google and the strongest signal. It says nothing about bangles | Yes (Phase 1) |
| No canonical tags; anveda.in and www.anveda.in both answered with a full copy | Google can split what it learns about the shop between two addresses | Yes (canonical tags + redirect) |
| Product and colour pages had no main heading | Weakens what the page is about | Yes (invisible heading, no visual change) |
| All 183 photos on the Shop by colour page had empty descriptions | Lost image-search traffic and accessibility | Yes |
| Sitemap said every page changed "just now" | Google learns to ignore the dates | Yes (dates removed) |
| Checkout, order-confirmed and track pages could be indexed | Private pages should never be in search | Yes |
| Product and category pages have very little text (blurbs of 50 to 70 characters; the Kids Bangle has none) | Google ranks pages that answer a question. Almost no words means almost nothing to rank | No (Phase 2, needs your words) |
| The delivered product page had no product heading, and its main block (name, colours, description) appears to be built in the browser (still to be confirmed with a rendered-page test) | Google can run scripts, but later and less reliably; many AI tools do not | Heading added; the rest is Phase 2 (careful: the phone product page is finalised) |
| Only 1 customer review on the site | Reviews help rankings, trust and AI recommendations | No (Phase 3) |
| Not tested: speed (Google's speed tool was rate-limited today) | Speed is a small ranking factor | Measure in Phase 1 follow-up |

## 4. The plan

### Phase 1: foundations (done on the test copy, waiting for your "go live")
- Home title: `Glass Bangles Online India | Handpicked Sets | anveda.in` (this replaces the plain "anveda.in" you chose earlier, so please confirm).
- Every shelf and product gets a title and description with the words shoppers use, the domain stays in every title.
- Canonical tags, `en-IN` language, one heading per page, photo descriptions on Shop by colour.
- Organization and website details for Google (name variants "ANVEDA", "anveda.in", "ANVEDA bangles"; Karnataka; serves India).
- anveda.in now redirects to www.anveda.in (photos, `/api/` and short links are left alone on purpose).
- Private pages are out of search, robots.txt and the sitemap are tidier.

Status: built and tested on `staging`. Live after "go live".

### Phase 2: content that answers questions (2 to 6 weeks, needs your words and facts)
1. **Shelf introductions** (100 to 200 words each) on Glass, Ornate, Layering, Kids: what it is, who it suits, sizes, care. Status: done and **live on `main`** (`GROUP_CONTENT` in `app/shop/[group]/page.tsx`). Note (29 Oct 2026): `staging` still has the older, shorter `GROUP_SEO`-only version of this file, so the two branches have diverged on this one file; worth syncing staging forward before the next "go live" so nothing regresses.
2. **Product text**: 80 to 150 words per design (materials, finish, how many pieces in a set, what to wear it with). I will draft, you correct the facts.
3. **Outfit guides** (one page each, real photos from your catalog): bangles for silk saree, for mysore silk saree, for red / black / pink sarees, for lehenga.
4. **Colour pages** (`/colours/pink/`, `/colours/green/` ...) generated from the catalog.
5. **Kids guide** by age and size. Status: done, approximate age ranges on `/sizing` (`KIDS_AGE_GUIDE` in `lib/catalog.ts`), framed as a general guide, not exact (owner confirmed: general ranges are fine, not precise).
6. **Bengaluru delivery page**. Status: done, `/bengaluru-delivery` (owner confirmed: same-day delivery is real, only via Porter chosen at checkout, Porter's fee paid by the customer directly to Porter, not included in the ANVEDA order total).
7. **Product page content in the delivered HTML** (heading, price, colours, description), done without changing how the phone product page looks, checked with before and after screenshots.
8. **Google Merchant Center free listings**: free product listings on Google Shopping. India appears in the supported-country lists I found, but I could not read Google's current India page, so confirm eligibility at support.google.com/merchants before we build the feed.
9. **Seasonal pages** (Karwa Chauth, Diwali, weddings): publish one to two months before each festival, and keep the same page every year.

### Phase 3: be talked about (continuous)
- **Reviews:** send the review link to every delivered buyer. Target 20 real reviews in 3 months. Real ones only, no fake stars.
- **Instagram and Pinterest:** every reel and pin links to the exact product page. People search "bangles for saree" visually, so Pinterest boards by outfit are a good fit.
- **Mentions:** answers on Quora and Reddit, wedding and saree blogs, local Bengaluru creators, with a link to the matching guide.
- **Consistent name:** always "ANVEDA" with "glass bangles" next to it, so Google and AI tools learn what the brand is.

### Phase 4: measure and repeat
- Weekly: Search Console clicks, impressions, top queries, pages not indexed.
- Monthly: add 2 to 4 new pages for queries that already show impressions but sit below position 10.
- Quarterly: speed test, broken-link check, update festival pages. Third-party keyword research (RankHero, directional estimate, not Google Keyword Planner) shows "glass bangles" and "glass bangles set" both peak in March, not just around Karwa Chauth/Diwali, so any seasonal content push should also be ready before March, not only before the autumn/winter festivals.
- Keyword notes (RankHero, directional, India-weighted where shown): "glass bangles" (~60,500/mo globally, ~40,500 India, difficulty 28/100) and "glass bangles set" (~5,400/mo, difficulty 20/100) are the easiest high-value phrases and already anchor the Glass shelf copy. "bangles for wedding" (~3,600/mo, difficulty 14/100, peak Oct-Nov) is easy and now used on the Ornate shelf. Plain "bangles" (difficulty 46/100) and "kids bangles" (difficulty 82/100, no reliable volume) are harder to rank for; Kids pages use natural phrasing ("bangles for kids", "kids glass bangles") rather than targeting "kids bangles" directly.

## 5. For AI answers (GEO), what we actually do
1. Be indexed and quotable: all of the above. Google says that is the entry ticket.
2. Put plain facts on pages in sentences that can be quoted: where ANVEDA is, how orders ship (DTDC, days, cost rules), return rules, sizing numbers, what the bangles are made of.
3. Keep the About, Sizing, Shipping and Help pages complete and current (they are the pages assistants quote).
4. Get independent mentions and reviews (Phase 3). AI tools lean on what other sites say.
5. We are not adding `llms.txt`: Google says no special files are needed and I found no evidence that it helps.
6. Leave AI crawlers allowed (they are, in robots.txt).

## 6. Local and geography
- Google Business Profile is **not allowed for online-only businesses** ([Google's rule](https://support.google.com/business/answer/3038177)). If ANVEDA has a place customers visit, or you deliver by hand in an area, it can qualify as a service-area business (address hidden). Tell me if that applies.
- Otherwise, geography comes from the website: the Bengaluru delivery page, Karnataka in the organisation details, and Kannada-speaking shoppers ("bangles in kannada" appears in suggestions, so a small Kannada section on the Help page is worth testing later).

## 7. Decisions needed from you

All five answered by the owner (29 Oct 2026):
1. Keyword title: yes, live since Phase 1.
2. Same-day Bengaluru delivery: real, only when Porter is chosen at checkout; Porter's fee is paid by the customer directly to Porter, never added to the ANVEDA order total. Built as `/bengaluru-delivery`.
3. Kids sizes 1.10 to 2.0: owner asked for general, clearly-approximate age ranges rather than exact ones; built on `/sizing` with that framing.
4. No place customers can visit, online-only; no Google Business Profile (see section 6).
5. Yes, guide pages may use catalog photos and adapt Instagram caption wording.

## 8. Keep in mind
- Do not leave maintenance mode on for long. The maintenance page tells Google "temporarily unavailable", which is fine for hours, but a long outage can make Google drop pages.
- Every title on the site is built in one place (`src/app/layout.tsx` and each page's metadata). Product and shelf titles come from the catalog, so new designs get a good title automatically.
- Do not add fake reviews, fake ratings or hidden keyword text. It risks a penalty and the shop has a rule against it.
