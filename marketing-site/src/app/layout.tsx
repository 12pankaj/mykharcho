import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mykharcho.in"),
  title: "MyKharcho | AI-Powered Finance & Expense Tracker",
  description: "Manage Your Wealth. Automate Your Life. Track expenses with AI voice scanner, manage loans with friends, split groups, and get WhatsApp EMI reminders.",
  keywords: ["Expense Tracker AI", "Splitwise alternative", "Loan EMI manager", "WhatsApp reminders", "Finance Automation India", "Personal Finance App"],
  authors: [{ name: "MyKharcho Team" }],
  openGraph: {
    title: "MyKharcho | AI-Powered Finance Engine",
    description: "The ultimate app to track daily expenses, manage loans, split bills, and automate your financial ecosystem.",
    url: "https://mykharcho.in",
    siteName: "MyKharcho",
    images: [
      {
        url: "/newlogo.png",
        width: 1200,
        height: 630,
        alt: "MyKharcho Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyKharcho | AI Finance Engine",
    description: "Track wealth, automate loans, and scan receipts with AI.",
    images: ["/newlogo.png"],
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
