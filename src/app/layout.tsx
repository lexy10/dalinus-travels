import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ThemeProvider } from "@/ui/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Dalinus Travels",
    template: "%s | Dalinus Travels",
  },
  description:
    "Your gateway to global education and travel. Discover study abroad programs, tour packages, and expert consultation services.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://dalinus-travels.vercel.app"),
  openGraph: {
    title: "Dalinus Travels",
    description:
      "Your gateway to global education and travel. Discover study abroad programs, tour packages, and expert consultation services.",
    siteName: "Dalinus Travels",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Dalinus Travels - International Education & Travel",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dalinus Travels",
    description:
      "Your gateway to global education and travel. Discover study abroad programs, tour packages, and expert consultation services.",
    images: ["/og-image.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
