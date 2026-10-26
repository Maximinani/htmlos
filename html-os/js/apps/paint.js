/* ══════════════════════════════════════════════════════════════════════
   HTML OS — приложение «Рисование»
   ══════════════════════════════════════════════════════════════════════ */
(() => {
  const TOOLS = {
    pencil: "Карандаш",
    eraser: "Ластик",
    line: "Линия",
    rect: "Прямоугольник",
    ellipse: "Эллипс",
  };

  OS.registerApp({
    id: "paint",
    name: "Рисование",
    icon: "🎨",
    color: ["#fb7185", "#e11d48"],
    width: 980,
    height: 660,
    minWidth: 520,
    minHeight: 380,
    mount(body, win) {
      body.innerHTML = `
        <div class="app paint">
          <div class="app-toolbar">
            <div class="paint-tools">
              <button class="paint-tool active" data-tool="pencil" title="Карандаш (B)">✏️</button>
              <button class="paint-tool" data-tool="eraser" title="Ластик (E)">🧽</button>
              <button class="paint-tool" data-tool="line" title="Линия (L)">╱</button>
              <button class="paint-tool" data-tool="rect" title="Прямоугольник (R)">▭</button>
              <button class="paint-tool" data-tool="ellipse" title="Эллипс (O)">◯</button>
            </div>
            <div class="toolbar-sep"></div>
            <label class="paint-color" title="Цвет">
              <input type="color" value="#5b8cff" class="paint-color-input">
              <span class="paint-color-swatch" style="background:#5b8cff"></span>
            </label>
            <div class="paint-size">
              ${OS.util.icon("brush")}
              <input class="range paint-size-range" type="range" min="1" max="40" value="4">
              <span class="paint-size-label">4</span>
            </div>
            <div class="grow"></div>
            <button class="btn sm icon-only" data-act="undo" title="Отменить (Ctrl+Z)">${OS.util.icon("undo")}</button>
            <button class="btn sm icon-only" data-act="clear" title="Очистить холст">${OS.util.icon("trash")}</button>
            <button class="btn sm primary" data-act="save">${OS.util.icon("save")} Сохранить</button>
            <button class="btn sm icon-only" data-act="download" title="Скачать PNG">${OS.util.icon("download")}</button>
          </div>
          <div class="paint-area">
            <canvas class="paint-canvas"></canvas>
            <div class="paint-hint">
              ${OS.util.icon("brush")}
              <b>Рисуйте здесь</b>
              <span>Выберите инструмент, цвет и толщину кисти</span>
            </div>
          </div>
          <div class="app-status">
            <span class="paint-status">Карандаш · 4 px</span>
            <span>Ctrl+Z — отменить · Ctrl+S — сохранить</span>
          </div>
        </div>`;

      const area = body.querySelector(".paint-area");
      const canvas = body.querySelector(".paint-canvas");
      const hint = body.querySelector(".paint-hint");
      const colorInput = body.querySelector(".paint-color-input");
      const swatch = body.querySelector(".paint-color-swatch");
      const sizeRange = body.querySelector(".paint-size-range");
      const sizeLabel = body.querySelector(".paint-size-label");
      const statusEl = body.querySelector(".paint-status");
      const undoBtn = body.querySelector('[data-act="undo"]');

      let ctx = canvas.getContext("2d");
      let tool = "pencil";
      let color = "#5b8cff";
      let size = 4;
      let drawing = false;
      let lastX = 0;
      let lastY = 0;
      let startX = 0;
      let startY = 0;
      let baseImage = null;
      let hasDrawn = false;
      const undoStack = [];

      function paintBackground() {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      function setupCanvas() {
        const rect = area.getBoundingClientRect();
        const width = Math.max(200, Math.floor(rect.width));
        const height = Math.max(150, Math.floor(rect.height));
        if (canvas.width === width && canvas.height === height) return;
        let old = null;
        if (canvas.width && canvas.height) {
          old = document.createElement("canvas");
          old.width = canvas.width;
          old.height = canvas.height;
          old.getContext("2d").drawImage(canvas, 0, 0);
        }
        canvas.width = width;
        canvas.height = height;
        ctx = canvas.getContext("2d");
        paintBackground();
        if (old) {
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.drawImage(old, 0, 0, old.width, old.height, 0, 0, width, height);
          ctx.restore();
        }
        undoStack.length = 0;
        updateUndo();
      }

      function updateUndo() {
        undoBtn.disabled = undoStack.length === 0;
      }

      function pushUndo() {
        try {
          undoStack.push(canvas.toDataURL("image/png"));
          if (undoStack.length > 15) undoStack.shift();
          updateUndo();
        } catch { /* noop */ }
      }

      function restore(data) {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            ctx.restore();
            resolve();
          };
          img.src = data;
        });
      }

      function undo() {
        const data = undoStack.pop();
        if (!data) return;
        restore(data);
        updateUndo();
      }

      function clearCanvas() {
        pushUndo();
        paintBackground();
        hideHint();
      }

      function hideHint() {
        if (hasDrawn) return;
        hasDrawn = true;
        hint.classList.add("hidden");
      }

      function pos(e) {
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
      }

      function strokeStyle() {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = size;
        ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
        ctx.fillStyle = color;
      }

      function drawShape(x, y) {
        if (baseImage) ctx.putImageData(baseImage, 0, 0);
        strokeStyle();
        ctx.beginPath();
        if (tool === "line") {
          ctx.moveTo(startX, startY);
          ctx.lineTo(x, y);
        } else if (tool === "rect") {
          ctx.rect(startX, startY, x - startX, y - startY);
        } else if (tool === "ellipse") {
          const rx = Math.abs(x - startX) / 2;
          const ry = Math.abs(y - startY) / 2;
          ctx.ellipse(startX + (x - startX) / 2, startY + (y - startY) / 2, rx, ry, 0, 0, Math.PI * 2);
        }
        ctx.stroke();
      }

      canvas.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        canvas.setPointerCapture?.(e.pointerId);
        drawing = true;
        const p = pos(e);
        lastX = p.x;
        lastY = p.y;
        startX = p.x;
        startY = p.y;
        pushUndo();
        hideHint();
        if (["line", "rect", "ellipse"].includes(tool)) {
          baseImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
        } else {
          strokeStyle();
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + 0.01, p.y + 0.01);
          ctx.stroke();
        }
      });

      canvas.addEventListener("pointermove", (e) => {
        if (!drawing) return;
        const p = pos(e);
        if (["line", "rect", "ellipse"].includes(tool)) {
          drawShape(p.x, p.y);
        } else {
          strokeStyle();
          ctx.beginPath();
          ctx.moveTo(lastX, lastY);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          lastX = p.x;
          lastY = p.y;
        }
      });

      const endDraw = (e) => {
        if (!drawing) return;
        drawing = false;
        baseImage = null;
        if (["line", "rect", "ellipse"].includes(tool)) drawShape(pos(e).x, pos(e).y);
        canvas.releasePointerCapture?.(e.pointerId);
      };
      canvas.addEventListener("pointerup", endDraw);
      canvas.addEventListener("pointercancel", () => {
        drawing = false;
        baseImage = null;
      });

      body.querySelector(".paint-tools").addEventListener("click", (e) => {
        const btn = e.target.closest("[data-tool]");
        if (!btn) return;
        tool = btn.dataset.tool;
        body.querySelectorAll("[data-tool]").forEach((b) => b.classList.toggle("active", b === btn));
        updateStatus();
      });

      colorInput.addEventListener("input", () => {
        color = colorInput.value;
        swatch.style.background = color;
        if (tool === "eraser") {
          tool = "pencil";
          body.querySelectorAll("[data-tool]").forEach((b) => b.classList.toggle("active", b.dataset.tool === "pencil"));
        }
        updateStatus();
      });

      sizeRange.addEventListener("input", () => {
        size = Number(sizeRange.value);
        sizeLabel.textContent = String(size);
        updateStatus();
      });

      function updateStatus() {
        statusEl.textContent = `${TOOLS[tool]} · ${size} px${tool === "eraser" ? "" : " · " + color}`;
      }

      body.querySelector('[data-act="undo"]').addEventListener("click", undo);
      body.querySelector('[data-act="clear"]').addEventListener("click", clearCanvas);

      function dataUrl() {
        return canvas.toDataURL("image/png");
      }

      async function saveArt() {
        if (!hasDrawn) {
          OS.ui.notify({ title: "Холст пуст", text: "Сначала что-нибудь нарисуйте", icon: "🎨", app: "paint" });
          return;
        }
        const name = await OS.ui.prompt({
          title: "Сохранить рисунок",
          label: "Рисунок появится в «Галерее» и в папке «Изображения».",
          value: (OS.i18n.lang === "ru" ? "Рисунок " : "Drawing ") + new Date().toLocaleDateString(OS.i18n.locale),
          okText: "Сохранить",
          icon: "save",
        });
        if (!name) return;
        const clean = name.replace(/[\\/:*?"<>|]/g, "").trim() || "Рисунок";
        const filename = OS.fs.uniqueName(["Изображения"], clean + ".png");
        try {
          OS.fs.write(["Изображения", filename], "", { data: dataUrl() });
          OS.notify({ title: "Рисунок сохранён", text: "/Изображения/" + filename, icon: "🎨", app: "paint" });
          OS.sound.play("notify");
        } catch (err) {
          OS.ui.notify({ title: "Ошибка сохранения", text: err.message, icon: "⚠️" });
        }
      }

      body.querySelector('[data-act="save"]').addEventListener("click", saveArt);
      body.querySelector('[data-act="download"]').addEventListener("click", () => {
        const a = document.createElement("a");
        a.href = dataUrl();
        a.download = "HTML-OS-рисунок.png";
        a.click();
      });

      win.el.addEventListener("keydown", (e) => {
        if (e.target.closest("input, textarea")) return;
        const key = e.key.toLowerCase();
        if ((e.ctrlKey || e.metaKey) && key === "z") { e.preventDefault(); undo(); return; }
        if ((e.ctrlKey || e.metaKey) && key === "s") { e.preventDefault(); saveArt(); return; }
        if (e.ctrlKey || e.metaKey) return;
        if (key === "b") setTool("pencil");
        else if (key === "e") setTool("eraser");
        else if (key === "l") setTool("line");
        else if (key === "r") setTool("rect");
        else if (key === "o") setTool("ellipse");
      });

      function setTool(name) {
        tool = name;
        body.querySelectorAll("[data-tool]").forEach((b) => b.classList.toggle("active", b.dataset.tool === name));
        updateStatus();
      }

      const ro = new ResizeObserver(() => {
        clearTimeout(ro._t);
        ro._t = setTimeout(setupCanvas, 120);
      });
      ro.observe(area);
      win.onClose(() => ro.disconnect());

      const onTheme = OS.settings.onChange(() => {
        // холст не зависит от темы, но перерисовка не нужна
      });
      win.onClose(onTheme);

      requestAnimationFrame(() => {
        setupCanvas();
        paintBackground();
        updateStatus();
        updateUndo();
      });

      win.setTitle("Рисование");
      win.setSubtitle("Холст");
    },
  });
})();
