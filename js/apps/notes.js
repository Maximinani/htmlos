/* ══════════════════════════════════════════════════════════════════════
   HTML OS — приложение «Заметки» (стикеры)
   ══════════════════════════════════════════════════════════════════════ */
(() => {
  const KEY = "htmlos.notes.v1";
  const COLORS = [
    { bg: "#fef3c7", ink: "#4a3410", accent: "#f59e0b" },
    { bg: "#ffe4e6", ink: "#4c0519", accent: "#f43f5e" },
    { bg: "#dbeafe", ink: "#172554", accent: "#3b82f6" },
    { bg: "#dcfce7", ink: "#052e16", accent: "#22c55e" },
    { bg: "#ede9fe", ink: "#2e1065", accent: "#8b5cf6" },
    { bg: "#ffedd5", ink: "#431407", accent: "#f97316" },
  ];
  function defaultNotes() {
    const ru = OS.i18n.lang === "ru";
    return [
      {
        id: "welcome",
        text: ru
          ? "Добро пожаловать в «Заметки»!\n\nКликните по тексту и просто печатайте — всё сохраняется автоматически. Цвет можно сменить кнопкой-кружком в углу заметки."
          : "Welcome to Notes!\n\nClick the text and just type — everything is saved automatically. Use the color dot in the corner to change the note color.",
        color: 0,
        updated: Date.now(),
      },
      {
        id: "ideas",
        text: ru
          ? "Идеи на сегодня:\n• Сменить обои на «Космос»\n• Пройти Сапёра\n• Собрать 2048\n• Послушать «Глубокий космос»"
          : "Ideas for today:\n• Set the Space wallpaper\n• Beat Minesweeper\n• Reach 2048\n• Listen to Deep Space",
        color: 2,
        updated: Date.now() - 3600_000,
      },
    ];
  }

  OS.registerApp({
    id: "notes",
    name: "Заметки",
    icon: "📌",
    color: ["#fbbf24", "#f59e0b"],
    width: 820,
    height: 600,
    minWidth: 480,
    minHeight: 380,
    mount(body, win) {
      let notes = OS.util.loadJSON(KEY, null);
      if (!Array.isArray(notes)) notes = defaultNotes();
      notes = notes.filter((n) => n && typeof n.text === "string");
      let nextColor = notes.length % COLORS.length;

      body.innerHTML = `
        <div class="app notes">
          <div class="app-toolbar">
            <button class="btn sm primary" data-act="add">${OS.util.icon("plus")} Новая заметка</button>
            <div class="grow"></div>
            <span class="notes-count muted small"></span>
          </div>
          <div class="notes-board"></div>
          <div class="notes-empty hidden">
            ${OS.util.icon("notes")}
            <b>Список заметок пуст</b>
            <span>Создайте первую заметку — она сохранится в браузере.</span>
            <button class="btn sm primary" data-act="add">${OS.util.icon("plus")} Создать заметку</button>
          </div>
          <div class="app-status">
            <span class="notes-status">Сохранено</span>
            <span>Автосохранение · localStorage</span>
          </div>
        </div>`;

      const board = body.querySelector(".notes-board");
      const empty = body.querySelector(".notes-empty");
      const countEl = body.querySelector(".notes-count");
      const statusEl = body.querySelector(".notes-status");

      function save() {
        OS.util.saveJSON(KEY, notes);
        statusEl.textContent = "Сохранено · " + OS.util.fmtTime(new Date(), true);
      }

      const saveSoon = OS.util.debounce(save, 400);

      function fmtDate(ts) {
        try {
          return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(ts));
        } catch {
          return "";
        }
      }

      function render() {
        board.innerHTML = "";
        empty.classList.toggle("hidden", notes.length > 0);
        board.classList.toggle("hidden", notes.length === 0);
        countEl.textContent = `${notes.length} ${notes.length === 1 ? "заметка" : notes.length > 1 && notes.length < 5 ? "заметки" : "заметок"}`;

        notes.forEach((note) => {
          const palette = COLORS[note.color % COLORS.length] || COLORS[0];
          const card = document.createElement("article");
          card.className = "note";
          card.style.setProperty("--note-bg", palette.bg);
          card.style.setProperty("--note-ink", palette.ink);
          card.style.setProperty("--note-accent", palette.accent);
          card.innerHTML = `
            <div class="note-top">
              <button class="note-color" type="button" title="Сменить цвет"></button>
              <button class="note-del" type="button" title="Удалить заметку">${OS.util.icon("trash")}</button>
            </div>
            <textarea class="note-text" placeholder="Текст заметки…" spellcheck="false"></textarea>
            <div class="note-foot"><span>${fmtDate(note.updated)}</span><span class="note-saved">сохранено</span></div>`;

          const ta = card.querySelector(".note-text");
          ta.value = note.text;

          ta.addEventListener("input", () => {
            note.text = ta.value;
            note.updated = Date.now();
            card.querySelector(".note-foot span").textContent = fmtDate(note.updated);
            statusEl.textContent = "Сохранение…";
            saveSoon();
          });
          ta.addEventListener("blur", () => save());

          card.querySelector(".note-color").addEventListener("click", () => {
            note.color = ((note.color || 0) + 1) % COLORS.length;
            const p = COLORS[note.color];
            card.style.setProperty("--note-bg", p.bg);
            card.style.setProperty("--note-ink", p.ink);
            card.style.setProperty("--note-accent", p.accent);
            save();
            OS.sound.play("click");
          });

          card.querySelector(".note-del").addEventListener("click", async () => {
            const ok = await OS.ui.confirm({
              title: "Удалить заметку?",
              text: note.text.trim() ? note.text.slice(0, 120) + (note.text.length > 120 ? "…" : "") : "Пустая заметка",
              okText: "Удалить",
              danger: true,
            });
            if (!ok) return;
            notes = notes.filter((n) => n.id !== note.id);
            save();
            render();
          });

          board.appendChild(card);
        });
      }

      function addNote() {
        const note = {
          id: OS.util.uid("note"),
          text: "",
          color: nextColor++ % COLORS.length,
          updated: Date.now(),
        };
        notes.unshift(note);
        save();
        render();
        const first = board.querySelector(".note-text");
        if (first) first.focus();
        OS.sound.play("click");
      }

      body.querySelectorAll('[data-act="add"]').forEach((btn) => btn.addEventListener("click", addNote));

      win.onClose(() => save());

      render();
      win.setTitle("Заметки");
      win.setSubtitle(`${notes.length} заметок`);
      const unsub = OS.wm ? null : null;
      void unsub;
    },
  });
})();
