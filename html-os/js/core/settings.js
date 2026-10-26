/* ══════════════════════════════════════════════════════════════════════
   HTML OS — настройки, обои и акценты
   ══════════════════════════════════════════════════════════════════════ */
OS.wallpapers = [
  { id: "deepseek", name: "DeepSeek Love", src: "assets/wallpapers/deepseek.svg", tone: "#22d3ee" },
  { id: "aurora", name: "Аврора", src: "assets/wallpapers/aurora.svg", tone: "#0ea5e9" },
  { id: "sunset", name: "Закат", src: "assets/wallpapers/sunset.svg", tone: "#fb7185" },
  { id: "ocean", name: "Океан", src: "assets/wallpapers/ocean.svg", tone: "#06b6d4" },
  { id: "forest", name: "Лес", src: "assets/wallpapers/forest.svg", tone: "#10b981" },
  { id: "neon", name: "Неон", src: "assets/wallpapers/neon.svg", tone: "#d946ef" },
  { id: "cosmic", name: "Космос", src: "assets/wallpapers/cosmic.svg", tone: "#8b5cf6" },
  { id: "minimal", name: "Минимализм", src: "assets/wallpapers/minimal.svg", tone: "#93c5fd" },
  { id: "graphite", name: "Графит", src: "assets/wallpapers/graphite.svg", tone: "#f97316" },
  { id: "cyber", name: "Кибер", src: "assets/wallpapers/cyber.svg", tone: "#2dd4bf" },
];

OS.accents = [
  { id: "blue", name: "Океан", color: "#5b8cff" },
  { id: "violet", name: "Фиалка", color: "#8b5cf6" },
  { id: "cyan", name: "Лагуна", color: "#06b6d4" },
  { id: "emerald", name: "Изумруд", color: "#10b981" },
  { id: "amber", name: "Янтарь", color: "#f59e0b" },
  { id: "orange", name: "Закат", color: "#f97316" },
  { id: "rose", name: "Роза", color: "#f43f5e" },
  { id: "magenta", name: "Магента", color: "#d946ef" },
];

OS.settings = (() => {
  const KEY = "htmlos.settings.v1";
  const DEFAULTS = {
    theme: "dark",
    accent: "#5b8cff",
    wallpaper: "deepseek",
    username: OS.i18n?.lang === "ru" ? "Гость" : "Guest",
    language: "en",
    transparency: true,
    animations: true,
    sounds: true,
    volume: 0.6,
  };
  const listeners = [];
  let data = { ...DEFAULTS };
  let currentWall = null;
  let activeLayer = "a";

  function get(key) {
    return key == null ? { ...data } : data[key];
  }

  function wallpaper() {
    return OS.wallpapers.find((w) => w.id === data.wallpaper) || OS.wallpapers[0];
  }

  function layer(name) {
    return document.querySelector(`.wall-layer[data-layer="${name}"]`);
  }

  function paintWallpaper(force = false) {
    const src = wallpaper().src;
    const a = layer("a");
    const b = layer("b");
    const lockWall = document.getElementById("lock-wall");
    if (lockWall) lockWall.style.backgroundImage = `url("${src}")`;
    if (!a || !b) return;
    if (!force && currentWall === src) return;

    const nextName = activeLayer === "a" ? "b" : "a";
    const next = nextName === "a" ? a : b;
    const prev = activeLayer === "a" ? a : b;
    next.style.backgroundImage = `url("${src}")`;
    // принудительный reflow, чтобы transition сработал при смене источника
    void next.offsetWidth;
    next.classList.add("on");
    prev.classList.remove("on");
    activeLayer = nextName;
    currentWall = src;
  }

  function shiftHue(hex, deg) {
    const { r, g, b } = OS.util.hexToRgb(hex);
    let rr = r / 255, gg = g / 255, bb = b / 255;
    const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === rr) h = ((gg - bb) / d + (gg < bb ? 6 : 0)) / 6;
      else if (max === gg) h = ((bb - rr) / d + 2) / 6;
      else h = ((rr - gg) / d + 4) / 6;
    }
    h = (h + deg / 360 + 1) % 1;
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const to = (x) => Math.round(x * 255).toString(16).padStart(2, "0");
    return `#${to(hue2rgb(p, q, h + 1 / 3))}${to(hue2rgb(p, q, h))}${to(hue2rgb(p, q, h - 1 / 3))}`;
  }

  function apply() {
    const root = document.documentElement;
    root.dataset.theme = data.theme;
    root.lang = data.language === "ru" ? "ru" : "en";
    root.style.setProperty("--accent", data.accent);
    root.style.setProperty("--accent-2", shiftHue(data.accent, 42));
    root.classList.toggle("no-anim", !data.animations);
    root.classList.toggle("no-transparency", !data.transparency);
    paintWallpaper();

    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) meta.setAttribute("content", data.theme === "light" ? "light" : "dark");

    const name = data.username?.trim() || "Гость";
    const initial = name.slice(0, 1).toUpperCase();
    const set = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };
    set("lock-user", name);
    set("lock-avatar", initial);
    set("sm-username", name);
    set("sm-avatar", initial);
  }

  function notify() {
    apply();
    OS.util.saveJSON(KEY, data);
    listeners.forEach((fn) => { try { fn(get()); } catch (e) { console.error(e); } });
    window.dispatchEvent(new CustomEvent("os:settings-change", { detail: get() }));
  }

  function set(key, value) {
    if (key === "username") value = String(value || "").slice(0, 24);
    if (key === "volume") value = OS.util.clamp(Number(value), 0, 1);
    data[key] = value;
    notify();
    return value;
  }

  function setMany(patch) {
    Object.entries(patch).forEach(([k, v]) => {
      if (k === "username") v = String(v || "").slice(0, 24);
      data[k] = v;
    });
    notify();
  }

  function reset() {
    data = { ...DEFAULTS };
    data.username = data.language === "ru" ? "Гость" : "Guest";
    try { localStorage.removeItem(KEY); } catch { /* noop */ }
    currentWall = null;
    paintWallpaper(true);
    notify();
  }

  function init() {
    const saved = OS.util.loadJSON(KEY, {});
    const hasSavedUser = saved && Object.prototype.hasOwnProperty.call(saved, "username");
    data = { ...DEFAULTS, ...(saved && typeof saved === "object" ? saved : {}) };
    if (!["dark", "light"].includes(data.theme)) data.theme = "dark";
    if (!["en", "ru"].includes(data.language)) data.language = "en";
    if (!hasSavedUser) data.username = data.language === "ru" ? "Гость" : "Guest";
    if (data.username === "Гость" && data.language === "en") data.username = "Guest";
    if (!OS.wallpapers.some((w) => w.id === data.wallpaper)) data.wallpaper = "deepseek";
    // Один раз применяем новые обои «Im love deepseek!» и для старых профилей
    try {
      if (!localStorage.getItem("htmlos.wallpaper.v2")) {
        data.wallpaper = "deepseek";
        localStorage.setItem("htmlos.wallpaper.v2", "1");
      }
    } catch { /* noop */ }
    if (!/^#[0-9a-f]{6}$/i.test(data.accent)) data.accent = DEFAULTS.accent;
    apply();
    OS.util.saveJSON(KEY, data);
  }

  function onChange(fn) {
    listeners.push(fn);
    return () => {
      const i = listeners.indexOf(fn);
      if (i >= 0) listeners.splice(i, 1);
    };
  }

  return { get, set, setMany, reset, init, apply, onChange, wallpaper, DEFAULTS };
})();
