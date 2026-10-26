/* ══════════════════════════════════════════════════════════════════════
   HTML OS — приложение «Музыка» (процедурный синтезатор)
   ══════════════════════════════════════════════════════════════════════ */
(() => {
  const SEMI = { C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5, "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11 };

  function freq(note) {
    const m = /^([A-G]#?)(\d)$/.exec(note);
    if (!m) return 440;
    const midi = 12 * (Number(m[2]) + 1) + SEMI[m[1]];
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  const TRACKS = [
    {
      title: "Ночной город",
      artist: "HTML OS Synth",
      bpm: 100,
      wave: "triangle",
      loops: 8,
      colors: ["#38bdf8", "#6366f1"],
      drums: true,
      melody: ["A3", "C4", "E4", "A4", "G4", "E4", "C4", "E4", "F3", "A3", "C4", "F4", "E4", "C4", "A3", "C4"],
      bass: ["A2", "F2", "C3", "G2"],
      pad: [["A3", "C4", "E4"], ["F3", "A3", "C4"], ["C3", "E3", "G3"], ["G3", "B3", "D4"]],
    },
    {
      title: "Неоновый дождь",
      artist: "HTML OS Synth",
      bpm: 112,
      wave: "sawtooth",
      loops: 8,
      colors: ["#f472b6", "#8b5cf6"],
      drums: true,
      melody: ["D4", "F4", "A4", "D5", "C5", "A4", "F4", "A4", "A#3", "D4", "F4", "A#4", "A4", "F4", "D4", "F4"],
      bass: ["D3", "A#2", "F2", "C3"],
      pad: [["D3", "F3", "A3"], ["A#2", "D3", "F3"], ["F2", "A2", "C3"], ["C3", "E3", "G3"]],
    },
    {
      title: "Глубокий космос",
      artist: "Ambient Module",
      bpm: 62,
      wave: "sine",
      loops: 5,
      colors: ["#22d3ee", "#312e81"],
      drums: false,
      melody: ["C4", "G4", "E5", "D5", "A3", "E4", "C5", "B4", "F3", "C4", "A4", "G4", "E4", "B3", "G4", "D4"],
      bass: ["C2", "A1", "F2", "G2"],
      pad: [["C3", "E3", "G3"], ["A2", "C3", "E3"], ["F2", "A2", "C3"], ["G2", "B2", "D3"]],
    },
    {
      title: "Утренний кофе",
      artist: "Lo-Fi Kitchen",
      bpm: 84,
      wave: "triangle",
      loops: 8,
      colors: ["#fbbf24", "#f97316"],
      drums: true,
      melody: ["F4", "A4", "C5", "E5", "D5", "C5", "A4", "C5", "G4", "B4", "D5", "G5", "F5", "D5", "B4", "D5"],
      bass: ["F2", "G2", "E2", "A2"],
      pad: [["F3", "A3", "C4", "E4"], ["G3", "B3", "D4"], ["E3", "G3", "B3"], ["A3", "C4", "E4"]],
    },
  ];

  const fmt = (sec) => {
    const s = Math.max(0, Math.floor(sec));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };

  OS.registerApp({
    id: "music",
    name: "Музыка",
    icon: "🎵",
    color: ["#f472b6", "#7c3aed"],
    width: 900,
    height: 580,
    minWidth: 560,
    minHeight: 400,
    mount(body, win) {
      body.innerHTML = `
        <div class="app music">
          <div class="mus-body">
            <div class="mus-main">
              <div class="mus-cover">
                <div class="mus-vinyl"><span></span></div>
              </div>
              <div class="mus-meta">
                <div class="mus-title">—</div>
                <div class="mus-artist">HTML OS Synth</div>
              </div>
              <div class="mus-viz">${"<span></span>".repeat(22)}</div>
              <div class="mus-progress">
                <span class="mus-cur">0:00</span>
                <input class="range mus-seek" type="range" min="0" max="1000" value="0" aria-label="Позиция трека">
                <span class="mus-dur">0:00</span>
              </div>
              <div class="mus-controls">
                <button class="mus-btn" data-act="prev" title="Предыдущий трек">${OS.util.icon("prev")}</button>
                <button class="mus-btn play" data-act="play" title="Играть">${OS.util.icon("play")}</button>
                <button class="mus-btn" data-act="next" title="Следующий трек">${OS.util.icon("next")}</button>
                <div class="mus-vol">
                  ${OS.util.icon("volume")}
                  <input class="range mus-volume" type="range" min="0" max="100" step="1" aria-label="Громкость">
                </div>
              </div>
            </div>
            <aside class="mus-side">
              <div class="mus-side-head">
                <span>Плейлист</span>
                <b>«Ночная смена»</b>
              </div>
              <div class="mus-tracks"></div>
              <div class="mus-side-foot">${OS.util.icon("music")} Web Audio API · синтез в реальном времени</div>
            </aside>
          </div>
          <div class="app-status">
            <span class="mus-status">Пауза</span>
            <span>Все треки синтезируются в браузере</span>
          </div>
        </div>`;

      const S = OS.settings;
      const tracksEl = body.querySelector(".mus-tracks");
      const titleEl = body.querySelector(".mus-title");
      const artistEl = body.querySelector(".mus-artist");
      const coverEl = body.querySelector(".mus-cover");
      const playBtn = body.querySelector('[data-act="play"]');
      const seek = body.querySelector(".mus-seek");
      const curEl = body.querySelector(".mus-cur");
      const durEl = body.querySelector(".mus-dur");
      const volRange = body.querySelector(".mus-volume");
      const statusEl = body.querySelector(".mus-status");
      const vizBars = Array.from(body.querySelectorAll(".mus-viz span"));
      const musicEl = body.querySelector(".music");

      let index = 0;
      let audio = null;
      let master = null;
      let analyser = null;
      let freqData = null;
      let stepTimer = null;
      let progressTimer = null;
      let vizTimer = null;
      let playing = false;
      let offset = 0;
      let startedAt = 0;
      let step = 0;

      const track = () => TRACKS[index];
      const stepDur = () => 60 / track().bpm / 2;
      const duration = () => track().loops * 16 * stepDur();

      tracksEl.innerHTML = TRACKS.map((t, i) => `
        <button class="mus-track" data-i="${i}">
          <span class="mus-track-num">${String(i + 1).padStart(2, "0")}</span>
          <span class="mus-track-info">
            <b>${t.title}</b>
            <span>${t.artist} · ${t.bpm} BPM</span>
          </span>
          <span class="mus-track-eq"><i></i><i></i><i></i></span>
        </button>`).join("");

      function ensureAudio() {
        if (audio) return;
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) throw new Error("Web Audio API не поддерживается");
        audio = new AC();
        master = audio.createGain();
        analyser = audio.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.78;
        freqData = new Uint8Array(analyser.frequencyBinCount);
        master.connect(analyser);
        analyser.connect(audio.destination);
        applyVolume();
      }

      function applyVolume() {
        const vol = Number(S.get("volume") ?? 0.6);
        volRange.value = Math.round(vol * 100);
        volRange.style.setProperty("--fill", Math.round(vol * 100) + "%");
        if (master && audio) {
          master.gain.setTargetAtTime(Math.max(0, vol) * 0.85, audio.currentTime, 0.04);
        }
      }

      function note(f, dur, wave = "triangle", gain = 0.08, when = 0) {
        if (!audio) return;
        const t = when || audio.currentTime;
        const osc = audio.createOscillator();
        const g = audio.createGain();
        osc.type = wave;
        osc.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(gain, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.08, dur));
        osc.connect(g);
        g.connect(master);
        osc.start(t);
        osc.stop(t + Math.max(0.1, dur) + 0.05);
      }

      function kick(when) {
        if (!audio) return;
        const osc = audio.createOscillator();
        const g = audio.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(150, when);
        osc.frequency.exponentialRampToValueAtTime(46, when + 0.12);
        g.gain.setValueAtTime(0.24, when);
        g.gain.exponentialRampToValueAtTime(0.0001, when + 0.18);
        osc.connect(g);
        g.connect(master);
        osc.start(when);
        osc.stop(when + 0.22);
      }

      let noiseBuffer = null;
      function hat(when, gain = 0.035) {
        if (!audio) return;
        if (!noiseBuffer) {
          noiseBuffer = audio.createBuffer(1, Math.floor(audio.sampleRate * 0.08), audio.sampleRate);
          const data = noiseBuffer.getChannelData(0);
          for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        }
        const src = audio.createBufferSource();
        src.buffer = noiseBuffer;
        const hp = audio.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 7000;
        const g = audio.createGain();
        g.gain.setValueAtTime(gain, when);
        g.gain.exponentialRampToValueAtTime(0.0001, when + 0.05);
        src.connect(hp);
        hp.connect(g);
        g.connect(master);
        src.start(when);
      }

      function scheduleTick() {
        if (!playing || !audio) return;
        const t = track();
        const when = audio.currentTime + 0.04;
        const idx = step % 16;
        const sd = stepDur();
        const m = t.melody[idx];
        if (m) note(freq(m), sd * (t.wave === "sine" ? 1.9 : 0.85), t.wave, t.wave === "sine" ? 0.055 : 0.07, when);

        if (idx % 4 === 0) {
          const chordIdx = Math.floor(idx / 4) % t.bass.length;
          note(freq(t.bass[chordIdx]), sd * 3.6, "sine", 0.12, when);
          (t.pad[chordIdx] || []).forEach((n, i) => {
            note(freq(n), sd * 3.8, "sine", 0.028 / (i + 1), when + i * 0.01);
          });
          if (t.drums) kick(when);
        }
        if (t.drums && idx % 2 === 0) hat(when, idx % 4 === 2 ? 0.05 : 0.025);
        step++;
      }

      function updateViz() {
        if (!analyser || !freqData) return;
        analyser.getByteFrequencyData(freqData);
        const stepSize = Math.floor(freqData.length / vizBars.length);
        vizBars.forEach((bar, i) => {
          let sum = 0;
          for (let j = 0; j < stepSize; j++) sum += freqData[i * stepSize + j];
          const v = sum / stepSize / 255;
          bar.style.height = Math.max(8, Math.round(v * 100)) + "%";
        });
      }

      function idleViz() {
        vizBars.forEach((bar, i) => {
          bar.style.height = 8 + ((i * 7) % 13) + "%";
        });
      }

      function updateUI() {
        const t = track();
        titleEl.textContent = t.title;
        artistEl.textContent = t.artist;
        coverEl.style.setProperty("--c1", t.colors[0]);
        coverEl.style.setProperty("--c2", t.colors[1]);
        musicEl.classList.toggle("playing", playing);
        playBtn.innerHTML = OS.util.icon(playing ? "pause" : "play");
        playBtn.title = playing ? "Пауза" : "Играть";
        statusEl.textContent = playing ? `Играет · ${t.title}` : "Пауза";
        win.setTitle(`Музыка — ${t.title}`);
        win.setSubtitle(t.artist);
        durEl.textContent = fmt(duration());
        curEl.textContent = fmt(playing ? elapsed() : offset);
        seek.value = Math.round(((playing ? elapsed() : offset) / duration()) * 1000);
        tracksEl.querySelectorAll(".mus-track").forEach((row, i) => {
          row.classList.toggle("active", i === index);
          row.classList.toggle("playing", i === index && playing);
        });
        if (!playing) idleViz();
      }

      function elapsed() {
        return Math.min(duration(), offset + (performance.now() - startedAt) / 1000);
      }

      function clearTimers() {
        clearInterval(stepTimer);
        clearInterval(progressTimer);
        clearInterval(vizTimer);
        stepTimer = progressTimer = vizTimer = null;
      }

      function play() {
        try {
          ensureAudio();
        } catch (e) {
          OS.ui.notify({ title: "Нет звука", text: e.message, icon: "⚠️" });
          return;
        }
        if (audio.state === "suspended") audio.resume();
        if (offset >= duration()) offset = 0;
        startedAt = performance.now() - offset * 1000;
        step = Math.floor(offset / stepDur()) % 16;
        playing = true;
        applyVolume();
        scheduleTick();
        stepTimer = setInterval(scheduleTick, stepDur() * 1000);
        progressTimer = setInterval(() => {
          if (!playing) return;
          const e = elapsed();
          curEl.textContent = fmt(e);
          seek.value = Math.round((e / duration()) * 1000);
          if (e >= duration() - 0.05) changeTrack(1, true);
        }, 200);
        vizTimer = setInterval(updateViz, 70);
        updateUI();
      }

      function pause() {
        if (!playing) return;
        offset = elapsed();
        playing = false;
        clearTimers();
        updateUI();
      }

      function togglePlay() {
        if (playing) pause();
        else play();
      }

      function changeTrack(delta, auto = false) {
        const wasPlaying = playing || auto;
        playing = false;
        clearTimers();
        index = (index + delta + TRACKS.length) % TRACKS.length;
        offset = 0;
        step = 0;
        updateUI();
        if (wasPlaying) play();
      }

      body.querySelector(".mus-tracks").addEventListener("click", (e) => {
        const row = e.target.closest("[data-i]");
        if (!row) return;
        const i = Number(row.dataset.i);
        if (i === index) {
          togglePlay();
          return;
        }
        const was = playing;
        playing = false;
        clearTimers();
        index = i;
        offset = 0;
        step = 0;
        updateUI();
        if (was) play();
      });

      body.querySelector('[data-act="play"]').addEventListener("click", togglePlay);
      body.querySelector('[data-act="next"]').addEventListener("click", () => changeTrack(1));
      body.querySelector('[data-act="prev"]').addEventListener("click", () => {
        if (offset > 3) {
          offset = 0;
          if (playing) {
            startedAt = performance.now();
            step = 0;
          }
          updateUI();
        } else {
          changeTrack(-1);
        }
      });

      seek.addEventListener("input", () => {
        const frac = Number(seek.value) / 1000;
        offset = duration() * frac;
        curEl.textContent = fmt(offset);
        if (playing) {
          startedAt = performance.now() - offset * 1000;
          step = Math.floor(offset / stepDur()) % 16;
        }
      });

      volRange.addEventListener("input", () => {
        const v = Number(volRange.value);
        volRange.style.setProperty("--fill", v + "%");
        S.set("volume", v / 100);
        applyVolume();
      });

      win.el.addEventListener("keydown", (e) => {
        if (e.target.closest("input")) return;
        if (e.code === "Space") {
          e.preventDefault();
          togglePlay();
        } else if (e.key === "ArrowRight" && e.ctrlKey) {
          e.preventDefault();
          changeTrack(1);
        } else if (e.key === "ArrowLeft" && e.ctrlKey) {
          e.preventDefault();
          changeTrack(-1);
        }
      });

      const unsub = S.onChange(() => applyVolume());
      win.onClose(() => {
        clearTimers();
        unsub();
        if (audio) {
          audio.close().catch(() => {});
          audio = null;
        }
      });

      applyVolume();
      index = 0;
      idleViz();
      updateUI();
      win.onFocus(() => {});
    },
  });
})();
