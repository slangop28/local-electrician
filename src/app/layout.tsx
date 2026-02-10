import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "@/lib/AuthContext";
import { GoogleMapsProvider } from "@/components/GoogleMapsProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Local Electrician - Find Verified Electricians Near You",
  description: "Connect with KYC-verified local electricians in under 60 seconds. Fast, reliable, and affordable electrical services at your doorstep.",
  keywords: ["electrician", "electrical services", "local electrician", "home repairs", "wiring", "electrical repair"],
  authors: [{ name: "Local Electrician" }],
  openGraph: {
    title: "Local Electrician - Electrician Near You, In Minutes",
    description: "Connect with verified local electricians instantly. Fast, reliable, and affordable.",
    type: "website",
    locale: "en_IN",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1E88E5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <GoogleMapsProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </GoogleMapsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

