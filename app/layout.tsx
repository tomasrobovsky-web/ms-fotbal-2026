import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "MS Fotbal 2026",
  description: "Mistrovství světa ve fotbale 2026 – výsledky, tabulky a statistiky",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MS 2026",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1a2e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs">
      <body className="bg-gray-950 text-white min-h-screen">
        <Navigation />
        <main className="pb-20 md:pb-0 md:pt-16">{children}</main>
      </body>
    </html>
  );
}
