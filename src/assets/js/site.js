(()=>{
  const menu=document.getElementById('mobileMenu');
  const menuToggle=document.getElementById('menuToggle');
  const menuClose=document.getElementById('menuClose');
  const menuBackdrop=document.getElementById('menuBackdrop');
  const setMenu=open=>{
    if(!menu||!menuToggle||!menuBackdrop)return;
    menu.classList.toggle('open',open);
    menu.setAttribute('aria-hidden',String(!open));
    menuToggle.setAttribute('aria-expanded',String(open));
    menuBackdrop.hidden=!open;
    document.body.classList.toggle('menu-open',open);
  };
  menuToggle?.addEventListener('click',()=>setMenu(menuToggle.getAttribute('aria-expanded')!=='true'));
  menuClose?.addEventListener('click',()=>setMenu(false));
  menuBackdrop?.addEventListener('click',()=>setMenu(false));
  menu?.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>setMenu(false)));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')setMenu(false)});

  const trainerDetails=[...document.querySelectorAll('.trainer-thoughts details')];
  const closeTrainerDetails=()=>trainerDetails.forEach(detail=>{detail.open=false});
  closeTrainerDetails();
  window.addEventListener('pageshow',closeTrainerDetails);
  trainerDetails.forEach(detail=>{
    detail.querySelector('summary')?.addEventListener('click',event=>{
      event.preventDefault();
      const willOpen=!detail.open;
      trainerDetails.forEach(item=>{item.open=false});
      detail.open=willOpen;
    });
  });

  const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if(!reduce && 'IntersectionObserver' in window){
    const ro=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('show');ro.unobserve(e.target)}}),{threshold:.12});
    document.querySelectorAll('.reveal').forEach(el=>ro.observe(el));
    const mo=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('on')}),{threshold:.52});
    document.querySelectorAll('.manifesto-line').forEach(el=>mo.observe(el));
  }else{document.querySelectorAll('.reveal').forEach(el=>el.classList.add('show'));document.querySelectorAll('.manifesto-line').forEach(el=>el.classList.add('on'))}

  const rail=document.getElementById('journalRail');
  const prev=document.getElementById('blogPrev');
  const next=document.getElementById('blogNext');
  if(rail&&prev&&next){
    const step=()=>{const c=rail.querySelector('.post');return c?(c.getBoundingClientRect().width+(parseFloat(getComputedStyle(rail).gap)||0)):rail.clientWidth};
    const state=()=>{const over=rail.scrollWidth>rail.clientWidth+2;rail.classList.toggle('has-overflow',over);prev.disabled=!over||rail.scrollLeft<=2;next.disabled=!over||rail.scrollLeft>=rail.scrollWidth-rail.clientWidth-2};
    prev.addEventListener('click',()=>rail.scrollBy({left:-step(),behavior:'smooth'}));next.addEventListener('click',()=>rail.scrollBy({left:step(),behavior:'smooth'}));rail.addEventListener('scroll',()=>requestAnimationFrame(state),{passive:true});window.addEventListener('resize',state);requestAnimationFrame(state);
  }

  const buttons=[...document.querySelectorAll('.like-btn[data-like-slug]')];
  const bySlug=new Map();
  buttons.forEach(btn=>{const slug=btn.dataset.likeSlug;if(!bySlug.has(slug))bySlug.set(slug,[]);bySlug.get(slug).push(btn)});
  const paint=slug=>{const liked=localStorage.getItem('recipe-liked-'+slug)==='1';(bySlug.get(slug)||[]).forEach(btn=>{const s=btn.querySelector('span');if(s)s.textContent=liked?'1':'0';btn.classList.toggle('liked',liked)})};
  bySlug.forEach((_,slug)=>paint(slug));
  buttons.forEach(btn=>btn.addEventListener('click',()=>{const slug=btn.dataset.likeSlug;if(localStorage.getItem('recipe-liked-'+slug)==='1')return;localStorage.setItem('recipe-liked-'+slug,'1');paint(slug)}));
})();
