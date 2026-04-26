(function(){
  'use strict';
  const cards = Array.from(document.querySelectorAll('.weave-card'));
  const sections = Array.from(document.querySelectorAll('.weave-level-section'));
  const search = document.getElementById('weave-search');
  const level = document.getElementById('weave-level-filter');
  const school = document.getElementById('weave-school-filter');
  const rarity = document.getElementById('weave-rarity-filter');
  const power = document.getElementById('weave-power-filter');
  const reset = document.getElementById('weave-reset');
  const count = document.getElementById('weave-count');

  function norm(v){ return (v || '').toLowerCase().trim(); }

  function applyFilters(){
    const q = norm(search && search.value);
    const lv = level ? level.value : 'all';
    const sc = school ? school.value : 'all';
    const rr = rarity ? rarity.value : 'all';
    const pw = power ? power.value : 'all';
    let visible = 0;

    cards.forEach(card => {
      const text = norm(card.textContent);
      const okQ = !q || text.includes(q);
      const okL = lv === 'all' || card.dataset.level === lv;
      const okS = sc === 'all' || card.dataset.school === sc;
      const okR = rr === 'all' || card.dataset.rarity === rr;
      const okP = pw === 'all' || (card.dataset.powers || '').split(' ').includes(pw);
      const show = okQ && okL && okS && okR && okP;
      card.hidden = !show;
      if(show) visible++;
    });

    sections.forEach(sec => {
      const hasVisible = Array.from(sec.querySelectorAll('.weave-card')).some(card => !card.hidden);
      sec.hidden = !hasVisible;
    });

    if(count) count.textContent = String(visible);
  }

  [search, level, school, rarity, power].forEach(el => {
    if(el) el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', applyFilters);
  });

  if(reset){
    reset.addEventListener('click', () => {
      if(search) search.value = '';
      [level, school, rarity, power].forEach(el => { if(el) el.value = 'all'; });
      applyFilters();
    });
  }

  applyFilters();
})();