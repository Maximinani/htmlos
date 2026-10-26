/* ══════════════════════════════════════════════════════════════════════
   HTML OS — реестр приложений и оконный менеджер
   ══════════════════════════════════════════════════════════════════════ */
OS.wm = (() => {
  const apps = new Map();
  const wins = [];
  let zTop = 100;
  let cascade = 0;
  let focusedId = null;
  const TASKBAR = () => (window.innerWidth <= 720 ? 54 : 52);

  function register(def) {
    if (!def || !def.id || !def.name) throw new Error("Приложение должно иметь id и name");
    apps.set(def.id, {
      width: 720,
      height: 520,
      minWidth: 360,
      minHeight: 240,
      singleton: true,
      icon: "🧩",
      color: ["#5b8cff", "#8b5cf6"],
      ...def,
    });
  }

  function getApp(id) {
    return apps.get(id) || null;
  }

  function all() {
    return Array.from(apps.values());
  }

  function find(query) {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return null;
    const display = (a) => OS.i18n ? OS.i18n.text(a.name).toLowerCase() : a.name.toLowerCase();
    return all().find((a) => a.id.toLowerCase() === q || display(a) === q)
      || all().find((a) => display(a).includes(q) || a.name.toLowerCase().includes(q))
      || null;
  }

  function emit() {
    window.dispatchEvent(new CustomEvent("os:windows-change", {
      detail: {
        windows: wins.map((w) => ({ id: w.id, appId: w.appId, title: w.title, minimized: w.minimized, focused: w.id === focusedId })),
        focused: focusedId,
      },
    }));
  }

  function focused() {
    return wins.find((w) => w.id === focusedId) || null;
  }

  function visibleWins() {
    return wins.filter((w) => !w.minimized && !w.closing);
  }

  function focus(win) {
    if (!win || win.closing) return;
    if (win.minimized) restore(win);
    focusedId = win.id;
    win.el.style.zIndex = ++zTop;
    wins.forEach((w) => w.el.classList.toggle("focused", w === win));
    win.el.classList.remove("minimized");
    win.minimized = false;
    emit();
    if (typeof win._onFocus === "function") {
      try { win._onFocus(); } catch (e) { console.error(e); }
    }
  }

  function focusNext(exclude) {
    const candidates = wins.filter((w) => w !== exclude && !w.minimized && !w.closing);
    if (!candidates.length) {
      focusedId = null;
      wins.forEach((w) => w.el.classList.remove("focused"));
      emit();
      return;
    }
    candidates.sort((a, b) => Number(b.el.style.zIndex || 0) - Number(a.el.style.zIndex || 0));
    focus(candidates[0]);
  }

  function create(app, args) {
    const mobile = window.innerWidth <= 720;
    const vw = window.innerWidth;
    const vh = window.innerHeight - TASKBAR();
    const width = Math.min(app.width, vw - 20);
    const height = Math.min(app.height, vh - 20);
    const step = cascade % 5;
    cascade++;
    let x = Math.round((vw - width) / 2) + step * 26 - 52;
    let y = Math.round((vh - height) / 2) + step * 18 - 36;
    x = Math.max(8, Math.min(x, vw - width - 8));
    y = Math.max(8, Math.min(y, vh - height - 8));

    const el = document.createElement("section");
    el.className = "window";
    el.dataset.app = app.id;
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.style.width = width + "px";
    el.style.height = height + "px";
    el.style.zIndex = ++zTop;
    el.innerHTML = `
      <header class="win-head">
        <div class="win-title">
          <span class="app-icon" style="--c1:${app.color[0]};--c2:${app.color[1]}">${app.icon}</span>
          <span class="win-title-text"></span>
          <span class="win-sub"></span>
        </div>
        <div class="win-controls">
          <button class="win-btn" type="button" data-act="min" title="Свернуть">${OS.util.icon("min")}</button>
          <button class="win-btn" type="button" data-act="max" title="Развернуть">${OS.util.icon("max")}</button>
          <button class="win-btn" type="button" data-act="close" title="Закрыть">${OS.util.icon("close")}</button>
        </div>
      </header>
      <div class="win-body"></div>
      <div class="rz rz-n" data-dir="n"></div>
      <div class="rz rz-s" data-dir="s"></div>
      <div class="rz rz-e" data-dir="e"></div>
      <div class="rz rz-w" data-dir="w"></div>
      <div class="rz rz-ne" data-dir="ne"></div>
      <div class="rz rz-nw" data-dir="nw"></div>
      <div class="rz rz-se" data-dir="se"></div>
      <div class="rz rz-sw" data-dir="sw"></div>`;

    const titleEl = el.querySelector(".win-title-text");
    const subEl = el.querySelector(".win-sub");
    titleEl.textContent = app.name;

    const win = {
      id: OS.util.uid("win"),
      appId: app.id,
      app,
      el,
      body: el.querySelector(".win-body"),
      title: app.name,
      minimized: false,
      maximized: false,
      closing: false,
      _cleanup: [],
      _onArgs: null,
      _onFocus: null,
      _restoreRect: null,
      setTitle(t) {
        win.title = String(t || app.name);
        titleEl.textContent = win.title;
        emit();
      },
      setSubtitle(t) {
        subEl.textContent = t || "";
      },
      onClose(fn) {
        if (typeof fn === "function") win._cleanup.push(fn);
      },
      onArgs(fn) {
        if (typeof fn === "function") win._onArgs = fn;
      },
      onFocus(fn) {
        if (typeof fn === "function") win._onFocus = fn;
      },
      focus() { focus(win); },
      minimize() { minimize(win); },
      toggleMax() { toggleMax(win); },
      close() { close(win); },
    };

    el.addEventListener("pointerdown", () => {
      if (focusedId !== win.id) focus(win);
    }, true);

    el.querySelector('[data-act="min"]').addEventListener("click", (e) => { e.stopPropagation(); minimize(win); });
    el.querySelector('[data-act="max"]').addEventListener("click", (e) => { e.stopPropagation(); toggleMax(win); });
    el.querySelector('[data-act="close"]').addEventListener("click", (e) => { e.stopPropagation(); close(win); });

    const head = el.querySelector(".win-head");
    head.addEventListener("dblclick", (e) => {
      if (!e.target.closest(".win-btn")) toggleMax(win);
    });
    head.addEventListener("pointerdown", (e) => startDrag(e, win));

    el.querySelectorAll(".rz").forEach((handle) => {
      handle.addEventListener("pointerdown", (e) => startResize(e, win, handle.dataset.dir));
    });

    document.getElementById("windows").appendChild(el);
    wins.push(win);
    focus(win);

    if (app.singleton !== false) {
      // единственный экземпляр уже открыт — обрабатывается в open()
    }

    if (mobile) {
      win.maximized = true;
      el.classList.add("maximized");
      updateMaxButton(win);
    }

    try {
      const cleanup = app.mount ? app.mount(win.body, win, args) : null;
      if (typeof cleanup === "function") win._cleanup.push(cleanup);
    } catch (err) {
      console.error(err);
      win.body.innerHTML = `<div class="app-error">${OS.util.icon("warning")}<h3>Приложение не запустилось</h3><pre>${OS.util.escapeHtml(err?.message || String(err))}</pre></div>`;
    }

    if (window.OS.i18n) OS.i18n.apply(el);

    OS.sound.play("open");
    emit();

    if (win._onArgs && args) {
      // начальные аргументы переданы в mount
    }
    return win;
  }

  function open(id, args = null) {
    const app = typeof id === "string" ? getApp(id) : id;
    if (!app) {
      console.warn("Приложение не найдено:", id);
      return null;
    }
    if (app.singleton !== false) {
      const existing = wins.find((w) => w.appId === app.id && !w.closing);
      if (existing) {
        if (existing.minimized) restore(existing);
        focus(existing);
        if (args && typeof existing._onArgs === "function") {
          try { existing._onArgs(args); } catch (e) { console.error(e); }
        }
        return existing;
      }
    }
    return create(app, args);
  }

  function close(win) {
    if (!win || win.closing) return;
    win.closing = true;
    win._cleanup.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
    const wasFocused = focusedId === win.id;
    const i = wins.indexOf(win);
    if (i >= 0) wins.splice(i, 1);
    win.el.classList.add("closing");
    setTimeout(() => win.el.remove(), 180);
    if (wasFocused) {
      focusedId = null;
      focusNext(win);
    }
    OS.sound.play("close");
    emit();
  }

  function minimize(win) {
    if (!win || win.closing || win.minimized) return;
    win.minimized = true;
    win.el.classList.add("minimized");
    if (focusedId === win.id) {
      focusedId = null;
      focusNext(win);
    }
    emit();
  }

  function restore(win) {
    if (!win) return;
    win.minimized = false;
    win.el.classList.remove("minimized");
    focus(win);
  }

  function updateMaxButton(win) {
    const btn = win.el.querySelector('[data-act="max"]');
    if (!btn) return;
    btn.innerHTML = OS.util.icon(win.maximized ? "restore" : "max");
    btn.title = win.maximized ? "Восстановить" : "Развернуть";
  }

  function toggleMax(win) {
    if (!win) return;
    if (!win.maximized) {
      win._restoreRect = {
        left: win.el.style.left,
        top: win.el.style.top,
        width: win.el.style.width,
        height: win.el.style.height,
      };
      win.maximized = true;
      win.el.classList.add("maximized");
    } else {
      win.maximized = false;
      win.el.classList.remove("maximized");
      if (win._restoreRect) {
        Object.assign(win.el.style, win._restoreRect);
        win._restoreRect = null;
      }
    }
    updateMaxButton(win);
    focus(win);
  }

  function startDrag(e, win) {
    if (e.button !== 0 || e.target.closest(".win-btn") || win.maximized) return;
    const head = win.el.querySelector(".win-head");
    const rect = win.el.getBoundingClientRect();
    const offX = e.clientX - rect.left;
    const offY = e.clientY - rect.top;
    const vw = window.innerWidth;
    const vh = window.innerHeight - TASKBAR();
    let moved = false;

    head.classList.add("dragging");
    head.setPointerCapture?.(e.pointerId);
    e.preventDefault();

    const move = (ev) => {
      moved = true;
      let x = ev.clientX - offX;
      let y = ev.clientY - offY;
      x = Math.max(-rect.width + 90, Math.min(x, vw - 90));
      y = Math.max(0, Math.min(y, vh - 44));
      win.el.style.left = x + "px";
      win.el.style.top = y + "px";
    };
    const up = () => {
      head.classList.remove("dragging");
      head.removeEventListener("pointermove", move);
      head.removeEventListener("pointerup", up);
      head.removeEventListener("pointercancel", up);
      if (moved) focus(win);
    };
    head.addEventListener("pointermove", move);
    head.addEventListener("pointerup", up);
    head.addEventListener("pointercancel", up);
  }

  function startResize(e, win, dir) {
    if (e.button !== 0 || win.maximized) return;
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const rect = win.el.getBoundingClientRect();
    const minW = Math.max(280, win.app.minWidth);
    const minH = Math.max(180, win.app.minHeight);
    const vw = window.innerWidth;
    const vh = window.innerHeight - TASKBAR();
    const start = { x: rect.left, y: rect.top, w: rect.width, h: rect.height };

    const handle = e.currentTarget;
    handle.setPointerCapture?.(e.pointerId);

    const move = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      let { x, y, w, h } = start;
      if (dir.includes("e")) w = Math.max(minW, Math.min(start.w + dx, vw - start.x - 4));
      if (dir.includes("s")) h = Math.max(minH, Math.min(start.h + dy, vh - start.y - 4));
      if (dir.includes("w")) {
        const newW = Math.max(minW, start.w - dx);
        x = Math.max(4, start.x + (start.w - newW));
        w = newW;
      }
      if (dir.includes("n")) {
        const newH = Math.max(minH, start.h - dy);
        y = Math.max(4, start.y + (start.h - newH));
        h = newH;
      }
      win.el.style.left = x + "px";
      win.el.style.top = y + "px";
      win.el.style.width = w + "px";
      win.el.style.height = h + "px";
    };
    const up = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", up);
      handle.removeEventListener("pointercancel", up);
      focus(win);
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", up);
    handle.addEventListener("pointercancel", up);
  }

  function minimizeAll() {
    let any = false;
    wins.forEach((w) => {
      if (!w.minimized && !w.closing) {
        w.minimized = true;
        w.el.classList.add("minimized");
        any = true;
      }
    });
    if (any) {
      focusedId = null;
      wins.forEach((w) => w.el.classList.remove("focused"));
      emit();
    }
    return any;
  }

  function restoreAll() {
    const hidden = wins.filter((w) => w.minimized && !w.closing);
    hidden.forEach((w) => {
      w.minimized = false;
      w.el.classList.remove("minimized");
    });
    if (hidden.length) focus(hidden[hidden.length - 1]);
    emit();
    return hidden.length;
  }

  function hasVisible() {
    return wins.some((w) => !w.minimized && !w.closing);
  }

  function count() {
    return wins.filter((w) => !w.closing).length;
  }

  return {
    register, getApp, all, find, open, close, focus, minimize, restore, toggleMax,
    minimizeAll, restoreAll, hasVisible, count, focused, windows: () => wins,
    emit,
  };
})();

OS.registerApp = (def) => OS.wm.register(def);
