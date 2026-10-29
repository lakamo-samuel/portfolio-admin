import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const satoshi = localFont({
  src: "../public/fonts/Satoshi-Variable.woff2",
  variable: "--font-satoshi",
  display: "swap",
  weight: "300 900",
});

export const metadata: Metadata = {
  title: "KJTech Dashboard",
  description: "Portfolio content and visitor analytics",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={satoshi.variable}>
      <body className="min-h-screen bg-[#000000] font-[var(--font-satoshi)] text-[#fafafa] antialiased">
        {children}
      </body>
    </html>
  );
}
