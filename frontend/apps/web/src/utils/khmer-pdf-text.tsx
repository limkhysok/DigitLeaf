"use client"

import { View, Image } from "@react-pdf/renderer"

interface KhmerLabelStyle {
  fontSize?: number
  color?: string
  fontWeight?: string | number
  textAlign?: string
  [key: string]: unknown
}

// @react-pdf/renderer's text shaper (fontkit) doesn't correctly shape Khmer's
// stacked consonant clusters (coeng), leaving blank glyphs for most ordinary
// words. The browser's own canvas text engine shapes Khmer correctly (same
// engine the old html2canvas approach relied on), so Khmer (and any mixed)
// labels are rasterized small per-string here and embedded as PDF images
// instead of vector <Text> — far cheaper than rasterizing the whole invoice.

const FONT_FAMILY = "Kantumruy Pro"
const RASTER_SCALE = 3
const LINE_HEIGHT_RATIO = 1.6
const BASELINE_RATIO = 0.72

let fontLoadPromise: Promise<void> | null = null

export function ensureKhmerCanvasFontLoaded(): Promise<void> {
  fontLoadPromise ??= (async () => {
    const face = new FontFace(FONT_FAMILY, "url(/font/KantumruyPro-Regular.ttf)")
    await face.load()
    document.fonts.add(face)
  })()
  return fontLoadPromise
}

interface RasterizedText {
  src: string
  width: number
  height: number
}

export function rasterizeText(text: string, { fontSize, color, bold }: { fontSize: number; color: string; bold?: boolean }): RasterizedText {
  const fontSpec = `${bold ? "bold " : ""}${fontSize}px '${FONT_FAMILY}'`

  const measureCtx = document.createElement("canvas").getContext("2d")!
  measureCtx.font = fontSpec
  const width = Math.max(1, Math.ceil(measureCtx.measureText(text).width) + 2)
  const height = Math.ceil(fontSize * LINE_HEIGHT_RATIO)

  const canvas = document.createElement("canvas")
  canvas.width = width * RASTER_SCALE
  canvas.height = height * RASTER_SCALE
  const ctx = canvas.getContext("2d")!
  ctx.scale(RASTER_SCALE, RASTER_SCALE)
  ctx.font = fontSpec
  ctx.fillStyle = color
  ctx.textBaseline = "alphabetic"
  ctx.fillText(text, 1, height * BASELINE_RATIO)

  return { src: canvas.toDataURL("image/png"), width, height }
}

interface KhmerLabelProps {
  text: string | null | undefined
  style?: KhmerLabelStyle
}

function justifyForTextAlign(textAlign: unknown): "flex-start" | "center" | "flex-end" {
  if (textAlign === "right") return "flex-end"
  if (textAlign === "center") return "center"
  return "flex-start"
}

// Drop-in replacement for react-pdf's <Text>: takes the same merged style
// object (box layout props + fontSize/color/fontWeight/textAlign) and renders
// a rasterized image positioned the same way <Text> would have aligned it.
export function KhmerLabel({ text, style }: Readonly<KhmerLabelProps>) {
  const { fontSize, color, fontWeight, textAlign, ...box } = style ?? {}
  const size = typeof fontSize === "number" ? fontSize : 12
  const justify = justifyForTextAlign(textAlign)

  if (!text) {
    return <View style={{ ...box, flexDirection: "row", alignItems: "center", justifyContent: justify }} />
  }

  const img = rasterizeText(text, {
    fontSize: size,
    color: typeof color === "string" ? color : "#111827",
    bold: fontWeight === "bold",
  })

  return (
    <View style={{ ...box, flexDirection: "row", alignItems: "center", justifyContent: justify }}>
      <Image src={img.src} style={{ width: img.width, height: img.height }} />
    </View>
  )
}

function wrapIntoLines(text: string, fontSpec: string, maxWidth: number): string[] {
  const measureCtx = document.createElement("canvas").getContext("2d")!
  measureCtx.font = fontSpec

  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ""
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (current && measureCtx.measureText(candidate).width > maxWidth) {
      lines.push(current)
      current = word
    } else {
      current = candidate
    }
  }
  if (current) lines.push(current)
  return lines
}

interface KhmerParagraphProps {
  text: string | null | undefined
  style?: KhmerLabelStyle
  maxWidth: number
}

// Like KhmerLabel, but word-wraps free-form text (e.g. a user-entered note)
// into multiple rasterized lines instead of one wide, unbroken image.
function alignItemsForTextAlign(textAlign: unknown): "flex-start" | "center" | "flex-end" {
  if (textAlign === "center") return "center"
  if (textAlign === "right") return "flex-end"
  return "flex-start"
}

export function KhmerParagraph({ text, style, maxWidth }: Readonly<KhmerParagraphProps>) {
  const { fontSize, color, fontWeight, textAlign, ...box } = style ?? {}
  const size = typeof fontSize === "number" ? fontSize : 12
  const resolvedColor = typeof color === "string" ? color : "#111827"
  const bold = fontWeight === "bold"
  const alignItems = alignItemsForTextAlign(textAlign)

  if (!text) return <View style={{ ...box, flexDirection: "column", alignItems }} />

  const fontSpec = `${bold ? "bold " : ""}${size}px '${FONT_FAMILY}'`
  const lines = wrapIntoLines(text, fontSpec, maxWidth)

  return (
    <View style={{ ...box, flexDirection: "column", alignItems }}>
      {lines.map((line) => {
        const img = rasterizeText(line, { fontSize: size, color: resolvedColor, bold })
        return <Image key={line} src={img.src} style={{ width: img.width, height: img.height }} />
      })}
    </View>
  )
}
