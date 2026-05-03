import { URL, fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import pxtorem from 'postcss-pxtorem'
import { visualizer } from 'rollup-plugin-visualizer'
import createVitePlugins from './config/plugins'
import { MOBILE_REM_ROOT_VALUE } from './src/constants/mobile'

const isMobileRemTarget = (filePath = '') => {
  const normalizedFilePath = filePath.replace(/\\/g, '/')

  return normalizedFilePath.includes('/src/views/mobile/')
    || normalizedFilePath.includes('/src/layout/mobile/')
    || normalizedFilePath.includes('/src/styles/mobile.scss')
}

const createManualChunkName = (id = '') => {
  const normalizedId = id.replace(/\\/g, '/')

  if (!normalizedId.includes('/node_modules/')) {
    if (normalizedId.includes('/src/views/mobile/')) {
      return 'app-mobile'
    }
    if (normalizedId.includes('/src/views/bookkeeping/')) {
      return 'app-bookkeeping'
    }
    if (normalizedId.includes('/src/views/system/')) {
      return 'app-system'
    }
    if (normalizedId.includes('/src/views/dashboard/')) {
      return 'app-dashboard'
    }
    if (normalizedId.includes('/src/views/user/')) {
      return 'app-user'
    }
    if (normalizedId.includes('/src/views/login/')) {
      return 'app-login'
    }
    return undefined
  }

  if (
    normalizedId.includes('/node_modules/vue/')
    || normalizedId.includes('/node_modules/vue-router/')
    || normalizedId.includes('/node_modules/pinia/')
    || normalizedId.includes('/node_modules/pinia-plugin-persistedstate/')
    || normalizedId.includes('/node_modules/@vueuse/')
    || normalizedId.includes('/node_modules/mitt/')
  ) {
    return 'vendor-vue'
  }

  if (
    normalizedId.includes('/node_modules/@arco-design/web-vue/')
    || normalizedId.includes('/node_modules/@arco-design/color/')
    || normalizedId.includes('/node_modules/@arco-themes/vue-gi-demo/')
  ) {
    return 'vendor-arco'
  }

  if (normalizedId.includes('/node_modules/tdesign-mobile-vue/')) {
    return 'vendor-tdesign'
  }

  if (
    normalizedId.includes('/node_modules/echarts/')
    || normalizedId.includes('/node_modules/vue-echarts/')
  ) {
    return 'vendor-echarts'
  }

  if (
    normalizedId.includes('/node_modules/@vue-office/')
    || normalizedId.includes('/node_modules/pdfjs-dist/')
    || normalizedId.includes('/node_modules/exceljs/')
    || normalizedId.includes('/node_modules/docx-preview/')
  ) {
    return 'vendor-office'
  }

  if (
    normalizedId.includes('/node_modules/aieditor/')
    || normalizedId.includes('/node_modules/codemirror/')
    || normalizedId.includes('/node_modules/@codemirror/')
    || normalizedId.includes('/node_modules/@ddietr/codemirror-themes/')
    || normalizedId.includes('/node_modules/vue-codemirror6/')
  ) {
    return 'vendor-editor'
  }

  if (
    normalizedId.includes('/node_modules/viewerjs/')
    || normalizedId.includes('/node_modules/v-viewer/')
  ) {
    return 'vendor-viewer'
  }

  if (normalizedId.includes('/node_modules/xgplayer/')) {
    return 'vendor-player'
  }

  if (
    normalizedId.includes('/node_modules/crypto-js/')
    || normalizedId.includes('/node_modules/jsencrypt/')
    || normalizedId.includes('/node_modules/spark-md5/')
  ) {
    return 'vendor-security'
  }

  if (
    normalizedId.includes('/node_modules/dayjs/')
    || normalizedId.includes('/node_modules/lodash-es/')
    || normalizedId.includes('/node_modules/query-string/')
    || normalizedId.includes('/node_modules/qs/')
    || normalizedId.includes('/node_modules/xe-utils/')
    || normalizedId.includes('/node_modules/nprogress/')
  ) {
    return 'vendor-utils'
  }

  return 'vendor-misc'
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd()) as ImportMetaEnv
  const isBuild = command === 'build'
  const isAnalyzeMode = mode === 'analyze'
  const plugins = createVitePlugins(env, isBuild)

  if (isBuild && isAnalyzeMode) {
    plugins.push(visualizer({
      filename: 'stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }))
  }

  return {
    base: env.VITE_BASE,
    resolve: {
      alias: {
        '~': fileURLToPath(new URL('./', import.meta.url)),
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    css: {
      postcss: {
        plugins: [
          pxtorem({
            rootValue: MOBILE_REM_ROOT_VALUE,
            unitPrecision: 5,
            propList: ['*'],
            mediaQuery: true,
            minPixelValue: 2,
            exclude: (filePath) => !isMobileRemTarget(filePath),
          }),
        ],
      },
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/styles/var.scss" as *;`,
          api: 'modern-compiler',
        },
      },
    },
    optimizeDeps: {
      include: ['vue-draggable-plus'],
    },
    server: {
      open: true,
      proxy: {
        [env.VITE_API_PREFIX]: {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
          secure: false,
          rewrite: (urlPath) => urlPath.replace(new RegExp(`^${env.VITE_API_PREFIX}`), ''),
        },
      },
    },
    plugins,
    build: {
      chunkSizeWarningLimit: 1000,
      outDir: 'dist',
      minify: 'esbuild',
      esbuild: {
        drop: ['console', 'debugger'],
        legalComments: 'none',
      },
      rollupOptions: {
        output: {
          chunkFileNames: 'static/js/[name]-[hash].js',
          entryFileNames: 'static/js/[name]-[hash].js',
          assetFileNames: 'static/[ext]/[name]-[hash].[ext]',
          manualChunks: (id) => createManualChunkName(id),
        },
      },
    },
    envPrefix: ['VITE', 'FILE'],
  }
})
