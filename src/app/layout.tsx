import type { Metadata, Viewport } from "next";
import { Outfit, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono-plex",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Pickora — Smart finds, honest prices",
    template: "%s · Pickora",
  },
  description:
    "Hand-picked gadgets, home upgrades and everyday essentials — curated by a real person, checked before they're listed.",
  openGraph: {
    type: "website",
    siteName: "Pickora",
    title: "Pickora — Smart finds, honest prices",
    description:
      "Hand-picked finds, checked before they're listed. Curated by a real person, one click from checkout.",
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1017" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${inter.variable} ${plexMono.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        {/* No-JS visitors must not be trapped behind the intro gate. */}
        <noscript>
          <style>{`#pk-intro-gate{display:none!important}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
