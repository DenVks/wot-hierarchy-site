(function(){
  'use strict';

  const STORAGE_KEY = 'wot.wallDmToolkit.v142';
  const $ = (selector) => document.querySelector(selector);
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const roll = (sides) => Math.floor(Math.random() * sides) + 1;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  const MODES = {
    halo: {
      title: 'Экспедиция в Ореоле', zone: 'outer', add: true,
      hint: 'Один маршрутный такт = один час.',
      cadence: 'STAB проверяется раз в час. В бою он не уменьшается автоматически.',
      steps: ['Час 1', 'Час 2', 'Час 3', 'Час 4', 'Час 5', 'Час 6']
    },
    window: {
      title: 'Окно дрейфа', zone: 'inner', add: false,
      hint: '6 сегментов · СЛ 17 · максимум 2 боя.',
      cadence: 'На каждом сегменте — одна проверка «Держать маршрут» СЛ 17. После второго провала окно может сорваться.',
      steps: ['Чтение входа', 'Ложная петля', 'Первый кризис', 'Потеря времени', 'Второй кризис', 'Выход']
    },
    dream: {
      title: 'Сквозь Сон', zone: 'dream', add: false,
      hint: 'Вход 15 · транзит 17 · выход 15.',
      cadence: 'STAB и Удары среды Ореола сюда автоматически не переносятся.',
      steps: ['Вход · СЛ 15', 'Транзит · СЛ 17', 'Выход · СЛ 15']
    },
    tunnel: {
      title: 'Тоннель согласованности', zone: 'inner', add: false,
      hint: 'Таймер 1d6 минут не останавливается.',
      cadence: 'Каждая минута проходит даже во время боя и обсуждений. Оставшиеся внутри после закрытия попадают во Внутреннюю Тень с STAB 3.',
      steps: []
    },
    caravan: {
      title: 'Караванный переход', zone: 'outer', add: false,
      hint: 'Шесть уязвимых этапов вместо одной телеги с хитами.',
      cadence: 'Маршрут проверяется по прошедшим часам; во время боя следите за людьми, грузом и выходом, а не снижайте STAB каждый раунд.',
      steps: ['Подход', 'Ожидание окна', 'Вход', 'Прорыв', 'Кризис', 'Безопасное плато']
    },
    core: {
      title: 'Авария в Ядре', zone: 'core', add: true,
      hint: 'Каждые 10 минут — два спасброска каждого.',
      cadence: 'Каждые 10 минут каждый участник делает Тел СЛ 18 и Мдр СЛ 18. Главная задача — выйти.',
      steps: ['0 минут', '10 минут', '20 минут', '30 минут', '40 минут', '50 минут']
    },
    crest: {
      title: 'Метод Гребня', zone: 'core', add: false,
      hint: 'Одна пара спасбросков за весь переход.',
      cadence: 'Каждый участник только один раз за переход делает Тел СЛ 18 и Мдр СЛ 18. Проверки каждые 10 минут заменены.',
      steps: ['Вход в траекторию', 'Удержание пути', 'Выход из Ядра']
    }
  };

  const OBJECTIVES = ['Провести караван через поле','Удержать точку маршрута','Добраться до метки выхода','Не дать сорвать маяк','Пережить закрытие окна','Вынести раненого','Завершить установку Пирамидки','Удерживать коридор для остальных','Не дать закрепить Метку','Вырваться из петли'];
  const ENEMIES = ['Без главного противника','Картограф-Разломщик · CR 7','Пиявка Стабильности · CR 8','Арбитр Петли · CR 9','Сборщик Слепых Углов · CR 8','Клеймовщик Узора · CR 9','Магистр Внутренней Петли · CR 10','Трещинная Тень-Рой · CR 1/2','Хор Ложных Шагов · CR 1','Сцепка Трещин · CR 2'];
  const THEMES = ['Ложная дистанция','Невозможность быстро отступить','Потеря реакций','Петля движения','Помеха дальнему бою','Метка на одном герое','Зона без обычного выхода','Движущийся караван','Нестабильный выход','Защита NPC'];
  const ENDINGS = ['Группа достигла точки','Окно закрылось','Пирамидка завершила работу','Караван вышел','Группа отступила','STAB сорвался','Противник уничтожен','Противник прекратил преследование','Петля разрушена или покинута'];
  const STRIKES = [
    ['Энергетический выброс','Все: Ловкость СЛ 14; 3d6 силового урона, при успехе половина.'],
    ['Холод или жара','Все: Телосложение СЛ 14; провал — 1 уровень истощения.'],
    ['Сдвиг гравитации','Все: Ловкость СЛ 14; провал — ничком и скорость 0 до начала следующего хода.'],
    ['Эхо мыслей','Все: Мудрость СЛ 14; провал — помеха на атаки до конца следующего хода.'],
    ['Ложный ориентир','Следующая «Держать маршрут» с помехой; при провале дополнительно −1d4 часа.'],
    ['Сонный прилив','Все: Харизма СЛ 14; провал — 10 минут помехи на спасброски Телосложения для концентрации.'],
    ['Тонкая трещина','Одно существо или 1d4 мелких существ аномального происхождения.'],
    ['Метка Узора','Случайное затронутое существо получает Метку; бросьте 1d6.']
  ];
  const MARKS = [
    ['Запах шва','Аномальные хищники предпочитают носителя между равноценными целями.'],
    ['Сдвиг сна','Продолжительный отдых восстанавливает половину недостающих хитов и половину Костей Хитов.'],
    ['Дыра во времени','Не чаще 1/24 часа Мастер лишает действия в начале хода; перемещение, бонусное действие и реакции остаются.'],
    ['Осколок памяти','Персонаж забывает выбранный эпизод последних 24 часов.'],
    ['Резонанс','1/24 часа преимущество на анализ аномалии; первые 24 часа уязвимость к психическому урону.'],
    ['Редкая удача','1/долгий отдых +1d4 к броску до результата; первое использование даёт 1 истощение.']
  ];
  const RANK_REMINDERS = [
    {rank:1, title:'Привязки маршрута', text:'1 раз за час тяжёлый провал можно заменить обычным: STAB −1, без Удара среды.'},
    {rank:2, title:'Стабилизация маршрута', text:'Проверка лидера с преимуществом; 1 раз за час обычный провал может не снизить STAB.'},
    {rank:3, title:'Петлярез', text:'1/короткий отдых отменяет потерю 1d4 часов на пороге 6–4, но не Удар среды.'},
    {rank:4, title:'Щит от Удара среды', text:'Реакция 1/короткий отдых: союзники в 30 фт получают преимущество на спасбросок и сопротивление урону эффекта.'},
    {rank:5, title:'Предвестник', text:'Формирующаяся аномалия ощущается за 5 минут; связанная встреча не застаёт группу врасплох.'},
    {rank:6, title:'Якорь формы', text:'1/долгий отдых: когда STAB должен стать 0, он становится 1; Тел СЛ 15 каждому и обязательная встреча.'},
    {rank:7, title:'Фиксация окна', text:'1 минута работы, затем маршрутная проверка; успех фиксирует окно на 10 минут, провал — STAB −2 и Удар среды.'},
    {rank:8, title:'Метод Гребня', text:'1/30 суток: только одна пара спасбросков Тел/Мдр СЛ 18 за весь переход.'}
  ];

  function freshState(){
    return {
      version: 142, sceneName: '', mode: 'halo', zone: 'outer', rank: 0,
      prof: 3, stabBase: 13, stab: 13, elapsedMinutes: 0, combat: false, round: 0,
      routeIndex: 0, routeStatuses: [], extraSteps: 0, failures: 0, dreamFailures: 0,
      tunnelDuration: 0, postBattle: false, completedChecks: {}, alerts: [],
      objective: OBJECTIVES[0], enemy: ENEMIES[1], theme: THEMES[0], ending: ENDINGS[0],
      timeLimit: '', telegraph: '', approach: 'Мудрость (Выживание)',
      party: [1,2,3,4].map((n) => ({id: Date.now()+n, name:`Участник ${n}`, exhaustion:0, marks:''})),
      log: []
    };
  }

  function loadState(){
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && saved.version === 142) return Object.assign(freshState(), saved);
    } catch (error) {}
    return freshState();
  }

  let state = loadState();

  function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function stamp(){
    if (state.combat) return `Раунд ${state.round || 1}`;
    if (state.mode === 'tunnel') return `Тоннель`;
    return state.elapsedMinutes ? `${Math.floor(state.elapsedMinutes/60)}ч ${state.elapsedMinutes%60}м` : 'Старт';
  }
  function addLog(text){
    state.log.unshift({time:stamp(), text});
    state.log = state.log.slice(0, 80);
  }
  function toast(text){
    const node = $('#toast'); node.textContent = text; node.classList.add('show');
    clearTimeout(toast.timer); toast.timer = setTimeout(() => node.classList.remove('show'), 2200);
  }
  function addAlert(title, text, danger=false){
    state.alerts.unshift({id:Date.now()+Math.random(), title, text, danger});
  }

  function bandFor(value){
    if (value <= 0) return {level:4, name:'Срыв · Ядро', tone:'danger'};
    if (value <= 3) return {level:3, name:'Пролом формы · 3–1', tone:'danger'};
    if (value <= 6) return {level:2, name:'Петли и срывы · 6–4', tone:'warn'};
    if (value <= 9) return {level:1, name:'Нестабильность · 9–7', tone:'warn'};
    return {level:0, name:'Стабильный маршрут · 10+', tone:'ok'};
  }

  function randomPartyName(){
    if (!state.party.length) return 'случайный участник';
    return state.party[roll(state.party.length)-1].name || 'безымянный участник';
  }

  function crossThreshold(previous, next){
    const before = bandFor(previous); const after = bandFor(next);
    if (after.level <= before.level) return;
    if (after.level === 1) {
      const target = randomPartyName();
      addAlert('Порог STAB 9–7', `${target}: Мудрость СЛ 14. При провале 1d2 — истощение или Сбой восприятия.`);
      addLog(`Достигнут порог STAB 9–7; цель: ${target}.`);
    } else if (after.level === 2) {
      const hours = roll(4); state.elapsedMinutes += hours * 60;
      addAlert('Порог STAB 6–4', `Потеряно ${hours} ч. Немедленно разрешите Удар среды.`, true);
      addLog(`Достигнут порог STAB 6–4: потеряно ${hours} ч.`);
      rollStrike('Порог 6–4');
    } else if (after.level === 3) {
      addAlert('Порог STAB 3–1', 'Каждый: Телосложение СЛ 15. Провал — 2 истощения, успех — 1. Затем обязательная встреча.', true);
      addLog('Достигнут порог STAB 3–1: спасброски и обязательная встреча.');
    } else if (after.level === 4) {
      addAlert('STAB 0 · Срыв', 'Группа проваливается в Ядро или локальный карман Ядра.', true);
      addLog('STAB достиг 0: срыв в Ядро.');
    }
  }

  function setStab(value, reason='Ручное изменение'){
    const previous = state.stab;
    state.stab = clamp(Number(value) || 0, 0, 30);
    if (state.stab !== previous) {
      addLog(`${reason}: STAB ${previous} → ${state.stab}.`);
      crossThreshold(previous, state.stab);
    }
    save(); render();
  }

  function routeSteps(){
    if (state.mode === 'tunnel') {
      const duration = state.tunnelDuration || 1;
      return Array.from({length:duration}, (_,index) => `${index+1}-я минута`);
    }
    const base = [...MODES[state.mode].steps];
    if (MODES[state.mode].add) {
      for (let i=0;i<state.extraSteps;i++) {
        if (state.mode === 'core') base.push(`${base.length*10} минут`);
        else base.push(`Час ${base.length+1}`);
      }
    }
    return base;
  }

  function zoneDc(){ return state.zone === 'outer' ? 14 : state.zone === 'inner' ? 17 : null; }
  function currentDreamDc(){ return [15,17,15][clamp(state.routeIndex,0,2)]; }

  function changeMode(mode){
    state.mode = mode;
    state.zone = MODES[mode].zone;
    state.routeIndex = 0; state.routeStatuses = []; state.extraSteps = 0; state.failures = 0; state.dreamFailures = 0;
    state.completedChecks = {}; state.alerts = []; state.postBattle = false;
    if (mode === 'tunnel') {
      state.tunnelDuration = roll(6);
      addAlert('Тоннель открыт', `Коридор существует ${state.tunnelDuration} мин. Таймер уже идёт.`);
      addLog(`Открыт Тоннель согласованности на ${state.tunnelDuration} мин.`);
    }
    addLog(`Режим: ${MODES[mode].title}.`);
    save(); render();
  }

  function resolveRoute(outcome){
    const steps = routeSteps();
    if (!steps.length) return;
    const index = clamp(state.routeIndex,0,steps.length-1);
    if (state.mode === 'dream') return resolveDream(outcome);
    if (!['halo','window','caravan'].includes(state.mode)) {
      state.routeStatuses[index] = outcome === 'success' ? 'success' : 'fail';
      addLog(`${steps[index]}: ${outcome === 'success' ? 'завершено' : 'осложнение'}.`);
      save(); render(); return;
    }
    const bindings = $('#useBindings') && $('#useBindings').checked;
    const stabilization = $('#useStabilization') && $('#useStabilization').checked;
    const cancelFalseLandmark = $('#cancelFalseLandmark') && $('#cancelFalseLandmark').checked;
    const falseLandmarkWasActive = Boolean(state.falseLandmark);
    let delta = 0; let strike = false; let resultLabel = 'успех'; let status = 'success';
    if (outcome === 'fail') {
      state.failures += 1; resultLabel = 'провал'; status = 'fail';
      if (stabilization && state.rank >= 2) resultLabel += ' — Стабилизация сохранила STAB';
      else delta = -1;
    }
    if (outcome === 'severe') {
      state.failures += 1; resultLabel = 'тяжёлый провал'; status = 'severe';
      if (bindings && state.rank >= 1) { delta = -1; status = 'fail'; resultLabel += ' — смягчён Привязками'; }
      else { delta = -2; strike = true; }
    }
    state.routeStatuses[index] = status;
    addLog(`${steps[index]}: ${resultLabel}.`);
    if (falseLandmarkWasActive) {
      if (cancelFalseLandmark && state.rank >= 1) addLog('Срыв ложного ориентира отменил помеху и дополнительную потерю времени.');
      else if (outcome !== 'success') {
        const lostHours = roll(4); state.elapsedMinutes += lostHours * 60;
        addAlert('Ложный ориентир', `Проверка провалена: дополнительно потеряно ${lostHours} ч.`);
        addLog(`Ложный ориентир: дополнительно потеряно ${lostHours} ч.`);
      }
      state.falseLandmark = false;
    }
    if (delta) {
      const previous = state.stab; state.stab = clamp(state.stab + delta,0,30); crossThreshold(previous,state.stab);
    }
    if (strike) rollStrike('Тяжёлый провал маршрута');
    if (state.mode === 'window' && state.failures >= 2) addAlert('Окно может сорваться', `${state.failures}-й провал сегмента: Мастер вправе перевести группу в локальный карман Ядра.`, true);
    save(); render();
  }

  function resolveDream(outcome){
    const steps = routeSteps(); const index = clamp(state.routeIndex,0,steps.length-1);
    state.routeStatuses[index] = outcome === 'success' ? 'success' : 'fail';
    addLog(`${steps[index]}: ${outcome === 'success' ? 'успех' : 'провал'}.`);
    if (outcome !== 'success') {
      state.dreamFailures += 1;
      if (state.dreamFailures === 1) {
        addAlert('Первый провал Сквозь Сон','Случайный участник получает Метку Узора.');
        rollMark('Провал Сквозь Сон');
      } else if (state.dreamFailures === 2) addAlert('Второй провал Сквозь Сон','Неверное время или неверный якорь выхода на нужной стороне.',true);
      else addAlert('Третий провал Сквозь Сон','Сильная сущность Тел’аран’риода; после выхода каждый теряет фрагмент памяти.',true);
    }
    save(); render();
  }

  function rollStrike(reason='Ручной бросок'){
    const die = roll(8); const [title,text] = STRIKES[die-1];
    state.lastRoll = {title:`${die} · ${title}`, text};
    addLog(`${reason}: Удар среды ${die} — ${title}.`);
    if (die === 5) state.falseLandmark = true;
    if (die === 8) addAlert('Метка Узора','Выберите затронутое существо и бросьте 1d6 по таблице Меток.');
    save(); render();
  }

  function rollMark(reason='Ручной бросок'){
    const die = roll(6); const [title,text] = MARKS[die-1]; const target = randomPartyName();
    state.lastRoll = {title:`${die} · ${title}`, text:`${target}. ${text}`};
    const member = state.party.find((item) => item.name === target);
    if (member) member.marks = member.marks ? `${member.marks}; ${title}` : title;
    addLog(`${reason}: Метка ${die} — ${title}; цель: ${target}.`);
    save(); render();
  }

  function rollDrift(){
    const die = roll(6); let title='Без сдвига'; let text='Локальный дрейф не меняет участок.';
    if (die >= 4 && die <= 5) {title='Локальный язык фронта'; text='Появляется локальный язык фронта.';}
    if (die === 6) {title='Сильный язык'; text='Сильный язык и вторичная вспышка: малый разрыв или выброс существ.';}
    state.lastRoll = {title:`${die} · ${title}`,text}; addLog(`Дрейф ${die}: ${title}.`); save(); render();
  }

  function advanceBeat(){
    const steps = routeSteps();
    if (state.mode === 'halo' || state.mode === 'caravan') state.elapsedMinutes += 60;
    if (state.mode === 'core') state.elapsedMinutes += 10;
    if (state.mode === 'tunnel') state.elapsedMinutes += 1;
    if (state.mode === 'tunnel' && state.routeIndex < steps.length) state.routeIndex += 1;
    else if (state.routeIndex < steps.length-1) state.routeIndex += 1;
    else addAlert('Конец маршрута','Последний подготовленный сегмент достигнут. Завершите переход или добавьте следующий сегмент.');
    state.completedChecks = {}; state.postBattle = false;
    addLog(`Следующий такт: ${steps[state.routeIndex] || 'конец маршрута'}.`);
    if (state.mode === 'tunnel' && state.routeIndex >= steps.length) addAlert('Тоннель закрылся','Если кто-то остался внутри, он попадает во Внутреннюю Тень с STAB 3.',true);
    save(); render();
  }

  function dutyItems(){
    const step = routeSteps()[state.routeIndex] || 'Маршрут завершён';
    const items = [];
    if (['halo','window','caravan'].includes(state.mode)) items.push({key:`route-${state.routeIndex}`, title:`Держать маршрут · СЛ ${state.mode==='window'?17:zoneDc()||17}`, text:`${step}. Выберите содержательный подход; тяжёлый провал начинается при результате на 5 ниже СЛ.`, urgent:!state.routeStatuses[state.routeIndex]});
    if (state.mode === 'dream') items.push({key:`dream-${state.routeIndex}`,title:`Проводник сна · Проницательность СЛ ${currentDreamDc()}`,text:step,urgent:!state.routeStatuses[state.routeIndex]});
    if (state.mode === 'tunnel' && state.routeIndex < state.tunnelDuration) items.push({key:`tunnel-${state.routeIndex}`,title:`Минута ${state.routeIndex+1} из ${state.tunnelDuration}`,text:'Проверьте, кто уже вышел и кто задержан. Таймер не приостанавливается.',urgent:true});
    if (state.mode === 'tunnel' && state.routeIndex >= state.tunnelDuration) items.push({key:'tunnel-closed',title:'Тоннель закрыт',text:'Оставшиеся внутри выброшены во Внутреннюю Тень с STAB 3.',urgent:true});
    if (state.mode === 'core') {
      items.push({key:`core-con-${state.routeIndex}`,title:'Каждый: Телосложение СЛ 18',text:'Успех: 1 истощение + половина 4d10. Провал: 2 истощения + полный 4d10.',urgent:true});
      items.push({key:`core-wis-${state.routeIndex}`,title:'Каждый: Мудрость СЛ 18',text:'Провал — Слом формы: паника, ступор, петля или подмена восприятия.',urgent:true});
    }
    if (state.mode === 'crest') {
      items.push({key:'crest-con',title:'Один раз за переход: Телосложение СЛ 18',text:'Обычные последствия Ядра сохраняются.',urgent:true});
      items.push({key:'crest-wis',title:'Один раз за переход: Мудрость СЛ 18',text:'Не повторять каждые 10 минут.',urgent:true});
    }
    if (state.combat) {
      items.push({key:`combat-effects-${state.round}`,title:'Начало и конец раунда',text:'Разрешите эффекты существ, сроки состояний, реакции и легендарные действия.'});
      items.push({key:`combat-theme-${state.round}`,title:`Тема поля: ${state.theme}`,text:'Разрешите только заявленную пространственную тему и эффекты существ.'});
      if (state.timeLimit) items.push({key:`combat-timer-${state.round}`,title:'Обновить таймер сцены',text:state.timeLimit,urgent:true});
      items.push({key:`combat-goal-${state.round}`,title:'Проверить цель, а не только хиты',text:state.objective});
      const timeHole = state.party.filter((member) => /дыра во времени/i.test(member.marks));
      if (timeHole.length) items.push({key:`combat-time-hole-${state.round}`,title:'Метка «Дыра во времени»',text:`В начале хода проверьте носителей: ${timeHole.map((item)=>item.name).join(', ')}. Не чаще 1 раза за 24 часа.`,urgent:true});
    }
    if (state.postBattle) {
      items.push({key:'post-time',title:'Прошёл ли час?',text:'Если да — разрешите часовую маршрутную проверку.'});
      items.push({key:'post-state',title:'STAB · окно · Метки · истощение',text:'Зафиксируйте последствия до следующей сцены.',urgent:true});
      items.push({key:'post-route',title:'Маршрут всё ещё пригоден?',text:'Победа в бою может быть поражением экспедиции.'});
    }
    return items;
  }

  function renderStatus(){
    const band = bandFor(state.stab);
    $('#stabValue').textContent = state.stab; $('#stabBand').textContent = band.name; $('#profSelect').value = String(state.prof); $('#baseValue').textContent = state.stabBase;
    $('#modeSelect').value = state.mode; $('#modeHint').textContent = MODES[state.mode].hint;
    $('#zoneSelect').value = state.zone;
    $('#zoneHint').textContent = state.zone === 'outer' ? 'Держать маршрут · СЛ 14' : state.zone === 'inner' ? 'Держать маршрут · СЛ 17' : state.zone === 'core' ? 'Спасброски · СЛ 18' : 'Проницательность · 15 / 17 / 15';
    $('#rankSelect').value = String(state.rank);
    $('#rankHint').textContent = state.rank ? `Доступ открыт до ${state.rank} ранга` : 'Навигация без специальных средств защиты';
    let clock = `${Math.floor(state.elapsedMinutes/60)} ч ${state.elapsedMinutes%60} мин`;
    if (state.mode === 'tunnel') clock = `${Math.max(0,state.tunnelDuration-state.routeIndex)} мин осталось`;
    $('#clockValue').textContent = `${clock} · ${state.combat ? `раунд ${state.round||1}` : 'вне боя'}`;
    $('#toggleCombat').textContent = state.combat ? 'Бой идёт' : 'Начать бой';
  }

  function renderRoute(){
    const steps = routeSteps(); $('#routeTitle').textContent = MODES[state.mode].title;
    $('#addRouteStep').style.display = MODES[state.mode].add ? '' : 'none';
    $('#routeTrack').innerHTML = steps.map((step,index) => {
      const status = state.routeStatuses[index] || ''; const active = index === state.routeIndex ? ' active' : '';
      const glyph = status === 'success' ? '✓' : status === 'fail' ? '!' : status === 'severe' ? '×' : index+1;
      return `<button class="wdm-route-node ${status}${active}" data-route-index="${index}" type="button"><span class="wdm-route-dot">${glyph}</span><span>${esc(step)}</span></button>`;
    }).join('');
    let controls = '';
    if (['halo','window','caravan'].includes(state.mode)) controls = `<div class="wdm-field"><label for="approachSelect">Подход лидера</label><select id="approachSelect"><option>Мудрость (Выживание)</option><option>Мудрость (Восприятие)</option><option>Интеллект (Расследование)</option><option>Интеллект (Единая Сила)</option></select></div><button class="wdm-btn primary" data-outcome="success">Успех</button><button class="wdm-btn" data-outcome="fail">Провал −1</button><button class="wdm-btn danger" data-outcome="severe">Провал 5+ · −2</button>`;
    else if (state.mode === 'dream') controls = `<div class="wdm-field"><label>Текущая проверка</label><input value="Мудрость (Проницательность) · СЛ ${currentDreamDc()}" disabled/></div><button class="wdm-btn primary" data-outcome="success">Успех</button><button class="wdm-btn danger" data-outcome="fail">Провал</button>`;
    else controls = `<div class="wdm-field"><label>Текущий такт</label><input value="${esc(steps[state.routeIndex] || 'Маршрут завершён')}" disabled/></div><button class="wdm-btn primary" data-outcome="success">Отмечено</button><button class="wdm-btn danger" data-outcome="fail">Осложнение</button>`;
    $('#routeActions').innerHTML = controls;
    const approach = $('#approachSelect'); if (approach) approach.value = state.approach;
    const opts = [];
    if (['halo','window','caravan'].includes(state.mode) && state.rank >= 1) opts.push('<label class="wdm-check-toggle"><input id="useBindings" type="checkbox"/> Привязки: тяжёлый → обычный</label>');
    if (['halo','window','caravan'].includes(state.mode) && state.rank >= 2) opts.push('<label class="wdm-check-toggle"><input id="useStabilization" type="checkbox"/> Стабилизация: обычный провал без −STAB</label>');
    if (state.falseLandmark) opts.push('<span class="wdm-check-toggle">⚠ Ложный ориентир: эта проверка с помехой</span>');
    if (state.falseLandmark && state.rank >= 1) opts.push('<label class="wdm-check-toggle"><input id="cancelFalseLandmark" type="checkbox"/> Срыв ложного ориентира · 1/долгий отдых</label>');
    $('#routeOptions').innerHTML = opts.join('');
  }

  function renderNow(){
    $('#nowTitle').textContent = state.combat ? `Раунд ${state.round || 1}` : 'Что проверить';
    const duties = dutyItems();
    $('#nowChecklist').innerHTML = duties.length ? duties.map((item) => `<label class="wdm-duty${item.urgent?' urgent':''}"><input type="checkbox" data-duty="${esc(item.key)}" ${state.completedChecks[item.key]?'checked':''}/><span><b>${esc(item.title)}</b><small>${esc(item.text)}</small></span></label>`).join('') : '<div class="wdm-empty">На текущем такте обязательных проверок нет.</div>';
    $('#cadenceNote').textContent = MODES[state.mode].cadence;
  }

  function renderAlerts(){
    $('#alerts').innerHTML = state.alerts.map((item) => `<div class="wdm-alert${item.danger?' danger':''}"><b>${esc(item.title)}</b> · ${esc(item.text)} <button class="wdm-btn small" data-dismiss-alert="${item.id}" type="button">Разрешено</button></div>`).join('');
  }

  function renderScene(){
    $('#sceneName').value = state.sceneName; $('#objectiveSelect').value = state.objective; $('#enemySelect').value = state.enemy; $('#themeSelect').value = state.theme; $('#endingSelect').value = state.ending; $('#timeLimit').value = state.timeLimit; $('#telegraph').value = state.telegraph;
    const warning = state.telegraph ? ` Игроки замечают заранее: ${state.telegraph}.` : ' Добавьте один заметный заранее признак опасности.';
    $('#sceneSummary').textContent = `${state.objective}. Главная угроза: ${state.enemy}. Поле: ${state.theme}. Сцена заканчивается, когда: ${state.ending}.${warning}`;
  }

  function renderParty(){
    $('#partyList').innerHTML = state.party.length ? state.party.map((member) => `<div class="wdm-party-row" data-member="${member.id}"><input class="party-name" value="${esc(member.name)}" aria-label="Имя участника"/><select class="party-exhaustion" aria-label="Уровень истощения">${Array.from({length:7},(_,n)=>`<option value="${n}" ${Number(member.exhaustion)===n?'selected':''}>${n} ур.</option>`).join('')}</select><input class="party-marks" value="${esc(member.marks)}" placeholder="Метки / состояние" aria-label="Метки и состояния"/><button class="wdm-btn danger" data-remove-member="${member.id}" type="button" aria-label="Удалить участника">×</button></div>`).join('') : '<div class="wdm-empty">Добавьте участников, чтобы Метки и пороги назначались автоматически.</div>';
  }

  function renderRanks(){
    if (!state.rank) { $('#rankReminders').innerHTML = '<div class="wdm-empty">Иерарха нет: проверяйте помеху Шума Узора и наличие надёжных меток.</div>'; return; }
    const available = RANK_REMINDERS.filter((item) => item.rank <= state.rank).slice(-4);
    $('#rankReminders').innerHTML = available.map((item) => `<div class="wdm-rank-reminder"><b>${esc(item.title)}</b><br/>${esc(item.text)}</div>`).join('');
  }

  function renderLog(){
    $('#eventLog').innerHTML = state.log.length ? state.log.map((item) => `<div class="wdm-log-entry"><time>${esc(item.time)}</time><span>${esc(item.text)}</span></div>`).join('') : '<div class="wdm-empty">Журнал пока пуст. Все изменения маршрута и броски попадут сюда автоматически.</div>';
  }

  function renderRoll(){
    $('#rollResult').innerHTML = state.lastRoll ? `<strong>${esc(state.lastRoll.title)}</strong><p>${esc(state.lastRoll.text)}</p>` : '<p>Результат броска появится здесь и автоматически попадёт в журнал.</p>';
  }

  function render(){ renderStatus(); renderAlerts(); renderRoute(); renderNow(); renderScene(); renderParty(); renderRanks(); renderLog(); renderRoll(); }

  function fillSelect(id, values){ $(id).innerHTML = values.map((value) => `<option value="${esc(value)}">${esc(value)}</option>`).join(''); }
  fillSelect('#objectiveSelect', OBJECTIVES); fillSelect('#enemySelect', ENEMIES); fillSelect('#themeSelect', THEMES); fillSelect('#endingSelect', ENDINGS);

  $('#stabPlus').addEventListener('click', () => setStab(state.stab+1));
  $('#stabMinus').addEventListener('click', () => setStab(state.stab-1));
  $('#stabReset').addEventListener('click', () => setStab(state.stabBase,'Безопасный лагерь / восстановление'));
  $('#profSelect').addEventListener('change', (event) => {const previousBase=state.stabBase;state.prof=Number(event.target.value);state.stabBase=10+state.prof;if(state.stab===previousBase)state.stab=state.stabBase;addLog(`Исходный STAB рассчитан: 10 + ${state.prof} = ${state.stabBase}.`);save();render();});
  $('#modeSelect').addEventListener('change', (event) => changeMode(event.target.value));
  $('#zoneSelect').addEventListener('change', (event) => {state.zone=event.target.value; addLog(`Зона: ${event.target.options[event.target.selectedIndex].text}.`); save(); render();});
  $('#rankSelect').addEventListener('change', (event) => {state.rank=Number(event.target.value); save(); render();});
  $('#toggleCombat').addEventListener('click', () => {if(!state.combat){state.combat=true;state.round=1;state.postBattle=false;addLog('Бой начат.');} save();render();});
  $('#nextRound').addEventListener('click', () => {if(!state.combat){state.combat=true;state.round=1;addLog('Бой начат: раунд 1.');}else{state.round+=1;addLog(`Начат раунд ${state.round}.`);} save();render();});
  $('#finishCombat').addEventListener('click', () => {if(state.combat)addLog(`Бой завершён после раунда ${state.round}.`);state.combat=false;state.round=0;state.postBattle=true;save();render();});
  $('#advanceBeat').addEventListener('click', advanceBeat);
  $('#addRouteStep').addEventListener('click', () => {state.extraSteps+=1;save();render();});
  $('#rollStrike').addEventListener('click', () => rollStrike()); $('#rollMark').addEventListener('click', () => rollMark()); $('#rollDrift').addEventListener('click', rollDrift);
  $('#clearLog').addEventListener('click', () => {state.log=[];save();render();});
  $('#addPartyMember').addEventListener('click', () => {state.party.push({id:Date.now(),name:`Участник ${state.party.length+1}`,exhaustion:0,marks:''});save();render();});

  $('#routeTrack').addEventListener('click', (event) => {const node=event.target.closest('[data-route-index]');if(!node)return;state.routeIndex=Number(node.dataset.routeIndex);save();render();});
  $('#routeActions').addEventListener('click', (event) => {const button=event.target.closest('[data-outcome]');if(button)resolveRoute(button.dataset.outcome);});
  $('#routeActions').addEventListener('change', (event) => {if(event.target.id==='approachSelect'){state.approach=event.target.value;save();}});
  $('#nowChecklist').addEventListener('change', (event) => {if(!event.target.dataset.duty)return;state.completedChecks[event.target.dataset.duty]=event.target.checked;save();});
  $('#alerts').addEventListener('click', (event) => {const button=event.target.closest('[data-dismiss-alert]');if(!button)return;state.alerts=state.alerts.filter((item)=>String(item.id)!==button.dataset.dismissAlert);save();render();});

  $('#partyList').addEventListener('input', (event) => {
    const row=event.target.closest('[data-member]'); if(!row)return; const member=state.party.find((item)=>String(item.id)===row.dataset.member); if(!member)return;
    if(event.target.classList.contains('party-name'))member.name=event.target.value;
    if(event.target.classList.contains('party-marks'))member.marks=event.target.value;
    save();
  });
  $('#partyList').addEventListener('change', (event) => {const row=event.target.closest('[data-member]');if(!row)return;const member=state.party.find((item)=>String(item.id)===row.dataset.member);if(member&&event.target.classList.contains('party-exhaustion')){member.exhaustion=Number(event.target.value);save();}});
  $('#partyList').addEventListener('click', (event) => {const button=event.target.closest('[data-remove-member]');if(!button)return;state.party=state.party.filter((item)=>String(item.id)!==button.dataset.removeMember);save();render();});

  const boundFields = {sceneName:'sceneName',objectiveSelect:'objective',enemySelect:'enemy',themeSelect:'theme',endingSelect:'ending',timeLimit:'timeLimit',telegraph:'telegraph'};
  Object.keys(boundFields).forEach((id) => {
    $(`#${id}`).addEventListener(id==='sceneName'||id==='timeLimit'||id==='telegraph'?'input':'change', (event) => {state[boundFields[id]]=event.target.value;save();renderScene();});
  });

  function summaryText(){
    const steps=routeSteps(); const party=state.party.map((member)=>`— ${member.name}: истощение ${member.exhaustion}; ${member.marks||'без Меток'}`).join('\n');
    return `${state.sceneName||'Экспедиция в Аномальной Стене'}\n${MODES[state.mode].title} · ${$('#zoneSelect').options[$('#zoneSelect').selectedIndex].text}\nSTAB ${state.stab}/${state.stabBase} · ${bandFor(state.stab).name}\nПуть: ${steps.map((step,index)=>`${step} [${state.routeStatuses[index]||'ожидает'}]`).join(' → ')}\nЦель: ${state.objective}\nПротивник: ${state.enemy}\nТема: ${state.theme}\nФинал: ${state.ending}\nТаймер: ${state.timeLimit||'нет'}\nТелеграф: ${state.telegraph||'не задан'}\n\nГруппа:\n${party||'— не указана'}\n\nПоследние события:\n${state.log.slice(0,10).map((item)=>`[${item.time}] ${item.text}`).join('\n')||'— нет'}`;
  }
  $('#copySummary').addEventListener('click', async () => {
    const text=summaryText();
    try {await navigator.clipboard.writeText(text);toast('Сводка скопирована');}
    catch(error){const area=document.createElement('textarea');area.value=text;document.body.appendChild(area);area.select();document.execCommand('copy');area.remove();toast('Сводка скопирована');}
  });
  $('#resetExpedition').addEventListener('click', () => {if(!confirm('Начать новую экспедицию и очистить текущий журнал?'))return;state=freshState();save();render();toast('Создана новая экспедиция');});

  render();
})();
