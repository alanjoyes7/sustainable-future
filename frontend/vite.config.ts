import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '..', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'Earthly Impact',
          short_name: 'Earthly',
          description: 'AI-Powered Waste Classification',
          theme_color: '#4caf50',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            {
              src: '/icon.svg',
              sizes: '192x192 512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            maps: ['leaflet', 'react-leaflet'],
            ai: ['@google/genai'],
            ui: ['lucide-react', 'motion', 'react-hot-toast'],
          },
        },
      },
    },
    server: {
      fs: {
        allow: ['..']
      },
      hmr: process.env.DISABLE_HMR !== 'true'
    },
    envDir: '..',
  };
});
