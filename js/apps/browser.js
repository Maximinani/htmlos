/* ══════════════════════════════════════════════════════════════════════
   HTML OS — приложение «Браузер»
   ══════════════════════════════════════════════════════════════════════ */
(() => {
  const { escapeHtml } = OS.util;
  const HOME_URL = "htmlos://start";

  const QUICK = [
    { name: "Wikipedia", emoji: "📚", url: "https://ru.wikipedia.org", c1: "#94a3b8", c2: "#475569" },
    { name: "YouTube", emoji: "▶️", url: "https://www.youtube.com", c1: "#f87171", c2: "#dc2626" },
    { name: "GitHub", emoji: "🐙", url: "https://github.com", c1: "#a78bfa", c2: "#6d28d9" },
    { name: "MDN", emoji: "📖", url: "https://developer.mozilla.org/ru/", c1: "#60a5fa", c2: "#2563eb" },
    { name: "Хабр", emoji: "⚙️", url: "https://habr.com", c1: "#67e8f9", c2: "#0e7490" },
    { name: "DeepSeek", emoji: "🐋", url: "https://chat.deepseek.com", c1: "#818cf8", c2: "#4338ca" },
  ];

  OS.registerApp({
    id: "browser",
    name: "Браузер",
    icon: "🌐",
    color: ["#38bdf8", "#2563eb"],
    width: 940,
    height: 620,
    minWidth: 520,
    minHeight: 360,
    mount(body, win) {
      let history = [HOME_URL];
      let hi = 0;
      let currentUrl = HOME_URL;
      let externalUrl = null;

      body.innerHTML = `
        <div class="app browser">
          <div class="br-toolbar">
            <button class="btn sm icon-only" data-nav="back" title="Назад">${OS.util.icon("left")}</button>
            <button class="btn sm icon-only" data-nav="forward" title="Вперёд">${OS.util.icon("right")}</button>
            <button class="btn sm icon-only" data-nav="reload" title="Обновить">${OS.util.icon("refresh")}</button>
            <button class="btn sm icon-only" data-nav="home" title="Домашняя страница">${OS.util.icon("home")}</button>
            <form class="br-address">
              <span class="br-addr-icon">${OS.util.icon("search")}</span>
              <input class="br-url" type="text" spellcheck="false" autocomplete="off" value="${HOME_URL}" aria-label="Адрес">
              <button class="br-go" type="submit" title="Перейти">${OS.util.icon("right")}</button>
            </form>
            <button class="btn sm icon-only" data-nav="external" title="Открыть в новой вкладке">${OS.util.icon("external")}</button>
          </div>
          <div class="br-view">
            <div class="br-home">
              <div class="br-glow"></div>
              <div class="br-home-inner">
                <div class="br-brand">
                  <img src="assets/logo.svg" alt="" width="52" height="52">
                  <div><b>HTML OS Browser</b><span>интернет внутри системы</span></div>
                </div>
                <form class="br-search">
                  <span class="br-search-icon">${OS.util.icon("search")}</span>
                  <input class="br-search-input" type="text" placeholder="Найти в интернете или ввести адрес" autocomplete="off">
                  <button class="btn primary" type="submit">Найти</button>
                </form>
                <div class="br-quick">
                  ${QUICK.map((q) => `
                    <a class="br-quick-item" href="${q.url}" target="_blank" rel="noopener noreferrer" data-external="${q.url}">
                      <span class="br-quick-icon" style="--c1:${q.c1};--c2:${q.c2}">${q.emoji}</span>
                      <span>${q.name}</span>
                    </a>`).join("")}
                </div>
                <div class="br-local">
                  <span class="br-local-title">Локальные страницы</span>
                  <button data-local="about">О системе</button>
                  <button data-local="settings">Настройки</button>
                  <button data-local="files">Файлы</button>
                  <button data-local="notes">Заметки</button>
                </div>
                <p class="br-hint">Внешние сайты могут запрещать встраивание в рамку — тогда откройте их в новой вкладке браузера.</p>
              </div>
            </div>
            <div class="br-external hidden">
              <div class="br-notice">
                ${OS.util.icon("info")}
                <span>Сайт открыт во встроенной рамке. Если он не загрузился, он запрещает встраивание.</span>
                <button class="btn sm" data-nav="external">Открыть в новой вкладке</button>
              </div>
              <iframe class="br-frame" title="Веб-страница" referrerpolicy="no-referrer" allow="fullscreen; clipboard-write"></iframe>
            </div>
          </div>
          <div class="br-progress"><i></i></div>
          <div class="app-status">
            <span class="br-status">Готово</span>
            <span>HTML OS Browser 1.0</span>
          </div>
        </div>`;

      const urlInput = body.querySelector(".br-url");
      const homeEl = body.querySelector(".br-home");
      const externalEl = body.querySelector(".br-external");
      const frame = body.querySelector(".br-frame");
      const statusEl = body.querySelector(".br-status");
      const progress = body.querySelector(".br-progress");
      const backBtn = body.querySelector('[data-nav="back"]');
      const fwdBtn = body.querySelector('[data-nav="forward"]');

      function setLoading(loading) {
        progress.classList.toggle("on", loading);
        if (loading) {
          progress.querySelector("i").style.width = "70%";
          statusEl.textContent = "Загрузка…";
        } else {
          progress.querySelector("i").style.width = "100%";
          setTimeout(() => {
            progress.classList.remove("on");
            progress.querySelector("i").style.width = "0%";
          }, 250);
        }
      }

      function updateNav() {
        backBtn.disabled = hi <= 0;
        fwdBtn.disabled = hi >= history.length - 1;
      }

      function showHome() {
        currentUrl = HOME_URL;
        externalUrl = null;
        homeEl.classList.remove("hidden");
        externalEl.classList.add("hidden");
        urlInput.value = HOME_URL;
        statusEl.textContent = "Домашняя страница";
        setLoading(false);
        updateNav();
      }

      function showExternal(url) {
        currentUrl = url;
        externalUrl = url;
        homeEl.classList.add("hidden");
        externalEl.classList.remove("hidden");
        urlInput.value = url;
        frame.src = url;
        setLoading(true);
        updateNav();
        win.setSubtitle(url.replace(/^https?:\/\//, "").slice(0, 40));
      }

      function render(url) {
        if (!url || url === HOME_URL) {
          showHome();
          win.setSubtitle("Домашняя страница");
        } else {
          showExternal(url);
        }
      }

      function looksLikeUrl(value) {
        const v = value.trim();
        if (/^https?:\/\//i.test(v)) return true;
        return /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(v);
      }

      function navigate(raw, record = true) {
        const value = String(raw || "").trim();
        if (!value) return;
        if (value === "start" || value === "home" || value === HOME_URL || value === "htmlos://home") {
          if (record) {
            history = history.slice(0, hi + 1);
            history.push(HOME_URL);
            hi = history.length - 1;
          }
          render(HOME_URL);
          return;
        }
        if (looksLikeUrl(value)) {
          const url = /^https?:\/\//i.test(value) ? value : "https://" + value;
          if (record) {
            history = history.slice(0, hi + 1);
            history.push(url);
            hi = history.length - 1;
          }
          render(url);
          return;
        }
        if (value.startsWith("htmlos://")) {
          OS.ui.notify({ title: "Неизвестная страница", text: "Доступна только htmlos://start", icon: "🌐" });
          return;
        }
        // Поисковый запрос — открываем во внешнем браузере
        const searchUrl = "https://duckduckgo.com/?q=" + encodeURIComponent(value);
        window.open(searchUrl, "_blank", "noopener,noreferrer");
        statusEl.textContent = "Поиск открыт в новой вкладке браузера";
        urlInput.value = currentUrl;
        OS.notify({ title: "Поиск", text: `«${value}» открыт во внешнем браузере`, icon: "🔎", app: "browser" });
      }

      function goBack() {
        if (hi <= 0) return;
        hi--;
        render(history[hi]);
        updateNav();
      }

      function goForward() {
        if (hi >= history.length - 1) return;
        hi++;
        render(history[hi]);
        updateNav();
      }

      function openExternal() {
        if (!externalUrl) {
          OS.notify({ title: "Нечего открывать", text: "Сначала загрузите сайт по адресу", icon: "🌐" });
          return;
        }
        window.open(externalUrl, "_blank", "noopener,noreferrer");
      }

      body.querySelector('[data-nav="back"]').addEventListener("click", goBack);
      body.querySelector('[data-nav="forward"]').addEventListener("click", goForward);
      body.querySelector('[data-nav="home"]').addEventListener("click", () => navigate(HOME_URL));
      body.querySelector('[data-nav="reload"]').addEventListener("click", () => {
        if (currentUrl === HOME_URL) render(HOME_URL);
        else {
          frame.src = currentUrl;
          setLoading(true);
        }
      });
      body.querySelectorAll('[data-nav="external"]').forEach((btn) => btn.addEventListener("click", openExternal));

      body.querySelector(".br-address").addEventListener("submit", (e) => {
        e.preventDefault();
        navigate(urlInput.value);
        urlInput.blur();
      });
      urlInput.addEventListener("focus", () => urlInput.select());

      body.querySelector(".br-search").addEventListener("submit", (e) => {
        e.preventDefault();
        const q = body.querySelector(".br-search-input").value.trim();
        if (!q) return;
        if (looksLikeUrl(q)) navigate(q);
        else window.open("https://duckduckgo.com/?q=" + encodeURIComponent(q), "_blank", "noopener,noreferrer");
      });

      body.querySelector(".br-quick").addEventListener("click", (e) => {
        const link = e.target.closest("a[data-external]");
        if (!link) return;
        e.preventDefault();
        window.open(link.dataset.external, "_blank", "noopener,noreferrer");
      });

      body.querySelector(".br-local").addEventListener("click", (e) => {
        const btn = e.target.closest("[data-local]");
        if (!btn) return;
        OS.wm.open(btn.dataset.local);
      });

      frame.addEventListener("load", () => {
        if (!externalUrl) return;
        setLoading(false);
        statusEl.textContent = "Внешний сайт · " + externalUrl.replace(/^https?:\/\//, "");
      });
      frame.addEventListener("error", () => {
        setLoading(false);
        statusEl.textContent = "Не удалось загрузить сайт";
      });

      win.setTitle("Браузер");
      win.setSubtitle("Домашняя страница");
      win.onFocus(() => {
        // не перехватываем фокус — адресная строка не должна выделяться сама
      });

      showHome();
      updateNav();
    },
  });
})();
