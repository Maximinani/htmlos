/* ══════════════════════════════════════════════════════════════════════
   HTML OS — приложение «О системе»
   ══════════════════════════════════════════════════════════════════════ */
(() => {
  function browserName() {
    const ua = navigator.userAgent;
    if (ua.includes("Edg/")) return "Microsoft Edge";
    if (ua.includes("OPR/")) return "Opera";
    if (ua.includes("Chrome/")) return "Google Chrome";
    if (ua.includes("Firefox/")) return "Mozilla Firefox";
    if (ua.includes("Safari/")) return "Safari";
    return "Браузер";
  }

  function uptime() {
    const start = OS.startedAt || Date.now();
    const sec = Math.max(1, Math.floor((Date.now() - start) / 1000));
    if (sec < 60) return `${sec} с`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} мин`;
    return `${Math.floor(min / 60)} ч ${min % 60} мин`;
  }

  OS.registerApp({
    id: "about",
    name: "О системе",
    icon: "💠",
    color: ["#60a5fa", "#7c3aed"],
    width: 700,
    height: 590,
    minWidth: 480,
    minHeight: 400,
    mount(body, win) {
      const stats = OS.fs.stats();

      body.innerHTML = `
        <div class="app about">
          <div class="about-page">
            <div class="about-head">
              <img src="assets/logo.svg" alt="HTML OS" width="72" height="72">
              <div class="about-head-text">
                <h1>HTML OS</h1>
                <p>Версия 1.0 «Aurora» · browser edition</p>
              </div>
              <span class="about-badge">stable</span>
            </div>

            <p class="about-text">
              Операционная система, которая живёт в одном окне браузера: оконный менеджер,
              виртуальная файловая система, настройки, обои и ${OS.wm.all().length} приложений.
              Без сборки, сервера и единой зависимости — только HTML, CSS и JavaScript.
            </p>

            <div class="about-stats">
              <div class="about-stat"><b>${OS.wm.all().length}</b><span>приложений</span></div>
              <div class="about-stat"><b>${OS.wallpapers.length}</b><span>обоев</span></div>
              <div class="about-stat"><b>${stats.files}</b><span>файлов</span></div>
              <div class="about-stat"><b>${uptime()}</b><span>с загрузки</span></div>
            </div>

            <div class="about-specs">
              <div class="about-spec"><span>Ядро</span><b>JavaScript · vanilla</b></div>
              <div class="about-spec"><span>Интерфейс</span><b>HTML5 + CSS3</b></div>
              <div class="about-spec"><span>Хранилище</span><b>localStorage</b></div>
              <div class="about-spec"><span>Браузер</span><b>${browserName()}</b></div>
              <div class="about-spec"><span>Разрешение</span><b>${window.innerWidth}×${window.innerHeight}</b></div>
              <div class="about-spec"><span>Лицензия</span><b>MIT</b></div>
            </div>

            <div class="about-actions">
              <button class="btn" data-act="settings">${OS.util.icon("settings")} Настройки</button>
              <button class="btn" data-act="files">${OS.util.icon("folder")} Файлы</button>
              <button class="btn" data-act="terminal">${OS.util.icon("terminal")} Терминал</button>
              <button class="btn primary" data-act="updates">${OS.util.icon("download")} Обновления</button>
            </div>

            <p class="about-credits">
              Сделано на <b>HTML</b>, <b>CSS</b> и <b>JavaScript</b>.<br>
              Все данные остаются в вашем браузере. HTML OS не является настоящей операционной системой.
            </p>
          </div>
        </div>`;

      body.querySelector('[data-act="settings"]').addEventListener("click", () => OS.wm.open("settings"));
      body.querySelector('[data-act="files"]').addEventListener("click", () => OS.wm.open("files"));
      body.querySelector('[data-act="terminal"]').addEventListener("click", () => OS.wm.open("terminal"));
      body.querySelector('[data-act="updates"]').addEventListener("click", () => {
        OS.ui.notify({ title: "Обновления", text: "Установлена последняя версия HTML OS 1.0 «Aurora».", icon: "✅", timeout: 5000 });
        OS.sound.play("notify");
      });

      win.setTitle("О системе");
      win.setSubtitle("HTML OS 1.0");
    },
  });
})();
