import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Plotted — Chess Game Art",
  description: "Turn any chess game into a poster. Paste a PGN, pick a style, download your art.",
  metadataBase: new URL("https://YOUR_DEPLOYED_URL.vercel.app"),
  openGraph: {
    title: "Plotted — Chess Game Art",
    description: "Turn any chess game into a poster. Paste a PGN, pick a style, download your art.",
    url: "https://YOUR_DEPLOYED_URL.vercel.app",
    siteName: "Plotted",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Plotted — chess game visualised as a neon poster",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Plotted — Chess Game Art",
    description: "Turn any chess game into a poster. Paste a PGN, pick a style, download your art.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
