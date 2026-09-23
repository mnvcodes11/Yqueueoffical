import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'remove-framer-motion-browser-require',
      generateBundle(_options, bundle) {
        const expression = 'require("@emotion/is-prop-valid").default'
        Object.values(bundle).forEach((output) => {
          if (output.type === 'chunk' && output.code.includes(expression)) {
            output.code = output.code.replaceAll(expression, 'undefined')
          }
        })
      },
    },
  ],
  server: {
    host: true,
    allowedHosts: ['localhost', '127.0.0.1', '.loca.lt'],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})