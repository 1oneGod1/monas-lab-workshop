import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const siteUrl = process.env.SITE_URL;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: "MONAS LAB — Dari Landmark Jadi 3D",
  description: "Materi workshop interaktif 3D Modeling dan 3D Printing satu jam dengan Blender, Bambu Studio, dan Bambu Lab.",
  openGraph: {
    title: "MONAS LAB — Dari Landmark Jadi 3D",
    description: "Workshop interaktif: amati, modelkan, siapkan, lalu cetak miniatur Monas.",
    type: "website",
    images: siteUrl ? [{ url: new URL("/og.png", siteUrl).toString(), width: 1200, height: 630, alt: "MONAS LAB — Dari Landmark Jadi 3D" }] : undefined,
  },
  twitter: {
    card: "summary_large_image",
    title: "MONAS LAB — Dari Landmark Jadi 3D",
    description: "Workshop interaktif: amati, modelkan, siapkan, lalu cetak miniatur Monas.",
    images: siteUrl ? [new URL("/og.png", siteUrl).toString()] : undefined,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
