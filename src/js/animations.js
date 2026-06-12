/**
 * Motion system — preloader, reveals, scroll choreography.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------
   Preloader → hero intro
   ------------------------------------------------------------ */
export function runIntro() {
  const preloader = document.getElementById('preloader');
  const countEl = document.getElementById('preloader-count');
  const heroBits = [
    '[data-hero-eyebrow]',
    '#hero-sub',
    '[data-hero-cta]',
    '[data-hero-foot]',
  ];

  // Initial states (screen is covered by the preloader)
  gsap.set(heroBits, { autoAlpha: 0, y: 26 });

  const lines = gsap.utils.toArray('.hero__line');
  let chars = [];
  lines.forEach((line) => {
    const split = new SplitText(line, { type: 'chars', charsClass: 'hero-char' });
    chars = chars.concat(split.chars);
  });
  gsap.set('.hero__title', { autoAlpha: 1 });
  gsap.set(chars, { yPercent: 118, rotate: 4 });
  lines.forEach((l) => (l.style.overflow = 'hidden'));

  const finish = () => {
    document.body.removeAttribute('data-loading');

    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to('.preloader__center', { autoAlpha: 0, y: -24, duration: 0.45 }, 0)
      .to('.preloader__panel--top', { yPercent: -101, duration: 0.9 }, 0.18)
      .to('.preloader__panel--bottom', { yPercent: 101, duration: 0.9 }, 0.18)
      .set(preloader, { display: 'none' })
      .to(chars, { yPercent: 0, rotate: 0, duration: 1.1, stagger: 0.022 }, 0.42)
      .to('[data-hero-eyebrow]', { autoAlpha: 1, y: 0, duration: 0.8 }, 0.75)
      .to('#hero-sub', { autoAlpha: 1, y: 0, duration: 0.8 }, 0.9)
      .to('[data-hero-cta]', { autoAlpha: 1, y: 0, duration: 0.8 }, 1.0)
      .to('[data-hero-foot]', { autoAlpha: 1, y: 0, duration: 0.8 }, 1.1)
      .add(() => ScrollTrigger.refresh());
    return tl;
  };

  if (reduced) {
    if (countEl) countEl.textContent = '100';
    gsap.set(chars, { yPercent: 0, rotate: 0 });
    gsap.set(heroBits, { autoAlpha: 1, y: 0 });
    gsap.set(preloader, { display: 'none' });
    document.body.removeAttribute('data-loading');
    ScrollTrigger.refresh();
    return;
  }

  const counter = { v: 0 };
  const ready = Promise.all([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise((res) => {
      gsap.to(counter, {
        v: 100,
        duration: 1.35,
        ease: 'power2.inOut',
        onUpdate: () => {
          if (countEl) countEl.textContent = Math.round(counter.v);
        },
        onComplete: res,
      });
    }),
  ]);

  ready.then(finish);
}

/* ------------------------------------------------------------
   Scroll-driven choreography
   ------------------------------------------------------------ */
export function initScrollAnimations() {
  /* Generic fade-up reveals */
  gsap.utils.toArray('[data-reveal]').forEach((el) => {
    gsap.fromTo(
      el,
      { autoAlpha: 0, y: 30 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 1.05,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 86%' },
      }
    );
  });

  /* Masked line reveals for section titles */
  gsap.utils.toArray('[data-split]').forEach((el) => {
    const split = new SplitText(el, {
      type: 'lines',
      linesClass: 'split-line',
    });
    split.lines.forEach((line) => {
      const wrap = document.createElement('div');
      wrap.style.overflow = 'hidden';
      wrap.style.display = 'block';
      line.parentNode.insertBefore(wrap, line);
      wrap.appendChild(line);
    });
    gsap.from(split.lines, {
      yPercent: 105,
      duration: 1.05,
      ease: 'expo.out',
      stagger: 0.09,
      scrollTrigger: { trigger: el, start: 'top 84%' },
    });
  });

  /* Manifesto — word-by-word scrub */
  const manifesto = document.getElementById('manifesto-text');
  if (manifesto) {
    const split = new SplitText(manifesto, { type: 'words', wordsClass: 'word' });
    gsap.to(split.words, {
      opacity: 1,
      stagger: 0.06,
      ease: 'none',
      scrollTrigger: {
        trigger: manifesto,
        start: 'top 78%',
        end: 'bottom 40%',
        scrub: 0.6,
      },
    });
  }

  /* Service rows */
  const services = gsap.utils.toArray('[data-service]');
  if (services.length) {
    gsap.from(services, {
      autoAlpha: 0,
      y: 44,
      duration: 0.9,
      ease: 'power3.out',
      stagger: 0.09,
      scrollTrigger: { trigger: '.services__list', start: 'top 82%' },
    });
  }

  /* System — horizontal scroll on desktop, stacked on mobile */
  const track = document.querySelector('[data-system-track]');
  if (track) {
    ScrollTrigger.matchMedia({
      '(min-width: 901px)': () => {
        const getDistance = () => track.scrollWidth - window.innerWidth + 80;
        gsap.to(track, {
          x: () => -getDistance(),
          ease: 'none',
          scrollTrigger: {
            trigger: '.system',
            start: 'top top',
            end: () => '+=' + getDistance(),
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });
      },
      '(max-width: 900px)': () => {
        gsap.utils.toArray('.syscard').forEach((card) => {
          gsap.from(card, {
            autoAlpha: 0,
            y: 40,
            duration: 0.85,
            ease: 'power3.out',
            scrollTrigger: { trigger: card, start: 'top 88%' },
          });
        });
      },
    });
  }

  /* Stat counters */
  gsap.utils.toArray('[data-counter]').forEach((el) => {
    const target = parseFloat(el.getAttribute('data-counter'));
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target,
      duration: 1.7,
      ease: 'power2.out',
      onUpdate: () => (el.textContent = Math.round(obj.v)),
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });

  /* Work cards */
  gsap.utils.toArray('[data-project]').forEach((card, idx) => {
    gsap.from(card, {
      autoAlpha: 0,
      y: 60,
      duration: 1.05,
      ease: 'power3.out',
      delay: (idx % 2) * 0.12,
      scrollTrigger: { trigger: card, start: 'top 88%' },
    });
  });

  /* Hero canvas parallax-out on scroll */
  gsap.to('.hero__inner', {
    yPercent: -12,
    autoAlpha: 0.25,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
  });
}

/* ------------------------------------------------------------
   Marquee — duplicate content for a seamless loop
   ------------------------------------------------------------ */
export function initMarquee() {
  document.querySelectorAll('[data-marquee] .marquee__track').forEach((trackEl) => {
    trackEl.innerHTML += trackEl.innerHTML;
  });
}

/* ------------------------------------------------------------
   Nav — solid after scroll, hides on the way down
   ------------------------------------------------------------ */
export function initNav(lenis) {
  const nav = document.getElementById('nav');
  if (!nav) return;
  let lastY = 0;

  const onScroll = (y) => {
    nav.classList.toggle('is-scrolled', y > 40);
    if (y > 260 && y > lastY + 4) nav.classList.add('is-hidden');
    else if (y < lastY - 4 || y <= 260) nav.classList.remove('is-hidden');
    lastY = y;
  };

  if (lenis) {
    lenis.on('scroll', ({ scroll }) => onScroll(scroll));
  } else {
    window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });
  }
}
