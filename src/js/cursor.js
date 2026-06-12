/**
 * Custom cursor — accent dot + trailing ring.
 * Grows and shows a label over interactive elements.
 * Magnetic elements gently pull toward the pointer.
 */
import gsap from 'gsap';

export function createCursor() {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!fine) return;

  const root = document.getElementById('cursor');
  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  const label = document.getElementById('cursor-label');
  if (!root || !dot || !ring) return;

  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const dotPos = { ...pos };
  const ringPos = { ...pos };

  window.addEventListener(
    'pointermove',
    (e) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
    },
    { passive: true }
  );

  gsap.ticker.add(() => {
    dotPos.x += (pos.x - dotPos.x) * 0.5;
    dotPos.y += (pos.y - dotPos.y) * 0.5;
    ringPos.x += (pos.x - ringPos.x) * 0.16;
    ringPos.y += (pos.y - ringPos.y) * 0.16;
    dot.style.transform = `translate(${dotPos.x}px, ${dotPos.y}px)`;
    ring.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px)`;
  });

  // Hover states
  const hoverables = 'a, button, [data-cursor]';
  document.addEventListener('pointerover', (e) => {
    const el = e.target.closest(hoverables);
    if (!el) return;
    root.classList.add('is-active');
    if (label) label.textContent = el.getAttribute('data-cursor') || '';
  });
  document.addEventListener('pointerout', (e) => {
    if (e.target.closest(hoverables)) {
      root.classList.remove('is-active');
      if (label) label.textContent = '';
    }
  });

  // Magnetic pull
  if (!reduced) {
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      const strength = 0.32;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * strength;
        const y = (e.clientY - (r.top + r.height / 2)) * strength;
        gsap.to(el, { x, y, duration: 0.4, ease: 'power3.out' });
      });
      el.addEventListener('pointerleave', () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
      });
    });
  }
}
