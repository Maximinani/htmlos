/* ══════════════════════════════════════════════════════════════════════
   HTML OS — утилиты
   ══════════════════════════════════════════════════════════════════════ */
window.OS = window.OS || {};

OS.util = (() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const pad = (n) => String(n).padStart(2, "0");

  function uid(prefix = "id") {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function debounce(fn, ms = 250) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function fmtTime(date = new Date(), withSeconds = false) {
    const d = date instanceof Date ? date : new Date(date);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}${withSeconds ? ":" + pad(d.getSeconds()) : ""}`;
  }

  function fmtDate(date = new Date(), variant = "long") {
    const d = date instanceof Date ? date : new Date(date);
    const locale = OS.i18n?.locale || "en-US";
    try {
      if (variant === "short") {
        return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
      }
      if (variant === "time") {
        return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(d);
      }
      return new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(d);
    } catch {
      return d.toLocaleDateString(locale);
    }
  }

  function fmtDateFull(date = new Date()) {
    const d = date instanceof Date ? date : new Date(date);
    const locale = OS.i18n?.locale || "en-US";
    try {
      return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(d);
    } catch {
      return d.toLocaleDateString(locale);
    }
  }

  function formatBytes(bytes) {
    if (!bytes) return OS.i18n?.lang === "ru" ? "0 Б" : "0 B";
    const units = OS.i18n?.lang === "ru" ? ["Б", "КБ", "МБ", "ГБ"] : ["B", "KB", "MB", "GB"];
    const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    return `${(bytes / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${units[i]}`;
  }

  function extOf(name) {
    const m = String(name).match(/\.([a-z0-9]+)$/i);
    return m ? "." + m[1].toLowerCase() : "";
  }

  function fileKind(name) {
    const ext = extOf(name);
    if ([".txt", ".md", ".log", ".json", ".js", ".css", ".html", ".csv"].includes(ext)) return "text";
    if ([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp"].includes(ext)) return "image";
    if ([".mp3", ".wav", ".ogg", ".m4a"].includes(ext)) return "audio";
    return "file";
  }

  function fileEmoji(name) {
    const ext = extOf(name);
    const map = {
      ".txt": "📄", ".md": "📝", ".json": "🧾", ".js": "🟨", ".css": "🎨", ".html": "🌐",
      ".png": "🖼️", ".jpg": "🖼️", ".jpeg": "🖼️", ".svg": "🖼️", ".gif": "🎞️",
      ".mp3": "🎵", ".wav": "🎵", ".pdf": "📕", ".zip": "🗜️",
    };
    return map[ext] || "📄";
  }

  function download(filename, data, type = "text/plain") {
    const a = document.createElement("a");
    const url = data.startsWith("data:") ? data : URL.createObjectURL(new Blob([data], { type }));
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    if (!data.startsWith("data:")) setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function copyText(text) {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    fallbackCopy(text);
    return Promise.resolve();
  }

  function fallbackCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch { /* noop */ }
    ta.remove();
  }

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed ?? fallback;
    } catch {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function storageSize() {
    let total = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        const v = localStorage.getItem(k) || "";
        total += (k.length + v.length) * 2;
      }
    } catch { /* noop */ }
    return total;
  }

  function hexToRgb(hex) {
    const m = String(hex).replace("#", "").match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : { r: 91, g: 140, b: 255 };
  }

  function icon(id, cls = "icon") {
    return `<svg class="${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
  }

  return {
    $, $$, pad, uid, clamp, escapeHtml, debounce, sleep,
    fmtTime, fmtDate, fmtDateFull, formatBytes, extOf, fileKind, fileEmoji,
    download, copyText, loadJSON, saveJSON, storageSize, hexToRgb, icon,
  };
})();

/* ─── Небольшой синтезатор интерфейсных звуков ─────────────────────── */
OS.sound = (() => {
  let ctx = null;
  const notes = {
    click: { f: [620, 470], d: 0.06, type: "sine", gain: 0.16 },
    open: { f: [440, 660, 880], d: 0.09, type: "sine", gain: 0.12 },
    close: { f: [520, 350], d: 0.08, type: "sine", gain: 0.10 },
    notify: { f: [880, 1174], d: 0.13, type: "sine", gain: 0.12 },
    error: { f: [220, 165], d: 0.12, type: "triangle", gain: 0.14 },
    boot: { f: [392, 523, 659, 784], d: 0.16, type: "sine", gain: 0.10 },
    key: { f: [1200], d: 0.02, type: "square", gain: 0.025 },
  };

  function enabled() {
    return !OS.settings || OS.settings.get("sounds") !== false;
  }

  function play(name = "click") {
    if (!enabled()) return;
    const def = notes[name] || notes.click;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
      const vol = OS.settings ? Number(OS.settings.get("volume") ?? 0.6) : 0.6;
      const master = ctx.createGain();
      master.gain.value = Math.max(0, Math.min(1, vol)) * 0.9;
      master.connect(ctx.destination);
      def.f.forEach((freq, i) => {
        const t0 = ctx.currentTime + i * def.d * 0.55;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = def.type;
        osc.frequency.setValueAtTime(freq, t0);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(def.gain, t0 + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + def.d + 0.05);
        osc.connect(g).connect(master);
        osc.start(t0);
        osc.stop(t0 + def.d + 0.08);
      });
    } catch { /* звук не критичен */ }
  }

  return { play };
})();
