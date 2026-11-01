import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "DriveLegal AI — India's driving, transport & traffic-law platform",
  description: "Understand traffic laws, calculate fines, explore permits, access licence services and get sourced legal guidance in your own language. Independent information platform — not a government website.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

const FONT_URL =
  "https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;600&family=Noto+Sans+Tamil:wght@400;600&family=Noto+Sans+Telugu:wght@400;600&family=Noto+Sans+Malayalam:wght@400;600&family=Noto+Sans+Kannada:wght@400;600&family=Noto+Sans+Bengali:wght@400;600&family=Noto+Sans+Gujarati:wght@400;600&family=Noto+Sans+Gurmukhi:wght@400;600&family=Noto+Sans+Oriya:wght@400;600&display=swap";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href={FONT_URL} />
      </head>
      <body>
        <Providers>
          <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-[200] focus:bg-surface focus:p-3">Skip to content</a>
          <Navbar />
          <div id="main">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
