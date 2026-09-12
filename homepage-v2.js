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

  function storedVisitorId() {
    try { return localStorage.getItem('black_lantern_visitor_id') || ''; }
    catch { return ''; }
  }

  function installReaderFunnelEntry() {
    const newsletterNav = document.querySelector('.nav a[href="#lantern-road"]');
    if (newsletterNav) {
      newsletterNav.href = '/enter/';
      newsletterNav.textContent = 'Free Reader Guide';
      newsletterNav.dataset.trackLabel = 'Nav Free Reader Guide';
    }

    const heroPrimary = document.querySelector('.hero .actions .button:not(.secondary)');
    if (heroPrimary && heroPrimary.getAttribute('href') === '#where-to-begin') {
      heroPrimary.href = '/enter/';
      heroPrimary.textContent = 'Get the free reader guide';
      heroPrimary.dataset.trackLabel = 'Hero Free Reader Guide';
    }

    document.querySelectorAll('a[href="#lantern-road"]').forEach(link => {
      if (link.closest('.latest-card-writing')) {
        link.href = '/enter/';
        link.textContent = 'Get the free guide + progress updates →';
        link.dataset.trackLabel = 'Latest Free Reader Guide';
      }
    });

    const section = document.querySelector('#lantern-road');
    if (section) {
      const eyebrow = section.querySelector('.newsletter-copy .eyebrow');
      const heading = section.querySelector('.newsletter-copy h2');
      const intro = section.querySelector('.newsletter-copy > p:not(.eyebrow)');
      const benefits = section.querySelectorAll('.newsletter-benefits span');
      const panelEyebrow = section.querySelector('.newsletter-panel .eyebrow');
      const panelHeading = section.querySelector('.newsletter-panel h3');
      const panelCopy = section.querySelector('.newsletter-panel > p:not(.eyebrow)');
      const button = section.querySelector('button[type="submit"]');

      if (eyebrow) eyebrow.textContent = 'Your free doorway into the Black Lantern world';
      if (heading) heading.textContent = 'Enter The Lantern Road.';
      if (intro) intro.textContent = 'Start with the free illustrated Valegast Manor Reader Guide, then receive occasional letters from R. Keith Parker with new releases, artwork, maps, and roads worth following.';
      if (benefits[0]) benefits[0].textContent = 'Read an opening excerpt from The Manor That Drank the Road before you buy.';
      if (benefits[1]) benefits[1].textContent = 'Explore Valegast guest-law, official maps, and a spoiler-light introduction to Cael Veyr.';
      if (benefits[2]) benefits[2].textContent = 'Stay for occasional book news and Lantern Road correspondence—never a crowded inbox.';
      if (panelEyebrow) panelEyebrow.textContent = 'Free reader gift';
      if (panelHeading) panelHeading.textContent = 'The Valegast Manor Reader Guide';
      if (panelCopy) panelCopy.textContent = 'Enter your email and the guide will be sent immediately, with both an online edition and a downloadable PDF.';
      if (button) {
        button.textContent = 'Send Me the Free Reader Guide';
        button.dataset.trackLabel = 'Homepage Free Reader Guide Signup';
      }
    }
  }

  installReaderFunnelEntry();

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
        website: String(data.get('website') || ''),
        visitorId: storedVisitorId(),
        path: `${location.pathname}${location.search}`,
        referrer: document.referrer || ''
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
        if (typeof window.gtag === 'function') {
          window.gtag('event','email_signup',{event_category:'reader_funnel',event_label:'homepage_lantern_road'});
        }
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
