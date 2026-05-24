import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "PrepDeck — Simple cooking for busy students",
  description:
    "Track groceries, swipe meal ideas, and build simple meal plans for student life.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
