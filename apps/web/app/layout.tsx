import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Human Color AI | Personal Color Analysis",
  description: "AI-powered personal color and image report generator for Instagram-ready PNG and PDF exports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#fbf6ed]">{children}</body>
    </html>
  );
}
