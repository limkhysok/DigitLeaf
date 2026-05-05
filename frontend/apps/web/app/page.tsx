"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { IconLeaf } from "@tabler/icons-react"
import { useAuth } from "@/hooks/use-auth"

interface Leaf {
  id: number
  left: string
  delay: string
  duration: string
  size: number
  opacity: number
  rotation: number
}

export default function LandingPage() {
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [leaves, setLeaves] = useState<Leaf[]>([])
  const [isExiting, setIsExiting] = useState(false)

  const { isAuthenticated, isLoading: authLoading } = useAuth()

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // If we're already authenticated, redirect to dashboard immediately
    if (isAuthenticated && !authLoading) {
      router.push("/dashboard")
      return
    }

    router.prefetch("/login")

    requestAnimationFrame(() => {
      const leafCount = window.innerWidth < 768 ? 20 : 45;
      setLeaves(Array.from({ length: leafCount }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 10}s`,
        duration: `${10 + Math.random() * 15}s`,
        size: window.innerWidth < 768 ? 10 + Math.random() * 15 : 15 + Math.random() * 30,
        opacity: 0.1 + Math.random() * 0.3,
        rotation: Math.random() * 360,
      })))
    })

    const exitTimer = setTimeout(() => {
      setIsExiting(true)
    }, 3200)

    const redirectTimer = setTimeout(() => {
      // After animation, if still not authenticated, go to login
      // If we ARE authenticated by now (e.g. background check finished), 
      // the useAuth logic or the check above will have handled it.
      router.push("/login")
    }, 4500)

    return () => {
      clearTimeout(exitTimer)
      clearTimeout(redirectTimer)
    }
  }, [router, isAuthenticated, authLoading, mounted])

  return (
    <div className={`min-h-screen w-full flex flex-col md:flex-row overflow-hidden relative transition-colors duration-1000 ease-in-out
      ${isExiting ? 'bg-white md:bg-[#009640]' : 'bg-[#009640]'}`}>
      <div className={`absolute inset-0 z-0 transition-opacity duration-1000 ${isExiting ? 'opacity-0 md:opacity-10' : 'opacity-10'}`}
        style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />

      {/* Falling Leaves */}
      <div className={`absolute inset-0 pointer-events-none overflow-hidden transition-opacity duration-700 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
        {mounted && leaves.map((leaf) => (
          <div
            key={leaf.id}
            className="absolute animate-leaf-fall text-white"
            style={{
              left: leaf.left,
              animationDelay: leaf.delay,
              animationDuration: leaf.duration,
              width: leaf.size,
              height: leaf.size,
              opacity: leaf.opacity,
              transform: `rotate(${leaf.rotation}deg)`,
            }}
          >
            <IconLeaf size={leaf.size} stroke={1} />
          </div>
        ))}
      </div>

      {/* BRANDING CONTENT - PIXEL PERFECT SYNC */}
      <div className={`relative z-20 flex flex-col items-center transition-all duration-1000 ease-in-out
        ${isExiting ? 'md:w-[42%] w-full h-screen justify-center' : 'w-full h-screen justify-center'}`}>

        <div className={`flex flex-col items-center text-center space-y-4 lg:space-y-6 transition-all duration-1000
          ${isExiting
            ? 'translate-y-[-24vh] md:translate-y-0 scale-[0.643] md:scale-100'
            : 'translate-y-0 scale-100'}`}>

          <div className="relative">
            {/* White Logo (Landing) */}
            <Image
              src="/assets/white-kaic.png"
              alt="Logo"
              width={140}
              height={140}
              className={`object-contain transition-opacity duration-1000 ${isExiting ? 'opacity-0 md:opacity-100' : 'opacity-100'}`}
              priority
              unoptimized
            />
            {/* Green Logo (Mobile Sync) */}
            <Image
              src="/assets/newKAIC.png"
              alt="Logo"
              width={140}
              height={140}
              className={`absolute inset-0 object-contain transition-opacity duration-1000 ${isExiting ? 'opacity-100 md:opacity-0' : 'opacity-0'}`}
              priority
              unoptimized
            />
          </div>

          <div className="space-y-1 lg:space-y-2">
            <h1 className={`text-xl lg:text-2xl font-branding tracking-[0.1em] leading-tight transition-colors duration-1000
              ${isExiting ? 'text-[#009640] md:text-white' : 'text-white'}`}>
              K.A.I.C
            </h1>
          </div>
        </div>

        {/* Loading text: Fades out early */}
        <div className={`absolute bottom-24 md:bottom-20 flex flex-col items-center space-y-6 transition-all duration-700 delay-300
          ${isExiting ? 'opacity-0 translate-y-10' : 'opacity-100 translate-y-0'}`}>
          
          <div className="flex flex-col items-center gap-5">
            {/* Premium Glowing Bar */}
            <div className="w-40 h-[1.5px] bg-white/5 rounded-full overflow-hidden relative">
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
              <div className="absolute h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-loading-bar rounded-full" />
            </div>

            {/* High-end Tech Typography */}
            <div className="flex flex-col items-center gap-2">
              <p className="font-branding text-[8px] lg:text-[9px] tracking-[0.6em] text-white/60 uppercase animate-pulse">
                Workspace Secured
              </p>
              <div className="flex items-center gap-3">
                <span className="h-[1px] w-4 bg-white/20" />
                <p className="font-branding text-[7px] tracking-[0.8em] text-white/30 uppercase">
                  Initializing
                </p>
                <span className="h-[1px] w-4 bg-white/20" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Panel Split for Desktop */}
      <div className={`bg-white transition-all duration-1000 ease-in-out hidden md:block
        ${isExiting ? 'md:w-[58%]' : 'md:w-0'}`}
      />
    </div>
  )
}
