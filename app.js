/* 온디바이스 AI 협력학습 데모 — 실제 앱 UI(학생: 시안 / 교사: 교사 앱 카드) 재현 버전 */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const SPK_COLORS = { "하준": "#4FA3E3", "수아": "#E38FB8", "지호": "#66BB8A", "윤서": "#C9A227" };
  const STAGE_IDX = 2;           // 데모 기본 단계 = 비판검토
  const STAGE_TOTAL = 300;       // 일반 기능 단계 시간 5:00 (타이머 기능은 timerStart)

  let feat = null, scenario = null, iv = null;
  let raf = 0, lastT = 0;
  let phase = "idle";            // idle | playing | intervene | done
  let fired = {};
  let talk = {}, lastSpeechEnd = 0, stageIdx = STAGE_IDX, topicVal = 0.85;

  $("featureGrid").innerHTML = "";
  DEMO_DATA.features.forEach((f) => {
    const b = document.createElement("button");
    b.innerHTML = `<span class="fi">${f.icon}</span>${f.name}`;
    b.onclick = () => select(f, b);
    $("featureGrid").appendChild(b);
  });

  function select(f, btn) {
    document.querySelectorAll("#featureGrid button").forEach((x) => x.classList.remove("sel"));
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

  function reset() {
    stopAll();
    phase = "idle"; lastT = 0;
    fired = { yellow: false, red: false, enc: false, recovered: false, advanced: false };
    talk = {}; DEMO_DATA.speakers.forEach((s) => (talk[s] = 0));
    lastSpeechEnd = 0; stageIdx = STAGE_IDX; topicVal = feat && feat.type === "topic" ? 0.88 : 0.85;
    $("btnPlay").disabled = false;
    $("btnPlay").textContent = "▶ 체험 시작";
    $("progFill").style.width = "0";
    $("clock").textContent = feat ? `0:00 / ${mmss(feat.duration)}` : "0:00";
    // 학생용
    $("sTopic").textContent = DEMO_DATA.topic;
    setAiMsg("안녕하세요! 오늘 토론도 함께 힘내 봐요.", "");
    $("aiAvatar").classList.remove("speaking");
    setTeam("ok", "✅ 잘 진행 중", "서로의 의견을 잘 나누고 있어요!");
    setTopic(topicVal);
    $("ctxNote").textContent = "";
    $("captionWho").textContent = "";
    $("captionWho").className = "cap-who";
    $("captionText").textContent = "▶ 버튼을 누르면 모둠 대화가 재생됩니다.";
    $("captionText").className = "cap-text";
    updateRing(0);
    renderStageDots();
    // 교사용
    teacherCard("green", "안정");
    $("tTag").classList.add("hidden");
    $("tIvCnt").textContent = "0회";
    $("tRemain").textContent = mmss(stageTotal());
    $("tLog").innerHTML = '<li class="log-empty">아직 개입이 없습니다.</li>';
    renderBars(null);
  }

  function stopAll() {
    cancelAnimationFrame(raf);
    if (scenario) { scenario.pause(); scenario.currentTime = 0; }
    if (iv) { iv.pause(); iv.currentTime = 0; }
  }

  $("btnPlay").onclick = () => {
    if (!feat || phase === "playing" || phase === "intervene") return;
    if (phase === "done") reset();
    phase = "playing";
    $("btnPlay").disabled = true;
    scenario.play();
    tick();
  };
  $("btnReset").onclick = () => reset();

  function stageTotal() { return feat && feat.type === "timer" ? (feat.timerStart || 30) : STAGE_TOTAL; }

  function tick() {
    raf = requestAnimationFrame(tick);
    if (phase !== "playing") return;
    const t = scenario.currentTime;
    const dt = Math.max(0, t - lastT);
    lastT = t;
    $("progFill").style.width = (t / feat.duration) * 100 + "%";
    $("clock").textContent = `${mmss(t)} / ${mmss(feat.duration)}`;
    updateRing(t);
    const cur = feat.utts.find((u) => t >= u.t0 && t < u.t1);
    updateCaption(cur, t);
    if (cur) { talk[cur.sp] = (talk[cur.sp] || 0) + dt; lastSpeechEnd = Math.max(lastSpeechEnd, Math.min(t, cur.t1)); }
    renderBars(cur);
    if (feat.type === "topic") {
      if (cur && cur.off) setTopic(Math.max(0.31, topicVal - dt * 0.055));
      else if (cur) setTopic(Math.min(0.85, topicVal + dt * 0.09));
    }
    updateContext(cur, t);
    if (feat.yellowAt != null && !fired.yellow && t >= feat.yellowAt) {
      fired.yellow = true;
      teacherCard("yellow", "주의");
      showTag(feat.yellowReason);
      log("🟡", `주의 — ${feat.yellowReason} <small>(교사에게만 표시)</small>`, "y");
    }
    if (feat.redAt != null && !fired.red && t >= feat.redAt) { fired.red = true; intervene("red"); }
    if (feat.encourageAt != null && !fired.enc && t >= feat.encourageAt) { fired.enc = true; intervene("encourage"); }
    if (fired.red && !fired.recovered && t >= feat.redAt + 6) {
      fired.recovered = true;
      teacherCard("green", "안정");
      $("tTag").classList.add("hidden");
      setTeam("ok", "✅ 잘 진행 중", "다시 골고루 이야기하고 있어요!");
      log("🟢", "개입 후 회복 — 대화 정상화", "g");
    }
  }

  function intervene(kind) {
    phase = "intervene";
    scenario.pause();
    setAiMsg(feat.ivText, kind === "encourage" ? "encourage" : "");
    $("aiAvatar").classList.add("speaking");
    $("captionWho").textContent = "AI 퍼실리테이터";
    $("captionWho").className = "cap-who";
    $("captionText").textContent = "(AI 음성 개입 중…)";
    $("captionText").className = "cap-text";
    if (kind === "red") {
      teacherCard("red", "개입필요");
      showTag(feat.redReason);
      $("tIvCnt").textContent = "1회";
      setTeam("ai", "🤖 AI가 도와주는 중", "AI 도움말을 함께 들어 보세요.");
      log("🔴", `AI 개입 — ${feat.redReason}<br><small>“${feat.ivText}”</small>`, "r");
    } else {
      setTeam("ok", "🎉 아주 잘하고 있어요", "근거를 들어 활발하게 참여 중!");
      log("✨", `격려 — “${feat.ivText}”`, "g");
    }
    iv.play();
  }

  function afterIntervention() {
    $("aiAvatar").classList.remove("speaking");
    if ((feat.type === "flow" || feat.type === "timer") && !fired.advanced) {
      fired.advanced = true;
      stageIdx = Math.min(stageIdx + 1, DEMO_DATA.stages.length - 1);
      renderStageDots();
      log("🪜", `단계 진행 → ${DEMO_DATA.stages[stageIdx]}`, "g");
    }
    phase = "playing";
    scenario.play();
  }

  function finish() {
    phase = "done";
    $("btnPlay").disabled = false;
    $("btnPlay").textContent = "▶ 다시 체험";
    $("captionWho").textContent = "";
    $("captionText").textContent = "체험 종료 — 다른 기능도 골라 보세요!";
  }

  // ── 학생용 UI ───────────────────────────────────────────────
  function setAiMsg(text, cls) {
    const m = $("aiMsg");
    m.textContent = text;
    m.className = "ai-msg" + (cls ? " " + cls : "");
  }
  function setTeam(cls, big, sub) {
    const el = $("teamState");
    el.textContent = big;
    el.className = "team-big " + cls;
    $("teamSub").textContent = sub;
  }
  function setTopic(v) {
    topicVal = v;
    const pct = Math.round(v * 100);
    const lab = $("topicLabel"), sub = $("topicSub");
    if (v >= 0.55) { lab.textContent = "높음 📶"; lab.className = "team-big ok"; sub.textContent = "주제를 잘 유지하고 있어요."; }
    else if (v >= 0.4) { lab.textContent = "보통 〽️"; lab.className = "team-big warn"; sub.textContent = "주제가 조금 흔들리고 있어요."; }
    else { lab.textContent = "낮음 📉"; lab.className = "team-big bad"; sub.textContent = "주제로 돌아와 볼까요?"; }
    const tv = $("tTopic");
    tv.textContent = pct + "%";
    tv.className = "t-val " + (v < 0.4 ? "bad" : v < 0.55 ? "warn" : "ok");
  }
  function updateRing(t) {
    const total = stageTotal();
    const remain = Math.max(0, total - t);
    const pct = (remain / total) * 100;
    $("ringOuter").style.background = `conic-gradient(var(--ring) ${pct}%, #E5EEF7 0)`;
    const rt = $("ringTime");
    rt.textContent = mmss(remain);
    rt.className = remain <= 0 ? "over" : (feat.type === "timer" && remain <= 10) ? "warn" : "";
    $("ringStage").textContent = DEMO_DATA.stages[stageIdx];
    $("totalElapsed").textContent = `🕐 총 ${mmss(t)} 경과`;
    $("tRemain").textContent = mmss(remain);
  }
  function renderStageDots() {
    $("stageDots").innerHTML = DEMO_DATA.stages.map((s, i) =>
      `<span class="${i === stageIdx ? "cur" : i < stageIdx ? "done" : ""}">● ${s}</span>`).join("");
    $("tStage").textContent = DEMO_DATA.stages[stageIdx];
    $("ringStage").textContent = DEMO_DATA.stages[stageIdx];
  }
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
  function updateContext(cur, t) {
    const w = $("ctxNote");
    if (feat.type === "silence") {
      const gap = t - lastSpeechEnd;
      w.textContent = gap > 3 ? `🤫 침묵 ${Math.floor(gap)}초 경과` : "";
    } else if (feat.type === "volume") {
      w.textContent = cur && cur.loud ? "📢 발화 볼륨 높음" : "";
    } else if (feat.type === "overlap") {
      w.textContent = cur && cur.ovl ? "🗯️ 동시 발화 감지!" : "";
    } else if (feat.type === "question") {
      w.textContent = phase === "playing" && t > 10 && !fired.red ? `❓ 질문 없이 ${Math.floor(t)}초` : "";
    } else {
      w.textContent = "";
    }
  }

  // ── 교사용 UI ───────────────────────────────────────────────
  function teacherCard(color, label) {
    $("tCard").className = "t-card" + (color === "yellow" ? " y" : color === "red" ? " r" : "");
    const big = $("tStatus");
    big.textContent = label;
    big.className = "t-big " + color;
  }
  function showTag(reason) {
    const tag = $("tTag");
    tag.textContent = reason;
    tag.classList.remove("hidden");
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
