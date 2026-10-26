/* ══════════════════════════════════════════════════════════════════════
   HTML OS — оболочка: рабочий стол, панель задач, меню «Пуск»,
   экран блокировки, уведомления и контекстные меню
   ══════════════════════════════════════════════════════════════════════ */
OS.shell = (() => {
  const { $, $$, escapeHtml, icon } = OS.util;
  const params = new URLSearchParams(location.search);

  const DESKTOP_APPS = ["files", "browser", "notepad", "terminal", "paint", "gallery", "music", "settings"];
  const PINNED = ["files", "browser", "notepad", "terminal", "settings", "gallery", "music", "games"];
  const TASKBAR_PINNED = ["files", "browser", "notepad", "terminal", "paint", "gallery", "music", "settings"];

  let startOpen = false;
  let popoverKind = null;
  let menuOpen = false;
  let clockTimer = null;
  let loggedIn = false;

  /* ─── Утилиты панелей ─────────────────────────────────────────────── */
  function closeStart() {
    startOpen = false;
    $("#start-menu").classList.add("hidden");
    $("#start-button").classList.remove("active");
    $("#start-button").setAttribute("aria-expanded", "false");
    const search = $("#start-search");
    search.value = "";
    filterStart("");
  }

  function openStart(focusSearch = true) {
    closePopover();
    closeMenu();
    startOpen = true;
    $("#start-menu").classList.remove("hidden");
    $("#start-button").classList.add("active");
    $("#start-button").setAttribute("aria-expanded", "true");
    renderStart();
    if (focusSearch) {
      setTimeout(() => $("#start-search").focus(), 60);
    }
  }

  function toggleStart() {
    if (startOpen) closeStart();
    else openStart();
  }

  function closeMenu() {
    menuOpen = false;
    $("#context-menu").classList.add("hidden");
  }

  function closePopover() {
    popoverKind = null;
    const pop = $("#tray-popover");
    pop.classList.add("hidden");
    pop.innerHTML = "";
    $$(".tray-btn").forEach((b) => b.classList.remove("active"));
  }

  function showDesktop() {
    if (OS.wm.hasVisible()) OS.wm.minimizeAll();
    else OS.wm.restoreAll();
    closeStart();
    closeMenu();
  }

  function launch(id) {
    closeStart();
    closePopover();
    closeMenu();
    const win = OS.wm.open(id);
    if (win) OS.sound.play("click");
    return win;
  }

  /* ─── Рабочий стол ────────────────────────────────────────────────── */
  function renderDesktop() {
    const host = $("#desktop-icons");
    host.innerHTML = "";
    DESKTOP_APPS.forEach((id) => {
      const app = OS.wm.getApp(id);
      if (!app) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dicon";
      btn.dataset.app = id;
      btn.title = app.name;
      btn.innerHTML = `<span class="app-icon" style="--c1:${app.color[0]};--c2:${app.color[1]}">${app.icon}</span>
        <span class="dicon-label">${escapeHtml(app.name)}</span>`;
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        $$(".dicon").forEach((n) => n.classList.remove("selected"));
        btn.classList.add("selected");
        if (window.matchMedia("(pointer: coarse)").matches) launch(id);
      });
      btn.addEventListener("dblclick", (e) => {
        e.stopPropagation();
        launch(id);
      });
      btn.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        menu(e.clientX, e.clientY, [
          { label: "Открыть", icon: "external", action: () => launch(id) },
          { separator: true },
          { label: app.name, icon: "info", disabled: true },
        ]);
      });
      host.appendChild(btn);
    });
  }

  /* ─── Панель задач ────────────────────────────────────────────────── */
  function renderTaskbar() {
    const host = $("#taskbar-apps");
    if (!host) return;
    const wins = OS.wm.windows();
    const focused = OS.wm.focused();
    const ids = [...TASKBAR_PINNED];
    wins.forEach((w) => { if (!ids.includes(w.appId)) ids.push(w.appId); });
    host.innerHTML = "";
    ids.forEach((id) => {
      const app = OS.wm.getApp(id);
      if (!app) return;
      const win = wins.find((w) => w.appId === id && !w.closing);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tb-app" + (win ? " open" : " pinned") + (win && focused?.id === win.id && !win.minimized ? " active" : "") + (win?.minimized ? " minimized" : "");
      btn.title = app.name + (win ? " — открыто" : "");
      btn.dataset.app = id;
      btn.innerHTML = `<span class="app-icon" style="--c1:${app.color[0]};--c2:${app.color[1]}">${app.icon}</span>
        ${win ? `<span class="tb-label">${escapeHtml(win.title || app.name)}</span>` : ""}
        <span class="indicator"></span>`;
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        closeStart();
        closePopover();
        if (!win) {
          OS.wm.open(id);
          return;
        }
        if (focused?.id === win.id && !win.minimized) OS.wm.minimize(win);
        else OS.wm.focus(win);
      });
      btn.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        if (!win) {
          menu(e.clientX, e.clientY, [{ label: "Открыть", icon: "external", action: () => launch(id) }]);
          return;
        }
        menu(e.clientX, e.clientY, [
          { label: "Свернуть", icon: "min", action: () => OS.wm.minimize(win) },
          { label: "Развернуть", icon: "max", action: () => { OS.wm.focus(win); if (!win.maximized) OS.wm.toggleMax(win); } },
          { separator: true },
          { label: "Закрыть", icon: "close", danger: true, action: () => OS.wm.close(win) },
        ]);
      });
      host.appendChild(btn);
    });
  }

  /* ─── Меню «Пуск» ─────────────────────────────────────────────────── */
  function appTile(app) {
    return `<button class="sm-tile" type="button" data-app="${app.id}">
      <span class="app-icon" style="--c1:${app.color[0]};--c2:${app.color[1]}">${app.icon}</span>
      <span class="sm-tile-name">${escapeHtml(OS.i18n.text(app.name))}</span>
    </button>`;
  }

  function appRow(app) {
    return `<button class="sm-row" type="button" data-app="${app.id}">
      <span class="app-icon" style="--c1:${app.color[0]};--c2:${app.color[1]}">${app.icon}</span>
      <span class="sm-row-name">${escapeHtml(OS.i18n.text(app.name))}</span>
    </button>`;
  }

  function renderStart() {
    const apps = OS.wm.all().slice().sort((a, b) => OS.i18n.text(a.name).localeCompare(OS.i18n.text(b.name), OS.i18n.locale));
    const pinned = PINNED.map((id) => OS.wm.getApp(id)).filter(Boolean);
    $("#start-apps").innerHTML = pinned.map(appTile).join("");
    $("#start-all").innerHTML = apps.map(appRow).join("");
    $("#sm-count").textContent = `${apps.length}`;
    const avatar = (OS.settings.get("username")?.trim() || "Guest").slice(0, 1).toUpperCase();
    $("#sm-avatar").textContent = avatar;
    $("#sm-username").textContent = OS.settings.get("username")?.trim() || "Guest";
    filterStart($("#start-search").value);
  }

  function filterStart(query) {
    const q = query.trim().toLowerCase();
    const apps = OS.wm.all().slice().sort((a, b) => OS.i18n.text(a.name).localeCompare(OS.i18n.text(b.name), OS.i18n.locale));
    const allHeading = document.querySelector('.sm-heading[data-section="all"]');
    const pinnedHeading = document.querySelector('.sm-heading[data-section="pinned"]');
    const pinnedGrid = $("#start-apps");
    const emptyEl = $("#sm-empty");
    const headingText = allHeading?.querySelector(".sm-heading-text");

    if (!q) {
      pinnedHeading.classList.remove("hidden");
      pinnedGrid.classList.remove("hidden");
      $("#start-all").innerHTML = apps.map(appRow).join("");
      $("#sm-count").textContent = `${apps.length}`;
      if (headingText) headingText.textContent = OS.i18n.text("Все приложения");
      emptyEl.classList.add("hidden");
      return;
    }

    const matches = apps.filter((a) => {
      const display = OS.i18n.text(a.name).toLowerCase();
      return display.includes(q) || a.name.toLowerCase().includes(q) || a.id.includes(q);
    });
    pinnedHeading.classList.add("hidden");
    pinnedGrid.classList.add("hidden");
    $("#start-all").innerHTML = matches.map(appRow).join("");
    $("#sm-count").textContent = `${matches.length}`;
    if (headingText) headingText.textContent = OS.i18n.text("Все приложения");
    emptyEl.classList.toggle("hidden", matches.length > 0);
  }

  $("#start-apps")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-app]");
    if (btn) launch(btn.dataset.app);
  });
  $("#start-all")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-app]");
    if (btn) launch(btn.dataset.app);
  });

  /* ─── Всплывающие панели трея ─────────────────────────────────────── */
  function volumeIcon() {
    const vol = Number(OS.settings.get("volume") ?? 0.6);
    return vol === 0 ? "volume" : "volume";
  }

  function openPopover(kind) {
    const pop = $("#tray-popover");
    if (popoverKind === kind) {
      closePopover();
      return;
    }
    closeStart();
    closeMenu();
    popoverKind = kind;
    pop.classList.remove("hidden");
    $$(".tray-btn").forEach((b) => b.classList.remove("active"));

    if (kind === "volume") {
      const vol = Math.round(Number(OS.settings.get("volume") ?? 0.6) * 100);
      $("#tray-volume").classList.add("active");
      pop.innerHTML = `
        <div class="popover-head">
          <div class="popover-title">${icon(volumeIcon())}<span>Звук</span></div>
          <span class="popover-sub">${vol}%</span>
        </div>
        <div class="vol-row">
          ${icon("volume")}
          <input class="range tray-vol" type="range" min="0" max="100" value="${vol}" style="--fill:${vol}%">
          <span class="vol-val">${vol}%</span>
        </div>
        <div class="popover-divider"></div>
        <div class="row" style="justify-content:space-between">
          <span class="small">Звуки интерфейса</span>
          <label class="switch"><input type="checkbox" class="tray-sounds" ${OS.settings.get("sounds") ? "checked" : ""}><span class="track"></span></label>
        </div>
        <div class="popover-divider"></div>
        <button class="btn sm" data-pop-app="settings" style="width:100%">${icon("settings")} Звуковые настройки</button>`;
      const range = pop.querySelector(".tray-vol");
      range.addEventListener("input", () => {
        const v = Number(range.value);
        range.style.setProperty("--fill", v + "%");
        pop.querySelector(".popover-sub").textContent = v + "%";
        pop.querySelector(".vol-val").textContent = v + "%";
        OS.settings.set("volume", v / 100);
      });
      range.addEventListener("change", () => OS.sound.play("notify"));
      pop.querySelector(".tray-sounds").addEventListener("change", (e) => {
        OS.settings.set("sounds", e.target.checked);
        if (e.target.checked) OS.sound.play("click");
      });
    } else if (kind === "network") {
      $("#tray-network").classList.add("active");
      pop.innerHTML = `
        <div class="popover-head">
          <div class="popover-title">${icon("wifi")}<span>Wi-Fi</span></div>
          <span class="popover-sub">подключено</span>
        </div>
        <div class="wifi-list">
          <button class="wifi-item connected" type="button"><span class="wifi-name">HTML-OS-5G</span>${icon("wifi")}<span class="wifi-tag">подключено</span></button>
          <button class="wifi-item" type="button"><span class="wifi-name">Neighbor_2.4</span>${icon("wifi")}</button>
          <button class="wifi-item" type="button"><span class="wifi-name">Free_Coffee</span>${icon("wifi")}</button>
        </div>
        <div class="popover-divider"></div>
        <button class="btn sm" data-pop-app="settings" style="width:100%">${icon("settings")} Параметры сети</button>`;
      pop.querySelectorAll(".wifi-item").forEach((item) => {
        item.addEventListener("click", () => {
          pop.querySelectorAll(".wifi-item").forEach((i) => i.classList.remove("connected"));
          item.classList.add("connected");
          pop.querySelector(".popover-sub").textContent = "подключено";
          OS.sound.play("click");
        });
      });
    } else if (kind === "battery") {
      $("#tray-battery").classList.add("active");
      pop.innerHTML = `
        <div class="popover-head">
          <div class="popover-title">${icon("battery")}<span>Батарея</span></div>
          <span class="popover-sub">демо</span>
        </div>
        <div class="battery-big">
          <div class="battery-shell"><div class="battery-fill"></div></div>
          <span class="battery-pct">98%</span>
        </div>
        <div class="popover-sub" style="margin-top:8px">Осталось примерно 6 ч 20 мин</div>
        <div class="popover-divider"></div>
        <div class="small muted">Индикатор батареи демонстрационный: HTML OS не имеет доступа к оборудованию.</div>`;
    }

    pop.querySelectorAll("[data-pop-app]").forEach((btn) => {
      btn.addEventListener("click", () => {
        closePopover();
        launch(btn.dataset.popApp);
      });
    });
  }

  /* ─── Контекстное меню ────────────────────────────────────────────── */
  function menu(x, y, items) {
    const el = $("#context-menu");
    el.innerHTML = "";
    items.forEach((item) => {
      if (item.separator) {
        const sep = document.createElement("div");
        sep.className = "ctx-sep";
        el.appendChild(sep);
        return;
      }
      if (item.heading) {
        const label = document.createElement("div");
        label.className = "ctx-label";
        label.textContent = item.heading;
        el.appendChild(label);
        return;
      }
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ctx-item" + (item.danger ? " danger" : "");
      btn.disabled = !!item.disabled;
      btn.innerHTML = `${item.icon ? icon(item.icon) : ""}<span>${escapeHtml(item.label)}</span>${item.hint ? `<span class="ctx-hint">${escapeHtml(item.hint)}</span>` : ""}`;
      if (!item.disabled && typeof item.action === "function") {
        btn.addEventListener("click", () => {
          closeMenu();
          item.action();
        });
      }
      el.appendChild(btn);
    });
    el.classList.remove("hidden");
    el.style.left = "0px";
    el.style.top = "0px";
    const rect = el.getBoundingClientRect();
    const left = Math.max(6, Math.min(x, window.innerWidth - rect.width - 6));
    const top = Math.max(6, Math.min(y, window.innerHeight - rect.height - 6));
    el.style.left = left + "px";
    el.style.top = top + "px";
    menuOpen = true;
  }

  /* ─── Часы ────────────────────────────────────────────────────────── */
  function updateClock() {
    const now = new Date();
    const tbTime = $("#tb-time");
    const tbDate = $("#tb-date");
    if (tbTime) tbTime.textContent = OS.util.fmtTime(now);
    if (tbDate) {
      tbDate.textContent = new Intl.DateTimeFormat(OS.i18n.locale, { weekday: "short", day: "2-digit", month: "short" }).format(now);
    }
    const lockTime = $("#lock-time");
    const lockDate = $("#lock-date");
    if (lockTime) lockTime.textContent = OS.util.fmtTime(now);
    if (lockDate) lockDate.textContent = OS.util.fmtDate(now) + " " + now.getFullYear();
  }

  /* ─── Загрузка / вход / блокировка ───────────────────────────────── */
  function openAppFromQuery() {
    const appId = params.get("app");
    if (!appId) return;
    const app = OS.wm.find(appId);
    if (!app) return;
    setTimeout(() => {
      if (params.get("tab") && OS.wm.getApp(app.id)) OS.wm.open(app.id, { tab: params.get("tab") });
      else OS.wm.open(app.id);
    }, 420);
  }

  function showWelcome() {
    const name = OS.settings.get("username")?.trim() || "Гость";
    setTimeout(() => {
      OS.ui.notify({
        title: `Добро пожаловать, ${name}!`,
        text: "HTML OS 1.0 «Aurora» готова. Нажмите «Пуск» или откройте «Настройки».",
        icon: "👋",
        timeout: 6500,
      });
    }, 850);
  }

  function login() {
    const first = !loggedIn;
    loggedIn = true;
    $("#lock").classList.add("hidden");
    $("#os").classList.remove("hidden");
    updateClock();
    if (first) {
      OS.sound.play("boot");
      if (!(params.get("quiet") === "1" || params.get("boot") === "0")) showWelcome();
      openAppFromQuery();
    }
  }

  function showLock() {
    $("#boot").classList.add("hidden");
    $("#lock").classList.remove("hidden");
    updateClock();
    setTimeout(() => $("#lock-enter")?.focus(), 80);
  }

  function lock() {
    if (!loggedIn) return;
    closeStart();
    closePopover();
    closeMenu();
    $("#lock").classList.remove("hidden");
    updateClock();
    setTimeout(() => $("#lock-enter")?.focus(), 100);
  }

  function boot() {
    const skip = params.get("boot") === "0";
    if (skip) {
      $("#boot").classList.add("hidden");
      if (params.get("lock") === "0") login();
      else showLock();
      return;
    }
    const bar = $("#boot-bar");
    const status = $("#boot-status");
    const steps = [
      [6, "Инициализация ядра…", 0],
      [24, "Монтирование файловой системы…", 380],
      [48, "Запуск оконного менеджера…", 760],
      [70, "Загрузка профиля пользователя…", 1140],
      [88, "Применение обоев и настроек…", 1520],
      [100, "Почти готово…", 1900],
    ];
    steps.forEach(([pct, text, delay]) => {
      setTimeout(() => {
        bar.style.width = pct + "%";
        status.textContent = text;
      }, delay);
    });
    setTimeout(() => {
      $("#boot").classList.add("done");
      setTimeout(() => {
        $("#boot").classList.add("hidden");
        if (params.get("lock") === "0") login();
        else showLock();
      }, 550);
    }, 2500);
  }

  function restart() {
    const url = new URL(location.href);
    ["boot", "lock", "app", "tab", "quiet"].forEach((k) => url.searchParams.delete(k));
    $("#os").style.transition = "opacity .25s";
    $("#os").style.opacity = "0";
    setTimeout(() => { location.href = url.toString(); }, 280);
  }

  function shutdown() {
    closeStart();
    closePopover();
    closeMenu();
    $("#os").classList.add("hidden");
    $("#shutdown").classList.remove("hidden");
  }

  function powerOn() {
    const url = new URL(location.href);
    ["boot", "lock", "app", "tab", "quiet"].forEach((k) => url.searchParams.delete(k));
    location.href = url.toString();
  }

  /* ─── События ─────────────────────────────────────────────────────── */
  function bindEvents() {
    $("#start-button").addEventListener("click", (e) => {
      e.stopPropagation();
      toggleStart();
    });
    $("#tb-search").addEventListener("click", (e) => {
      e.stopPropagation();
      if (startOpen) {
        $("#start-search").focus();
      } else {
        openStart(true);
      }
    });
    $("#start-search").addEventListener("input", (e) => filterStart(e.target.value));
    $("#start-search").addEventListener("keydown", (e) => {
      if (e.key === "Escape") { e.preventDefault(); closeStart(); }
      if (e.key === "Enter") {
        const first = Array.from(document.querySelectorAll("#start-menu [data-app]")).find((el) => el.offsetParent !== null);
        if (first) first.click();
      }
    });

    $$("#start-menu [data-power]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const action = btn.dataset.power;
        closeStart();
        if (action === "lock") lock();
        else if (action === "restart") restart();
        else if (action === "shutdown") shutdown();
      });
    });

    $("#sm-user")?.addEventListener("click", () => {
      closeStart();
      OS.wm.open("settings", { tab: "personal" });
    });

    $("#tray-volume").addEventListener("click", (e) => { e.stopPropagation(); openPopover("volume"); });
    $("#tray-network").addEventListener("click", (e) => { e.stopPropagation(); openPopover("network"); });
    $("#tray-battery").addEventListener("click", (e) => { e.stopPropagation(); openPopover("battery"); });
    $("#tray-clock").addEventListener("click", () => launch("clock"));
    $("#show-desktop").addEventListener("click", showDesktop);

    $("#lock-enter").addEventListener("click", login);

    $("#desktop").addEventListener("click", (e) => {
      if (e.target.closest(".dicon")) return;
      $$(".dicon").forEach((n) => n.classList.remove("selected"));
      closeStart();
      closeMenu();
      closePopover();
    });

    $("#desktop").addEventListener("contextmenu", (e) => {
      if (e.target.closest(".dicon")) return;
      e.preventDefault();
      menu(e.clientX, e.clientY, [
        { label: "Сменить обои", icon: "image", action: () => OS.wm.open("settings", { tab: "personal" }) },
        { label: "Персонализация", icon: "settings", action: () => OS.wm.open("settings", { tab: "personal" }) },
        { separator: true },
        { label: "Открыть «Файлы»", icon: "folder", action: () => launch("files") },
        { label: "Терминал", icon: "terminal", action: () => launch("terminal") },
        { label: "Свернуть все окна", icon: "min", hint: "Win+D", action: showDesktop },
        { separator: true },
        { label: "О системе", icon: "info", action: () => launch("about") },
      ]);
    });

    document.addEventListener("pointerdown", (e) => {
      if (startOpen && !e.target.closest("#start-menu") && !e.target.closest("#start-button") && !e.target.closest("#tb-search")) {
        closeStart();
      }
      if (popoverKind && !e.target.closest("#tray-popover") && !e.target.closest(".tb-tray")) {
        closePopover();
      }
      if (menuOpen && !e.target.closest("#context-menu")) {
        closeMenu();
      }
    }, true);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeStart();
        closeMenu();
        closePopover();
      }
      if (e.key === "Enter" && !$("#lock").classList.contains("hidden")) {
        e.preventDefault();
        login();
      }
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        if (!loggedIn) {
          // на экране входа ничего не делаем
        } else if ($("#lock").classList.contains("hidden")) {
          lock();
        } else {
          login();
        }
      }
      if (e.ctrlKey && e.key === "Escape") {
        showDesktop();
      }
    });

    $("#power-on").addEventListener("click", powerOn);

    window.addEventListener("os:windows-change", renderTaskbar);
    window.addEventListener("os:settings-change", () => {
      renderStart();
    });
    window.addEventListener("os:fs-change", () => {
      // рабочий стол показывает ярлыки, а не файлы — обновление не требуется
    });
    window.addEventListener("resize", renderTaskbar);
    window.addEventListener("beforeunload", () => clearInterval(clockTimer));
  }

  function init() {
    OS.fs.init();
    OS.settings.init();
    renderDesktop();
    renderStart();
    renderTaskbar();
    bindEvents();
    updateClock();
    clockTimer = setInterval(updateClock, 1000);
    window.__lockTimer = null;
    boot();
  }

  return {
    init, login, lock, restart, shutdown, openStart, closeStart, showDesktop,
    menu, updateClock, renderTaskbar,
  };
})();

OS.menu = OS.shell.menu;
