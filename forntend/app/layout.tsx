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
  title: "VERITAS - Advanced Fake News & Deepfake Detection",
  description: "Enterprise-grade AI-powered detection system for fake news and deepfake content. Analyze text, images, and videos with advanced machine learning.",
  keywords: "fake news detection, deepfake detector, AI analysis, machine learning, content verification",
  viewport: "width=device-width, initial-scale=1",
  openGraph: {
    title: "VERITAS - Fake News & Deepfake Detector",
    description: "Advanced AI detection for fake news and deepfakes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' font-size='75' fill='%2300d9ff'>V</text></svg>" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100`}
      >
        {children}
      </body>
    </html>
  );
}
