import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so the static build works on any host/subpath
  base: './',
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          motion: ['gsap', 'gsap/ScrollTrigger', 'gsap/SplitText', 'lenis'],
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
});
