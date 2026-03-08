import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grid Forge",
  description: "AI-powered SCADA screen generator",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-gray-950 text-gray-100 antialiased">{children}</body>
    </html>
  );
}
