 import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
} from "next/font/google";

import "leaflet/dist/leaflet.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    "https://local-legend.com.au",
  ),

  title: {
    default: "Local Legend",
    template: "%s | Local Legend",
  },

  applicationName: "Local Legend",

  description:
    "A mindful local field journal for recording photographs, places and observations while exploring your neighbourhood.",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    url: "https://local-legend.com.au",
    siteName: "Local Legend",
    title: "Local Legend",
    description:
      "A mindful local field journal for recording photographs, places and observations while exploring your neighbourhood.",
  },

  twitter: {
    card: "summary_large_image",
    title: "Local Legend",
    description:
      "A mindful local field journal for recording photographs, places and observations while exploring your neighbourhood.",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  appleWebApp: {
    capable: true,
    title: "Local Legend",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {children}
      </body>
    </html>
  );
}