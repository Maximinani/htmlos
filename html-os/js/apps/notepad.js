/* ══════════════════════════════════════════════════════════════════════
   HTML OS — приложение «Блокнот»
   ══════════════════════════════════════════════════════════════════════ */
(() => {
  OS.registerApp({
    id: "notepad",
    name: "Блокнот",
    icon: "📝",
    color: ["#a78bfa", "#7c3aed"],
    width: 780,
    height: 560,
    minWidth: 420,
    minHeight: 300,
    mount(body, win, args) {
      let filePath = null;
      let dirty = false;

      body.innerHTML = `
        <div class="app notepad">
          <div class="app-toolbar">
            <button class="btn sm" data-act="new">${OS.util.icon("plus")} Новый</button>
            <button class="btn sm" data-act="open">${OS.util.icon("folder")} Открыть</button>
            <button class="btn sm primary" data-act="save">${OS.util.icon("save")} Сохранить</button>
            <div class="toolbar-sep"></div>
            <button class="btn sm icon-only" data-act="download" title="Скачать как .txt">${OS.util.icon("download")}</button>
            <div class="grow"></div>
            <span class="np-file"><i class="dot"></i><span class="np-name">Без имени</span></span>
          </div>
          <textarea class="np-text" spellcheck="false" placeholder="Начните печатать…"></textarea>
          <div class="app-status">
            <span class="np-path">Не сохранено</span>
            <span class="np-stats">0 символов · 1 строка</span>
          </div>
        </div>`;

      const ta = body.querySelector(".np-text");
      const nameEl = body.querySelector(".np-name");
      const fileEl = body.querySelector(".np-file");
      const pathEl = body.querySelector(".np-path");
      const statsEl = body.querySelector(".np-stats");

      function fileTitle() {
        return filePath ? filePath[filePath.length - 1] : "Без имени";
      }

      function refresh() {
        const name = fileTitle();
        nameEl.textContent = name + (dirty ? " *" : "");
        fileEl.classList.toggle("dirty", dirty);
        win.setTitle(`${dirty ? "● " : ""}${name} — Блокнот`);
        win.setSubtitle(filePath ? "/" + filePath.slice(0, -1).join("/") : "Не сохранено");
        pathEl.textContent = filePath ? "/" + filePath.join("/") : "Не сохранено";
        updateStats();
      }

      function updateStats() {
        const text = ta.value;
        const chars = text.length;
        const lines = text ? text.split("\n").length : 1;
        statsEl.textContent = `${chars} ${chars === 1 ? "символ" : "символов"} · ${lines} ${lines === 1 ? "строка" : "строк"}`;
      }

      function setContent(text, path = null) {
        ta.value = text ?? "";
        filePath = path ? [...path] : null;
        dirty = false;
        refresh();
      }

      function markDirty() {
        if (!dirty) {
          dirty = true;
          refresh();
        } else {
          updateStats();
        }
      }

      async function confirmDiscard() {
        if (!dirty) return true;
        return OS.ui.confirm({
          title: "Несохранённые изменения",
          text: "Текущий текст не сохранён. Продолжить и потерять изменения?",
          okText: "Продолжить",
          danger: true,
          icon: "warning",
        });
      }

      async function newDoc() {
        if (!(await confirmDiscard())) return;
        setContent("", null);
      }

      async function openDoc() {
        if (!(await confirmDiscard())) return;
        const res = await OS.ui.filePicker({
          title: "Открыть текстовый файл",
          exts: [".txt", ".md", ".log", ".json", ".js", ".css", ".html"],
          start: filePath ? filePath.slice(0, -1) : ["Документы"],
        });
        if (!res) return;
        setContent(OS.fs.read(res.path) ?? "", res.path);
      }

      async function saveDoc() {
        const content = ta.value;
        if (filePath) {
          try {
            OS.fs.write(filePath, content);
            dirty = false;
            refresh();
            OS.sound.play("click");
            pathEl.textContent = "Сохранено · /" + filePath.join("/");
          } catch (err) {
            OS.ui.notify({ title: "Не удалось сохранить", text: err.message, icon: "⚠️" });
          }
          return;
        }
        const name = await OS.ui.prompt({
          title: "Сохранить файл",
          label: "Файл будет сохранён в папке «Документы»",
          value: OS.i18n.t("Заметка.txt"),
          okText: "Сохранить",
          icon: "save",
        });
        if (!name) return;
        const filename = OS.util.extOf(name) ? name : name + ".txt";
        const finalName = OS.fs.uniqueName(["Документы"], filename);
        try {
          OS.fs.write(["Документы", finalName], content);
          filePath = ["Документы", finalName];
          dirty = false;
          refresh();
          pathEl.textContent = "Сохранено · /Документы/" + finalName;
          OS.notify({ title: "Файл сохранён", text: "/Документы/" + finalName, icon: "💾", app: "notepad" });
        } catch (err) {
          OS.ui.notify({ title: "Ошибка сохранения", text: err.message, icon: "⚠️" });
        }
      }

      function downloadDoc() {
        const title = fileTitle();
        const name = title === "Без имени" ? "Заметка.txt" : (OS.util.extOf(title) ? title : title + ".txt");
        OS.util.download(name, ta.value);
        OS.notify({ title: "Скачивание", text: name, icon: "⬇️", app: "notepad" });
      }

      body.querySelector('[data-act="new"]').addEventListener("click", newDoc);
      body.querySelector('[data-act="open"]').addEventListener("click", openDoc);
      body.querySelector('[data-act="save"]').addEventListener("click", saveDoc);
      body.querySelector('[data-act="download"]').addEventListener("click", downloadDoc);

      ta.addEventListener("input", markDirty);
      ta.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
          e.preventDefault();
          saveDoc();
        }
        if (e.key === "Tab") {
          e.preventDefault();
          const start = ta.selectionStart;
          const end = ta.selectionEnd;
          ta.value = ta.value.slice(0, start) + "    " + ta.value.slice(end);
          ta.selectionStart = ta.selectionEnd = start + 4;
          markDirty();
        }
      });

      const onArgs = (next) => {
        if (!next) return;
        if (next.path) {
          const content = OS.fs.read(next.path);
          if (content != null) setContent(content, next.path);
        } else if (typeof next.content === "string") {
          setContent(next.content, next.path || null);
        }
      };
      win.onArgs(onArgs);
      win.onFocus(() => setTimeout(() => ta.focus(), 30));

      if (args?.path) {
        const content = OS.fs.read(args.path);
        if (content != null) setContent(content, args.path);
      } else if (typeof args?.content === "string") {
        setContent(args.content, args.path || null);
      } else {
        const sampleRu = `HTML OS · Блокнот
─────────────────

Здесь можно писать заметки, списки и целые рассказы.
Файлы сохраняются в виртуальную файловую систему — их видно
в приложении «Файлы», в папке «Документы».

Горячие клавиши:
  Ctrl + S — сохранить
  Tab      — отступ

Содержимое этого окна — просто пример.
Нажмите «Новый», чтобы начать с чистого листа.`;
        const sampleEn = `HTML OS · Notepad
─────────────────

Write notes, lists or entire stories here.
Files are saved to the virtual file system — you'll find them
in the Files app, inside Documents.

Keyboard shortcuts:
  Ctrl + S — save
  Tab      — indent

This text is just a sample.
Click New to start with a blank page.`;
        setContent(OS.i18n.lang === "ru" ? sampleRu : sampleEn, null);
        dirty = false;
        refresh();
      }
      refresh();
    },
  });
})();
