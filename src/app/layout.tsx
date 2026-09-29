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
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.anveda.in"),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    type: "website",
    siteName: SITE.name,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
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
    telephone: `+${SITE.whatsapp}`,
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
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
          <FavDrawer />
          <TabBar />
          <WhatsAppFloat />
          </FavProvider>
        </CartProvider>
      </body>
    </html>
  );
}
