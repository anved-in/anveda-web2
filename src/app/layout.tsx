import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import TabBar from "@/components/TabBar";
import Reveal from "@/components/Reveal";
import BrandFonts from "@/components/BrandFonts";
import FavDrawer from "@/components/FavDrawer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { CartProvider } from "@/lib/cart";
import { FavProvider } from "@/lib/favourites";
import { SITE, HAS_WHATSAPP } from "@/lib/site";
import { HOME_TITLE, HOME_DESCRIPTION } from "@/lib/seo";
import LiveStockSync from "@/lib/liveStock";
import ScrollState from "@/lib/motion";
import NavProgress from "@/components/NavProgress";
import AnnouncementBar from "@/components/AnnouncementBar";

// Search engines show the title as the blue headline, so it carries what people actually type ("glass bangles online")
// before the brand. The domain stays in every title, as the owner wanted. See SEO-PLAN.md.
export const metadata: Metadata = {
  metadataBase: new URL("https://www.anveda.in"),
  title: {
    default: HOME_TITLE,
    template: `%s | ${SITE.domain}`,
  },
  description: HOME_DESCRIPTION,
  // One address per page: "./" is each page's own address. Stops Google treating anveda.in and www.anveda.in (or a ?c=colour link) as copies.
  alternates: { canonical: "./" },
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    type: "website",
    siteName: SITE.name,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
  },
  appleWebApp: {
    title: SITE.name,
    statusBarStyle: "default",
  },
  icons: {
    // An explicit `icons` object replaces Next's automatic file-convention
    // detection entirely, icon.svg must be listed here too, or it silently
    // stops being used the moment `apple` is added (found 2026-09-30: the
    // browser tab fell back to no icon at all once this object existed).
    icon: "/icon.svg",
    apple: "/apple-touch-icon.png",
  },
};

// Tells Google (and AI assistants) who ANVEDA is, in plain facts. The brand name sits close to "Aveda" and the Ayurveda
// companies, so the alternate names and the "bangles" description help it be recognised as a bangle shop.
const WEBSITE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://www.anveda.in/#website",
  name: SITE.name,
  alternateName: [SITE.domain, "ANVEDA bangles"],
  url: "https://www.anveda.in/",
  inLanguage: "en-IN",
};

const ORG_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://www.anveda.in/#organization",
  name: SITE.name,
  alternateName: [SITE.domain, "ANVEDA bangles"],
  url: "https://www.anveda.in",
  logo: "https://www.anveda.in/apple-touch-icon.png",
  image: "https://www.anveda.in/opengraph-image.jpg",
  description: "ANVEDA is an Indian online shop for handpicked glass bangles: pastel, jelly, stone-set, kada, layering and kids bangles, sold in small batches and delivered across India.",
  address: { "@type": "PostalAddress", addressRegion: "Karnataka", addressCountry: "IN" },
  areaServed: { "@type": "Country", name: "India" },
  sameAs: [SITE.instagram],
  contactPoint: {
    "@type": "ContactPoint",
    ...(HAS_WHATSAPP ? { telephone: `+${SITE.whatsapp}` } : {}),
    contactType: "customer service",
    email: SITE.email,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // data-scroll-behavior: the page scrolls smoothly (globals.css), and Next needs to be told so it can switch that off for the
    // jump to the top when you move to another page. Without it, tapping Ornate while scrolled down in Glass stayed scrolled down.
    <html lang="en-IN" data-scroll-behavior="smooth">
      <head>
        <BrandFonts />
        {/* eslint-disable-next-line react/no-danger */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSON_LD) }}
        />
        {/* eslint-disable-next-line react/no-danger */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSON_LD) }}
        />
      </head>
      <body className="flex min-h-screen flex-col pb-[60px] md:pb-0">
        <CartProvider>
          <FavProvider>
          <Reveal />
          <LiveStockSync />
          <ScrollState />
          <NavProgress />
          <div className="site-head sticky top-0 z-50">
          <AnnouncementBar />
          <Header />
          </div>
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
          <FavDrawer />
          <TabBar />
          {HAS_WHATSAPP && <WhatsAppFloat />}
          </FavProvider>
        </CartProvider>
      </body>
    </html>
  );
}
