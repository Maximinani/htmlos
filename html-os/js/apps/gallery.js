/* ══════════════════════════════════════════════════════════════════════
   HTML OS — приложение «Галерея»
   ══════════════════════════════════════════════════════════════════════ */
(() => {
  const { escapeHtml } = OS.util;

  OS.registerApp({
    id: "gallery",
    name: "Галерея",
    icon: "🖼️",
    color: ["#f472b6", "#db2777"],
    width: 900,
    height: 610,
    minWidth: 520,
    minHeight: 380,
    mount(body, win, args) {
      let tab = "walls";
      let lightboxItems = [];
      let lightboxIndex = -1;

      body.innerHTML = `
        <div class="app gallery">
          <div class="app-toolbar">
            <div class="seg">
              <button class="seg-btn active" data-tab="walls">${OS.util.icon("image")} Обои</button>
              <button class="seg-btn" data-tab="art">${OS.util.icon("brush")} Мои рисунки</button>
            </div>
            <div class="grow"></div>
            <span class="gal-count muted small"></span>
            <button class="btn sm" data-act="paint">${OS.util.icon("brush")} Рисовать</button>
          </div>
          <div class="gal-content">
            <div class="gal-grid"></div>
            <div class="gal-empty hidden">
              ${OS.util.icon("image")}
              <b>Пока нет рисунков</b>
              <span>Создайте первый шедевр в приложении «Рисование».</span>
              <button class="btn sm primary" data-act="paint">${OS.util.icon("brush")} Открыть рисование</button>
            </div>
          </div>
          <div class="app-status">
            <span class="gal-status">—</span>
            <span>HTML OS · Галерея</span>
          </div>

          <div class="gal-lightbox hidden">
            <div class="gal-lb-head">
              <span class="gal-lb-title"></span>
              <div class="gal-lb-actions">
                <button class="btn sm" data-lb="wall">${OS.util.icon("image")} Сделать обоями</button>
                <button class="btn sm icon-only" data-lb="download" title="Скачать">${OS.util.icon("download")}</button>
                <button class="btn sm icon-only" data-lb="delete" title="Удалить">${OS.util.icon("trash")}</button>
                <button class="btn sm icon-only" data-lb="close" title="Закрыть">${OS.util.icon("close")}</button>
              </div>
            </div>
            <div class="gal-lb-stage">
              <button class="gal-lb-arrow prev" data-lb="prev">${OS.util.icon("left")}</button>
              <img class="gal-lb-img" alt="">
              <button class="gal-lb-arrow next" data-lb="next">${OS.util.icon("right")}</button>
            </div>
            <div class="gal-lb-foot"></div>
          </div>
        </div>`;

      const grid = body.querySelector(".gal-grid");
      const empty = body.querySelector(".gal-empty");
      const countEl = body.querySelector(".gal-count");
      const statusEl = body.querySelector(".gal-status");
      const lb = body.querySelector(".gal-lightbox");
      const lbImg = body.querySelector(".gal-lb-img");
      const lbTitle = body.querySelector(".gal-lb-title");
      const lbFoot = body.querySelector(".gal-lb-foot");
      const wallBtn = body.querySelector('[data-lb="wall"]');
      const delBtn = body.querySelector('[data-lb="delete"]');

      function artItems() {
        return OS.fs.allFiles(["Изображения"])
          .filter((f) => f.node.data)
          .map((f) => ({
            kind: "art",
            title: f.name.replace(/\.[^.]+$/, ""),
            src: f.node.data,
            path: f.path,
            name: f.name,
          }));
      }

      function wallItems() {
        return OS.wallpapers.map((w) => ({
          kind: "wall",
          title: w.name,
          src: w.src,
          id: w.id,
          name: w.name + ".svg",
        }));
      }

      function currentItems() {
        return tab === "walls" ? wallItems() : artItems();
      }

      function render() {
        const items = currentItems();
        grid.innerHTML = items.map((item, i) => `
          <button class="gal-card" data-i="${i}" title="${escapeHtml(item.title)}">
            <span class="gal-thumb"><img src="${item.src}" alt="${escapeHtml(item.title)}" loading="lazy"></span>
            <span class="gal-info">
              <b>${escapeHtml(item.title)}</b>
              <span>${item.kind === "wall" ? "Обои · SVG" : "Рисунок · PNG"}</span>
            </span>
          </button>`).join("");
        grid.classList.toggle("hidden", !items.length);
        empty.classList.toggle("hidden", items.length > 0 || tab === "walls");
        countEl.textContent = `${items.length} ${tab === "walls" ? "обоев" : "рисунков"}`;
        statusEl.textContent = tab === "walls" ? "Выберите обои и нажмите на карточку" : "Двойной клик по рисунку — просмотр";
        body.querySelectorAll("[data-tab]").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
        win.setSubtitle(tab === "walls" ? "Обои" : "Мои рисунки");
      }

      function openLightbox(index, items = currentItems()) {
        if (!items.length || index < 0) return;
        lightboxItems = items;
        lightboxIndex = index;
        showLightbox();
      }

      function showLightbox() {
        const item = lightboxItems[lightboxIndex];
        if (!item) return;
        lb.classList.remove("hidden");
        lbImg.src = item.src;
        lbImg.alt = item.title;
        lbTitle.textContent = item.title;
        wallBtn.classList.toggle("hidden", item.kind !== "wall");
        delBtn.classList.toggle("hidden", item.kind !== "art");
        lbFoot.textContent = `${lightboxIndex + 1} из ${lightboxItems.length} · ${item.kind === "wall" ? "Обои HTML OS" : "Рисунок"}`;
        body.querySelector('[data-lb="prev"]').disabled = lightboxItems.length < 2;
        body.querySelector('[data-lb="next"]').disabled = lightboxItems.length < 2;
      }

      function closeLightbox() {
        lb.classList.add("hidden");
        lbImg.removeAttribute("src");
        lightboxItems = [];
        lightboxIndex = -1;
      }

      grid.addEventListener("click", (e) => {
        const card = e.target.closest("[data-i]");
        if (!card) return;
        openLightbox(Number(card.dataset.i));
      });

      body.querySelectorAll("[data-tab]").forEach((btn) => {
        btn.addEventListener("click", () => {
          tab = btn.dataset.tab;
          render();
        });
      });

      body.querySelectorAll('[data-act="paint"]').forEach((btn) => {
        btn.addEventListener("click", () => OS.wm.open("paint"));
      });

      body.querySelector(".gal-lb-head").addEventListener("click", (e) => {
        const btn = e.target.closest("[data-lb]");
        if (!btn) return;
        const item = lightboxItems[lightboxIndex];
        if (!item) return;
        if (btn.dataset.lb === "close") closeLightbox();
        else if (btn.dataset.lb === "prev") { lightboxIndex = (lightboxIndex - 1 + lightboxItems.length) % lightboxItems.length; showLightbox(); }
        else if (btn.dataset.lb === "next") { lightboxIndex = (lightboxIndex + 1) % lightboxItems.length; showLightbox(); }
        else if (btn.dataset.lb === "wall" && item.kind === "wall") {
          OS.settings.set("wallpaper", item.id);
          OS.notify({ title: "Обои изменены", text: item.title, icon: "🖼️", app: "gallery" });
          OS.sound.play("notify");
        } else if (btn.dataset.lb === "download") {
          const a = document.createElement("a");
          a.href = item.src;
          a.download = item.kind === "wall" ? item.name : item.title + ".png";
          document.body.appendChild(a);
          a.click();
          a.remove();
        } else if (btn.dataset.lb === "delete" && item.kind === "art") {
          OS.ui.confirm({
            title: "Удалить рисунок?",
            text: `«${item.title}» будет удалён из папки «Изображения».`,
            okText: "Удалить",
            danger: true,
          }).then((ok) => {
            if (!ok) return;
            try {
              OS.fs.remove(item.path);
              closeLightbox();
              render();
              OS.notify({ title: "Рисунок удалён", text: item.title, icon: "🗑️", app: "gallery" });
            } catch (err) {
              OS.ui.notify({ title: "Ошибка", text: err.message, icon: "⚠️" });
            }
          });
        }
      });

      lb.addEventListener("click", (e) => {
        if (e.target === lb) closeLightbox();
      });

      win.el.addEventListener("keydown", (e) => {
        if (lb.classList.contains("hidden")) return;
        if (e.key === "Escape") { e.preventDefault(); closeLightbox(); }
        else if (e.key === "ArrowLeft" && lightboxItems.length > 1) {
          e.preventDefault();
          lightboxIndex = (lightboxIndex - 1 + lightboxItems.length) % lightboxItems.length;
          showLightbox();
        } else if (e.key === "ArrowRight" && lightboxItems.length > 1) {
          e.preventDefault();
          lightboxIndex = (lightboxIndex + 1) % lightboxItems.length;
          showLightbox();
        }
      });

      const unsub = OS.fs.onChange(() => {
        if (!OS.wm.windows().includes(win)) return;
        if (tab === "art") render();
      });
      win.onClose(unsub);

      win.setTitle("Галерея");
      win.onArgs((next) => {
        if (!next?.preview) return;
        lightboxItems = [{
          kind: "preview",
          title: next.title || "Изображение",
          src: next.preview,
          name: next.title || "image.png",
        }];
        lightboxIndex = 0;
        showLightbox();
      });
      if (args?.preview) {
        closeLightbox();
        lightboxItems = [{
          kind: "preview",
          title: args.title || "Изображение",
          src: args.preview,
          name: args.title || "image.png",
        }];
        lightboxIndex = 0;
        showLightbox();
      }
      render();
    },
  });
})();
