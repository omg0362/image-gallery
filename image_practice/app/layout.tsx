import { BuyMeCoffeeWidget } from "@/components/buy-me-coffee-widget";
import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body>
        {children}
        <BuyMeCoffeeWidget />
      </body>
    </html>
  );
}
