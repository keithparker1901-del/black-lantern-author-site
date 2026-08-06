(()=>{
  const isHome=location.pathname==='/'||location.pathname.endsWith('/index.html');

  document.querySelectorAll('[data-year]').forEach(n=>n.textContent=new Date().getFullYear());

  const nav=document.querySelector('.site-nav');
  const toggle=document.querySelector('.nav-toggle');

  if(isHome&&nav&&!nav.querySelector('a[href="/high-pass-chronicles/"]')){
    const blackSalt=nav.querySelector('a[href="/black-salt-cycle/"]');
    const highPass=document.createElement('a');
    highPass.href='/high-pass-chronicles/';
    highPass.textContent='High Pass';
    nav.insertBefore(highPass,blackSalt||null);
  }

  if(toggle&&nav){
    toggle.addEventListener('click',()=>{
      const open=nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded',String(open));
    });
    nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded','false');
    }));
  }

  if(isHome){
    const hero=document.querySelector('.hero');
    const heroCopy=document.querySelector('.hero .hero-copy');
    const heroSeal=document.querySelector('.hero .hero-seal');

    if(hero)hero.classList.add('cael-cinematic');

    if(heroCopy){
      heroCopy.innerHTML=`
        <p class="eyebrow">Old-World Gothic Fantasy by R. Keith Parker</p>
        <h1>Some roads remember who they were built to keep.</h1>
        <p class="lede">Haunted houses. Fae courts. Living ledgers. Salt-bound debts. Mountain roads that remember every bargain.</p>
        <p class="hero-flagship"><strong>At the center stands The Black Lantern Cycle</strong>—a Gothic dark-fantasy series where beautiful customs, ancient laws, and offered mercies must finally answer for their cost.</p>
        <div class="actions">
          <a class="button" href="/black-lantern-cycle/">Enter the Black Lantern Cycle</a>
          <a class="button secondary" href="https://www.amazon.com/dp/B0H1JJJ8QV">Buy Black Lantern Book One</a>
          <a class="text-link hero-all-books" href="/chronicle-library/">Explore all books and series →</a>
        </div>
        <div class="tag-row"><span>Black Lantern flagship</span><span>Three Gothic series</span><span>One official author site</span></div>`;
    }

    if(heroSeal){
      heroSeal.classList.add('cael-hero');
      heroSeal.setAttribute('aria-label','Cael Veyr, Black-Lantern road-witness');
      heroSeal.innerHTML=`
        <img src="/images/characters/cael.webp" alt="Cael Veyr, Black-Lantern road-witness">
        <div class="cael-hero-caption">
          <span>The Black Lantern Cycle</span>
          <strong>Cael Veyr</strong>
          <small>Road-witness. Lantern-bearer.</small>
        </div>`;
    }

    const booksSection=document.querySelector('#books');
    if(booksSection&&!document.querySelector('#series-paths')){
      const section=document.createElement('section');
      section.id='series-paths';
      section.className='section author-series-section';
      section.innerHTML=`
        <div class="section-inner">
          <div class="section-head">
            <div><p class="eyebrow">Choose your road</p><h2>Three series. One old-world Gothic vision.</h2></div>
            <p>The Black Lantern Cycle is the flagship journey. The High Pass Chronicles and The Black Salt Cycle open two more roads into R. Keith Parker’s worlds of witness, law, debt, and consequence.</p>
          </div>
          <div class="series-path-grid">
            <article class="series-path flagship">
              <p class="eyebrow">Flagship series</p>
              <h3>The Black Lantern Cycle</h3>
              <p>A road-witness carrying the Black Lantern enters haunted realms where hospitality becomes debt, grief becomes law, and elegant institutions conceal ancient cruelty.</p>
              <a class="button" href="/black-lantern-cycle/">Enter the Black Lantern Cycle</a>
            </article>
            <article class="series-path">
              <p class="eyebrow">Thirteen standalone reckonings</p>
              <h3>The High Pass Chronicles</h3>
              <p>Haunted mountain roads, old customs, physical proof, and hard-won release—each novel complete in itself.</p>
              <a class="text-link" href="/high-pass-chronicles/">Explore the High Pass Chronicles →</a>
            </article>
            <article class="series-path">
              <p class="eyebrow">Salt, iron, and hidden debt</p>
              <h3>The Black Salt Cycle</h3>
              <p>Dragons, inherited debts, old powers, and kingdoms forced to answer for the laws beneath their prosperity.</p>
              <a class="text-link" href="/black-salt-cycle/">Follow the Black Salt Cycle →</a>
            </article>
          </div>
        </div>`;
      booksSection.before(section);
    }

    const style=document.createElement('style');
    style.textContent=`
      .hero.cael-cinematic{min-height:calc(100vh - 72px);grid-template-columns:minmax(0,1.1fr) minmax(340px,.9fr);position:relative}
      .hero.cael-cinematic:before{content:"";position:absolute;inset:2rem 1.25rem;background:radial-gradient(circle at 78% 42%,rgba(204,156,70,.12),transparent 27%);pointer-events:none}
      .hero.cael-cinematic>*{position:relative;z-index:1}
      .hero-flagship{max-width:46rem;margin:1rem 0 0;color:var(--ink,#eee7d8);font-size:1.05rem}
      .hero-all-books{align-self:center;margin-left:.35rem}
      .hero-seal.cael-hero{position:relative;min-height:570px;padding:0;overflow:hidden;clip-path:none;border:1px solid rgba(218,190,126,.35);background:#080807;box-shadow:0 30px 80px rgba(0,0,0,.48)}
      .cael-hero img{width:100%;height:100%;min-height:570px;object-fit:cover;object-position:center top;display:block;filter:saturate(.88) contrast(1.08)}
      .hero-seal.cael-hero:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(5,5,4,.02) 30%,rgba(5,5,4,.35) 62%,rgba(5,5,4,.96) 100%),linear-gradient(90deg,rgba(5,5,4,.15),transparent 45%);pointer-events:none}
      .cael-hero-caption{position:absolute;z-index:2;left:1.6rem;right:1.6rem;bottom:1.45rem;display:flex;flex-direction:column;text-shadow:0 2px 12px #000}
      .cael-hero-caption span{text-transform:uppercase;letter-spacing:.2em;color:var(--gold2,#e0c887);font-size:.7rem;font-weight:800}
      .cael-hero-caption strong{font-family:var(--serif,Georgia,serif);font-size:2.35rem;line-height:1.05;margin:.25rem 0}
      .cael-hero-caption small{color:#d2c8b6;font-size:.92rem}
      .author-series-section{background:radial-gradient(circle at 18% 15%,rgba(198,154,78,.10),transparent 32%),linear-gradient(180deg,rgba(16,15,13,.98),rgba(9,9,8,.98))}
      .series-path-grid{display:grid;grid-template-columns:1.35fr 1fr 1fr;gap:1.25rem}
      .series-path{position:relative;padding:2rem;border:1px solid rgba(190,154,92,.26);background:rgba(255,255,255,.025);box-shadow:0 18px 44px rgba(0,0,0,.18)}
      .series-path.flagship{border-color:rgba(214,169,88,.66);background:linear-gradient(135deg,rgba(193,141,54,.13),rgba(12,12,11,.86))}
      .series-path.flagship:before{content:"";position:absolute;inset:.55rem;border:1px solid rgba(214,169,88,.16);pointer-events:none}
      .series-path h3{margin:.25rem 0 .8rem;font-size:clamp(1.55rem,2.5vw,2.25rem)}
      .series-path p{position:relative}
      .series-path a{position:relative;display:inline-block;margin-top:.65rem}
      @media(max-width:900px){
        .hero.cael-cinematic{grid-template-columns:1fr;min-height:auto}
        .hero-seal.cael-hero,.cael-hero img{min-height:470px}
        .series-path-grid{grid-template-columns:1fr}
        .hero-all-books{width:100%;margin:.35rem 0 0}
      }
    `;
    document.head.appendChild(style);
  }

  document.querySelectorAll('[data-tabs]').forEach(group=>{
    const tabs=[...group.querySelectorAll('[data-tab]')];
    const panels=[...group.querySelectorAll('[data-panel]')];
    tabs.forEach(tab=>tab.addEventListener('click',()=>{
      const id=tab.dataset.tab;
      tabs.forEach(t=>t.classList.toggle('active',t===tab));
      panels.forEach(p=>p.classList.toggle('active',p.dataset.panel===id));
    }));
  });

  const signup=document.querySelector('[data-signup-form]');
  if(signup){
    signup.addEventListener('submit',async event=>{
      event.preventDefault();
      const status=signup.querySelector('[data-form-status]');
      const button=signup.querySelector('button[type="submit"]');
      const data=new FormData(signup);
      const payload={email:data.get('email'),firstName:data.get('firstName'),consent:data.get('consent')==='on',website:data.get('website')||''};
      status.className='form-status';
      status.textContent='Recording your place on the road…';
      button.disabled=true;
      try{
        const response=await fetch('/api/subscribe/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        const result=await response.json();
        status.textContent=result.message||'The request is complete.';
        status.classList.add(response.ok?'success':'error');
        if(response.ok)signup.reset();
      }catch{
        status.textContent='The road could not be reached. Please try again.';
        status.classList.add('error');
      }finally{button.disabled=false}
    });
  }

  const unsubscribe=document.querySelector('[data-unsubscribe-form]');
  if(unsubscribe){
    const status=unsubscribe.querySelector('[data-unsubscribe-status]');
    const token=new URLSearchParams(location.search).get('token')||'';
    const tokenField=unsubscribe.querySelector('[data-token-field]');
    if(tokenField)tokenField.value=token;
    if(!token&&status){status.textContent='This unsubscribe link is incomplete.';status.classList.add('error')}
    unsubscribe.addEventListener('submit',async event=>{
      event.preventDefault();
      if(!token||!status)return;
      status.textContent='Updating your subscription…';
      try{
        const response=await fetch('/api/unsubscribe/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})});
        const result=await response.json();
        status.textContent=result.message||'The request is complete.';
        status.className=`form-status ${response.ok?'success':'error'}`;
      }catch{
        status.textContent='The request could not be completed. Please email the author.';
        status.className='form-status error';
      }
    });
  }
})();