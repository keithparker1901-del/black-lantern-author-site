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
        const response=await fetch('/api/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
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
      try{const response=await fetch('/api/unsubscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})});const result=await response.json();status.textContent=result.message||'The request is complete.';status.className=`form-status ${response.ok?'success':'error'}`}
      catch{status.textContent='The request could not be completed. Please email the author.';status.className='form-status error'}
    });
  }
})();
