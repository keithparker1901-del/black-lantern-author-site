(() => {
  'use strict';

  const isHome = location.pathname === '/' || location.pathname.endsWith('/index.html');
  if (!isHome) return;

  const start = () => {
    const hero = document.querySelector('.hero.cael-cinematic');
    const cael = hero?.querySelector('.cael-hero');
    if (!hero || !cael || hero.querySelector('.cinematic-atmosphere')) return;

    hero.insertAdjacentHTML('afterbegin', `
      <div class="cinematic-bg" aria-hidden="true"></div>
      <div class="cinematic-atmosphere" aria-hidden="true">
        <span class="mist mist-one"></span>
        <span class="mist mist-two"></span>
        <span class="mist mist-three"></span>
        <span class="lantern-aura"></span>
        <span class="ember-field"></span>
      </div>`);

    cael.insertAdjacentHTML('beforeend', `
      <a class="hero-book-reveal" href="/books/the-manor-that-drank-the-road/" aria-label="View The Manor That Drank the Road">
        <img src="/images/covers/manor.jpg" alt="The Manor That Drank the Road book cover">
        <span><small>Black Lantern Book One</small><strong>Begin the journey</strong></span>
      </a>`);

    const style = document.createElement('style');
    style.textContent = `
      body{overflow-x:hidden}
      .hero.cael-cinematic{max-width:none;width:100%;padding-inline:max(1.25rem,calc((100vw - 1180px)/2));overflow:hidden;isolation:isolate;background:#080908}
      .cinematic-bg{position:absolute!important;z-index:-3!important;inset:0!important;background-image:linear-gradient(90deg,rgba(7,8,7,.97) 0%,rgba(7,8,7,.82) 42%,rgba(7,8,7,.25) 72%,rgba(7,8,7,.62) 100%),linear-gradient(180deg,rgba(7,8,7,.08),#080908 96%),url('/images/hero/lantern-road-hero.webp');background-size:cover;background-position:center;transform:scale(1.08);will-change:transform}
      .cinematic-atmosphere{position:absolute!important;z-index:-1!important;inset:0!important;overflow:hidden;pointer-events:none}
      .mist{position:absolute;left:-25%;width:150%;height:34%;border-radius:50%;background:radial-gradient(ellipse at center,rgba(224,224,205,.16),rgba(175,182,166,.07) 38%,transparent 70%);filter:blur(22px);opacity:.52;will-change:transform}
      .mist-one{bottom:8%;animation:mistDrift 24s linear infinite}
      .mist-two{bottom:28%;opacity:.28;animation:mistDriftReverse 31s linear infinite}
      .mist-three{top:5%;opacity:.16;animation:mistDrift 40s linear infinite}
      .lantern-aura{position:absolute;right:20%;top:34%;width:20rem;height:20rem;border-radius:50%;background:radial-gradient(circle,rgba(255,193,86,.24),rgba(205,126,31,.08) 38%,transparent 70%);filter:blur(14px);animation:lanternPulse 4.8s ease-in-out infinite}
      .ember-field{position:absolute;inset:0;background-image:radial-gradient(circle,rgba(255,196,91,.85) 0 1px,transparent 1.6px),radial-gradient(circle,rgba(255,145,54,.65) 0 1px,transparent 1.5px);background-size:73px 91px,119px 137px;background-position:12px 18px,52px 71px;opacity:.22;animation:embersRise 18s linear infinite}
      .hero.cael-cinematic .hero-copy{animation:heroCopyIn 1.1s ease-out both}
      .hero.cael-cinematic .cael-hero{animation:caelIn 1.35s .12s cubic-bezier(.2,.8,.2,1) both;box-shadow:0 30px 90px rgba(0,0,0,.62),0 0 65px rgba(194,137,48,.1)}
      .hero-book-reveal{position:absolute;z-index:4;right:-1rem;bottom:1.2rem;width:168px;text-decoration:none;transform:translateY(38px) rotate(2deg);opacity:0;animation:bookReveal 1s 1.1s cubic-bezier(.16,.84,.24,1) forwards;filter:drop-shadow(0 22px 24px rgba(0,0,0,.55))}
      .hero-book-reveal img{display:block;width:100%;min-height:0;height:auto;aspect-ratio:2/3;object-fit:cover;border:1px solid rgba(235,204,132,.7)}
      .hero-book-reveal span{display:block;padding:.7rem .75rem;background:rgba(8,8,7,.92);border:1px solid rgba(218,190,126,.35);border-top:0}
      .hero-book-reveal small{display:block;color:var(--gold2,#e0c887);text-transform:uppercase;letter-spacing:.13em;font-size:.58rem}
      .hero-book-reveal strong{display:block;font-family:var(--serif,Georgia,serif);font-size:.94rem;margin-top:.2rem}
      .hero-book-reveal:hover{transform:translateY(-6px) rotate(0deg)!important}
      .hero-book-reveal{transition:transform .35s ease}
      @keyframes mistDrift{from{transform:translate3d(-8%,0,0)}to{transform:translate3d(8%,-2%,0)}}
      @keyframes mistDriftReverse{from{transform:translate3d(8%,0,0)}to{transform:translate3d(-8%,2%,0)}}
      @keyframes lanternPulse{0%,100%{opacity:.55;transform:scale(.94)}50%{opacity:1;transform:scale(1.08)}}
      @keyframes embersRise{from{transform:translateY(5%)}to{transform:translateY(-12%)}}
      @keyframes heroCopyIn{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
      @keyframes caelIn{from{opacity:0;transform:translateX(45px) scale(.97)}to{opacity:1;transform:none}}
      @keyframes bookReveal{to{opacity:1;transform:translateY(0) rotate(2deg)}}
      @media(max-width:900px){
        .cinematic-bg{background-position:64% center;opacity:.72}
        .hero-book-reveal{right:.7rem;bottom:.7rem;width:132px}
        .lantern-aura{right:4%;top:55%}
      }
      @media(prefers-reduced-motion:reduce){
        .mist,.lantern-aura,.ember-field,.hero.cael-cinematic .hero-copy,.hero.cael-cinematic .cael-hero,.hero-book-reveal{animation:none!important}
        .hero-book-reveal{opacity:1;transform:none}
        .cinematic-bg{transform:none!important}
      }
    `;
    document.head.appendChild(style);

    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      let ticking = false;
      const parallax = () => {
        const rect = hero.getBoundingClientRect();
        const progress = Math.max(-1, Math.min(1, -rect.top / Math.max(rect.height, 1)));
        const bg = hero.querySelector('.cinematic-bg');
        const portrait = cael.querySelector('img');
        if (bg) bg.style.transform = `translate3d(0,${progress * 34}px,0) scale(1.08)`;
        if (portrait) portrait.style.transform = `translate3d(0,${progress * 18}px,0) scale(1.03)`;
        ticking = false;
      };
      addEventListener('scroll', () => {
        if (!ticking) {
          requestAnimationFrame(parallax);
          ticking = true;
        }
      }, { passive: true });
      parallax();
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
