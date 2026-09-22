(function () {
  'use strict';

  const db = window.WOT_RULES_V14 || { chapters: {} };
  const chapters = db.chapters || {};
  const nav = document.getElementById('rules-chapter-nav');
  const content = document.getElementById('rules-content');
  const search = document.getElementById('rules-search');
  const order = Object.keys(chapters);
  const esc = (value) =>
    String(value ?? '').replace(
      /[&<>"']/g,
      (character) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[character],
    );

  let active = (location.hash || '').replace('#', '');
  if (!chapters[active]) active = order[0];

  function renderNav() {
    nav.innerHTML = order
      .map((key, index) => {
        const isActive = key === active;
        return (
          '<button type="button" data-chapter="' +
          key +
          '" class="' +
          (isActive ? 'active' : '') +
          '" aria-pressed="' +
          String(isActive) +
          '"><span class="rules-nav-index">' +
          String(index + 1).padStart(2, '0') +
          '</span><span>' +
          esc(chapters[key].title) +
          '</span></button>'
        );
      })
      .join('');

    nav.querySelectorAll('button').forEach((button) =>
      button.addEventListener('click', () => {
        active = button.dataset.chapter;
        history.replaceState(null, '', '#' + active);
        search.value = '';
        render();
      }),
    );
  }

  function render() {
    renderNav();
    content.innerHTML = chapters[active].html;
    content.dataset.chapter = active;
  }

  search.addEventListener('input', () => {
    const query = search.value.trim().toLocaleLowerCase('ru');
    content.querySelectorAll('p,li,tr,h2,h3,h4,h5,h6').forEach((element) => {
      element.hidden = !!query && !element.textContent.toLocaleLowerCase('ru').includes(query);
    });
  });

  render();
})();
