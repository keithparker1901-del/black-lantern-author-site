(() => {
  'use strict';
  const form = document.querySelector('#enter-lantern-form');
  if (!form) return;
  const status = form.querySelector('.status');
  const submit = form.querySelector('button[type="submit"]');
  const successLinks = document.querySelector('.success-links');

  function visitorId(){
    try { return localStorage.getItem('black_lantern_visitor_id') || ''; }
    catch { return ''; }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const data = new FormData(form);
    const payload = {
      firstName: String(data.get('firstName') || '').trim(),
      email: String(data.get('email') || '').trim(),
      consent: data.get('consent') === 'on',
      website: String(data.get('website') || ''),
      visitorId: visitorId(),
      path: `${location.pathname}${location.search}`,
      referrer: document.referrer || ''
    };

    status.classList.remove('error');
    status.textContent = 'Opening your place on the Lantern Road…';
    submit.disabled = true;

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.message || 'The road could not record your address. Please try again.');
      status.textContent = 'Welcome to the Lantern Road. Your guide is on its way to your inbox.';
      form.reset();
      if (successLinks) successLinks.classList.add('show');
      if (typeof window.gtag === 'function') {
        window.gtag('event','email_signup',{event_category:'reader_funnel',event_label:'enter_lantern_road'});
      }
    } catch (error) {
      status.classList.add('error');
      status.textContent = error.message || 'Something went wrong. Please try again.';
    } finally {
      submit.disabled = false;
    }
  });
})();
