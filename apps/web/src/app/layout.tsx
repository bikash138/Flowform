import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Plus_Jakarta_Sans,
  Open_Sans,
  Cormorant_Garamond,
} from "next/font/google";
import "./globals.css";
import { Provider } from "@/providers/global";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Flowform | Create Beautiful Forms Effortlessly",
  description:
    "The modern standard for form building. Create, share, and analyze forms with a premium experience powered by AI.",
  metadataBase: new URL("https://flowform.in"),
  keywords: [
    "Form Builder",
    "AI forms",
    "surveys",
    "FlowForm",
    "no-code forms",
    "premium forms",
  ],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "FlowForm",
    description: "The modern standard for form building, powered by AI",
    url: "https://flowform.in",
    siteName: "FlowForm",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.webp",
        width: 1200,
        height: 630,
        alt: "FlowForm - Create Beautiful Forms Effortlessly",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Flowform",
    description: "The modern standard for form building, powered by AI.",
    creator: "@bikash",
    images: ["/og-image.webp"],
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${jakartaSans.variable} ${openSans.variable} ${cormorantGaramond.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
