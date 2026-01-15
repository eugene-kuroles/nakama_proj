/**
 * ⚡ Vite Configuration
 * 
 * Vite — это сборщик для React (и других фреймворков).
 * Он очень быстрый благодаря использованию ES модулей.
 * 
 * Что настроено:
 * - React plugin для поддержки JSX
 * - Dev server на порту 5173
 * - Proxy для API запросов (опционально)
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  server: {
    port: 5173,  // Порт dev сервера
    open: true,  // Автоматически открыть браузер при запуске
    
    // Proxy для API запросов (если нужно избежать CORS)
    // Раскомментируй если будут проблемы с CORS
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:8000',
    //     changeOrigin: true,
    //   }
    // }
  },
  
  build: {
    outDir: 'dist',  // Папка для production сборки
  }
})
