(function () {
  const PASSWORD = "WOT-ANOMALY-773";
  const STORAGE_KEY = "wot_access";

  if (localStorage.getItem(STORAGE_KEY) === PASSWORD) return;

  const input = prompt("Введите пароль для доступа:");

  if (input === PASSWORD) {
    localStorage.setItem(STORAGE_KEY, PASSWORD);
  } else {
    alert("Неверный пароль");
    window.location.href = "index.html";
  }
})();