import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QLTBCNTT",
  description: "Hệ thống quản lý trang thiết bị CNTT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
