/* 온디바이스 AI 협력학습 데모 — 학생: 실제 앱 UI / 교사: 전체 모둠 뷰 ↔ 모둠 상세(드릴다운) */
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
  let sttDone = new Set(), words = {}, overlapCnt = 0;

  $("featureGrid").innerHTML = "";
  DEMO_DATA.features.forEach((f) => {
    const b = document.createElement("button");
    b.innerHTML = `<span class="fi">${f.icon}</span>${f.name}`;
    b.onclick = () => select(f, b);
    $("featureGrid").appendChild(b);
  });

  // 교사 뷰 전환: 모둠 카드 ↔ 드릴다운
  $("mCard").onclick = () => { $("tMainView").classList.add("hidden"); $("tDetailView").classList.remove("hidden"); };
  $("btnBack").onclick = () => { $("tDetailView").classList.add("hidden"); $("tMainView").classList.remove("hidden"); };
  // 학생 수동 단계 진행 (실제 앱의 [다음 단계 ▶])
  $("btnNextStage").onclick = () => {
    if (stageIdx >= DEMO_DATA.stages.length - 1) return;
    stageIdx++;
    renderStageDots();
  };

  // 교사 메인 하단 경고 지표 범례 — 탭하면 설명 (교사 앱 setupWarningLegend 재현)
  const WARN_DETAIL = {
    neglect: "소외학생 — 특정 학생이 오랫동안 발언이 없거나 발화 비율이 매우 낮을 때 감지합니다. 모둠에서 소외되는 구성원이 없는지 살펴보세요.",
    gini_dominance: "발언독점 — 한 학생이 대화를 과도하게 점유할 때 감지합니다(발화시간 지니계수 기준). 다른 학생의 의견을 유도해 주세요.",
    topic_focus: "주제이탈 — 최근 대화가 등록된 토론 주제·키워드에서 벗어났을 때 감지합니다.",
    silence_mgmt: "침묵 — 모둠 전체가 일정 시간 이상 말이 없을 때 감지합니다. 사고형 침묵인지 멈춤형 침묵인지 확인이 필요합니다.",
    overlap: "중첩발화 — 여러 학생이 동시에 말해 발화가 겹칠 때 감지합니다. 한 사람씩 말하도록 정리가 필요할 수 있습니다.",
    volume: "발화볼륨 — 특정 학생의 목소리가 모둠 평균보다 크게 지속될 때 감지합니다.",
    question_prompt: "질문유도 — 오랫동안 서로에게 질문이 오가지 않을 때 감지합니다. 질문은 사고를 확장합니다.",
  };
  document.querySelectorAll("#warnLegend span").forEach((sp) => {
    sp.onclick = () => {
      document.querySelectorAll("#warnLegend span").forEach((x) => x.classList.remove("sel"));
      sp.classList.add("sel");
      $("warnDetail").textContent = WARN_DETAIL[sp.dataset.k] || "";
    };
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
    sttDone = new Set(); words = {}; overlapCnt = 0;
    $("btnPlay").disabled = false;
    $("btnPlay").textContent = "▶ 체험 시작";
    $("progFill").style.width = "0";
    $("clock").textContent = feat ? `0:00 / ${mmss(feat.duration)}` : "0:00";
    // 학생용
    $("sTopic").textContent = DEMO_DATA.topic;
    setAiMsg("안녕하세요! 오늘 토론도 함께 힘내 봐요.", "");
    $("aiAvatar").classList.remove("speaking");
    $("aiAvatar").src = "robot_green.png";
    $("aiCard").classList.remove("active");
    setTeam("ok", "✅ 잘 진행 중", "서로의 의견을 잘 나누고 있어요!");
    setTopic(topicVal);
    $("ctxNote").textContent = "";
    $("captionWho").textContent = "";
    $("captionWho").className = "cap-who";
    $("captionText").textContent = "▶ 버튼을 누르면 모둠 대화가 재생됩니다.";
    $("captionText").className = "cap-text";
    updateTimer(0);
    renderStageDots();
    // 교사용 (메인 + 상세)
    $("mTopic2").textContent = DEMO_DATA.topic;
    setStatus("green", "안정");
    $("mTag").innerHTML = "&nbsp;";
    $("dIvCnt").textContent = "0회";
    $("dTime").textContent = "0:00"; $("mTime").textContent = "0:00";
    $("balancePct").textContent = "100";
    setDonut(0);
    $("silenceNow").textContent = "현재 0초";
    $("cntSilence").textContent = "0회";
    $("cntOverlap").textContent = "0회";
    $("wordCloud").innerHTML = '<span style="color:#8AA0B4">대화가 시작되면 키워드가 쌓입니다</span>';
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
    iv.muted = true;    // 자동재생 정책 언락
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
    $("mTime").textContent = mmss(t);
    updateTimer(t);
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
      $("mTag").textContent = feat.yellowReason;
      log("🟡", `주의 — ${feat.yellowReason} <small>(교사에게만 표시)</small>`, "y");
    }
    if (feat.redAt != null && !fired.red && t >= feat.redAt) { fired.red = true; intervene("red"); }
    if (feat.encourageAt != null && !fired.enc && t >= feat.encourageAt) { fired.enc = true; intervene("encourage"); }
    if (fired.red && !fired.recovered && t >= feat.redAt + 6) {
      fired.recovered = true;
      setStatus("green", "안정");
      $("mTag").innerHTML = "&nbsp;";
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
    // 학생 앱과 동일: 🔴 개입 중에만 로봇 빨강(><), 격려는 초록 유지
    if (kind === "red") $("aiAvatar").src = "robot_red.png";
    $("captionWho").textContent = "AI 퍼실리테이터";
    $("captionWho").className = "cap-who";
    $("captionText").textContent = "(AI 음성 개입 중…)";
    $("captionText").className = "cap-text";
    if (kind === "red") {
      setStatus("red", "개입필요");
      $("dIvCnt").textContent = "1회";
      $("mTag").textContent = feat.redReason;
      if (feat.type === "silence") $("cntSilence").textContent = "1회";
      $("ivEffects").innerHTML = `<small class="dim">[${mmss(feat.redAt)}] ${feat.name} → 효과 집계 중…</small>`;
      log("🔴", `AI 개입 — ${feat.redReason}<br><small>“${feat.ivText}”</small>`, "r");
    } else {
      log("✨", `격려 — “${feat.ivText}”`, "g");
    }
    iv.play().catch(() => audioFail("AI 개입"));
  }

  function afterIntervention() {
    $("aiAvatar").classList.remove("speaking");
    $("aiAvatar").src = "robot_green.png";
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

  // ── 개입 효과(전후 비교) — 교사 앱 interventionEffects 축약판 ──
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

  // ── 학생용 UI (실제 앱 구성) ────────────────────────────────
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
    const mp = $("mTopicPct");
    mp.textContent = pct + "%";
    mp.className = "g-val " + (v < 0.4 ? "bad" : v < 0.55 ? "warn" : "ok");
  }
  function updateTimer(t) {
    const total = stageTotal();
    const remain = Math.max(0, total - t);
    const el = $("stTimerBig");
    el.textContent = mmss(remain);
    el.className = "s-timer" + (remain <= 0 ? " over" : (feat && feat.type === "timer" && remain <= 10) ? " warn" : "");
    // 수업 전체 남은 시간 = 현재 단계 남음 + 이후 단계 계획(우측 상단 표시)
    const future = Math.max(0, DEMO_DATA.stages.length - stageIdx - 1) * STAGE_TOTAL;
    $("totalRemain").textContent = `⏳ 수업 전체 ${mmss(remain + future)} 남음`;
    $("mRemain").textContent = mmss(remain);
  }
  function renderStageDots() {
    $("stageDots").innerHTML = DEMO_DATA.stages.map((s, i) =>
      `<span class="${i === stageIdx ? "cur" : i < stageIdx ? "done" : ""}">● ${s}</span>`).join("");
    $("stStageName").textContent = DEMO_DATA.stages[stageIdx];
    $("dStage").textContent = DEMO_DATA.stages[stageIdx];
    $("mStage").textContent = DEMO_DATA.stages[stageIdx];
    $("mStageFlow").innerHTML = DEMO_DATA.stages.map((s, i) =>
      `<span class="${i === stageIdx ? "cur" : i < stageIdx ? "done" : ""}">${i + 1}. ${s}</span>`).join("");
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

  // ── 교사용 UI (메인 카드 + 드릴다운 동시 갱신) ───────────────
  function setStatus(color, label) {
    const el = $("dStatus");
    el.textContent = label;
    el.className = "d-" + color;
    const big = $("mStatus");
    big.textContent = label;
    big.className = "g-big " + color;
    $("mCard").className = "g-card" + (color === "yellow" ? " y" : color === "red" ? " r" : "");
    $("cntG").textContent = color === "green" ? "1" : "0";
    $("cntY").textContent = color === "yellow" ? "1" : "0";
    $("cntR").textContent = color === "red" ? "1" : "0";
  }
  function updateGauges(t) {
    const tot = Math.max(1, t);
    const talkSum = Object.values(talk).reduce((a, b) => a + b, 0);
    // 발화 활성화 비율(도넛) + 참여 균형지수 + 현재 침묵 초
    const active = Math.min(100, Math.round((talkSum / tot) * 100));
    setDonut(active);
    $("balancePct").textContent = balanceOf(Object.values(talk));
    $("silenceNow").textContent = `현재 ${Math.max(0, Math.floor(t - lastSpeechEnd))}초`;
  }
  // 발화 활성화 도넛 (conic-gradient) — 색은 활성화 수준별
  function setDonut(pct) {
    // 발화 활성화 비율이 낮으면 빨강, 경고는 노랑 (침묵감지 임계 개념과 정렬)
    const color = pct >= 50 ? "var(--green)" : pct >= 30 ? "var(--yellow)" : "var(--red)";
    const el = $("donutActivity");
    el.style.setProperty("--p", pct);
    el.style.setProperty("--dc", color);
    const b = $("actPct");
    b.textContent = pct + "%";
    b.style.color = color;
  }
  // 참여 균형지수 = 100 - 정규화 지니(발화시간 분포). 전원 무발화면 100(완전 균형).
  function balanceOf(vals) {
    const arr = vals.filter((v) => v >= 0);
    const n = arr.length, sum = arr.reduce((a, b) => a + b, 0);
    if (n < 2 || sum <= 0) return 100;
    const s = [...arr].sort((a, b) => a - b);
    let w = 0; s.forEach((v, i) => (w += (i + 1) * v));
    let g = (2 * w) / (n * sum) - (n + 1) / n;
    g = g / (1 - 1 / n);
    return Math.round((1 - Math.max(0, Math.min(1, g))) * 100);
  }
  function harvestStt(t) {
    feat.utts.forEach((u, i) => {
      if (t >= u.t1 && !sttDone.has(i)) {
        sttDone.add(i);
        const ul = $("sttLog");
        const empty = ul.querySelector(".log-empty");
        if (empty) empty.remove();
        const li = document.createElement("li");
        li.innerHTML = `<b style="color:${SPK_COLORS[u.sp]}">[${mmss(u.t0)}] ${u.sp}:</b> ${u.text}`;
        ul.prepend(li);
        (u.text.match(/[가-힣]{2,}|[A-Za-z]{2,}/g) || []).forEach((w0) => {
          const w = w0.replace(/(은|는|이|가|을|를|에|의|도|만|로|으로|에서|이라|라고|하고|까지|부터|랑|이나|나)$/, "");
          if (w.length < 2 || STOPWORDS.has(w)) return;
          words[w] = (words[w] || 0) + 1;
        });
        renderCloud();
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
