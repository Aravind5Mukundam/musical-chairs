import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import ThemeInitializer from "@/components/layout/ThemeInitializer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Musical Chairs",
  description: "A multiplayer Musical Chairs game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <ThemeInitializer />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
