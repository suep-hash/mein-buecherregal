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

export const metadata = {
  title: "Mein Bücherregal",
  description: "Persönliches Bücherregal mit KI-Genre-Erkennung und Empfehlungen",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bücherregal",
  },
};

export const viewport = {
  themeColor: "#2e2018",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
