// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/Layout/Header";
import { Footer } from "@/components/Layout/Footer";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mutual Fund Analyzer",
  description: "Analysis and portfolio management for mutual funds",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-background flex flex-col">
          <Header />
          <main className="flex-grow">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
