/* ══════════════════════════════════════════════════════════════════════
   HTML OS — приложение «Настройки»
   ══════════════════════════════════════════════════════════════════════ */
(() => {
  const { escapeHtml, icon } = OS.util;

  const TABS = {
    personal: "Персонализация",
    system: "Система",
    sound: "Звук",
    about: "О системе",
  };

  OS.registerApp({
    id: "settings",
    name: "Настройки",
    icon: "⚙️",
    color: ["#64748b", "#334155"],
    width: 940,
    height: 650,
    minWidth: 600,
    minHeight: 430,
    mount(body, win, args) {
      let activeTab = args?.tab && TABS[args.tab] ? args.tab : "personal";

      body.innerHTML = `
        <div class="app settings-app">
          <aside class="set-side">
            <div class="set-side-head">Параметры</div>
            ${Object.entries(TABS).map(([id, name]) => `
              <button class="set-tab" data-tab="${id}">
                ${icon(id === "personal" ? "monitor" : id === "system" ? "settings" : id === "sound" ? "volume" : "info")}
                <span>${name}</span>
              </button>`).join("")}
            <div class="set-side-foot">HTML OS 1.0 «Aurora»<br>Локальные настройки браузера</div>
          </aside>
          <div class="set-main">
            <section class="set-page" data-page="personal">
              <h1 class="set-h1">Персонализация</h1>
              <p class="set-sub">Обои, акцентный цвет, тема и эффекты рабочего стола.</p>

              <div class="set-hero" id="set-hero">
                <div class="set-hero-badge">HTML OS 1.0</div>
                <div class="set-hero-text"><b id="set-hero-name">Аврора</b><span>Текущие обои</span></div>
              </div>

              <div class="set-section">
                <div class="set-section-head"><h3>Профиль</h3><span>сохраняется локально</span></div>
                <div class="set-card">
                  <div class="set-row">
                    <div class="set-row-info">
                      <div class="set-row-title">Имя пользователя</div>
                      <div class="set-row-desc">Показывается на экране входа, в меню «Пуск» и в терминале.</div>
                    </div>
                    <div class="row">
                      <input class="field set-username" maxlength="24" placeholder="Гость" style="width:180px">
                      <span class="avatar set-avatar">Г</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="set-section">
                <div class="set-section-head"><h3>Обои</h3><span>${OS.wallpapers.length} вариантов</span></div>
                <div class="wall-grid" id="set-walls"></div>
              </div>

              <div class="set-section">
                <div class="set-section-head"><h3>Цвет акцента</h3><span>кнопки, ссылки, подсветка</span></div>
                <div class="set-card">
                  <div class="accent-grid" id="set-accents"></div>
                </div>
              </div>

              <div class="set-section">
                <div class="set-section-head"><h3>Тема</h3><span>оформление окон</span></div>
                <div class="theme-grid">
                  <button class="theme-card" data-theme="dark">
                    <div class="theme-preview dark"></div>
                    <div class="theme-name">${icon("moon")} Тёмная</div>
                  </button>
                  <button class="theme-card" data-theme="light">
                    <div class="theme-preview light"></div>
                    <div class="theme-name">${icon("sun")} Светлая</div>
                  </button>
                </div>
              </div>

              <div class="set-section">
                <div class="set-section-head"><h3>Эффекты</h3><span>производительность</span></div>
                <div class="set-card">
                  <div class="set-row">
                    <div class="set-row-info">
                      <div class="set-row-title">Прозрачность и размытие</div>
                      <div class="set-row-desc">Стеклянные панели окон, меню и панели задач.</div>
                    </div>
                    <label class="switch"><input type="checkbox" data-toggle="transparency"><span class="track"></span></label>
                  </div>
                  <div class="set-row">
                    <div class="set-row-info">
                      <div class="set-row-title">Анимации интерфейса</div>
                      <div class="set-row-desc">Открытие окон, переходы и эффекты наведения.</div>
                    </div>
                    <label class="switch"><input type="checkbox" data-toggle="animations"><span class="track"></span></label>
                  </div>
                </div>
              </div>
            </section>

            <section class="set-page" data-page="system">
              <h1 class="set-h1">Система</h1>
              <p class="set-sub">Сведения о среде выполнения и обслуживание HTML OS.</p>

              <div class="set-section">
                <div class="set-section-head"><h3>Язык интерфейса</h3><span>English · Русский</span></div>
                <div class="set-card">
                  <div class="set-row">
                    <div class="set-row-info">
                      <div class="set-row-title">Язык</div>
                      <div class="set-row-desc">Выберите язык HTML OS. Интерфейс перезагрузится.</div>
                    </div>
                    <select class="select set-language" style="width:150px">
                      <option value="en">English</option>
                      <option value="ru" data-i18n="off">Русский</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="set-section">
                <div class="set-section-head"><h3>Сведения</h3><span>только чтение</span></div>
                <div class="info-grid">
                  <div class="info-cell"><span>Версия HTML OS</span><b>1.0 «Aurora»</b></div>
                  <div class="info-cell"><span>Ядро</span><b>JavaScript · vanilla</b></div>
                  <div class="info-cell"><span>Браузер</span><b class="sys-browser">—</b></div>
                  <div class="info-cell"><span>Платформа</span><b class="sys-platform">—</b></div>
                  <div class="info-cell"><span>Экран</span><b class="sys-screen">—</b></div>
                  <div class="info-cell"><span>Язык</span><b class="sys-lang">—</b></div>
                  <div class="info-cell"><span>Приложений</span><b class="sys-apps">—</b></div>
                  <div class="info-cell"><span>Разрешение окна</span><b class="sys-outer">—</b></div>
                </div>
              </div>

              <div class="set-section">
                <div class="set-section-head"><h3>Хранилище</h3><span class="sys-storage-label">—</span></div>
                <div class="set-card">
                  <div class="set-row">
                    <div class="set-row-info">
                      <div class="set-row-title">Локальные данные браузера</div>
                      <div class="set-row-desc">Настройки, файлы и заметки хранятся в localStorage. Данные не покидают устройство.</div>
                      <div class="meter" style="margin-top:9px"><i class="sys-storage-bar" style="width:1%"></i></div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="set-section">
                <div class="set-section-head"><h3>Обслуживание</h3><span>осторожно</span></div>
                <div class="set-card">
                  <div class="set-row">
                    <div class="set-row-info">
                      <div class="set-row-title">Сбросить файловую систему</div>
                      <div class="set-row-desc">Удалить все созданные файлы и вернуть стандартные папки.</div>
                    </div>
                    <button class="btn sm" data-act="reset-fs">${icon("refresh")} Сбросить</button>
                  </div>
                  <div class="set-row">
                    <div class="set-row-info">
                      <div class="set-row-title">Сбросить настройки оформления</div>
                      <div class="set-row-desc">Вернуть тёмную тему, обои «Аврора» и синий акцент.</div>
                    </div>
                    <button class="btn sm" data-act="reset-settings">${icon("refresh")} Сбросить</button>
                  </div>
                  <div class="set-row">
                    <div class="set-row-info">
                      <div class="set-row-title">Перезагрузка</div>
                      <div class="set-row-desc">Запустить HTML OS заново, сохранив все данные.</div>
                    </div>
                    <button class="btn sm" data-act="restart">${icon("restart")} Перезагрузить</button>
                  </div>
                </div>
              </div>
            </section>

            <section class="set-page" data-page="sound">
              <h1 class="set-h1">Звук</h1>
              <p class="set-sub">Системные звуки синтезируются в браузере — аудиофайлов нет.</p>

              <div class="set-section">
                <div class="set-section-head"><h3>Громкость</h3><span class="sound-value">60%</span></div>
                <div class="set-card">
                  <div class="set-row">
                    <div class="set-row-info">
                      <div class="set-row-title">Общая громкость</div>
                      <div class="set-row-desc">Влияет на звуки интерфейса и плеер.</div>
                    </div>
                    <div class="row" style="width:220px">
                      ${icon("volume")}
                      <input class="range sound-range" type="range" min="0" max="100" step="1">
                    </div>
                  </div>
                  <div class="set-row">
                    <div class="set-row-info">
                      <div class="set-row-title">Звуки интерфейса</div>
                      <div class="set-row-desc">Клики, открытие окон и уведомления.</div>
                    </div>
                    <label class="switch"><input type="checkbox" data-toggle="sounds"><span class="track"></span></label>
                  </div>
                  <div class="set-row">
                    <div class="set-row-info">
                      <div class="set-row-title">Проверка</div>
                      <div class="set-row-desc">Проиграть короткий сигнал уведомления.</div>
                    </div>
                    <button class="btn sm" data-act="test-sound">${icon("play")} Проверить</button>
                  </div>
                </div>
              </div>

              <div class="set-note">${icon("info")}<span>Если звук не слышен, проверьте громкость вкладки и разрешение на воспроизведение аудио в браузере. Первый звук может воспроизвестись после клика.</span></div>
            </section>

            <section class="set-page" data-page="about">
              <div class="about-hero">
                <img src="assets/logo.svg" alt="HTML OS">
                <div>
                  <h2>HTML OS</h2>
                  <p>Версия 1.0 «Aurora» · browser edition</p>
                </div>
              </div>
              <p class="set-sub" style="margin-bottom:16px">Операционная система, которая живёт в одном окне браузера: оконный менеджер, файловая система, настройки, обои и ${OS.wm.all().length} приложений — без единой зависимости.</p>

              <div class="set-section">
                <div class="set-section-head"><h3>Технологии</h3><span>без фреймворков</span></div>
                <div class="chips">
                  <span class="chip">HTML5</span><span class="chip">CSS3</span><span class="chip">JavaScript</span>
                  <span class="chip">localStorage</span><span class="chip">Web Audio API</span><span class="chip">Canvas</span>
                  <span class="chip">CSS backdrop-filter</span>
                </div>
              </div>

              <div class="set-section">
                <div class="set-section-head"><h3>Сборка</h3><span>2026</span></div>
                <div class="info-grid">
                  <div class="info-cell"><span>Приложений</span><b>${OS.wm.all().length}</b></div>
                  <div class="info-cell"><span>Обоев</span><b>${OS.wallpapers.length}</b></div>
                  <div class="info-cell"><span>Лицензия</span><b>MIT</b></div>
                  <div class="info-cell"><span>Зависимости</span><b>нет</b></div>
                </div>
              </div>

              <div class="set-section">
                <div class="set-actions">
                  <button class="btn" data-act="about-app">${icon("info")} Подробнее о системе</button>
                  <button class="btn" data-act="update">${icon("download")} Проверить обновления</button>
                </div>
              </div>

              <p class="credits">HTML OS — учебный проект и демонстрация возможностей веб-платформы.<br>Сделано на <b>HTML</b>, <b>CSS</b> и <b>JavaScript</b>. Все данные остаются в вашем браузере.</p>
            </section>
          </div>
        </div>`;

      const S = OS.settings;
      const pageTitle = body.querySelector(".set-main");
      const usernameInput = body.querySelector(".set-username");
      const avatarEl = body.querySelector(".set-avatar");
      const wallsEl = body.querySelector("#set-walls");
      const accentsEl = body.querySelector("#set-accents");
      const hero = body.querySelector("#set-hero");
      const heroName = body.querySelector("#set-hero-name");

      wallsEl.innerHTML = OS.wallpapers.map((w) => `
        <button class="wall-item" data-wall="${w.id}" title="${escapeHtml(w.name)}">
          <img src="${w.src}" alt="${escapeHtml(w.name)}" loading="lazy">
          <span>${escapeHtml(w.name)}</span>
        </button>`).join("");

      accentsEl.innerHTML = OS.accents.map((a) => `
        <button class="accent-dot" data-accent="${a.color}" title="${escapeHtml(a.name)}" style="background:${a.color}"></button>`).join("");

      function activeTabButton(tab) {
        body.querySelectorAll(".set-tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
        body.querySelectorAll(".set-page").forEach((p) => p.classList.toggle("active", p.dataset.page === tab));
        win.setSubtitle(TABS[tab]);
        win.setTitle(`Настройки — ${TABS[tab]}`);
      }

      function sync() {
        const data = S.get();
        const w = S.wallpaper();
        hero.style.backgroundImage = `url("${w.src}")`;
        heroName.textContent = w.name;
        wallsEl.querySelectorAll("[data-wall]").forEach((b) => b.classList.toggle("sel", b.dataset.wall === data.wallpaper));
        accentsEl.querySelectorAll("[data-accent]").forEach((b) => b.classList.toggle("sel", b.dataset.accent.toLowerCase() === String(data.accent).toLowerCase()));
        body.querySelectorAll("[data-theme]").forEach((b) => b.classList.toggle("sel", b.dataset.theme === data.theme));
        body.querySelectorAll("[data-toggle]").forEach((input) => {
          input.checked = !!data[input.dataset.toggle];
        });
        const name = data.username?.trim() || "Гость";
        if (document.activeElement !== usernameInput) usernameInput.value = data.username || "";
        avatarEl.textContent = name.slice(0, 1).toUpperCase();
        const range = body.querySelector(".sound-range");
        const pct = Math.round(Number(data.volume) * 100);
        range.value = pct;
        range.style.setProperty("--fill", pct + "%");
        body.querySelector(".sound-value").textContent = pct + "%";
        const langSelect = body.querySelector(".set-language");
        if (langSelect) langSelect.value = data.language === "ru" ? "ru" : "en";
      }

      function fillSystemInfo() {
        const ua = navigator.userAgent;
        const browser = ua.includes("Edg/") ? "Microsoft Edge" : ua.includes("OPR/") ? "Opera" : ua.includes("Chrome/") ? "Google Chrome" : ua.includes("Firefox/") ? "Mozilla Firefox" : ua.includes("Safari/") ? "Safari" : "Браузер";
        const platform = navigator.userAgentData?.platform || navigator.platform || "—";
        body.querySelector(".sys-browser").textContent = browser;
        body.querySelector(".sys-platform").textContent = platform;
        body.querySelector(".sys-screen").textContent = `${screen.width}×${screen.height}`;
        body.querySelector(".sys-lang").textContent = navigator.language || "—";
        body.querySelector(".sys-apps").textContent = String(OS.wm.all().length);
        body.querySelector(".sys-outer").textContent = `${window.innerWidth}×${window.innerHeight}`;
        const used = OS.util.storageSize();
        const quota = 5 * 1024 * 1024;
        const pct = Math.max(1, Math.min(100, Math.round((used / quota) * 100)));
        body.querySelector(".sys-storage-bar").style.width = pct + "%";
        body.querySelector(".sys-storage-label").textContent = `${OS.util.formatBytes(used)} из ~5 МБ`;
      }

      body.querySelector(".set-side").addEventListener("click", (e) => {
        const tab = e.target.closest("[data-tab]");
        if (!tab) return;
        activeTab = tab.dataset.tab;
        activeTabButton(activeTab);
        if (activeTab === "system") fillSystemInfo();
        OS.sound.play("click");
      });

      wallsEl.addEventListener("click", (e) => {
        const item = e.target.closest("[data-wall]");
        if (!item) return;
        S.set("wallpaper", item.dataset.wall);
        sync();
        OS.sound.play("click");
      });

      accentsEl.addEventListener("click", (e) => {
        const dot = e.target.closest("[data-accent]");
        if (!dot) return;
        S.set("accent", dot.dataset.accent);
        sync();
        OS.sound.play("click");
      });

      body.querySelector(".theme-grid").addEventListener("click", (e) => {
        const card = e.target.closest("[data-theme]");
        if (!card) return;
        S.set("theme", card.dataset.theme);
        sync();
        OS.sound.play("click");
      });

      body.querySelectorAll("[data-toggle]").forEach((input) => {
        input.addEventListener("change", () => {
          S.set(input.dataset.toggle, input.checked);
          sync();
        });
      });

      const nameTimer = null;
      let typingTimer;
      usernameInput.addEventListener("input", () => {
        const value = usernameInput.value.slice(0, 24);
        avatarEl.textContent = (value.trim() || "Гость").slice(0, 1).toUpperCase();
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => {
          S.set("username", value.trim() || "Гость");
          sync();
        }, 350);
      });
      usernameInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          clearTimeout(typingTimer);
          S.set("username", usernameInput.value.trim() || "Гость");
          sync();
          usernameInput.blur();
        }
      });

      const range = body.querySelector(".sound-range");
      range.addEventListener("input", () => {
        const val = Number(range.value);
        range.style.setProperty("--fill", val + "%");
        body.querySelector(".sound-value").textContent = val + "%";
        S.set("volume", val / 100);
      });
      range.addEventListener("change", () => OS.sound.play("notify"));

      body.querySelector('[data-act="test-sound"]').addEventListener("click", () => OS.sound.play("notify"));

      body.querySelector('[data-act="reset-fs"]').addEventListener("click", async () => {
        const ok = await OS.ui.confirm({
          title: "Сбросить файлы?",
          text: "Все файлы, созданные в HTML OS, будут удалены. Стандартные папки и документы восстановятся.",
          okText: "Сбросить файлы",
          danger: true,
        });
        if (!ok) return;
        OS.fs.reset();
        fillSystemInfo();
        OS.notify({ title: "Файловая система сброшена", text: "Восстановлены стандартные папки", icon: "📁", app: "files" });
      });

      body.querySelector('[data-act="reset-settings"]').addEventListener("click", async () => {
        const ok = await OS.ui.confirm({
          title: "Сбросить настройки?",
          text: "Тема, обои, акцент и имя пользователя вернутся к значениям по умолчанию.",
          okText: "Сбросить настройки",
          danger: true,
        });
        if (!ok) return;
        const previousLanguage = S.get("language");
        S.reset();
        sync();
        if (previousLanguage !== S.get("language")) {
          location.reload();
          return;
        }
        OS.notify({ title: "Настройки сброшены", text: "Тёмная тема, обои «DeepSeek Love» и синий акцент", icon: "⚙️", app: "settings" });
      });

      body.querySelector('[data-act="restart"]').addEventListener("click", async () => {
        const ok = await OS.ui.confirm({
          title: "Перезагрузить?",
          text: "HTML OS закроет все окна и запустится заново. Данные сохранятся.",
          okText: "Перезагрузить",
        });
        if (ok && OS.shell) OS.shell.restart();
      });

      body.querySelector('[data-act="about-app"]').addEventListener("click", () => OS.wm.open("about"));
      body.querySelector('[data-act="update"]').addEventListener("click", () => {
        OS.ui.notify({ title: "Проверка обновлений", text: "Вы используете последнюю версию HTML OS 1.0 «Aurora».", icon: "✅", timeout: 5000 });
        OS.sound.play("notify");
      });

      body.querySelector(".set-language").addEventListener("change", async (e) => {
        const previous = S.get("language") || "en";
        const next = e.target.value;
        if (next === previous) return;
        const ok = await OS.ui.confirm({
          title: "Сменить язык?",
          text: "Интерфейс будет перезагружен. Несохранённый текст в Блокноте будет потерян.",
          okText: "Перезагрузить",
        });
        if (!ok) {
          e.target.value = previous;
          return;
        }
        S.set("language", next);
        location.reload();
      });

      const unsub = S.onChange(() => sync());
      win.onClose(unsub);
      win.onArgs((next) => {
        if (next?.tab && TABS[next.tab]) {
          activeTab = next.tab;
          activeTabButton(activeTab);
        }
      });

      activeTabButton(activeTab);
      sync();
      fillSystemInfo();
      win.setTitle(`Настройки — ${TABS[activeTab]}`);
      void pageTitle;
      void nameTimer;
    },
  });
})();
