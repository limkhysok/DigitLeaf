// For mobile testing via Cloudflare:
// 1. Run 'cloudflared tunnel --url http://localhost:8000'
// 2. Paste the generated URL here:
const BACKEND_TUNNEL_URL = "";

export const API_BASE_URL = BACKEND_TUNNEL_URL
  ? `${BACKEND_TUNNEL_URL}/api/v1`
  : (process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000/api/v1");
