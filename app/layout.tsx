import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/contexts/language-context"
import { UserProvider } from "@/contexts/user-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MentalAssess - Cognitive Assessment Platform",
  description: "Professional cognitive assessment application with MoCA, MMSE, TCM Constitution tests and sensory screenings",
  generator: "v0.app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MentalAssess",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MentalAssess" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.jpg" />
        <link rel="icon" type="image/jpeg" sizes="192x192" href="/icons/icon-192x192.jpg" />
        <link rel="icon" type="image/jpeg" sizes="512x512" href="/icons/icon-512x512.jpg" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <LanguageProvider>
            <UserProvider>{children}</UserProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
