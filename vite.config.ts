import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import http from 'http'
import https from 'https'

/** Vite 插件：API 代理中间件，解决浏览器 CORS 限制 */
function apiProxy(): Plugin {
  return {
    name: 'api-proxy',
    configureServer(server) {
      // /api/proxy?target=https://api.anthropic.com/v1/messages
      server.middlewares.use('/api/proxy', (req, res) => {
        const url = new URL(req.url!, `http://${req.headers.host}`)
        const target = url.searchParams.get('target')
        if (!target) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Missing ?target= parameter' }))
          return
        }

        const targetUrl = new URL(target)
        const client = targetUrl.protocol === 'https:' ? https : http

        const bodyChunks: Buffer[] = []
        req.on('data', (chunk: Buffer) => bodyChunks.push(chunk))
        req.on('end', () => {
          const body = Buffer.concat(bodyChunks)

          const options: http.RequestOptions = {
            hostname: targetUrl.hostname,
            port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
            path: targetUrl.pathname + targetUrl.search,
            method: req.method,
            headers: {
              'Content-Type': 'application/json',
              // 转发认证头
              ...Object.fromEntries(
                Object.entries(req.headers as Record<string, string>)
                  .filter(([k]) => k.startsWith('x-') || k === 'authorization' || k === 'anthropic-version')
              ),
            },
          }

          const proxyReq = client.request(options, (proxyRes) => {
            // 透传 CORS 头
            res.writeHead(proxyRes.statusCode || 200, {
              'Content-Type': proxyRes.headers['content-type'] || 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': '*',
              'Access-Control-Allow-Headers': '*',
            })
            proxyRes.pipe(res)
          })

          proxyReq.on('error', (err) => {
            res.writeHead(502, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
            res.end(JSON.stringify({ error: `Proxy error: ${err.message}` }))
          })

          proxyReq.write(body)
          proxyReq.end()
        })
      })

      // OPTIONS 预检请求
      server.middlewares.use('/api/proxy', (req, res, next) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Access-Control-Allow-Headers': '*',
          })
          res.end()
          return
        }
        // 不是 OPTIONS 就交给上面的 handler
        next?.()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), apiProxy()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
  envPrefix: ['VITE_'],
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
  },
})
