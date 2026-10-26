/* ══════════════════════════════════════════════════════════════════════
   HTML OS — приложение «Погода» (демонстрационные данные)
   ══════════════════════════════════════════════════════════════════════ */
(() => {
  const CITIES = [
    { id: "moscow", name: "Москва", base: 8, cond: "cloudy", humidity: 72, wind: 4, pressure: 748 },
    { id: "spb", name: "Санкт-Петербург", base: 6, cond: "rain", humidity: 84, wind: 6, pressure: 752 },
    { id: "sochi", name: "Сочи", base: 19, cond: "sunny", humidity: 58, wind: 3, pressure: 762 },
    { id: "kazan", name: "Казань", base: 5, cond: "partly", humidity: 68, wind: 5, pressure: 750 },
    { id: "novosibirsk", name: "Новосибирск", base: -2, cond: "snow", humidity: 78, wind: 6, pressure: 755 },
  ];

  const CONDITIONS = {
    sunny: { label: "Ясно", icon: "☀️" },
    partly: { label: "Переменная облачность", icon: "⛅" },
    cloudy: { label: "Облачно", icon: "☁️" },
    rain: { label: "Дождь", icon: "🌧️" },
    snow: { label: "Снег", icon: "🌨️" },
    thunder: { label: "Гроза", icon: "⛈️" },
    fog: { label: "Туман", icon: "🌫️" },
  };

  const WEEK = Array.from({ length: 7 }, (_, i) => {
    const s = new Intl.DateTimeFormat(OS.i18n.locale, { weekday: "short" }).format(new Date(2024, 0, 7 + i));
    return s.charAt(0).toUpperCase() + s.slice(1);
  });
  const ORDER = ["sunny", "partly", "cloudy", "rain", "fog", "snow", "thunder"];

  function hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 100000;
    return h || 7;
  }

  function rng(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  const tempStr = (n) => `${n > 0 ? "+" : ""}${Math.round(n)}°`;

  OS.registerApp({
    id: "weather",
    name: "Погода",
    icon: "🌤️",
    color: ["#38bdf8", "#0ea5e9"],
    width: 840,
    height: 620,
    minWidth: 520,
    minHeight: 420,
    mount(body, win) {
      let city = CITIES[0];

      body.innerHTML = `
        <div class="app weather">
          <div class="wx-scroll">
            <div class="wx-hero" data-cond="cloudy">
              <div class="wx-hero-top">
                <div>
                  <div class="wx-city">Москва</div>
                  <div class="wx-date">—</div>
                </div>
                <select class="select wx-select" aria-label="Город">
                  ${CITIES.map((c) => `<option value="${c.id}">${c.name}</option>`).join("")}
                </select>
              </div>
              <div class="wx-current">
                <div class="wx-icon">☁️</div>
                <div class="wx-temp">+8°</div>
                <div class="wx-desc"><b>Облачно</b><span>Ощущается как +6°</span></div>
              </div>
              <div class="wx-meta">
                <div class="wx-meta-item"><span>Ветер</span><b class="wx-wind">4 м/с</b></div>
                <div class="wx-meta-item"><span>Влажность</span><b class="wx-hum">72%</b></div>
                <div class="wx-meta-item"><span>Давление</span><b class="wx-press">748</b></div>
                <div class="wx-meta-item"><span>Видимость</span><b class="wx-vis">10 км</b></div>
              </div>
            </div>

            <div class="wx-section">
              <div class="wx-section-head"><h3>По часам</h3><span>следующие 12 часов</span></div>
              <div class="wx-hourly"></div>
            </div>

            <div class="wx-section">
              <div class="wx-section-head"><h3>На 5 дней</h3><span>демо-прогноз</span></div>
              <div class="wx-days"></div>
            </div>

            <div class="wx-note">
              ${OS.util.icon("info")}
              <span>Это демонстрационные данные для интерфейса. Погода генерируется локально и не запрашивает сеть.</span>
            </div>
          </div>
          <div class="app-status">
            <span class="wx-status">Москва · демо</span>
            <span>HTML OS · Погода</span>
          </div>
        </div>`;

      const hero = body.querySelector(".wx-hero");
      const cityEl = body.querySelector(".wx-city");
      const dateEl = body.querySelector(".wx-date");
      const iconEl = body.querySelector(".wx-icon");
      const tempEl = body.querySelector(".wx-temp");
      const descEl = body.querySelector(".wx-desc");
      const hourlyEl = body.querySelector(".wx-hourly");
      const daysEl = body.querySelector(".wx-days");
      const select = body.querySelector(".wx-select");
      const statusEl = body.querySelector(".wx-status");

      function render() {
        const seed = hash(city.id + new Date().toDateString());
        const rand = rng(seed);
        const now = new Date();
        const cond = CONDITIONS[city.cond] || CONDITIONS.cloudy;
        const feels = city.base + (rand() < 0.5 ? -2 : 2);

        hero.dataset.cond = city.cond;
        cityEl.textContent = city.name;
        dateEl.textContent = `${OS.util.fmtDateFull(now)} · обновлено ${OS.util.fmtTime(now)}`;
        iconEl.textContent = cond.icon;
        tempEl.textContent = tempStr(city.base);
        descEl.innerHTML = `<b>${cond.label}</b><span>Ощущается как ${tempStr(feels)}</span>`;
        body.querySelector(".wx-wind").textContent = `${city.wind} м/с`;
        body.querySelector(".wx-hum").textContent = `${city.humidity}%`;
        body.querySelector(".wx-press").textContent = `${city.pressure} мм`;
        body.querySelector(".wx-vis").textContent = city.cond === "fog" ? "1,2 км" : city.cond === "rain" || city.cond === "snow" ? "6 км" : "10 км";
        statusEl.textContent = `${city.name} · демо-данные`;

        // Почасовой прогноз
        hourlyEl.innerHTML = "";
        for (let i = 0; i < 12; i++) {
          const hour = (now.getHours() + i) % 24;
          const t = city.base + Math.sin((hour / 24) * Math.PI * 2) * 4 + (rand() - 0.5) * 2;
          const hCond = i === 0 ? city.cond : ORDER[Math.floor(rand() * ORDER.length)];
          const c = CONDITIONS[hCond];
          const item = document.createElement("div");
          item.className = "wx-hour" + (i === 0 ? " now" : "");
          item.innerHTML = `<span class="wx-hour-time">${i === 0 ? "Сейчас" : OS.util.pad(hour) + ":00"}</span>
            <span class="wx-hour-icon">${c.icon}</span>
            <b>${tempStr(t)}</b>`;
          hourlyEl.appendChild(item);
        }

        // Прогноз на 5 дней
        const days = [];
        let minAll = Infinity;
        let maxAll = -Infinity;
        for (let i = 0; i < 5; i++) {
          const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
          const base = city.base + (rand() - 0.45) * 7;
          const min = Math.round(base - 3 - rand() * 2);
          const max = Math.round(base + 3 + rand() * 3);
          const c = CONDITIONS[ORDER[Math.floor(rand() * ORDER.length)]];
          days.push({ date: d, min, max, cond: c, label: i === 0 ? "Сегодня" : WEEK[d.getDay()] });
          minAll = Math.min(minAll, min);
          maxAll = Math.max(maxAll, max);
        }
        const span = Math.max(1, maxAll - minAll);
        daysEl.innerHTML = days.map((d) => {
          const left = ((d.min - minAll) / span) * 100;
          const width = Math.max(8, ((d.max - d.min) / span) * 100);
          return `<div class="wx-day">
            <span class="wx-day-name">${d.label}</span>
            <span class="wx-day-icon" title="${d.cond.label}">${d.cond.icon}</span>
            <span class="wx-day-cond">${d.cond.label}</span>
            <span class="wx-day-min">${tempStr(d.min)}</span>
            <span class="wx-bar"><i style="left:${left}%;width:${width}%"></i></span>
            <span class="wx-day-max">${tempStr(d.max)}</span>
          </div>`;
        }).join("");

        win.setTitle(`Погода — ${city.name}`);
        win.setSubtitle(cond.label);
      }

      select.addEventListener("change", () => {
        city = CITIES.find((c) => c.id === select.value) || CITIES[0];
        render();
        OS.sound.play("click");
      });

      render();
      win.setTitle(`Погода — ${city.name}`);
    },
  });
})();
