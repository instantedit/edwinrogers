/**
 * Edwin Rogers — Attention, Engineered.
 * Entry point: smooth scroll, WebGL hero, cursor, motion system.
 */
import './styles/main.css';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createCursor } from './js/cursor.js';
import { runIntro, initScrollAnimations, initMarquee, initNav } from './js/animations.js';

gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Smooth scroll ---------- */
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ duration: 1.15, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ---------- Anchor navigation ---------- */
function scrollToTarget(hash) {
  const target = document.querySelector(hash);
  if (!target) return;
  if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 });
  else target.scrollIntoView({ behavior: 'smooth' });
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const hash = link.getAttribute('href');
    if (hash.length > 1) {
      e.preventDefault();
      closeMenu();
      scrollToTarget(hash);
    }
  });
});

/* ---------- Mobile menu ---------- */
const burger = document.getElementById('nav-burger');
const menu = document.getElementById('menu');

function closeMenu() {
  if (!menu || !burger) return;
  menu.classList.remove('is-open');
  menu.setAttribute('aria-hidden', 'true');
  burger.setAttribute('aria-expanded', 'false');
  if (lenis) lenis.start();
}

function openMenu() {
  if (!menu || !burger) return;
  menu.classList.add('is-open');
  menu.setAttribute('aria-hidden', 'false');
  burger.setAttribute('aria-expanded', 'true');
  if (lenis) lenis.stop();
}

if (burger && menu) {
  burger.addEventListener('click', () => {
    menu.classList.contains('is-open') ? closeMenu() : openMenu();
  });
  menu.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => closeMenu())
  );
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
}

/* ---------- WebGL hero (lazy — Three.js loads in parallel with the intro) ---------- */
const canvas = document.getElementById('webgl');
if (canvas) {
  import('./js/webgl.js')
    .then(({ createHeroScene }) => createHeroScene(canvas))
    .catch((err) => {
      // WebGL unavailable — the design holds up without it
      canvas.style.display = 'none';
      console.warn('WebGL disabled:', err);
    });
}

/* ---------- Cursor + motion ---------- */
createCursor();
initMarquee();
initNav(lenis);
runIntro();
initScrollAnimations();
