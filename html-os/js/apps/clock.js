/* ══════════════════════════════════════════════════════════════════════
   HTML OS — приложение «Часы» (часы, календарь, секундомер, таймер)
   ══════════════════════════════════════════════════════════════════════ */
(() => {
  const CITIES = [
    { name: "Москва", tz: "Europe/Moscow" },
    { name: "Лондон", tz: "Europe/London" },
    { name: "Нью-Йорк", tz: "America/New_York" },
    { name: "Токио", tz: "Asia/Tokyo" },
  ];
  const WEEK = Array.from({ length: 7 }, (_, i) => {
    const s = new Intl.DateTimeFormat(OS.i18n.locale, { weekday: "short" }).format(new Date(2024, 0, 1 + i));
    return s.charAt(0).toUpperCase() + s.slice(1);
  });
  const MONTHS = Array.from({ length: 12 }, (_, i) => {
    const s = new Intl.DateTimeFormat(OS.i18n.locale, { month: "long" }).format(new Date(2024, i, 1));
    return s.charAt(0).toUpperCase() + s.slice(1);
  });

  OS.registerApp({
    id: "clock",
    name: "Часы",
    icon: "🕒",
    color: ["#22d3ee", "#0e7490"],
    width: 860,
    height: 620,
    minWidth: 580,
    minHeight: 460,
    mount(body, win) {
      body.innerHTML = `
        <div class="app clockapp">
          <div class="app-toolbar">
            <div class="seg clock-tabs">
              <button class="seg-btn active" data-tab="clock">Часы</button>
              <button class="seg-btn" data-tab="stopwatch">Секундомер</button>
              <button class="seg-btn" data-tab="timer">Таймер</button>
            </div>
            <div class="grow"></div>
            <span class="clock-tz muted small">${Intl.DateTimeFormat().resolvedOptions().timeZone || "локальное время"}</span>
          </div>
          <div class="clock-body">
            <section class="clock-page active" data-page="clock">
              <div class="clk-left">
                <div class="analog-wrap">
                  <svg class="analog" viewBox="0 0 220 220" aria-label="Аналоговые часы">
                    <circle cx="110" cy="110" r="103" class="cl-face"/>
                    <g class="cl-ticks"></g>
                    <line x1="110" y1="110" x2="110" y2="55" class="cl-hand cl-hour"/>
                    <line x1="110" y1="110" x2="110" y2="28" class="cl-hand cl-minute"/>
                    <line x1="110" y1="110" x2="110" y2="20" class="cl-hand cl-second"/>
                    <circle cx="110" cy="110" r="5" class="cl-pin"/>
                  </svg>
                </div>
                <div class="digital">
                  <b class="clk-time">00:00:00</b>
                  <span class="clk-date">—</span>
                </div>
              </div>
              <div class="clk-right">
                <div class="world-grid"></div>
                <div class="calendar">
                  <div class="cal-head">
                    <button class="cal-nav" data-cal="-1" type="button">${OS.util.icon("left")}</button>
                    <b class="cal-title"></b>
                    <button class="cal-nav" data-cal="1" type="button">${OS.util.icon("right")}</button>
                  </div>
                  <div class="cal-week">${WEEK.map((d) => `<span>${d}</span>`).join("")}</div>
                  <div class="cal-grid"></div>
                </div>
              </div>
            </section>

            <section class="clock-page" data-page="stopwatch">
              <div class="sw-ring">
                <div class="sw-time">00:00<span>.00</span></div>
                <div class="sw-hint">Секундомер</div>
              </div>
              <div class="sw-actions">
                <button class="btn primary sw-toggle" type="button">Старт</button>
                <button class="btn sw-lap" type="button" disabled>Круг</button>
                <button class="btn sw-reset" type="button">Сброс</button>
              </div>
              <div class="sw-laps"></div>
            </section>

            <section class="clock-page" data-page="timer">
              <div class="timer-wrap">
                <svg class="timer-ring" viewBox="0 0 220 220">
                  <circle cx="110" cy="110" r="96" class="tr-bg"/>
                  <circle cx="110" cy="110" r="96" class="tr-bar"/>
                </svg>
                <div class="timer-center">
                  <b class="timer-time">05:00</b>
                  <span class="timer-sub">таймер</span>
                </div>
              </div>
              <div class="timer-presets">
                <button class="chip" data-min="1">1 мин</button>
                <button class="chip" data-min="5">5 мин</button>
                <button class="chip" data-min="10">10 мин</button>
                <button class="chip" data-min="25">25 мин</button>
              </div>
              <div class="timer-inputs">
                <label>Минуты<input class="field t-min" type="number" min="0" max="180" value="5"></label>
                <label>Секунды<input class="field t-sec" type="number" min="0" max="59" value="0"></label>
              </div>
              <div class="timer-actions">
                <button class="btn primary timer-toggle" type="button">Старт</button>
                <button class="btn timer-reset" type="button">Сброс</button>
              </div>
            </section>
          </div>
          <div class="app-status">
            <span class="clock-status">Местное время</span>
            <span class="clock-hint">Часы, календарь, секундомер и таймер</span>
          </div>
        </div>`;

      const tabs = body.querySelector(".clock-tabs");
      const pages = body.querySelectorAll(".clock-page");
      const ticksGroup = body.querySelector(".cl-ticks");
      const hourHand = body.querySelector(".cl-hour");
      const minuteHand = body.querySelector(".cl-minute");
      const secondHand = body.querySelector(".cl-second");
      const timeEl = body.querySelector(".clk-time");
      const dateEl = body.querySelector(".clk-date");
      const worldEl = body.querySelector(".world-grid");
      const calTitle = body.querySelector(".cal-title");
      const calGrid = body.querySelector(".cal-grid");
      const statusEl = body.querySelector(".clock-status");

      let tab = "clock";
      let lastClockSecond = -1;
      let calendarDate = new Date();

      // Деления на циферблате
      const NS = "http://www.w3.org/2000/svg";
      for (let i = 0; i < 60; i++) {
        const angle = (i * 6 * Math.PI) / 180;
        const major = i % 5 === 0;
        const r1 = major ? 84 : 91;
        const r2 = 97;
        const line = document.createElementNS(NS, "line");
        line.setAttribute("x1", String(110 + Math.sin(angle) * r1));
        line.setAttribute("y1", String(110 - Math.cos(angle) * r1));
        line.setAttribute("x2", String(110 + Math.sin(angle) * r2));
        line.setAttribute("y2", String(110 - Math.cos(angle) * r2));
        line.setAttribute("class", major ? "cl-tick major" : "cl-tick");
        ticksGroup.appendChild(line);
      }

      worldEl.innerHTML = CITIES.map((c) => `
        <div class="world-card" data-tz="${c.tz}">
          <span class="world-city">${c.name}</span>
          <b class="world-time">—</b>
          <span class="world-diff">—</span>
        </div>`).join("");

      function pad(n) { return String(n).padStart(2, "0"); }

      function updateClock(now) {
        const h = now.getHours() % 12;
        const m = now.getMinutes();
        const s = now.getSeconds();
        hourHand.setAttribute("transform", `rotate(${h * 30 + m * 0.5} 110 110)`);
        minuteHand.setAttribute("transform", `rotate(${m * 6 + s * 0.1} 110 110)`);
        secondHand.setAttribute("transform", `rotate(${s * 6} 110 110)`);
        timeEl.textContent = `${pad(now.getHours())}:${pad(m)}:${pad(s)}`;
        dateEl.textContent = OS.util.fmtDate(now) + " " + now.getFullYear();

        if (s !== lastClockSecond) {
          lastClockSecond = s;
          worldEl.querySelectorAll(".world-card").forEach((card) => {
            const tz = card.dataset.tz;
            try {
              const time = new Intl.DateTimeFormat("ru-RU", { timeZone: tz, hour: "2-digit", minute: "2-digit" }).format(now);
              card.querySelector(".world-time").textContent = time;
              const dateStr = new Intl.DateTimeFormat("ru-RU", { timeZone: tz, day: "2-digit", month: "2-digit" }).format(now);
              const localStr = new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit" }).format(now);
              card.querySelector(".world-diff").textContent = dateStr === localStr ? "сегодня" : "другая дата";
            } catch {
              card.querySelector(".world-time").textContent = "—";
            }
          });
        }
      }

      function renderCalendar() {
        const year = calendarDate.getFullYear();
        const month = calendarDate.getMonth();
        calTitle.textContent = `${MONTHS[month]} ${year}`;
        const first = new Date(year, month, 1);
        const startOffset = (first.getDay() + 6) % 7;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const prevDays = new Date(year, month, 0).getDate();
        const today = new Date();
        const cells = [];
        for (let i = 0; i < 42; i++) {
          const dayNum = i - startOffset + 1;
          let date;
          let other = false;
          if (dayNum < 1) {
            date = new Date(year, month - 1, prevDays + dayNum);
            other = true;
          } else if (dayNum > daysInMonth) {
            date = new Date(year, month + 1, dayNum - daysInMonth);
            other = true;
          } else {
            date = new Date(year, month, dayNum);
          }
          const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
          cells.push(`<span class="cal-day${other ? " other" : ""}${isToday ? " today" : ""}" title="${OS.util.fmtDateFull(date)}">${date.getDate()}</span>`);
        }
        calGrid.innerHTML = cells.join("");
      }

      body.querySelectorAll("[data-cal]").forEach((btn) => {
        btn.addEventListener("click", () => {
          calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + Number(btn.dataset.cal), 1);
          renderCalendar();
        });
      });

      tabs.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-tab]");
        if (!btn) return;
        tab = btn.dataset.tab;
        tabs.querySelectorAll("[data-tab]").forEach((b) => b.classList.toggle("active", b === btn));
        pages.forEach((p) => p.classList.toggle("active", p.dataset.page === tab));
        const names = { clock: "Часы и календарь", stopwatch: "Секундомер", timer: "Таймер" };
        win.setSubtitle(names[tab]);
        win.setTitle(`Часы — ${names[tab]}`);
        statusEl.textContent = names[tab];
        OS.sound.play("click");
      });

      /* ─── Секундомер ─────────────────────────────────────────────── */
      let swRunning = false;
      let swStart = 0;
      let swSaved = 0;
      const swLaps = [];
      const swTime = body.querySelector(".sw-time");
      const swToggle = body.querySelector(".sw-toggle");
      const swLap = body.querySelector(".sw-lap");
      const swReset = body.querySelector(".sw-reset");
      const swLapsEl = body.querySelector(".sw-laps");

      const swElapsed = () => swSaved + (swRunning ? performance.now() - swStart : 0);

      function fmtSw(ms) {
        const total = Math.floor(ms / 10);
        const cs = total % 100;
        const totalSec = Math.floor(total / 100);
        const s = totalSec % 60;
        const m = Math.floor(totalSec / 60) % 60;
        const h = Math.floor(totalSec / 3600);
        const base = h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
        return `${base}<span>.${pad(cs)}</span>`;
      }

      function renderLaps() {
        swLapsEl.innerHTML = swLaps.map((lap, i) => {
          const prev = i === 0 ? 0 : swLaps[i - 1];
          const split = lap - prev;
          return `<div class="sw-lap-row"><span>Круг ${i + 1}</span><b>${OS.util.pad(Math.floor(split / 60000))}:${OS.util.pad(Math.floor(split / 1000) % 60)}.${String(Math.floor(split / 10) % 100).padStart(2, "0")}</b><span>${OS.util.pad(Math.floor(lap / 60000))}:${OS.util.pad(Math.floor(lap / 1000) % 60)}.${String(Math.floor(lap / 10) % 100).padStart(2, "0")}</span></div>`;
        }).join("");
      }

      swToggle.addEventListener("click", () => {
        if (swRunning) {
          swSaved = swElapsed();
          swRunning = false;
          swToggle.textContent = "Продолжить";
          swLap.disabled = true;
          statusEl.textContent = "Секундомер на паузе";
        } else {
          swStart = performance.now();
          swRunning = true;
          swToggle.textContent = "Пауза";
          swLap.disabled = false;
          statusEl.textContent = "Секундомер идёт";
        }
      });
      swLap.addEventListener("click", () => {
        swLaps.push(swElapsed());
        renderLaps();
        OS.sound.play("click");
      });
      swReset.addEventListener("click", () => {
        swRunning = false;
        swSaved = 0;
        swLaps.length = 0;
        swToggle.textContent = "Старт";
        swLap.disabled = true;
        swTime.innerHTML = "00:00<span>.00</span>";
        renderLaps();
        statusEl.textContent = "Секундомер сброшен";
      });

      /* ─── Таймер ─────────────────────────────────────────────────── */
      const timerTime = body.querySelector(".timer-time");
      const timerBar = body.querySelector(".tr-bar");
      const timerToggle = body.querySelector(".timer-toggle");
      const timerReset = body.querySelector(".timer-reset");
      const minInput = body.querySelector(".t-min");
      const secInput = body.querySelector(".t-sec");
      const circumference = 2 * Math.PI * 96;
      timerBar.style.strokeDasharray = String(circumference);
      timerBar.style.strokeDashoffset = "0";

      let timerTotal = 300;
      let timerRemaining = 300;
      let timerRunning = false;
      let timerEnd = 0;
      let timerFinished = false;

      function updateTimerDisplay() {
        const secs = Math.max(0, timerRunning ? (timerEnd - performance.now()) / 1000 : timerRemaining);
        const shown = Math.ceil(secs);
        timerTime.textContent = `${pad(Math.floor(shown / 60))}:${pad(shown % 60)}`;
        const frac = timerTotal > 0 ? Math.max(0, Math.min(1, secs / timerTotal)) : 0;
        timerBar.style.strokeDashoffset = String(circumference * (1 - frac));
        timerBar.classList.toggle("low", frac < 0.2);
      }

      function setTimerFromInputs() {
        if (timerRunning) return;
        const mins = Math.max(0, Math.min(180, Number(minInput.value) || 0));
        const secs = Math.max(0, Math.min(59, Number(secInput.value) || 0));
        timerTotal = mins * 60 + secs;
        timerRemaining = timerTotal;
        timerFinished = false;
        timerToggle.textContent = "Старт";
        updateTimerDisplay();
      }

      [minInput, secInput].forEach((input) => input.addEventListener("change", setTimerFromInputs));

      body.querySelectorAll("[data-min]").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (timerRunning) return;
          minInput.value = btn.dataset.min;
          secInput.value = "0";
          setTimerFromInputs();
          OS.sound.play("click");
        });
      });

      function startTimer() {
        if (timerRemaining <= 0) setTimerFromInputs();
        if (timerRemaining <= 0) return;
        timerEnd = performance.now() + timerRemaining * 1000;
        timerRunning = true;
        timerToggle.textContent = "Пауза";
        statusEl.textContent = "Таймер запущен";
        updateTimerDisplay();
      }

      function pauseTimer() {
        timerRemaining = Math.max(0, (timerEnd - performance.now()) / 1000);
        timerRunning = false;
        timerToggle.textContent = "Продолжить";
        statusEl.textContent = "Таймер на паузе";
      }

      timerToggle.addEventListener("click", () => {
        if (timerRunning) pauseTimer();
        else startTimer();
      });
      timerReset.addEventListener("click", () => {
        timerRunning = false;
        timerFinished = false;
        timerRemaining = timerTotal;
        timerToggle.textContent = "Старт";
        updateTimerDisplay();
        statusEl.textContent = "Таймер сброшен";
      });

      /* ─── Общий цикл ─────────────────────────────────────────────── */
      const timerId = setInterval(() => {
        const now = new Date();
        updateClock(now);
        if (swRunning || swSaved) swTime.innerHTML = fmtSw(swElapsed());
        if (timerRunning) {
          const left = (timerEnd - performance.now()) / 1000;
          if (left <= 0) {
            timerRunning = false;
            timerRemaining = 0;
            timerFinished = true;
            timerToggle.textContent = "Старт";
            updateTimerDisplay();
            timerBar.style.strokeDashoffset = String(circumference);
            OS.sound.play("notify");
            OS.ui.notify({ title: "Таймер завершён", text: "Время вышло! Пора сделать перерыв.", icon: "⏰", app: "clock", timeout: 8000 });
            statusEl.textContent = "Таймер завершён";
          } else {
            updateTimerDisplay();
          }
        }
      }, 90);

      win.onClose(() => clearInterval(timerId));

      updateClock(new Date());
      renderCalendar();
      updateTimerDisplay();
      win.setTitle("Часы — Часы и календарь");
      win.setSubtitle("Часы и календарь");
      void timerFinished;
    },
  });
})();
