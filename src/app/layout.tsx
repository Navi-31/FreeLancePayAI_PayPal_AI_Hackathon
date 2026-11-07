import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";
import "@/frontend/styles/globals.css";
import { Providers } from "@/frontend/components/layout/Providers";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FreelancePay AI — Autonomous Wealth Engine",
  description: "Executive private wealth concierge and autonomous AI financial command center for independent operators.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geist.variable} ${inter.variable} bg-surface-container-lowest text-on-surface antialiased min-h-screen selection:bg-primary selection:text-on-primary`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
