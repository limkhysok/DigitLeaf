import type { TokenResponse } from "@/types"

export function hasScope(tokens: TokenResponse | null | undefined, ...scopes: string[]) {
  const granted = tokens?.scope?.split(" ") ?? []
  return scopes.some((s) => granted.includes(s))
}
