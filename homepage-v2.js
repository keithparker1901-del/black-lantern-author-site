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

  const newsletterForm = document.querySelector('#lantern-road-form');
  if (newsletterForm) {
    const status = newsletterForm.querySelector('.newsletter-status');
    const submit = newsletterForm.querySelector('button[type="submit"]');
    newsletterForm.addEventListener('submit', async event => {
      event.preventDefault();
      const data = new FormData(newsletterForm);
      const payload = {
        firstName: String(data.get('firstName') || '').trim(),
        email: String(data.get('email') || '').trim(),
        consent: data.get('consent') === 'on',
        website: String(data.get('website') || '')
      };
      status.classList.remove('error');
      status.textContent = 'Recording your place on the road…';
      submit.disabled = true;
      try {
        const response = await fetch('/api/subscribe', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(payload)
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) throw new Error(result.message || 'The road could not record your address. Please try again.');
        status.textContent = result.message || 'Welcome to the Lantern Road. Check your inbox.';
        newsletterForm.reset();
      } catch (error) {
        status.classList.add('error');
        status.textContent = error.message || 'Something went wrong. Please try again.';
      } finally {
        submit.disabled = false;
      }
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
