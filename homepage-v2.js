(() => {
  'use strict';

  const menuButton = document.querySelector('.menu');
  const nav = document.querySelector('.nav');

  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(open));
    });

    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        menuButton.setAttribute('aria-expanded', 'false');
      });
    });
  }

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const heroBackground = document.querySelector('.hero-bg');
    let ticking = false;

    const updateParallax = () => {
      if (heroBackground) {
        const offset = Math.min(window.scrollY * 0.08, 55);
        heroBackground.style.transform = `translate3d(0, ${offset}px, 0) scale(1.08)`;
      }
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, { passive: true });
  }
})();
