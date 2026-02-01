import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // Proxy backend routes during development
      // This mimics nginx's routing behavior in production
      '/auth': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/tasks': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/sync': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      },
      // Task mutation endpoints
      '/add-task': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/edit-task': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/delete-task': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/complete-task': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/modify-task': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/add-tasks': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/complete-tasks': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/delete-tasks': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // Taskchampion sync server
      '/taskchampion': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/taskchampion/, ''),
      },
    },
  },
});
