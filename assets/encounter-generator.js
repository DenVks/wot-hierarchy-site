(function(){
'use strict';
const ratingData={
 1:{name:'Опасная трещина',dc:11,core:'2d6',cr:'4–6',count:'1 существо',freq:'каждые 1d4 раунда',note:'Лёгкое искажение, малый всплеск в ореоле.'},
 2:{name:'Живой разлом',dc:12,core:'3d6',cr:'5–7',count:'1–2 существа',freq:'каждые 1d3 раунда',note:'Краткая петля 1/мин: сдвиг 10 фт или трудная местность.'},
 3:{name:'Пульс Узора',dc:13,core:'4d6',cr:'6–8',count:'2 существа',freq:'каждые 2 раунда',note:'Перестройка 1 элемента рельефа каждые 1d4 раунда.'},
 4:{name:'Разрыв правил',dc:14,core:'5d6',cr:'7–9',count:'2 существа',freq:'каждые 2 раунда',note:'Локальные законы сбоят: вода вверх, звук глохнет, огонь без топлива.'},
 5:{name:'Живая рана',dc:15,core:'6d6',cr:'8–10',count:'3 существа',freq:'каждые 2 раунда',note:'Волна раз в 3 раунда: сдвиг 10–20 фт или падение.'},
 6:{name:'Провал пространства',dc:16,core:'7d6',cr:'9–11',count:'3 существа',freq:'каждые 2 раунда',note:'Средняя угроза высокой плотности; активно ломает позиции.'},
 7:{name:'Разлом с памятью',dc:17,core:'8d6',cr:'10–12',count:'4 существа',freq:'каждые 2 раунда',note:'Когнитивная волна раз в 2 раунда: ужас/очарование/потеря реакции.'},
 8:{name:'Сердце искажения',dc:18,core:'10d6',cr:'12–14',count:'2–3 существа',freq:'каждый раунд или через раунд',note:'Граница между сценой и катастрофой. Используй элитных существ.'},
 9:{name:'Пасть Узора',dc:19,core:'12d6',cr:'14–16',count:'3 существа',freq:'каждый раунд',note:'Ореол сам становится постоянной опасностью: СЛ 19 или малая смерть.'},
10:{name:'Пролом Узора',dc:20,core:'16d6',cr:'16–18+',count:'1–2 существа + якорь',freq:'каждый раунд; якорь раз в 3 раунда',note:'Экзистенциальная угроза. Возможны уникальные существа выше диапазона.'}
};
const packs={
 '1-A':['Озонный Скользун · CR4','Грави-Осколок · CR5','Плазменный Псаломщик · CR6','Рой Стеклопыли · CR4','Осколочный Страж · CR5','Призматический Надсмотрщик · CR6'],
 '1-B':['Слизневой Скакун · CR4','Щелевой Костегрыз · CR5','Матка-Имитатор · CR6'],
 '1-C':['Кошмарный Плескатель · CR4','Эхо-Двойник · CR5','Смотритель Осознанного Сна · CR6','Теневой Дубликатор · CR4','Похититель Фокуса · CR5','Режиссёр Сна · CR6'],
 '2-A':['Озонный Скользун-Разрядник · CR5','Дуговой Центурион · CR6','Плазменный Инспектор Разлома · CR7','Стеклопыльный Рой-Резак · CR5','Осколочный Центурион · CR6','Призматический Инспектор Разлома · CR7'],
 '2-B':['Слизневый Ловец · CR5','Узел Слизи · CR6','Матка Разлома · CR7','Споровый Гонщик · CR5','Душитель Кадра · CR6','Матка Спор · CR7'],
 '2-C':['Сновидный Дезориентатор · CR5','Кошмарный Сшиватель Пространства · CR6','Инспектор Сна: Зеркало Ошибок · CR7'],
 '3-A':['Стеклоспиральный Скитер · CR6','Страж Решётки · CR7','Динамо Нулевой Фазы · CR8'],
 '3-B':['Клейкий Сцепщик · CR6','Узел Гнезда · CR7','Матка Перестройки · CR8'],
 '3-C':['Саранча Черновика · CR6','Коронованный Олен-Кадрорез · CR7','Зеркальный Левиафан · CR8'],
 '4-A':['Светорез Разрыва · CR7','Призматический Осциллятор · CR8','Арбитр Невозможного Света · CR9'],
 '4-B':['Туманная Пиявка Разрыва · CR7','Узел Паразитического Тумана · CR8','Альфа Спорового Разрыва · CR9','Носитель Чужой Лихорадки · CR7','Коконный Геометр · CR8','Матка Чужого Такта · CR9'],
 '4-C':['Ленточный Барс Срыва · CR7','Медведь Сонного Якоря · CR8','Судья Разорванного Лика · CR9','Собиратель Сорванного Образа · CR7','Глухой Якорь Сна · CR8','Прокурор Неверной Победы · CR9'],
 '5-C':['Зеркальный Фасад Разлома · CR8','Инейный Резчик Волны · CR9','Магистр Холодной Геометрии · CR10'],
 '7-C':['Псовидный Ловчий Разлома · CR10','Искажённый Пастырь · CR12','Носитель Памяти Разлома · CR13']
};
const typeLabels={A:'Энергия',B:'Иные измерения',C:'Тел’аран’риод'};
function $(id){return document.getElementById(id)}
function rollDie(n){return 1+Math.floor(Math.random()*n)}
function pick(arr){return arr[Math.floor(Math.random()*arr.length)]}
function packFor(r,t){return packs[`${r}-${t}`]||[]}
function fallbackMonsters(r,t){const d=ratingData[r]; const [min,max]=d.cr.replace('+','').split('–').map(x=>parseInt(x)); const roles=t==='A'?['резонатор','осциллятор','разрядник']:t==='B'?['ловец','узел','матка']:['двойник','смотритель','исказитель']; return [0,1,2].map(i=>`${typeLabels[t]}: ${roles[i]} · CR ${Math.min((min||4)+i,max||18)}`)}
function renderRating(){const r=+$('rating').value; const d=ratingData[r]; const list=[`<strong>R${r} — ${d.name}</strong>`, `СЛ аномалии: ${d.dc}`, `Ядро: ${d.core} урона/раунд при провале`, `Волна: ${d.count}, ${d.freq}`, `Диапазон CR: ${d.cr}`, d.note]; $('ratingSummary').innerHTML=list.map(x=>`<div>${x}</div>`).join('');}
function generate(){const r=+$('rating').value, t=$('atype').value, intensity=$('intensity').value; const d=ratingData[r]; let pool=packFor(r,t); if(!pool.length) pool=fallbackMonsters(r,t); let count=1; if(d.count.includes('1–2')) count=rollDie(2); else if(d.count.includes('2–3')) count=1+rollDie(2); else if(d.count.includes('3')) count=3; else if(d.count.includes('4')) count=4; if(intensity==='soft') count=Math.max(1,count-1); if(intensity==='hard') count=count+1; let mons=[]; for(let i=0;i<count;i++) mons.push(pick(pool)); const pulse = r<=1 ? `1d${rollDie(4)} раунда до всплеска` : r===2 ? `1d${rollDie(3)} раунда до малого контроля` : r<=4 ? `эхо/перестройка в ближайшие ${rollDie(3)} раунда` : `давление среды активно уже сейчас`;
 $('encounterResult').innerHTML=`<div class="generated-card"><h3>R${r} · ${d.name} · ${typeLabels[t]}</h3><p>${d.note}</p><div class="result-grid"><div><b>СЛ</b><span>${d.dc}</span></div><div><b>Ядро</b><span>${d.core}</span></div><div><b>CR</b><span>${d.cr}</span></div><div><b>Темп</b><span>${d.freq}</span></div></div><h4>Волна существ</h4><ul>${mons.map(m=>`<li>${m}</li>`).join('')}</ul><h4>Скрипт сцены</h4><ol><li>В начале сцены обозначь ядро и ореол.</li><li>На ходу аномалии: ${pulse}.</li><li>Каждая тварь получает тег <b>Аномальное происхождение</b>.</li><li>Эскалация: при затяжном бою добавь элитного монстра из верхней части CR-диапазона.</li></ol></div>`;
}
function init(){for(let i=1;i<=10;i++){const o=document.createElement('option');o.value=i;o.textContent=`R${i} — ${ratingData[i].name}`;$('rating').appendChild(o)}$('rating').addEventListener('change',renderRating);$('atype').addEventListener('change',renderRating);$('generateEncounter').addEventListener('click',generate);renderRating();generate();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
