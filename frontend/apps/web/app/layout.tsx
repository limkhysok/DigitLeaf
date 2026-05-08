import { Geist_Mono, Figtree } from "next/font/google"
import localFont from "next/font/local"

import "@workspace/ui/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@workspace/ui/lib/utils";
import { AuthProvider } from "@/hooks/use-auth";

import { Toaster } from "@workspace/ui/components/sonner"

const figtree = Figtree({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const comicRelief = localFont({
  src: "../public/font/ComicRelief-Regular.ttf",
  variable: "--font-branding",
})

const kantumruyPro = localFont({
  src: "../public/font/KantumruyPro-Regular.ttf",
  variable: "--font-khmer",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", figtree.variable, comicRelief.variable, kantumruyPro.variable)}
    >
      <body className="bg-background">
        <AuthProvider>
          <ThemeProvider>
            {children}
            <Toaster richColors position="bottom-right" />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
