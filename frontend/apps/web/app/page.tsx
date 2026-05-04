"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { IconLeaf } from "@tabler/icons-react"
import { useAuth } from "@/hooks/use-auth"

export default function LandingPage() {
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [leaves, setLeaves] = useState<any[]>([])
  const [isExiting, setIsExiting] = useState(false)

  const { isAuthenticated, isLoading: authLoading } = useAuth()

  useEffect(() => {
    setMounted(true)
    
    // If we're already authenticated, redirect to dashboard immediately
    if (isAuthenticated && !authLoading) {
      router.push("/dashboard")
      return
    }

    router.prefetch("/login")

    const leafCount = window.innerWidth < 768 ? 12 : 25;
    setLeaves(Array.from({ length: leafCount }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 8}s`,
      duration: `${8 + Math.random() * 12}s`,
      size: window.innerWidth < 768 ? 12 + Math.random() * 15 : 15 + Math.random() * 25,
      opacity: 0.05 + Math.random() * 0.2,
    })))

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
  }, [router, isAuthenticated, authLoading])

  return (
    <div className={`min-h-screen w-full flex flex-col md:flex-row overflow-hidden relative transition-colors duration-1000 ease-in-out
      ${isExiting ? 'bg-white md:bg-[#009640]' : 'bg-[#009640]'}`}>



      {/* Background Pattern */}
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
            <h1 className={`text-xl lg:text-2xl font-black tracking-[0.1em] uppercase leading-tight transition-colors duration-1000
              ${isExiting ? 'text-[#009640] md:text-white' : 'text-white'}`}>
              K.A.I.C
            </h1>
            <p className={`text-[10px] lg:text-sm tracking-widest uppercase font-medium transition-colors duration-1000
              ${isExiting ? 'text-[#009640]/70 md:text-green-50/70' : 'text-green-50/70'}`}>
              INTERNAL MANAGEMENT SYSTEM
            </p>
          </div>
        </div>

        {/* Loading text: Fades out early */}
        <div className={`absolute bottom-24 md:bottom-20 flex flex-col items-center space-y-4 transition-all duration-500 
          ${isExiting ? 'opacity-0 translate-y-10' : 'opacity-100 translate-y-0'}`}>
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 bg-white/80 rounded-full animate-bounce" />
          </div>
          <p className="text-white/80 text-sm font-medium tracking-wide">
            Loading, please wait a moment
          </p>
        </div>
      </div>

      {/* Sidebar Panel Split for Desktop */}
      <div className={`bg-white transition-all duration-1000 ease-in-out hidden md:block
        ${isExiting ? 'md:w-[58%]' : 'md:w-0'}`}
      />
    </div>
  )
}
