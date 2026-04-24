(function () {
  const PASSWORD = "WOT-ANOMALY-773";
  const STORAGE_KEY = "wot_access";

  if (localStorage.getItem(STORAGE_KEY) === PASSWORD) return;

  document.documentElement.classList.add("auth-lock");
  document.addEventListener("DOMContentLoaded", function () {
    const overlay = document.createElement("div");
    overlay.className = "auth-overlay";
    overlay.innerHTML = `
      <div class="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <div class="auth-sigil" aria-hidden="true">
          <span></span>
        </div>
        <p class="auth-kicker">Доступ мастера</p>
        <h1 id="auth-title">Закрытый раздел</h1>
        <p class="auth-text">Эта страница содержит материалы для ведущего: монстров, волны временных аномалий и генераторы встреч.</p>
        <form class="auth-form">
          <label for="auth-password">Пароль доступа</label>
          <input id="auth-password" type="password" autocomplete="current-password" placeholder="Введите пароль" autofocus />
          <p class="auth-error" aria-live="polite"></p>
          <button type="submit">Войти</button>
        </form>
      </div>
    `;
    document.body.appendChild(overlay);

    const form = overlay.querySelector(".auth-form");
    const input = overlay.querySelector("#auth-password");
    const error = overlay.querySelector(".auth-error");

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (input.value === PASSWORD) {
        localStorage.setItem(STORAGE_KEY, PASSWORD);
        document.documentElement.classList.remove("auth-lock");
        overlay.remove();
      } else {
        error.textContent = "Неверный пароль. Возврат на главную страницу.";
        input.classList.add("auth-input-error");
        setTimeout(function () {
          window.location.href = "index.html";
        }, 900);
      }
    });
  });
})();