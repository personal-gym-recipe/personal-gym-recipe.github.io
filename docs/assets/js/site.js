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
  }else{document.querySelectorAll('.reveal').forEach(el=>el.classList.add('show'))}

})();
