import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv, type Connect, type Plugin } from 'vite'
import { handleGenAI } from './server/genai/handler.ts'

/** Mounts the server-side GenAI gateway (/api/ai/*) inside the dev and preview servers. */
function genaiGateway(): Plugin {
  const mount = (middlewares: Connect.Server) =>
    middlewares.use((req, res, next) => {
      handleGenAI(req, res).then((handled) => {
        if (!handled) next()
      })
    })
  return {
    name: 'lovemate-genai-gateway',
    configureServer(server) {
      mount(server.middlewares)
    },
    configurePreviewServer(server) {
      mount(server.middlewares)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env / .env.local into process.env for the server-side gateway only.
  // Variables are NOT exposed to the browser bundle (only VITE_* would be).
  const env = loadEnv(mode, process.cwd(), '')
  for (const key of ['ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_PROFILE', 'LOVEMATE_MODEL', 'LOVEMATE_RATE_LIMIT', 'LOVEMATE_AI_PROVIDER', 'LOVEMATE_AI_PROVIDERS', 'LOVEMATE_PUBLIC_URL', 'GROQ_API_KEY', 'GROQ_MODEL', 'GROQ_VISION_MODEL', 'GROQ_BASE_URL', 'LOVEMATE_AI_TIMEOUT_MS', 'OPENROUTER_API_KEY', 'OPENROUTER_MODEL', 'OPENROUTER_VISION_MODEL', 'OPENROUTER_BASE_URL']) {
    if (env[key] && !process.env[key]) process.env[key] = env[key]
  }
  return {
    plugins: [react(), tailwindcss(), genaiGateway()],
  }
})
