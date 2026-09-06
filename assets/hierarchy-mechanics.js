(function () {
  'use strict';

  const db = window.WOT_HIERARCHY_DB = window.WOT_HIERARCHY_DB || { hierarchies: [] };
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

  const profiles = {
    'crystal-throne': {
      version: 'v1.2', color: '#e87a7a', type: 'shonchan', priorities: ['str', 'cha'],
      ranks: {
        I: { penaltyPoints: 2, initiative: -1, saves: -1 },
        II: { statPoints: 4, hp: 10, speed: 10, initiative: 2, saves: 1, dc: 1, weaveAttack: 1, weaveDamageDice: 2, weaveRangeMult: 1.5 },
        III: { statPoints: 4, hp: 10, hitDiceMult: 1.5, speed: 15, initiative: 5, saves: 2, saveAdv: 'Телосложение', dc: 2, weaveAttack: 3, weaveDamageDice: 5, weaveRangeMult: 1.8 },
        IV: { statPoints: 4, cap: 22, hp: 30, hitDiceMult: 1.5, speed: 20, initiativeAdv: true, saves: 3, dc: 3, weaveAttack: 4, weaveDamageDice: 12, weaveRangeMult: 3 },
        V: { statPoints: 4, cap: 24, hp: 30, hitDiceMult: 1.5, speed: 25, initiative: 10, initiativeAdv: true, saves: 4, dc: 3, weaveAttack: 4, weaveDamageDice: 16, weaveRangeMult: 3 },
        VI: { statPoints: 4, cap: 26, hp: 110, hitDiceMult: 1.5, speed: 40, initiative: 15, initiativeAdv: true, saves: 5, dc: 4, weaveAttack: 5, weaveDamageDice: 24, weaveRangeMult: 50, regen: 25 }
      }
    },
    unity: {
      version: 'v1.2', color: '#b07ae8', type: 'unity', priorities: ['wis', 'int'],
      ranks: {
        I: { penaltyPoints: 2, initiative: -1, saves: -1 },
        II: { statPoints: 4, cap: 22, hp: 10, speed: 10, initiative: 2, saves: 1, dc: 2, weavePower: 2, extraSlots: 2 },
        III: { statPoints: 4, cap: 24, hp: 10, hitDiceMult: 2, speed: 15, initiative: 5, saves: 2, saveAdv: 'против состояния «испуган»', dc: 4, weavePower: 5, extraSlots: 3 },
        IV: { statPoints: 4, cap: 24, hp: 30, hitDiceMult: 2, speed: 20, initiative: 5, initiativeAdv: true, saves: 3, saveAdv: 'против состояния «испуган»', dc: 6, weavePower: 12, extraSlots: 4 },
        V: { statPoints: 4, cap: 24, statCaps: { int: 26, wis: 26 }, hp: 30, hitDiceMult: 3, speed: 30, initiative: 10, initiativeAdv: true, saves: 5, dc: 7, weavePower: 24, extraSlots: 5 }
      }
    },
    'far-madding-keepers': {
      version: 'v1.1', color: '#7ae8d4', type: 'guild', priorities: ['int', 'wis'],
      ranks: {
        I: { penaltyPoints: 2, initiative: -1, saves: -1 },
        II: { statPoints: 4, cap: 20, hp: 10, speed: 10, initiative: 2, saves: 1, regen: 3 },
        III: { statPoints: 4, cap: 20, hp: 30, speed: 15, initiative: 5, saves: 2, saveAdv: 'Интеллект и Мудрость', regen: 5 },
        IV: { statPoints: 4, cap: 22, hp: 50, ac: 2, speed: 20, initiativeAdv: true, saves: 3, saveAdv: 'Интеллект и Мудрость', regen: 10 },
        V: { statPoints: 4, cap: 24, hp: 50, hitDiceMult: 3, ac: 2, speed: 30, initiative: 10, initiativeAdv: true, saves: 5, saveAdv: 'Интеллект и Мудрость', regen: 15 }
      }
    },
    'shara-will': {
      version: 'редакция III', color: '#d7a849', type: 'shara', priorities: ['con', 'wis'],
      branches: [
        { id: 'aiyad', name: 'Путь Айяд / Накша' },
        { id: 'warrior', name: 'Путь Воина / Клинка Воли' }
      ],
      branchFromRank: 'III',
      ranks: {
        I: { fixedStats: { con: -1 }, hp: -5, initiative: -1, saves: -1 },
        II: { statPoints: 4, cap: 22, hitDiceMult: 1.5, ac: 2, initiative: 2, saves: 1, dc: 1 },
        III: { statPoints: 4, cap: 22, hitDiceMult: 2, ac: 3, initiative: 2, initiativeAdv: true, saves: 1, saveAdv: 'Телосложение', dcByBranch: { aiyad: 2, warrior: 0 }, attackByBranch: { aiyad: 0, warrior: 2 }, forceDamageDieByBranch: { warrior: '1к6' } },
        IV: { statPoints: 4, cap: 24, hitDiceMult: 2.5, ac: 4, speedByBranch: { aiyad: 0, warrior: 5 }, initiative: 3, initiativeAdv: true, saves: 1, saveAdv: 'Телосложение', dcByBranch: { aiyad: 3, warrior: 0 }, attackByBranch: { aiyad: 0, warrior: 3 }, forceDamageDieByBranch: { warrior: '1к8' }, regen: 5 },
        V: { statPoints: 4, cap: 26, hp: 80, hitDiceMult: 3.5, ac: 6, speed: 10, initiative: 6, initiativeAdv: true, saves: 1, saveAdv: 'Телосложение', dcByBranch: { aiyad: 5, warrior: 0 }, attackByBranch: { aiyad: 0, warrior: 3 }, forceDamageDieByBranch: { warrior: '1к8' }, regen: 20 }
      }
    },
    'pattern-guardians': {
      version: 'v1.1', color: '#c084fc', type: 'order', priorities: ['wis', 'con'],
      ranks: {
        I: { initiative: -1 },
        II: { statPoints: 2, attack: 1, damage: 1, speed: 5, initiative: 1, saves: 1, dc: 1, weaveAttack: 1, weaveDamageDice: 1, weaveRangeMult: 1.3, extraSlots: 1 },
        III: { statPoints: 2, ac: 1, attack: 1, damage: 1, speed: 5, initiative: 2, saves: 2, dc: 2, weaveAttack: 2, weaveDamageDice: 3, weaveRangeMult: 1.6, extraSlots: 2 },
        IV: { statPoints: 2, cap: 22, hp: 20, ac: 1, attack: 2, damage: 2, speed: 5, initiative: 3, saves: 3, dc: 3, weaveAttack: 3, weaveDamageDice: 5, weaveRangeMult: 1.8, extraSlots: 3 },
        V: { statPoints: 2, cap: 22, hp: 40, ac: 2, attack: 2, damage: 2, speed: 10, initiative: 4, saves: 4, dc: 4, weaveAttack: 3, weaveDamageDice: 6, weaveRangeMult: 2, extraSlots: 4 },
        VI: { statPoints: 2, cap: 24, hp: 60, ac: 2, attack: 3, damage: 3, speed: 10, initiative: 5, saves: 5, dc: 5, weaveAttack: 4, weaveDamageDice: 12, weaveRangeMult: 3, extraSlots: 5 }
      }
    },
    scream: {
      version: 'v2.4', color: '#fb923c', type: 'scream', priorities: ['wis', 'dex'],
      ranks: {
        I: { initiative: 1, initiativeExceptional: 2, conductivity: 1 },
        II: { statPoints: 1, ac: 1, initiative: 2, initiativeExceptional: 4, stability: 1, conductivity: 2, width: 1, chargeDie: 'к4' },
        III: { statPoints: 1, ac: 1, speed: 5, initiative: 3, initiativeExceptional: 5, stability: 1, conductivity: 4, width: 1, chargeDie: 'к4' },
        IV: { statPoints: 2, cap: 22, ac: 2, speed: 5, initiative: 4, initiativeExceptional: 7, stability: 2, conductivity: 7, width: 2, chargeDie: 'к6' },
        V: { statPoints: 1, cap: 22, ac: 3, speed: 10, initiative: 5, initiativeExceptional: 8, stability: 2, conductivity: 10, width: 2, chargeDie: 'к6' },
        VI: { statPoints: 2, cap: 24, ac: 3, speed: 10, initiative: 6, initiativeExceptional: 10, stability: 3, conductivity: 14, width: 3, chargeDie: 'к8' },
        VII: { statPoints: 1, cap: 24, ac: 4, speed: 10, initiative: 7, initiativeExceptional: 12, stability: 3, conductivity: 19, width: 3, chargeDie: 'к8' },
        VIII: { statPoints: 2, cap: 26, ac: 5, speed: 15, initiative: 8, initiativeExceptional: 15, stability: 4, conductivity: 24, width: 4, chargeDie: 'к10' }
      },
      profileNote: 'Бонус инициативы Крика определяется результатом «Счёта витков»: первое значение — успех, exceptional — успех на 5+.'
    },
    'anomalous-wall': {
      version: 'v1.0', color: '#7aa8e8', type: 'wall', priorities: ['con', 'wis'],
      ranks: {
        I: { initiative: -1 },
        II: { statPoints: 2, attack: 1, damage: 1, speed: 5, initiative: 1, saves: 1 },
        III: { statPoints: 2, ac: 1, attack: 1, damage: 1, speed: 5, initiative: 2, saves: 2 },
        IV: { statPoints: 2, hp: 20, ac: 1, attack: 2, damage: 2, speed: 5, initiative: 3, saves: 3 },
        V: { statPoints: 2, hp: 40, ac: 2, attack: 2, damage: 2, speed: 10, initiative: 4, saves: 4 },
        VI: { statPoints: 2, cap: 22, hp: 60, ac: 2, attack: 3, damage: 3, speed: 10, initiative: 5, saves: 5 },
        VII: { statPoints: 2, cap: 24, hp: 80, ac: 3, attack: 3, damage: 3, speed: 15, initiative: 6, saves: 5 },
        VIII: { statPoints: 2, cap: 24, hp: 100, ac: 3, attack: 4, damage: 4, speed: 15, initiative: 7, saves: 6 }
      }
    }
  };

  function rankNumber(rank) { return ROMAN.indexOf(String(rank || '').toUpperCase()) + 1; }
  function rankStart(label) {
    const found = String(label || '').toUpperCase().match(/VIII|VII|VI|IV|V|III|II|I/);
    return found ? rankNumber(found[0]) : 0;
  }
  function getHierarchy(id) { return (db.hierarchies || []).find(h => h.id === id) || null; }
  function branchAllows(path, branch) {
    if (!branch || !path) return true;
    const p = String(path).toLowerCase();
    const hasAiyad = /айяд|накша/.test(p);
    const hasWarrior = /воин|клинок|воитель/.test(p);
    if (!hasAiyad && !hasWarrior) return true;
    if (hasAiyad && hasWarrior) return true;
    return branch === 'aiyad' ? hasAiyad : hasWarrior;
  }
  function abilitiesFor(id, rank, branch, isChanneler) {
    const h = getHierarchy(id);
    const current = rankNumber(rank);
    if (!h || !current) return [];
    return (h.abilities || []).filter(a => rankStart(a.rank) <= current)
      .filter(a => branchAllows(a.path, branch))
      .filter(a => isChanneler || !/направляющ/i.test(String(a.path || '')));
  }

  const unity = getHierarchy('unity');
  if (unity) {
    unity.version = 'v1.2';
    unity.ranks = [
      { rank: 'I', name: 'Посвящённый', stats: '−1 к двум различным характеристикам; обычная скорость; инициатива −1; −1 ко всем спасброскам.', note: 'Цена Взноса Воли. Оба штрафа полностью прекращаются при получении II ранга.' },
      { rank: 'II', name: 'Хранитель Единства', stats: '+2 к двум выбранным характеристикам, предел 22; +10 хитов; скорость +10 фт; инициатива +2; +1 ко всем спасброскам; направляющие: +2 СЛ, профиль усиления 2, 2 дополнительных применения.', note: 'Открывает Обратный поток 1к8 + БМ.' },
      { rank: 'III', name: 'Наставник Единства', stats: 'Ещё +2 к двум характеристикам, предел 24; классовые Кости Хитов ×2; скорость +15 фт; инициатива +5; +2 ко всем спасброскам; направляющие: +4 СЛ, профиль усиления 5, 3 дополнительных применения.', note: 'Открывает Предвидение тактики и Единство Плетений; Обратный поток 2к8 + 2 × БМ.' },
      { rank: 'IV', name: 'Верховный Советник', stats: 'Ещё +2 к двум характеристикам, предел 24; фиксированные +30 хитов и классовые Кости Хитов ×2; скорость +20 фт; инициатива +5 и преимущество; +3 ко всем спасброскам; направляющие: +6 СЛ, профиль усиления 12, 4 дополнительных применения.', note: 'Открывает Стойкость Единства, Щит сплочённости и Легендарную решимость; Обратный поток 3к8 + 3 × БМ.' },
      { rank: 'V', name: 'Проводник Единства', stats: 'Ещё +2 к двум характеристикам; предел 24, Интеллект и Мудрость до 26; фиксированные +30 хитов и классовые Кости Хитов ×3; скорость +30 фт; инициатива +10 и преимущество; +5 ко всем спасброскам; направляющие: +7 СЛ, профиль усиления 24, 5 дополнительных применений.', note: 'Открывает Господство Единой Силы и Единый фронт; Обратный поток 5к8 + 3 × БМ.' }
    ];
    const ability = (name, rank, type, description, aliases) => ({ name, rank, path: 'Единство', type, source: 'unity.html', aliases: [name].concat(aliases || []), description });
    unity.abilities = [
      ability('Правило наследования рангов', 'I–V', 'Общая механика', 'Получая новый ранг, персонаж сохраняет уникальные способности нижестоящих рангов, если конкретное правило не говорит об обратном. Числовые профили не складываются автоматически: скорость, инициатива, бонусы к спасброскам, бонус к СЛ плетений, профиль усиления и число дополнительных применений берутся по текущему рангу. Способности с собственным лимитом использования имеют независимые ресурсы, если их правило прямо не устанавливает общий пул.'),
      ability('Взнос Воли', 'I', 'Цена ранга', 'На I ранге персонаж выбирает две различные характеристики и уменьшает каждую на 1. Выбор делается один раз. При получении II ранга эти два штрафа сначала полностью прекращаются, и только затем применяется новый пакет II ранга.', ['Переходный ранг', 'Бонусы к атрибутам']),
      ability('Ранговые профили направляющего', 'II–V', 'Рост направляющего', 'Бонус к СЛ плетений является профилем текущего ранга: II +2, III +4, IV +6, V +7. Профиль усиления также заменяется текущим значением: II — 2, III — 5, IV — 12, V — 24. Дополнительные применения плетений не суммируются: II — 2, III — 3, IV — 4, V — 5. Они восстанавливаются после продолжительного отдыха и не являются обычными ячейками плетений.', ['+1 к DC заклинаний', '+2 к DC заклинаний', '+5 к уровню силы плетений', '+2 доп. слота плетений', '+3 доп. слота']),
      ability('Обратный поток', 'II–V', 'Уникальная способность', 'Когда другое дружественное существо, которое вы видите в пределах 30 футов, получает урон, вы можете использовать реакцию, чтобы направить к нему импульс общего резерва. После применения сопротивлений и иных модификаторов уменьшите оставшийся урон на величину текущего ранга: II — 1к8 + БМ; III — 2к8 + 2 × БМ; IV — 3к8 + 3 × БМ; V — 5к8 + 3 × БМ. Значение текущего ранга заменяет предыдущее и не складывается с ним. Использований — количество, равное БМ, все восстанавливаются после продолжительного отдыха. Для одного случая урона применяется только один Обратный поток. Способность не действует на вас самого, не восстанавливает хиты, не даёт временные хиты и не отменяет иные последствия эффекта.'),
      ability('Предвидение тактики', 'III', 'Уникальная способность', 'Один раз за раунд, когда вы или видимый вами союзник в пределах 60 футов совершает бросок атаки, проверку характеристики или спасбросок, вы можете после броска, но до объявления результата, заставить цель перебросить d20. Новый результат необходимо использовать. Способность не требует действия, бонусного действия или реакции.'),
      ability('Единство Плетений', 'III', 'Уникальная способность', 'Один раз за продолжительный отдых, если вы способны направлять Единую Силу, вы можете мгновенно привлечь силу одного или нескольких добровольных направляющих Единства в пределах 25 футов и сформировать специальный круг для сотворения одного плетения. Формирование круга не требует действий или проверок присоединения, но сохраняет обычные ограничения состава круга по полу и числу участников. Для этого плетения вы считаетесь направляющим на 2 уровня выше; фиксированный бонус +2 используется вместо обычного бонуса размера круга и не складывается с ним. После разрешения плетения круг немедленно прекращается. Способность не меняет ваш Уровень Силы, уровень персонажа или класса и не предоставляет постоянных ячеек.'),
      ability('Стойкость Единства', 'IV', 'Уникальная способность', 'Вы имеете сопротивление дробящему, колющему и рубящему урону от немагических источников и совершаете с преимуществом спасброски против плетений Единой Силы. Это пассивная способность, не требующая действия или концентрации. Она действует независимо от того, являетесь ли вы направляющим.'),
      ability('Щит сплочённости', 'IV', 'Уникальная способность', 'Пока вы в сознании, вокруг вас постоянно действует подвижная аура радиусом 30 футов. Другие дружественные существа в ауре получают +2 ко всем спасброскам, включая спасброски от смерти, и сопротивление урону, непосредственно причинённому плетениями Единой Силы. Аура не требует действия или концентрации. Несколько Щитов сплочённости не складываются.'),
      ability('Легендарная решимость', 'IV', 'Уникальная способность', 'Один раз за продолжительный отдых, когда вы проваливаете спасбросок, вы можете вместо этого считать его успешным. Способность не требует действия, бонусного действия или реакции и может применяться к спасброску от смерти. В таком случае она даёт один успешный спасбросок от смерти, а не натуральную 20 и не восстанавливает хиты.'),
      ability('Господство Единой Силы', 'V', 'Уникальная способность', 'Один раз за продолжительный отдых выберите один из двух режимов. Восстановление резерва: в свой ход без действия, бонусного действия или реакции мгновенно восстановите все израсходованные обычные ячейки плетений; отдельные ресурсы Иерархии не восстанавливаются. Легендарное плетение: в свой ход сотките одно дополнительное известное плетение со временем сотворения «1 действие», не расходуя для него действие; ячейка или иной обычный ресурс расходуется как обычно. Этот режим не позволяет одновременно поддерживать более одного плетения, требующего концентрации, и сам по себе не прерывает уже удерживаемую концентрацию.'),
      ability('Единый фронт', 'V', 'Уникальная способность', 'Вокруг вас постоянно действует аура радиусом 60 футов. Другие дружественные существа в ауре имеют иммунитет к состоянию «испуган». Если союзник уже находится под действием такого эффекта, его последствия подавляются, пока союзник остаётся в ауре, но исходный эффект не прекращается. В начале каждого своего хода союзник в ауре получает 5 временных хитов. Это не лечение. Несколько аур не складываются. Аура не требует действия или концентрации и не отключается только из-за потери сознания, пока действует ранговая связь с резервом.')
    ];
  }

  Object.entries(profiles).forEach(([id, mechanics]) => {
    const hierarchy = getHierarchy(id);
    if (hierarchy) {
      hierarchy.mechanics = mechanics;
      hierarchy.version = hierarchy.version || mechanics.version;
    }
  });

  db.schemaVersion = 2;
  db.updated = '2026-09-06';
  db.rankOrder = ROMAN.slice();
  db.getHierarchy = getHierarchy;
  db.getRankNumber = rankNumber;
  db.getAbilities = abilitiesFor;
  db.validate = function () {
    const errors = [];
    const ids = new Set();
    (db.hierarchies || []).forEach(h => {
      if (!h.id || ids.has(h.id)) errors.push('Повторяющийся или пустой id: ' + (h.id || '—'));
      ids.add(h.id);
      if (!h.mechanics) errors.push('Нет механического профиля: ' + h.name);
      const contentRanks = (h.ranks || []).map(r => r.rank);
      const mechanicRanks = h.mechanics ? Object.keys(h.mechanics.ranks || {}) : [];
      mechanicRanks.forEach(rank => { if (!contentRanks.includes(rank)) errors.push(h.name + ': механический ранг ' + rank + ' отсутствует в справочном профиле'); });
      contentRanks.forEach((rank, index) => { if (rankNumber(rank) !== index + 1) errors.push(h.name + ': нарушена последовательность рангов у ' + rank); });
      const abilityNames = new Set();
      (h.abilities || []).forEach(a => {
        if (!a.name || !a.description || !a.rank) errors.push(h.name + ': неполная запись способности ' + (a.name || '—'));
        if (abilityNames.has(a.name)) errors.push(h.name + ': повтор способности ' + a.name);
        abilityNames.add(a.name);
      });
    });
    return errors;
  };
  db.validationErrors = db.validate();
})();
