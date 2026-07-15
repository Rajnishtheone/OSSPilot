import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OSSPilot",
  description: "Find your first open-source issue to contribute to.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
