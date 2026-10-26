/* ══════════════════════════════════════════════════════════════════════
   HTML OS — точка входа
   ══════════════════════════════════════════════════════════════════════ */
OS.version = "1.0";
OS.startedAt = Date.now();

(function bootSystem() {
  try {
    OS.i18n.init();
    OS.shell.init();
  } catch (err) {
    console.error("HTML OS: критическая ошибка запуска", err);
    const boot = document.getElementById("boot");
    if (boot) boot.classList.add("hidden");
    const os = document.getElementById("os");
    if (os) os.classList.remove("hidden");
    const host = document.getElementById("modal-root");
    if (host) {
      host.innerHTML = `<div class="modal-backdrop" style="z-index:9000">
        <div class="modal">
          <div class="modal-head">${OS.util.icon("warning")}<h3>HTML OS не запустилась</h3></div>
          <div class="modal-body"><p>Произошла ошибка при инициализации системы.</p>
          <pre style="white-space:pre-wrap;font-size:11px;background:var(--surface-2);padding:10px;border-radius:8px">${OS.util.escapeHtml(err?.message || String(err))}</pre></div>
          <div class="modal-actions"><button class="btn primary" onclick="location.reload()">Перезагрузить</button></div>
        </div>
      </div>`;
    }
  }

  window.addEventListener("unhandledrejection", (e) => {
    console.error("HTML OS: необработанная ошибка", e.reason);
  });
})();
