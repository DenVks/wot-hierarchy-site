/* One mixed encounter screen. Rendering never executes imported markup. */
(function(){
  'use strict';
  const E=window.WOT_ENCOUNTER,G=window.WOT_GITHUB_STORE,L=window.WOT_LIBRARY;
  const draftStore=new window.WOT_ENCOUNTER_DRAFT.DraftStore();
  const $=id=>document.getElementById(id),el=(tag,text='',className='')=>{const node=document.createElement(tag);node.textContent=text;if(className)node.className=className;return node;};
  const kindNames={npc:'NPC',monster:'Монстр',manual:'Участник'};
  const condNames={stun:'Оглушён',fear:'Напуган',poison:'Отравлен',prone:'Лежит',blind:'Ослеплён',conc:'Концентрация',restrained:'Опутан'};
  const hpAmounts=new Map(),rollExpressions=new Map();
  let game=new E.Encounter(),cloudMeta=null,book=null,bookKey='',busy=false,notice='Новый локальный черновик.',noticeLevel='ok',dirty=false,visibleCount=60,allMonsters=null,pending=null,lastFocus=null;
  const plain=value=>String(value??'').replace(/<br\s*\/?>/gi,'\n').replace(/<\/(?:p|div|li|tr)>/gi,'\n').replace(/<\/t[dh]>/gi,' · ').replace(/<\/?(?:b|i|strong|em|p|ul|ol|li|div|span|br|table|thead|tbody|tr|td|th|small|a|h[1-6])(?:\s[^<>]*?)?\s*\/?>/gi,'').replace(/&(amp|lt|gt|quot|apos|nbsp);/gi,(_,name)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '})[name.toLowerCase()]).replace(/&#(x[0-9a-f]+|\d+);/gi,(_,code)=>{const value=code[0].toLowerCase()==='x'?parseInt(code.slice(1),16):Number(code);return value>=0&&value<=0x10ffff?String.fromCodePoint(value):'�';});
  function liveState(actorId){const actor=game.snapshot().actors.find(item=>item.id===actorId);if(!actor)throw Error('Участник больше не существует.');return G.clone(actor.state);}
  function status(message,level='ok'){notice=message;noticeLevel=level;$('scene-status').textContent=message;$('scene-status').dataset.level=level;}
  function button(label,action,key=''){
    const node=el('button',label);node.type='button';if(key)node.dataset.focusKey=key;node.disabled=busy;
    node.addEventListener('click',()=>{try{const result=action();if(result?.catch)result.catch(error=>status(error.message,'error'));}catch(error){status(error.message,'error');}});return node;
  }
  function locked(value){busy=value;document.querySelectorAll('.encounter-wrap button,.encounter-wrap input,.encounter-wrap select,.encounter-wrap textarea').forEach(node=>node.disabled=value);if(!value)render();}
  function stored(){return{version:1,scene:game.snapshot(),cloudMeta};}
  function persist(){
    if(draftStore.blocked)return;
    try{draftStore.save(stored());}catch{status('Не удалось сохранить черновик в браузере. Текущая сцена остаётся открытой.','error');}
  }
  function change(action){if(busy)return;action();dirty=true;status('Изменения сохранены в черновике этого браузера. Для другого компьютера сохраните бой в GitHub.');persist();render();}
  function restore(){try{const data=draftStore.load();if(!data)return;game=new E.Encounter(data.scene);cloudMeta=data.cloudMeta;notice='Восстановлен черновик этой вкладки.';}catch{status('Черновик не читается и сохранён без изменений. «Новая сцена» сначала создаст резервную копию.','error');}}
  function backup(){draftStore.backup(stored());}
  function confirm(title,text,action){
    pending=action;lastFocus=document.activeElement;$('confirm-title').textContent=title;$('confirm-text').textContent=text;$('scene-confirm').showModal();$('confirm-cancel').focus();
  }
  function replaceScene(scene,meta=null){
    const prepared=new E.Encounter(scene);backup();game=prepared;cloudMeta=meta;draftStore.unblock();dirty=false;persist();status('Бой открыт. Предыдущая сцена сохранена в резервной копии.');render();
  }
  function catalog(type=$('catalog-kind').value){
    const custom=L.records().map(row=>({kind:'npc',name:row.npc.sh,subtitle:row.npc.ti||'',snapshot:row.npc,source:{catalog:'npc-library',id:row.libraryId,revision:row.revision}}));
    const builtins=(window.NPC_DATA||[]).filter(row=>!row.custom&&!row.isClone).map(row=>({kind:'npc',name:row.sh,subtitle:row.ti||'',snapshot:row,source:{catalog:'npc-builtin',id:String(row.id),revision:'v179'}}));
    if(type==='npc')return[...custom,...builtins];
    if(!allMonsters){
      const monsters=[...(window.WOT_BESTIARY_DATA||[]),...(window.ANOMALY_MONSTERS||[]),...(window.MM_ADAPTER?.buildBattleMonsters()||[])];
      allMonsters=monsters.map(row=>({kind:'monster',name:row.nm,subtitle:(row.ly||row.en||'')+' · ПО '+row.cr,snapshot:row,source:{catalog:String(row.id).startsWith('mm-')?'mm':'bestiary',id:String(row.id),revision:'wot-bestiary-v178'}}));
    }
    return type==='monster'?allMonsters:[...custom,...builtins,...allMonsters];
  }
  function addEntry(entry,count){change(()=>game.add({kind:entry.kind,name:entry.name,snapshot:entry.snapshot,source:entry.source},count));}
  function renderCatalog(){
    if(!$('catalog-results'))return;const query=$('catalog-search').value.trim().toLowerCase();
    const rows=catalog().filter(row=>[row.name,row.subtitle,row.snapshot.na,...(Array.isArray(row.snapshot.tags)?row.snapshot.tags:[])].some(value=>String(value||'').toLowerCase().includes(query)));
    $('catalog-count').textContent='Найдено: '+rows.length+' · показано: '+Math.min(rows.length,visibleCount);
    const host=$('catalog-results');host.replaceChildren();
    for(const row of rows.slice(0,visibleCount)){const card=el('div','','catalog-row');card.append(el('strong',row.name),el('small',kindNames[row.kind]+' · '+row.subtitle),button('Добавить '+row.name,()=>addEntry(row,Number($('add-count').value)),'catalog-'+row.kind+'-'+row.source.catalog+'-'+row.source.id));host.append(card);}
    $('catalog-more').hidden=rows.length<=visibleCount;
  }
  function renderParticipants(data){
    const host=$('participants');host.replaceChildren();if(!data.actors.length){host.append(el('p','Добавьте NPC или монстров из каталога.','empty-hint'));return;}
    const positions=new Map(data.order.map((id,index)=>[id,index]));const actors=data.actors.slice().sort((a,b)=>(positions.get(a.id)??10000)-(positions.get(b.id)??10000));
    for(const actor of actors){
      const row=el('div','','participant'+(actor.id===data.activeId?' active':'')+(actor.id===data.selectedId?' selected':''));
      const select=button((actor.id===data.activeId&&data.round?'Ход: ':'')+actor.name,()=>change(()=>game.select(actor.id)),actor.id+'-select');select.className='actor-select';select.append(el('small',kindNames[actor.kind]+(actor.kind==='npc'?' · '+actor.snapshot.lv+' ур.':actor.kind==='monster'?' · ПО '+actor.snapshot.cr:'')+(actor.kind==='manual'?'':' · ОЗ '+E.actorHp(actor)+'/'+actor.maxHp)));row.append(select);
      const label=el('label','Инициатива'),input=el('input');input.type='number';input.min='-100';input.max='200';input.value=actor.initiative??'';input.setAttribute('aria-label','Инициатива: '+actor.name);input.dataset.focusKey=actor.id+'-initiative';input.addEventListener('input',()=>{try{game.setInitiative(actor.id,input.value===''?null:Number(input.value));dirty=true;persist();status('Инициатива сохранена в локальном черновике.');updateTurn(game.snapshot());jump.disabled=busy||input.value==='';}catch(error){status(error.message,'error');}});label.append(input);row.append(label);
      const actions=el('div','','actor-actions');
      if(actor.kind!=='manual')for(const[label,mode]of [['к20','normal'],['к20 ↑','advantage'],['к20 ↓','disadvantage']]){const rollButton=button(label,()=>{const result=rollInitiative(actor,mode);change(()=>{game.setInitiative(actor.id,result.total);game.change(data=>{data.log.unshift({text:actor.name+': инициатива '+result.total+' · к20 ['+result.rolls.join(', ')+']',round:data.round,turn:data.turnSerial});data.log=data.log.slice(0,100);});});},actor.id+'-roll-'+mode);rollButton.setAttribute('aria-label','Инициатива '+(mode==='normal'?'обычно':mode==='advantage'?'с преимуществом':'с помехой')+': '+actor.name);actions.append(rollButton);}
      const jump=button('Сделать текущим',()=>change(()=>game.jump(actor.id)),actor.id+'-jump');jump.disabled=busy||actor.initiative===null;actions.append(jump);
      actions.append(button('Убрать',()=>confirm('Убрать участника?',actor.name+' будет убран только из этой сцены. Карточка в каталоге сохранится.',()=>change(()=>game.remove(actor.id))),actor.id+'-remove'));row.append(actions);host.append(row);
    }
  }
  function feature(host,name,description){const card=el('div','','actor-feature');card.append(el('strong',plain(name)),el('p',plain(description)));host.append(card);return card;}
  function parseRoll(expression,random=Math.random){
    const source=String(expression).toLowerCase().replace(/d/g,'к').replace(/\s/g,'');
    if(source.length>2000||!/^[+-]?(?:\d{1,3}к\d{1,4}|\d{1,6})(?:[+-](?:\d{1,3}к\d{1,4}|\d{1,6}))*$/.test(source))throw Error('Введите формулу, например 2к6+1к8+4.');
    const terms=source.match(/[+-]?[^+-]+/g).map(term=>{const sign=term.startsWith('-')?-1:1,clean=term.replace(/^[+-]/,'');if(!clean.includes('к'))return{sign,value:Number(clean),term};const[count,sides]=clean.split('к').map(Number);if(count<1||count>100||sides<2||sides>1000)throw Error('Допустимо до 200 кубиков с 2–1000 гранями.');return{sign,count,sides};});
    if(terms.reduce((sum,term)=>sum+(term.count||0),0)>200)throw Error('Допустимо до 200 кубиков.');
    let total=0;const details=[];for(const term of terms){if(term.count){const values=Array.from({length:term.count},()=>1+Math.floor(random()*term.sides));total+=term.sign*values.reduce((a,b)=>a+b,0);details.push((term.sign<0?'-':'')+'['+values.join(', ')+']');}else{total+=term.sign*term.value;details.push(term.term);}}
    return{total,details};
  }
  function attackDamage(attack){
    let formula=plain(attack.d||'').trim().toLowerCase();
    if(!formula)formula=String(attack.dice||'')+(Number(attack.bonus)?(attack.bonus>=0?'+':'')+attack.bonus:'');
    formula=formula.replace(/(?:дроб\.|руб\.|прон\.|хол\.|сил\.|дробящий|рубящий|колющий|холод|силовой|огонь|fire|cold|force|bludgeoning|slashing|piercing)/gi,'').replace(/\s/g,'');
    return /^(?:\d+[кd]\d+)(?:[+-](?:\d+[кd]\d+|\d+))*$/i.test(formula)?formula:null;
  }
  function rollInitiative(actor,mode='normal',random=Math.random){
    const match=String(actor.kind==='npc'?actor.snapshot.co?.ini:actor.snapshot.ini).trim().match(/^[+-]?\d+/);if(!match)throw Error('Модификатор инициативы не указан. Введите итоговое значение вручную.');const modifier=Number(match[0]);if(!['normal','advantage','disadvantage'].includes(mode))throw Error('Неизвестный режим броска.');
    const rolls=Array.from({length:mode==='normal'?1:2},()=>1+Math.floor(random()*20));return{total:(mode==='advantage'?Math.max(...rolls):mode==='disadvantage'?Math.min(...rolls):rolls[0])+modifier,rolls,modifier};
  }
  function roll(expression,label,actor){
    const {total,details}=parseRoll(expression);
    const result=label+': '+total+' · '+details.join(' ');change(()=>{const state=liveState(actor.id);if(actor.kind==='monster'){state.roll=state.roll||{};state.roll.quick={text:result};}else state.lastRoll=result;game.change(data=>{data.actors.find(item=>item.id===actor.id).state=state;data.log.unshift({text:actor.name+' · '+result,round:data.round,turn:data.turnSerial});data.log=data.log.slice(0,100);});});
  }
  function resource(host,actor,label,total,used,update){
    if(!Number.isInteger(total)||total<0||!Number.isInteger(used))return;const counterKey=actor.id+'-resource-'+host.children.length,row=el('div','','resource-row');row.append(el('strong',label+' · осталось '+Math.max(0,total-used)+'/'+total));
    const spend=button('Потратить',()=>change(()=>update(Math.min(total,used+1))),counterKey+'-spend'),restore=button('Вернуть',()=>change(()=>update(Math.max(0,used-1))),counterKey+'-restore');spend.disabled=busy||used>=total;restore.disabled=busy||used<=0;row.append(spend,restore);host.append(row);
  }
  function renderResources(host,actor){
    const details=el('details');details.dataset.panel='resources';details.append(el('summary','Ресурсы и заметки'));host.append(details);
    if(actor.kind==='npc')for(const [level,slot]of Object.entries(actor.state.slots||{}))resource(details,actor,'Ячейки '+level+(String(level).includes('ур')?'':' ур.'),slot.total,slot.used,value=>{const state=liveState(actor.id);state.slots[level].used=value;game.setNativeState(actor.id,state);});
    if(actor.kind==='monster'&&Number.isInteger(actor.snapshot.laC)&&actor.snapshot.laC>0)resource(details,actor,'Легендарные действия',actor.snapshot.laC,actor.state.legendaryUsed||0,value=>{const state=liveState(actor.id);state.legendaryUsed=value;game.setNativeState(actor.id,state);});
    if(actor.kind==='npc'&&Number.isInteger(actor.state.sdTotal)&&actor.state.sdTotal>0)resource(details,actor,'Кости превосходства',actor.state.sdTotal,actor.state.sdUsed||0,value=>{const state=liveState(actor.id);state.sdUsed=value;game.setNativeState(actor.id,state);});
    for(const [index,item]of (actor.state.manualResources||[]).entries())resource(details,actor,item.name,item.total,item.used,value=>{const state=liveState(actor.id);state.manualResources[index].used=value;game.setNativeState(actor.id,state);});
    const form=el('div','','manual-resource-form'),nameLabel=el('label','Название счётчика'),name=el('input'),totalLabel=el('label','Всего'),total=el('input');name.maxLength=100;name.setAttribute('aria-label','Название нового ресурса');total.type='number';total.min=1;total.max=1000;total.value=1;total.setAttribute('aria-label','Запас нового ресурса');nameLabel.append(name);totalLabel.append(total);
    form.append(nameLabel,totalLabel,button('Добавить счётчик',()=>{const label=name.value.trim(),maximum=Number(total.value);if(!label||!Number.isInteger(maximum)||maximum<1||maximum>1000)throw Error('Укажите название и запас от 1 до 1000.');change(()=>{const state=liveState(actor.id);state.manualResources=state.manualResources||[];if(state.manualResources.length>=40)throw Error('В карточке уже 40 дополнительных счётчиков.');state.manualResources.push({name:label,total:maximum,used:0});game.setNativeState(actor.id,state);});}));details.append(form);
    const noteLabel=el('label','Заметки участника'),notes=el('textarea');notes.value=actor.state.sceneNotes||'';notes.maxLength=12000;notes.addEventListener('input',()=>{const state=G.clone(game.snapshot().actors.find(item=>item.id===actor.id).state);state.sceneNotes=notes.value;game.setNativeState(actor.id,state);dirty=true;persist();status('Заметки сохранены в локальном черновике.');});noteLabel.append(notes);details.append(noteLabel);
  }
  function renderActor(data){
    const host=$('actor-card');host.replaceChildren();const actor=data.actors.find(row=>row.id===data.selectedId);if(!actor){host.append(el('p','Выберите участника сцены.','empty-hint'));return;}
    host.append(el('h2',actor.name),el('p',kindNames[actor.kind],'kind-pill'));if(data.legacy)host.append(el('p','Перенесённый бой: исходные данные и счётчики сохранены. Эффекты предметов, подсказки тактики и автоматические действия прежнего инструмента здесь применяются вручную.','scene-note'));
    const renameLabel=el('label','Имя в этой сцене'),rename=el('input');rename.value=actor.name;rename.maxLength=180;rename.addEventListener('change',()=>change(()=>game.rename(actor.id,rename.value.trim()||actor.name)));renameLabel.append(rename);host.append(renameLabel);
    if(actor.kind==='manual'){host.append(el('p','Участник очереди с инициативой. Хиты персонажа игрока здесь не назначаются.'));return;}
    const card=actor.snapshot,profile=actor.kind==='monster'&&actor.state.phase===2&&card.ph2&&typeof card.ph2==='object'?{...card,...card.ph2}:card;
    const stats=el('div','','actor-stats');for(const [label,value]of [['ОЗ',E.actorHp(actor)+' / '+actor.maxHp],['КД',actor.kind==='npc'?card.co.ac:profile.ac],['Скорость',actor.kind==='npc'?card.co.sp+' фт':profile.spd]]){const item=el('div');item.append(el('strong',label),el('span',String(value??'—')));stats.append(item);}host.append(stats);
    const hp=el('div','','hp-actions'),amountLabel=el('label','Хитов'),amount=el('input');amount.type='number';amount.min=1;amount.max=1000000;amount.value=hpAmounts.get(actor.id)||'1';amount.addEventListener('input',()=>hpAmounts.set(actor.id,amount.value));amount.setAttribute('aria-label','Количество хитов');amountLabel.append(amount);hp.append(amountLabel);
    for(const [label,sign]of [['Нанести урон',-1],['Восстановить хиты',1]])hp.append(button(label,()=>{const value=Number(amount.value);if(!Number.isInteger(value)||value<1)throw Error('Укажите положительное число хитов.');change(()=>game.adjustHp(actor.id,sign*value));},actor.id+'-'+sign));host.append(hp);
    const conditions=el('div','','condition-list');for(const key of E.CONDITIONS){const toggle=button(condNames[key],()=>change(()=>game.condition(actor.id,key)),actor.id+'-condition-'+key);toggle.setAttribute('aria-pressed',String(E.actorConditions(actor).includes(key)));conditions.append(toggle);}host.append(conditions);
    if(actor.kind==='monster'&&card.ph2){const phase=button('Фаза '+actor.state.phase+' → '+(actor.state.phase===1?2:1),()=>change(()=>{const state=liveState(actor.id);state.phase=state.phase===1?2:1;game.setNativeState(actor.id,state);}));host.append(phase);}
    const last=actor.kind==='monster'?actor.state.roll?.quick?.text:actor.state.lastRoll;if(last)host.append(el('p',last,'roll-result'));
    if(actor.kind==='monster'&&card.ph2text){feature(host,'Вторая фаза',card.ph2text);host.append(el('p','Переключатель отмечает фазу. Условия и бонусы из её описания применяет Мастер; кнопки атак используют числа из карточки. Для изменённого урона укажите итоговую формулу ниже.','scene-note'));}
    host.append(el('h3','Атаки и действия'));
    for(const attack of profile.at||[]){const box=feature(host,attack.n,[attack.a,attack.d,attack.t,attack.r,attack.no].filter(Boolean).join(' · '));
      if(/^[+-]?\d+$/.test(String(attack.a||'')))box.append(button('Атака '+attack.a,()=>roll('1к20'+(Number(attack.a)>=0?'+':'')+Number(attack.a),attack.n,actor)));
      const damage=attackDamage(attack);
      if(damage)box.append(button('Бросить урон · '+damage,()=>roll(damage,attack.n+' · урон',actor)));else if(attack.d&&!attack.isMulti)box.append(el('p','Для броска урона введите итоговую формулу в поле ниже.','scene-note'));
    }
    const manualRoll=el('div','','encounter-buttons'),dice=el('input');dice.placeholder='Например, 2к6+1к8+4';dice.value=rollExpressions.get(actor.id)||'';dice.addEventListener('input',()=>rollExpressions.set(actor.id,dice.value));dice.setAttribute('aria-label','Формула броска');manualRoll.append(dice,button('Бросить кубики',()=>roll(dice.value,'Кубики',actor)));host.append(manualRoll);
    renderResources(host,actor);
    const rules=el('details');rules.dataset.panel='rules';rules.append(el('summary','Правила и снаряжение карточки'));host.append(rules);
    const abilitiesGrid=el('div','','actor-stats');for(const [key,label]of Object.entries({str:'СИЛ',dex:'ЛОВ',con:'ТЕЛ',int:'ИНТ',wis:'МДР',cha:'ХАР'})){const stat=el('div');stat.append(el('strong',label),el('span',String(card.st?.[key]??'—')));abilitiesGrid.append(stat);}rules.append(abilitiesGrid);
    feature(rules,actor.kind==='npc'?'Нация и уровень':'Вид и опасность',actor.kind==='npc'?(card.na+' · '+card.lv+' ур.'):((card.sz||'')+' · ПО '+(card.cr||'')));feature(rules,'Спасброски',actor.kind==='npc'?card.co.sv:card.sv);
    if(actor.kind==='npc')feature(rules,'Навыки',(card.sk||[]).map(item=>item.n+' '+item.v).join(' · '));else if(card.sk)feature(rules,'Навыки',card.sk);
    for(const item of actor.kind==='npc'?card.ab||[]:profile.tr||[])feature(rules,item.n,item.d);if(actor.kind==='monster'){if((profile.re||[]).length)rules.append(el('h3','Реакции'));for(const item of profile.re||[])feature(rules,item.n,item.d);if((profile.la||[]).length)rules.append(el('h3','Легендарные действия · '+profile.laC+' за раунд'));for(const item of profile.la||[])feature(rules,item.n,item.d);}
    if(actor.kind==='npc'){for(const item of card.eq||[])feature(rules,'Снаряжение',item.t);for(const item of card.tactics||[])feature(rules,item.ph,item.d);if(card.dm)feature(rules,'Заметки карточки',card.dm);for(const item of card.spells||[])feature(rules,item.n||item.name,[item.lv!==undefined?'Уровень '+item.lv:'',item.t?'Время: '+item.t:'',item.r?'Дистанция: '+item.r:'',item.dur?'Длительность: '+item.dur:'',item.sb?'Проверка: '+item.sb:'',item.slot?'Ячейка: '+item.slot:'',item.dmg?'Урон: '+item.dmg:'',item.ef].filter(Boolean).join(' · '));}
    else{for(const [name,key]of [['Сопротивления','res'],['Уязвимости','vul'],['Иммунитеты к урону','idmg'],['Иммунитеты к состояниям','ics'],['Чувства','sn'],['Языки','lng'],['Контр-механика','km'],['Описание','desc']])if(profile[key])feature(rules,name,profile[key]);}
    const journal=el('details');journal.dataset.panel='journal';journal.append(el('summary','Журнал сцены'),...data.log.map(item=>el('p','Раунд '+item.round+' · '+item.text)));journal.className='scene-journal';host.append(journal);
  }
  function updateTurn(data){
    const active=data.actors.find(actor=>actor.id===data.activeId);$('turn-status').textContent=(data.round?'Раунд '+data.round:'До боя')+(active?' · '+(data.running?'Ход: ':'Выбран ход: ')+active.name:' · Очередь пуста')+(data.round&&!data.running?' · Пауза':'');
    $('combat-start').textContent=data.running?'Пауза':data.round?'Продолжить бой':'Начать бой';$('combat-start').disabled=busy||!data.order.length;$('combat-next').disabled=busy||!data.running;
  }
  function render(){
    const focus=document.activeElement?.dataset?.focusKey,data=game.snapshot();$('scene-name').value=data.name;
    updateTurn(data);
    const opened=Array.from(document.querySelectorAll('#actor-card details[open][data-panel]')).map(node=>node.dataset.panel);renderParticipants(data);renderActor(data);for(const node of document.querySelectorAll('#actor-card details[data-panel]'))node.open=opened.includes(node.dataset.panel);renderCatalog();status(notice,noticeLevel);
    if(busy)document.querySelectorAll('.encounter-wrap input,.encounter-wrap select,.encounter-wrap textarea').forEach(node=>node.disabled=true);if(focus){const target=document.querySelector('[data-focus-key="'+CSS.escape(focus)+'"]');if(target?.disabled)target.closest('.resource-row')?.querySelector('button:not(:disabled)')?.focus();else target?.focus();}
  }
  function currentBook(){
    const transport=L.documents();if(bookKey!==transport.key){bookKey=transport.key;book=new E.SceneBook(transport);$('cloud-scenes').replaceChildren(el('option','Список ещё не загружен'));}
    return book;
  }
  function renderBooks(){
    const select=$('cloud-scenes');select.replaceChildren();const records=book.records().filter(row=>!row.archived);if(!records.length){const option=el('option','Сохранённых боёв пока нет');option.value='';select.append(option);}
    for(const row of records){const option=el('option',row.scene.name+' · '+row.scene.actors.length+' участников');option.value=row.sceneId;select.append(option);}if(cloudMeta?.key===bookKey)select.value=cloudMeta.sceneId;
  }
  async function loadBooks(){locked(true);try{const repo=currentBook(),targetKey=bookKey;await repo.load();if(book!==repo||bookKey!==targetKey)throw Error('Подключение изменилось; загрузите список заново.');renderBooks();status('Список боёв загружен из GitHub.');}catch(error){status(error.code==='NOT_FOUND'?'Сохранённых боёв пока нет. Первый бой создаст книгу при сохранении.':error.message,'error');}finally{locked(false);}}
  async function save(){
    locked(true);try{const repo=currentBook(),targetKey=bookKey;await repo.initialize();const data=game.snapshot(),revision=cloudMeta?.key===targetKey&&cloudMeta.sceneId===data.sceneId?cloudMeta.revision:null;const saved=await repo.save(data,{revision});cloudMeta={key:targetKey,sceneId:saved.sceneId,revision:saved.revision};dirty=false;persist();if(book===repo&&bookKey===targetKey)renderBooks();status('Бой «'+data.name+'» сохранён в GitHub.');}catch(error){persist();status(error.message+' Текущая сцена остаётся в черновике этой вкладки.','error');}finally{locked(false);}
  }
  async function open(){
    const sceneId=$('cloud-scenes').value;if(!sceneId)throw Error('Сначала загрузите список и выберите бой.');locked(true);
    try{const repo=currentBook(),targetKey=bookKey;await repo.load();if(book!==repo||bookKey!==targetKey)throw Error('Подключение изменилось; загрузите список заново.');const row=repo.records().find(item=>item.sceneId===sceneId&&!item.archived);if(!row)throw Error('Сохранённый бой не найден. Обновите список.');confirm('Открыть сохранённый бой?',row.scene.name+' · участников: '+row.scene.actors.length+'. Текущий черновик останется в резервной копии.',()=>{if(L.documents().key!==targetKey)throw Error('Подключение изменилось. Загрузите список заново.');replaceScene(row.scene,{key:targetKey,sceneId:row.sceneId,revision:row.revision});});}finally{locked(false);}
  }
  function exportFile(){const blob=new Blob([JSON.stringify(game.snapshot(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download=game.snapshot().sceneId+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('JSON боя подготовлен для скачивания.');}
  async function importFile(file){if(!file)return;if(file.size>8*1024*1024)throw Error('Файл боя превышает 8 МиБ.');const raw=JSON.parse(await file.text()),data=raw.format==='wot-monster-scene'?migrateData('monster',raw):E.validateScene(raw);confirm('Открыть JSON боя?',data.name+' · участников: '+data.actors.length+'. Текущий черновик останется в резервной копии.',()=>replaceScene(data));}
  function migrateData(kind,raw){const entries=catalog('all');if(kind==='npc'){const legacy=JSON.parse(localStorage.getItem('wot_custom_npcs_v1')||'[]');if(!Array.isArray(legacy))throw Error('Повреждён прежний каталог пользовательских NPC.');for(const row of legacy)entries.push({kind:'npc',snapshot:row});}return window.WOT_ENCOUNTER_MIGRATE[kind](raw,kind==='npc'?{npcs:entries.filter(x=>x.kind==='npc').map(x=>x.snapshot)}:{monsters:entries.filter(x=>x.kind==='monster').map(x=>x.snapshot),backgrounds:window.ANOMALY_BACKGROUNDS||[]});}
  function migrateLocal(kind){try{const key=kind==='npc'?'wot_dm_npc_state_v56':'wot.monsterScene.v1',raw=localStorage.getItem(key);if(!raw)throw Error('Прежний бой не найден в этом браузере.');if(raw.length>8*1024*1024)throw Error('Прежний бой превышает 8 МиБ.');const data=migrateData(kind,JSON.parse(raw));confirm('Перенести прежний бой?',data.name+' · участников: '+data.actors.length+'. Источник не изменяется. Текущая общая сцена останется в резервной копии. В сцену входят очередь и копии; при пустом боевом составе — все сохранённые карточки. Полный источник сохраняется вместе со сценой. Эффекты предметов и фаз применяются вручную.',()=>replaceScene(data));}catch(error){status('Перенос не выполнен: '+error.message,'error');}}
  async function handoff(){
    const params=new URLSearchParams(location.search),libraryId=params.get('addNpc');if(!libraryId)return;await L.ready;
    const row=L.records().find(item=>item.libraryId===libraryId);if(!row){status('Передаваемый NPC не найден. Обновите библиотеку и повторите переход.','error');return;}
    const transfer=params.get('transfer')||libraryId;const exists=game.snapshot().actors.some(actor=>actor.source.transfer===transfer);
    if(!exists){game.add({kind:'npc',name:row.npc.sh,snapshot:row.npc,source:{catalog:'npc-library',id:row.libraryId,revision:row.revision,transfer}},1);dirty=true;persist();}
    history.replaceState(null,'',location.pathname);status('NPC добавлен в текущую общую сцену. Сохраните бой в GitHub для переноса на другой компьютер.');
  }
  async function start(){
    restore();$('encounter-catalog').open=matchMedia('(min-width:901px)').matches;
    $('scene-name').addEventListener('input',()=>{game.change(data=>data.name=$('scene-name').value||'Общий бой');dirty=true;persist();});
    for(const id of ['catalog-search','catalog-kind'])$(id).addEventListener(id==='catalog-search'?'input':'change',()=>{visibleCount=60;renderCatalog();});
    $('catalog-more').onclick=()=>{visibleCount+=60;renderCatalog();};
    $('combat-start').onclick=()=>change(()=>game.snapshot().running?game.pause():game.start());$('combat-next').onclick=()=>change(()=>game.next());
    $('scene-copy').onclick=()=>{try{replaceScene(E.forkScene(game.snapshot()));status('Создана независимая копия боя. Сохраните её в GitHub, чтобы добавить в список.');}catch(error){status(error.message,'error');}};
    $('scene-new').onclick=()=>confirm('Начать новую сцену?','Текущая сцена останется в резервной копии этого браузера.',()=>replaceScene(E.newScene()));
    $('scene-backup').onclick=()=>{try{const data=draftStore.loadBackup();E.validateScene(data.scene);confirm('Открыть резервную копию?',data.scene.name,()=>replaceScene(data.scene,data.cloudMeta||null));}catch(error){status(error.message,'error');}};
    $('legacy-npc').onclick=()=>migrateLocal('npc');$('legacy-monster').onclick=()=>migrateLocal('monster');
    $('scene-save').onclick=save;$('scenes-refresh').onclick=loadBooks;$('scene-open').onclick=()=>open().catch(error=>status(error.message,'error'));
    $('scene-export').onclick=exportFile;$('scene-import').onclick=()=>{$('scene-file').value='';$('scene-file').click();};$('scene-file').onchange=()=>importFile($('scene-file').files[0]).catch(error=>status('Импорт не выполнен: '+error.message,'error'));
    $('manual-add').onclick=()=>{try{const name=$('manual-name').value.trim(),value=Number($('manual-initiative').value);if(!name)throw Error('Укажите имя участника.');if(!Number.isInteger(value)||value<-100||value>200)throw Error('Инициатива должна быть целым числом от -100 до 200.');change(()=>{const [id]=game.add({kind:'manual',snapshot:{name},name});game.setInitiative(id,value);});}catch(error){status(error.message,'error');}};
    $('confirm-cancel').onclick=()=>$('scene-confirm').close();$('confirm-apply').onclick=()=>{try{pending?.();$('scene-confirm').close();}catch(error){$('scene-confirm').close();status(error.message,'error');}};
    $('scene-confirm').addEventListener('close',()=>{pending=null;lastFocus?.focus();});
    locked(true);render();L.subscribe(()=>{renderCatalog();if(book&&L.documents().key!==bookKey){book=null;bookKey='';$('cloud-scenes').replaceChildren(el('option','Подключение изменилось: загрузите список боёв'));status('Выбрано другое хранилище. Текущий бой остаётся в черновике.');}});try{await L.ready;renderCatalog();await handoff();}finally{locked(false);}
  }
  document.addEventListener('DOMContentLoaded',()=>start().catch(error=>status(error.message,'error')));
})();
