(function () {
  'use strict';

  const data = (window.WOT_RULES_V14 || {}).alchemy || {};
  const feat = data.feat || {};

  document.getElementById('alchemy-feat-content').innerHTML =
    '<div class="panel-kicker">Редкая черта</div><h2>' +
    String(feat.name || 'Алхимик') +
    '</h2>' +
    (feat.html || '');
  document.getElementById('alchemy-tools-content').innerHTML =
    '<div class="panel-kicker">Снаряжение и владение</div>' +
    (data.toolsHtml || '<p>Раздел не загружен.</p>');
  document.getElementById('alchemy-rules-content').innerHTML =
    '<div class="panel-kicker">Игровая процедура</div>' +
    (data.rulesHtml || '<p>Раздел не загружен.</p>');
})();
