/* ══════════════════════════════════════════════════════════════════════
   HTML OS — диалоги, выбор файлов, уведомления
   ══════════════════════════════════════════════════════════════════════ */
OS.ui = (() => {
  const { escapeHtml } = OS.util;
  let active = null;

  function modal(opts = {}) {
    const {
      title = "",
      body = "",
      icon = "",
      wide = false,
      dismissible = true,
      actions = [],
      onClose = null,
    } = opts;

    closeActive();

    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    const el = document.createElement("div");
    el.className = "modal" + (wide ? " wide" : "");
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.innerHTML = `
      <div class="modal-head">${icon ? OS.util.icon(icon) : ""}<h3></h3></div>
      <div class="modal-body"></div>
      <div class="modal-actions"></div>`;
    el.querySelector("h3").textContent = title;
    const bodyEl = el.querySelector(".modal-body");
    if (body instanceof Node) bodyEl.appendChild(body);
    else bodyEl.innerHTML = body || "";
    const actionsEl = el.querySelector(".modal-actions");

    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      document.removeEventListener("keydown", onKey);
      backdrop.remove();
      if (active?.el === el) active = null;
      if (typeof onClose === "function") onClose();
    };

    actions.forEach((action) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn " + (action.primary ? "primary " : "") + (action.danger ? "danger " : "") + (action.ghost ? "ghost" : "");
      btn.textContent = action.label;
      btn.addEventListener("click", async () => {
        let keep = false;
        if (typeof action.onClick === "function") {
          try {
            keep = (await action.onClick({ close, el, body: bodyEl })) === false;
          } catch (err) {
            console.error(err);
          }
        }
        if (!keep) close();
      });
      actionsEl.appendChild(btn);
    });

    function onKey(e) {
      if (e.key === "Escape" && dismissible) {
        e.stopPropagation();
        close();
      }
    }

    backdrop.addEventListener("mousedown", (e) => {
      if (e.target === backdrop && dismissible) close();
    });
    backdrop.appendChild(el);
    document.getElementById("modal-root").appendChild(backdrop);
    if (window.OS.i18n) OS.i18n.apply(el);
    active = { el, close };
    document.addEventListener("keydown", onKey);

    setTimeout(() => {
      const focusable = el.querySelector("input, textarea, select, .modal-actions .primary, .modal-actions .btn");
      if (focusable) focusable.focus();
    }, 40);

    return { close, el, body: bodyEl };
  }

  function closeActive() {
    if (active) active.close();
  }

  function prompt(opts = {}) {
    const {
      title = "Введите значение",
      label = "",
      value = "",
      placeholder = "",
      okText = "ОК",
      icon = "edit",
      allowEmpty = false,
    } = opts;

    return new Promise((resolve) => {
      let finished = false;
      const finish = (v) => {
        if (finished) return;
        finished = true;
        resolve(v);
        m.close();
      };
      const body = document.createElement("div");
      body.innerHTML = `${label ? `<p>${escapeHtml(label)}</p>` : ""}
        <input class="field" type="text" placeholder="${escapeHtml(placeholder)}">
        <div class="modal-error"></div>`;
      const input = body.querySelector("input");
      input.value = value;

      const m = modal({
        title,
        icon,
        body,
        dismissible: true,
        onClose: () => {
          if (!finished) {
            finished = true;
            resolve(null);
          }
        },
        actions: [
          { label: "Отмена", onClick: () => finish(null) },
          {
            label: okText,
            primary: true,
            onClick: () => {
              const val = input.value.trim();
              if (!val && !allowEmpty) {
                body.querySelector(".modal-error").textContent = "Введите значение";
                input.focus();
                return false;
              }
              finish(val);
              return false;
            },
          },
        ],
      });

      const submit = () => {
        const btn = m.el.querySelector(".modal-actions .btn.primary");
        if (btn) btn.click();
      };
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          submit();
        }
      });
      setTimeout(() => {
        input.focus();
        input.select();
      }, 50);
    });
  }

  function confirm(opts = {}) {
    const {
      title = "Подтверждение",
      text = "",
      okText = "Подтвердить",
      cancelText = "Отмена",
      danger = false,
      icon = "warning",
    } = opts;

    return new Promise((resolve) => {
      let finished = false;
      const finish = (v) => {
        if (finished) return;
        finished = true;
        resolve(v);
        m.close();
      };
      const body = document.createElement("div");
      body.innerHTML = `<p>${escapeHtml(text)}</p>`;
      const m = modal({
        title,
        icon,
        body,
        onClose: () => {
          if (!finished) {
            finished = true;
            resolve(false);
          }
        },
        actions: [
          { label: cancelText, onClick: () => finish(false) },
          { label: okText, danger, primary: !danger, onClick: () => finish(true) },
        ],
      });
    });
  }

  function filePicker(opts = {}) {
    const {
      title = "Открыть файл",
      exts = null,
      start = [],
      okText = "Открыть",
    } = opts;

    return new Promise((resolve) => {
      let finished = false;
      let selected = null;
      let cwd = OS.fs.isDir(start) ? [...OS.fs.norm(start)] : ["Документы"];
      if (!OS.fs.isDir(cwd)) cwd = [];

      const finish = (result) => {
        if (finished) return;
        finished = true;
        resolve(result);
        m.close();
      };

      const body = document.createElement("div");
      body.className = "fp";
      body.innerHTML = `
        <div class="fp-bar">
          <button class="btn sm icon-only" data-fp="up" type="button" title="Наверх">${OS.util.icon("up")}</button>
          <div class="fp-path"></div>
          <button class="btn sm icon-only" data-fp="home" type="button" title="Домой">${OS.util.icon("home")}</button>
        </div>
        <div class="fp-list"></div>
        <div class="modal-error"></div>`;

      const listEl = body.querySelector(".fp-list");
      const pathEl = body.querySelector(".fp-path");

      const m = modal({
        title,
        icon: "folder",
        body,
        wide: true,
        onClose: () => {
          if (!finished) {
            finished = true;
            resolve(null);
          }
        },
        actions: [
          { label: "Отмена", onClick: () => finish(null) },
          {
            label: okText,
            primary: true,
            onClick: () => {
              if (!selected) {
                body.querySelector(".modal-error").textContent = "Выберите файл";
                return false;
              }
              finish({ path: selected.path, name: selected.name, node: selected.node });
            },
          },
        ],
      });

      const okBtn = m.el.querySelector(".modal-actions .btn.primary");
      const upBtn = body.querySelector('[data-fp="up"]');
      upBtn.addEventListener("click", () => {
        if (cwd.length) {
          cwd = cwd.slice(0, -1);
          selected = null;
          render();
        }
      });
      body.querySelector('[data-fp="home"]').addEventListener("click", () => {
        cwd = [...OS.fs.HOME];
        selected = null;
        render();
      });

      function render() {
        pathEl.innerHTML = "";
        const crumbs = [{ name: "HTML OS", path: [] }, ...cwd.map((name, i) => ({ name, path: cwd.slice(0, i + 1) }))];
        crumbs.forEach((crumb, i) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "fp-crumb";
          btn.textContent = crumb.name;
          btn.addEventListener("click", () => {
            cwd = [...crumb.path];
            selected = null;
            render();
          });
          pathEl.appendChild(btn);
          if (i < crumbs.length - 1) {
            const sep = document.createElement("span");
            sep.className = "fp-sep";
            sep.textContent = "/";
            pathEl.appendChild(sep);
          }
        });
        upBtn.disabled = cwd.length === 0;

        listEl.innerHTML = "";
        const entries = OS.fs.list(cwd);
        const folders = entries.filter((e) => e.isFolder);
        const files = entries.filter((e) => !e.isFolder && (!exts || exts.includes(OS.util.extOf(e.name))));
        if (!folders.length && !files.length) {
          listEl.innerHTML = `<div class="fp-empty">${OS.util.icon("folder")}<span>Здесь нет подходящих файлов</span></div>`;
        }
        folders.forEach((entry) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "fp-item folder";
          btn.innerHTML = `<span class="fp-emoji">📁</span><span class="fp-name">${escapeHtml(entry.name)}</span><span class="fp-meta">папка</span>`;
          btn.addEventListener("click", () => {
            cwd = [...entry.path];
            selected = null;
            render();
          });
          listEl.appendChild(btn);
        });
        files.forEach((entry) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "fp-item file";
          const size = entry.node.data ? "изображение" : OS.util.formatBytes((entry.node.content || "").length * 2);
          btn.innerHTML = `<span class="fp-emoji">${OS.util.fileEmoji(entry.name)}</span><span class="fp-name">${escapeHtml(entry.name)}</span><span class="fp-meta">${size}</span>`;
          btn.addEventListener("click", () => {
            selected = entry;
            listEl.querySelectorAll(".fp-item").forEach((n) => n.classList.remove("sel"));
            btn.classList.add("sel");
            body.querySelector(".modal-error").textContent = "";
            if (okBtn) okBtn.disabled = false;
          });
          btn.addEventListener("dblclick", () => finish({ path: entry.path, name: entry.name, node: entry.node }));
          listEl.appendChild(btn);
        });

        if (okBtn) okBtn.disabled = !selected;
        if (upBtn) upBtn.disabled = cwd.length === 0;
      }

      setTimeout(render, 0);
    });
  }

  /* ─── Уведомления ─────────────────────────────────────────────────── */
  function notify(titleOrOpts, text, opts = {}) {
    const conf = typeof titleOrOpts === "object" && titleOrOpts !== null
      ? titleOrOpts
      : { title: titleOrOpts, text, ...opts };
    const host = document.getElementById("notifications");
    if (!host) return;

    while (host.children.length >= 4) host.firstElementChild.remove();

    const app = conf.app ? OS.wm?.getApp(conf.app) : null;
    const emoji = conf.icon || app?.icon || "🔔";
    const c1 = app?.color?.[0] || "#5b8cff";
    const c2 = app?.color?.[1] || "#8b5cf6";

    const toast = document.createElement("div");
    toast.className = "toast";
    const timeout = conf.timeout ?? 4200;
    toast.style.setProperty("--toast-time", `${timeout}ms`);
    toast.innerHTML = `
      <div class="app-icon" style="--c1:${c1};--c2:${c2}">${emoji}</div>
      <div class="toast-text">
        <div class="toast-title"></div>
        ${conf.text ? '<div class="toast-msg"></div>' : ""}
      </div>
      <button class="toast-close" type="button" title="Закрыть">${OS.util.icon("close")}</button>`;
    toast.querySelector(".toast-title").textContent = conf.title || "Уведомление";
    if (conf.text) toast.querySelector(".toast-msg").textContent = conf.text;

    let removed = false;
    const remove = () => {
      if (removed) return;
      removed = true;
      toast.classList.add("out");
      setTimeout(() => toast.remove(), 240);
    };
    toast.querySelector(".toast-close").addEventListener("click", remove);
    host.appendChild(toast);
    if (window.OS.i18n) OS.i18n.apply(toast);
    if (timeout > 0) setTimeout(remove, timeout);
    return remove;
  }

  return { modal, prompt, confirm, filePicker, notify, close: closeActive };
})();

OS.notify = OS.ui.notify;
