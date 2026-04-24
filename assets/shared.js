(function(){
  'use strict';
  document.querySelectorAll('[data-tabs]').forEach(group=>{
    const buttons=group.querySelectorAll('[data-tab]');
    const panels=group.parentElement.querySelectorAll('[data-panel]');
    buttons.forEach(btn=>btn.addEventListener('click',()=>{
      buttons.forEach(b=>b.classList.toggle('active',b===btn));
      panels.forEach(p=>p.classList.toggle('active',p.dataset.panel===btn.dataset.tab));
    }));
  });
  function initPassword(){
    const gate=document.querySelector('.dm-gate, .auth-overlay'); if(!gate) return;
    const btn=gate.querySelector('button, .gate-btn'); const input=gate.querySelector('input');
    const err=gate.querySelector('.gate-error, .hint');
    const ok=()=>{ if(input && input.value==='Shattered270'){ gate.remove(); sessionStorage.setItem('wotMonstersUnlocked','1'); } else if(err){ err.textContent='Неверный пароль'; } };
    if(btn) btn.addEventListener('click', ok); if(input) input.addEventListener('keydown',e=>{if(e.key==='Enter')ok();});
    if(sessionStorage.getItem('wotMonstersUnlocked')==='1') gate.remove();
  }
  initPassword();
})();
(function(){const path=(location.pathname.split('/').pop()||'index.html');document.querySelectorAll('.nav-links a').forEach(a=>{const href=a.getAttribute('href');a.classList.toggle('active',href===path);});})();


(function(){
  const nav = document.querySelector('.nav-links');
  if(!nav) return;
  nav.addEventListener('wheel', function(e){
    if(Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      nav.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  }, {passive:false});
  let down = false, startX = 0, startLeft = 0;
  nav.addEventListener('mousedown', e => { down = true; startX = e.pageX; startLeft = nav.scrollLeft; nav.classList.add('dragging'); });
  window.addEventListener('mouseup', ()=> { down = false; nav.classList.remove('dragging'); });
  window.addEventListener('mousemove', e => {
    if(!down) return;
    nav.scrollLeft = startLeft - (e.pageX - startX);
  });
})();
