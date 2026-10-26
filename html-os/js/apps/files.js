/* ══════════════════════════════════════════════════════════════════════
   HTML OS — приложение «Файлы» (виртуальная файловая система HTML OS)
   ══════════════════════════════════════════════════════════════════════ */
(() => {
  const { escapeHtml, formatBytes, fileEmoji } = OS.util;
  const VIEW_KEY = "htmlos.files.view";

  const QUICK = [
    { name: "Рабочий стол", icon: "🖥️" },
    { name: "Документы", icon: "📄" },
    { name: "Изображения", icon: "🖼️" },
    { name: "Музыка", icon: "🎵" },
    { name: "Загрузки", icon: "⬇️" },
  ];

  OS.registerApp({
    id: "files",
    name: "Файлы",
    icon: "📁",
    color: ["#fbbf24", "#f59e0b"],
    width: 900,
    height: 570,
    minWidth: 560,
    minHeight: 340,
    mount(body, win, args) {
      let cwd = ["Рабочий стол"];
      if (args?.path && OS.fs.isDir(args.path)) cwd = [...OS.fs.norm(args.path)];
      else if (args?.folder && OS.fs.isDir(args.folder)) cwd = [...OS.fs.norm(args.folder)];
      if (!OS.fs.isDir(cwd)) cwd = [...OS.fs.HOME];

      let history = [[...cwd]];
      let hi = 0;
      let selected = null;
      let pendingSelect = args?.select || null;
      let view = OS.util.loadJSON(VIEW_KEY, "grid");
      if (!["grid", "list"].includes(view)) view = "grid";

      body.innerHTML = `
        <div class="app files-app">
          <aside class="files-side">
            <div class="files-side-title">Быстрый доступ</div>
            <div class="files-quick"></div>
            <div class="files-side-foot">
              <div class="files-live-note">
                <span class="live-dot ok"></span>
                <div class="live-note-text">
                  <b>Виртуальная ФС</b>
                  <span class="files-root-path">Данные хранятся в браузере</span>
                </div>
              </div>
              <div class="files-storage">
                <div class="small">Хранилище браузера</div>
                <div class="meter"><i></i></div>
                <div class="small files-storage-label">—</div>
              </div>
            </div>
          </aside>
          <div class="files-main">
            <div class="app-toolbar">
              <button class="btn sm icon-only" data-nav="back" title="Назад">${OS.util.icon("left")}</button>
              <button class="btn sm icon-only" data-nav="up" title="На уровень вверх">${OS.util.icon("up")}</button>
              <button class="btn sm icon-only" data-nav="refresh" title="Обновить">${OS.util.icon("refresh")}</button>
              <div class="toolbar-sep"></div>
              <button class="btn sm" data-new="folder">${OS.util.icon("plus")} Папка</button>
              <button class="btn sm" data-new="file">${OS.util.icon("file")} Файл</button>
              <div class="grow"></div>
              <div class="seg">
                <button class="seg-btn ${view === "grid" ? "active" : ""}" data-view="grid" title="Плитка">${OS.util.icon("grid")}</button>
                <button class="seg-btn ${view === "list" ? "active" : ""}" data-view="list" title="Список">${OS.util.icon("notes")}</button>
              </div>
            </div>
            <div class="files-crumbs"></div>
            <div class="files-content"></div>
            <div class="app-status">
              <span class="files-count">—</span>
              <span class="files-status">—</span>
            </div>
          </div>
        </div>`;

      const content = body.querySelector(".files-content");
      const crumbsEl = body.querySelector(".files-crumbs");
      const quickEl = body.querySelector(".files-quick");
      const countEl = body.querySelector(".files-count");
      const statusEl = body.querySelector(".files-status");
      const storageFill = body.querySelector(".files-storage .meter i");
      const storageLabel = body.querySelector(".files-storage-label");
      const backBtn = body.querySelector('[data-nav="back"]');
      const upBtn = body.querySelector('[data-nav="up"]');

      quickEl.innerHTML = QUICK.map((q) => {
        const exists = OS.fs.isDir([q.name]);
        return `<button class="side-item ${cwd[0] === q.name && cwd.length === 1 ? "active" : ""}" data-quick="${escapeHtml(q.name)}" ${exists ? "" : "disabled"}>
          <span class="side-emoji">${q.icon}</span><span class="side-name">${escapeHtml(q.name)}</span>
        </button>`;
      }).join("");
      quickEl.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-quick]");
        if (!btn) return;
        go([btn.dataset.quick]);
      });

      function pathLabel(path = cwd) {
        return "/" + path.join("/");
      }

      function sizeOf(entry) {
        if (entry.isFolder) return "—";
        if (entry.node.data || entry.node.src) return "изображение";
        return formatBytes((entry.node.content || "").length * 2);
      }

      function kindOf(entry) {
        if (entry.isFolder) return "Папка";
        const kind = OS.util.fileKind(entry.name);
        return kind === "image" ? "Изображение" : kind === "text" ? "Текстовый документ" : "Файл";
      }

      function thumbFor(entry) {
        if (entry.isFolder) return "📁";
        if (entry.node.data || entry.node.src) {
          return `<img src="${escapeHtml(entry.node.data || entry.node.src)}" alt="">`;
        }
        return fileEmoji(entry.name);
      }

      function plural(n, forms) {
        const a = Math.abs(n) % 100;
        const b = a % 10;
        if (a > 10 && a < 20) return forms[2];
        if (b > 1 && b < 5) return forms[1];
        if (b === 1) return forms[0];
        return forms[2];
      }

      function updateStorage() {
        const stats = OS.fs.stats();
        const quota = 5 * 1024 * 1024;
        const pct = Math.max(1, Math.min(100, Math.round((stats.bytes / quota) * 100)));
        storageFill.style.width = pct + "%";
        storageLabel.textContent = `${formatBytes(stats.bytes)} · ${stats.files} файлов`;
      }

      function render() {
        if (!OS.fs.isDir(cwd)) cwd = [...OS.fs.HOME];
        win.setSubtitle(pathLabel(cwd));
        backBtn.disabled = hi === 0;
        upBtn.disabled = cwd.length === 0;

        crumbsEl.innerHTML = "";
        const crumbs = [{ name: "HTML OS", path: [] }, ...cwd.map((name, i) => ({ name, path: cwd.slice(0, i + 1) }))];
        crumbs.forEach((crumb, i) => {
          const btn = document.createElement("button");
          btn.className = "crumb" + (i === crumbs.length - 1 ? " current" : "");
          btn.textContent = crumb.name;
          btn.addEventListener("click", () => go(crumb.path));
          crumbsEl.appendChild(btn);
          if (i < crumbs.length - 1) {
            const sep = document.createElement("span");
            sep.className = "crumb-sep";
            sep.textContent = "/";
            crumbsEl.appendChild(sep);
          }
        });

        const entries = OS.fs.list(cwd);
        content.className = `files-content ${view}-view`;
        content.innerHTML = "";
        if (!entries.length) {
          content.innerHTML = `<div class="files-empty">${OS.util.icon("folder")}<span>Эта папка пуста</span><span class="small">Создайте файл или папку на панели сверху</span></div>`;
        }

        entries.forEach((entry) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = view === "grid" ? "file-tile" : "file-row";
          btn.dataset.name = entry.name;
          if (view === "grid") {
            btn.innerHTML = `
              <span class="file-thumb">${thumbFor(entry)}</span>
              <span class="file-name">${escapeHtml(entry.name)}</span>`;
          } else {
            btn.innerHTML = `
              <span class="file-thumb">${thumbFor(entry)}</span>
              <span class="file-name">${escapeHtml(entry.name)}</span>
              <span class="file-kind">${kindOf(entry)}</span>
              <span class="file-meta">${entry.isFolder ? "—" : sizeOf(entry)}</span>`;
          }
          const select = () => {
            selected = entry;
            content.querySelectorAll(".file-tile, .file-row").forEach((n) => n.classList.remove("sel"));
            btn.classList.add("sel");
            statusEl.textContent = `${entry.name} · ${kindOf(entry)}${entry.isFolder ? "" : " · " + sizeOf(entry)}`;
          };
          btn.addEventListener("click", select);
          btn.addEventListener("dblclick", () => openEntry(entry));
          btn.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            select();
            showEntryMenu(e.clientX, e.clientY, entry);
          });
          content.appendChild(btn);
        });

        if (pendingSelect) {
          const match = entries.find((e) => e.name === pendingSelect);
          pendingSelect = null;
          if (match) {
            const btn = Array.from(content.querySelectorAll(".file-tile, .file-row")).find((n) => n.dataset.name === match.name);
            if (btn) {
              selected = match;
              btn.classList.add("sel");
            }
          }
        }

        countEl.textContent = `${entries.length} ${plural(entries.length, ["элемент", "элемента", "элементов"])}`;
        statusEl.textContent = selected ? `${selected.name} · ${kindOf(selected)}` : pathLabel(cwd);
        updateStorage();
        quickEl.querySelectorAll("[data-quick]").forEach((btn) => {
          btn.classList.toggle("active", cwd.length === 1 && cwd[0] === btn.dataset.quick);
        });
      }

      function go(path, record = true) {
        const target = OS.fs.norm(path);
        if (!OS.fs.isDir(target)) return;
        cwd = target;
        selected = null;
        if (record) {
          history = history.slice(0, hi + 1);
          history.push([...cwd]);
          hi = history.length - 1;
        }
        render();
      }

      function openEntry(entry) {
        if (entry.isFolder) {
          go(entry.path);
          return;
        }
        const node = entry.node;
        if (node.data || node.src || OS.util.fileKind(entry.name) === "image") {
          OS.wm.open("gallery", { preview: node.data || node.src, title: entry.name });
          return;
        }
        if (OS.util.fileKind(entry.name) === "text") {
          OS.wm.open("notepad", { path: entry.path });
          return;
        }
        OS.notify({ title: "Нет приложения", text: `Не удалось открыть «${entry.name}»`, icon: "⚠️" });
        OS.sound.play("error");
      }

      function showEntryMenu(x, y, entry) {
        const isRoot = entry.path.length <= 1;
        const items = [
          { label: "Открыть", icon: entry.isFolder ? "folder" : "file", action: () => openEntry(entry) },
          { label: "Переименовать", icon: "edit", hint: "F2", disabled: isRoot, action: () => renameEntry(entry) },
          { label: "Удалить", icon: "trash", hint: "Del", danger: true, disabled: isRoot, action: () => deleteEntry(entry) },
          { separator: true },
          { label: "Свойства", icon: "info", action: () => showProperties(entry) },
        ];
        if (OS.menu) OS.menu(x, y, items);
      }

      async function renameEntry(entry) {
        if (entry.path.length <= 1) {
          OS.notify({ title: "Системная папка", text: "Её нельзя переименовать", icon: "🔒" });
          return;
        }
        const name = await OS.ui.prompt({
          title: "Переименовать",
          label: `Новое имя для «${entry.name}»`,
          value: entry.name,
          okText: "Переименовать",
          icon: "edit",
        });
        if (!name || name === entry.name) return;
        try {
          OS.fs.rename(entry.path, name);
          render();
        } catch (err) {
          error(err);
        }
      }

      async function deleteEntry(entry) {
        if (entry.path.length <= 1) {
          OS.notify({ title: "Системная папка", text: "Её нельзя удалить", icon: "🔒" });
          return;
        }
        const ok = await OS.ui.confirm({
          title: "Удалить?",
          text: `«${entry.name}» будет удалён без возможности восстановления.`,
          okText: "Удалить",
          danger: true,
          icon: "trash",
        });
        if (!ok) return;
        try {
          OS.fs.remove(entry.path);
          render();
        } catch (err) {
          error(err);
        }
      }

      function showProperties(entry) {
        const node = entry.node;
        const rows = [
          ["Имя", entry.name],
          ["Тип", kindOf(entry)],
          ["Путь", pathLabel(entry.path)],
          ["Размер", entry.isFolder ? `${OS.fs.list(entry.path).length} элемент(ов)` : sizeOf(entry)],
        ];
        OS.ui.modal({
          title: "Свойства",
          icon: "info",
          body: `<div class="info-grid">${rows.map(([k, v]) => `<div class="info-cell"><span>${k}</span><b title="${escapeHtml(v)}">${escapeHtml(v)}</b></div>`).join("")}</div>`,
          actions: [{ label: "Закрыть", primary: true }],
        });
      }

      function error(err) {
        OS.notify({ title: "Ошибка", text: err.message || String(err), icon: "⚠️" });
        OS.sound.play("error");
      }

      async function createNew(kind) {
        if (kind === "folder") {
          const name = await OS.ui.prompt({ title: "Новая папка", label: "Имя папки", value: OS.i18n.t("Новая папка"), okText: "Создать", icon: "folder" });
          if (!name) return;
          try {
            OS.fs.mkdir(cwd, name);
            render();
          } catch (err) { error(err); }
        } else {
          const name = await OS.ui.prompt({ title: "Новый файл", label: "Имя файла", value: OS.i18n.t("Новый файл.txt"), okText: "Создать", icon: "file" });
          if (!name) return;
          const filename = OS.util.extOf(name) ? name : name + ".txt";
          try {
            const finalName = OS.fs.uniqueName(cwd, filename);
            OS.fs.write([...cwd, finalName], "");
            render();
            if (OS.util.fileKind(finalName) === "text") OS.wm.open("notepad", { path: [...cwd, finalName] });
          } catch (err) { error(err); }
        }
      }

      body.querySelector('[data-new="folder"]').addEventListener("click", () => createNew("folder"));
      body.querySelector('[data-new="file"]').addEventListener("click", () => createNew("file"));

      body.querySelector('[data-nav="back"]').addEventListener("click", () => {
        if (hi > 0) { hi--; cwd = [...history[hi]]; selected = null; render(); }
      });
      body.querySelector('[data-nav="up"]').addEventListener("click", () => {
        if (cwd.length) go(cwd.slice(0, -1));
      });
      body.querySelector('[data-nav="refresh"]').addEventListener("click", render);

      content.addEventListener("click", (e) => {
        if (e.target === content || e.target.classList.contains("files-empty")) {
          selected = null;
          content.querySelectorAll(".sel").forEach((n) => n.classList.remove("sel"));
          statusEl.textContent = pathLabel(cwd);
        }
      });
      content.addEventListener("contextmenu", (e) => {
        if (e.target === content || e.target.closest(".files-empty")) {
          e.preventDefault();
          if (OS.menu) OS.menu(e.clientX, e.clientY, [
            { label: "Создать папку", icon: "folder", action: () => createNew("folder") },
            { label: "Создать файл", icon: "file", action: () => createNew("file") },
            { separator: true },
            { label: "Обновить", icon: "refresh", action: render },
          ]);
        }
      });

      body.querySelector(".seg").addEventListener("click", (e) => {
        const btn = e.target.closest("[data-view]");
        if (!btn) return;
        view = btn.dataset.view;
        OS.util.saveJSON(VIEW_KEY, view);
        body.querySelectorAll("[data-view]").forEach((b) => b.classList.toggle("active", b === btn));
        render();
      });

      win.el.addEventListener("keydown", (e) => {
        if (!selected) return;
        if (e.key === "Enter") { e.preventDefault(); openEntry(selected); }
        else if (e.key === "Delete") { e.preventDefault(); deleteEntry(selected); }
        else if (e.key === "F2") { e.preventDefault(); renameEntry(selected); }
      });

      const unsub = OS.fs.onChange(() => {
        if (!OS.wm.windows().includes(win)) return;
        render();
      });
      win.onClose(unsub);
      win.onArgs((next) => {
        if (next?.path) {
          const p = OS.fs.norm(next.path);
          if (OS.fs.isDir(p)) go(p);
          else if (p.length) go(p.slice(0, -1));
        }
      });
      win.setTitle("Файлы");
      render();
    },
  });
})();
