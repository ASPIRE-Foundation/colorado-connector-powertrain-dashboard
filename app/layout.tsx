import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const title = "Colorado Connector Powertrain Dashboard";
const description = "Interactive lifecycle cost comparison for Colorado passenger rail powertrain options.";
const imageUrl = "https://aspire-foundation.github.io/colorado-connector-powertrain-dashboard/og.png";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    images: [{ url: imageUrl, width: 1728, height: 907, alt: title }],
  },
  twitter: { card: "summary_large_image", title, description, images: [imageUrl] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
