/* ══════════════════════════════════════════════════════════════════════
   HTML OS — локализация интерфейса (English по умолчанию, русский в настройках)
   Переводит текстовые узлы и подписи интерфейса «на лету».
   ══════════════════════════════════════════════════════════════════════ */
OS.i18n = (() => {
  const SETTINGS_KEY = "htmlos.settings.v1";
  const CYR = /[А-Яа-яЁё]/;
  const ATTRS = ["title", "placeholder", "aria-label", "alt"];
  const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "CODE"]);
  const DICT = {};
  const PATTERNS = [];
  let lang = "en";
  let observer = null;

  function readLanguage() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return "en";
      const saved = JSON.parse(raw);
      return saved?.language === "ru" ? "ru" : "en";
    } catch {
      return "en";
    }
  }

  function add(map) {
    Object.assign(DICT, map);
  }

  function addPattern(re, fn) {
    PATTERNS.push({ re, fn });
  }

  function translate(value) {
    if (lang !== "en" || typeof value !== "string" || !CYR.test(value)) return value;
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(value);
    if (!m) return value;
    const [, lead, core, trail] = m;
    if (!core) return value;
    if (Object.prototype.hasOwnProperty.call(DICT, core)) return lead + DICT[core] + trail;
    const compact = core.replace(/\s+/g, " ");
    if (compact !== core && Object.prototype.hasOwnProperty.call(DICT, compact)) return lead + DICT[compact] + trail;
    for (const rule of PATTERNS) {
      const match = core.match(rule.re);
      if (match) {
        try {
          const result = rule.fn(match, core);
          if (result != null) return lead + result + trail;
        } catch {
          // правило не должно ломать интерфейс
        }
      }
    }
    return value;
  }

  function skipped(el) {
    if (!el) return true;
    if (SKIP_TAGS.has(el.tagName)) return true;
    if (el.closest?.('[data-i18n="off"], .no-i18n')) return true;
    return false;
  }

  function translateTextNode(node) {
    if (!node || !node.data || !CYR.test(node.data)) return;
    if (skipped(node.parentElement)) return;
    const next = translate(node.data);
    if (next !== node.data) node.data = next;
  }

  function translateAttr(el, attr) {
    if (!el || !ATTRS.includes(attr)) return;
    const value = el.getAttribute?.(attr);
    if (!value || !CYR.test(value)) return;
    if (el.closest?.('[data-i18n="off"], .no-i18n')) return;
    const next = translate(value);
    if (next !== value) el.setAttribute(attr, next);
  }

  function translateTree(root) {
    if (!root) return;
    if (lang !== "en") return;
    if (root.nodeType === 3) {
      translateTextNode(root);
      return;
    }
    if (root.nodeType !== 1 && root.nodeType !== 9) return;
    if (root.nodeType === 1 && root.matches?.('[data-i18n="off"], .no-i18n')) return;

    if (root.nodeType === 1) {
      ATTRS.forEach((attr) => translateAttr(root, attr));
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) translateTextNode(node);
    if (root.querySelectorAll) {
      root.querySelectorAll("[title], [placeholder], [aria-label], [alt]").forEach((el) => {
        ATTRS.forEach((attr) => translateAttr(el, attr));
      });
    }
  }

  function startObserver() {
    if (observer || !document.body) return;
    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          translateTextNode(mutation.target);
        } else if (mutation.type === "attributes") {
          translateAttr(mutation.target, mutation.attributeName);
        } else {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 3) translateTextNode(node);
            else if (node.nodeType === 1) translateTree(node);
          });
        }
      }
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRS,
    });
  }

  function init() {
    lang = readLanguage();
    document.documentElement.lang = lang;
    document.title = lang === "ru"
      ? "HTML OS — операционная система в браузере"
      : "HTML OS — an operating system in your browser";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", lang === "ru"
        ? "HTML OS — операционная система в браузере: окна, файлы, настройки, обои и 14 приложений."
        : "HTML OS — an operating system in your browser: windows, files, settings, wallpapers and 14 apps.");
    }
    if (lang === "en") {
      translateTree(document.body);
      startObserver();
    }
  }

  function apply(root = document.body) {
    translateTree(root);
  }

  function setLanguage(next) {
    if (next !== "en" && next !== "ru") return;
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      const saved = raw ? JSON.parse(raw) : {};
      saved.language = next;
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(saved));
    } catch {
      // ignore
    }
    location.reload();
  }

  return {
    dict: DICT,
    add,
    addPattern,
    translate,
    t: translate,
    text: translate,
    apply,
    init,
    setLanguage,
    get lang() { return lang; },
    get locale() { return lang === "ru" ? "ru-RU" : "en-US"; },
    get isEnglish() { return lang === "en"; },
  };
})();
