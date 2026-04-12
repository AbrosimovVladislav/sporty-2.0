import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Oswald } from "next/font/google";
import { TelegramProvider } from "@/components/TelegramProvider";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Sporty 2.0",
  description: "Управление любительскими командами",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} ${oswald.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TelegramProvider>
          <AuthProvider>{children}</AuthProvider>
        </TelegramProvider>
      </body>
    </html>
  );
}
