(function(){
  'use strict';

  const STORAGE_KEY = 'wot.anomalyDmToolkit.v148';
  const $ = (selector) => document.querySelector(selector);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const clamp = (value,min,max) => Math.max(min,Math.min(max,value));
  const die = (sides) => Math.floor(Math.random()*sides)+1;
  const pick = (items) => items[Math.floor(Math.random()*items.length)];

  const TYPES = {
    A:{name:'Type A · Энергия', short:'Энергия', hint:'Авария физики: урон, принудительное движение, срыв концентрации и геометрические зоны.', damage:['силовой','холод','огонь','молния'], telegraphs:['По металлу бегут микродуги, а в пыли видны ровные кольца импульса.','Контуры камня двоятся, воздух пахнет озоном и сухим железом.','На стенах появляются слишком чистые линии среза, не похожие на следы оружия.'], nodes:['Одна линия разряда повторяется через одинаковый промежуток.','Пыль каждый раз оседает вокруг одной геометрически точной плоскости.','Микродуги сходятся к одной точке, хотя рядом нет металла.']},
    B:{name:'Type B · Иные измерения', short:'Иные измерения', hint:'Чужая экосистема: волны существ, опутывание, захват, трудная местность и засады.', damage:['кислота','яд','некротический','рубящий'], telegraphs:['Пол покрывает липкая плёнка, а сладковато-кислый туман держится у земли.','Тёмные жилы врастают в швы камня и пульсируют в одном ритме.','Свободные проходы слишком удобно ведут к слепым углам и коконам.'], nodes:['Все органические нити натянуты к одной мембране.','Туман втягивается в один пульсирующий узел перед каждой волной.','Коконы раскрываются по ритму, исходящему из одной камеры.']},
    C:{name:'Type C · Тел’аран’риод', short:'Тел’аран’риод', hint:'Переписанная причинность: психический урон, страх, потеря реакции и ложное движение.', damage:['психический','силовой','холод'], telegraphs:['Дверь отбрасывает тень окна, а эхо приходит раньше звука.','Лунный свет падает не с той стороны, и отражение показывает другой ракурс.','Быстрый жест оставляет пропущенный кадр, но не полноценного двойника.'], nodes:['Одно отражение повторяет движение с одинаковой ошибкой.','Неверные тени всякий раз сходятся к одной пустой рамке.','Перспектива возвращается в норму на одном и том же пороге.']}
  };

  const SIGNATURES = {
    A:[
      {id:'a-lines',name:'Линии среза',text:'Прозрачные плоскости режут траектории. Пульс смещает существ или закрывает прямой путь.'},
      {id:'a-gravity',name:'Сбой гравитации',text:'Импульс тянет к Ядру, сбивает с ног или превращает отмеченный сектор в трудную местность.'},
      {id:'a-discharge',name:'Озонный разряд',text:'Металл и заряженная пыль показывают границу; пульс наносит урон и срывает реакции.'}
    ],
    B:[
      {id:'b-hunt',name:'Охотничьи коридоры',text:'Липкие зоны направляют движение к засаде. Пульс закрывает один безопасный проход.'},
      {id:'b-spores',name:'Ферментный туман',text:'Туман скрывает пол и коконы. Пульс накладывает помеху, истощение или краткое заражение.'},
      {id:'b-tethers',name:'Живые связки',text:'Нити цепляют и удерживают. Пульс опутывает или подтягивает к узлу.'}
    ],
    C:[
      {id:'c-afterimage',name:'Срыв образа',text:'Движения теряют фазы. Пульс даёт помеху, ложное перемещение или потерю реакции.'},
      {id:'c-false-win',name:'Ложная победа',text:'Разрыв подменяет результат действия. Пульс заставляет перепроверить цель или исход.'},
      {id:'c-frame',name:'Неверная рамка',text:'Двери и отражения меняют причинность. Пульс закрывает реальный выход и открывает ложный.'}
    ]
  };

  const SIZES = [
    {id:1,name:'S1 · Точечная',core:'10 фт',halo:'30 фт',scene:'дверной проём, колодец, алтарь или центр комнаты'},
    {id:2,name:'S2 · Комната',core:'20 фт',halo:'60 фт',scene:'зал, склад, мастерская или участок подземелья'},
    {id:3,name:'S3 · Дом',core:'40 фт',halo:'120 фт',scene:'здание и двор вокруг него'},
    {id:4,name:'S4 · Участок / двор',core:'80 фт',halo:'240 фт',scene:'площадь, двор, перекрёсток или часть руин'},
    {id:5,name:'S5 · Малая улица',core:'160 фт',halo:'480 фт',scene:'улица, доки или участок стены'},
    {id:6,name:'S6 · Квартал',core:'320 фт',halo:'960 фт',scene:'целый квартал; временный максимум масштаба'}
  ];

  const MOBILITY = [
    {id:1,name:'Неподвижна',cadence:'Не смещается',rule:'Центр стоит на месте.'},
    {id:2,name:'Ползущая',cadence:'Каждые 10 минут',rule:'Сместить центр на 1d6×10 фт.'},
    {id:3,name:'Блуждающая',cadence:'Каждые 1d4 минут',rule:'Сместить центр на 1d6×10 фт.'},
    {id:4,name:'Рывками',cadence:'На каждом пульсе',rule:'Пульс может сместить центр на 2d6×10 фт.'}
  ];

  const RANKS = [
    {id:1,name:'I · Страж-послушник',summon:'Действие; появляется в конце хода, до этого нужна концентрация. Активация — действием в один из следующих ходов.'},
    {id:2,name:'II · Страж Узла',summon:'Действие; появляется в конце хода, до этого нужна концентрация. Активация — действием в один из следующих ходов.'},
    {id:3,name:'III · Ткач Потока',summon:'Призыв действием, появляется сразу. Активация и установка — бонусным действием.'},
    {id:4,name:'IV · Старший Ткач',summon:'Призыв действием, появляется сразу. Активация и установка — бонусным действием. Один раз за операцию можно перебросить свой спасбросок техники.'},
    {id:5,name:'V · Чемпион Узора',summon:'Призыв бонусным действием, появляется сразу. Активация — отдельным бонусным действием.'},
    {id:6,name:'VI · Архистраж',summon:'Призыв бонусным действием, появляется сразу. Активация — отдельным бонусным действием.'}
  ];

  const MISSIONS = ['Схлопнуть аномалию Пирамидкой','Найти и обозначить узловую точку','Эвакуировать людей из Ореола','Пересечь зону и выйти','Удержать периметр до прибытия Ордена','Забрать объект из Ядра','Пережить естественное затухание'];

  const RATINGS = {
    1:{name:'Опасная трещина',core:'2d6',pulse:{mode:'die',sides:4},pulseText:'Малый всплеск: одна цель получает 1d6 урона или помеху на один бросок.',wave:{mode:'die',sides:4},cr:'4–6',waveText:'1 существо каждые 1d4 раунда.',loot:25,rarity:'обычный 20%, необычный 5%',advice:'Покажите, что даже малая аномалия опасна, если стоять в Ядре.'},
    2:{name:'Живой разлом',core:'3d6',pulse:{mode:'fixed',value:10},pulseText:'Краткая петля раз в минуту: сдвиг на 10 фт или трудная местность на 1 раунд.',wave:{mode:'die',sides:3},cr:'5–7',waveText:'1–2 существа каждые 1d3 раунда.',loot:35,rarity:'обычный 20%, необычный 12%, редкий 3%',advice:'Ломайте позиционирование и вынуждайте двигаться, а не убивайте одним эффектом.'},
    3:{name:'Пульс Узора',core:'4d6',pulse:{mode:'die',sides:4},pulseText:'Изменить один элемент рельефа. Дополнительно каждый 3-й раунд: эхо, СЛ аномалии; помеха на Восприятие/ориентацию.',wave:{mode:'fixed',value:2},cr:'6–8',waveText:'2 существа каждые 2 раунда; для короткой сцены допустимо 1 за раунд.',loot:45,rarity:'обычный 20%, необычный 15%, редкий 8%, очень редкий 2%',advice:'Каждый пульс должен менять решение: путь, укрытие, дистанцию или разделение группы.'},
    4:{name:'Разрыв правил',core:'5d6',pulse:{mode:'die',sides:4},pulseText:'Один объявленный заранее контроль среды. Провал: ослепление или оглушение на 1 раунд.',wave:{mode:'fixed',value:2},cr:'7–9',waveText:'2–3 существа каждые 2 раунда.',loot:55,rarity:'необычный 25%, редкий 20%, очень редкий 8%, легендарный 2%',advice:'Выберите один ясный сбой закона на всю сцену, а не новый эффект каждый раунд.'},
    5:{name:'Срыв реальности',core:'6d6',pulse:{mode:'fixed',value:3},pulseText:'Волна: СЛ аномалии; провал — перемещение на 10–20 фт или падение ничком.',wave:{mode:'fixed',value:2},cr:'8–10',waveText:'3 существа каждые 2 раунда; иногда 1 за раунд для давления.',loot:65,rarity:'редкий 30%, очень редкий 25%, легендарный 10%',advice:'Аномалия — равноправный участник боя. Не добавляйте лишний контроль всем существам.'},
    6:{name:'Открытая рана',core:'7d6',pulse:{mode:'fixed',value:2},pulseText:'Аномальная метка: провал — помеха на следующий спасбросок или концентрацию.',wave:{mode:'fixed',value:2},cr:'9–11',waveText:'3–4 существа каждые 2 раунда или 1–2 за раунд.',loot:75,rarity:'редкий 25%, очень редкий 35%, легендарный 15%',advice:'Давите на концентрацию, реакции и безопасные позиции, но не на все ресурсы сразу.'},
    7:{name:'Разлом с памятью',core:'8d6',pulse:{mode:'fixed',value:2},pulseText:'Когнитивная волна: провал — очарование, ужас или потеря реакции на 1 раунд.',wave:{mode:'fixed',value:2},cr:'10–12',waveText:'4 существа каждые 2 раунда; часто 2 за раунд.',loot:85,rarity:'очень редкий 45%, легендарный 20%, артефакт 20%',advice:'Используйте страхи как форму, но всегда называйте СЛ, длительность и условие снятия.'},
    8:{name:'Пограничный провал',core:'10d6',pulse:{mode:'fixed',value:1},pulseText:'Каждый раунд в Ядре — дополнительный эффект: слепота, немота, замедление или срыв концентрации до конца следующего хода.',wave:{mode:'fixed',value:1},cr:'12–14',waveText:'2–3 существа каждый раунд или 5 за 2 раунда.',loot:90,rarity:'редкий 10%, очень редкий 50%, легендарный 30%',advice:'Выберите два состояния зоны и переключайте их; не придумывайте новую физику каждый раунд.'},
    9:{name:'Катастрофическая временная',core:'12d6',pulse:{mode:'fixed',value:1},pulseText:'Ореол каждый раунд: СЛ аномалии; провал — 3d6 урона. Провал Ядра на 5+ может дать краткую потерю хода или памяти.',wave:{mode:'fixed',value:1},cr:'14–16',waveText:'3 существа каждый раунд или 1 сильное + 1–2 средних.',loot:95,rarity:'редкий 5%, очень редкий 45%, легендарный 45%',advice:'Это катастрофа, которую переживают или стабилизируют, а не обычный бой на победу.'},
    10:{name:'Пролом Узора',core:'16d6',pulse:{mode:'fixed',value:1},pulseText:'Каждый раунд — один феномен с явной областью, спасброском, длительностью и условием снятия.',wave:{mode:'fixed',value:1},cr:'16–18+',waveText:'1–2 существа каждый раунд; якорное элитное — раз в 3 раунда.',loot:98,rarity:'легендарный 60%, очень редкий 35%, остальное редкий',advice:'Кульминация арки. Победа — закрыть, отвести, стабилизировать или пережить.'}
  };

  const PHASES = [
    {key:'prep',short:'0 · До входа',title:'До входа',lead:'Зафиксируйте паспорт и цену ошибки до того, как начнётся инициатива.',rule:'Рейтинг задаёт числа; тип задаёт язык эффектов; размер и подвижность выбираются отдельно.'},
    {key:'recon',short:'1 · Разведка',title:'Граница и узел',lead:'Покажите признаки, выведите людей и найдите повторяющийся ритм узловой точки.',rule:'Поиск узла занимает 1 минуту и использует СЛ 10 + R. Каждая повторная минута может вызвать выброс.'},
    {key:'install',short:'2 · Установка',title:'Поставить Пирамидку',lead:'Призовите тер’ангриал, активируйте его в найденной точке и объявите условия удержания.',rule:'После установки руки свободны и концентрация не требуется. Канал держится только при трёх условиях оператора.'},
    {key:'hold',short:'3 · Удержание',title:'Боевые раунды',lead:'Каждый раунд смотрите только на три счётчика: Ядро, пульс и волну. Извлечение меняется в конце хода оператора.',rule:'Не складывайте всю опасность в один момент без предупреждения. Ядро, пульс и монстры уже образуют полный энкаунтер.'},
    {key:'lock',short:'4 · Замок',title:'Замок Узора',lead:'Когда таймер равен нулю, сделайте финальный спасбросок и сразу разрешите успех или таблицу провала.',rule:'Провал не всегда обнуляет операцию: в 90% случаев канал продолжается ещё 1d4 раунда.'},
    {key:'after',short:'5 · После',title:'После схлопывания',lead:'Заберите заполненную Пирамидку, сделайте один бросок остатка и запишите последствия.',rule:'Заполненную Пирамидку нельзя отозвать. Её физически доставляют к Сфере и синхронизируют 1 минуту.'}
  ];

  function newMember(index){return {id:Date.now()+index+Math.random(),name:`Участник ${index}`,zone:'halo',saveBonus:0,notes:'',coreCheckedRound:0};}
  function freshState(){
    return {version:148,sceneName:'',rating:5,type:'A',secondary:'none',size:2,mobility:1,mobilityIn:0,elapsedMinutes:0,rank:3,mission:MISSIONS[0],signature:'a-lines',damageType:'силовой',telegraph:TYPES.A.telegraphs[0],nodeSign:TYPES.A.nodes[0],phase:'prep',phaseChecks:{},combat:false,round:0,pulseIn:3,waveIn:2,nodeFound:false,nodeObvious:false,pyramidInstalled:false,channelActive:false,extractionTotal:0,extractionRemaining:0,finalDue:false,marked:false,collapsed:false,charged:false,lootRolled:false,operatorBonus:0,pyramidHp:80,party:[1,2,3,4].map(newMember),enemies:[],alerts:[],log:[]};
  }
  function normalize(data){
    const state=Object.assign(freshState(),data||{},{version:148});
    state.rating=clamp(Number(state.rating)||5,1,10);state.size=clamp(Number(state.size)||2,1,6);state.mobility=clamp(Number(state.mobility)||1,1,4);state.rank=clamp(Number(state.rank)||1,1,6);state.elapsedMinutes=Math.max(0,Number(state.elapsedMinutes)||0);state.mobilityIn=Math.max(0,Number(state.mobilityIn)||0);
    state.party=(state.party||[]).map((member,index)=>Object.assign(newMember(index+1),member,{saveBonus:Number(member.saveBonus)||0,coreCheckedRound:Number(member.coreCheckedRound)||0}));
    state.enemies=Array.isArray(state.enemies)?state.enemies:[];
    if(!SIGNATURES[state.type].some((item)=>item.id===state.signature)) state.signature=SIGNATURES[state.type][0].id;
    if(!TYPES[state.type].damage.includes(state.damageType)) state.damageType=TYPES[state.type].damage[0];
    return state;
  }
  function load(){try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));if(saved&&saved.version===148)return normalize(saved);}catch(error){}return freshState();}
  let state=load();
  const monsters=(window.ANOMALY_MONSTERS||[]).map((monster)=>({id:monster.id,name:monster.nm,cr:String(monster.cr),rating:Number(monster.rating),type:monster.anomalyType,style:monster.style||'',role:monster.km||''}));

  function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
  function rating(){return RATINGS[state.rating];}
  function size(){return SIZES.find((item)=>item.id===state.size)||SIZES[0];}
  function mobility(){return MOBILITY.find((item)=>item.id===state.mobility)||MOBILITY[0];}
  function rank(){return RANKS.find((item)=>item.id===state.rank)||RANKS[0];}
  function phaseIndex(){return Math.max(0,PHASES.findIndex((item)=>item.key===state.phase));}
  function stamp(){return state.combat?`Раунд ${Math.max(1,state.round)}`:PHASES[phaseIndex()].title;}
  function addLog(text){state.log.unshift({time:stamp(),text});state.log=state.log.slice(0,100);}
  function addAlert(title,text,danger=false){state.alerts.unshift({id:Date.now()+Math.random(),title,text,danger});state.alerts=state.alerts.slice(0,8);}
  function toast(text){const node=$('#toast');node.textContent=text;node.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>node.classList.remove('show'),2200);}
  function resetCounter(config){return config.mode==='die'?die(config.sides):config.value;}
  function resetRhythms(){state.pulseIn=resetCounter(rating().pulse);state.waveIn=resetCounter(rating().wave);}
  function selectedSignature(){return SIGNATURES[state.type].find((item)=>item.id===state.signature)||SIGNATURES[state.type][0];}

  function initOptions(){
    $('#ratingSelect').innerHTML=Object.keys(RATINGS).map((key)=>`<option value="${key}">R${key}</option>`).join('');
    $('#sizeSelect').innerHTML=SIZES.map((item)=>`<option value="${item.id}">${esc(item.name)}</option>`).join('');
    $('#mobilitySelect').innerHTML=MOBILITY.map((item)=>`<option value="${item.id}">${esc(item.name)}</option>`).join('');
    $('#rankSelect').innerHTML=RANKS.map((item)=>`<option value="${item.id}">${esc(item.name)}</option>`).join('');
    $('#missionSelect').innerHTML=MISSIONS.map((item)=>`<option>${esc(item)}</option>`).join('');
  }

  function renderHeader(){
    $('#sceneName').value=state.sceneName;$('#ratingSelect').value=state.rating;$('#typeSelect').value=state.type;$('#sizeSelect').value=state.size;$('#mobilitySelect').value=state.mobility;$('#rankSelect').value=state.rank;
    $('#dcValue').textContent=`СЛ ${10+state.rating}`;$('#ratingName').textContent=rating().name;$('#typeHint').textContent=TYPES[state.type].hint;$('#sizeHint').textContent=`Ядро ${size().core} · Ореол ${size().halo}`;$('#mobilityHint').textContent=`${mobility().cadence}: ${mobility().rule}${state.mobility===3&&state.mobilityIn?` Следующее через ${state.mobilityIn} мин.`:''}`;$('#rankHint').textContent=rank().summon;
    $('#roundValue').textContent=state.combat?`Раунд ${Math.max(1,state.round)}`:state.collapsed?'Схлопнута':state.elapsedMinutes?`${state.elapsedMinutes} мин · разведка`:'До входа';$('#toggleCombat').textContent=state.combat?'Остановить сцену':'Начать сцену';
  }

  function renderPassport(){
    $('#missionSelect').value=state.mission;$('#secondaryType').value=state.secondary;
    $('#signatureSelect').innerHTML=SIGNATURES[state.type].map((item)=>`<option value="${item.id}">${esc(item.name)}</option>`).join('');$('#signatureSelect').value=state.signature;
    $('#damageType').innerHTML=TYPES[state.type].damage.map((item)=>`<option>${esc(item)}</option>`).join('');$('#damageType').value=state.damageType;$('#telegraph').value=state.telegraph;$('#nodeSign').value=state.nodeSign;
    const secondary=state.secondary==='none'?'без вторичного типа':`вторичный ${TYPES[state.secondary].name}`;
    $('#passportSummary').innerHTML=`<b>R${state.rating} · ${esc(TYPES[state.type].name)} · ${esc(size().name)} · ${esc(mobility().name)}</b><br/>Задача: ${esc(state.mission)}. Ядро ${size().core}, Ореол ${size().halo}. Один почерк: ${esc(selectedSignature().name)} — ${esc(selectedSignature().text)} Урон Ядра: ${rating().core} ${esc(state.damageType)}; ${secondary}.`;
  }

  function renderTimers(){
    const coreMembers=state.party.filter((member)=>member.zone==='core');
    $('#coreTimer').textContent=coreMembers.length?`${coreMembers.length} в Ядре`:'Никого в Ядре';$('#coreRule').textContent=`Один раз за раунд для каждого: СЛ ${10+state.rating}, ${rating().core} ${state.damageType}; при успехе половина, если используется стандартная модель.`;
    $('#pulseTimer').textContent=state.pulseIn<=0?'Сейчас':`Через ${state.pulseIn} р.`;$('#pulseRule').textContent=rating().pulseText;$('#waveTimer').textContent=state.waveIn<=0?'Сейчас':`Через ${state.waveIn} р.`;$('#waveRule').textContent=`CR ${rating().cr}. ${rating().waveText}`;
    $('#extractionTimer').textContent=state.collapsed?'Схлопнута':state.channelActive?`${state.extractionRemaining} р. осталось`:state.pyramidInstalled?'Канал сорван':'Не установлена';$('#extractionRule').textContent=state.channelActive?'Уменьшайте в конце хода оператора, а не в начале раунда.':'Счётчик уменьшается только в конце хода оператора.';
    document.querySelectorAll('.adm-timer').forEach((node)=>node.classList.remove('due'));if(state.pulseIn<=0)$('#pulseTimer').closest('.adm-timer').classList.add('due');if(state.waveIn<=0)$('#waveTimer').closest('.adm-timer').classList.add('due');if(state.finalDue)$('#extractionTimer').closest('.adm-timer').classList.add('due');
    $('#operatorTurnEnd').disabled=!state.channelActive||state.collapsed;$('#finalSave').disabled=!state.finalDue||state.collapsed;
  }

  function checklistForPhase(){
    const dc=10+state.rating;
    if(state.phase==='prep')return [
      ['passport','Паспорт определён',`R${state.rating}, ${TYPES[state.type].name}, ${size().name}, ${mobility().name}.`],
      ['goal','Задача объявлена',state.mission],
      ['sign','Опасность наблюдаема',state.telegraph||'Запишите один признак до входа.'],
      ['balance','Учтена вся сложность',`Ядро ${rating().core}, пульс и волны CR ${rating().cr} уже входят в бюджет сцены.`]
    ];
    if(state.phase==='recon')return [
      ['perimeter','Периметр и эвакуация',`Ореол ${size().halo}; отметьте безопасный край.`],
      ['rhythm','Ритм найден',state.nodeSign||'Найдите повторяющийся признак.'],
      ['node','Узловая точка найдена',state.nodeFound?'Найдена.':'1 минута, проверка против СЛ '+dc+'.'],
      ['positions','Стартовые зоны отмечены','Для каждого участника выберите: вне зоны, Ореол или Ядро.']
    ];
    if(state.phase==='install')return [
      ['summon','Пирамидка призвана',rank().summon],
      ['placed','Установлена не дальше 5 фт от узла',state.pyramidInstalled?'Установлена.':'Канал ещё не начат.'],
      ['conditions','Три условия канала понятны','Сознание, тот же план, не дальше 60 фт.'],
      ['defense','Отряд защищает точку','Преследование врага не важнее Пирамидки.']
    ];
    if(state.phase==='hold')return [
      ['core','Ядро проверено',`${state.party.filter((m)=>m.zone==='core'&&m.coreCheckedRound!==state.round).length} ещё не проверено в этом раунде.`],
      ['pulse','Пульс разрешён',state.pulseIn<=0?'Срабатывает сейчас.':`Через ${state.pulseIn} раунд(а).`],
      ['wave','Волна разрешена',state.waveIn<=0?'Срабатывает сейчас.':`Через ${state.waveIn} раунд(а).`],
      ['operator','Ход оператора закрыт',state.channelActive?`${state.extractionRemaining} раунд(а) осталось.`:'Канал не активен.']
    ];
    if(state.phase==='lock')return [
      ['zero','Счётчик достиг нуля',state.finalDue?'Да.':'Нет — вернитесь к удержанию.'],
      ['conditions','Канал не сорван','Оператор в сознании, на плане и в 60 фт.'],
      ['save','Финальный спасбросок',`Ключевая характеристика против СЛ ${dc}.`],
      ['result','Результат сразу разрешён',state.collapsed?'Успех: аномалия схлопнута.':'При провале бросьте к100 и продолжите или сорвите канал.']
    ];
    return [
      ['charge','Заполненная Пирамидка забрана',state.charged?'Заряд получен.':'Заряда нет.'],
      ['loot','Один бросок остатка',state.lootRolled?'Выполнен.':`Базовый шанс ${rating().loot}%.`],
      ['effects','Последствия записаны','Истощение, метки, мутации, потерянные предметы и память.'],
      ['delivery','Маршрут к Сфере определён','Заполненную Пирамидку нельзя отозвать.']
    ];
  }

  function renderDirector(){
    const current=PHASES[phaseIndex()];$('#phaseRail').innerHTML=PHASES.map((phase,index)=>`<button class="wdm-phase-step ${phase.key===state.phase?'active':''} ${index<phaseIndex()?'done':''}" data-phase="${phase.key}" type="button"><span>${index}</span><b>${esc(phase.short.replace(/^\d+ · /,''))}</b></button>`).join('');
    $('#phaseKicker').textContent=`Этап ${phaseIndex()} из ${PHASES.length-1}`;$('#phaseTitle').textContent=current.title;$('#phaseLead').textContent=current.lead;$('#phaseRule').textContent=current.rule;$('#phaseBadge').textContent=state.combat?`Раунд ${state.round} · ${current.title}`:state.collapsed?'Аномалия схлопнута':current.title;
    $('#phaseChecklist').innerHTML=checklistForPhase().map(([key,title,text])=>`<label class="wdm-phase-duty"><input type="checkbox" data-phase-check="${current.key}-${key}" ${state.phaseChecks[`${current.key}-${key}`]?'checked':''}/><span><b>${esc(title)}</b><small>${esc(text)}</small></span></label>`).join('');
    const responsibilities=[['Герои','Цель / спасение',state.mission],['Оператор','Узел / канал',state.channelActive?`В конце хода: −1 раунд (${state.extractionRemaining})`:'Найти узел и установить Пирамидку'],['Аномалия','Ядро / пульс',state.pulseIn<=0?'Пульс сейчас':`Пульс через ${state.pulseIn}`],['Существа','Давление на точку',state.waveIn<=0?'Волна сейчас':`Волна через ${state.waveIn}`]];
    $('#responsibilityGrid').innerHTML=responsibilities.map(([tag,title,text],index)=>`<article class="wdm-responsibility ${state.phase==='hold'?'active':''}"><span>${esc(tag)}</span><b>${esc(title)}</b><p>${esc(text)}</p></article>`).join('');
    $('#phaseBack').disabled=phaseIndex()===0;const next=PHASES[Math.min(PHASES.length-1,phaseIndex()+1)];$('#phaseNext').textContent=phaseIndex()===PHASES.length-1?'Операция завершена':`К этапу «${next.title}»`;$('#phaseNext').disabled=phaseIndex()===PHASES.length-1;$('#footerPhaseNext').textContent=$('#phaseNext').textContent;$('#footerPhaseNext').disabled=$('#phaseNext').disabled;
  }

  function renderNode(){
    const dc=10+state.rating;$('#nodeDc').textContent=`СЛ ${dc}`;$('#finalDc').textContent=`СЛ ${dc}`;$('#summonRule').textContent=rank().summon;$('#operatorBonus').value=state.operatorBonus;$('#pyramidHp').value=state.pyramidHp;$('#pyramidHp').max=50+10*state.rank;$('#pyramidStats').textContent=`КД 18 · максимум ${50+10*state.rank} хитов`;
    $('#nodeObvious').checked=state.nodeObvious===true;$('#operatorConscious').checked=state.operatorConscious!==false;$('#operatorPlane').checked=state.operatorPlane!==false;$('#operatorRange').checked=state.operatorRange!==false;
    $('#installPyramid').disabled=!state.nodeFound||state.channelActive||state.collapsed;$('#nodeCheck').disabled=state.nodeFound;$('#channelState').textContent=state.collapsed?'Схлопнута':state.channelActive?'Канал удерживается':state.pyramidInstalled?'Канал сорван':state.nodeFound?'Узел найден':'Канал не начат';
  }

  function renderParty(){
    $('#partyList').innerHTML=state.party.length?state.party.map((member)=>`<div class="adm-party-row ${member.zone==='core'?'in-core':''} ${member.coreCheckedRound===state.round&&state.round>0?'checked':''}" data-member="${member.id}"><input class="party-name" value="${esc(member.name)}" aria-label="Имя участника"/><select class="party-zone" aria-label="Зона участника"><option value="outside" ${member.zone==='outside'?'selected':''}>Вне аномалии</option><option value="halo" ${member.zone==='halo'?'selected':''}>Ореол</option><option value="core" ${member.zone==='core'?'selected':''}>Ядро</option></select><input class="party-save" type="number" min="-5" max="30" value="${Number(member.saveBonus)||0}" aria-label="Бонус спасброска"/><input class="party-notes" value="${esc(member.notes||'')}" placeholder="Метки, истощение, эффекты" aria-label="Эффекты участника"/><button class="wdm-btn danger" data-remove-member="${member.id}" type="button" aria-label="Удалить участника">×</button></div>`).join(''):'<div class="wdm-empty">Добавьте участников, чтобы пульт показывал, кого проверять в Ядре.</div>';
  }

  function matchingMonsters(){return monsters.filter((monster)=>monster.rating===state.rating&&monster.type===state.type);}
  function monsterOptions(selected){
    const pool=matchingMonsters();let options=`<option value="custom" ${selected==='custom'?'selected':''}>Существо вручную · CR ${rating().cr}</option>`;
    if(pool.length)options+=pool.map((monster)=>`<option value="${monster.id}" ${monster.id===selected?'selected':''}>${esc(monster.name)} · CR ${esc(monster.cr)} · ${esc(monster.style)}</option>`).join('');
    const selectedMonster=monsters.find((monster)=>monster.id===selected);if(selectedMonster&&!pool.some((monster)=>monster.id===selected))options+=`<option value="${selectedMonster.id}" selected>${esc(selectedMonster.name)} · CR ${esc(selectedMonster.cr)} · другой пакет</option>`;
    return options;
  }
  function enemyLabel(item){const monster=monsters.find((entry)=>entry.id===item.monsterId);return monster?`${monster.name} · CR ${monster.cr}`:`Существо CR ${rating().cr}`;}
  function renderEnemies(){
    const pool=matchingMonsters();$('#waveHelp').innerHTML=`Рекомендуется: <b>CR ${rating().cr}</b>. ${esc(rating().waveText)} ${pool.length?`В бестиарии найдено ${pool.length} подходящих карточки/карточек для R${state.rating} Type ${state.type}.`:'Готового пакета для этого рейтинга и типа в текущем бестиарии нет.'}`;
    $('#enemyRoster').innerHTML=state.enemies.length?state.enemies.map((enemy)=>`<div class="wdm-enemy-row" data-enemy="${enemy.id}"><select class="enemy-monster">${monsterOptions(enemy.monsterId)}</select><label><span>Количество</span><input class="enemy-count" type="number" min="1" max="20" value="${clamp(Number(enemy.count)||1,1,20)}"/></label><button class="wdm-btn danger" data-remove-enemy="${enemy.id}" type="button">×</button></div>`).join(''):'<div class="wdm-empty">Состав ещё не задан. Нажмите «Подставить доступный пакет».</div>';
  }

  function nowItems(){
    const items=[];if(!state.combat){items.push(['Сверьте паспорт','Рейтинг, тип, размер и подвижность должны быть известны до входа.']);if(!state.nodeFound)items.push(['Найдите узловую точку',`1 минута и проверка против СЛ ${10+state.rating}; повторная минута может вызвать выброс.`]);if(state.mobility>1)items.push(['Следите за центром',`${mobility().cadence}: ${mobility().rule}`]);if(state.nodeFound&&!state.pyramidInstalled)items.push(['Установите Пирамидку',rank().summon]);}
    else {const unchecked=state.party.filter((member)=>member.zone==='core'&&member.coreCheckedRound!==state.round);if(unchecked.length)items.push([`Ядро: ${unchecked.length} не проверено`,`Один спасбросок каждого за раунд: СЛ ${10+state.rating}, урон ${rating().core}.`,true]);if(state.pulseIn<=0)items.push(['Пульс среды сейчас',rating().pulseText,true]);else items.push(['Пульс среды',`Через ${state.pulseIn} раунд(а).`]);if(state.waveIn<=0)items.push(['Волна существ сейчас',`CR ${rating().cr}. ${rating().waveText}`,true]);else items.push(['Волна существ',`Через ${state.waveIn} раунд(а).`]);if(state.channelActive)items.push(['Конец хода оператора',`Уменьшить извлечение: сейчас ${state.extractionRemaining} раунд(а).`]);if(state.finalDue)items.push(['Замок Узора',`Финальный спасбросок против СЛ ${10+state.rating}.`,true]);}
    if(state.collapsed)items.splice(0,items.length,['Заберите заряд','Заполненную Пирамидку нельзя отозвать.'],['Один бросок остатка',`Шанс ${Math.min(100,rating().loot+10)}% при успешном извлечении.`],['Запишите последствия','Метки, мутации, истощение, память и потерянное время.']);return items;
  }
  function renderNow(){const items=nowItems();$('#nowTitle').textContent=state.collapsed?'После схлопывания':state.combat?`Раунд ${state.round}`:PHASES[phaseIndex()].title;$('#nowList').innerHTML=items.map(([title,text,warn])=>`<div class="adm-now-item ${warn?'warn':''}"><b>${esc(title)}</b><span>${esc(text)}</span></div>`).join('');}

  function renderReference(){const info=rating();$('#ratingReferenceTitle').textContent=`R${state.rating} · ${info.name}`;$('#ratingReference').innerHTML=`<div class="adm-ref-block"><span>Ядро</span><b>СЛ ${10+state.rating} · ${info.core}</b><p>Один раз за раунд для каждого находящегося внутри.</p></div><div class="adm-ref-block"><span>Пульс</span><b>${info.pulse.mode==='die'?`каждые 1d${info.pulse.sides}`:`каждые ${info.pulse.value}`} раунда</b><p>${esc(info.pulseText)}</p></div><div class="adm-ref-block"><span>Существа</span><b>CR ${esc(info.cr)}</b><p>${esc(info.waveText)}</p></div><div class="adm-ref-block"><span>Лут</span><b>${info.loot}%</b><p>${esc(info.rarity)}</p></div><div class="adm-ref-block"><span>Ведение</span><p>${esc(info.advice)}</p></div>`;}
  function renderAlerts(){$('#alerts').innerHTML=state.alerts.map((item)=>`<div class="wdm-alert ${item.danger?'danger':''}"><b>${esc(item.title)}</b> · ${esc(item.text)} <button class="wdm-btn small" data-dismiss-alert="${item.id}" type="button">Разрешено</button></div>`).join('');}
  function renderLog(){$('#eventLog').innerHTML=state.log.length?state.log.map((item)=>`<div class="wdm-log-entry"><time>${esc(item.time)}</time><span>${esc(item.text)}</span></div>`).join(''):'<div class="wdm-empty">Журнал пока пуст. Пульсы, волны и действия Пирамидки попадут сюда автоматически.</div>';}
  function renderAftermath(){const chance=Math.min(100,rating().loot+(state.charged?10:0));$('#lootChance').textContent=`${chance}%`;$('#lootBonusHint').textContent=state.charged?`База ${rating().loot}% +10% за Пирамидку`:'Бонус +10% только после успешного извлечения';$('#chargeState').textContent=state.charged?'Заполнена':'Нет';$('#rollLoot').disabled=state.lootRolled||(!state.collapsed&&state.phase!=='after');}
  function render(){renderHeader();renderPassport();renderTimers();renderDirector();renderNode();renderParty();renderEnemies();renderNow();renderReference();renderAlerts();renderLog();renderAftermath();save();}

  function setPhase(key){if(!PHASES.some((item)=>item.key===key))return;state.phase=key;if(key==='hold'&&!state.combat){const firstStart=state.round===0;state.combat=true;state.round=Math.max(1,state.round);if(firstStart)resetRhythms();addLog('Начато удержание узла.');}render();}
  function startScene(){state.combat=!state.combat;if(state.combat){const firstStart=state.round===0;state.round=Math.max(1,state.round||1);state.phase=state.pyramidInstalled?'hold':state.nodeFound?'install':'recon';if(firstStart){resetRhythms();state.party.forEach((member)=>member.coreCheckedRound=0);}addLog(`${firstStart?'Сцена начата':'Сцена продолжена'}. Пульс через ${state.pulseIn}, волна через ${state.waveIn}.`);}else addLog('Сцена приостановлена.');render();}
  function configureForType(resetText=false){state.signature=SIGNATURES[state.type][0].id;state.damageType=TYPES[state.type].damage[0];if(resetText){state.telegraph=TYPES[state.type].telegraphs[0];state.nodeSign=TYPES[state.type].nodes[0];}if(state.secondary===state.type)state.secondary='none';}
  function buildPassport(randomize=false){
    if(randomize){state.size=die(6);state.mobility=die(4);if(state.type==='C')state.mobility=Math.min(4,state.mobility+1);state.telegraph=pick(TYPES[state.type].telegraphs);state.nodeSign=pick(TYPES[state.type].nodes);state.signature=pick(SIGNATURES[state.type]).id;state.damageType=pick(TYPES[state.type].damage);}
    if(!state.sceneName)state.sceneName=`${rating().name} · R${state.rating} Type ${state.type}`;resetRhythms();suggestWave(false);addLog(`Собран паспорт R${state.rating} Type ${state.type}.`);render();toast('Паспорт сцены готов');
  }
  function suggestWave(shouldRender=true){const pool=matchingMonsters();state.enemies=pool.length?pool.map((monster)=>({id:Date.now()+Math.random(),monsterId:monster.id,count:1})):[{id:Date.now()+Math.random(),monsterId:'custom',count:state.rating>=8?2:state.rating>=3?2:1}];if(shouldRender){addLog(`Подставлен состав волны: ${state.enemies.map((item)=>`${item.count}× ${enemyLabel(item)}`).join('; ')}.`);render();toast('Состав волны подставлен');}}
  function resolveCore(){const targets=state.party.filter((member)=>member.zone==='core'&&member.coreCheckedRound!==state.round);if(!targets.length){$('#eventResult').innerHTML='<strong>Ядро</strong><p>Новых целей для проверки в этом раунде нет.</p>';toast('Ядро уже проверено');return;}const dc=10+state.rating;const lines=targets.map((member)=>{const rolled=die(20),total=rolled+(Number(member.saveBonus)||0),ok=total>=dc;member.coreCheckedRound=state.round;return `<li class="${ok?'adm-ok-text':'adm-danger-text'}"><b>${esc(member.name)}</b>: d20 ${rolled} ${member.saveBonus>=0?'+':''}${member.saveBonus} = ${total} против СЛ ${dc} — ${ok?`успех: половина ${rating().core}`:`провал: ${rating().core} ${esc(state.damageType)}`}.</li>`;});$('#eventResult').innerHTML=`<strong>Ядро · раунд ${state.round}</strong><ul>${lines.join('')}</ul>`;addLog(`Проверено Ядро для ${targets.length} участника(ов).`);render();}
  function triggerPulse(auto=false){const info=rating();let extra='';if(state.rating===3&&state.round%3===0)extra=' Дополнительно срабатывает эхо: при провале помеха на Восприятие/ориентацию до конца следующего хода.';if(state.mobility===4)extra+=` Подвижность «Рывками»: центр может сместиться на ${(die(6)+die(6))*10} фт.`;$('#eventResult').innerHTML=`<strong>Пульс R${state.rating} · ${esc(selectedSignature().name)}</strong><p>${esc(info.pulseText+extra)} Почерк сцены: ${esc(selectedSignature().text)}</p>`;addAlert('Пульс среды',info.pulseText,true);addLog(`Пульс: ${info.pulseText}`);state.pulseIn=resetCounter(info.pulse);render();if(!auto)toast('Пульс разрешён; таймер обновлён');}
  function triggerWave(auto=false){const roster=state.enemies.length?state.enemies.map((item)=>`${item.count}× ${enemyLabel(item)}`).join('; '):`Существа CR ${rating().cr}`;let extra=state.rating===10&&state.round%3===0?' Добавьте одно якорное элитное или уникальное существо.':'';$('#eventResult').innerHTML=`<strong>Волна существ · CR ${esc(rating().cr)}</strong><p>${esc(roster)}.${esc(extra)} Монстры давят на Пирамидку, оператора и пути отхода — не обязательно сражаются до смерти.</p>`;addAlert('Волна существ',`${roster}.${extra}`,true);addLog(`Волна: ${roster}.`);state.waveIn=resetCounter(rating().wave);render();if(!auto)toast('Волна выпущена; таймер обновлён');}
  function nextRound(){if(!state.combat){startScene();return;}state.round+=1;state.party.forEach((member)=>{if(member.coreCheckedRound>state.round)member.coreCheckedRound=0;});state.pulseIn-=1;state.waveIn-=1;const due=[];if(state.pulseIn<=0){due.push('пульс среды');addAlert('Пульс готов',rating().pulseText,true);}if(state.waveIn<=0){due.push('волна существ');addAlert('Волна готова',`CR ${rating().cr}: ${rating().waveText}`,true);}if(state.rating===3&&state.round%3===0){due.push('эхо Ореола');addAlert('Эхо Ореола',`СЛ ${10+state.rating}; помеха на Восприятие/ориентацию до конца следующего хода.`,true);}addLog(`Начат раунд ${state.round}${due.length?`; срабатывает: ${due.join(', ')}`:''}.`);state.phase='hold';render();}
  function breakChannel(reason){state.channelActive=false;state.finalDue=false;state.extractionRemaining=0;addAlert('Канал сорван',`${reason} Накопленное потеряно; новая попытка после короткого отдыха оператора.`,true);addLog(`Канал сорван: ${reason}`);}
  function operatorTurnEnd(){if(!state.channelActive)return;const valid=$('#operatorConscious').checked&&$('#operatorPlane').checked&&$('#operatorRange').checked;state.operatorConscious=$('#operatorConscious').checked;state.operatorPlane=$('#operatorPlane').checked;state.operatorRange=$('#operatorRange').checked;if(!valid){breakChannel('В конце хода нарушено одно из условий: сознание, план или дистанция 60 фт. Происходит сильный выброс.');triggerPulse(true);return render();}state.extractionRemaining=Math.max(0,state.extractionRemaining-1);addLog(`Конец хода оператора: извлечение ${state.extractionRemaining}/${state.extractionTotal}.`);if(state.extractionRemaining===0){state.finalDue=true;state.phase='lock';addAlert('Замок Узора',`Сделайте финальный спасбросок ключевой характеристики против СЛ ${10+state.rating}.`,true);}render();}
  function advanceMinute(showToast=true){state.elapsedMinutes+=1;let movement='';if(state.mobility===2&&state.elapsedMinutes%10===0)movement=`Ползущая аномалия смещает центр на ${die(6)*10} фт.`;if(state.mobility===3){if(state.mobilityIn<=0)state.mobilityIn=die(4);state.mobilityIn-=1;if(state.mobilityIn<=0){movement=`Блуждающая аномалия смещает центр на ${die(6)*10} фт.`;state.mobilityIn=die(4);}}if(movement){addAlert('Смещение аномалии',movement,true);addLog(movement);}else addLog(`Прошла ${state.elapsedMinutes}-я минута разведки.`);if(showToast)toast(`Прошла ${state.elapsedMinutes}-я минута`);}
  function findNode(){advanceMinute(false);const dc=10+state.rating,rolled=die(20),total=rolled+state.operatorBonus;if(total>=dc){state.nodeFound=true;state.phase='install';$('#eventResult').innerHTML=`<strong>Узловая точка найдена</strong><p>d20 ${rolled} ${state.operatorBonus>=0?'+':''}${state.operatorBonus} = ${total} против СЛ ${dc}. Точка: ${esc(state.nodeSign)}.</p>`;addLog('Узловая точка найдена.');}else{$('#eventResult').innerHTML=`<strong>Поиск не удался</strong><p>d20 ${rolled} ${state.operatorBonus>=0?'+':''}${state.operatorBonus} = ${total} против СЛ ${dc}. Можно искать ещё 1 минуту; Мастер вправе вызвать подходящий выброс.</p>`;addAlert('Повторная минута поиска','Разрешите один подходящий выброс аномалии.',true);addLog('Поиск узла провален; Мастер может вызвать выброс.');}render();}
  function installPyramid(){if(!state.nodeFound)return;const rolled=die(10),duration=Math.max(1,rolled+state.rating-state.rank);state.pyramidInstalled=true;state.channelActive=true;state.extractionTotal=duration;state.extractionRemaining=duration;state.finalDue=false;state.marked=false;state.pyramidHp=50+10*state.rank;state.phase='hold';state.combat=true;state.round=Math.max(1,state.round||1);resetRhythms();addLog(`Пирамидка установлена: 1d10 ${rolled} + R${state.rating} − ранг ${state.rank} = ${duration} раунд(а).`);addAlert('Канал начат',`${duration} раунд(а). Уменьшайте счётчик только в конце хода оператора.`);render();toast('Пирамидка установлена');}
  function rollOperatorSave(dc,disadvantage=false){const a=die(20),b=disadvantage?die(20):a,rolled=disadvantage?Math.min(a,b):a;return {a,b,rolled,total:rolled+state.operatorBonus,dc,ok:rolled+state.operatorBonus>=dc};}
  function finalSave(){if(!state.finalDue)return;const hadMark=state.marked;state.marked=false;const result=rollOperatorSave(10+state.rating,hadMark);if(result.ok){state.collapsed=true;state.charged=true;state.channelActive=false;state.finalDue=false;state.combat=false;state.phase='after';$('#eventResult').innerHTML=`<strong>Аномалия схлопнута</strong><p>${hadMark?`d20 с помехой ${result.a}/${result.b}`:`d20 ${result.rolled}`} ${state.operatorBonus>=0?'+':''}${state.operatorBonus} = ${result.total} против СЛ ${result.dc}. Пирамидка заполнена; заберите её физически.</p>`;addAlert('Успешное схлопывание','Пирамидка заполнена. Сделайте один бросок остатка и подготовьте доставку к Сфере.');addLog('Замок Узора успешен; аномалия схлопнута.');render();return;}const percentile=die(100);let text='';if(percentile<=10){text='Срыв канала: накопленное потеряно, аномалия сохраняется.';breakChannel(text);}else if(percentile<=25){const added=die(4);state.extractionRemaining=added;state.extractionTotal+=added;state.finalDue=false;state.marked=true;state.phase='hold';text=`Отметка Узора: помеха на следующий спасбросок Иерархии; извлечение продолжается ещё ${added} раунд(а).`;addAlert('Отметка Узора',text,true);addLog(text);}else{const added=die(4);state.extractionRemaining=added;state.extractionTotal+=added;state.finalDue=false;state.phase='hold';text=`Судорога разрыва: немедленный выброс существа или эффекта; извлечение продолжается ещё ${added} раунд(а).`;addAlert('Судорога разрыва',text,true);addLog(text);}$('#eventResult').innerHTML=`<strong>Замок Узора не удержан</strong><p>${hadMark?`d20 с помехой ${result.a}/${result.b}`:`d20 ${result.rolled}`} ${state.operatorBonus>=0?'+':''}${state.operatorBonus} = ${result.total} против СЛ ${result.dc}. к100: ${percentile}. ${esc(text)}</p>`;render();}
  function shiftFive(){if(!state.channelActive)return;const result=rollOperatorSave(8+state.rating,false);let text=`Сдвиг на 5 фт: спасбросок против СЛ ${result.dc}: ${result.rolled} ${state.operatorBonus>=0?'+':''}${state.operatorBonus} = ${result.total}. `;if(result.ok)text+='Успех — таймер не меняется.';else{const added=die(4);state.extractionRemaining+=added;state.extractionTotal+=added;text+=`Провал — +${added} раунд(а) и малый выброс.`;addAlert('Малый выброс',rating().pulseText,true);}addLog(text);$('#eventResult').innerHTML=`<strong>Сдвиг Пирамидки на 5 фт</strong><p>${esc(text)}</p>`;render();}
  function shiftTen(){if(!state.pyramidInstalled)return;breakChannel('Пирамидка смещена на 10 фт или больше. К следующей попытке добавьте 1d6 раундов.');triggerPulse(true);render();}
  function topple(){if(!state.channelActive)return;const result=rollOperatorSave(10+state.rating,false);let text=`Опрокидывание: ${result.rolled} ${state.operatorBonus>=0?'+':''}${state.operatorBonus} = ${result.total} против СЛ ${result.dc}. `;if(result.ok){const added=die(4);state.extractionRemaining+=added;state.extractionTotal+=added;text+=`Пирамидка встала сама; +${added} раунд(а).`;}else{breakChannel('Пирамидка опрокинута, спасбросок провален.');text+='Разрыв привязки.';}addLog(text);$('#eventResult').innerHTML=`<strong>Опрокидывание Пирамидки</strong><p>${esc(text)}</p>`;render();}
  function rollLoot(){if(state.lootRolled)return;const chance=Math.min(100,rating().loot+(state.charged?10:0)),rolled=die(100);state.lootRolled=true;let text;if(rolled<=chance)text=`Остаток найден. к100: ${rolled} ≤ ${chance}%. Редкость: ${rating().rarity}.${state.charged?' Мастер может повысить редкость одного предмета на одну ступень.':''}`;else text=`Остатка нет. к100: ${rolled} > ${chance}%.`;$('#lootResult').innerHTML=`<strong>${rolled<=chance?'Артефактный остаток':'Ничего пригодного'}</strong><p>${esc(text)}</p>`;addLog(text);render();}
  function copySummary(){const roster=state.enemies.length?state.enemies.map((item)=>`${item.count}× ${enemyLabel(item)}`).join('; '):'не задан';const party=state.party.map((member)=>`${member.name}: ${member.zone==='core'?'Ядро':member.zone==='halo'?'Ореол':'вне зоны'}${member.notes?`, ${member.notes}`:''}`).join('; ');const text=[state.sceneName||'Временная аномалия',`R${state.rating} · ${TYPES[state.type].name} · ${size().name} · ${mobility().name}`,`СЛ ${10+state.rating}; Ядро ${size().core}, ${rating().core} ${state.damageType}; Ореол ${size().halo}`,`Задача: ${state.mission}`,`Признак: ${state.telegraph}`,`Узел: ${state.nodeSign}`,`Пульс: ${rating().pulseText}`,`Волна: CR ${rating().cr}; ${rating().waveText}; состав: ${roster}`,`Пирамидка: ${state.collapsed?'заряд получен':state.channelActive?`${state.extractionRemaining} раунд(а) осталось`:'не активна'}`,`Группа: ${party}`].join('\n');navigator.clipboard.writeText(text).then(()=>toast('Сводка скопирована')).catch(()=>toast('Не удалось скопировать'));}

  document.addEventListener('input',(event)=>{
    const target=event.target;if(target.id==='sceneName')state.sceneName=target.value;if(target.id==='telegraph')state.telegraph=target.value;if(target.id==='nodeSign')state.nodeSign=target.value;if(target.id==='operatorBonus')state.operatorBonus=Number(target.value)||0;if(target.id==='pyramidHp'){state.pyramidHp=Math.max(0,Number(target.value)||0);if(state.pyramidHp===0&&state.pyramidInstalled){const charged=state.charged;breakChannel(charged?`Заполненная Пирамидка разрушена: взрыв 60 фт, СЛ ${10+state.rating}, ${60*state.rating} силового урона; заряд потерян.`:'Пирамидка разрушена и исчезает до следующего долгого отдыха владельца.');state.charged=false;render();return;}}const row=target.closest('[data-member]');if(row){const member=state.party.find((item)=>String(item.id)===row.dataset.member);if(member){if(target.classList.contains('party-name'))member.name=target.value;if(target.classList.contains('party-save'))member.saveBonus=Number(target.value)||0;if(target.classList.contains('party-notes'))member.notes=target.value;}}const enemyRow=target.closest('[data-enemy]');if(enemyRow){const enemy=state.enemies.find((item)=>String(item.id)===enemyRow.dataset.enemy);if(enemy&&target.classList.contains('enemy-count'))enemy.count=clamp(Number(target.value)||1,1,20);}save();});
  document.addEventListener('change',(event)=>{
    const target=event.target;if(target.id==='ratingSelect'){state.rating=Number(target.value);resetRhythms();state.lootRolled=false;state.pyramidHp=50+10*state.rank;}if(target.id==='typeSelect'){state.type=target.value;configureForType(true);state.enemies=[];}if(target.id==='sizeSelect')state.size=Number(target.value);if(target.id==='mobilitySelect'){state.mobility=Number(target.value);state.mobilityIn=0;}if(target.id==='rankSelect'){state.rank=Number(target.value);state.pyramidHp=50+10*state.rank;}if(target.id==='missionSelect')state.mission=target.value;if(target.id==='secondaryType')state.secondary=target.value;if(target.id==='signatureSelect')state.signature=target.value;if(target.id==='damageType')state.damageType=target.value;if(target.id==='nodeObvious'){state.nodeObvious=target.checked;if(target.checked){state.nodeFound=true;state.phase='install';}}if(['operatorConscious','operatorPlane','operatorRange'].includes(target.id))state[target.id]=target.checked;const row=target.closest('[data-member]');if(row&&target.classList.contains('party-zone')){const member=state.party.find((item)=>String(item.id)===row.dataset.member);if(member){member.zone=target.value;member.coreCheckedRound=0;}}const enemyRow=target.closest('[data-enemy]');if(enemyRow&&target.classList.contains('enemy-monster')){const enemy=state.enemies.find((item)=>String(item.id)===enemyRow.dataset.enemy);if(enemy)enemy.monsterId=target.value;}render();});
  document.addEventListener('click',(event)=>{const phaseButton=event.target.closest('[data-phase]');if(phaseButton)return setPhase(phaseButton.dataset.phase);const check=event.target.closest('[data-phase-check]');if(check){state.phaseChecks[check.dataset.phaseCheck]=check.checked;return save();}const dismiss=event.target.closest('[data-dismiss-alert]');if(dismiss){state.alerts=state.alerts.filter((item)=>String(item.id)!==dismiss.dataset.dismissAlert);return render();}const removeMember=event.target.closest('[data-remove-member]');if(removeMember){state.party=state.party.filter((item)=>String(item.id)!==removeMember.dataset.removeMember);return render();}const removeEnemy=event.target.closest('[data-remove-enemy]');if(removeEnemy){state.enemies=state.enemies.filter((item)=>String(item.id)!==removeEnemy.dataset.removeEnemy);return render();}});

  $('#generateAnomaly').addEventListener('click',()=>buildPassport(false));$('#randomizePassport').addEventListener('click',()=>buildPassport(true));$('#copySummary').addEventListener('click',copySummary);$('#toggleCombat').addEventListener('click',startScene);$('#nextRound').addEventListener('click',nextRound);$('#footerNextRound').addEventListener('click',nextRound);$('#resolveCore').addEventListener('click',resolveCore);$('#triggerPulse').addEventListener('click',()=>triggerPulse(false));$('#triggerWave').addEventListener('click',()=>triggerWave(false));$('#operatorTurnEnd').addEventListener('click',operatorTurnEnd);$('#footerOperatorTurn').addEventListener('click',operatorTurnEnd);$('#nodeCheck').addEventListener('click',findNode);$('#advanceMinute').addEventListener('click',()=>{advanceMinute(true);render();});$('#installPyramid').addEventListener('click',installPyramid);$('#finalSave').addEventListener('click',finalSave);$('#shiftFive').addEventListener('click',shiftFive);$('#shiftTen').addEventListener('click',shiftTen);$('#topple').addEventListener('click',topple);$('#rollLoot').addEventListener('click',rollLoot);$('#suggestWave').addEventListener('click',()=>suggestWave(true));
  $('#addPartyMember').addEventListener('click',()=>{state.party.push(newMember(state.party.length+1));render();});$('#addEnemy').addEventListener('click',()=>{const pool=matchingMonsters();state.enemies.push({id:Date.now()+Math.random(),monsterId:pool[0]?.id||'custom',count:1});render();});
  $('#phaseBack').addEventListener('click',()=>setPhase(PHASES[Math.max(0,phaseIndex()-1)].key));$('#phaseNext').addEventListener('click',()=>setPhase(PHASES[Math.min(PHASES.length-1,phaseIndex()+1)].key));$('#footerPhaseNext').addEventListener('click',()=>$('#phaseNext').click());$('#finishOperation').addEventListener('click',()=>setPhase('after'));$('#clearLog').addEventListener('click',()=>{state.log=[];render();});
  $('#resetOperation').addEventListener('click',()=>{if(!confirm('Начать новую операцию и очистить текущий журнал?'))return;state=freshState();render();toast('Создана новая операция');});

  initOptions();render();
})();
