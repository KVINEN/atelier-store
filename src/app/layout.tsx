import type { Metadata } from "next";
import { Cormorant_Garamond, Geist } from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "Atelier — Luxury fashion, leather goods and jewellery",
    template: "%s | Atelier",
  },
  description:
    "Ready-to-wear, handbags, shoes and jewellery, crafted to last. Complimentary express shipping and returns.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${cormorant.variable} h-full has-[dialog[open]]:overflow-hidden`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
