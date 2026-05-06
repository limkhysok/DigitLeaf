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

  const [status, setStatus] = useState("Preparing your workspace")
  const [dots, setDots] = useState("")

  useEffect(() => {
    if (!mounted) return
    const statuses = [
      "Securing your connection",
      "Authenticating layers",
      "Setting up your dashboard",
      "Almost ready"
    ]
    let i = 0
    const statusInterval = setInterval(() => {
      const nextStatus = statuses[i]
      if (nextStatus) setStatus(nextStatus)
      i = (i + 1) % statuses.length
    }, 1500)

    const dotsInterval = setInterval(() => {
      setDots(d => d.length >= 3 ? "" : d + ".")
    }, 400)

    return () => {
      clearInterval(statusInterval)
      clearInterval(dotsInterval)
    }
  }, [mounted])

  return (
    <div className="min-h-[100svh] w-full flex flex-col md:flex-row overflow-hidden relative bg-[#009640]">
      {/* BACKGROUND LAYERS - SMOOTH COMPOSITING */}
      {/* Mobile White Background Fade */}
      <div className={`absolute inset-0 bg-white transition-opacity duration-1000 ease-in-out md:hidden z-0
        ${isExiting ? 'opacity-100' : 'opacity-0'}`} 
      />
      
      {/* Desktop Split Panel (Matches Login Sidebar) */}
      <div className={`absolute right-0 inset-y-0 bg-white transition-all duration-1000 ease-in-out hidden md:block z-0
        ${isExiting ? 'md:w-[58%]' : 'md:w-0'}`} 
      />

      {/* FALLING LEAVES (Subtle Organic Detail) */}
      <div className={`absolute inset-0 z-10 transition-opacity duration-1000 ${isExiting ? 'opacity-0 md:opacity-10' : 'opacity-10'}`}
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

      {/* BRANDING CONTENT - PIXEL PERFECT SYNC WITH LOGIN */}
      <div className={`relative z-20 flex flex-col items-center transition-all duration-1000 ease-in-out
        ${isExiting ? 'md:w-[42%] w-full h-[100svh] justify-center' : 'w-full h-[100svh] justify-center'}`}>

        <div className={`flex flex-col items-center text-center transition-all duration-[1200ms] ease-in-out
          ${isExiting
            ? 'translate-y-[calc(-50svh+96px)] md:translate-y-0 space-y-0 md:space-y-6'
            : 'translate-y-0 space-y-4 lg:space-y-6'}`}>

          <div className={`relative transition-all duration-[1200ms] ease-in-out ${isExiting ? 'w-20 h-20 md:w-[140px] md:h-[140px]' : 'w-[140px] h-[140px]'}`}>
            {/* Branding Glow - Softer and warmer */}
            <div className={`absolute inset-[-20%] bg-white/20 rounded-full blur-3xl backdrop-blur-sm transition-all duration-1000 
              ${isExiting ? 'opacity-30 scale-125' : 'opacity-0 scale-75'}`} />

            {/* White Logo (Landing) */}
            <Image
              src="/assets/white-kaic.png"
              alt="Logo"
              fill
              className={`object-contain transition-opacity duration-1000 ${isExiting ? 'opacity-0 md:opacity-100' : 'opacity-100'}
                ${isExiting ? '' : 'animate-[float_6s_ease-in-out_infinite]'}`}
              priority
              unoptimized
            />
            {/* Green Logo (Mobile Sync) */}
            <Image
              src="/assets/newKAIC.png"
              alt="Logo"
              fill
              className={`object-contain transition-opacity duration-1000 ${isExiting ? 'opacity-100 md:opacity-0' : 'opacity-0'}`}
              priority
              unoptimized
            />
          </div>

          <div className={`transition-all duration-[1200ms] ease-in-out overflow-hidden
            ${isExiting ? 'h-0 opacity-0 md:h-auto md:opacity-100 md:mt-0' : 'h-auto opacity-100 mt-1 lg:mt-2'}`}>
            <div className="space-y-1 lg:space-y-2">
              <h1 className={`font-branding tracking-[0.1em] leading-tight transition-all duration-[1100ms]
                ${isExiting ? 'text-xl text-[#009640] md:text-white' : 'text-xl lg:text-2xl text-white'}`}>
                K.A.I.C
              </h1>
            </div>
          </div>
        </div>

        {/* Ultra User-Friendly Loading Sequence - Absolute positioned to avoid vertical shift */}
        <div className={`absolute bottom-[12svh] md:bottom-[18svh] flex flex-col items-center transition-all duration-700 delay-300
          ${isExiting ? 'opacity-0 translate-y-10 scale-95 pointer-events-none' : 'opacity-100 translate-y-0 scale-100'}`}>
          
          <div className="flex flex-col items-center gap-6">
            {/* Status & Progress Section */}
            <div className="flex flex-col items-center gap-5">
              {/* Soft "Bloom" Progress */}
              <div className="relative flex items-center justify-center">
                <div className="w-14 h-14 bg-white/5 rounded-full border border-white/10 animate-[pulse_3s_ease-in-out_infinite]" />
                <div className="absolute w-9 h-9 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 shadow-xl">
                  <IconLeaf className="text-white/80 animate-bounce" size={18} stroke={1.5} />
                </div>
              </div>

              {/* Dynamic Status Feedback */}
              <div className="flex flex-col items-center">
                <div className="h-4 flex items-center">
                  <p className="font-branding text-white/90 text-xs md:text-sm tracking-wide transition-all duration-500">
                    {status}{dots}
                  </p>
                </div>
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
