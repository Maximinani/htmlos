/* ══════════════════════════════════════════════════════════════════════
   HTML OS — виртуальная файловая система (localStorage)
   ══════════════════════════════════════════════════════════════════════ */
OS.fs = (() => {
  const KEY = "htmlos.fs.v1";
  const listeners = [];
  let root = null;

  const folder = (children = {}) => ({ type: "folder", children });
  const file = (content = "", extra = {}) => ({ type: "file", content, ...extra });

  function seed() {
    const en = OS.i18n?.lang !== "ru";
    const L = (ru, english) => (en ? english : ru);
    return folder({
      "Рабочий стол": folder({
        "Добро пожаловать.txt": file(L(
`Добро пожаловать в HTML OS 1.0 «Aurora»!
════════════════════════════════════════

Это операционная система, которая живёт прямо в браузере.
Здесь есть окна, файлы, настройки, обои и полтора десятка приложений.

Что попробовать:
• Откройте «Настройки» и смените обои, тему или акцентный цвет.
• Напишите что-нибудь в «Блокноте» и сохраните файл — он появится
  здесь, в «Файлах».
• Загляните в «Терминал» и введите help.
• Сыграйте в «Сапёра» или «2048» в приложении «Игры».
• Включите музыку в «Плеере» — она синтезируется в реальном времени.

Все данные хранятся локально в вашем браузере и никуда не отправляются.
Приятной работы!`,
`Welcome to HTML OS 1.0 “Aurora”!
════════════════════════════════════════

This is an operating system that lives right in your browser.
It has windows, files, settings, wallpapers and fourteen apps.

Things to try:
• Open Settings and change the wallpaper, theme or accent color.
• Write something in Notepad and save the file — it will appear
  here, in Files.
• Open Terminal and type help.
• Play Minesweeper or 2048 in Games.
• Start some music in the Player — it is synthesized in real time.

All data is stored locally in your browser and never sent anywhere.
Enjoy!`
        )),
        "Мои идеи.txt": file(L(
`Идеи для HTML OS
----------------
1. Корзина и восстановление удалённых файлов.
2. Перетаскивание файлов между папками.
3. Виртуальные рабочие столы.
4. Синхронизация настроек между вкладками.
5. Больше обоев и тем оформления.

Статус: черновик.
`,
`Ideas for HTML OS
-----------------
1. Recycle bin and file recovery.
2. Drag and drop files between folders.
3. Virtual desktops.
4. Sync settings between tabs.
5. More wallpapers and themes.

Status: draft.
`
        )),
      }),
      "Документы": folder({
        "О системе.txt": file(L(
`HTML OS 1.0 «Aurora»
====================

Тип:        операционная система в браузере
Ядро:       JavaScript (vanilla)
Интерфейс:  HTML5 + CSS3
Хранилище:  localStorage
Приложений: 14
Обоев:      10

HTML OS не является настоящей операционной системой:
это интерактивная имитация рабочего стола, созданная
как демонстрация возможностей веб-платформы.
`,
`HTML OS 1.0 “Aurora”
====================

Type:        operating system in a browser
Kernel:      JavaScript (vanilla)
Interface:   HTML5 + CSS3
Storage:     localStorage
Apps:        14
Wallpapers:  10

HTML OS is not a real operating system:
it is an interactive desktop simulation built
to showcase the capabilities of the web platform.
`
        )),
        "Список дел.txt": file(L(
`Список дел
──────────
[ ] Сменить обои на «Космос»
[ ] Пройти Сапёра без ошибок
[ ] Написать заметку в «Заметках»
[ ] Собрать 2048
[ ] Послушать все треки в плеере
[x] Установить HTML OS
`,
`To-do list
──────────
[ ] Set the Space wallpaper
[ ] Beat Minesweeper without mistakes
[ ] Write a note in Notes
[ ] Reach 2048
[ ] Listen to every track in the player
[x] Install HTML OS
`
        )),
        "Проекты": folder({
          "План.txt": file(L(
`План проекта «HTML OS 2.0»
──────────────────────────
1. Компоненты окон: вкладки, прикрепление, группы.
2. Файловый менеджер: drag & drop, корзина, поиск.
3. Учётные записи и несколько профилей.
4. Магазин приложений (локальный).
5. Синхронизация настроек через JSON-файл.
`,
`HTML OS 2.0 project plan
────────────────────────
1. Window components: tabs, snapping, groups.
2. File manager: drag & drop, recycle bin, search.
3. User accounts and multiple profiles.
4. App store (local).
5. Settings sync via a JSON file.
`
          )),
        }),
      }),
      "Изображения": folder({
        "Аврора.svg": file("", { src: "assets/wallpapers/aurora.svg" }),
        "Закат.svg": file("", { src: "assets/wallpapers/sunset.svg" }),
        "Неон.svg": file("", { src: "assets/wallpapers/neon.svg" }),
        "Космос.svg": file("", { src: "assets/wallpapers/cosmic.svg" }),
      }),
      "Музыка": folder({
        "Плейлист.txt": file(L(
`Плейлист «Ночная смена»
───────────────────────
1. Ночной город        — синтвейв
2. Неоновый дождь      — synthwave
3. Глубокий космос     — ambient
4. Утренний кофе       — lo-fi

Всё синтезируется в браузере: ни одного аудиофайла.
Откройте приложение «Музыка».
`,
`Playlist “Night Shift”
──────────────────────
1. Night City        — synthwave
2. Neon Rain         — synthwave
3. Deep Space        — ambient
4. Morning Coffee    — lo-fi

Everything is synthesized in the browser: not a single audio file.
Open the Music app.
`
        )),
      }),
      "Загрузки": folder({
        "readme.txt": file(L(
`Папка «Загрузки»
────────────────
Здесь появляются файлы, сохранённые из приложений.
Пока пусто — самое время что-нибудь нарисовать в «Рисовании»
и сохранить рисунок в «Галерею».
`,
`Downloads folder
────────────────
Files saved from apps appear here.
Empty for now — a good time to draw something in Paint
and save it to Gallery.
`
        )),
      }),
    });
  }

  function norm(path) {
    if (Array.isArray(path)) return path.filter((x) => x !== "" && x != null);
    if (path == null) return [];
    return String(path).split("/").map((s) => s.trim()).filter(Boolean);
  }

  function pathString(path) {
    const p = norm(path);
    return "/" + p.join("/");
  }

  function get(path) {
    const parts = norm(path);
    let node = root;
    for (const part of parts) {
      if (!node || node.type !== "folder") return null;
      node = node.children[part];
      if (!node) return null;
    }
    return node;
  }

  function exists(path) {
    return !!get(path);
  }

  function isDir(path) {
    return get(path)?.type === "folder";
  }

  function getParent(path) {
    const parts = norm(path);
    const name = parts.pop();
    return { parts, name, parent: get(parts) };
  }

  function uniqueName(dirPath, name) {
    const dir = get(dirPath);
    if (!dir || dir.type !== "folder") return name;
    if (!dir.children[name]) return name;
    const dot = name.lastIndexOf(".");
    const base = dot > 0 ? name.slice(0, dot) : name;
    const ext = dot > 0 ? name.slice(dot) : "";
    let i = 2;
    while (dir.children[`${base} (${i})${ext}`]) i++;
    return `${base} (${i})${ext}`;
  }

  function ensureDir(path) {
    const parts = norm(path);
    let node = root;
    for (const part of parts) {
      if (!node.children[part]) node.children[part] = folder();
      node = node.children[part];
      if (node.type !== "folder") throw new Error(`«${part}» — это файл, а не папка`);
    }
    return node;
  }

  function mkdir(dirPath, name) {
    const dir = get(dirPath);
    if (!dir || dir.type !== "folder") throw new Error("Папка назначения не найдена");
    const clean = String(name || "").trim();
    if (!clean) throw new Error("Введите имя папки");
    if (/[\\/:*?"<>|]/.test(clean)) throw new Error("Имя содержит недопустимые символы");
    if (dir.children[clean]) throw new Error("Папка или файл с таким именем уже существует");
    dir.children[clean] = folder();
    persist();
    return clean;
  }

  function write(filePath, content = "", extra = {}) {
    const parts = norm(filePath);
    if (!parts.length) throw new Error("Не указано имя файла");
    const name = parts.pop();
    if (!name) throw new Error("Не указано имя файла");
    const dir = ensureDir(parts);
    if (dir.children[name]?.type === "folder") throw new Error("Это папка, а не файл");
    dir.children[name] = {
      type: "file",
      content: String(content ?? ""),
      ...(dir.children[name]?.src ? { src: dir.children[name].src } : {}),
      ...(dir.children[name]?.data ? { data: dir.children[name].data } : {}),
      ...extra,
      updated: Date.now(),
    };
    persist();
    return name;
  }

  function remove(path) {
    const parts = norm(path);
    if (parts.length <= 1) throw new Error("Системную папку нельзя удалить");
    const { parent, name } = getParent(parts);
    if (!parent || parent.type !== "folder" || !parent.children[name]) throw new Error("Файл не найден");
    delete parent.children[name];
    persist();
  }

  function rename(path, newName) {
    const parts = norm(path);
    if (parts.length <= 1) throw new Error("Системную папку нельзя переименовать");
    const clean = String(newName || "").trim();
    if (!clean) throw new Error("Введите новое имя");
    if (/[\\/:*?"<>|]/.test(clean)) throw new Error("Имя содержит недопустимые символы");
    const { parent, name } = getParent(parts);
    if (!parent || !parent.children[name]) throw new Error("Файл не найден");
    if (name === clean) return clean;
    if (parent.children[clean]) throw new Error("Имя уже занято");
    const node = parent.children[name];
    delete parent.children[name];
    parent.children[clean] = node;
    persist();
    return clean;
  }

  function read(path) {
    const node = get(path);
    if (!node || node.type !== "file") return null;
    return node.content ?? "";
  }

  function list(path) {
    const dir = get(path);
    if (!dir || dir.type !== "folder") return [];
    return Object.entries(dir.children)
      .map(([name, node]) => ({ name, node, path: [...norm(path), name], isFolder: node.type === "folder" }))
      .sort((a, b) => {
        if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
        return a.name.localeCompare(b.name, "ru");
      });
  }

  function walk(path, cb) {
    list(path).forEach((entry) => {
      cb(entry);
      if (entry.isFolder) walk(entry.path, cb);
    });
  }

  function allFiles(path = []) {
    const out = [];
    walk(path, (e) => { if (!e.isFolder) out.push(e); });
    return out;
  }

  function stats() {
    let files = 0, folders = 0, bytes = 0;
    walk([], (e) => {
      if (e.isFolder) folders++;
      else {
        files++;
        bytes += (e.node.content || "").length + (e.node.data || "").length;
      }
    });
    return { files, folders, bytes };
  }

  function persist() {
    OS.util.saveJSON(KEY, root);
    listeners.forEach((fn) => { try { fn(root); } catch (e) { console.error(e); } });
    window.dispatchEvent(new CustomEvent("os:fs-change", { detail: { root } }));
  }

  function onChange(fn) {
    listeners.push(fn);
    return () => {
      const i = listeners.indexOf(fn);
      if (i >= 0) listeners.splice(i, 1);
    };
  }

  function reset() {
    root = seed();
    persist();
  }

  function init() {
    const saved = OS.util.loadJSON(KEY, null);
    if (saved && saved.type === "folder" && saved.children) root = saved;
    else {
      root = seed();
      OS.util.saveJSON(KEY, root);
    }
  }

  const HOME = ["Рабочий стол"];

  return {
    HOME,
    init, reset, seed,
    norm, pathString, get, getParent, exists, isDir,
    ensureDir, mkdir, write, remove, rename, read, list,
    walk, allFiles, stats, onChange, uniqueName,
  };
})();
