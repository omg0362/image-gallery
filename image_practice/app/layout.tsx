import { BuyMeCoffeeWidget } from "@/components/buy-me-coffee-widget";
import type { Metadata } from "next";
import { Black_Han_Sans } from "next/font/google";
import "./globals.css";

const blackHanSans = Black_Han_Sans({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-black-han-sans",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Image Practice Studio",
  description: "Generate, download, and share AI images.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={blackHanSans.variable}>
      <body>
        {children}
        <BuyMeCoffeeWidget />
      </body>
    </html>
  );
}
