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
import LiveStockSync from "@/lib/liveStock";
import ScrollState from "@/lib/motion";
import NavProgress from "@/components/NavProgress";
import AnnouncementBar from "@/components/AnnouncementBar";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.anveda.in"),
  // The owner wants the link preview / Google heading to read just "anveda.in".
  // If that is ever not accepted, use "anveda.in - High Quality Glass Bangle Store".
  title: {
    default: SITE.domain,
    template: `%s · ${SITE.domain}`,
  },
  description: SITE.description,
  openGraph: {
    title: SITE.domain,
    description: SITE.description,
    type: "website",
    siteName: SITE.domain,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.domain,
    description: SITE.description,
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

const ORG_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE.name,
  url: "https://www.anveda.in",
  logo: "https://www.anveda.in/opengraph-image.jpg",
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
    <html lang="en">
      <head>
        <BrandFonts />
        {/* eslint-disable-next-line react/no-danger */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSON_LD) }}
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
