(function(){
  'use strict';

  const STORAGE_KEY = 'wot_storm_belt_dm_v152';
  const RESULT_OPTIONS = [
    ['pending','Не выбрано'],['success','Успех'],['fail','Провал'],['severe','Провал на 5+']
  ];

  const ROUTES = {
    direct: {
      title:'Прямой проход', heading:'Прямой проход · 5 секторов', duration:'около 24 часов', maxEncounters:3,
      purpose:'Отчаянный маршрут без безопасной зоны. В каждом секторе обязательны Штормовая нагрузка и минимум одно Событие Полосы; обычный провал сам по себе не уничтожает корабль.',
      stages:[
        {roman:'I',name:'Внешняя кромка',time:'0–3 часа',obs:16,nav:18,handle:17,purpose:'Вход в плотную Полосу и последняя простая возможность отказаться от прорыва.',read:'Горизонт впереди не темнеет — он исчезает. От воды до облаков тянется почти сплошная серо-чёрная стена. Молнии идут внутри неё горизонтально. Когда нос пересекает первую линию дождя, видимый мир сокращается до нескольких сотен футов; за кормой ещё остаётся светлое море.',load:{controlled:'Один функциональный комплект парусов: 2к10 рубящего.',full:'Один функциональный комплект парусов: 3к10 рубящего.',critical:'Один функциональный комплект парусов: 4к10 рубящего.'},after:'После сектора можно повернуть назад: Управление СЛ 17; успех — выход, провал — выход и 1 Цена.'},
        {roman:'II',name:'Слепая вода',time:'3–7 часов',obs:17,nav:19,handle:18,purpose:'Видимость почти исчезает; это последняя относительно реальная точка возврата.',read:'Свет становится зеленовато-серым. Горизонта нет ни впереди, ни по бортам. Дождь почти горизонтальный и на секунды стирает нос корабля. Палуба не успевает освободиться от воды, а приказы приходится кричать прямо в лицо.',load:{controlled:'Паруса 1к10; открытая палуба: Сил СЛ 14, провал — 1к6 дробящего и ничком.',full:'Паруса 2к10; открытая палуба: Сил СЛ 15, провал — 2к6 дробящего и ничком.',critical:'Паруса 3к10; открытая палуба: Сил СЛ 16, провал — 3к6 дробящего и ничком.'},after:'Возврат: Управление СЛ 19, затем Контролируемая нагрузка сектора I и одно Событие. При провале дополнительно 1 Цена.'},
        {roman:'III',name:'Перекрёстный шторм',time:'7–12 часов',obs:18,nav:20,handle:19,purpose:'Удары идут с разных направлений; после входа безопасного разворота больше нет.',read:'Море перестаёт выглядеть единой системой волн. Один ряд валов идёт под углом к другому, и корабль одновременно поднимает нос и получает удар в борт. Гром слышен и сверху, и через воду; в пене заметны длинные тёмные движения.',load:{controlled:'Корпус: 4к10 дробящего, порог 15.',full:'Корпус: 5к10 дробящего, порог 15.',critical:'Корпус: 6к10 дробящего, порог 15.'},after:'Точка невозврата: физический разворот требует пройти III → II → I обратно с их нагрузкой и событиями.'},
        {roman:'IV',name:'Внутренняя штормовая стена',time:'12–19 часов',obs:18,nav:20,handle:20,purpose:'Главная нагрузка перехода одновременно бьёт по корпусу и рангоуту.',read:'Давление резко падает, закладывает уши. Мачты изгибаются, вода образует длинные движущиеся склоны. Белые молнии почти не оставляют паузы и на миг делают дождевую стену прозрачной — за ней только следующий слой дождя.',load:{controlled:'Корпус 5к10 (порог 15) и одна функциональная мачта 2к10 (порог 10).',full:'Корпус 7к10 и одна функциональная мачта 3к10.',critical:'Корпус 9к10 и одна функциональная мачта 4к10.'},after:'Если корабль теряет тягу или управление, немедленно откройте «Корабль потерял ход».'},
        {roman:'V',name:'Прорыв',time:'19–24 часа',obs:17,nav:18,handle:18,purpose:'Последний манёвр: удержать руль и паруса до выхода в обычное море.',read:'Впервые впереди появляется тусклая полоса обычного света. Волны становятся ниже, но ветер мгновенно меняет направление и пытается поставить корабль поперёк хода. Штурвал дёргает так, будто руль зацепился за подводную скалу.',load:{controlled:'Руль 2к10 и один функциональный комплект парусов 2к10.',full:'Руль 3к10 и один функциональный комплект парусов 3к10.',critical:'Руль 4к10 и один функциональный комплект парусов 4к10.'},after:'Если после нагрузки и событий корабль способен двигаться и управляться, он выходит. Обычный провал не означает гибель.'}
      ]
    },
    pulse: {
      title:'Пульсовой коридор', heading:'Пульсовой коридор · 6 фаз', duration:'48 часов', maxEncounters:2,
      purpose:'Рассчитанный путь внутри движущегося коридора. На Оси нет штатной нагрузки и событий; Навигация меняет Положение, а достижение Штормовой стены немедленно вызывает аварийный Контакт.',
      stages:[
        {roman:'I',name:'Перехват',time:'0–6 часов',obs:14,nav:14,handle:14,purpose:'Догнать движущиеся ворота и войти в коридор.',read:'Сначала шторм остаётся сплошным. Потом две массы дождя начинают расходиться, и между ними появляется полоска моря под одним ветром. Она не расширяется навстречу кораблю — она ползёт вдоль стены, и ворота приходится догонять.',event:'Энкаунтера в этой фазе нет.'},
        {roman:'II',name:'Первый поворот',time:'6–14 часов',obs:14,nav:15,handle:15,purpose:'Принять, что коридор идёт вдоль Полосы, и удержать первый поворот.',read:'Светлая вода начинает смещаться. Нос уже направлен не прямо к материку: стена дождя идёт почти параллельно борту и медленно поворачивает вокруг далёкого центра, как секундная стрелка.',event:'Энкаунтера нет. Ровно 8 часов — первое естественное окно для продолжительного отдыха.'},
        {roman:'III',name:'Движущийся фарватер I',time:'14–24 часа',obs:15,nav:16,handle:16,purpose:'Удерживать Ось между двумя вертикальными стенами и следить за тенями в воде.',read:'По обоим бортам стоят серо-чёрные стены с молниями и смерчами. Сам коридор тяжёлый, но волны подчиняются одной системе. Иногда внутри стены видны длинные тени, движущиеся слишком ровно для обломков.',event:'Только если основная процедура закончена на Кромке: 1к6; 1–2 — P-1 «Под килем», 3–6 — визуальный контакт.'},
        {roman:'IV',name:'Движущийся фарватер II',time:'24–34 часа',obs:16,nav:17,handle:17,purpose:'Пережить монотонную ночную часть пути и сохранить ритм команды.',read:'Расстояние до стен постоянно «дышит»: одна приближается, другая отходит. Ночью молнии показывают, насколько высоко уходит шторм. Команда говорит мало; движения становятся привычными: подтянуть, ослабить, повернуть, снова сверить воду.',event:'Случайного монстрового энкаунтера нет. Фаза длится 10 часов и подходит для попытки отдыха.'},
        {roman:'V',name:'Сужение',time:'34–42 часа',obs:17,nav:19,handle:18,purpose:'Кульминация: коридор закрывается за кормой, каждая свободная рука важна.',read:'Обе стены теперь ближе, внутри различимы вращающиеся столбы воды. Позади коридор закрывается быстрее, чем открывается впереди. Ветер несколько раз за час меняет угол.',event:'Если основная процедура закончена на Кромке и лимит боёв не исчерпан: 1к6; 1–3 — P-2 «Крыло над мачтой», 4–6 — только визуальный контакт.'},
        {roman:'VI',name:'Внутреннее горло',time:'42–48 часов',obs:16,nav:17,handle:18,purpose:'Финальный выход: обычный провал не отменяет прохождение, если судно ещё может двигаться.',read:'Впереди впервые появляется настоящее небо. Стены начинают отставать, волны удлиняются, и постепенно все предметы на палубе качаются в одном ритме. Море снова стало обычным морем.',event:'Обычного события нет. При тяжёлом провале Управления одна из двух Цен обязательно должна быть Задержкой.'}
      ]
    }
  };

  const DIRECT_EVENTS = [
    {n:1,title:'Ломающая волна',effect:'Все на открытой палубе: Сил СЛ 16. Провал — 2к6 дробящего, ничком и перемещение на 10 фт по волне. Если за борт: Сил или Лов СЛ 15; успех — цепляется, провал — падает в море.',read:'Вся поверхность моря поднимается одной широкой плитой и ломается прямо через нос.'},
    {n:2,title:'Удар молнии',effect:'Если есть открытые существа — случайная цель, Лов СЛ 16: 4к8 молнией, при успехе половина. Иначе наиболее высокая функциональная мачта получает 4к8 молнией с порогом урона.',read:'Мокрые канаты светятся бледно-синим; через долю секунды сверху приходит белый разряд.'},
    {n:3,title:'Разрыв снастей',effect:'Один персонаж на палубе может реакцией сделать Сил (Атлетика) СЛ 17. Успех — снасть ослаблена вовремя. Провал или нет реакции — функциональные паруса получают 3к10 рубящего.',read:'Натянутый канат начинает петь всё выше, волокна лопаются одно за другим.'},
    {n:4,title:'Плавающие обломки',effect:'Корпус получает 3к10 дробящего, порог урона 15.',read:'Из дождя появляется тёмная балка размером с дерево, почти скрытая под водой.'},
    {n:5,title:'Обратный шквал',effect:'Один персонаж: Инт (Природа) СЛ 17. Успех — эффекта нет. Провал или нет реакции — следующая штатная проверка Управления с помехой. Если проверок уже не осталось, добавьте 1 Задержку.',read:'Дождь зависает, затем вся завеса летит в противоположную сторону.'},
    {n:6,title:'D-1 · Под чёрной водой',combat:true,effect:'3 Штормовых угря CR 5 в воде, в 10–20 фт от бортов и минимум с двух сторон. Цель — сбросить добычу за борт. Завершение: пережить 4 раунда и не оставить добычу в воде; угри без добычи отстают.',read:'Две длинные тени идут вдоль корпуса, третья ударяет хвостом по другому борту.'},
    {n:7,title:'D-2 · Рваный рангоут',combat:true,effect:'Первый раз: 1 Грозовой скат CR 8 + 2 Штормовых угря CR 5. Повторно — только 1 Скат. Скат начинает в 20 фт над рангоутом, угри — в воде. Через 5 раундов корабль выходит из ячейки, если существа не удерживают добычу.',read:'Широкая тёмная форма выходит из стены дождя над мачтой; у бортов вспыхивают электрические силуэты.'},
    {n:8,title:'След Левиафана',optionalCombat:true,effect:'Сначала Восприятие СЛ 17. Провал — Левиафан появляется. Успех: Навигация СЛ 19; успех — обход, но следующее Управление с помехой; провал — бой. Левиафан отходит после 100 суммарного урона или 6 раундов при подвижном корабле.',read:'Море расходится длинной полосой, мелкие тени исчезают, между волн показывается слишком широкая спина.'}
  ];

  const EDGE_EVENTS = [
    {n:1,title:'Волна',effect:'Все на открытой палубе: Сил СЛ 15. Провал — ничком и перемещение на 5 фт.'},
    {n:2,title:'Разряд',effect:'Одна случайная открытая цель: Лов СЛ 15. Провал — 3к8 молнией; успех — половина.'},
    {n:3,title:'Обломки',effect:'Одна случайная открытая цель: Лов СЛ 15. Провал — 2к8 дробящего; успех — без урона.'},
    {n:4,title:'Срыв снасти',effect:'Один персонаж реакцией: Сил (Атлетика) СЛ 15. Успех — без повреждения; провал или нет реакции — функциональные паруса получают 2к10 рубящего.'}
  ];

  const EMERGENCIES = {
    contact:{label:'Контакт со стеной',title:'Контакт со Штормовой стеной',pulseOnly:true,html:'<ol><li><strong>Открытая палуба:</strong> все делают Сил СЛ 16. Провал — 2к6 дробящего и ничком; провал на 5+ ещё сдвигает на 10 фт к борту. Если за борт — Сил или Лов СЛ 15.</li><li><strong>Судно:</strong> корпус 3к10 дробящего (порог 15); функциональные паруса 2к10 рубящего (порог 5).</li><li><strong>Аварийный выход:</strong> Управление СЛ 18, в фазе V — СЛ 19. Положение в любом случае становится 1 — Кромка.</li><li><strong>Провал выхода:</strong> 2 Цены и, если лимит боёв не исчерпан, 1к6 тяжёлого Контакта: 1–3 только последствия, 4–5 Скат, 6 Левиафан.</li></ol>'},
    overboard:{label:'Человек за бортом',title:'Человек за бортом',html:'<ul><li>В начале хода: Сил (Атлетика) СЛ 15. На поверхности успех удерживает дистанцию, провал относит на 15 фт, провал на 5+ ещё уводит под воду. Под водой успех возвращает к поверхности, провал оставляет под водой и относит на 15 фт. Скорость плавания даёт преимущество.</li><li><strong>Линь:</strong> в пределах 20 фт сознательная цель на поверхности может реакцией ухватиться. Бессознательную надо физически достать.</li><li><strong>Подтянуть:</strong> Сил (Атлетика) СЛ 14; успех перемещает на 10 фт к кораблю.</li><li>В коридоре, если угря в воде ещё нет: 1к6; на 1–2 через раунд появляется один Угорь. Короткая спасательная сцена не расходует лимит полноценных боёв.</li></ul>'},
    lost:{label:'Потерян ход',title:'Корабль потерял ход',html:'<ol><li>Проверьте аварийный парус, запасной такелаж, применимое плетение и возможность ремонта.</li><li><strong>Ремонт:</strong> 10 минут, при 6+ раненых — 20; Инт или Лов + инструменты плотника СЛ 15. Успех: компонент 0 → 1 HP при наличии части, временная функция руля, аварийная парусность или снятие осложнения.</li><li><strong>«Обуздать Ветер»:</strong> при рабочей парусной поверхности даёт аварийную тягу, но не заменяет руль и проверку Управления.</li><li>В прямом пути каждые 10 минут ремонта или дрейфа дают дополнительное физическое Событие. В коридоре невосстановленный ход ухудшает Положение на 1 к концу фазы.</li></ol>'},
    hull:{label:'Корпус 0 HP',title:'Тонущий корабль · 5 успехов до 3 провалов',html:'<ul><li>Каждую минуту — одна основная проверка: Сил (Атлетика) СЛ 16 либо Инт/Лов + инструменты плотника СЛ 15; один подходящий помощник может дать преимущество.</li><li>В прямом пути после каждой проверки — одно физическое Событие 1к5. В коридоре: на Оси события нет, на Кромке — действие среды 1к4.</li><li>Новый самостоятельный источник урона, который преодолел бы порог корпуса 15, создаёт один автоматический провал.</li><li><strong>5 успехов:</strong> корпус стабилизирован на 0 HP; движение зависит от тяги и управления. <strong>3 провала:</strong> без чрезвычайного решения судно потеряно.</li></ul>'},
    combat:{label:'Бой на корабле',title:'Ритм боя в Штормовой Полосе',html:'<ul><li><strong>Прямой путь:</strong> на инициативе 20 каждый раунд действие штормовой стены 1к4. В конце 3-го, 6-го, 9-го раунда — Управление против СЛ сектора; провал даёт 1 Цену, тяжёлый провал — 2 Цены и немедленное Событие, если штатный лимит не исчерпан.</li><li><strong>Коридор:</strong> на Кромке, инициатива 20 — действие среды 1к4; на Оси отдельного действия нет. Каждые 3 раунда Управление против СЛ фазы (+2 на Кромке); провал ухудшает Положение на 1.</li><li><strong>Вернуться к Оси в бою:</strong> не более раза за раунд наблюдатель действием делает Восприятие против СЛ фазы; при успехе рулевой сразу делает Управление. Успех обеих проверок: Кромка → Ось.</li></ul>'}
  };

  const MONSTERS = [
    {name:'Штормовой угорь',type:'Большой зверь · CR 5',ac:'16',hp:'127',speed:'10 / плавание 60',stats:'СИЛ 18 · ЛОВ 16 · ТЕЛ 17 · ИНТ 3 · МДР 14 · ХАР 5',body:'<p><b>Спасброски:</b> Лов +6, Тел +6. <b>Восприятие:</b> +5, пассивное 15. <b>Сопротивление:</b> молния. Тёмное зрение 60 фт.</p><ul><li><b>Штормовой пловец:</b> бурное море и течение не труднопроходимы.</li><li><b>Электрочувствительность:</b> в воде чувствует движущееся существо в 120 фт без полной преграды.</li><li><b>Заряженная кожа:</b> первый раз за раунд атакующий металлическим оружием в 5 фт получает 1к6 молнией.</li><li><b>Мультиатака:</b> Укус +7, 2к8+4 колющего + 1к8 молнией; Лезвийный плавник +7, 2к6+4 рубящего, отталкивает на 10 фт; при падении за борт Сил/Лов СЛ 15.</li><li><b>Электрический выброс 5–6:</b> точка в 30 фт, радиус 10 фт, Лов СЛ 14, 4к8 молнией, половина при успехе; полностью в воде — с помехой.</li></ul>'},
    {name:'Грозовой скат',type:'Огромный зверь · CR 8',ac:'17',hp:'178',speed:'10 / плавание 50 / полёт 50 в шторм',stats:'СИЛ 20 · ЛОВ 15 · ТЕЛ 18 · ИНТ 4 · МДР 15 · ХАР 6',body:'<p><b>Спасброски:</b> Сил +8, Тел +7. <b>Восприятие:</b> +5. <b>Сопротивление:</b> гром, молния.</p><ul><li><b>Сквозь ливень:</b> дождь, брызги и штормовой туман не мешают Восприятию. Может зависать в сильном ветре.</li><li><b>Мультиатака:</b> два Крыла +8, 2к10+5 дробящего, Сил СЛ 16 или 10 фт и ничком; Электрический хвост +8, 2к8+5 дробящего + 2к8 молнией, без реакций до следующего хода Скаты.</li><li><b>Разрыв паруса:</b> попадание Крылом по парусу/снасти дополнительно наносит 1к10 рубящего.</li><li><b>Шквальный нырок 5–6:</b> движение без атак возможности; полоса 10 фт, Лов СЛ 16, 6к8+5 дробящего и ничком; успех — половина без падения.</li></ul>'},
    {name:'Левиафан Шквала',type:'Громадный зверь · CR 13',ac:'18',hp:'264',speed:'20 / плавание 60',stats:'СИЛ 24 · ЛОВ 12 · ТЕЛ 22 · ИНТ 3 · МДР 15 · ХАР 7',body:'<p><b>Спасброски:</b> Сил +12, Тел +11, Мдр +7. <b>Восприятие:</b> +7. <b>Сопротивление:</b> гром, молния. Слепое зрение 60, тёмное 120 фт.</p><ul><li><b>Штормовая масса:</b> преимущество против сбивания с ног и принудительного движения. В воде чувствует движущиеся Большие объекты в 300 фт.</li><li><b>Мультиатака:</b> Укус +12, 3к10+7 колющего + 1к8 молнией, захват СЛ 18; два Грозовых плавника +12, 2к10+7 дробящего + 1к8 молнией, Сил СЛ 18 или отталкивание 15 фт.</li><li><b>Хвостовая волна 5–6:</b> открытая палуба в 60 фт, Сил СЛ 18, 8к8 дробящего, ничком и 10 фт; успех — половина.</li><li><b>Таран корпуса:</b> вместо Мультиатаки, +12 против КД корпуса, 6к10+7 дробящего. Затем Управление СЛ 18: в коридоре провал ухудшает Положение, в прямом пути даёт 1 Цену.</li><li><b>Отход:</b> после первых 100 суммарных повреждений пытается уйти в конце следующего хода, если не держит добычу и игроки не преследуют.</li></ul>'}
  ];

  const SHIP_DEFAULTS = [
    {id:'hull',name:'Корпус',max:300,ac:15,threshold:15},
    {id:'mast1',name:'Мачта 1',max:80,ac:15,threshold:10},
    {id:'mast2',name:'Мачта 2',max:80,ac:15,threshold:10},
    {id:'sail1',name:'Паруса 1',max:60,ac:12,threshold:5},
    {id:'sail2',name:'Паруса 2',max:60,ac:12,threshold:5},
    {id:'rudder',name:'Руль',max:50,ac:16,threshold:10}
  ];

  function freshState(){
    return {
      version:152,route:'direct',stageIndex:0,position:0,
      prep:{chart:false,roles:false,ship:false,supplies:false},
      ship:Object.fromEntries(SHIP_DEFAULTS.map(item=>[item.id,item.max])),
      injuredCrew:0,cargoShares:4,delays:0,costDue:0,requiredDelay:0,costApplied:0,
      encounters:0,combat:false,round:0,pendingHeavyContact:false,
      progress:{direct:{},pulse:{}},log:[]
    };
  }

  function loadState(){
    try{
      const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
      if(!raw||raw.version!==152) return freshState();
      const base=freshState();
      return Object.assign(base,raw,{prep:Object.assign(base.prep,raw.prep||{}),ship:Object.assign(base.ship,raw.ship||{}),progress:Object.assign(base.progress,raw.progress||{})});
    }catch(_){return freshState();}
  }

  let state=loadState();
  let emergencyKey='contact';
  const $=id=>document.getElementById(id);
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));
  const route=()=>ROUTES[state.route];
  const stage=()=>route().stages[state.stageIndex];
  const progress=()=>{
    const store=state.progress[state.route]||(state.progress[state.route]={});
    return store[state.stageIndex]||(store[state.stageIndex]={obs:'pending',nav:'pending',support:'none',wind:'none',handle:'pending',contact:'pending',applied:false,load:'',eventsTarget:0,eventsRolled:0,specialRolled:false});
  };

  function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
  function esc(value){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
  function now(){return new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});}
  function log(text){state.log.unshift({time:now(),text});state.log=state.log.slice(0,80);save();renderLog();}
  function toast(text){const el=$('toast');el.textContent=text;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2200);}
  function roll(sides){return Math.floor(Math.random()*sides)+1;}

  function render(){
    renderRouteChoice();renderBefore();renderStatus();renderTrack();renderStage();renderEvents();renderEmergencies();renderMonsters();renderShip();renderCosts();renderRest();renderLog();
  }

  function renderRouteChoice(){
    document.querySelectorAll('[data-route]').forEach(button=>button.classList.toggle('active',button.dataset.route===state.route));
    $('routeHeading').textContent=route().heading;
    $('prepRouteText').textContent=state.route==='direct'?'Без безопасной зоны: нагрузка и событие обязательны в каждом секторе.':'Стартовое Положение 0 — Ось; следите за движением коридора все 48 часов.';
  }

  function renderBefore(){
    document.querySelectorAll('[data-prep]').forEach(input=>{input.checked=!!state.prep[input.dataset.prep];});
  }

  function shipCondition(){
    const sails=['sail1','sail2'].filter(id=>state.ship[id]>0).length;
    const hull=state.ship.hull;
    const rudder=state.ship.rudder;
    if(hull<=0) return {title:'Тонет',note:'Корпус 0 HP · стабилизация',danger:true};
    if(!sails||rudder<=0) return {title:'Авария',note:!sails?'Нет штатной тяги':'Руль 0 HP',danger:true};
    return {title:hull<150?'Повреждён':'Готов',note:`${sails===2?100:75} фт/раунд · корпус ${hull}/300`,danger:false};
  }

  function renderStatus(){
    const s=stage(),p=progress(),condition=shipCondition();
    $('statusStage').textContent=`${state.route==='direct'?'Сектор':'Фаза'} ${s.roman} · ${s.name}`;
    $('statusTime').textContent=s.time;
    if(state.route==='direct'){
      const label={controlled:'Контролируемая',full:'Полная',critical:'Критическая'}[p.load]||'Ещё не определена';
      $('statusDanger').textContent=label;$('statusDangerNote').textContent='Штормовая нагрузка этапа';
    }else{
      const positions=['0 · Ось','1 · Кромка','2 · Штормовая стена'];
      $('statusDanger').textContent=positions[state.position]||positions[0];
      $('statusDangerNote').textContent=state.position===0?'Без штатного события':state.position===1?'Среда активна в бою':'Немедленный Контакт';
    }
    $('statusShip').textContent=condition.title;$('statusShipNote').textContent=condition.note;
    $('statusCosts').textContent=state.costDue?`${state.costDue} ждут`:String(state.costApplied);
    $('statusEncounters').textContent=`${state.encounters} / ${route().maxEncounters}`;
    $('statusEncounterNote').textContent=state.combat?`бой идёт · раунд ${state.round||1}`:'полноценных боёв';
  }

  function renderTrack(){
    const container=$('routeTrack');container.className=`storm-track ${state.route}`;
    container.innerHTML=route().stages.map((item,index)=>{
      const p=(state.progress[state.route]||{})[index]||{};
      return `<button type="button" data-stage="${index}" class="${index===state.stageIndex?'active ':''}${p.applied?'done':''}"><span>${state.route==='direct'?'Сектор':'Фаза'} ${item.roman} · ${item.time}</span><b>${item.name}</b><small>СЛ ${item.obs} / ${item.nav} / ${item.handle}</small></button>`;
    }).join('');
    container.querySelectorAll('[data-stage]').forEach(button=>button.addEventListener('click',()=>{state.stageIndex=Number(button.dataset.stage);save();render();window.scrollTo({top:$('routeHeading').getBoundingClientRect().top+window.scrollY-95,behavior:'smooth'});}));
  }

  function resultSelect(id,label,dc,options=RESULT_OPTIONS,hint=''){
    const p=progress();
    return `<label class="storm-roll-control"><header><b>${label}</b><em>${dc}</em></header><select data-result="${id}" ${p.applied?'disabled':''}>${options.map(([value,text])=>`<option value="${value}" ${p[id]===value?'selected':''}>${text}</option>`).join('')}</select><small>${hint}</small></label>`;
  }

  function calculation(){
    const s=stage(),p=progress();
    const navPending=p.nav==='pending',handlePending=p.handle==='pending';
    if(state.route==='direct'){
      const adjusted=s.handle+(p.nav==='fail'?2:p.nav==='severe'?4:0);
      let load='';
      if(!navPending&&!handlePending){
        const severe=p.nav==='severe'||p.handle==='severe';
        const fails=[p.nav,p.handle].filter(value=>value!=='success').length;
        load=severe||fails===2?'critical':fails===1?'full':'controlled';
      }
      const costs=p.handle==='fail'?1:p.handle==='severe'?2:0;
      const events=1+(p.nav==='severe'||p.handle==='severe'?1:0);
      return {ready:!navPending&&!handlePending,adjusted,load,costs,events,contact:false,position:state.position};
    }
    let projected=state.position;
    if(p.nav==='success') projected=Math.max(0,projected-1);
    if(p.nav==='fail') projected+=1;
    if(p.nav==='severe') projected+=2;
    const contact=projected>=2;
    const finalPosition=contact?1:projected;
    const adjusted=s.handle+(finalPosition===1?2:0);
    const contactReady=!contact||p.contact!=='pending';
    const costs=(p.handle==='fail'?1:p.handle==='severe'?2:0)+(contact&&p.contact==='fail'?2:0);
    return {ready:!navPending&&!handlePending&&contactReady,adjusted,load:'',costs,events:0,contact,position:finalPosition};
  }

  function renderStage(){
    const s=stage(),p=progress(),calc=calculation();
    $('stageKicker').textContent=`${state.route==='direct'?'Сектор':'Фаза'} ${s.roman} · ${s.time}`;
    $('stageTitle').textContent=s.name;$('stagePurpose').textContent=s.purpose;$('stageReadaloud').textContent=s.read;
    $('previousStage').disabled=state.stageIndex===0;$('nextStage').disabled=state.stageIndex===route().stages.length-1;
    $('nextStage').textContent=state.route==='direct'?'Следующий сектор':'Следующая фаза';
    const deckDc=state.injuredCrew>=3?19:17;
    let controls='';
    controls+=resultSelect('obs','1 · Наблюдение',`СЛ ${s.obs}`,[['pending','Не выбрано'],['success','Успех'],['fail','Провал']],'Успех → преимущество на Навигацию. Провал → без штрафа.');
    controls+=resultSelect('nav','2 · Навигация',`СЛ ${s.nav}`,RESULT_OPTIONS,state.route==='direct'?'Провал повышает СЛ Управления; тяжёлый провал ещё даёт второе Событие.':'Успех улучшает Положение на 1; провал ухудшает на 1, тяжёлый — на 2.');
    controls+=resultSelect('support','3 · Поддержка',`СЛ ${deckDc}`,[['none','Не используется'],['success','Успех'],['fail','Провал']],'Успех → преимущество на Управление или снять одну помеху.');
    controls+=resultSelect('wind','4 · Обуздать Ветер','ячейка 3+',[['none','Не используется'],['advantage','Преимущество'],['remove','Снять помеху']],'Требует концентрации; максимум один эффект на Управление этапа.');
    controls+=resultSelect('handle','5 · Управление',`СЛ ${calc.adjusted}`,RESULT_OPTIONS,'Провал → 1 Цена; тяжёлый провал → 2 Цены.');
    if(state.route==='pulse'&&calc.contact){
      const contactDc=state.stageIndex===4?19:18;
      controls+=resultSelect('contact','Контакт · аварийный выход',`СЛ ${contactDc}`,[['pending','Не разрешён'],['success','Успех'],['fail','Провал']],'Сначала палуба и судно получают удар. Положение затем становится 1; провал → ещё 2 Цены и проверка тяжёлого Контакта.');
    }
    $('checkControls').innerHTML=controls;
    $('checkControls').querySelectorAll('[data-result]').forEach(select=>select.addEventListener('change',()=>{progress()[select.dataset.result]=select.value;save();renderStage();renderStatus();renderEvents();}));

    const badge=$('computedBadge');
    badge.className='storm-result-badge'+(calc.ready?' ready':'')+(calc.load==='critical'||calc.contact?' danger':'');
    badge.textContent=p.applied?'Результат применён':calc.ready?'Готово к применению':'Ожидает бросков';
    const advantage=p.obs==='success'?'Преимущество от Наблюдения':'Без преимущества от Наблюдения';
    const support=p.support==='success'||p.wind!=='none'?'Поддержка Управления есть':'Дополнительной поддержки нет';
    let outcome=`<article><span>Навигация</span><b>${advantage}</b><small>Бросок сравнивается с СЛ ${s.nav}.</small></article>`;
    outcome+=`<article><span>Управление</span><b>СЛ ${calc.adjusted}</b><small>${support}${state.route==='pulse'&&calc.position===1?' · +2 за Кромку':''}.</small></article>`;
    if(state.route==='direct'){
      const loadName={controlled:'Контролируемая',full:'Полная',critical:'Критическая'}[calc.load]||'Не определена';
      outcome+=`<article><span>Итог этапа</span><b>${loadName}</b><small>${calc.load?s.load[calc.load]:'Выберите Навигацию и Управление.'} Цены: ${calc.costs}; события: ${calc.events}.</small></article>`;
    }else{
      const pos=['Ось','Кромка','Штормовая стена'][calc.position]||'Ось';
      outcome+=`<article><span>Итог этапа</span><b>${calc.contact?'Контакт → Кромка':pos}</b><small>${calc.contact?'Сначала разрешите аварийную карточку. ':''}Цены: ${calc.costs}. ${s.event}</small></article>`;
    }
    if(s.after) outcome+=`<article><span>После этапа</span><b>Решение маршрута</b><small>${s.after}</small></article>`;
    $('computedOutcome').innerHTML=outcome;
    $('applyStage').disabled=!calc.ready||p.applied;
    $('applyStage').textContent=p.applied?'Результаты уже применены':'Применить результаты этапа';
  }

  function applyStage(){
    const p=progress(),calc=calculation(),s=stage();
    if(!calc.ready||p.applied) return;
    p.applied=true;p.load=calc.load;p.eventsTarget=calc.events;
    state.costDue+=calc.costs;
    if(state.route==='pulse'){
      state.position=calc.position;
      if(calc.contact&&p.contact==='fail') state.pendingHeavyContact=true;
      if(state.stageIndex===5&&p.handle==='severe') state.requiredDelay+=1;
    }
    const result=state.route==='direct'?`${{controlled:'контролируемая',full:'полная',critical:'критическая'}[calc.load]} нагрузка; ${calc.events} событие(я); ${calc.costs} Цена(ы)`:`Положение ${calc.position}; ${calc.costs} Цена(ы)${calc.contact?'; Контакт разрешён':''}`;
    log(`${state.route==='direct'?'Сектор':'Фаза'} ${s.roman} · ${s.name}: ${result}.`);
    save();render();toast('Результат этапа применён');
  }

  function eventMode(){
    const p=progress();
    if(state.route==='direct'){
      const target=p.applied?p.eventsTarget:1;
      if(p.eventsRolled<target) return {type:'direct',label:'Бросить Событие · 1к8',heading:'Событие Полосы · 1к8',trigger:`Штатных событий в этом секторе: ${p.eventsRolled} из ${target}. Максимум — 2 на сектор.`};
      if(state.combat) return {type:'directCombat',label:'Инициатива 20 · 1к4',heading:'Штормовая стена в бою · 1к4',trigger:'В прямом проходе среда действует на инициативе 20 каждый раунд. Каждые 3 раунда нужна проверка Управления.'};
      return {type:'directExtra',label:'Дополнительное событие · 1к8',heading:'События Полосы · по триггеру',trigger:'Штатный минимум сектора выполнен. Дополнительное событие нужно только из-за ремонта, дрейфа или другого явного правила.'};
    }
    if(state.pendingHeavyContact) return {type:'heavy',label:'Тяжёлый Контакт · 1к6',heading:'Провал аварийного выхода',trigger:'После провала аварийного выхода бросьте по таблице тяжёлого Контакта. Новый бой невозможен при исчерпанном лимите или уже идущем энкаунтере.'};
    if(state.combat&&state.position===1) return {type:'edge',label:'Инициатива 20 · 1к4',heading:'Действие среды Кромки',trigger:'Бросайте на инициативе 20, проигрывая ничьи, только пока корабль на Кромке. На Оси отдельного действия среды нет.'};
    if(!p.specialRolled&&state.position===1&&state.stageIndex===2) return {type:'p1',label:'Проверить P-1 · 1к6',heading:'P-1 · проверка встречи',trigger:'Только после основной процедуры Фазы III на Кромке и если в фазе ещё не начался полноценный бой.'};
    if(!p.specialRolled&&state.position===1&&state.stageIndex===4) return {type:'p2',label:'Проверить P-2 · 1к6',heading:'P-2 · проверка встречи',trigger:'Только после основной процедуры Фазы V на Кромке и при свободном лимите полноценных боёв.'};
    return {type:'none',label:'Нет броска события',heading:'Событие текущей фазы',trigger:stage().event||'На Оси штатного События Полосы нет.'};
  }

  function renderEvents(){
    const mode=eventMode();$('eventHeading').textContent=mode.heading;$('eventTrigger').innerHTML=`<p>${esc(mode.trigger)}</p><label class="storm-combat-toggle"><input id="combatToggle" type="checkbox" ${state.combat?'checked':''}/> Бой идёт</label>${state.combat?`<button class="wdm-btn small" id="nextRound" type="button">Следующий раунд · сейчас ${state.round||1}</button>`:''}`;
    $('rollEvent').textContent=mode.label;$('rollEvent').disabled=mode.type==='none';
    $('combatToggle').addEventListener('change',event=>{state.combat=event.target.checked;state.round=state.combat?Math.max(1,state.round):0;save();renderStatus();renderEvents();});
    const roundButton=$('nextRound');if(roundButton) roundButton.addEventListener('click',()=>{state.round=Math.max(1,state.round)+1;log(`Бой: начался раунд ${state.round}.${state.round%3===0?' В конце раунда требуется Управление.':''}`);save();renderStatus();renderEvents();});
    const refs=state.route==='direct'?DIRECT_EVENTS.map(item=>`<details><summary>${item.n} · ${item.title}</summary><p><b>Покажите:</b> ${item.read}</p><p>${item.effect}</p></details>`).join(''):renderPulseReferences();
    $('eventReference').innerHTML=refs;
  }

  function renderPulseReferences(){
    const p1='<details><summary>P-1 · Под килем</summary><p>3 Штормовых угря CR 5 в 10–20 фт от бортов. Цели: сбросить человека, атаковать в воде, мешать рулевому. Завершение: все убиты; два полных раунда на Оси; либо 4 раунда без добычи в воде.</p></details>';
    const p2='<details><summary>P-2 · Крыло над мачтой</summary><p>1 Грозовой скат CR 8 + 1 Штормовой угорь CR 5. Скат начинает в 20 фт над рангоутом, Угорь — у борта. Задачи: сохранить рангоут, защитить навигатора и рулевого, не отдать человека воде, вернуть корабль на Ось. Завершение: победа; два раунда на Оси; либо 5 раундов без добычи.</p></details>';
    return p1+p2+EDGE_EVENTS.map(item=>`<details><summary>${item.n} · ${item.title}</summary><p>${item.effect}</p></details>`).join('');
  }

  function registerEncounter(title){
    if(state.encounters>=route().maxEncounters||state.combat) return false;
    state.encounters+=1;state.combat=true;state.round=1;log(`Начался полноценный энкаунтер: ${title}.`);return true;
  }

  function showEvent(title,effect,rollText,canCount=false){
    $('eventResult').innerHTML=`<strong>${esc(rollText)} · ${esc(title)}</strong><p>${effect}</p>${canCount?'<button class="wdm-btn small" id="countEncounter" type="button">Учесть бой с Левиафаном</button>':''}`;
    if(canCount){$('countEncounter').addEventListener('click',()=>{if(registerEncounter('Левиафан Шквала')){save();render();toast('Бой учтён');}else toast('Лимит боёв исчерпан или бой уже идёт');});}
  }

  function rollCurrentEvent(){
    const mode=eventMode(),p=progress();
    if(mode.type==='none') return;
    if(mode.type==='direct'||mode.type==='directExtra'){
      let value=roll(8);
      if((state.encounters>=route().maxEncounters||state.combat)&&value>=6) value=roll(5);
      const item=DIRECT_EVENTS[value-1];
      if(mode.type==='direct') p.eventsRolled+=1;
      if(item.combat) registerEncounter(item.title);
      if(item.n===5&&state.stageIndex===4) state.delays+=1;
      showEvent(item.title,`<small>${esc(item.read)}</small>${esc(item.effect)}`,`1к8 = ${value}`,item.optionalCombat);
      log(`Событие Полосы: ${item.title} (${value}).`);
    }else if(mode.type==='directCombat'||mode.type==='edge'){
      const value=roll(4),item=EDGE_EVENTS[value-1];showEvent(item.title,esc(item.effect),`1к4 = ${value}`);log(`Действие среды: ${item.title} (${value}).`);
    }else if(mode.type==='heavy'){
      state.pendingHeavyContact=false;
      let value=roll(6);
      if((state.encounters>=route().maxEncounters||state.combat)&&value>=4){
        const edge=EDGE_EVENTS[roll(4)-1];showEvent(`Вместо нового боя · ${edge.title}`,esc(edge.effect),`1к6 = ${value}`);log(`Тяжёлый Контакт заменён действием среды: ${edge.title}.`);
      }else if(value<=3){showEvent('Только последствия Контакта','Нового существа нет. Продолжите фазу с Положением 1 — Кромка.',`1к6 = ${value}`);log('Тяжёлый Контакт: без нового существа.');}
      else {const title=value<=5?'1 Грозовой скат CR 8':'Левиафан Шквала CR 13';registerEncounter(title);showEvent(title,'Бросьте инициативу. Скат начинает примерно в 20 фт над палубой; Левиафан — примерно в 30 фт от корпуса в воде.',`1к6 = ${value}`);}
    }else if(mode.type==='p1'||mode.type==='p2'){
      const value=roll(6);p.specialRolled=true;
      const fight=mode.type==='p1'?value<=2:value<=3;
      const title=mode.type==='p1'?'P-1 · Под килем':'P-2 · Крыло над мачтой';
      if(fight&&state.encounters<route().maxEncounters&&!state.combat){registerEncounter(title);showEvent(title,mode.type==='p1'?'3 Штормовых угря CR 5. Откройте карточку P-1 ниже.':'1 Грозовой скат CR 8 + 1 Штормовой угорь CR 5. Откройте карточку P-2 ниже.',`1к6 = ${value}`);}
      else {showEvent('Только визуальный контакт',mode.type==='p1'?'Тени некоторое время идут рядом, затем исчезают в стене.':'Скат некоторое время движется внутри стены рядом, но корабль отрывается.',`1к6 = ${value}`);log(`${title}: визуальный контакт без боя.`);}
    }
    save();renderStatus();renderEvents();
  }

  function renderEmergencies(){
    const keys=Object.keys(EMERGENCIES).filter(key=>!(EMERGENCIES[key].pulseOnly&&state.route!=='pulse'));
    if(!keys.includes(emergencyKey)) emergencyKey=keys[0];
    $('emergencyTabs').innerHTML=keys.map(key=>`<button type="button" data-emergency="${key}" class="${key===emergencyKey?'active':''}">${EMERGENCIES[key].label}</button>`).join('');
    $('emergencyTabs').querySelectorAll('[data-emergency]').forEach(button=>button.addEventListener('click',()=>{emergencyKey=button.dataset.emergency;renderEmergencies();}));
    const card=EMERGENCIES[emergencyKey];$('emergencyBody').innerHTML=`<h3>${card.title}</h3>${card.html}`;
  }

  function renderMonsters(){
    $('monsterCards').innerHTML=MONSTERS.map(monster=>`<details><summary>${monster.name} · ${monster.type}</summary><div class="storm-monster-line"><span><b>КД</b>${monster.ac}</span><span><b>HP</b>${monster.hp}</span><span><b>Скорость</b>${monster.speed}</span></div><p>${monster.stats}</p>${monster.body}</details>`).join('');
  }

  function renderShip(){
    $('shipComponents').innerHTML=SHIP_DEFAULTS.map(item=>`<div class="storm-component ${state.ship[item.id]<=0?'zero':''}"><header><b>${item.name}</b><small>КД ${item.ac} · порог ${item.threshold}</small></header><div class="storm-component-controls"><input type="range" min="0" max="${item.max}" value="${clamp(state.ship[item.id],0,item.max)}" data-ship="${item.id}"/><input type="number" min="0" max="${item.max}" value="${clamp(state.ship[item.id],0,item.max)}" data-ship="${item.id}"/></div></div>`).join('');
    $('shipComponents').querySelectorAll('[data-ship]').forEach(input=>input.addEventListener('input',()=>{
      const def=SHIP_DEFAULTS.find(item=>item.id===input.dataset.ship);state.ship[def.id]=clamp(input.value,0,def.max);
      if(def.id==='mast1'&&state.ship.mast1===0) state.ship.sail1=0;if(def.id==='mast2'&&state.ship.mast2===0) state.ship.sail2=0;
      save();renderShip();renderStatus();
    }));
    const alerts=[];
    const sails=['sail1','sail2'].filter(id=>state.ship[id]>0).length;
    if(sails===1) alerts.push('Один комплект парусов: скорость 75 фт/раунд; следующая проверка Управления с помехой.');
    if(sails===0) alerts.push('Обычной парусной тяги недостаточно: нужен аварийный парус, ремонт или иной источник тяги.');
    if(state.ship.mast1===0||state.ship.mast2===0) alerts.push('Упавшая мачта: Лов СЛ 15 в полосе 10 фт; провал — 3к10 дробящего и ничком. До расчистки Управление с помехой.');
    if(state.ship.rudder===0) alerts.push('Руль 0 HP: перед Управлением Сил (Атлетика) СЛ 18. Успех — Управление с помехой; провал — штатный бросок невозможен.');
    if(state.ship.hull===0) alerts.push('Корпус 0 HP: немедленно начните процедуру 5 успехов до 3 провалов.');
    $('shipAlerts').innerHTML=alerts.length?alerts.map((text,index)=>`<div class="storm-alert ${index===alerts.length-1&&shipCondition().danger?'danger':''}">${text}</div>`).join(''):'<div class="storm-alert">Все основные системы функциональны.</div>';
  }

  const COSTS=[
    {id:'exhaustion',label:'Истощение',help:'Многочасовая физическая перегрузка. Отметьте уровень у подходящего участника.'},
    {id:'injury',label:'Раненый матрос',help:'Обычный член команды выбывает до лечения.'},
    {id:'rigging',label:'Повреждённый рангоут',help:'Нанесите парусам 25 урона или мачте 20; пороги применяются.'},
    {id:'cargo',label:'Потеря груза',help:'Уменьшает Доли груза на 1, минимум до 0.'},
    {id:'delay',label:'Задержка',help:'Обход, ожидание или ремонт действительно отняли время.'}
  ];

  function renderCosts(){
    $('injuredCrew').value=state.injuredCrew;$('cargoShares').value=state.cargoShares;$('delays').value=state.delays;
    $('costButtons').innerHTML=COSTS.map(item=>`<button class="wdm-btn" type="button" data-cost="${item.id}" ${state.costDue<=0||state.requiredDelay>0&&state.costDue<=state.requiredDelay&&item.id!=='delay'?'disabled':''}>${item.label}</button>`).join('');
    $('costButtons').querySelectorAll('[data-cost]').forEach(button=>button.addEventListener('click',()=>applyCost(button.dataset.cost)));
    const crew=state.injuredCrew>=6?'СЛ Поддержки 19; ремонт 20 минут.':state.injuredCrew>=3?'СЛ Поддержки повышена до 19.':'Экипаж компенсирует до двух раненых без общего штрафа.';
    const cargo=state.cargoShares>=3?'Существенного ограничения снабжения нет.':state.cargoShares===2?'Перед долгим уходом от берега желательно пополнить припасы.':state.cargoShares===1?'Пополнение обязательно; без него только краткие действия у берега.':'Основные походные запасы утрачены; нужно новое снабжение.';
    $('costHelp').innerHTML=`<p><b>Нераспределено:</b> ${state.costDue}${state.requiredDelay?` · из них Задержка обязательна: ${state.requiredDelay}`:''}. Выбирайте по тому, что реально произошло.</p><p><b>Команда:</b> ${crew}</p><p><b>Груз:</b> ${cargo}</p>`;
  }

  function applyCost(id){
    if(state.costDue<=0) return;
    const item=COSTS.find(cost=>cost.id===id);if(!item) return;
    if(id==='injury') state.injuredCrew+=1;
    if(id==='cargo') state.cargoShares=Math.max(0,state.cargoShares-1);
    if(id==='delay'){state.delays+=1;state.requiredDelay=Math.max(0,state.requiredDelay-1);}
    state.costDue-=1;state.costApplied+=1;log(`Цена прохода: ${item.label}.`);save();render();
  }

  function renderRest(){
    $('restRules').innerHTML=state.route==='direct'?'<li>Непрерывная аварийная работа не позволяет завершить продолжительный отдых.</li><li>Можно не участвовать в отдельных секторах ради сна или передышки, но это не становится полным продолжительным отдыхом.</li><li>Отдыхающий персонаж не даёт активную поддержку в этом секторе.</li>':'<li>Используйте обычные правила продолжительного отдыха вашей редакции 5e.</li><li>Удобные окна: Фаза II — 8 часов; Фазы III и IV — по 10 часов.</li><li>Плохие окна: Фазы I и VI — по 6 часов; Фаза V — 8 часов, но поддержка особенно важна.</li><li>Отдыхающий не даёт поддержку, может быть поднят при аварии и рискует прервать отдых по обычным правилам.</li>';
  }

  function renderLog(){
    $('eventLog').innerHTML=state.log.length?state.log.map(entry=>`<div class="wdm-log-entry"><time>${esc(entry.time)}</time><span>${esc(entry.text)}</span></div>`).join(''):'<p class="wdm-empty">Пока ничего не зафиксировано.</p>';
  }

  document.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll('[data-route]').forEach(button=>button.addEventListener('click',()=>{
      const next=button.dataset.route;if(next===state.route) return;
      state.route=next;state.stageIndex=0;state.position=0;state.encounters=0;state.combat=false;state.round=0;state.pendingHeavyContact=false;save();log(`Выбран маршрут: ${ROUTES[next].title}.`);render();
    }));
    document.querySelectorAll('[data-prep]').forEach(input=>input.addEventListener('change',()=>{state.prep[input.dataset.prep]=input.checked;save();}));
    $('toggleBefore').addEventListener('click',()=>{const body=$('beforeBody'),hidden=!body.hidden;body.hidden=hidden;$('toggleBefore').textContent=hidden?'Развернуть':'Свернуть';});
    $('previousStage').addEventListener('click',()=>{if(state.stageIndex>0){state.stageIndex-=1;save();render();}});
    $('nextStage').addEventListener('click',()=>{if(state.stageIndex<route().stages.length-1){state.stageIndex+=1;save();render();}});
    $('applyStage').addEventListener('click',applyStage);
    $('rollEvent').addEventListener('click',rollCurrentEvent);
    $('injuredCrew').addEventListener('change',event=>{state.injuredCrew=clamp(event.target.value,0,99);save();render();});
    $('cargoShares').addEventListener('change',event=>{state.cargoShares=clamp(event.target.value,0,4);save();render();});
    $('delays').addEventListener('change',event=>{state.delays=clamp(event.target.value,0,99);save();render();});
    $('clearLog').addEventListener('click',()=>{state.log=[];save();renderLog();});
    $('resetSession').addEventListener('click',()=>{if(confirm('Очистить весь прогресс, состояние корабля и журнал этой сессии?')){state=freshState();save();render();toast('Создана новая сессия');}});
    render();
  });
})();
