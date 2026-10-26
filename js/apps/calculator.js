/* ══════════════════════════════════════════════════════════════════════
   HTML OS — приложение «Калькулятор»
   ══════════════════════════════════════════════════════════════════════ */
(() => {
  OS.registerApp({
    id: "calculator",
    name: "Калькулятор",
    icon: "🧮",
    color: ["#38bdf8", "#0ea5e9"],
    width: 360,
    height: 552,
    minWidth: 300,
    minHeight: 440,
    mount(body, win) {
      body.innerHTML = `
        <div class="app calc">
          <div class="calc-screen">
            <div class="calc-history"></div>
            <div class="calc-expr"></div>
            <div class="calc-out">0</div>
          </div>
          <div class="calc-pad">
            <button class="calc-key fn" data-k="clear">C</button>
            <button class="calc-key fn" data-k="back" title="Удалить символ">⌫</button>
            <button class="calc-key fn" data-k="percent">%</button>
            <button class="calc-key op" data-k="/">÷</button>

            <button class="calc-key" data-k="7">7</button>
            <button class="calc-key" data-k="8">8</button>
            <button class="calc-key" data-k="9">9</button>
            <button class="calc-key op" data-k="*">×</button>

            <button class="calc-key" data-k="4">4</button>
            <button class="calc-key" data-k="5">5</button>
            <button class="calc-key" data-k="6">6</button>
            <button class="calc-key op" data-k="-">−</button>

            <button class="calc-key" data-k="1">1</button>
            <button class="calc-key" data-k="2">2</button>
            <button class="calc-key" data-k="3">3</button>
            <button class="calc-key op" data-k="+">+</button>

            <button class="calc-key fn" data-k="neg">±</button>
            <button class="calc-key" data-k="0">0</button>
            <button class="calc-key" data-k=".">.</button>
            <button class="calc-key eq" data-k="=">=</button>
          </div>
          <div class="app-status">
            <span>HTML OS · Калькулятор</span>
            <span>Enter — равно · Esc — сброс</span>
          </div>
        </div>`;

      const outEl = body.querySelector(".calc-out");
      const exprEl = body.querySelector(".calc-expr");
      const histEl = body.querySelector(".calc-history");

      let current = "0";
      let previous = null;
      let operator = null;
      let waiting = false;
      let justEvaluated = false;
      let error = false;
      let exprText = "";
      const history = [];

      const SYM = { "+": "+", "-": "−", "*": "×", "/": "÷" };

      function fmt(n) {
        if (!isFinite(n)) return "Ошибка";
        let s = String(n);
        if (s.length > 15) {
          s = String(Number(n.toPrecision(10)));
        }
        return s;
      }

      function parse(value) {
        return parseFloat(value) || 0;
      }

      function update() {
        outEl.textContent = error ? "Ошибка" : current;
        outEl.classList.toggle("small", !error && current.length > 10 && current.length <= 14);
        outEl.classList.toggle("tiny", !error && current.length > 14);
        exprEl.textContent = error ? "деление на ноль" : exprText;
        histEl.textContent = history.length ? history[history.length - 1] : "";
        exprEl.style.color = error ? "#ff7b87" : "";
      }

      function reset() {
        current = "0";
        previous = null;
        operator = null;
        waiting = false;
        justEvaluated = false;
        error = false;
        exprText = "";
        update();
      }

      function compute(a, b, op) {
        switch (op) {
          case "+": return a + b;
          case "-": return a - b;
          case "*": return a * b;
          case "/": return b === 0 ? null : a / b;
          default: return b;
        }
      }

      function round(n) {
        return Math.round(n * 1e12) / 1e12;
      }

      function digit(d) {
        if (error) reset();
        if (waiting || justEvaluated) {
          current = d;
          waiting = false;
          justEvaluated = false;
          if (operator) exprText = `${fmt(previous)} ${SYM[operator]} `;
        } else {
          if (current.replace(/[-.]/g, "").length >= 14) return;
          current = current === "0" ? d : current + d;
        }
        if (operator) exprText = `${fmt(previous)} ${SYM[operator]} ${current}`;
        update();
      }

      function dot() {
        if (error) reset();
        if (waiting || justEvaluated) {
          current = "0.";
          waiting = false;
          justEvaluated = false;
          if (operator) exprText = `${fmt(previous)} ${SYM[operator]} 0.`;
        } else if (!current.includes(".")) {
          current += ".";
          if (operator) exprText = `${fmt(previous)} ${SYM[operator]} ${current}`;
        }
        update();
      }

      function setOperator(op) {
        if (error) return;
        const value = parse(current);
        if (operator && !waiting && previous !== null) {
          const result = compute(previous, value, operator);
          if (result === null) {
            error = true;
            exprText = `${fmt(previous)} ${SYM[operator]} ${fmt(value)}`;
            update();
            return;
          }
          previous = round(result);
          current = fmt(previous);
        } else if (previous === null) {
          previous = value;
        }
        operator = op;
        waiting = true;
        justEvaluated = false;
        exprText = `${fmt(previous)} ${SYM[operator]} `;
        update();
      }

      function equals() {
        if (error || operator === null || previous === null) return;
        const value = parse(current);
        const result = compute(previous, value, operator);
        if (result === null) {
          error = true;
          exprText = `${fmt(previous)} ${SYM[operator]} ${fmt(value)}`;
          update();
          return;
        }
        const rounded = round(result);
        const line = `${fmt(previous)} ${SYM[operator]} ${fmt(value)} =`;
        history.push(`${line} ${fmt(rounded)}`);
        if (history.length > 30) history.shift();
        exprText = line;
        current = fmt(rounded);
        previous = null;
        operator = null;
        waiting = false;
        justEvaluated = true;
        update();
      }

      function percent() {
        if (error) return;
        const value = parse(current);
        if (operator && previous !== null) {
          current = fmt(round((previous * value) / 100));
        } else {
          current = fmt(round(value / 100));
        }
        justEvaluated = false;
        update();
      }

      function negate() {
        if (error || current === "0") return;
        current = current.startsWith("-") ? current.slice(1) : "-" + current;
        if (operator) exprText = `${fmt(previous)} ${SYM[operator]} ${current}`;
        update();
      }

      function backspace() {
        if (error) { reset(); return; }
        if (waiting || justEvaluated) return;
        current = current.length > 1 ? current.slice(0, -1) : "0";
        if (current === "-" || current === "") current = "0";
        if (operator) exprText = `${fmt(previous)} ${SYM[operator]} ${current}`;
        update();
      }

      function handle(key) {
        if (/^\d$/.test(key)) return digit(key);
        if (key === ".") return dot();
        if (["+", "-", "*", "/"].includes(key)) return setOperator(key);
        if (key === "=") return equals();
        if (key === "clear") return reset();
        if (key === "back") return backspace();
        if (key === "percent") return percent();
        if (key === "neg") return negate();
        return undefined;
      }

      body.querySelector(".calc-pad").addEventListener("click", (e) => {
        const btn = e.target.closest("[data-k]");
        if (!btn) return;
        handle(btn.dataset.k);
      });

      win.el.addEventListener("keydown", (e) => {
        if (e.target.closest("input, textarea")) return;
        const key = e.key;
        let mapped = null;
        if (/^\d$/.test(key)) mapped = key;
        else if (key === "." || key === ",") mapped = ".";
        else if (key === "+" || key === "-" || key === "*" || key === "/") mapped = key;
        else if (key === "Enter" || key === "=") mapped = "=";
        else if (key === "Escape" || key === "Delete") mapped = "clear";
        else if (key === "Backspace") mapped = "back";
        else if (key === "%") mapped = "percent";
        if (mapped !== null) {
          e.preventDefault();
          handle(mapped);
        }
      });

      win.setTitle("Калькулятор");
      update();
    },
  });
})();
