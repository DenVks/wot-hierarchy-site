/* Shared catalogue, tabs and modal keyboard behavior for the two battle tools. */
let combatModalReturn=null;
function combatMobile(){return window.matchMedia('(max-width:760px)').matches;}
function closeCombatCatalog(returnFocus=true){
 const opened=document.body.classList.contains('catalog-open');document.body.classList.remove('catalog-open');
 const button=document.getElementById('catalog-toggle'),panel=document.getElementById('catalog-panel');button?.setAttribute('aria-expanded','false');panel?.removeAttribute('aria-modal');panel?.removeAttribute('role');
 if(opened&&returnFocus)button?.focus();
 if(opened&&!returnFocus)requestAnimationFrame(()=>{const heading=document.querySelector('.cp-name');if(heading){heading.setAttribute('tabindex','-1');heading.scrollIntoView({block:'start'});heading.focus({preventScroll:true});}});
}
function toggleCombatCatalog(){
 if(document.body.classList.contains('catalog-open'))return closeCombatCatalog();
 document.body.classList.add('catalog-open');document.getElementById('catalog-toggle')?.setAttribute('aria-expanded','true');
 const panel=document.getElementById('catalog-panel');panel?.setAttribute('role','dialog');panel?.setAttribute('aria-modal','true');panel?.querySelector('input')?.focus();
}
function rememberCombatModalFocus(){combatModalReturn=document.activeElement;}
function restoreCombatModalFocus(){const previous=combatModalReturn;combatModalReturn=null;requestAnimationFrame(()=>{if(previous?.isConnected)previous.focus();else document.querySelector('.cp-dmg-btn')?.focus();});}
function combatTabKey(event){
 if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
 const list=event.currentTarget.closest('[role="tablist"]'),tabs=Array.from(list.querySelectorAll('[role="tab"]')),index=tabs.indexOf(event.currentTarget);
 const target=event.key==='Home'?tabs[0]:event.key==='End'?tabs[tabs.length-1]:tabs[(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length];
 event.preventDefault();const id=target.id;target.click();requestAnimationFrame(()=>document.getElementById(id)?.focus());
}
document.addEventListener('keydown',event=>{
 const hp=document.querySelector('.hp-modal'),modal=hp&&getComputedStyle(hp).display!=='none'?hp:combatMobile()&&document.body.classList.contains('catalog-open')?document.getElementById('catalog-panel'):null;
 if(event.key==='Escape'){if(modal===hp){event.preventDefault();closeHpModal();}else if(modal){event.preventDefault();closeCombatCatalog();}return;}
 if(event.key!=='Tab'||!modal)return;
 const focusable=Array.from(modal.querySelectorAll('button,input,select,a[href],[tabindex="0"]')).filter(el=>!el.disabled&&el.getClientRects().length);
 const first=focusable[0],last=focusable[focusable.length-1];if(!first)return;
 if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
});

function setCombatMobileTitle(text){const label=document.querySelector('.mobile-catalog-trigger>span');if(label)label.textContent=text;}

function jumpCombatActions(){
 const battle=document.querySelector('.tabs[role=tablist] [role=tab]');if(!battle)return;battle.click();
 requestAnimationFrame(()=>{const card=document.querySelector('.tab-content.active .atk-card');if(!card)return;card.scrollIntoView({block:'start'});card.querySelector('button')?.focus({preventScroll:true});});
}

function enhanceCombatControls(){
 const selectors={'.cp-hp-cur':'Изменить хиты','.cp-ini-box':'Инициатива текущего существа','.ini-slot':'Сделать текущим участником','.slot-pip':'Израсходовать ячейку плетения','.sd-pip':'Израсходовать кость превосходства','.phase-badge':'Переключить фазу существа'};
 for(const [selector,label] of Object.entries(selectors)){
  const nodes=Array.from(document.querySelectorAll(selector+'[onclick]'));
  nodes.forEach((el,index)=>{
   el.setAttribute('role','button');el.tabIndex=0;
   const level=el.closest('.slot-group')?.querySelector('.slot-lv')?.textContent;
   el.setAttribute('aria-label',label+(level?' · уровень '+level:selector==='.ini-slot'?' · '+el.textContent:''));
   el.onkeydown=event=>{if(event.target!==el||!['Enter',' '].includes(event.key))return;event.preventDefault();el.click();requestAnimationFrame(()=>document.querySelectorAll(selector+'[onclick]')[index]?.focus({preventScroll:true}));};
  });
 }
}
