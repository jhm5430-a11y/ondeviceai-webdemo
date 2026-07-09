/* 온디바이스 AI 협력학습 데모 — 시나리오 오디오 타임라인이 학생/교사 대시보드를 구동 */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const SPK_COLORS = { "하준": "#4FA3E3", "수아": "#E38FB8", "지호": "#66BB8A", "윤서": "#C9A227" };
  const STAGE_IDX = 2; // 데모 기본 단계 = 비판검토

  let feat = null;            // 현재 기능
  let scenario = null, iv = null;   // Audio
  let raf = 0, lastT = 0;
  let phase = "idle";         // idle | playing | intervene | done
  let fired = { yellow: false, red: false, enc: false, recovered: false, advanced: false };
  let talk = {};              // 화자별 누적 발화(초)
  let lastSpeechEnd = 0;      // 침묵 계산용
  let stageIdx = STAGE_IDX;

  // ── 기능 선택 그리드 ─────────────────────────────────────────
  $("hdrTopic").textContent = DEMO_DATA.topic;
  const grid = $("featureGrid");
  DEMO_DATA.features.forEach((f) => {
    const b = document.createElement("button");
    b.innerHTML = `<span class="fi">${f.icon}</span>${f.name}`;
    b.onclick = () => select(f, b);
    grid.appendChild(b);
  });

  function select(f, btn) {
    grid.querySelectorAll("button").forEach((x) => x.classList.remove("sel"));
    btn.classList.add("sel");
    feat = f;
    $("stage").classList.remove("hidden");
    $("featDesc").textContent = `${f.icon} ${f.name} — ${f.desc}`;
    stopAll();
    scenario = new Audio(`audio/scenario_${f.id}.mp3`);
    iv = new Audio(`audio/iv_${f.id}.mp3`);
    scenario.preload = iv.preload = "auto";
    scenario.onended = () => finish();
    iv.onended = () => afterIntervention();
    reset();
    $("stage").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ── 초기화 ──────────────────────────────────────────────────
  function reset() {
    stopAll();
    phase = "idle"; lastT = 0;
    fired = { yellow: false, red: false, enc: false, recovered: false, advanced: false };
    talk = {}; DEMO_DATA.speakers.forEach((s) => (talk[s] = 0));
    lastSpeechEnd = 0; stageIdx = STAGE_IDX;
    $("btnPlay").disabled = false;
    $("btnPlay").textContent = "▶ 체험 시작";
    $("progFill").style.width = "0";
    $("clock").textContent = feat ? `0:00 / ${mmss(feat.duration)}` : "0:00";
    $("captionWho").textContent = "대기 중";
    $("captionWho").className = "cap-who";
    $("captionText").textContent = "▶ 버튼을 누르면 모둠 대화가 재생됩니다.";
    $("captionText").className = "cap-text";
    $("aiBubble").classList.add("hidden");
    $("aiAvatar").classList.remove("speaking");
    $("ctxWidget").innerHTML = "";
    setTeacher("green", "안정");
    $("tTag").classList.add("hidden");
    $("tIvCnt").textContent = "0회";
    $("tRemain").textContent = "3:00";
    $("tLog").innerHTML = '<li class="log-empty">아직 이벤트가 없습니다.</li>';
    renderStageDots();
    renderBars(null);
    setTopicGauge(feat && feat.type === "topic" ? 0.88 : 0.85);
    $("stTimer").textContent = feat && feat.type === "timer" ? "단계 남은 시간 0:30" : "";
    $("stTimer").className = "stage-timer";
  }

  function stopAll() {
    cancelAnimationFrame(raf);
    if (scenario) { scenario.pause(); scenario.currentTime = 0; }
    if (iv) { iv.pause(); iv.currentTime = 0; }
  }

  // ── 재생 ────────────────────────────────────────────────────
  $("btnPlay").onclick = () => {
    if (!feat || phase === "playing" || phase === "intervene") return;
    if (phase === "done") reset();
    phase = "playing";
    $("btnPlay").disabled = true;
    log("▶", "체험 시작 — 모둠 대화 재생", "g");
    scenario.play();
    tick();
  };
  $("btnReset").onclick = () => reset();

  function tick() {
    raf = requestAnimationFrame(tick);
    if (phase !== "playing") return;
    const t = scenario.currentTime;
    const dt = Math.max(0, t - lastT);
    lastT = t;
    // 진행바/시계
    $("progFill").style.width = (t / feat.duration) * 100 + "%";
    $("clock").textContent = `${mmss(t)} / ${mmss(feat.duration)}`;
    $("tRemain").textContent = mmss(Math.max(0, 180 - t));
    // 현재 발화
    const cur = feat.utts.find((u) => t >= u.t0 && t < u.t1);
    updateCaption(cur, t);
    if (cur) { talk[cur.sp] = (talk[cur.sp] || 0) + dt; lastSpeechEnd = Math.max(lastSpeechEnd, Math.min(t, cur.t1)); }
    renderBars(cur);
    updateTopic(cur, dt);
    updateContext(cur, t);
    // 임계 이벤트
    if (feat.yellowAt != null && !fired.yellow && t >= feat.yellowAt) {
      fired.yellow = true;
      setTeacher("yellow", "주의");
      showTag(feat.yellowReason);
      log("🟡", `주의 — ${feat.yellowReason} <small>(교사에게만 표시)</small>`, "y");
    }
    if (feat.redAt != null && !fired.red && t >= feat.redAt) {
      fired.red = true;
      intervene("red");
    }
    if (feat.encourageAt != null && !fired.enc && t >= feat.encourageAt) {
      fired.enc = true;
      intervene("encourage");
    }
    // 개입 후 회복 연출 (개입 시점 +6s 뒤 초록 복귀)
    if (fired.red && !fired.recovered && t >= feat.redAt + 6) {
      fired.recovered = true;
      setTeacher("green", "안정");
      $("tTag").classList.add("hidden");
      log("🟢", "개입 후 회복 — 대화 정상화", "g");
    }
  }

  // ── AI 개입 ─────────────────────────────────────────────────
  function intervene(kind) {
    phase = "intervene";
    scenario.pause();
    const bubble = $("aiBubble");
    bubble.textContent = feat.ivText;
    bubble.className = "bubble" + (kind === "encourage" ? " encourage" : "");
    $("aiAvatar").classList.add("speaking");
    $("captionWho").textContent = "AI 퍼실리테이터";
    $("captionWho").className = "cap-who";
    $("captionText").textContent = "(AI 음성 개입 중…)";
    $("captionText").className = "cap-text";
    if (kind === "red") {
      setTeacher("red", "개입필요");
      showTag(feat.redReason);
      $("tIvCnt").textContent = "1회";
      log("🔴", `AI 개입 — ${feat.redReason}<br><small>“${feat.ivText}”</small>`, "r");
    } else {
      log("✨", `격려 — “${feat.ivText}”`, "g");
    }
    iv.play();
  }

  function afterIntervention() {
    $("aiAvatar").classList.remove("speaking");
    // 단계 진행형 기능은 개입 후 다음 단계로
    if ((feat.type === "flow" || feat.type === "timer") && !fired.advanced) {
      fired.advanced = true;
      stageIdx = Math.min(stageIdx + 1, DEMO_DATA.stages.length - 1);
      renderStageDots();
      $("tStage").textContent = DEMO_DATA.stages[stageIdx];
      if (feat.type === "timer") { $("stTimer").textContent = "단계 남은 시간 5:00"; $("stTimer").className = "stage-timer"; }
      log("🪜", `단계 진행 → ${DEMO_DATA.stages[stageIdx]}`, "g");
    }
    phase = "playing";
    scenario.play();
  }

  function finish() {
    phase = "done";
    $("btnPlay").disabled = false;
    $("btnPlay").textContent = "▶ 다시 체험";
    $("captionWho").textContent = "체험 종료";
    $("captionText").textContent = "다른 기능도 위에서 골라 체험해 보세요!";
    log("⏹", "시나리오 종료", "g");
  }

  // ── UI 헬퍼 ────────────────────────────────────────────────
  function updateCaption(cur, t) {
    const who = $("captionWho"), txt = $("captionText");
    if (cur) {
      who.textContent = cur.sp + (cur.loud ? " (큰 소리)" : cur.ovl ? " (동시 발화)" : "");
      who.className = "cap-who";
      txt.textContent = "“" + cur.text + "”";
      txt.className = "cap-text" + (cur.off ? " off" : "");
    } else if (phase === "playing") {
      const gap = t - lastSpeechEnd;
      if (gap > 2.5) {
        who.textContent = `… 침묵 ${Math.floor(gap)}초`;
        who.className = "cap-who silent";
        txt.textContent = "";
      }
    }
  }

  function renderBars(cur) {
    const total = Math.max(0.001, Object.values(talk).reduce((a, b) => a + b, 0));
    $("spkBars").innerHTML = DEMO_DATA.speakers.map((s) => {
      const pct = Math.round((talk[s] / total) * 100) || 0;
      const talking = cur && cur.sp === s;
      return `<div class="spk-row">
        <span class="spk-name${talking ? " talking" : ""}">${s}</span>
        <span class="spk-track"><span class="spk-fill" style="width:${pct}%;background:${SPK_COLORS[s]}"></span></span>
        <span class="spk-pct">${pct}%</span></div>`;
    }).join("");
  }

  let topicVal = 0.85;
  function setTopicGauge(v) {
    topicVal = v;
    const pct = Math.round(v * 100);
    const fill = $("topicFill");
    fill.style.width = pct + "%";
    fill.style.background = v < 0.4 ? "var(--red)" : v < 0.55 ? "var(--yellow)" : "var(--green)";
    $("topicPct").textContent = pct + "%";
    $("tTopic").textContent = pct + "%";
    $("tTopic").style.color = v < 0.4 ? "var(--red)" : v < 0.55 ? "var(--yellow)" : "var(--green)";
  }
  function updateTopic(cur, dt) {
    if (feat.type !== "topic") return;
    if (cur && cur.off) setTopicGauge(Math.max(0.31, topicVal - dt * 0.055));
    else if (cur && !cur.off) setTopicGauge(Math.min(0.85, topicVal + dt * 0.09));
  }

  function updateContext(cur, t) {
    const w = $("ctxWidget");
    if (feat.type === "silence") {
      const gap = t - lastSpeechEnd;
      w.textContent = gap > 3 ? `🤫 침묵 ${Math.floor(gap)}초 경과` : "";
    } else if (feat.type === "volume") {
      const hot = cur && cur.loud;
      const on = cur ? 4 : 1;
      w.innerHTML = `<div class="vol-meter">` +
        Array.from({ length: 8 }, (_, i) =>
          `<i class="${hot && i < 8 ? "hot" : i < on ? "on" : ""}"></i>`).join("") +
        `</div>` + (hot ? "📢 볼륨 높음" : "");
    } else if (feat.type === "timer") {
      const remain = Math.max(0, (feat.timerStart || 30) - t);
      const el = $("stTimer");
      el.textContent = remain > 0 ? `단계 남은 시간 0:${String(Math.ceil(remain)).padStart(2, "0")}` : "단계 시간 종료";
      el.className = "stage-timer" + (remain <= 0 ? " over" : remain <= 10 ? " warn" : "");
    } else if (feat.type === "overlap") {
      w.textContent = cur && cur.ovl ? "🗯️ 동시 발화 감지!" : "";
    } else if (feat.type === "question") {
      w.textContent = phase === "playing" && t > 10 && !fired.red ? "❓ 질문 없이 " + Math.floor(t) + "초" : "";
    }
  }

  function setTeacher(cls, label) {
    $("tCard").className = "t-card " + cls;
    $("tStatus").textContent = label;
  }
  function showTag(reason) {
    const tag = $("tTag");
    tag.textContent = reason;
    tag.classList.remove("hidden");
  }
  function renderStageDots() {
    $("stageDots").innerHTML = DEMO_DATA.stages.map((s, i) =>
      `<span class="${i === stageIdx ? "cur" : i < stageIdx ? "done" : ""}">${s}</span>`).join("");
    $("tStage").textContent = DEMO_DATA.stages[stageIdx];
  }
  function log(icon, html, cls) {
    const ul = $("tLog");
    const empty = ul.querySelector(".log-empty");
    if (empty) empty.remove();
    const li = document.createElement("li");
    li.innerHTML = `<b class="${cls}">${icon}</b> [${mmss(scenario ? scenario.currentTime : 0)}] ${html}`;
    ul.prepend(li);
  }
  const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
})();
