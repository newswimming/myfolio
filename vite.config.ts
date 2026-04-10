import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

// Root of the Obsidian vault — must match VAULT_DIR in zettlebank-4.2.0/.env
// (resolved as absolute path, same logic as server.py VAULT_NOTES_DIR.parent)
const VAULT_ROOT = 'C:/Users/andrea/Documents/choracle-remote-v3'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'notes-server',
      configureServer(server) {
        server.middlewares.use('/notes', (req, res, next) => {
          const noteId = req.url?.replace(/^\//, '')
          if (!noteId) { next(); return }

          // Resolution order mirrors server.py _find_note_path():
          //   1. vault root — human-authored notes live here
          //   2. notes/ subdirectory — character stubs written by ingest-character-graph
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
              // file not found at this path — try next candidate
            }
          }

          res.statusCode = 404
          res.end('Not found')
        })
      },
    },
  ],
  server: {
    proxy: {
      '/trend-bias': {
        target: 'https://script-trend-bias-analyzer.onrender.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/trend-bias/, ''),
      },
    },
  },
})
