(() => {
  'use strict';

  const AUTHOR_ID = 'https://rkeithparkerbooks.com/#author';
  const AUTHOR = {
    '@type':'Person',
    '@id':AUTHOR_ID,
    name:'R. Keith Parker',
    url:'https://rkeithparkerbooks.com/',
    image:'https://rkeithparkerbooks.com/images/author/r-keith-parker-chateau.webp',
    jobTitle:'Author',
    sameAs:[
      'https://www.goodreads.com/author/show/71347649.R_Keith_Parker',
      'https://www.bookbub.com/authors/r-keith-parker',
      'https://www.facebook.com/RKeithParkerAuthor/'
    ]
  };

  const asinIdentifier = value => ({'@type':'PropertyValue',propertyID:'ASIN',value});
  const amazonOffer = asin => ({'@type':'Offer',url:`https://www.amazon.com/dp/${asin}`,availability:'https://schema.org/InStock'});
  const authorRef = {'@id':AUTHOR_ID};

  const AMAZON_CATALOG = [
    {
      title:'The Manor That Drank the Road',
      asin:'B0H1JJJ8QV',
      subtitle:'An Old-World Gothic Fantasy of Guest-Law, Hidden Names, and the Black Lantern',
      prices:[['Kindle','$3.99'],['Paperback','$14.99'],['Hardcover','$21.99']]
    },
    {
      title:'The Valley That Laughed at the Lantern',
      asin:'B0H92DBSHV',
      subtitle:'An Old-World Gothic Fantasy of Grief-Law, Borrowed Names, and the Black Lantern',
      prices:[['Kindle','$4.99'],['Paperback','$22.99'],['Hardcover','$39.99']]
    },
    {
      title:'The Salt Road That Fed the Dragon',
      asin:'B0H4N58LDG',
      subtitle:'An Old-World Gothic Fantasy of Salt, Iron, and Hidden Debt',
      prices:[['Kindle','$2.99']]
    }
  ];

  const priceLine = entry => entry.prices.map(([format,price])=>`${format} ${price}`).join(' · ');

  function installAmazonCatalogInfo(){
    if(!document.querySelector('style[data-amazon-price-style]')){
      const style=document.createElement('style');
      style.dataset.amazonPriceStyle='true';
      style.textContent=`
        .amazon-price-line{margin:.72rem 0 .15rem;color:#e0c887;font-size:.92rem;line-height:1.55;font-weight:700;letter-spacing:.01em}
        .amazon-price-line strong{color:inherit}
        .amazon-price-note{display:block;color:#bdb3a2;font-size:.76rem;font-weight:500;margin-top:.12rem}
      `;
      document.head.append(style);
    }

    const officialOld='An Old-World Gothic Fantasy of Stolen Grief, False Mercy, and the Black Lantern';
    const officialNew='An Old-World Gothic Fantasy of Grief-Law, Borrowed Names, and the Black Lantern';
    document.querySelectorAll('p,span,div').forEach(node=>{
      if(node.children.length===0 && node.textContent?.trim()===officialOld) node.textContent=officialNew;
    });
    document.querySelectorAll('meta[name="description"],meta[property="og:description"],meta[name="twitter:description"]').forEach(meta=>{
      if((meta.content||'').includes('stolen grief, false mercy')) meta.content=meta.content.replace(/stolen grief, false mercy/gi,'grief-law, borrowed names');
    });

    AMAZON_CATALOG.forEach(entry=>{
      const headings=[...document.querySelectorAll('h1,h2,h3,strong')].filter(h=>h.textContent?.trim()===entry.title);
      headings.forEach(heading=>{
        const container=heading.closest('article')||heading.closest('.page-hero')||heading.parentElement;
        if(!container||container.querySelector(`.amazon-price-line[data-asin="${entry.asin}"]`))return;
        const line=document.createElement('p');
        line.className='amazon-price-line';
        line.dataset.asin=entry.asin;
        line.innerHTML=`<strong>Amazon.com:</strong> ${priceLine(entry)}<span class="amazon-price-note">Current U.S. list prices; marketplace prices may vary.</span>`;
        const action=container.querySelector('.actions,.book-actions,.latest-links,.begin-actions');
        if(action)action.before(line);else heading.insertAdjacentElement('afterend',line);
      });

      document.querySelectorAll(`a[href*="${entry.asin}"],a[href="/books/${entry.asin}/"]`).forEach(anchor=>{
        const container=anchor.closest('article');
        if(!container||container.querySelector(`.amazon-price-line[data-asin="${entry.asin}"]`))return;
        const line=document.createElement('p');
        line.className='amazon-price-line';
        line.dataset.asin=entry.asin;
        line.innerHTML=`<strong>Amazon.com:</strong> ${priceLine(entry)}<span class="amazon-price-note">Current U.S. list prices; marketplace prices may vary.</span>`;
        const action=container.querySelector('.actions,.book-actions,.latest-links,.begin-actions');
        if(action)action.before(line);else container.append(line);
      });
    });

    if(location.pathname==='/black-lantern-cycle/'||location.pathname==='/black-lantern-cycle/index.html'){
      const cycleLinks=[
        ['/books/the-manor-that-drank-the-road/','B0H1JJJ8QV'],
        ['/books/the-valley-that-laughed-at-the-lantern/','B0H92DBSHV']
      ];
      cycleLinks.forEach(([href,asin])=>{
        const anchor=document.querySelector(`a[href="${href}"]`);
        const entry=AMAZON_CATALOG.find(item=>item.asin===asin);
        const card=anchor?.closest('article');
        if(!entry||!card||card.querySelector(`.amazon-price-line[data-asin="${asin}"]`))return;
        const line=document.createElement('p');
        line.className='amazon-price-line';
        line.dataset.asin=asin;
        line.innerHTML=`<strong>Amazon.com:</strong> ${priceLine(entry)}<span class="amazon-price-note">Current U.S. list prices; marketplace prices may vary.</span>`;
        anchor.before(line);
      });
    }
  }

  function blackLanternSeries(includeParts=true){
    const series={
      '@type':'BookSeries',
      '@id':'https://rkeithparkerbooks.com/black-lantern-cycle/#series',
      name:'The Black Lantern Cycle',
      url:'https://rkeithparkerbooks.com/black-lantern-cycle/',
      author:authorRef,
      genre:['Gothic fantasy','Dark fantasy'],
      description:"R. Keith Parker's flagship old-world Gothic fantasy cycle of haunted roads, living laws, dangerous mercy, and the Black Lantern."
    };
    if(includeParts)series.hasPart=[
      {'@id':'https://rkeithparkerbooks.com/books/the-manor-that-drank-the-road/#book'},
      {'@id':'https://rkeithparkerbooks.com/books/the-valley-that-laughed-at-the-lantern/#book'},
      {'@id':'https://rkeithparkerbooks.com/books/the-chateau-that-wrote-the-living/#book'}
    ];
    return series;
  }

  const bookSchemas={
    '/books/the-manor-that-drank-the-road/':{
      '@type':['Book','Product'],'@id':'https://rkeithparkerbooks.com/books/the-manor-that-drank-the-road/#book',
      name:'The Manor That Drank the Road',url:'https://rkeithparkerbooks.com/books/the-manor-that-drank-the-road/',
      author:authorRef,isPartOf:{'@id':'https://rkeithparkerbooks.com/black-lantern-cycle/#series'},position:1,
      image:'https://rkeithparkerbooks.com/images/covers/manor.jpg',
      description:'Book One of The Black Lantern Cycle—an old-world Gothic fantasy of guest-law, hidden names, and the Black Lantern.',
      genre:['Gothic fantasy','Dark fantasy'],creativeWorkStatus:'Published',identifier:asinIdentifier('B0H1JJJ8QV'),offers:amazonOffer('B0H1JJJ8QV')
    },
    '/books/the-valley-that-laughed-at-the-lantern/':{
      '@type':['Book','Product'],'@id':'https://rkeithparkerbooks.com/books/the-valley-that-laughed-at-the-lantern/#book',
      name:'The Valley That Laughed at the Lantern',url:'https://rkeithparkerbooks.com/books/the-valley-that-laughed-at-the-lantern/',
      author:authorRef,isPartOf:{'@id':'https://rkeithparkerbooks.com/black-lantern-cycle/#series'},position:2,
      image:'https://rkeithparkerbooks.com/images/covers/valley.jpg',
      description:'Book Two of The Black Lantern Cycle—an old-world Gothic fantasy of grief-law, borrowed names, and the Black Lantern.',
      genre:['Gothic fantasy','Dark fantasy'],creativeWorkStatus:'Published',identifier:asinIdentifier('B0H92DBSHV'),offers:amazonOffer('B0H92DBSHV')
    },
    '/books/the-chateau-that-wrote-the-living/':{
      '@type':'Book','@id':'https://rkeithparkerbooks.com/books/the-chateau-that-wrote-the-living/#book',
      name:'The Château That Wrote the Living',url:'https://rkeithparkerbooks.com/books/the-chateau-that-wrote-the-living/',
      author:authorRef,isPartOf:{'@id':'https://rkeithparkerbooks.com/black-lantern-cycle/#series'},position:3,
      image:'https://rkeithparkerbooks.com/images/covers/chateau.webp',
      description:'Advance preview of Book Three of The Black Lantern Cycle—ledger-law, written lives, and the Black Lantern.',
      genre:['Gothic fantasy','Dark fantasy'],creativeWorkStatus:'In development'
    }
  };

  const highPassBooks=[
    ['The Pass That Collects','B0GQ6VBHKC'],['The Road That Remembers','B0GGXK18BR'],['The Stone That Keeps Count','B0GRPRCP17'],
    ['The Court Above the Hinge','B0GS75HZY5'],['The Moon That Hunts','B0GSSH5XNG'],['The Cry That Found the Stones','B0GTN76D5Y'],
    ['The House That Kept the Last Lamp','B0GR6J5JJ6'],['The Lady Beneath Midnight','B0GQ55GPLL'],['The House That Would Not Release','B0GX33F82R'],
    ['The Ministry of the Second Dawn','B0GX5488VK'],['The Door of Ninety-Five Nails','B0GZJYJJ1N'],['The Twisted Sister','B0GZQMFYBS'],
    ['The Mask That Fed the Rats','B0H34NLK39']
  ];

  function highPassSeries(){
    return {
      '@type':'BookSeries','@id':'https://rkeithparkerbooks.com/high-pass-chronicles/#series',name:'The High Pass Chronicles',
      url:'https://rkeithparkerbooks.com/high-pass-chronicles/',author:authorRef,genre:['Gothic fantasy','Dark fantasy'],
      description:'Thirteen standalone old-world Gothic fantasy novels of haunted roads, strict supernatural laws, buried wrongs, and hard-won release.',
      numberOfItems:13,
      hasPart:highPassBooks.map(([name,asin],i)=>({
        '@type':['Book','Product'],name,position:i+1,author:authorRef,isPartOf:{'@id':'https://rkeithparkerbooks.com/high-pass-chronicles/#series'},
        creativeWorkStatus:'Published',identifier:asinIdentifier(asin),offers:amazonOffer(asin)
      }))
    };
  }

  function blackSaltSeries(){
    return {
      '@type':'BookSeries','@id':'https://rkeithparkerbooks.com/black-salt-cycle/#series',name:'The Black Salt Cycle',
      url:'https://rkeithparkerbooks.com/black-salt-cycle/',author:authorRef,genre:['Gothic fantasy','Expedition fantasy','Dark fantasy'],
      description:"R. Keith Parker's Gothic expedition fantasy of black salt, buried cities, proof-law, ancient debts, and dragon authority.",
      hasPart:[{
        '@type':['Book','Product'],'@id':'https://rkeithparkerbooks.com/black-salt-cycle/#salt-road-book',name:'The Salt Road That Fed the Dragon',position:1,
        author:authorRef,isPartOf:{'@id':'https://rkeithparkerbooks.com/black-salt-cycle/#series'},image:'https://rkeithparkerbooks.com/images/covers/salt-road.jpg',
        description:'An expedition follows an old salt road into a drowned city whose trade law still functions.',creativeWorkStatus:'Published',
        identifier:asinIdentifier('B0H4N58LDG'),offers:amazonOffer('B0H4N58LDG')
      }]
    };
  }

  function installStructuredData(){
    if(document.querySelector('script[data-rkp-schema]'))return;
    const path=location.pathname.endsWith('/')?location.pathname:`${location.pathname}/`;
    let graph=null;
    if(bookSchemas[path])graph=[AUTHOR,blackLanternSeries(false),bookSchemas[path]];
    else if(path==='/black-lantern-cycle/')graph=[AUTHOR,blackLanternSeries(true),...Object.values(bookSchemas)];
    else if(path==='/high-pass-chronicles/')graph=[AUTHOR,highPassSeries()];
    else if(path==='/black-salt-cycle/')graph=[AUTHOR,blackSaltSeries()];
    if(!graph)return;
    const script=document.createElement('script');
    script.type='application/ld+json';
    script.dataset.rkpSchema='true';
    script.textContent=JSON.stringify({'@context':'https://schema.org','@graph':graph});
    document.head.append(script);
  }
  installStructuredData();

  const EXCLUDE_KEY = 'black_lantern_analytics_excluded';
  const VISITOR_KEY = 'black_lantern_visitor_id';
  const BOT_PATTERN = /bot|crawler|spider|slurp|preview|facebookexternalhit|twitterbot|linkedinbot|discordbot|whatsapp|telegrambot|pinterest|headless|lighthouse|pagespeed/i;

  const AUTHOR_LINKS = [
    ['Amazon Author Page','https://www.amazon.com/-/he/R-Keith-Parker/e/B0GRYZM8CC/ref%3Ddp_byline_cont_book_1'],
    ['Goodreads','https://www.goodreads.com/author/show/71347649.R_Keith_Parker'],
    ['BookBub','https://www.bookbub.com/authors/r-keith-parker'],
    ['Facebook','https://www.facebook.com/RKeithParkerAuthor/'],
    ['Email','mailto:keith@rkeithparkerbooks.com']
  ];

  function installAuthorLinks() {
    if (document.querySelector('.author-links-strip')) return;
    if (!document.querySelector('link[href="/author-links.css"]')) {
      const style = document.createElement('link');
      style.rel = 'stylesheet';
      style.href = '/author-links.css';
      document.head.append(style);
    }
    const strip = document.createElement('aside');
    strip.className = 'author-links-strip';
    strip.setAttribute('aria-label','Follow R. Keith Parker');
    const inner = document.createElement('div');
    inner.className = 'author-links-inner';
    const copy = document.createElement('div');
    copy.className = 'author-links-copy';
    copy.innerHTML = '<strong>Follow R. Keith Parker</strong><span>Books, reader profiles, news, and direct contact.</span>';
    const list = document.createElement('nav');
    list.className = 'author-links-list';
    list.setAttribute('aria-label','Author profiles');
    AUTHOR_LINKS.forEach(([label,href]) => {
      const a = document.createElement('a');
      a.href = href;
      a.textContent = label;
      a.dataset.trackLabel = label;
      if (!href.startsWith('mailto:')) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
      list.append(a);
    });
    inner.append(copy,list); strip.append(inner);
    const footer = document.querySelector('footer');
    if (footer) footer.before(strip); else document.body.append(strip);
  }

  const installPublicEnhancements=()=>{installAuthorLinks();installAmazonCatalogInfo();};
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installPublicEnhancements, {once:true});
  else installPublicEnhancements();

  const EXCLUDE_KEY_UNUSED = null;
  function setExcluded(value) {
    try { if (value) localStorage.setItem(EXCLUDE_KEY, '1'); else localStorage.removeItem(EXCLUDE_KEY); return true; }
    catch { return false; }
  }
  function isExcluded() { try { return localStorage.getItem(EXCLUDE_KEY) === '1'; } catch { return false; } }

  const params = new URLSearchParams(location.search);
  if (params.get('author_preview') === '1') {
    setExcluded(true); params.delete('author_preview'); const query=params.toString(); history.replaceState({},'',`${location.pathname}${query?`?${query}`:''}${location.hash}`);
  } else if (params.get('author_preview') === '0') {
    setExcluded(false); params.delete('author_preview'); const query=params.toString(); history.replaceState({},'',`${location.pathname}${query?`?${query}`:''}${location.hash}`);
  }

  window.BlackLanternAnalytics={excludeThisBrowser(){setExcluded(true);return true;},includeThisBrowser(){setExcluded(false);return true;},isExcluded};
  if (isExcluded() || navigator.doNotTrack === '1' || BOT_PATTERN.test(navigator.userAgent)) return;

  function visitorId(){try{let id=localStorage.getItem(VISITOR_KEY);if(!id){id=crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`;localStorage.setItem(VISITOR_KEY,id);}return id;}catch{return `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;}}
  const id=visitorId();
  function transmit(endpoint,payload){const body=JSON.stringify(payload);fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true,credentials:'same-origin'}).catch(()=>{try{if(navigator.sendBeacon)navigator.sendBeacon(endpoint,new Blob([body],{type:'application/json'}));}catch{}});}
  function send(event,details={}){transmit('/api/visit',{event,visitorId:id,path:`${location.pathname}${location.search}`.slice(0,500),title:document.title.slice(0,200),referrer:document.referrer.slice(0,500),...details});}
  const recordPageView=()=>send('pageview'); if(document.readyState==='complete')recordPageView();else window.addEventListener('load',recordPageView,{once:true});

  document.addEventListener('click',event=>{
    const anchor=event.target.closest?.('a[href]');if(!anchor)return;const raw=anchor.getAttribute('href')||'';const label=(anchor.dataset.trackLabel||anchor.textContent||'Outbound link').replace(/\s+/g,' ').trim().slice(0,180);let kind='';let target=raw;
    if(raw.startsWith('mailto:'))kind='email';else if(raw.endsWith('.pdf')||anchor.hasAttribute('download'))kind='download';else{try{const url=new URL(anchor.href,location.href);if(url.origin!==location.origin){target=url.href;if(/amazon\./i.test(url.hostname))kind='amazon';else if(/goodreads\./i.test(url.hostname))kind='goodreads';else if(/bookbub\./i.test(url.hostname))kind='bookbub';else if(/facebook\./i.test(url.hostname))kind='facebook';else kind='outbound';}}catch{return;}}
    if(!kind)return;const pagePath=`${location.pathname}${location.search}`.slice(0,500);send('reader_action',{kind,target:String(target).slice(0,700)});transmit('/api/outbound-click',{visitorId:id,url:String(target).slice(0,700),label,pagePath});
  },{capture:true});
})();
