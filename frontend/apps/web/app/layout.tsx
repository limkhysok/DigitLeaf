import { cookies } from "next/headers"
import { Geist_Mono, Figtree } from "next/font/google"
import localFont from "next/font/local"

import "@workspace/ui/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@workspace/ui/lib/utils";
import { AuthProvider } from "@/hooks/use-auth";
import { UserManifestProvider } from "@/hooks/use-user-manifest";
import { LanguageCode } from "@/lib/dictionary";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const langCookie = cookieStore.get("user_language")
  const defaultLanguage: LanguageCode =
    langCookie?.value === "kh" ? "kh" : "en"

  return (
    <html
      lang={defaultLanguage}
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", figtree.variable, comicRelief.variable, kantumruyPro.variable)}
    >
      <body className="bg-background">
        <AuthProvider>
          <UserManifestProvider defaultLanguage={defaultLanguage}>
            <ThemeProvider>
              {children}
              <Toaster richColors position="bottom-right" />
            </ThemeProvider>
          </UserManifestProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
