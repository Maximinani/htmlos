/* ══════════════════════════════════════════════════════════════════════
   HTML OS — приложение «Игры»: Сапёр и 2048
   ══════════════════════════════════════════════════════════════════════ */
(() => {
  const LEVELS = {
    easy: { cols: 9, rows: 9, mines: 10, label: "Новичок · 9×9" },
    medium: { cols: 10, rows: 10, mines: 18, label: "Средний · 10×10" },
    hard: { cols: 12, rows: 12, mines: 30, label: "Сложный · 12×12" },
  };
  const BEST_KEY = "htmlos.2048.best";
  const LEVEL_KEY = "htmlos.mines.level";
  const NUM = ["", "1", "2", "3", "4", "5", "6", "7", "8"];

  OS.registerApp({
    id: "games",
    name: "Игры",
    icon: "🎮",
    color: ["#f59e0b", "#ef4444"],
    width: 760,
    height: 660,
    minWidth: 480,
    minHeight: 480,
    mount(body, win) {
      let game = "mines";

      body.innerHTML = `
        <div class="app games">
          <div class="app-toolbar">
            <div class="seg game-tabs">
              <button class="seg-btn active" data-game="mines">💣 Сапёр</button>
              <button class="seg-btn" data-game="g2048">🔢 2048</button>
            </div>
            <div class="grow"></div>
            <select class="select mines-level" title="Сложность">
              ${Object.entries(LEVELS).map(([id, l]) => `<option value="${id}">${l.label}</option>`).join("")}
            </select>
            <button class="btn sm" data-act="reset">${OS.util.icon("refresh")} Новая игра</button>
          </div>
          <div class="game-views">
            <div class="game-view mines-view active">
              <div class="ms-head">
                <div class="ms-counter" title="Осталось мин">🚩 <b>0</b></div>
                <button class="ms-face" type="button" title="Новая игра">🙂</button>
                <div class="ms-timer" title="Время">⏱ <b>0</b></div>
              </div>
              <div class="ms-grid"></div>
              <div class="ms-tip">ЛКМ — открыть · ПКМ — флажок · двойной клик — открыть соседей</div>
            </div>

            <div class="game-view g2048-view">
              <div class="g2-head">
                <div class="g2-stat"><span>Счёт</span><b class="g2-score">0</b></div>
                <div class="g2-stat"><span>Рекорд</span><b class="g2-best">0</b></div>
                <div class="grow"></div>
                <button class="btn sm" data-act="new2048">${OS.util.icon("plus")} Новая</button>
              </div>
              <div class="g2-wrap">
                <div class="g2-board">
                  <div class="g2-overlay hidden">
                    <b class="g2-msg">Игра окончена</b>
                    <span class="g2-sub">Попробуйте ещё раз</span>
                    <button class="btn primary sm" data-act="overlay-btn">Заново</button>
                  </div>
                </div>
              </div>
              <div class="g2-dpad">
                <button data-dir="up" title="Вверх">${OS.util.icon("up")}</button>
                <button data-dir="left" title="Влево">${OS.util.icon("left")}</button>
                <button data-dir="down" title="Вниз">${OS.util.icon("down")}</button>
                <button data-dir="right" title="Вправо">${OS.util.icon("right")}</button>
              </div>
              <div class="g2-tip">Стрелки, WASD или свайп — сдвинуть плитки</div>
            </div>
          </div>
          <div class="app-status">
            <span class="games-status">Сапёр · новичок</span>
            <span class="games-hint">ЛКМ — открыть · ПКМ — флажок</span>
          </div>
        </div>`;

      const tabs = body.querySelector(".game-tabs");
      const views = body.querySelectorAll(".game-view");
      const levelSelect = body.querySelector(".mines-level");
      const statusEl = body.querySelector(".games-status");
      const hintEl = body.querySelector(".games-hint");
      const resetBtn = body.querySelector('[data-act="reset"]');

      /* ═══════════════ Сапёр ═══════════════ */
      const msGrid = body.querySelector(".ms-grid");
      const msFace = body.querySelector(".ms-face");
      const msCounter = body.querySelector(".ms-counter b");
      const msTimer = body.querySelector(".ms-timer b");

      let cols = 9, rows = 9, mineCount = 10;
      let cells = [];
      let started = false;
      let over = false;
      let timer = 0;
      let timerId = null;
      let flags = 0;

      levelSelect.value = OS.util.loadJSON(LEVEL_KEY, "easy");
      if (!LEVELS[levelSelect.value]) levelSelect.value = "easy";

      function newMines() {
        const level = LEVELS[levelSelect.value] || LEVELS.easy;
        cols = level.cols;
        rows = level.rows;
        mineCount = level.mines;
        cells = Array.from({ length: cols * rows }, () => ({ mine: false, rev: false, flag: false, n: 0 }));
        started = false;
        over = false;
        flags = 0;
        timer = 0;
        clearInterval(timerId);
        timerId = null;
        msTimer.textContent = "0";
        msFace.textContent = "🙂";
        msCounter.textContent = String(mineCount);
        msGrid.style.setProperty("--cols", cols);
        msGrid.classList.remove("lost", "won");
        renderMines();
        hintEl.textContent = "ЛКМ — открыть · ПКМ — флажок";
        statusEl.textContent = `Сапёр · ${level.label}`;
      }

      function neighbors(i) {
        const x = i % cols;
        const y = Math.floor(i / cols);
        const out = [];
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) out.push(ny * cols + nx);
          }
        }
        return out;
      }

      function placeMines(safe) {
        const banned = new Set([safe, ...neighbors(safe)]);
        const pool = cells.map((_, i) => i).filter((i) => !banned.has(i));
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        pool.slice(0, mineCount).forEach((i) => { cells[i].mine = true; });
        cells.forEach((cell, i) => {
          cell.n = neighbors(i).filter((j) => cells[j].mine).length;
        });
      }

      function startTimer() {
        if (timerId) return;
        timerId = setInterval(() => {
          if (over) return;
          timer++;
          msTimer.textContent = String(timer);
        }, 1000);
      }

      function renderMines() {
        msGrid.innerHTML = cells.map((cell, i) => {
          const classes = ["ms-cell"];
          if (cell.rev) classes.push("open");
          if (cell.rev && cell.mine) classes.push("mine");
          if (cell.rev && !cell.mine && cell.n) classes.push("n" + cell.n);
          if (cell.flag && !cell.rev) classes.push("flag");
          if (cell.wrong) classes.push("wrong");
          return `<button class="${classes.join(" ")}" data-i="${i}" type="button">${cell.rev && !cell.mine && cell.n ? NUM[cell.n] : ""}</button>`;
        }).join("");
        msCounter.textContent = String(mineCount - flags);
      }

      function reveal(i) {
        const cell = cells[i];
        if (!cell || cell.rev || cell.flag || over) return;
        if (!started) {
          started = true;
          placeMines(i);
          startTimer();
        }
        if (cell.mine) {
          lose(i);
          return;
        }
        const queue = [i];
        while (queue.length) {
          const idx = queue.pop();
          const c = cells[idx];
          if (c.rev || c.flag) continue;
          c.rev = true;
          if (c.n === 0) {
            neighbors(idx).forEach((n) => {
              if (!cells[n].rev && !cells[n].flag) queue.push(n);
            });
          }
        }
        checkWin();
        renderMines();
      }

      function toggleFlag(i) {
        const cell = cells[i];
        if (!cell || cell.rev || over) return;
        cell.flag = !cell.flag;
        flags += cell.flag ? 1 : -1;
        if (cells.filter((c) => c.rev).length === 0) started = false;
        OS.sound.play("click");
        renderMines();
      }

      function lose(boomIndex) {
        over = true;
        clearInterval(timerId);
        timerId = null;
        msFace.textContent = "😵";
        msGrid.classList.add("lost");
        cells.forEach((c) => {
          if (c.mine) c.rev = true;
          if (c.flag && !c.mine) c.wrong = true;
        });
        renderMines();
        const boom = msGrid.querySelector(`[data-i="${boomIndex}"]`);
        if (boom) boom.classList.add("boom");
        statusEl.textContent = "Взрыв! Попробуйте ещё раз";
        OS.sound.play("error");
        OS.ui.notify({ title: "Сапёр", text: "Вы наступили на мину. Новая игра — кнопка «Новая игра».", icon: "💣", app: "games" });
      }

      function checkWin() {
        const safeTotal = cols * rows - mineCount;
        const opened = cells.filter((c) => c.rev && !c.mine).length;
        if (opened < safeTotal) return;
        over = true;
        clearInterval(timerId);
        timerId = null;
        msFace.textContent = "😎";
        msGrid.classList.add("won");
        cells.forEach((c) => { if (c.mine) c.flag = true; });
        flags = mineCount;
        renderMines();
        statusEl.textContent = `Победа! Время: ${timer} с`;
        OS.sound.play("notify");
        OS.ui.notify({ title: "Победа!", text: `Все мины найдены за ${timer} с.`, icon: "🏆", app: "games", timeout: 6000 });
      }

      function chord(i) {
        const cell = cells[i];
        if (!cell?.rev || !cell.n) return;
        const around = neighbors(i);
        const flagged = around.filter((j) => cells[j].flag).length;
        if (flagged !== cell.n) return;
        around.forEach((j) => {
          if (!cells[j].flag) {
            if (cells[j].mine) lose(j);
            else reveal(j);
          }
        });
      }

      msGrid.addEventListener("click", (e) => {
        const cell = e.target.closest("[data-i]");
        if (!cell) return;
        reveal(Number(cell.dataset.i));
      });
      msGrid.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        const cell = e.target.closest("[data-i]");
        if (!cell) return;
        toggleFlag(Number(cell.dataset.i));
      });
      msGrid.addEventListener("dblclick", (e) => {
        const cell = e.target.closest("[data-i]");
        if (!cell) return;
        chord(Number(cell.dataset.i));
      });
      msFace.addEventListener("click", newMines);
      levelSelect.addEventListener("change", () => {
        OS.util.saveJSON(LEVEL_KEY, levelSelect.value);
        newMines();
      });

      /* ═══════════════ 2048 ═══════════════ */
      const boardEl = body.querySelector(".g2-board");
      const scoreEl = body.querySelector(".g2-score");
      const bestEl = body.querySelector(".g2-best");
      const overlay = body.querySelector(".g2-overlay");
      const overlayMsg = body.querySelector(".g2-msg");
      const overlaySub = body.querySelector(".g2-sub");
      const overlayBtn = body.querySelector('[data-act="overlay-btn"]');

      let board = [];
      let score = 0;
      let best = OS.util.loadJSON(BEST_KEY, 0);
      let reached2048 = false;
      let gameOver = false;
      let winPending = false;
      const freshTiles = new Set();
      let touchStart = null;

      function new2048() {
        board = Array(16).fill(0);
        score = 0;
        reached2048 = false;
        gameOver = false;
        winPending = false;
        overlay.classList.add("hidden");
        freshTiles.clear();
        addTile();
        addTile();
        render2048();
      }

      function addTile() {
        const empty = board.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
        if (!empty.length) return;
        const i = empty[Math.floor(Math.random() * empty.length)];
        board[i] = Math.random() < 0.9 ? 2 : 4;
        freshTiles.add(i);
      }

      function lineIndices(dir) {
        const lines = [];
        if (dir === "left" || dir === "right") {
          for (let r = 0; r < 4; r++) {
            const line = [0, 1, 2, 3].map((c) => r * 4 + c);
            lines.push(dir === "left" ? line : line.reverse());
          }
        } else {
          for (let c = 0; c < 4; c++) {
            const line = [0, 1, 2, 3].map((r) => r * 4 + c);
            lines.push(dir === "up" ? line : line.reverse());
          }
        }
        return lines;
      }

      function move(dir) {
        if (gameOver || winPending) return;
        const next = new Array(16).fill(0);
        let moved = false;
        let gained = 0;
        lineIndices(dir).forEach((line) => {
          const values = line.map((i) => board[i]).filter((v) => v);
          const merged = [];
          for (let i = 0; i < values.length; i++) {
            if (values[i] === values[i + 1]) {
              const v = values[i] * 2;
              merged.push(v);
              gained += v;
              if (v === 2048) reached2048 = true;
              i++;
            } else {
              merged.push(values[i]);
            }
          }
          while (merged.length < 4) merged.push(0);
          line.forEach((idx, k) => { next[idx] = merged[k]; });
          if (line.some((idx, k) => board[idx] !== next[idx])) moved = true;
        });
        if (!moved) return;
        board = next;
        score += gained;
        if (score > best) {
          best = score;
          OS.util.saveJSON(BEST_KEY, best);
        }
        addTile();
        render2048();
        if (reached2048 && !winPending && !gameOver) {
          winPending = true;
          overlayMsg.textContent = "2048!";
          overlaySub.textContent = "Вы собрали плитку 2048. Продолжим?";
          overlayBtn.textContent = "Продолжить";
          overlay.classList.remove("hidden");
          OS.sound.play("notify");
          return;
        }
        if (!canMove()) {
          gameOver = true;
          overlayMsg.textContent = "Игра окончена";
          overlaySub.textContent = `Ваш счёт: ${score}`;
          overlayBtn.textContent = "Заново";
          overlay.classList.remove("hidden");
          OS.sound.play("error");
        }
      }

      function canMove() {
        if (board.includes(0)) return true;
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            const v = board[r * 4 + c];
            if (c < 3 && board[r * 4 + c + 1] === v) return true;
            if (r < 3 && board[(r + 1) * 4 + c] === v) return true;
          }
        }
        return false;
      }

      function tileClass(v) {
        if (v > 2048) return "super";
        return "v" + v;
      }

      function render2048() {
        boardEl.querySelectorAll(".g2-cell").forEach((n) => n.remove());
        board.forEach((v, i) => {
          const cell = document.createElement("div");
          cell.className = "g2-cell";
          if (v) {
            const tile = document.createElement("div");
            tile.className = "g2-tile " + tileClass(v);
            if (freshTiles.has(i)) tile.classList.add("fresh");
            tile.textContent = String(v);
            if (String(v).length >= 4) tile.classList.add("four");
            cell.appendChild(tile);
          }
          boardEl.appendChild(cell);
        });
        freshTiles.clear();
        scoreEl.textContent = String(score);
        bestEl.textContent = String(best);
      }

      overlayBtn.addEventListener("click", () => {
        if (winPending && !gameOver) {
          winPending = false;
          reached2048 = false;
          overlay.classList.add("hidden");
          OS.sound.play("click");
        } else {
          new2048();
        }
      });

      body.querySelector('[data-act="new2048"]').addEventListener("click", new2048);

      body.querySelector(".g2-dpad").addEventListener("click", (e) => {
        const btn = e.target.closest("[data-dir]");
        if (btn) move(btn.dataset.dir);
      });

      boardEl.addEventListener("pointerdown", (e) => {
        touchStart = { x: e.clientX, y: e.clientY };
      });
      boardEl.addEventListener("pointerup", (e) => {
        if (!touchStart) return;
        const dx = e.clientX - touchStart.x;
        const dy = e.clientY - touchStart.y;
        touchStart = null;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
        if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? "right" : "left");
        else move(dy > 0 ? "down" : "up");
      });

      /* ═══════════════ Общее ═══════════════ */
      function setGame(next) {
        game = next;
        tabs.querySelectorAll("[data-game]").forEach((b) => b.classList.toggle("active", b.dataset.game === game));
        views.forEach((v) => v.classList.toggle("active", v.classList.contains(game === "mines" ? "mines-view" : "g2048-view")));
        levelSelect.classList.toggle("hidden", game !== "mines");
        win.setSubtitle(game === "mines" ? "Сапёр" : "2048");
        if (game === "mines") {
          hintEl.textContent = "ЛКМ — открыть · ПКМ — флажок";
          statusEl.textContent = `Сапёр · ${LEVELS[levelSelect.value].label}`;
        } else {
          hintEl.textContent = "Стрелки, WASD или свайп";
          statusEl.textContent = `2048 · счёт ${score}`;
        }
        OS.sound.play("click");
      }

      tabs.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-game]");
        if (btn) setGame(btn.dataset.game);
      });

      resetBtn.addEventListener("click", () => {
        if (game === "mines") newMines();
        else new2048();
      });

      win.el.addEventListener("keydown", (e) => {
        if (game !== "g2048" || e.target.closest("input, select, textarea")) return;
        const map = {
          ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
          w: "up", s: "down", a: "left", d: "right", ц: "up", ы: "down", ф: "left", в: "right",
        };
        const dir = map[e.key] || map[e.key.toLowerCase()];
        if (dir) {
          e.preventDefault();
          move(dir);
        }
      });

      win.setTitle("Игры");
      bestEl.textContent = String(best);
      newMines();
      new2048();
      setGame("mines");
    },
  });
})();
