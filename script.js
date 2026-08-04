(()=>{
  document.querySelectorAll('[data-year]').forEach(n=>n.textContent=new Date().getFullYear());
  const toggle=document.querySelector('.nav-toggle');
  const nav=document.querySelector('.site-nav');
  if(toggle&&nav){toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open))});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');toggle.setAttribute('aria-expanded','false')}))}

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
      status.className='form-status';status.textContent='Recording your place on the road…';button.disabled=true;
      try{
        const response=await fetch('/api/subscribe/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        const result=await response.json();
        status.textContent=result.message||'The request is complete.';
        status.classList.add(response.ok?'success':'error');
        if(response.ok) signup.reset();
      }catch(error){status.textContent='The road could not be reached. Please try again.';status.classList.add('error')}
      finally{button.disabled=false}
    });
  }

  const unsubscribe=document.querySelector('[data-unsubscribe-form]');
  if(unsubscribe){
    const status=unsubscribe.querySelector('[data-unsubscribe-status]');
    const token=new URLSearchParams(location.search).get('token')||'';
    unsubscribe.querySelector('[data-token-field]').value=token;
    if(!token){status.textContent='This unsubscribe link is incomplete.';status.classList.add('error')}
    unsubscribe.addEventListener('submit',async event=>{
      event.preventDefault();
      if(!token)return;
      status.textContent='Updating your subscription…';
      try{const response=await fetch('/api/unsubscribe/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})});const result=await response.json();status.textContent=result.message||'The request is complete.';status.className=`form-status ${response.ok?'success':'error'}`}
      catch{status.textContent='The request could not be completed. Please email the author.';status.className='form-status error'}
    });
  }

  /* Click-to-enlarge gallery for portraits, covers, maps, illustrations, and photographs. */
  const lightboxStyles=document.createElement('link');
  lightboxStyles.rel='stylesheet';
  lightboxStyles.href='/lightbox.css';
  document.head.appendChild(lightboxStyles);

  const backgroundUrl=element=>{
    const value=getComputedStyle(element).backgroundImage||'';
    const urls=[...value.matchAll(/url\((?:"|')?(.*?)(?:"|')?\)/g)].map(match=>match[1]);
    return urls.length?urls[urls.length-1]:'';
  };

  const captionFor=(source,image)=>{
    const explicit=source.dataset.lightboxCaption||image?.dataset.lightboxCaption;
    if(explicit)return explicit.trim();
    if(image?.alt?.trim())return image.alt.trim();
    const named=source.querySelector?.('strong,h2,h3');
    if(named?.textContent?.trim())return named.textContent.trim();
    const aria=source.getAttribute('aria-label');
    if(aria)return aria.replace(/^(open|view|enlarge)\s+/i,'').trim();
    const card=source.closest('article,figure,.card,.book-card,.map-card,.character-card');
    const heading=card?.querySelector('h2,h3,strong');
    return heading?.textContent?.trim()||'Expanded image';
  };

  const sources=[...document.querySelectorAll('main img:not([data-no-lightbox]),main .portrait-letter,main .cover,main .map-placeholder,main .book-illustration,main .illustration,main .plate,main [data-lightbox-src]')];
  const items=[];
  const usedTriggers=new Set();

  sources.forEach(source=>{
    const image=source.tagName==='IMG'?source:null;
    const src=source.dataset.lightboxSrc||image?.currentSrc||image?.src||backgroundUrl(source);
    if(!src)return;
    const trigger=source.closest('a,button')||source;
    if(usedTriggers.has(trigger))return;
    usedTriggers.add(trigger);
    const item={trigger,source,src,caption:captionFor(source,image)};
    const index=items.push(item)-1;
    trigger.classList.add('lightbox-trigger');
    trigger.setAttribute('aria-haspopup','dialog');
    if(!trigger.getAttribute('aria-label'))trigger.setAttribute('aria-label',`Enlarge ${item.caption}`);
    if(!/^(A|BUTTON)$/.test(trigger.tagName)){
      trigger.tabIndex=0;
      trigger.setAttribute('role','button');
      trigger.addEventListener('keydown',event=>{
        if(event.key==='Enter'||event.key===' '){event.preventDefault();openLightbox(index)}
      });
    }
    trigger.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      openLightbox(index);
    });
  });

  if(items.length){
    const lightbox=document.createElement('div');
    lightbox.className='image-lightbox';
    lightbox.hidden=true;
    lightbox.tabIndex=-1;
    lightbox.setAttribute('role','dialog');
    lightbox.setAttribute('aria-modal','true');
    lightbox.setAttribute('aria-label','Expanded image viewer');
    lightbox.innerHTML=`
      <button class="image-lightbox__button image-lightbox__close" type="button" aria-label="Close expanded image" data-lightbox-close>×</button>
      <figure class="image-lightbox__figure">
        <img class="image-lightbox__image" alt="">
        <figcaption class="image-lightbox__caption"></figcaption>
        <div class="image-lightbox__controls" aria-label="Image navigation">
          <button class="image-lightbox__button" type="button" aria-label="Previous image" data-lightbox-prev>‹</button>
          <span class="image-lightbox__counter" aria-live="polite"></span>
          <button class="image-lightbox__button" type="button" aria-label="Next image" data-lightbox-next>›</button>
        </div>
      </figure>`;
    document.body.appendChild(lightbox);

    const expanded=lightbox.querySelector('.image-lightbox__image');
    const caption=lightbox.querySelector('.image-lightbox__caption');
    const counter=lightbox.querySelector('.image-lightbox__counter');
    const prev=lightbox.querySelector('[data-lightbox-prev]');
    const next=lightbox.querySelector('[data-lightbox-next]');
    let current=0;
    let lastFocused=null;

    const show=index=>{
      current=(index+items.length)%items.length;
      const item=items[current];
      expanded.src=item.src;
      expanded.alt=item.caption;
      caption.textContent=item.caption;
      counter.textContent=`${current+1} / ${items.length}`;
      const multiple=items.length>1;
      prev.hidden=!multiple;
      next.hidden=!multiple;
      counter.hidden=!multiple;
    };

    window.openLightbox=index=>{
      lastFocused=document.activeElement;
      show(index);
      lightbox.hidden=false;
      document.body.classList.add('lightbox-open');
      requestAnimationFrame(()=>lightbox.classList.add('is-open'));
      lightbox.focus();
    };

    const closeLightbox=()=>{
      lightbox.classList.remove('is-open');
      document.body.classList.remove('lightbox-open');
      setTimeout(()=>{lightbox.hidden=true;expanded.removeAttribute('src')},200);
      if(lastFocused?.focus)lastFocused.focus();
    };

    lightbox.querySelector('[data-lightbox-close]').addEventListener('click',closeLightbox);
    prev.addEventListener('click',()=>show(current-1));
    next.addEventListener('click',()=>show(current+1));
    lightbox.addEventListener('click',event=>{if(event.target===lightbox)closeLightbox()});
    document.addEventListener('keydown',event=>{
      if(lightbox.hidden)return;
      if(event.key==='Escape')closeLightbox();
      if(event.key==='ArrowLeft')show(current-1);
      if(event.key==='ArrowRight')show(current+1);
    });
  }
})();
