import { Geist, Geist_Mono } from "next/font/google";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "./components/auth/auth-provider";
import { ErrorBoundary } from "./components/error/error-boundary";
import AuthHydration from "./components/error/auth-hydration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased`}
      >
        <ErrorBoundary feature="application">
          <AuthProvider>
            <AuthHydration />
            {children}
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
