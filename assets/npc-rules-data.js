(function(){
'use strict';
window.WOT_NPC_RULES = {
  asiLevels: {
    default:[4,8,12,16,19],
    'Варвар':[4,8,12,16,19],
    'Лесник':[4,8,12,16,19],
    'Посвящённый':[4,8,12,16,19],
    'Посвященный':[4,8,12,16,19],
    'Скиталец':[4,8,12,16,19],
    'Дичок':[4,8,12,16,19],
    'Пустынный воин':[4,8,12,16,19],
    'Мастер по оружию':[4,6,8,12,14,16,19],
    'Благородный':[4,8,12,16,19]
  },
  nationBonuses: {
    'Айил':{con:2}, 'Морской народ':{cha:2}, 'Атаан Миэйр':{cha:2},
    'Порубежники':{str:2}, 'Порубежник':{str:2}, 'Арафел':{str:2}, 'Кандор':{str:2}, 'Салдея':{str:2}, 'Шайнар':{str:2},
    'Амадиция':{str:2}, 'Андор':{str:1,cha:1}, 'Кайриен':{int:1,cha:1}, 'Тар Валон':{int:1,cha:1}, 'Муранди':{dex:1,int:1},
    'Домани жен':{cha:2}, 'Домани муж':{str:2}, 'Иллиан':{str:1,cha:1}, 'Тир':{dex:1,wis:1}, 'Тарабон':{wis:2}, 'Майен':{dex:2}, 'Алтара':{con:1,dex:1}, 'Шара':{int:2}, 'Шончан':{con:2},
    'Фар Мэддинг':{int:1,wis:1}
  },
  equipment: {
    weapons: [
      {name:'Без оружия',type:'melee',damage:'1к4',stat:'str',properties:'Импровизированное/безоружное'},
      {name:'Club / Дубинка',type:'melee',damage:'1к4',stat:'str',cost:'1 см',weight:'2 фнт.',properties:'Лёгкое'},
      {name:'Greatclub / Палица',type:'melee',damage:'1к8',stat:'str',cost:'2 см',weight:'10 фнт.',properties:'Двуручное'},
      {name:'Handaxe / Ручной топор',type:'melee',damage:'1к6',stat:'str',cost:'5 зм',weight:'2 фнт.',properties:'Лёгкое, метательное 20/60'},
      {name:'Light hammer / Лёгкий молот',type:'melee',damage:'1к4',stat:'str',cost:'2 зм',weight:'2 фнт.',properties:'Лёгкое, метательное 20/60'},
      {name:'Mace / Булава',type:'melee',damage:'1к6',stat:'str',cost:'5 зм',weight:'4 фнт.',properties:'—'},
      {name:'Javelin / Метательное копьё',type:'melee',damage:'1к6',stat:'str',cost:'5 см',weight:'2 фнт.',properties:'Метательное 30/120'},
      {name:'Sickle / Серп',type:'melee',damage:'1к4',stat:'str',cost:'1 зм',weight:'2 фнт.',properties:'Лёгкое'},
      {name:'Dart / Дротик',type:'ranged',damage:'1к4',stat:'dex',cost:'5 мм',weight:'1/4 фнт.',properties:'Метательное 20/60, фехтовальное'},
      {name:'Sling / Праща',type:'ranged',damage:'1к4',stat:'dex',cost:'1 см',weight:'—',properties:'Боеприпас 30/120'},
      {name:'Halberd / Алебарда',type:'melee',damage:'1к10',stat:'str',cost:'20 зм',weight:'6 фнт.',properties:'Двуручное, досягаемость, тяжёлое'},
      {name:'War pick / Боевая кирка',type:'melee',damage:'1к8',stat:'str',cost:'5 зм',weight:'2 фнт.',properties:'—'},
      {name:'Warhammer / Боевой молот',type:'melee',damage:'1к8',stat:'str',cost:'15 зм',weight:'2 фнт.',properties:'Универсальное 1к10'},
      {name:'Glaive / Глефа',type:'melee',damage:'1к10',stat:'str',cost:'20 зм',weight:'6 фнт.',properties:'Двуручное, досягаемость, тяжёлое'},
      {name:'Greatsword / Двуручный меч',type:'melee',damage:'2к6',stat:'str',cost:'50 зм',weight:'6 фнт.',properties:'Двуручное, тяжёлое'},
      {name:'Lance / Длинное копьё',type:'melee',damage:'1к12',stat:'str',cost:'10 зм',weight:'6 фнт.',properties:'Досягаемость, особое'},
      {name:'Whip / Кнут',type:'melee',damage:'1к4',stat:'dex',cost:'2 зм',weight:'3 фнт.',properties:'Досягаемость, фехтовальное'},
      {name:'Maul / Молот',type:'melee',damage:'2к6',stat:'str',cost:'10 зм',weight:'10 фнт.',properties:'Двуручное, тяжёлое'},
      {name:'Morningstar / Моргенштерн',type:'melee',damage:'1к8',stat:'str',cost:'15 зм',weight:'4 фнт.',properties:'—'},
      {name:'Pike / Пика',type:'melee',damage:'1к10',stat:'str',cost:'5 зм',weight:'18 фнт.',properties:'Двуручное, досягаемость, тяжёлое'},
      {name:'Trident / Трезубец',type:'melee',damage:'1к6',stat:'str',cost:'5 зм',weight:'4 фнт.',properties:'Метательное 20/60, универсальное 1к8'},
      {name:'Flail / Цеп',type:'melee',damage:'1к8',stat:'str',cost:'10 зм',weight:'2 фнт.',properties:'—'},
      {name:'Crossbow, hand / Арбалет ручной',type:'ranged',damage:'1к6',stat:'dex',cost:'75 зм',weight:'3 фнт.',properties:'Боеприпас 30/120, лёгкое, перезарядка'},
      {name:'Blowgun / Духовая трубка',type:'ranged',damage:'1',stat:'dex',cost:'10 зм',weight:'1 фнт.',properties:'Боеприпас 25/100, перезарядка'},
      {name:'Net / Сеть',type:'ranged',damage:'—',stat:'dex',cost:'1 зм',weight:'3 фнт.',properties:'Метательное 5/15, особое'},
      {name:'Dagger / Кинжал',type:'melee',damage:'1к4',stat:'dex',properties:'Finesse, light, thrown 20/60'},
      {name:'Quarterstaff / Боевой посох',type:'melee',damage:'1к6',stat:'str',properties:'Versatile'},
      {name:'Spear, Aiel / Айильское копьё',type:'melee',damage:'1к6',stat:'dex',properties:'Finesse, thrown 30/120, versatile 1к8'},
      {name:'Spear, Seanchan / Шончанское копьё',type:'melee',damage:'1к8',stat:'str',properties:'Thrown 30/120, versatile 1к8'},
      {name:'Battleaxe / Боевой топор',type:'melee',damage:'1к8',stat:'str',properties:'Versatile 1к10'},
      {name:'Axe, hafted / Секира',type:'melee',damage:'1к12',stat:'str',properties:'Heavy, two-handed'},
      {name:'Longsword / Длинный меч',type:'melee',damage:'1к8',stat:'str',properties:'Versatile 1к10'},
      {name:'Rapier / Рапира',type:'melee',damage:'1к8',stat:'dex',properties:'Finesse'},
      {name:'Shortsword / Короткий меч',type:'melee',damage:'1к6',stat:'dex',properties:'Finesse, light'},
      {name:'Scimitar, Seanchan / Шончанская сабля',type:'melee',damage:'1к6',stat:'dex',properties:'Finesse, light'},
      {name:'Sword, Blademaster’s / Меч мастера клинка',type:'melee',damage:'1к8',stat:'dex',properties:'Finesse, special, versatile'},
      {name:'Sword, Warder’s / Меч Стража',type:'melee',damage:'1к10',stat:'str',properties:'Heavy, special, versatile 2к6'},
      {name:'Longbow / Длинный лук',type:'ranged',damage:'1к8',stat:'dex',properties:'Ammunition 150/600, heavy, two-handed'},
      {name:'Longbow, Two-Rivers / Двуреченский длинный лук',type:'ranged',damage:'1к8',stat:'dex',properties:'Ammunition 200/800, heavy, special, two-handed'},
      {name:'Shortbow / Короткий лук',type:'ranged',damage:'1к6',stat:'dex',properties:'Ammunition 80/320, two-handed'},
      {name:'Crossbow, light / Лёгкий арбалет',type:'ranged',damage:'1к8',stat:'dex',properties:'Ammunition 80/320, loading, two-handed'},
      {name:'Crossbow, heavy / Тяжёлый арбалет',type:'ranged',damage:'1к10',stat:'dex',properties:'Ammunition 100/400, heavy, loading, two-handed'}
    ],
    armor: [
      {name:'Без доспеха',category:'none',base:10,dexMax:null,stealth:false,strReq:0,weight:'—'},
      {name:'Стеганый',category:'light',base:11,dexMax:null,stealth:true,strReq:0,weight:'10 lb.'},
      {name:'Кожаный',category:'light',base:11,dexMax:null,stealth:false,strReq:0,weight:'15 lb.'},
      {name:'Проклёпанная кожа',category:'light',base:12,dexMax:null,stealth:false,strReq:0,weight:'20 lb.'},
      {name:'Кольчуга (рубаха)',category:'light',base:14,dexMax:null,stealth:false,strReq:0,weight:'25 lb.'},
      {name:'Шкура',category:'medium',base:13,dexMax:2,stealth:false,strReq:0,weight:'25 lb.'},
      {name:'Бригантина (рубаха)',category:'medium',base:14,dexMax:2,stealth:false,strReq:0,weight:'30 lb.'},
      {name:'Полная кольчуга',category:'medium',base:15,dexMax:2,stealth:true,strReq:0,weight:'40 lb.'},
      {name:'Кираса',category:'medium',base:15,dexMax:2,stealth:false,strReq:0,weight:'30 lb.'},
      {name:'Лакированные латы',category:'medium',base:15,dexMax:2,stealth:true,strReq:0,weight:'35 lb.'},
      {name:'Полная бригантина',category:'heavy',base:16,dexMax:0,stealth:true,strReq:15,weight:'45 lb.'},
      {name:'Пластинчатый',category:'heavy',base:16,dexMax:1,stealth:true,strReq:13,weight:'35 lb.'},
      {name:'Латно-кольчужный',category:'heavy',base:17,dexMax:0,stealth:true,strReq:15,weight:'50 lb.'},
      {name:'Полные латы',category:'heavy',base:18,dexMax:0,stealth:true,strReq:17,weight:'50 lb.'},
      {name:'Чёрные латы Мурдраала',category:'heavy',base:18,dexMax:4,stealth:true,strReq:17,weight:'75 lb.'}
    ],
    shields: [
      {name:'Нет',ac:0}, {name:'Баклер, Айил',ac:1}, {name:'Щит',ac:2}
    ]
  },
  featEffects: {
    'Артистичный':{stat:{cha:1}}, 'Атлетичный':{statChoice:['str','dex']}, 'Внимательный':{statChoice:['int','wis'], passivePerception:5},
    'Драчун':{statChoice:['str','con']}, 'Знаток лёгких доспехов':{statChoice:['str','dex']}, 'Знаток средних доспехов':{statChoice:['str','dex']},
    'Знаток тяжёлых доспехов':{stat:{str:1}}, 'Мастер оружия':{statChoice:['str','dex']}, 'Стойкий':{stat:{con:1}},
    'Устойчивый':{statChoice:['str','dex','con','int','wis','cha']}, 'Отличная память':{stat:{int:1}}, 'Языковед':{stat:{int:1}},
    'Сдержанность':{statChoice:['int','wis'], tempHp:'level'}, 'Великая стойкость':{stat:{con:1}}, 'Боевой направляющий':{stat:{int:1}, concentrationAdv:true},
    'Пламя и пустота':{attackWis:true, wisdomSaveAdv:true}, 'Меткий стрелок':{rangedPower:true}, 'Мастер большого оружия':{heavyPower:true},
    'Меткие заклинания':{spellRange2:true}, 'Убийца направляющих':{mageSlayer:true}
  },
  hierarchies: {
    none:null,
    unity:{name:'Иерархия Единства',type:'unity',color:'#b07ae8',priority:['wis','int'],ranks:{
      I:{statPenalty:2,speed:0,initiative:-1,saves:-1,items:[['Переходный ранг','−1 к двум атрибутам; −1 к инициативе и спасброскам.']]},
      II:{stats:{wis:2,int:2},hp:10,speed:10,initiative:2,saves:1,dc:1,weavePower:2,extraSlots:2,items:[['Энергетическая связь','Ощущает союзников Единства; союзники рядом получают поддержку по правилам сцены.']]},
      III:{stats:{wis:2,int:2},hitDiceMult:2,speed:15,initiative:5,saves:2,dc:2,weavePower:5,extraSlots:3,items:[['Предвидение тактики','1/раунд лидер или видимый союзник в 60 фт перебрасывает d20 и использует новый результат.'],['Единство Плетений','1/долгий отдых: одно плетение считается сотканным ячейкой на 1 уровень выше.']]},
      IV:{stats:{wis:2,int:2},hp:20,speed:20,initiativeAdv:true,saves:3,dc:3,weavePower:12,extraSlots:4,items:[['Щит сплочённости','Аура 30 фт: союзники получают +2 к спасброскам и сопротивление урону от заклинаний/плетений.'],['Легендарная решимость','1/долгий отдых: проваленный спасбросок считается успешным.']]},
      V:{stats:{wis:2,int:2},speed:30,initiative:10,initiativeAdv:true,saves:5,dc:4,weavePower:24,extraSlots:5,cap:24,items:[['Господство Единой Силы','1/короткий отдых: восстановить ячейки плетений или соткать дополнительное плетение без нарушения концентрации.'],['Единый фронт','Аура 60 фт: союзники иммунны к frightened и получают временные хиты каждый ход.']]}
    }},
    throne:{name:'Хрустальный Трон',type:'shonchan',color:'#e87a7a',priority:['str','cha'],ranks:{
      I:{statPenalty:2,speed:0,initiative:-1,saves:-1,items:[['Низшая ступень Трона','−1 к двум атрибутам; −1 к инициативе и спасброскам.']]},
      II:{stats:{str:2,cha:2},hp:10,speed:10,initiative:2,saves:1,dc:1,weavePower:2,extraSlots:2,items:[['Аура Имперской Власти','Преимущество на Запугивание; 1/день приказ как Command по усмотрению ГМ.']]},
      III:{stats:{str:2,cha:2},hitDiceMult:1.5,speed:15,initiative:5,saves:2,saveAdv:'Телосложение',dc:2,weavePower:5,extraSlots:3,items:[['Холодная решимость','Преимущество на спасброски Телосложения; имперское давление на подчинённых.']]},
      IV:{stats:{str:2,cha:2},hp:20,speed:20,initiativeAdv:true,saves:3,dc:3,weavePower:12,extraSlots:4,items:[['Воля Наместника','Подавляющее присутствие; расширенные права приказа и наказания.']]},
      V:{stats:{str:2,cha:2},speed:30,initiative:10,initiativeAdv:true,saves:5,dc:4,weavePower:24,extraSlots:5,cap:24,items:[['Вершина пирамиды','Абсолютная концентрация воли Трона; иммунитет к страху и очарованию по решению ГМ.']]}
    }},
    guild:{name:'Гильдия Хранителей Фар Мэддинга',type:'guild',color:'#7ae8d4',priority:['int','dex'],ranks:{
      I:{statPenalty:2,speed:0,initiative:-1,saves:-1,items:[['Гражданин / Страж','−1 к двум атрибутам; −1 к инициативе и спасброскам.']]},
      II:{stats:{int:2,dex:0},hp:10,speed:10,initiative:2,saves:1,regen:5,items:[['Регенерация','Восстанавливает 5 ОЗ/раунд, если не получил подавляющий урон по решению ГМ.']]},
      III:{stats:{int:2,dex:2},hitDiceMult:1.5,speed:15,initiative:5,saves:2,saveAdv:'МДР/ИНТ против магии',items:[['Тактическое превосходство','Особая реакция 1/раунд: вмешаться в действие врага и дать союзнику атаку/перемещение/подготовленное действие.'],['Защита Хранителя','Постоянный эффект: +2 к КД и сопротивление магическому урону от плетений.']]},
      IV:{stats:{int:2,dex:2},hp:20,ac:2,speed:20,initiativeAdv:true,saves:3,items:[['Энергетический щит','Усиленное защитное поле кристаллов.'],['Адаптация к аномалиям','Преимущество против части эффектов аномалий по решению ГМ.']]},
      V:{stats:{int:2,dex:2},hitDiceMult:3,speed:30,initiative:10,initiativeAdv:true,saves:5,cap:24,items:[['Владыка Хранителя','В пределах города почти слит с полем Стража; вне города распространяет эффект на 60 фт.'],['Мастер хитрости','1/раунд особая реакция на действие, атаку или движение видимого врага.']]}
    }},
    order:{name:'Орден Стражей Узора',type:'unity',color:'#e8c97a',priority:['wis','con'],ranks:{
      II:{stats:{wis:2,con:2},hp:10,speed:10,initiative:2,saves:1,items:[['Стабилизация Узора','Преимущество/бонусы при работе с аномалиями и разрывами Узора.']]},
      III:{stats:{wis:2,con:2},hitDiceMult:1.5,speed:15,initiative:5,saves:2,items:[['Стражевой протокол','Защитные реакции против аномальных эффектов.']]},
      IV:{stats:{wis:2,con:2},hp:20,speed:20,initiativeAdv:true,saves:3,items:[['Опора Узора','Сильная защита союзников рядом с орденцем.']]},
      V:{stats:{wis:2,con:2},speed:30,initiative:10,initiativeAdv:true,saves:5,cap:24,items:[['Якорь Узора','Легендарная стабилизация реальности вокруг себя.']]}
    }},
    wall:{name:'Иерархия Стены',type:'guild',color:'#7aa8e8',priority:['con','wis'],ranks:{
      II:{stats:{con:2,wis:2},hp:10,speed:10,initiative:2,saves:1,items:[['Адаптация к Стене','Сопротивление отдельным эффектам Ореола/Гребня по решению ГМ.']]},
      III:{stats:{con:2,wis:2},hitDiceMult:1.5,speed:15,initiative:5,saves:2,items:[['Выживание у Шва','Особые инстинкты против существ и феноменов Стены.']]},
      IV:{stats:{con:2,wis:2},hp:20,speed:20,initiativeAdv:true,saves:3,items:[['Резонанс Стены','Расширенное взаимодействие с аномальными зонами.']]},
      V:{stats:{con:2,wis:2},speed:30,initiative:10,initiativeAdv:true,saves:5,cap:24,items:[['Сопряжение со Стеной','Легендарное слияние с паттернами аномальной Стены.']]}
    }}
  }
};
})();
