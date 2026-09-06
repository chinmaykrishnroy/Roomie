import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Roomie · Multi-Party Video & Voice",
  description: "Casual multi-party rooms with adaptive video, pinning, and instant discovery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
