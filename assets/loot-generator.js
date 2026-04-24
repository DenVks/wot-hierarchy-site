(function(){
  const ingredients = {
    1:[['Сухая Роса','Энергия'],['Пыль Печати','Тел’аран’риод'],['Ночное Стекло','Энергия']],
    2:[['Зола Невозможного','Энергия'],['Слеза Сна','Тел’аран’риод']],
    3:[['Пена Ореола','Энергия'],['Волокно плёнки реальности','Тел’аран’риод']],
    4:[['Кость Узла','Иные измерения'],['Пыль Зеркал','Тел’аран’риод']],
    5:[['Пыль Вехи','Иные измерения'],['Сердечный Осадок Разрыва','Энергия']],
    6:[['Шрам-камень','Энергия'],['Паразитная нить','Иные измерения']],
    7:[['Сгусток Сухой Росы','Энергия'],['Экстракт Звериного следа','Иные измерения'],['Серебряный иней','Тел’аран’риод']],
    8:[['Кровь Тени','Иные измерения'],['Кристалл Развязки','Энергия']],
    9:[['Осколок Шва (малый)','Энергия'],['Пепел Памяти','Тел’аран’риод']],
    10:[['Осколок Шва (истинный)','Энергия'],['Сердце Ореола','Энергия']]
  };
  const chance = {
    1:[70,25,10,0,0,0,0,0,0,0],
    2:[80,50,20,8,0,0,0,0,0,0],
    3:[90,65,40,18,5,0,0,0,0,0],
    4:[95,75,55,30,15,5,0,0,0,0],
    5:[100,85,65,45,28,14,5,0,0,0],
    6:[100,90,75,55,42,28,14,5,0,0],
    7:[100,95,85,65,55,42,28,14,5,0],
    8:[100,100,90,75,65,55,38,22,10,0],
    9:[100,100,95,85,75,65,50,32,18,5],
    10:[100,100,100,92,85,75,60,42,28,12]
  };
  const wallDC = {
    outer:[14,18,22,26,null,null,null,null,null,null],
    inner:[11,14,17,20,23,26,29,null,null,null],
    crest:[8,11,14,17,20,22,24,27,29,32],
    core:[7,10,13,16,18,20,22,24,26,30]
  };
  const zoneNames = {outer:'Внешняя Тень',inner:'Внутренняя Тень',crest:'Гребень',core:'Ядро'};
  const d = n => Math.floor(Math.random()*n)+1;
  const pick = arr => arr[Math.floor(Math.random()*arr.length)];
  const el = id => document.getElementById(id);
  function options(){
    for(let i=1;i<=10;i++){
      el('temporalRating').insertAdjacentHTML('beforeend',`<option value="${i}">Рейтинг ${i}</option>`);
      el('wallRank').insertAdjacentHTML('beforeend',`<option value="${i}">R${i}</option>`);
    }
    const target = el('wallTarget');
    ['Энергия','Тел’аран’риод','Иные измерения'].forEach(t=>target.insertAdjacentHTML('beforeend',`<option value="${t}">${t}</option>`));
    Object.values(ingredients).flat().forEach(([name])=>target.insertAdjacentHTML('beforeend',`<option value="${name}">${name}</option>`));
    const tbody = el('ingredientTable').querySelector('tbody');
    Object.keys(ingredients).forEach(r=>{
      const names = ingredients[r].map(x=>x[0]).join('; ');
      const types = ingredients[r].map(x=>x[1]).join(' / ');
      tbody.insertAdjacentHTML('beforeend',`<tr><td>R${r}</td><td>${names}</td><td>${types}</td></tr>`);
    });
  }
  function listForRank(rank, filter){
    let arr = ingredients[rank] || [];
    if(filter && filter !== 'all') arr = arr.filter(x=>x[1]===filter || x[0]===filter);
    return arr;
  }
  function natureCheck(rank, bonus, extra=0){
    const dc = 10 + rank*2;
    const roll = d(20); const total = roll + bonus + extra;
    return {roll,total,dc,ok:total>=dc,extraDoses: Math.max(0, Math.floor((total-dc)/5))};
  }
  function temporal(){
    const rating = +el('temporalRating').value;
    const attempts = Math.max(1, Math.min(12, +el('temporalAttempts').value || 1));
    const filter = el('temporalType').value;
    const bonus = +el('temporalBonus').value || 0;
    let html = `<div class="roll-head">Временная аномалия · рейтинг ${rating} · попыток: ${attempts}</div>`;
    for(let a=1;a<=attempts;a++){
      const found=[];
      for(let rank=10; rank>=1; rank--){
        const pct = chance[rating][rank-1];
        if(!pct) continue;
        const pool = listForRank(rank, filter);
        if(!pool.length) continue;
        const roll = d(100);
        if(roll <= pct){
          const check = natureCheck(rank, bonus);
          if(check.ok){
            const ing = pick(pool);
            const doses = 1 + check.extraDoses;
            found.push(`<li><strong>${ing[0]}</strong> · R${rank} · ${ing[1]} · ${doses} доз. <span class="roll-note">d100 ${roll}/${pct}%, проверка ${check.roll}+${bonus}=${check.total} против СЛ ${check.dc}</span></li>`);
          } else {
            found.push(`<li class="failed"><strong>След R${rank}</strong> найден, но сбор сорван. <span class="roll-note">d100 ${roll}/${pct}%, проверка ${check.roll}+${bonus}=${check.total} против СЛ ${check.dc}</span></li>`);
          }
        }
      }
      html += `<div class="roll-block"><h4>Попытка ${a}</h4>${found.length?`<ul>${found.join('')}</ul>`:'<p class="muted">Ничего пригодного не найдено.</p>'}</div>`;
    }
    el('temporalResult').classList.remove('muted'); el('temporalResult').innerHTML = html;
  }
  function accessibleRanks(zone){ return wallDC[zone].map((x,i)=>x?i+1:null).filter(Boolean); }
  function wall(){
    const zone = el('wallZone').value;
    const rankOpt = el('wallRank').value;
    const mode = el('wallSearchMode').value;
    const target = el('wallTarget').value;
    const bonus = +el('wallBonus').value || 0;
    const attempts = Math.max(1, Math.min(12, +el('wallAttempts').value || 1));
    let ranks = rankOpt==='any' ? accessibleRanks(zone) : [+rankOpt];
    ranks = ranks.filter(r => wallDC[zone][r-1]);
    let html = `<div class="roll-head">${zoneNames[zone]} · попыток: ${attempts}</div>`;
    if(!ranks.length){ el('wallResult').innerHTML='<p class="failed">Выбранный ранг в этой зоне не встречается.</p>'; return; }
    for(let a=1;a<=attempts;a++){
      let chosenRank = rankOpt==='any' ? pick(ranks) : ranks[0];
      let pool = ingredients[chosenRank] || [];
      let extra = 0;
      if(mode==='type' && target!=='all'){ extra=2; pool = pool.filter(x=>x[1]===target); }
      if(mode==='name' && target!=='all'){ extra=4; pool = pool.filter(x=>x[0]===target); }
      if(!pool.length){
        html += `<div class="roll-block"><h4>Попытка ${a}</h4><p class="failed">В выбранном ранге нет компонента под указанный фильтр.</p></div>`; continue;
      }
      const dc = wallDC[zone][chosenRank-1];
      const roll = d(20); const total = roll + bonus + extra;
      let danger='';
      if(zone==='core'){
        const dangerRoll=d(20), dangerTotal=dangerRoll+bonus, dangerOk=dangerTotal>=15;
        danger = `<div class="danger ${dangerOk?'':'failed'}">Опасность Ядра: ${dangerRoll}+${bonus}=${dangerTotal} против СЛ 15 — ${dangerOk?'без отката':'аномальный откат: истощение, встреча или STAB −1 по решению МИ'}.</div>`;
      }
      if(total>=dc){
        const ing = pick(pool); const crit = total >= dc + 10; const doses = crit ? 2 : 1;
        html += `<div class="roll-block"><h4>Попытка ${a}</h4><p><strong>${ing[0]}</strong> · R${chosenRank} · ${ing[1]} · ${doses} доз.</p><p class="roll-note">Проверка ${roll}+${bonus}${extra?`+${extra}`:''}=${total} против СЛ ${dc}${crit?' · критический успех':''}.</p>${danger}</div>`;
      } else {
        const severe = total <= dc-5;
        let penalty = mode==='name' ? ' Этот конкретный ингредиент сегодня в данной зоне не встречается.' : '';
        html += `<div class="roll-block"><h4>Попытка ${a}</h4><p class="failed">Ингредиент не найден.${penalty}</p><p class="roll-note">Проверка ${roll}+${bonus}${extra?`+${extra}`:''}=${total} против СЛ ${dc}${severe?' · провал на 5+':''}.</p>${danger}</div>`;
      }
    }
    el('wallResult').classList.remove('muted'); el('wallResult').innerHTML = html;
  }
  document.addEventListener('DOMContentLoaded',()=>{
    options();
    el('rollTemporal').addEventListener('click', temporal);
    el('rollWall').addEventListener('click', wall);
  });
})();
