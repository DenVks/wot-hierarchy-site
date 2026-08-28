(function(){
  'use strict';

  const STORAGE_KEY = 'wot.wallDmToolkit.v147';
  const LEGACY_STORAGE_KEYS = ['wot.wallDmToolkit.v146','wot.wallDmToolkit.v145','wot.wallDmToolkit.v144','wot.wallDmToolkit.v142'];
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

  const PHASES = [
    {key:'prep', short:'0 · До сцены', title:'До сцены', lead:'Зафиксируйте шесть опор. После этого во время боя не придётся заново придумывать, что происходит.', rule:'Это единственный этап, где Мастер принимает основные решения о конструкции сцены.'},
    {key:'opening', short:'1 · Открытие', title:'Открытие сцены', lead:'Дайте игрокам картину, цель и цену промедления до броска инициативы.', rule:'Опасность должна иметь наблюдаемый признак. V ранг чувствует связанную аномалию за 5 минут, и встреча не застаёт группу врасплох.'},
    {key:'roundStart', short:'2 · Старт раунда', title:'Начало раунда', lead:'Сверьте номер раунда и только те эффекты, которые действительно срабатывают сейчас.', rule:'Маршрутная проверка не является действием каждого раунда: она происходит по такту выбранного режима.'},
    {key:'turns', short:'3 · Ходы', title:'Ходы всех сторон', lead:'Идите по очереди участников. Отдельные окна ниже подскажут действия героев, угрозы, цели и самой Стены.', rule:'Новый Удар среды не возникает каждый ход или раунд. Он нужен только по правилу, способности существа или заранее заявленному событию.'},
    {key:'roundEnd', short:'4 · Конец раунда', title:'Конец раунда', lead:'Сведите последствия раунда в одном месте и решите: следующий раунд или финал сцены.', rule:'STAB не уменьшается «за атмосферу». Меняйте его только по действующему правилу или конкретному эффекту.'},
    {key:'sceneEnd', short:'5 · После сцены', title:'После сцены', lead:'Перенесите результат боя обратно в экспедицию: время, маршрут, STAB, Метки и истощение.', rule:'Победа над противником может быть поражением экспедиции, если окно закрылось или маршрут перестал быть пригодным.'}
  ];

  const TIMER_CADENCE = {
    none:'таймера нет',
    round:'двигать в конце каждого раунда',
    minute:'двигать раз в 10 раундов (1 минута)',
    event:'двигать только по заявленному событию'
  };

  const OBJECTIVES = ['Провести караван через поле','Удержать точку маршрута','Добраться до метки выхода','Не дать сорвать маяк','Пережить закрытие окна','Вынести раненого','Завершить установку Пирамидки','Удерживать коридор для остальных','Не дать закрепить Метку','Вырваться из петли'];
  const MONSTERS = [
    {id:'none', name:'Без противников', cr:'—', group:'none'},
    {id:'cartographer', name:'Картограф-Разломщик', cr:'7', group:'outer'},
    {id:'leech', name:'Пиявка Стабильности', cr:'8', group:'outer'},
    {id:'arbiter', name:'Арбитр Петли', cr:'9', group:'outer'},
    {id:'blind-corner', name:'Сборщик Слепых Углов', cr:'8', group:'inner'},
    {id:'brander', name:'Клеймовщик Узора', cr:'9', group:'inner'},
    {id:'loop-master', name:'Магистр Внутренней Петли', cr:'10', group:'inner'},
    {id:'rift-swarm', name:'Трещинная Тень-Рой', cr:'1/2', group:'minor'},
    {id:'false-steps', name:'Хор Ложных Шагов', cr:'1', group:'minor'},
    {id:'rift-link', name:'Сцепка Трещин', cr:'2', group:'minor'},
    {id:'temporal:r5a-copper-false-core', name:'Медный Лже-Центр', cr:'8', group:'temporal', rating:5, anomalyType:'A'},
    {id:'temporal:r5a-spark-cut-hound', name:'Искровой Гончий Среза', cr:'9', group:'temporal', rating:5, anomalyType:'A'},
    {id:'temporal:r5a-amber-trajectory-arbiter', name:'Янтарный Арбитр Траектории', cr:'10', group:'temporal', rating:5, anomalyType:'A'},
    {id:'temporal:r5b-amber-decoy-brood', name:'Янтарная Ложная Матка', cr:'8', group:'temporal', rating:5, anomalyType:'B'},
    {id:'temporal:r5b-lacquer-pounce-reaver', name:'Лаковый Рывковый Потрошитель', cr:'9', group:'temporal', rating:5, anomalyType:'B'},
    {id:'temporal:r5b-hive-proctor-errors', name:'Смотритель Ошибок Гнезда', cr:'10', group:'temporal', rating:5, anomalyType:'B'},
    {id:'temporal:r5c-moonlit-false-victor', name:'Лунный Лже-Победитель', cr:'8', group:'temporal', rating:5, anomalyType:'C'},
    {id:'temporal:r5c-afterimage-rift-hound', name:'Гончий Запоздалого Образа', cr:'9', group:'temporal', rating:5, anomalyType:'C'},
    {id:'temporal:r5c-arbiter-of-wrong-outcome', name:'Арбитр Неверного Исхода', cr:'10', group:'temporal', rating:5, anomalyType:'C'},
    {id:'temporal:r6a-copper-crest-anchor', name:'Медный Якорь Гребня', cr:'9', group:'temporal', rating:6, anomalyType:'A'},
    {id:'temporal:r6a-first-line-reaver', name:'Первый Линейный Рассекатель', cr:'10', group:'temporal', rating:6, anomalyType:'A'},
    {id:'temporal:r6a-copper-plane-controller', name:'Контроллер Медных Плоскостей', cr:'11', group:'temporal', rating:6, anomalyType:'A'},
    {id:'temporal:r6a-returning-line-reaver', name:'Возвратный Линейный Рассекатель', cr:'10', group:'temporal', rating:6, anomalyType:'A'},
    {id:'temporal:r6b-cold-incubator-anchor', name:'Холодный Якорь Инкубатора', cr:'9', group:'temporal', rating:6, anomalyType:'B'},
    {id:'temporal:r6b-tether-ripper', name:'Срыватель Связок', cr:'10', group:'temporal', rating:6, anomalyType:'B'},
    {id:'temporal:r6b-ferment-corridor-controller', name:'Контроллер Ферментных Коридоров', cr:'11', group:'temporal', rating:6, anomalyType:'B'},
    {id:'temporal:r6b-lacquer-trail-finisher', name:'Добиватель Лаковой Тропы', cr:'10', group:'temporal', rating:6, anomalyType:'B'},
    {id:'temporal:r6c-moon-frame-anchor', name:'Лунный Якорь Рамки', cr:'9', group:'temporal', rating:6, anomalyType:'C'},
    {id:'temporal:r6c-first-afterimage-hunter', name:'Первый Охотник Послеобраза', cr:'10', group:'temporal', rating:6, anomalyType:'C'},
    {id:'temporal:r6c-false-outcome-controller', name:'Контроллер Ложных Исходов', cr:'11', group:'temporal', rating:6, anomalyType:'C'},
    {id:'temporal:r6c-returning-dream-hunter', name:'Возвратный Охотник Сна', cr:'10', group:'temporal', rating:6, anomalyType:'C'},
    {id:'temporal:r7ad-pustoy-lozhnyy-razlom', name:'Пустой Ложный Разлом', cr:'11', group:'temporal', rating:7, anomalyType:'A'},
    {id:'temporal:r7ad-pepelnyy-rassekatel-linii', name:'Пепельный Рассекатель Линии', cr:'12', group:'temporal', rating:7, anomalyType:'A'},
    {id:'temporal:r7ad-yakor-sedennogo-impulsa', name:'Якорь Съеденного Импульса', cr:'13', group:'temporal', rating:7, anomalyType:'A'},
    {id:'temporal:r7ad-kontroller-seryh-ploskostey', name:'Контроллер Серых Плоскостей', cr:'14', group:'temporal', rating:7, anomalyType:'A'},
    {id:'temporal:r7bd-pustaya-lozhnaya-matka', name:'Пустая Ложная Матка', cr:'11', group:'temporal', rating:7, anomalyType:'B'},
    {id:'temporal:r7bd-pepelnyy-sryvatel-cveta', name:'Пепельный Срыватель Цвета', cr:'12', group:'temporal', rating:7, anomalyType:'B'},
    {id:'temporal:r7bd-yakor-pustogo-inkubatora', name:'Якорь Пустого Инкубатора', cr:'13', group:'temporal', rating:7, anomalyType:'B'},
    {id:'temporal:r7bd-kontroller-seryh-koridorov', name:'Контроллер Серых Коридоров', cr:'14', group:'temporal', rating:7, anomalyType:'B'},
    {id:'temporal:r7cw-amber-mask-ending', name:'Янтарная Маска Финала', cr:'11', group:'temporal', rating:7, anomalyType:'C'},
    {id:'temporal:r7cw-warm-afterimage-hunter', name:'Охотник Тёплого Послеобраза', cr:'12', group:'temporal', rating:7, anomalyType:'C'},
    {id:'temporal:r7cw-witness-ending', name:'Якорь Сна «Свидетель Финала»', cr:'13', group:'temporal', rating:7, anomalyType:'C'},
    {id:'temporal:r7cw-amber-outcome-controller', name:'Контроллер Янтарных Исходов', cr:'14', group:'temporal', rating:7, anomalyType:'C'}
  ];
  const ANOMALY_TYPE_NAMES = {A:'Энергия', B:'Иные измерения', C:'Тел’аран’риод'};
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
      version: 147, sceneName: '', mode: 'halo', zone: 'outer', rank: 0,
      prof: 3, stabBase: 13, stab: 13, elapsedMinutes: 0, combat: false, round: 0,
      routeIndex: 0, routeStatuses: [], extraSteps: 0, failures: 0, dreamFailures: 0,
      tunnelDuration: 0, postBattle: false, completedChecks: {}, alerts: [],
      objective: OBJECTIVES[0], enemies: [{id:Date.now()+100, monsterId:'cartographer', count:1}], theme: THEMES[0], ending: ENDINGS[0],
      timeLimit: '', timerCadence: 'none', telegraph: '', approach: 'Мудрость (Выживание)',
      scenePhase: 'prep', activeActorIndex: 0, phaseChecks: {},
      party: [1,2,3,4].map((n) => ({id: Date.now()+n, name:`Участник ${n}`, exhaustion:0, markIds:[], notes:''})),
      log: []
    };
  }

  function normalizeMember(member){
    const markIds = Array.isArray(member.markIds) ? member.markIds.map(Number).filter((id) => id >= 0 && id < MARKS.length) : [];
    const leftovers = [];
    if (typeof member.marks === 'string' && member.marks.trim()) {
      member.marks.split(';').map((part) => part.trim()).filter(Boolean).forEach((part) => {
        const index = MARKS.findIndex(([title]) => title.toLowerCase() === part.toLowerCase());
        if (index >= 0) markIds.push(index); else leftovers.push(part);
      });
    }
    return Object.assign({}, member, {markIds:[...new Set(markIds)], notes:[member.notes || '', ...leftovers].filter(Boolean).join('; ')});
  }

  function normalizeEnemies(data){
    if (Array.isArray(data.enemies) && data.enemies.length) return data.enemies.map((item,index) => ({id:item.id || Date.now()+200+index, monsterId:MONSTERS.some((monster)=>monster.id===item.monsterId)?item.monsterId:'cartographer', count:clamp(Number(item.count)||1,1,20)}));
    const legacy = String(data.enemy || '');
    const found = MONSTERS.find((monster) => legacy.toLowerCase().includes(monster.name.toLowerCase()));
    return [{id:Date.now()+200, monsterId:found ? found.id : 'cartographer', count:1}];
  }

  function normalizeState(data){
    const merged = Object.assign(freshState(), data || {}, {version:147});
    merged.party = (merged.party || []).map(normalizeMember);
    merged.enemies = normalizeEnemies(data || merged);
    return merged;
  }

  function loadState(){
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && saved.version === 147) return normalizeState(saved);
      for (const key of LEGACY_STORAGE_KEYS) {
        const legacy = JSON.parse(localStorage.getItem(key));
        if (legacy && [142,144,145,146].includes(legacy.version)) {
          return normalizeState(Object.assign({}, legacy, {scenePhase:legacy.scenePhase || (legacy.combat?'roundStart':legacy.postBattle?'sceneEnd':'prep')}));
        }
      }
    } catch (error) {}
    return normalizeState(freshState());
  }

  let state = loadState();

  function monsterById(id){ return MONSTERS.find((monster) => monster.id === id) || MONSTERS[0]; }
  function monsterLabel(monster){
    if (monster.id === 'none') return monster.name;
    const source = monster.group === 'temporal' ? ` · R${monster.rating} · Type ${monster.anomalyType}` : '';
    return `${monster.name} · CR ${monster.cr}${source}`;
  }
  function enemySummary(){
    const rows = state.enemies.filter((item) => item.monsterId !== 'none' && item.count > 0);
    return rows.length ? rows.map((item) => `${item.count}× ${monsterLabel(monsterById(item.monsterId))}`).join('; ') : 'Без противников';
  }
  function memberMarks(member){ return (member.markIds || []).map((id) => MARKS[Number(id)]).filter(Boolean); }
  function memberStateSummary(member){ return [...memberMarks(member).map(([title])=>title), member.notes].filter(Boolean).join('; ') || 'без Меток и дополнительных состояний'; }

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
    if (member) {
      member.markIds = Array.isArray(member.markIds) ? member.markIds : [];
      if (!member.markIds.includes(die-1)) member.markIds.push(die-1);
    }
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
    if (['halo','window','caravan'].includes(state.mode)) {
      const moment = state.mode === 'window' ? 'когда группа завершила этот сегмент Окна' : 'когда закончился очередной час пути';
      items.push({key:`route-${state.routeIndex}`, title:`После отрезка: «Держать маршрут» · СЛ ${state.mode==='window'?17:zoneDc()||17}`, text:`Бросьте один раз, ${moment}, а не каждый раунд. Текущий отрезок: ${step}. Тяжёлый провал — результат на 5 ниже СЛ.`, urgent:!state.routeStatuses[state.routeIndex]});
    }
    if (state.mode === 'dream') items.push({key:`dream-${state.routeIndex}`,title:`После этапа сна: Проницательность СЛ ${currentDreamDc()}`,text:`Бросьте один раз при завершении этапа «${step}», не в каждом раунде сцены.`,urgent:!state.routeStatuses[state.routeIndex]});
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
    if (state.postBattle) {
      items.push({key:'post-time',title:'Прошёл ли час?',text:'Если да — разрешите часовую маршрутную проверку.'});
      items.push({key:'post-state',title:'STAB · окно · Метки · истощение',text:'Зафиксируйте последствия до следующей сцены.',urgent:true});
      items.push({key:'post-route',title:'Маршрут всё ещё пригоден?',text:'Победа в бою может быть поражением экспедиции.'});
    }
    return items;
  }

  function turnActors(){
    const people = state.party.map((member) => ({key:`pc-${member.id}`, kind:'pc', label:member.name || 'Безымянный герой', member}));
    return people.concat([
      {key:'enemies', kind:'enemies', label:'Противники'},
      {key:'objective', kind:'objective', label:'Цель / NPC'},
      {key:'wall', kind:'wall', label:'Стена / таймер'}
    ]);
  }

  function activeActor(){
    const actors = turnActors();
    state.activeActorIndex = clamp(state.activeActorIndex || 0, 0, Math.max(0, actors.length - 1));
    return actors[state.activeActorIndex];
  }

  function actorItems(actor){
    if (!actor) return [];
    if (actor.kind === 'pc') {
      const member = actor.member;
      const items = [
        {key:'start', title:'Начало хода', text:`Состояния, текущие эффекты и Метки. Истощение: ${member.exhaustion || 0}; ${memberStateSummary(member)}.`},
        {key:'act', title:'Действие героя', text:`Атака, защита, перемещение или шаг к цели: ${state.objective}.`},
        {key:'end', title:'Конец хода', text:'Концентрация, длительности «до конца хода» и созданные персонажем триггеры.'}
      ];
      if ((member.markIds || []).includes(2) || /дыра во времени/i.test(member.notes || '')) items.unshift({key:'time-hole', title:'Дыра во времени · начало хода', text:'Если способность ещё не использована за 24 часа, Мастер может лишить героя действия. Перемещение, бонусное действие и реакции остаются.', urgent:true});
      return items;
    }
    if (actor.kind === 'enemies') return [
      {key:'enemy-start', title:'Эффекты начала хода', text:'Только эффекты статблока и уже наложенные состояния.'},
      {key:'enemy-target', title:'Цель и движение', text:'Выберите цель по логике существа. «Запах шва» решает только между равноценными целями.'},
      {key:'enemy-act', title:'Действия угрозы', text:`${enemySummary()}. После действий отметьте реакции и эффекты до следующего хода.`}
    ];
    if (actor.kind === 'objective') return [
      {key:'objective-progress', title:'Сдвинуть цель сцены', text:state.objective},
      {key:'objective-pressure', title:'Проверить уязвимое', text:'NPC, маяк, караван, выход или другой объект: движение, повреждение, задержка.'},
      {key:'objective-end', title:'Проверить финал', text:`Сцена заканчивается, когда: ${state.ending}.`}
    ];
    const cadence = state.mode === 'tunnel' ? 'В Тоннеле 1 минута проходит за 10 раундов; таймер не останавливается.' : `Таймер: ${TIMER_CADENCE[state.timerCadence]}.`;
    return [
      {key:'wall-trigger', title:`Тема поля: ${state.theme}`, text:'Разрешите только заранее заявленный триггер или эффект конкретного существа.'},
      {key:'wall-timer', title:'Время и выход', text:`${state.timeLimit || 'Отдельного ограничения времени нет.'} ${cadence}`, urgent:state.timerCadence !== 'none' || state.mode === 'tunnel'},
      {key:'wall-strike', title:'Нужен ли Удар среды?', text:'Только если его вызвал тяжёлый провал, порог STAB, способность, существо или заранее объявленное событие. Если триггер есть — используйте окно «События» ниже. Иначе броска нет.'}
    ];
  }

  function phaseItems(){
    const phase = state.scenePhase;
    const zoneName = state.zone === 'outer' ? 'Внешняя Тень' : state.zone === 'inner' ? 'Внутренняя Тень' : state.zone === 'core' ? 'Ядро / Гребень' : 'Тел’аран’риод';
    if (phase === 'prep') return [
      {key:'expedition', title:'1. Где и когда происходит сцена?', text:`Сверьте верхние карточки. Сейчас: ${MODES[state.mode].title}, ${zoneName}, STAB ${state.stab}/${state.stabBase}, отрезок «${routeSteps()[state.routeIndex] || 'маршрут завершён'}». Здесь ничего не бросайте.`, why:'Режим и зона определяют, какая проверка пути понадобится после сцены или по окончании отрезка.'},
      {key:'party', title:'2. Кто входит в сцену и в каком состоянии?', text:`Откройте список группы ниже и прочитайте Метки и истощение ${state.party.length ? `у всех ${state.party.length} участников` : 'после добавления участников'}. Отметьте эффекты, которые сработают в их ход.`, why:'Чтобы не вспоминать Метки уже после того, как ход персонажа закончился.'},
      {key:'goal', title:'3. Что должны сделать игроки?', text:`Сформулируйте одной фразой и озвучьте игрокам: «${state.objective}». Убийство врага само по себе не считается целью, если вы не выбрали это явно.`, why:'Цель подсказывает, что двигать в окне «Цель / NPC» каждый раунд.'},
      {key:'threat', title:'4. Что мешает выполнить цель?', text:`Состав: ${enemySummary()}. Повторяющаяся особенность поля: ${state.theme}. Не добавляйте новую тему каждый раунд.`, why:'Заранее выбранный состав и одна тема сохраняют сцену читаемой и снимают необходимость выбирать осложнение на каждом ходу.'},
      {key:'ending', title:'5. Когда сцена закончится?', text:`Запишите точный момент: «${state.ending}». ${state.timeLimit || 'Отдельного таймера нет.'} Периодичность: ${TIMER_CADENCE[state.timerCadence]}.`, why:'Мастер заранее понимает, когда остановить инициативу и не ведёт бой до последнего хита по привычке.'},
      {key:'telegraph', title:'6. Что игроки заметят до инициативы?', text:state.telegraph ? `Озвучьте признак: «${state.telegraph}».` : 'Признак пока не задан. Ниже, в каркасе энкаунтера, запишите один звук, образ или изменение среды и сообщите его игрокам.', why:'У игроков появляется основание принять решение, а опасность не выглядит внезапным наказанием.', urgent:!state.telegraph}
    ];
    if (phase === 'opening') return [
      {key:'describe', title:'Показать опасность', text:state.telegraph || 'Опишите наблюдаемый признак опасности до инициативы.', urgent:!state.telegraph},
      {key:'goal', title:'Назвать цель', text:state.objective},
      {key:'stakes', title:'Назвать цену промедления', text:`${state.timeLimit || 'Таймера нет'}; окончание: ${state.ending}.`},
      {key:'place', title:'Поставить на поле', text:'Противники, выходы, цель/NPC, укрытия и одну тему поля.'},
      {key:'initiative', title:'Определить порядок', text:'Бросьте инициативу и расположите имена героев в списке группы в удобном порядке.'}
    ];
    if (phase === 'roundStart') {
      const items = [
        {key:'number', title:`Раунд ${state.round || 1}`, text:'Объявите номер раунда и кратко повторите цель сцены.'},
        {key:'start-effects', title:'Общие эффекты начала раунда', text:'Разрешайте только те эффекты, у которых прямо указан этот момент.'},
        {key:'state', title:'Поле и выход', text:`Тема: ${state.theme}. Выход/финал: ${state.ending}.`}
      ];
      if (state.timeLimit) items.push({key:'timer-read', title:'Озвучить остаток времени', text:`${state.timeLimit}; ${TIMER_CADENCE[state.timerCadence]}.`, urgent:true});
      return items;
    }
    if (phase === 'turns') return actorItems(activeActor());
    if (phase === 'roundEnd') {
      const items = [
        {key:'end-effects', title:'Эффекты конца раунда', text:'Разрешите только эффекты с этой периодичностью; не добавляйте новый Удар среды без причины.'},
        {key:'goal', title:'Прогресс цели и уязвимых объектов', text:`${state.objective}. Финал: ${state.ending}.`},
        {key:'decision', title:'Сцена продолжается?', text:'Если условие победы или поражения выполнено — завершите сцену. Иначе начните следующий раунд.'}
      ];
      if (state.timerCadence === 'round') items.splice(1,0,{key:'timer', title:'Сдвинуть таймер', text:state.timeLimit || 'Обновите заявленный счётчик.', urgent:true});
      if (state.timerCadence === 'minute' || state.mode === 'tunnel') {
        const due = state.round > 0 && state.round % 10 === 0;
        items.splice(1,0,{key:'timer-minute', title:due?'Прошла 1 минута':'Минутный таймер ещё не двигается', text:due?'Сдвиньте минутный таймер и проверьте закрытие Тоннеля.':`До следующей минуты: ${10 - (state.round % 10)} раунд(а/ов).`, urgent:due});
      }
      if (state.timerCadence === 'event') items.splice(1,0,{key:'timer-event', title:'Было заявленное событие?', text:'Сдвиньте таймер только если его триггер действительно произошёл.'});
      return items;
    }
    return [
      {key:'time', title:'Сколько времени реально прошло?', text:'Час Ореола, минута Тоннеля или 10 минут Ядра считаются по своему ритму, не по факту победы в бою.'},
      {key:'route', title:'Нужна ли маршрутная проверка?', text:'Если завершился час или сегмент — разрешите её в блоке «Маршрут».'},
      {key:'stab', title:'STAB и новый порог', text:`Текущий STAB ${state.stab}. Порог срабатывает только при входе в более низкий диапазон.`},
      {key:'window', title:'Окно / Тоннель / выход', text:'Проверьте, открыт ли путь и кто успел выйти.'},
      {key:'party', title:'Метки и истощение', text:'Запишите новые последствия у конкретных участников.'},
      {key:'viable', title:'Экспедиция может продолжаться?', text:'Зафиксируйте, пригоден ли маршрут и достигнута ли цель сцены.', urgent:true}
    ];
  }

  function phaseCheckKey(itemKey){
    const actor = state.scenePhase === 'turns' ? activeActor() : null;
    return `${state.scenePhase}-${state.round || 0}-${actor ? actor.key : 'all'}-${itemKey}`;
  }

  function phaseIndex(){ return Math.max(0, PHASES.findIndex((phase) => phase.key === state.scenePhase)); }

  function activatePhase(key, logChange=true){
    const next = PHASES.find((phase) => phase.key === key) || PHASES[0];
    state.scenePhase = next.key;
    if (next.key === 'prep') { state.combat = false; state.postBattle = false; }
    if (next.key === 'opening') { state.combat = true; state.postBattle = false; }
    if (next.key === 'roundStart') { state.combat = true; state.postBattle = false; if (state.round < 1) state.round = 1; }
    if (next.key === 'turns') { state.combat = true; if (state.round < 1) state.round = 1; state.activeActorIndex = clamp(state.activeActorIndex || 0, 0, Math.max(0, turnActors().length - 1)); }
    if (next.key === 'sceneEnd') { state.combat = false; state.postBattle = true; }
    if (logChange) addLog(`Этап сцены: ${next.title}.`);
    save(); render();
  }

  function finishScene(){
    if (state.scenePhase !== 'sceneEnd') addLog(`Сцена завершена${state.round ? ` после раунда ${state.round}` : ''}.`);
    activatePhase('sceneEnd', false);
  }

  function nextPhase(){
    if (state.scenePhase === 'prep') return activatePhase('opening');
    if (state.scenePhase === 'opening') { state.round = 1; addLog('Начат раунд 1.'); return activatePhase('roundStart', false); }
    if (state.scenePhase === 'roundStart') { state.activeActorIndex = 0; return activatePhase('turns'); }
    if (state.scenePhase === 'turns') {
      const actors = turnActors();
      if (state.activeActorIndex < actors.length - 1) { state.activeActorIndex += 1; save(); render(); return; }
      return activatePhase('roundEnd');
    }
    if (state.scenePhase === 'roundEnd') { state.round += 1; addLog(`Начат раунд ${state.round}.`); return activatePhase('roundStart', false); }
    state.scenePhase = 'prep'; state.round = 0; state.combat = false; state.postBattle = false; state.activeActorIndex = 0; state.phaseChecks = {};
    addLog('Подготовка новой сцены.'); save(); render();
  }

  function previousPhase(){
    if (state.scenePhase === 'turns' && state.activeActorIndex > 0) { state.activeActorIndex -= 1; save(); render(); return; }
    if (state.scenePhase === 'roundEnd') { state.activeActorIndex = Math.max(0, turnActors().length - 1); return activatePhase('turns', false); }
    const index = phaseIndex();
    if (index > 0) activatePhase(PHASES[index - 1].key, false);
  }

  function phaseNextLabel(){
    if (state.scenePhase === 'prep') return 'Перейти к открытию';
    if (state.scenePhase === 'opening') return 'Начать раунд 1';
    if (state.scenePhase === 'roundStart') return 'К ходам участников';
    if (state.scenePhase === 'turns') {
      const actors = turnActors(); const next = actors[state.activeActorIndex + 1];
      return next ? `Дальше: ${next.label}` : 'К концу раунда';
    }
    if (state.scenePhase === 'roundEnd') return `Начать раунд ${(state.round || 0) + 1}`;
    return 'Подготовить новую сцену';
  }

  function renderDirector(){
    const current = PHASES[phaseIndex()]; const index = phaseIndex();
    $('#scenePhaseRail').innerHTML = PHASES.map((phase, phaseNumber) => `<button class="wdm-phase-step${phase.key===state.scenePhase?' active':''}${phaseNumber<index?' passed':''}" data-phase="${phase.key}" type="button"><span>${phaseNumber}</span><b>${esc(phase.short.replace(/^\d+ · /,''))}</b></button>`).join('');
    $('#phaseKicker').textContent = `Этап ${index} из ${PHASES.length - 1}`;
    const actor = state.scenePhase === 'turns' ? activeActor() : null;
    $('#phaseTitle').textContent = actor ? `Ход: ${actor.label}` : current.title;
    $('#phaseLead').textContent = current.lead;
    $('#phaseRule').textContent = current.rule;
    $('#sceneRoundBadge').textContent = state.scenePhase === 'prep' ? 'Сцена не начата' : state.scenePhase === 'opening' ? 'Открытие сцены' : state.scenePhase === 'sceneEnd' ? 'Сцена завершена' : `Раунд ${state.round || 1}`;
    const items = phaseItems();
    $('#phaseChecklist').innerHTML = items.map((item) => {const key=phaseCheckKey(item.key);return `<label class="wdm-phase-duty${item.urgent?' urgent':''}"><input type="checkbox" data-phase-check="${esc(key)}" ${state.phaseChecks[key]?'checked':''}/><span><b>${esc(item.title)}</b><small><i>Что сделать:</i> ${esc(item.text)}</small>${item.why?`<em><i>Зачем:</i> ${esc(item.why)}</em>`:''}</span></label>`;}).join('');
    $('#phaseCheckHint').textContent = state.scenePhase === 'prep' ? 'Галочка означает: решение принято и записано. Бросок кубика для этих шести пунктов не требуется.' : state.scenePhase === 'turns' ? 'Галочка означает: действие или эффект этого участника полностью разрешён.' : 'Галочка означает: указанное действие выполнено; это не отдельная проверка, если в тексте прямо не названы бросок и СЛ.';

    const turnFocus = $('#turnFocus'); turnFocus.hidden = state.scenePhase !== 'turns';
    if (actor) {
      const actors = turnActors();
      $('#actorStrip').innerHTML = actors.map((item, actorIndex) => `<button class="wdm-actor-chip${actorIndex===state.activeActorIndex?' active':''}" data-actor-index="${actorIndex}" type="button"><span>${actorIndex+1}</span>${esc(item.label)}</button>`).join('');
      const context = actor.kind === 'pc' ? `Истощение ${actor.member.exhaustion || 0} · ${memberStateSummary(actor.member)}` : actor.kind === 'enemies' ? enemySummary() : actor.kind === 'objective' ? state.objective : `${state.theme} · ${state.timeLimit || 'без отдельного таймера'}`;
      $('#activeActor').innerHTML = `<strong>${esc(actor.label)}</strong><p>${esc(context)}</p><small>${state.activeActorIndex + 1} из ${actors.length}</small>`;
    }

    const responsibilities = [
      {kind:'pc', title:'Герои', when:'Каждый ход', text:'Состояние → действие → шаг к цели → конец хода.'},
      {kind:'enemies', title:'Противники', when:'По инициативе', text:'Эффекты → цель → движение → действия и реакции.'},
      {kind:'objective', title:'Цель / NPC', when:'В назначенный момент', text:'Прогресс, движение, повреждение и условие финала.'},
      {kind:'wall', title:'Стена / таймер', when:'Только по триггеру', text:'Тема поля, заявленное событие и реальная периодичность.'}
    ];
    $('#responsibilityGrid').innerHTML = responsibilities.map((item) => `<article class="wdm-responsibility${actor&&actor.kind===item.kind?' active':''}"><span>${esc(item.when)}</span><b>${esc(item.title)}</b><p>${esc(item.text)}</p></article>`).join('');
    let cue = 'Сейчас ничего не бросайте. Окно событий используется только после явного триггера правила.';
    let cueTone = '';
    if (state.scenePhase === 'opening') cue = 'Бросок нужен только если вы заранее объявили событие открытия сцены или его вызывает способность существа.';
    if (state.scenePhase === 'turns' && actor && actor.kind === 'wall') {cue = 'Сверьте триггеры Стены. Если один из них сработал — разрешите нужный бросок в окне событий.';cueTone=' ready';}
    if (state.scenePhase === 'roundEnd') cue = 'Не бросайте событие автоматически. Проверьте только заранее заявленный триггер конца раунда.';
    if (state.scenePhase === 'sceneEnd') {cue = 'Если итог маршрута вызвал тяжёлый провал, порог STAB или суточный Дрейф — разрешите его в окне событий.';cueTone=' ready';}
    $('#eventCue').innerHTML = `<b>События:</b> ${esc(cue)} <a href="#eventsPanel">Условия и таблицы ↓</a>`;
    $('#eventCue').className = `wdm-event-cue${cueTone}`;
    const label = phaseNextLabel(); $('#phaseNext').textContent = label; $('#footerPhaseNext').textContent = label;
    $('#phaseBack').disabled = state.scenePhase === 'prep';
    $('#phaseFinish').style.visibility = state.scenePhase === 'sceneEnd' || state.scenePhase === 'prep' ? 'hidden' : 'visible';
    $('#footerSceneFinish').style.display = state.scenePhase === 'sceneEnd' || state.scenePhase === 'prep' ? 'none' : '';
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
    $('#toggleCombat').textContent = state.combat ? 'Сцена идёт' : state.postBattle ? 'После сцены' : 'Начать сцену';
    $('#toggleCombat').disabled = state.combat || state.postBattle;
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
    $('#nowTitle').textContent = state.postBattle ? 'Сначала определите прошедшее время' : state.mode === 'window' ? 'Бросок после завершения сегмента' : state.mode === 'tunnel' ? 'Отметка после каждой минуты' : state.mode === 'core' ? 'Броски после каждых 10 минут' : state.mode === 'crest' ? 'Один раз за весь переход' : 'Бросок после окончания часа';
    const duties = dutyItems();
    $('#nowChecklist').innerHTML = duties.length ? duties.map((item) => `<label class="wdm-duty${item.urgent?' urgent':''}"><input type="checkbox" data-duty="${esc(item.key)}" ${state.completedChecks[item.key]?'checked':''}/><span><b>${esc(item.title)}</b><small>${esc(item.text)}</small></span></label>`).join('') : '<div class="wdm-empty">На текущем такте обязательных проверок нет.</div>';
    $('#cadenceNote').textContent = MODES[state.mode].cadence;
  }

  function renderAlerts(){
    $('#alerts').innerHTML = state.alerts.map((item) => `<div class="wdm-alert${item.danger?' danger':''}"><b>${esc(item.title)}</b> · ${esc(item.text)} <button class="wdm-btn small" data-dismiss-alert="${item.id}" type="button">Разрешено</button></div>`).join('');
  }

  function monsterOptions(selected){
    const wallGroups = [
      ['none','Без боя'],
      ['outer','Основные · Внешняя Тень'],
      ['inner','Основные · Внутренняя Тень'],
      ['minor','Мелкие существа / поддержка']
    ];
    const wallOptions = wallGroups.map(([group,label]) => `<optgroup label="${label}">${MONSTERS.filter((monster)=>monster.group===group).map((monster)=>`<option value="${monster.id}" ${monster.id===selected?'selected':''}>${esc(monsterLabel(monster))}</option>`).join('')}</optgroup>`).join('');
    const temporalOptions = [5,6,7].flatMap((rating) => ['A','B','C'].map((anomalyType) => {
      const monsters = MONSTERS.filter((monster) => monster.group === 'temporal' && monster.rating === rating && monster.anomalyType === anomalyType);
      if (!monsters.length) return '';
      const label = `Временные · R${rating} · Type ${anomalyType} · ${ANOMALY_TYPE_NAMES[anomalyType]}`;
      return `<optgroup label="${label}">${monsters.map((monster)=>`<option value="${monster.id}" ${monster.id===selected?'selected':''}>${esc(monsterLabel(monster))}</option>`).join('')}</optgroup>`;
    })).join('');
    return wallOptions + temporalOptions;
  }

  function renderScene(){
    $('#sceneName').value = state.sceneName; $('#objectiveSelect').value = state.objective; $('#themeSelect').value = state.theme; $('#endingSelect').value = state.ending; $('#timeLimit').value = state.timeLimit; $('#timerCadence').value = state.timerCadence; $('#telegraph').value = state.telegraph;
    $('#enemyRoster').innerHTML = state.enemies.length ? state.enemies.map((enemy) => `<div class="wdm-enemy-row" data-enemy="${enemy.id}"><select class="enemy-monster" aria-label="Тип существа">${monsterOptions(enemy.monsterId)}</select><label><span>Количество</span><input class="enemy-count" type="number" min="1" max="20" value="${clamp(Number(enemy.count)||1,1,20)}" aria-label="Количество существ"/></label><button class="wdm-btn danger" data-remove-enemy="${enemy.id}" type="button" aria-label="Удалить тип существа">×</button></div>`).join('') : '<div class="wdm-empty">Противники не выбраны. Добавьте тип существа или оставьте сцену без боя.</div>';
    const warning = state.telegraph ? ` Игроки замечают заранее: ${state.telegraph}.` : ' Добавьте один заметный заранее признак опасности.';
    $('#sceneSummary').textContent = `${state.objective}. Состав: ${enemySummary()}. Поле: ${state.theme}. Сцена заканчивается, когда: ${state.ending}. Таймер: ${TIMER_CADENCE[state.timerCadence]}.${warning}`;
  }

  function renderParty(){
    $('#partyList').innerHTML = state.party.length ? state.party.map((member) => {
      const marks = memberMarks(member);
      const chips = marks.length ? marks.map(([title,text],index) => {const markId=member.markIds[index];return `<button class="wdm-mark-chip" data-remove-mark="${markId}" type="button" title="Удалить Метку">${esc(title)} <span>×</span></button>`;}).join('') : '<span class="wdm-no-marks">Нет Меток</span>';
      const effects = marks.length ? marks.map(([title,text]) => `<div class="wdm-mark-effect"><b>${esc(title)}</b><span>${esc(text)}</span></div>`).join('') : '';
      const options = MARKS.map(([title,text],index)=>`<option value="${index}">${index+1} · ${esc(title)}</option>`).join('');
      return `<div class="wdm-party-row" data-member="${member.id}"><input class="party-name" value="${esc(member.name)}" aria-label="Имя участника"/><select class="party-exhaustion" aria-label="Уровень истощения">${Array.from({length:7},(_,n)=>`<option value="${n}" ${Number(member.exhaustion)===n?'selected':''}>${n} ур.</option>`).join('')}</select><div class="wdm-mark-cell"><div class="wdm-mark-picker"><select class="party-mark-select" aria-label="Добавить Метку"><option value="">Добавить Метку…</option>${options}</select><button class="wdm-btn small" data-add-mark type="button">Добавить</button></div><div class="wdm-mark-chips">${chips}</div><div class="wdm-mark-effects">${effects}</div></div><input class="party-notes" value="${esc(member.notes || '')}" placeholder="Состояния / заметки" aria-label="Прочие состояния"/><button class="wdm-btn danger" data-remove-member="${member.id}" type="button" aria-label="Удалить участника">×</button></div>`;
    }).join('') : '<div class="wdm-empty">Добавьте участников, чтобы Метки и пороги назначались автоматически.</div>';
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

  function renderEvents(){
    $('#eventConditions').innerHTML = `<article><b>Удар среды · 1d8</b><p>Только при тяжёлом провале маршрута, входе STAB в 6–4, прямом указании способности/существа или заранее заявленном событии сцены.</p><small>Не бросать каждый раунд.</small></article><article><b>Метка Узора · 1d6</b><p>Когда выпал результат 8 Удара среды либо правило или способность прямо выдаёт Метку.</p><small>Результат автоматически добавится случайному участнику.</small></article><article><b>Дрейф · 1d6</b><p>Один раз в сутки пребывания у Стены или после крупного события, меняющего фронт.</p><small>Не является частью обычного боя.</small></article>`;
    const strikes = STRIKES.map(([title,text],index)=>`<li><b>${index+1} · ${esc(title)}</b><span>${esc(text)}</span></li>`).join('');
    const marks = MARKS.map(([title,text],index)=>`<li><b>${index+1} · ${esc(title)}</b><span>${esc(text)}</span></li>`).join('');
    $('#eventReference').innerHTML = `<details open><summary>Полная таблица Удара среды · 1d8</summary><ol>${strikes}</ol></details><details open><summary>Полная таблица Меток · 1d6</summary><ol>${marks}</ol></details><details open><summary>Полная таблица Дрейфа · 1d6</summary><ol><li><b>1–3 · Без сдвига</b><span>Локальный дрейф не меняет участок.</span></li><li><b>4–5 · Локальный язык фронта</b><span>Появляется локальный язык фронта; измените обстановку или маршрут.</span></li><li><b>6 · Сильный язык</b><span>Сильный язык и вторичная вспышка: малый разрыв или выброс существ.</span></li></ol></details>`;
  }

  function render(){ renderStatus(); renderAlerts(); renderDirector(); renderRoute(); renderNow(); renderScene(); renderParty(); renderRanks(); renderLog(); renderRoll(); renderEvents(); }

  function fillSelect(id, values){ $(id).innerHTML = values.map((value) => `<option value="${esc(value)}">${esc(value)}</option>`).join(''); }
  fillSelect('#objectiveSelect', OBJECTIVES); fillSelect('#themeSelect', THEMES); fillSelect('#endingSelect', ENDINGS);

  $('#stabPlus').addEventListener('click', () => setStab(state.stab+1));
  $('#stabMinus').addEventListener('click', () => setStab(state.stab-1));
  $('#stabReset').addEventListener('click', () => setStab(state.stabBase,'Безопасный лагерь / восстановление'));
  $('#profSelect').addEventListener('change', (event) => {const previousBase=state.stabBase;state.prof=Number(event.target.value);state.stabBase=10+state.prof;if(state.stab===previousBase)state.stab=state.stabBase;addLog(`Исходный STAB рассчитан: 10 + ${state.prof} = ${state.stabBase}.`);save();render();});
  $('#modeSelect').addEventListener('change', (event) => changeMode(event.target.value));
  $('#zoneSelect').addEventListener('change', (event) => {state.zone=event.target.value; addLog(`Зона: ${event.target.options[event.target.selectedIndex].text}.`); save(); render();});
  $('#rankSelect').addEventListener('change', (event) => {state.rank=Number(event.target.value); save(); render();});
  $('#toggleCombat').addEventListener('click', () => {if(state.scenePhase==='sceneEnd'){state.scenePhase='prep';state.round=0;state.postBattle=false;}activatePhase(state.scenePhase==='prep'?'opening':state.scenePhase);});
  $('#phaseNext').addEventListener('click', nextPhase);
  $('#footerPhaseNext').addEventListener('click', nextPhase);
  $('#phaseBack').addEventListener('click', previousPhase);
  $('#phaseFinish').addEventListener('click', finishScene);
  $('#footerSceneFinish').addEventListener('click', finishScene);
  $('#advanceBeat').addEventListener('click', advanceBeat);
  $('#addRouteStep').addEventListener('click', () => {state.extraSteps+=1;save();render();});
  $('#rollStrike').addEventListener('click', () => rollStrike()); $('#rollMark').addEventListener('click', () => rollMark()); $('#rollDrift').addEventListener('click', rollDrift);
  $('#clearLog').addEventListener('click', () => {state.log=[];save();render();});
  $('#addPartyMember').addEventListener('click', () => {state.party.push({id:Date.now(),name:`Участник ${state.party.length+1}`,exhaustion:0,markIds:[],notes:''});save();render();});
  $('#addEnemy').addEventListener('click', () => {state.enemies.push({id:Date.now(),monsterId:'rift-swarm',count:1});save();render();});

  $('#routeTrack').addEventListener('click', (event) => {const node=event.target.closest('[data-route-index]');if(!node)return;state.routeIndex=Number(node.dataset.routeIndex);save();render();});
  $('#routeActions').addEventListener('click', (event) => {const button=event.target.closest('[data-outcome]');if(button)resolveRoute(button.dataset.outcome);});
  $('#routeActions').addEventListener('change', (event) => {if(event.target.id==='approachSelect'){state.approach=event.target.value;save();}});
  $('#nowChecklist').addEventListener('change', (event) => {if(!event.target.dataset.duty)return;state.completedChecks[event.target.dataset.duty]=event.target.checked;save();});
  $('#phaseChecklist').addEventListener('change', (event) => {if(!event.target.dataset.phaseCheck)return;state.phaseChecks[event.target.dataset.phaseCheck]=event.target.checked;save();});
  $('#scenePhaseRail').addEventListener('click', (event) => {const button=event.target.closest('[data-phase]');if(!button)return;if(button.dataset.phase==='sceneEnd')finishScene();else activatePhase(button.dataset.phase);});
  $('#actorStrip').addEventListener('click', (event) => {const button=event.target.closest('[data-actor-index]');if(!button)return;state.activeActorIndex=Number(button.dataset.actorIndex);save();render();});
  $('#alerts').addEventListener('click', (event) => {const button=event.target.closest('[data-dismiss-alert]');if(!button)return;state.alerts=state.alerts.filter((item)=>String(item.id)!==button.dataset.dismissAlert);save();render();});

  $('#enemyRoster').addEventListener('change', (event) => {
    const row=event.target.closest('[data-enemy]'); if(!row)return; const enemy=state.enemies.find((item)=>String(item.id)===row.dataset.enemy); if(!enemy)return;
    if(event.target.classList.contains('enemy-monster'))enemy.monsterId=event.target.value;
    if(event.target.classList.contains('enemy-count'))enemy.count=clamp(Number(event.target.value)||1,1,20);
    save();renderScene();renderDirector();
  });
  $('#enemyRoster').addEventListener('click', (event) => {const button=event.target.closest('[data-remove-enemy]');if(!button)return;state.enemies=state.enemies.filter((item)=>String(item.id)!==button.dataset.removeEnemy);save();render();});

  $('#partyList').addEventListener('input', (event) => {
    const row=event.target.closest('[data-member]'); if(!row)return; const member=state.party.find((item)=>String(item.id)===row.dataset.member); if(!member)return;
    if(event.target.classList.contains('party-name'))member.name=event.target.value;
    if(event.target.classList.contains('party-notes'))member.notes=event.target.value;
    save();
  });
  $('#partyList').addEventListener('change', (event) => {const row=event.target.closest('[data-member]');if(!row)return;const member=state.party.find((item)=>String(item.id)===row.dataset.member);if(member&&event.target.classList.contains('party-exhaustion')){member.exhaustion=Number(event.target.value);save();}});
  $('#partyList').addEventListener('click', (event) => {
    const row=event.target.closest('[data-member]'); if(!row)return; const member=state.party.find((item)=>String(item.id)===row.dataset.member); if(!member)return;
    const removeMember=event.target.closest('[data-remove-member]');
    if(removeMember){state.party=state.party.filter((item)=>String(item.id)!==removeMember.dataset.removeMember);save();render();return;}
    const addMark=event.target.closest('[data-add-mark]');
    if(addMark){const select=row.querySelector('.party-mark-select');const markId=Number(select.value);if(select.value!==''&&!member.markIds.includes(markId))member.markIds.push(markId);save();render();return;}
    const removeMark=event.target.closest('[data-remove-mark]');
    if(removeMark){member.markIds=member.markIds.filter((id)=>Number(id)!==Number(removeMark.dataset.removeMark));save();render();}
  });

  const boundFields = {sceneName:'sceneName',objectiveSelect:'objective',themeSelect:'theme',endingSelect:'ending',timeLimit:'timeLimit',timerCadence:'timerCadence',telegraph:'telegraph'};
  Object.keys(boundFields).forEach((id) => {
    $(`#${id}`).addEventListener(id==='sceneName'||id==='timeLimit'||id==='telegraph'?'input':'change', (event) => {state[boundFields[id]]=event.target.value;save();renderScene();renderDirector();});
  });

  function summaryText(){
    const steps=routeSteps(); const party=state.party.map((member)=>`— ${member.name}: истощение ${member.exhaustion}; ${memberStateSummary(member)}`).join('\n');
    return `${state.sceneName||'Экспедиция в Аномальной Стене'}\n${MODES[state.mode].title} · ${$('#zoneSelect').options[$('#zoneSelect').selectedIndex].text}\nЭтап сцены: ${PHASES[phaseIndex()].title}${state.round?` · раунд ${state.round}`:''}\nSTAB ${state.stab}/${state.stabBase} · ${bandFor(state.stab).name}\nПуть: ${steps.map((step,index)=>`${step} [${state.routeStatuses[index]||'ожидает'}]`).join(' → ')}\nЦель: ${state.objective}\nПротивники: ${enemySummary()}\nТема: ${state.theme}\nФинал: ${state.ending}\nТаймер: ${state.timeLimit||'нет'}; ${TIMER_CADENCE[state.timerCadence]}\nТелеграф: ${state.telegraph||'не задан'}\n\nГруппа:\n${party||'— не указана'}\n\nПоследние события:\n${state.log.slice(0,10).map((item)=>`[${item.time}] ${item.text}`).join('\n')||'— нет'}`;
  }
  $('#copySummary').addEventListener('click', async () => {
    const text=summaryText();
    try {await navigator.clipboard.writeText(text);toast('Сводка скопирована');}
    catch(error){const area=document.createElement('textarea');area.value=text;document.body.appendChild(area);area.select();document.execCommand('copy');area.remove();toast('Сводка скопирована');}
  });
  $('#resetExpedition').addEventListener('click', () => {if(!confirm('Начать новую экспедицию и очистить текущий журнал?'))return;state=normalizeState(freshState());save();render();toast('Создана новая экспедиция');});

  render();
})();
