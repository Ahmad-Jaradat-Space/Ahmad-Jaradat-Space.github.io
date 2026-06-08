import type { Metadata } from "next";
import { Cinzel, Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

/** Wordmark — wide-tracked engraved gold caps (film title-card feel). */
const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

/** Headlines + metric numerals — light-weight Didone. */
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

/** UI / body. */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ahmad Jaradat — Extracting Signal from Noise",
  description:
    "One mind, four readings. Ahmad Jaradat: VLBI/geodesy scientist, ML & data builder, AI engineer, and football thinker.",
  metadataBase: new URL("https://ahmadjaradat.com"),
  openGraph: {
    title: "Ahmad Jaradat — Extracting Signal from Noise",
    description:
      "One cube, four faces. A systems modeller who turns noise into signal across radio astronomy, machine learning, AI, and football.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${playfair.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
