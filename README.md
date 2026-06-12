# edwinrogers.com — Attention, Engineered.

Awwwards-calibre portfolio/conversion site for Edwin Rogers: AI-first marketing
systems and attention-grabbing websites.

**Stack:** Vite · Three.js (custom GLSL particle field) · GSAP (ScrollTrigger + SplitText) · Lenis smooth scroll. No framework — pure performance.

## Highlights

- **WebGL "Signal Field" hero** — a 36k-particle noise terrain driven by a custom
  shader. The cursor injects energy: particles rise, brighten and shift to the
  accent colour. Attention made visible.
- **Preloader** with counter → curtain reveal → masked char-by-char headline.
- **Scroll choreography** — word-scrub manifesto, masked line titles, pinned
  horizontal "How the system works" section, stat counters, magnetic buttons,
  custom cursor, infinite brand marquee.
- **Performance** — Three.js code-split and lazy-loaded (critical JS ≈ 62 kB gzip),
  DPR clamped, rendering paused off-screen, mobile-tuned particle density.
- **Accessibility** — full `prefers-reduced-motion` support (static field, no
  smooth-scroll hijack), semantic HTML, keyboard-visible focus states.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
npm run preview  # serve the production build
```

## Deploy

Static output in `dist/` — drop on any host (Vercel, Netlify, Cloudflare Pages).
`base: './'` is set, so it also works from a sub-path. Point the
`edwinrogers.com` domain at the host of choice. Funnel links (`/audit`,
`/contact`, `/blog`, `/pricing`) point at the existing absolute URLs, so they
keep working wherever this is hosted.
