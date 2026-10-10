import type { Metadata } from "next";
import "@fontsource/newsreader/400.css";
import "@fontsource/newsreader/400-italic.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "./globals.css";
import { LangProvider } from "@/i18n";
import { PosthogProvider } from "../components/PosthogProvider";

export const metadata: Metadata = {
  metadataBase: new URL("https://ttc.canada.nshipyard.com"),
  title: "TTC Delays, One Taxonomy: every delay since 2014 on one chart",
  description:
    "1,240,037 TTC delay incidents (2014-2026) across subway, streetcar, and bus, unified on one cause taxonomy. Versioned editorial crosswalk bridging the 2025 code break, REST API, OpenAPI docs, and MCP tools. Open data, MIT licensed.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "TTC Delays, One Taxonomy",
    description:
      "Is the TTC getting better or worse? 1,240,037 delay incidents (2014-2026) across subway, streetcar, and bus on one comparable taxonomy, bridging the 2025 code break.",
    images: [{ url: "/og-card.png", width: 1200, height: 630, alt: "TTC Delays, One Taxonomy" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TTC Delays, One Taxonomy",
    description:
      "1,240,037 TTC delay incidents (2014-2026) on one cause taxonomy. The crosswalk the TTC never published.",
    images: ["/og-card.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-full flex flex-col"><PosthogProvider>
        <LangProvider>{children}</LangProvider>
      </PosthogProvider></body>
    </html>
  );
}
