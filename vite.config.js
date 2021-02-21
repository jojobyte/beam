import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'
import VitePluginHtml from 'vite-plugin-html'

const moduleExclude = (match) => {
  const m = id => id.indexOf(match) > -1
  return {
    name: `exclude-${match}`,
    resolveId(id) {
      if (m(id)) return id
    },
    load(id) {
      if (m(id)) return `export default {}`
    },
  }
}

export default {
  resolve: {
    alias: {
      '/@': `${path.resolve(__dirname, 'src')}`,
    },
  },
  build: {
    sourcemap: true,
    polyfillDynamicImport: true,
    chunkSizeWarningLimit: 1024,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    }
  },
  plugins: [
    VitePWA(),
    VitePluginHtml({
      minify: true,
    }),
    // Enabling this effects browser compatability
    // moduleExclude('text-encoding'),
  ],
  optimizeDeps: {
    include: [
      'gun/gun',
      'gun/sea',
      'gun/sea.js',
      'gun/lib/promise',
      'gun/lib/then',
      'gun/lib/webrtc',
      'gun/lib/load',
      'gun/lib/radix',
      'gun/lib/open',
      'gun/lib/unset',
    ],
  },
  server: {
    https: true,
    proxy: {
      '/gun': {
        target: {
          host: 'localhost',
          port: 8765,
        },
        ws: true,
      },
    }
  }
}
