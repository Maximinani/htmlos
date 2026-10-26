/* ══════════════════════════════════════════════════════════════════════
   HTML OS — приложение «Терминал»
   ══════════════════════════════════════════════════════════════════════ */
(() => {
  const { escapeHtml } = OS.util;

  const COMMANDS = [
    ["help", "список команд"],
    ["ls [путь]", "содержимое папки"],
    ["cd [путь]", "перейти в папку"],
    ["pwd", "текущий путь"],
    ["cat <файл>", "показать файл"],
    ["mkdir <имя>", "создать папку"],
    ["touch <имя>", "создать пустой файл"],
    ["rm [-r] <путь>", "удалить файл или папку"],
    ["echo <текст> [> файл]", "вывести текст или записать в файл"],
    ["open <приложение|файл>", "открыть приложение или файл"],
    ["apps", "список приложений"],
    ["theme [dark|light]", "сменить тему"],
    ["wallpaper [id]", "сменить или показать обои"],
    ["volume <0-100>", "громкость звуков"],
    ["settings", "открыть настройки"],
    ["date", "дата и время"],
    ["whoami", "текущий пользователь"],
    ["neofetch", "сведения о системе"],
    ["history", "история команд"],
    ["clear", "очистить экран"],
    ["exit", "закрыть терминал"],
  ];

  OS.registerApp({
    id: "terminal",
    name: "Терминал",
    icon: "⌨️",
    color: ["#334155", "#0f172a"],
    width: 780,
    height: 500,
    minWidth: 420,
    minHeight: 300,
    mount(body, win) {
      let cwd = [];
      let histIdx = 0;
      const hist = [];

      body.innerHTML = `
        <div class="app terminal">
          <div class="term-body">
            <div class="term-out"></div>
            <div class="term-input-line">
              <span class="term-prompt"></span>
              <input class="term-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Команда">
            </div>
          </div>
          <div class="app-status">
            <span class="term-cwd">/</span>
            <span>help — команды · ↑↓ — история · Ctrl+L — очистка</span>
          </div>
        </div>`;

      const out = body.querySelector(".term-out");
      const input = body.querySelector(".term-input");
      const promptEl = body.querySelector(".term-prompt");
      const cwdEl = body.querySelector(".term-cwd");

      const user = () => OS.settings.get("username")?.trim() || "Гость";

      function displayPath(path = cwd) {
        if (!path.length) return "/";
        const home = OS.fs.HOME;
        if (path.length >= home.length && home.every((p, i) => path[i] === p)) {
          const rest = path.slice(home.length);
          return rest.length ? "~/" + rest.join("/") : "~";
        }
        return "/" + path.join("/");
      }

      function refreshPrompt() {
        promptEl.innerHTML = `<b>${escapeHtml(user())}</b>@htmlos:${escapeHtml(displayPath())}$`;
        cwdEl.textContent = displayPath();
        win.setSubtitle(displayPath());
      }

      function scrollBottom() {
        const term = body.querySelector(".term-body");
        term.scrollTop = term.scrollHeight;
      }

      function print(text = "", cls = "") {
        const div = document.createElement("div");
        div.className = "term-line " + cls;
        div.textContent = text;
        out.appendChild(div);
        scrollBottom();
      }

      function printHTML(html, cls = "") {
        const div = document.createElement("div");
        div.className = "term-line " + cls;
        div.innerHTML = html;
        out.appendChild(div);
        scrollBottom();
      }

      function echoCommand(cmd) {
        printHTML(`<span class="term-prompt"><b>${escapeHtml(user())}</b>@htmlos:${escapeHtml(displayPath())}$</span> ${escapeHtml(cmd)}`, "term-cmd");
      }

      function parseArgs(str) {
        const args = [];
        const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
        let m;
        while ((m = re.exec(str))) {
          args.push(m[1] ?? m[2] ?? m[3]);
        }
        return args;
      }

      function resolve(arg) {
        if (!arg) return [...cwd];
        let value = arg;
        if (value === "~") return [...OS.fs.HOME];
        if (value.startsWith("~/")) return [...OS.fs.HOME, ...value.slice(2).split("/").filter(Boolean)];
        const parts = value.startsWith("/") ? [] : [...cwd];
        value.split("/").filter(Boolean).forEach((part) => {
          if (part === ".") return;
          if (part === "..") parts.pop();
          else parts.push(part);
        });
        return parts;
      }

      function err(text) {
        print(text, "term-err");
      }

      function showHelp() {
        print("Доступные команды:", "term-dim");
        COMMANDS.forEach(([cmd, desc]) => {
          printHTML(`  <span class="term-accent">${escapeHtml(cmd.padEnd(22, " "))}</span><span class="term-dim">${escapeHtml(desc)}</span>`);
        });
        print("");
        print("Подсказка: имя файла с пробелами заключите в кавычки.", "term-dim");
      }

      function cmdLs(args) {
        const p = args[0] ? resolve(args[0]) : cwd;
        if (!OS.fs.isDir(p)) return err(`ls: «${args[0] || displayPath(p)}» — не папка`);
        const entries = OS.fs.list(p);
        if (!entries.length) return print("(пусто)", "term-dim");
        entries.forEach((entry) => {
          if (entry.isFolder) {
            printHTML(`<span class="term-accent">📁 ${escapeHtml(entry.name)}/</span>`);
          } else {
            const size = OS.util.formatBytes((entry.node.content || entry.node.data || "").length * 2);
            printHTML(`📄 ${escapeHtml(entry.name)} <span class="term-dim">${size}</span>`);
          }
        });
        return undefined;
      }

      function cmdCd(args) {
        if (!args[0] || args[0] === "~") {
          cwd = [...OS.fs.HOME];
        } else {
          const p = resolve(args[0]);
          if (!OS.fs.isDir(p)) return err(`cd: «${args[0]}» — не папка`);
          cwd = p;
        }
        refreshPrompt();
        return undefined;
      }

      function cmdCat(args) {
        if (!args[0]) return err("cat: укажите файл");
        const p = resolve(args[0]);
        const content = OS.fs.read(p);
        if (content == null) return err(`cat: «${args[0]}» — файл не найден`);
        print(content || "(пустой файл)");
        return undefined;
      }

      function cmdMkdir(args) {
        if (!args[0]) return err("mkdir: укажите имя папки");
        try {
          OS.fs.mkdir(cwd, args[0]);
          print(`Папка «${args[0]}» создана`, "term-ok");
        } catch (e) {
          err("mkdir: " + e.message);
        }
        return undefined;
      }

      function cmdTouch(args) {
        if (!args[0]) return err("touch: укажите имя файла");
        const p = resolve(args[0]);
        if (OS.fs.exists(p)) return print("Файл уже существует", "term-dim");
        try {
          OS.fs.write(p, "");
          print(`Файл «${args[0]}» создан`, "term-ok");
        } catch (e) {
          err("touch: " + e.message);
        }
        return undefined;
      }

      function cmdRm(args) {
        const recursive = args.includes("-r") || args.includes("-rf");
        const target = args.find((a) => !a.startsWith("-"));
        if (!target) return err("rm: укажите файл или папку");
        const p = resolve(target);
        if (!OS.fs.exists(p)) return err(`rm: «${target}» не найден`);
        if (OS.fs.isDir(p) && !recursive) return err("rm: это папка. Используйте rm -r");
        try {
          OS.fs.remove(p);
          print(`Удалено: ${target}`, "term-ok");
        } catch (e) {
          err("rm: " + e.message);
        }
        return undefined;
      }

      function cmdEcho(args, redirect) {
        const text = args.join(" ");
        if (!redirect) {
          print(text);
          return undefined;
        }
        const p = resolve(redirect);
        try {
          OS.fs.ensureDir(p.slice(0, -1));
          OS.fs.write(p, text);
          print(`Записано в «${redirect}»`, "term-ok");
        } catch (e) {
          err("echo: " + e.message);
        }
        return undefined;
      }

      function openPath(p) {
        if (!OS.fs.exists(p)) return false;
        if (OS.fs.isDir(p)) {
          OS.wm.open("files", { path: p });
          return true;
        }
        const name = p[p.length - 1];
        const node = OS.fs.get(p);
        if (node.data || node.src || OS.util.fileKind(name) === "image") {
          OS.wm.open("gallery", { preview: node.data || node.src, title: name });
          return true;
        }
        if (OS.util.fileKind(name) === "text") {
          OS.wm.open("notepad", { path: p });
          return true;
        }
        return false;
      }

      function cmdOpen(args) {
        if (!args[0]) return err("open: укажите приложение или файл (apps — список)");
        const arg = args.join(" ");
        const p = resolve(arg);
        if (OS.fs.exists(p) && openPath(p)) {
          print(`Открыто: ${arg}`, "term-ok");
          return undefined;
        }
        const app = OS.wm.find(arg);
        if (!app) return err(`open: «${arg}» не найдено. Введите apps`);
        OS.wm.open(app.id);
        print(`Запуск: ${app.name}`, "term-ok");
        return undefined;
      }

      function cmdApps() {
        OS.wm.all().forEach((app) => {
          printHTML(`<span class="term-accent">${escapeHtml(app.id.padEnd(14, " "))}</span><span class="term-dim">${escapeHtml(app.name)}</span>`);
        });
        return undefined;
      }

      function cmdTheme(args) {
        const value = (args[0] || "").toLowerCase();
        if (!value) return print(`Текущая тема: ${OS.settings.get("theme")}`);
        if (value === "toggle") {
          const next = OS.settings.get("theme") === "dark" ? "light" : "dark";
          OS.settings.set("theme", next);
          return print(`Тема: ${next}`, "term-ok");
        }
        if (!["dark", "light"].includes(value)) return err("theme: доступно dark, light или toggle");
        OS.settings.set("theme", value);
        print(`Тема: ${value}`, "term-ok");
        return undefined;
      }

      function cmdWallpaper(args) {
        if (!args[0]) {
          print("Обои:");
          OS.wallpapers.forEach((w, i) => {
            printHTML(`  <span class="term-accent">${String(i + 1).padStart(2, " ")}. ${escapeHtml(w.id.padEnd(10, " "))}</span><span class="term-dim">${escapeHtml(w.name)}</span>`);
          });
          print(`Текущие: ${OS.settings.get("wallpaper")}`, "term-dim");
          return undefined;
        }
        const value = args[0].toLowerCase();
        const index = Number(value);
        const found = OS.wallpapers.find((w) => w.id === value || w.name.toLowerCase() === value)
          || (Number.isInteger(index) && index >= 1 && index <= OS.wallpapers.length ? OS.wallpapers[index - 1] : null);
        if (!found) return err("wallpaper: нет таких обоев. Введите wallpaper без аргументов");
        OS.settings.set("wallpaper", found.id);
        print(`Обои: ${found.name}`, "term-ok");
        return undefined;
      }

      function cmdVolume(args) {
        if (!args[0]) return print(`Громкость: ${Math.round(OS.settings.get("volume") * 100)}%`);
        const val = Number(args[0]);
        if (!Number.isFinite(val)) return err("volume: укажите число от 0 до 100");
        OS.settings.set("volume", OS.util.clamp(val, 0, 100) / 100);
        OS.sound.play("notify");
        print(`Громкость: ${Math.round(OS.settings.get("volume") * 100)}%`, "term-ok");
        return undefined;
      }

      function cmdNeofetch() {
        const logo = `   ┌───────────────────────┐
   │   < / >    H T M L    │
   │              O S      │
   └───────────────────────┘`;
        print(logo, "term-pre");
        printHTML(`<span class="term-accent">${escapeHtml(user())}</span>@<span class="term-accent">htmlos</span>`);
        print("──────────────────────────", "term-dim");
        printHTML(`<span class="term-accent">ОС:</span> HTML OS 1.0 «Aurora»`);
        printHTML(`<span class="term-accent">Ядро:</span> JavaScript ${navigator.userAgent.includes("Edg") ? "(Edge)" : ""}`);
        printHTML(`<span class="term-accent">Оболочка:</span> htmlsh 1.0`);
        printHTML(`<span class="term-accent">Разрешение:</span> ${screen.width}×${screen.height}`);
        printHTML(`<span class="term-accent">Приложений:</span> ${OS.wm.all().length}`);
        printHTML(`<span class="term-accent">Файлов:</span> ${OS.fs.stats().files}`);
        printHTML(`<span class="term-accent">Тема:</span> ${OS.settings.get("theme")}`);
        printHTML(`<span class="term-accent">Обои:</span> ${OS.settings.wallpaper().name}`);
        const used = OS.util.storageSize();
        printHTML(`<span class="term-accent">Хранилище:</span> ${OS.util.formatBytes(used)}`);
        return undefined;
      }

      function cmdDate() {
        const now = new Date();
        print(`${OS.util.fmtDateFull(now)}, ${OS.util.fmtTime(now, true)}`);
        return undefined;
      }

      function execute(raw) {
        const trimmed = raw.trim();
        if (!trimmed) {
          echoCommand("");
          return;
        }
        echoCommand(trimmed);
        hist.push(trimmed);
        if (hist.length > 100) hist.shift();
        histIdx = hist.length;

        let line = trimmed;
        let redirect = null;
        const redir = line.match(/^(.*?)\s+>\s+("[^"]+"|'[^']+'|\S+)\s*$/);
        if (redir) {
          line = redir[1];
          redirect = redir[2].replace(/^["']|["']$/g, "");
        }

        const args = parseArgs(line);
        const cmd = (args.shift() || "").toLowerCase();

        switch (cmd) {
          case "help": showHelp(); break;
          case "ls": cmdLs(args); break;
          case "cd": cmdCd(args); break;
          case "pwd": print("/" + cwd.join("/")); break;
          case "cat": cmdCat(args); break;
          case "mkdir": cmdMkdir(args); break;
          case "touch": cmdTouch(args); break;
          case "rm": cmdRm(args); break;
          case "echo": cmdEcho(args, redirect); break;
          case "open": cmdOpen(args); break;
          case "apps": cmdApps(); break;
          case "theme": cmdTheme(args); break;
          case "wallpaper": cmdWallpaper(args); break;
          case "volume": cmdVolume(args); break;
          case "settings": OS.wm.open("settings"); print("Настройки открыты", "term-ok"); break;
          case "date": cmdDate(); break;
          case "whoami": print(user()); break;
          case "neofetch": cmdNeofetch(); break;
          case "history": hist.forEach((h, i) => print(`${String(i + 1).padStart(3, " ")}  ${h}`)); break;
          case "clear": out.innerHTML = ""; break;
          case "exit": win.close(); break;
          case "uname": print("HTML OS 1.0 Aurora browser-edition"); break;
          case "sudo": print("Пользователь не входит в список sudoers. Инцидент будет зарегистрирован. 🙂", "term-warn"); break;
          case "about": OS.wm.open("about"); break;
          default:
            err(`htmlsh: команда не найдена: ${cmd}. Введите help`);
        }
        refreshPrompt();
      }

      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          const value = input.value;
          input.value = "";
          execute(value);
          e.preventDefault();
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          if (histIdx > 0) {
            histIdx--;
            input.value = hist[histIdx] || "";
            setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0);
          }
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          if (histIdx < hist.length - 1) {
            histIdx++;
            input.value = hist[histIdx] || "";
          } else {
            histIdx = hist.length;
            input.value = "";
          }
        } else if (e.key === "l" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          out.innerHTML = "";
        } else if (e.key === "c" && e.ctrlKey) {
          e.preventDefault();
          print(input.value + "^C", "term-dim");
          input.value = "";
        }
      });

      body.querySelector(".term-body").addEventListener("click", (e) => {
        if (window.getSelection()?.toString()) return;
        if (!e.target.closest("input")) input.focus();
      });

      const unsubSettings = OS.settings.onChange(() => refreshPrompt());
      win.onClose(unsubSettings);
      win.onFocus(() => setTimeout(() => input.focus(), 20));

      refreshPrompt();
      print("HTML OS Terminal [версия 1.0.0]", "term-dim");
      print("Введите «help», чтобы увидеть список команд.", "term-dim");
      print("");
      win.setTitle("Терминал");
      setTimeout(() => input.focus(), 250);
    },
  });
})();
