import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "3C Foods",
  description: "Discover your top 3 food picks",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
