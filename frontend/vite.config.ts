import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(process.cwd()), '')
  const backendTarget = env.VITE_BACKEND_TARGET || 'http://127.0.0.1:80'

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    build: {
      outDir: '../web',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          index: path.resolve(__dirname, 'index.html'),
          admin: path.resolve(__dirname, 'admin.html'),
        },
      },
    },
    server: {
      proxy: {
        '/config': backendTarget,
        '/aux': backendTarget,
        '/channels': backendTarget,
        // POST /admin must hit the real server (form save). GET /admin would return
        // built HTML with /assets/*.js hashed paths; resolved against Vite (:5173) those 404.
        '/admin': {
          target: backendTarget,
          changeOrigin: true,
          bypass(req) {
            if (req.method === 'GET') {
              const path = req.url?.split('?')[0]
              if (path === '/admin') return '/admin.html'
            }
          },
        },
      },
    },
  }
})
