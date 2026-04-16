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
  icons: {
    icon: "/plotted-icon.svg",
    shortcut: "/plotted-icon.svg",
    apple: "/plotted-icon.svg",
  },
  title: "Plotted — Chess Game Art",
  description: "Turn any chess game into a poster. Paste a PGN, pick a style, download your art.",
  metadataBase: new URL("https://plotted-eight.vercel.app"),
  openGraph: {
    title: "Plotted — Chess Game Art",
    description: "Turn any chess game into a poster. Paste a PGN, pick a style, download your art.",
    url: "https://plotted-eight.vercel.app",
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('plotted-theme')||'dark';document.documentElement.classList.add(t);})();`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
