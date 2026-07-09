/* 온디바이스 AI 협력학습 데모 — 학생: 시안 UI / 교사: 드릴다운(GroupDetailActivity) 재현 */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const SPK_COLORS = { "하준": "#4FA3E3", "수아": "#E38FB8", "지호": "#66BB8A", "윤서": "#C9A227" };
  const STAGE_IDX = 2;
  const STAGE_TOTAL = 300;
  const STOPWORDS = new Set(["그리고", "그러니까", "그래서", "그런데", "근데", "하지만", "우리", "이번", "지금",
    "그게", "이게", "저게", "너무", "진짜", "정말", "그냥", "같아", "있어", "없어", "생각", "이야기", "얘기"]);

  let feat = null, scenario = null, iv = null;
  let raf = 0, lastT = 0;
  let phase = "idle";
  let fired = {};
  let talk = {}, lastSpeechEnd = 0, stageIdx = STAGE_IDX, topicVal = 0.85;
  let sttDone = new Set(), words = {}, overlapCnt = 0, silenceCnt = 0;

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
    scenario.onerror = () => audioFail("시나리오");
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
    sttDone = new Set(); words = {}; overlapCnt = 0; silenceCnt = 0;
    $("btnPlay").disabled = false;
    $("btnPlay").textContent = "▶ 체험 시작";
    $("progFill").style.width = "0";
    $("clock").textContent = feat ? `0:00 / ${mmss(feat.duration)}` : "0:00";
    // 학생용
    $("sTopic").textContent = DEMO_DATA.topic;
    setAiMsg("안녕하세요! 오늘 토론도 함께 힘내 봐요.", "");
    $("aiAvatar").classList.remove("speaking");
    $("aiCard").classList.remove("active");
    setTeam("ok", "✅ 잘 진행 중", "서로의 의견을 잘 나누고 있어요!");
    setTopic(topicVal);
    $("ctxNote").textContent = "";
    $("captionWho").textContent = "";
    $("captionWho").className = "cap-who";
    $("captionText").textContent = "▶ 버튼을 누르면 모둠 대화가 재생됩니다.";
    $("captionText").className = "cap-text";
    updateRing(0);
    renderStageDots();
    // 교사용 드릴다운
    setStatus("green", "안정");
    $("dIvCnt").textContent = "0회";
    $("dTime").textContent = "0:00";
    $("talkPct").textContent = "0";
    $("silentPct").textContent = "0";
    $("cntSilence").textContent = "0회";
    $("cntOverlap").textContent = "0회";
    $("wordCloud").innerHTML = '<span class="dim" style="color:#8AA0B4">대화가 시작되면 키워드가 쌓입니다</span>';
    $("ivEffects").innerHTML = '<small class="dim">개입 발생 시 전후 변화를 집계합니다</small>';
    $("tLog").innerHTML = '<li class="log-empty">아직 개입이 없습니다.</li>';
    $("sttLog").innerHTML = '<li class="log-empty">대화가 시작되면 전사가 표시됩니다.</li>';
    renderBars(null);
  }

  function stopAll() {
    cancelAnimationFrame(raf);
    if (scenario) { scenario.pause(); scenario.currentTime = 0; }
    if (iv) { iv.pause(); iv.currentTime = 0; }
  }

  function audioFail(which) {
    $("captionWho").textContent = "⚠ 오디오 오류";
    $("captionText").textContent = `${which} 음성 파일을 재생할 수 없습니다. audio/ 폴더가 index.html 옆에 있는지 확인해 주세요.`;
  }

  $("btnPlay").onclick = () => {
    if (!feat || phase === "playing" || phase === "intervene") return;
    if (phase === "done") reset();
    phase = "playing";
    $("btnPlay").disabled = true;
    // 개입 오디오 언락(자동재생 정책): 사용자 클릭 안에서 무음 재생→즉시 정지
    iv.muted = true;
    iv.play().then(() => { iv.pause(); iv.currentTime = 0; iv.muted = false; })
      .catch(() => { iv.muted = false; });
    scenario.play().catch((e) => {
      phase = "idle";
      $("btnPlay").disabled = false;
      audioFail("시나리오");
      console.error(e);
    });
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
    $("dTime").textContent = mmss(t);
    updateRing(t);
    const cur = feat.utts.find((u) => t >= u.t0 && t < u.t1);
    updateCaption(cur, t);
    if (cur) { talk[cur.sp] = (talk[cur.sp] || 0) + dt; lastSpeechEnd = Math.max(lastSpeechEnd, Math.min(t, cur.t1)); }
    renderBars(cur);
    updateGauges(t);
    harvestStt(t);
    if (feat.type === "topic") {
      if (cur && cur.off) setTopic(Math.max(0.31, topicVal - dt * 0.055));
      else if (cur) setTopic(Math.min(0.85, topicVal + dt * 0.09));
    }
    updateContext(cur, t);
    if (feat.yellowAt != null && !fired.yellow && t >= feat.yellowAt) {
      fired.yellow = true;
      setStatus("yellow", "주의");
      log("🟡", `주의 — ${feat.yellowReason} <small>(교사에게만 표시)</small>`, "y");
    }
    if (feat.redAt != null && !fired.red && t >= feat.redAt) { fired.red = true; intervene("red"); }
    if (feat.encourageAt != null && !fired.enc && t >= feat.encourageAt) { fired.enc = true; intervene("encourage"); }
    if (fired.red && !fired.recovered && t >= feat.redAt + 6) {
      fired.recovered = true;
      setStatus("green", "안정");
      log("🟢", "개입 후 회복 — 대화 정상화", "g");
      showEffects(t);
    }
  }

  function intervene(kind) {
    phase = "intervene";
    scenario.pause();
    setAiMsg(feat.ivText, kind === "encourage" ? "encourage" : "");
    $("aiCard").classList.add("active");
    $("aiAvatar").classList.add("speaking");
    $("captionWho").textContent = "AI 퍼실리테이터";
    $("captionWho").className = "cap-who";
    $("captionText").textContent = "(AI 음성 개입 중…)";
    $("captionText").className = "cap-text";
    if (kind === "red") {
      setStatus("red", "개입필요");
      $("dIvCnt").textContent = "1회";
      if (feat.type === "silence") { silenceCnt = 1; $("cntSilence").textContent = "1회"; }
      $("ivEffects").innerHTML = `<small class="dim">[${mmss(feat.redAt)}] ${feat.name} → 효과 집계 중…</small>`;
      log("🔴", `AI 개입 — ${feat.redReason}<br><small>“${feat.ivText}”</small>`, "r");
    } else {
      log("✨", `격려 — “${feat.ivText}”`, "g");
    }
    iv.play().catch(() => audioFail("AI 개입"));
  }

  function afterIntervention() {
    $("aiAvatar").classList.remove("speaking");
    $("aiCard").classList.remove("active");
    if ((feat.type === "flow" || feat.type === "timer") && !fired.advanced) {
      fired.advanced = true;
      stageIdx = Math.min(stageIdx + 1, DEMO_DATA.stages.length - 1);
      renderStageDots();
      log("🪜", `단계 진행 → ${DEMO_DATA.stages[stageIdx]}`, "g");
    }
    phase = "playing";
    scenario.play().catch(() => audioFail("시나리오"));
  }

  function finish() {
    phase = "done";
    $("btnPlay").disabled = false;
    $("btnPlay").textContent = "▶ 다시 체험";
    $("captionWho").textContent = "";
    $("captionText").textContent = "체험 종료 — 다른 기능도 골라 보세요!";
  }

  // ── 개입 효과(전후 10초 비교) — 교사 앱 interventionEffects 방식 축약 ──
  function showEffects(now) {
    const red = feat.redAt, W = 10;
    const win = (a, b) => feat.utts.filter((u) => u.t1 > a && u.t0 < b);
    const before = win(red - W, red), after = win(red, red + W + 6);
    const spk = (arr) => new Set(arr.map((u) => u.sp)).size;
    const dom = (arr) => {
      const by = {};
      arr.forEach((u) => (by[u.sp] = (by[u.sp] || 0) + (u.t1 - u.t0)));
      const tot = Object.values(by).reduce((x, y) => x + y, 0);
      return tot ? Math.round(Math.max(...Object.values(by)) / tot * 100) : 0;
    };
    const gains = [];
    if (spk(after) > spk(before)) gains.push(`참여 화자 ${spk(before)}명→${spk(after)}명`);
    if (dom(before) - dom(after) >= 10) gains.push(`최다발화 점유 ${dom(before)}%→${dom(after)}%`);
    if (feat.type === "topic") gains.push(`주제 적합도 31→${Math.round(topicVal * 100)}`);
    $("ivEffects").innerHTML = gains.length
      ? `[${mmss(red)}] ${feat.name} → <b>${gains.join(" · ")}</b>`
      : `<small class="dim">[${mmss(red)}] ${feat.name} → 뚜렷한 변화 없음</small>`;
  }

  // ── 학생용 UI ──────────────────────────────────────────────
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
    const sc = $("topicScore");
    sc.textContent = pct;
    sc.className = "d-score " + (v < 0.4 ? "bad" : v < 0.55 ? "warn" : "ok");
    const pb = $("pbTopic");
    pb.style.width = pct + "%";
    pb.style.background = v < 0.4 ? "var(--red)" : v < 0.55 ? "var(--yellow)" : "var(--green)";
  }
  function updateRing(t) {
    const total = stageTotal();
    const remain = Math.max(0, total - t);
    $("ringOuter").style.background = `conic-gradient(var(--ring) ${(remain / total) * 100}%, #E5EEF7 0)`;
    const rt = $("ringTime");
    rt.textContent = mmss(remain);
    rt.className = remain <= 0 ? "over" : (feat.type === "timer" && remain <= 10) ? "warn" : "";
    $("totalElapsed").textContent = `🕐 총 ${mmss(t)} 경과`;
  }
  function renderStageDots() {
    $("stageDots").innerHTML = DEMO_DATA.stages.map((s, i) =>
      `<span class="${i === stageIdx ? "cur" : i < stageIdx ? "done" : ""}">● ${s}</span>`).join("");
    $("dStage").textContent = DEMO_DATA.stages[stageIdx];
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

  // ── 교사용 드릴다운 UI ─────────────────────────────────────
  function setStatus(color, label) {
    const el = $("dStatus");
    el.textContent = label;
    el.className = "d-" + color;
  }
  function updateGauges(t) {
    const tot = Math.max(1, t);
    const talkSum = Object.values(talk).reduce((a, b) => a + b, 0);
    const pct = Math.min(100, Math.round((talkSum / tot) * 100));
    $("talkPct").textContent = pct;
    $("silentPct").textContent = 100 - pct;
  }
  function harvestStt(t) {
    feat.utts.forEach((u, i) => {
      if (t >= u.t1 && !sttDone.has(i)) {
        sttDone.add(i);
        // STT 로그 (화자별 색)
        const ul = $("sttLog");
        const empty = ul.querySelector(".log-empty");
        if (empty) empty.remove();
        const li = document.createElement("li");
        li.innerHTML = `<b style="color:${SPK_COLORS[u.sp]}">[${mmss(u.t0)}] ${u.sp}:</b> ${u.text}`;
        ul.prepend(li);
        // 키워드 클라우드 (조사 대충 스트립 + 불용어)
        (u.text.match(/[가-힣]{2,}|[A-Za-z]{2,}/g) || []).forEach((w0) => {
          const w = w0.replace(/(은|는|이|가|을|를|에|의|도|만|로|으로|에서|이라|라고|하고|까지|부터|랑|이나|나)$/, "");
          if (w.length < 2 || STOPWORDS.has(w)) return;
          words[w] = (words[w] || 0) + 1;
        });
        renderCloud();
        // 중첩 카운터
        if (u.ovl) { overlapCnt++; $("cntOverlap").textContent = overlapCnt + "회"; }
      }
    });
  }
  function renderCloud() {
    const top = Object.entries(words).sort((a, b) => b[1] - a[1]).slice(0, 14);
    if (!top.length) return;
    const max = top[0][1];
    $("wordCloud").innerHTML = top.map(([w, c]) => {
      const size = 12 + Math.round(10 * Math.sqrt(c / max));
      return `<span class="${c >= max && c > 1 ? "big" : ""}" style="font-size:${size}px">${w}</span>`;
    }).join("");
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
