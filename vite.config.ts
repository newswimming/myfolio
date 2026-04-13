import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

// Root of the Obsidian vault
const VAULT_ROOT = 'C:/Users/andrea/Documents/choracle-remote-v3'

export default defineConfig({
  plugins: [
    react(),

    // ✅ custom notes middleware (kept)
    {
      name: 'notes-server',
      configureServer(server) {
        server.middlewares.use('/notes', (req, res, next) => {
          const noteId = req.url?.replace(/^\//, '')
          if (!noteId) {
            next()
            return
          }

          const candidates = [
            path.join(VAULT_ROOT, `${noteId}.md`),
            path.join(VAULT_ROOT, 'notes', `${noteId}.md`),
          ]

          for (const filePath of candidates) {
            try {
              const content = fs.readFileSync(filePath, 'utf-8')
              res.setHeader('Content-Type', 'text/plain; charset=utf-8')
              res.end(content)
              return
            } catch {
              // try next
            }
          }

          res.statusCode = 404
          res.end('Not found')
        })
      },
    },
  ],

  server: {
    host: '127.0.0.1',   // ✅ FIX: force consistent origin
    port: 5173,

    proxy: {
      '/trend-bias': {
        target: 'https://script-trend-bias-analyzer.onrender.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/trend-bias/, ''),
      },
    },
  },
})