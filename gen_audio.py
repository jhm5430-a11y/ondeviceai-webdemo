# -*- coding: utf-8 -*-
"""
웹 데모 음원 생성 — 기능 10종 시나리오(각 ~40s) + AI 개입 TTS
- edge-tts로 발화별 합성(경국대 대본 성우: 하준=InJoon·수아=SunHi·지호=Hyunsu·윤서=Ava, AI=Emma)
- ffmpeg.exe(Windows, WSL interop)로 타임라인 배치 합성 → audio/scenario_<id>.mp3 (40s)
- 개입 멘트 → audio/iv_<id>.mp3
- 실측 타이밍으로 data.js (DEMO_DATA) 출력 → 웹 UI가 이 타임라인으로 애니메이션
사용: ~/sttbench/bin/python gen_audio.py
"""
import asyncio, json, os, subprocess, sys

import edge_tts

HERE = os.path.dirname(os.path.abspath(__file__))
AUD = os.path.join(HERE, "audio")
TMP = os.path.join(HERE, "_tmp")
os.makedirs(AUD, exist_ok=True)
os.makedirs(TMP, exist_ok=True)

VOICE = {
    "하준": "ko-KR-InJoonNeural",
    "수아": "ko-KR-SunHiNeural",
    "지호": "ko-KR-HyunsuMultilingualNeural",
    "윤서": "en-US-AvaMultilingualNeural",
    "AI": "en-US-EmmaMultilingualNeural",
}
TOPIC = "AI가 작성한 보고서나 발표자료를 학습자의 산출물로 인정할 수 있는가"
STAGES = ["문제탐색", "아이디어발산", "비판검토", "해결안합의"]
DUR = 40.0  # 시나리오 길이(초)

# u(시작예정, 화자, 대사, loud=큰소리, ovl=중첩허용(예정시각 고정), off=주제이탈 발화)
def u(t, sp, text, loud=False, ovl=False, off=False):
    return {"plan": t, "sp": sp, "text": text, "loud": loud, "ovl": ovl, "off": off}

FEATURES = [
    dict(id="gini", name="발언 독점 케어", icon="🗣️", type="gini",
         desc="한 학생이 발언을 독점하면 감지해 골고루 참여하도록 안내합니다.",
         yellowAt=18, redAt=28, yellowReason="발언 독점 감지 (하준 점유 급증)",
         redReason="발언 독점 지속 — Gini 0.41 ≥ 0.30",
         ivText="하준 학생의 의견 잘 들었어요. 이번에는 다른 친구들의 생각도 한번 들어볼까요?",
         utts=[
             u(0.5, "수아", "AI가 만든 보고서를 어디까지 인정할지 이야기해 보자."),
             u(4.8, "하준", "나는 확실히 반대야. AI가 다 써 주면 그게 왜 내 산출물이야?"),
             u(10.2, "하준", "그리고 평가도 불공정해져. AI 잘 쓰는 애만 유리하잖아. 노력한 사람이 손해 보는 구조라고."),
             u(17.5, "하준", "게다가 실력 확인도 안 되지, 스스로 생각하는 힘도 약해지지. 안 좋은 점이 한둘이 아니야."),
             u(24.5, "하준", "그러니까 결론은 무조건 반대야. 더 말할 것도 없어."),
             u(30.5, "수아", "고마워. 그럼 윤서는 어떻게 생각해?"),
             u(34.0, "윤서", "나는 조건을 붙이면 인정할 수 있다고 생각해."),
         ]),
    dict(id="neglect", name="소외 학생 감지", icon="🫥", type="neglect",
         desc="발언이 없는 학생을 감지해 자연스럽게 참여를 이끌어냅니다.",
         yellowAt=20, redAt=28, yellowReason="윤서 저참여 (누적 발화 0%)",
         redReason="윤서 무발언 지속",
         ivText="윤서 학생은 어떻게 생각하나요? 윤서의 생각도 궁금해요.",
         utts=[
             u(0.5, "하준", "AI 사용을 밝히기만 하면 인정해도 된다고 생각해."),
             u(5.2, "수아", "밝히는 것만으로는 부족하지 않아? 직접 고친 부분이 있어야지."),
             u(10.8, "지호", "맞아, 수정 과정을 같이 내면 어떨까?"),
             u(15.2, "하준", "오, 그럼 어디를 고쳤는지 표시하는 조건을 넣자."),
             u(20.5, "수아", "좋아. 그럼 조건이 두 개네. 사용 공개랑 수정 표시."),
             u(25.8, "지호", "정리 좋다. 그렇게 가자."),
             u(31.5, "윤서", "음… 나는 설명할 수 있어야 한다는 조건도 필요하다고 생각해."),
             u(37.0, "수아", "오, 좋은 생각이야!"),
         ]),
    dict(id="silence", name="침묵 관리", icon="🤫", type="silence",
         desc="모둠 전체가 오래 침묵하면 사고를 여는 질문으로 대화를 재개합니다.",
         yellowAt=24, redAt=31, yellowReason="침묵 12초 경과",
         redReason="침묵 19초 경과",
         ivText="지금 어떤 부분이 고민되나요? 방금 나온 조건 중에서 하나씩 의견을 말해 볼까요?",
         utts=[
             u(0.5, "지호", "조건부 인정으로 간다면, 어떤 조건이 제일 중요할까?"),
             u(5.8, "하준", "음… 그게 좀 어렵네."),
             u(9.2, "수아", "생각할 시간이 필요할 것 같아."),
             # 12초~ 침묵
             u(34.0, "윤서", "나는 직접 설명할 수 있는 게 제일 중요한 것 같아."),
         ]),
    dict(id="topic", name="주제 이탈 감지", icon="🧭", type="topic",
         desc="대화가 토론 주제에서 벗어나면 감지해 주제로 되돌립니다.",
         yellowAt=22, redAt=30, yellowReason="주제 집중도 하락 (0.46)",
         redReason="주제 집중도 0.31 < 0.37",
         ivText="재미있는 이야기지만, 지금은 AI 산출물을 인정할 조건을 정하고 있어요. 주제로 돌아와 볼까요?",
         utts=[
             u(0.5, "수아", "AI가 쓴 부분을 표시하자는 조건까지 정리했어."),
             u(5.2, "지호", "아 맞다, 어제 월드컵 예선 봤어? 후반 역전골 진짜 대단하던데.", off=True),
             u(10.8, "하준", "봤지! 마지막 프리킥 완전 소름이었잖아.", off=True),
             u(15.5, "지호", "다음 경기 상대 어디더라? 이대로면 십육강은 무난할 것 같은데.", off=True),
             u(20.5, "윤서", "우리 반에서 다 같이 축구 직관 가자는 얘기도 있던데.", off=True),
             u(25.3, "하준", "직관 가고 싶다. 표는 얼마지?", off=True),
             u(33.0, "수아", "그래, 월드컵 얘기는 이따 하고 다시 조건 이야기로 돌아가자."),
             u(37.2, "지호", "미안 미안. 표시 조건 다음으로 넘어가자."),
         ]),
    dict(id="question", name="질문 유도", icon="❓", type="question",
         desc="서로 묻지 않고 각자 주장만 이어지면 질문을 유도합니다.",
         yellowAt=24, redAt=30, yellowReason="질문 없음 지속",
         redReason="상호 질문 부재 — 논의 심화 정체",
         ivText="서로의 생각에 대해 궁금한 점을 질문해 보면 어떨까요? 왜 그 조건이 중요한지 물어봐도 좋아요.",
         utts=[
             u(0.5, "하준", "나는 표시 조건이 제일 중요하다고 봐."),
             u(5.0, "지호", "나는 설명 가능해야 한다는 조건."),
             u(9.5, "수아", "나는 사용 공개."),
             u(13.5, "하준", "다들 자기 조건만 말하네. 아무튼 내 생각은 그래."),
             u(19.0, "지호", "그래, 각자 생각은 알겠어."),
             u(33.0, "수아", "하준아, 왜 표시 조건이 제일 중요하다고 생각해?"),
             u(37.2, "하준", "베낀 건지 고친 건지 그걸로 구분되니까."),
         ]),
    dict(id="volume", name="발화 볼륨 안내", icon="📢", type="volume",
         desc="목소리가 지나치게 커지면 차분한 대화를 안내합니다.",
         yellowAt=20, redAt=27, yellowReason="발화 볼륨 상승 (하준)",
         redReason="큰 소리 지속 10초+",
         ivText="목소리가 조금 커졌어요. 중요한 의견일수록 차분하게 말하면 더 잘 전달돼요.",
         utts=[
             u(0.5, "수아", "표시 조건이 너무 번거롭다는 의견도 있었어."),
             u(5.5, "하준", "번거로워도 해야지! 그게 없으면 다 베껴도 모르잖아!", loud=True),
             u(11.5, "지호", "알겠는데, 목소리가 좀…"),
             u(15.0, "하준", "아니, 진짜 중요한 문제라니까! 이걸 왜 몰라!", loud=True),
             u(20.5, "하준", "표시가 없으면 평가 자체가 안 된다고!", loud=True),
             u(30.5, "하준", "미안, 내가 좀 흥분했네. 차분히 말할게."),
             u(35.0, "수아", "괜찮아. 네 근거가 뭔지 다시 말해 줘."),
         ]),
    dict(id="overlap", name="중첩 발화 안내", icon="🗯️", type="overlap",
         desc="여러 명이 동시에 말하면 감지해 차례대로 말하도록 안내합니다.",
         yellowAt=14, redAt=26, yellowReason="중첩 발화 감지",
         redReason="중첩 발화 반복 — 스팬 5초+",
         ivText="여러 명이 동시에 말하고 있어요. 한 사람씩 차례대로 이야기해 볼까요?",
         utts=[
             u(0.5, "지호", "그럼 최종 조건을 정리해 보자."),
             u(4.8, "하준", "첫째는 사용 공개, 둘째는 수정한 부분 표시…"),
             u(7.5, "수아", "아니 잠깐, 순서가 그게 아니라 설명이 먼저지!", ovl=True),
             u(13.5, "지호", "둘 다 동시에 말하니까 하나도 안 들려."),
             u(18.0, "하준", "내가 먼저 말할게. 첫째, 사용 공개."),
             u(20.5, "윤서", "아 나도 할 말 있는데!", ovl=True),
             u(30.0, "수아", "그래, 하준이부터 말하고 그다음 윤서가 말하자."),
             u(35.0, "하준", "좋아. 첫째 조건부터 다시 갈게."),
         ]),
    dict(id="timer", name="시간 관리", icon="⏱️", type="timer",
         desc="단계별 남은 시간을 관리하고 시간이 다 되면 정리를 안내합니다.",
         yellowAt=20, redAt=30, yellowReason="단계 종료 10초 전",
         redReason="단계 시간 종료",
         ivText="이번 단계 시간이 다 되었어요. 지금까지 나온 조건을 정리하고, 다음 단계로 넘어가 볼까요?",
         timerStart=30,
         utts=[
             u(0.5, "수아", "표시 조건의 단점부터 검토해 보자."),
             u(5.5, "하준", "일일이 표시하는 게 번거롭다는 반론이 나올 수 있어."),
             u(11.0, "지호", "그럼 설명 조건도 검토하자. 외워서 설명만 하면 뚫리지 않아?"),
             u(17.5, "윤서", "그러네. 그럼 발표 때 질문을 받게 하는 건 어때? 이것도 따져 보자."),
             u(23.5, "하준", "좋아, 그리고 공개 조건도 아직 검토 안 했잖아. 그것도 보자."),
             u(33.5, "수아", "벌써 시간이 다 됐구나. 나온 것까지 정리해서 넘어가자."),
             u(38.0, "지호", "그래, 나머지는 합의 단계에서 반영하자."),
         ]),
    dict(id="flow", name="흐름(단계) 관리", icon="🪜", type="flow",
         desc="같은 논의가 반복되며 정체되면 다음 단계로의 진행을 안내합니다.",
         yellowAt=18, redAt=27, yellowReason="논의 정체 감지 (동일 주장 반복)",
         redReason="정체 지속 — 단계 진행 필요",
         ivText="같은 논의가 반복되고 있어요. 지금까지 나온 의견을 바탕으로, 해결안 합의 단계로 넘어가 볼까요?",
         utts=[
             u(0.5, "하준", "그러니까 사용을 밝히면 된다니까."),
             u(4.8, "지호", "아까도 말했지만 밝히는 걸로는 부족해."),
             u(9.8, "하준", "아니 그러니까, 밝히면 된다고."),
             u(14.5, "지호", "그 얘기 아까 했잖아. 부족하다니까."),
             u(19.5, "수아", "계속 같은 이야기가 반복되는 것 같아."),
             u(31.0, "수아", "좋아, 그럼 조건을 최종 문장으로 만들어 보자."),
             u(35.5, "윤서", "첫 문장은 내가 써 볼게."),
         ]),
    dict(id="encourage", name="격려", icon="✨", type="encourage",
         desc="근거를 들어 활발히 토론하면 AI가 칭찬과 격려로 흐름을 북돋습니다.",
         yellowAt=None, redAt=None, encourageAt=26,
         yellowReason=None, redReason=None,
         ivText="모두 근거를 들어 활발하게 참여하고 있어요! 아주 좋아요. 이 흐름 그대로 이어가 볼까요?",
         utts=[
             u(0.5, "수아", "왜 그 조건이 중요하다고 생각해?"),
             u(4.5, "하준", "직접 고친 게 남아야 배운 게 있으니까. 예를 들면 결론 부분."),
             u(10.5, "지호", "좋은 근거다. 나는 설명 가능성이 중요하다고 봐. 발표에서 검증할 수 있으니까."),
             u(17.0, "윤서", "둘 다 설득력 있어. 두 조건을 합치면 어떨까?"),
             u(22.0, "수아", "오, 좋다. 근거까지 다 있네."),
             u(30.5, "하준", "좋아, 그럼 합친 조건으로 정리해 보자."),
             u(35.0, "지호", "이번 모둠 발표 기대되는데?"),
         ]),
]


def wslpath(p):
    return subprocess.run(["wslpath", "-w", p], capture_output=True, text=True).stdout.strip()


def sh(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print("FFMPEG ERR:", " ".join(cmd)[:200], "\n", r.stderr[-800:], flush=True)
        sys.exit(1)


def dur_of(mp3):
    r = subprocess.run(["ffprobe.exe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "csv=p=0", wslpath(mp3)], capture_output=True, text=True)
    return float(r.stdout.strip())


async def tts(text, voice, out):
    await edge_tts.Communicate(text, voice).save(out)


def synth(text, voice, out):
    asyncio.run(tts(text, voice, out))


def build_feature(f):
    print(f"[{f['id']}] {f['name']}", flush=True)
    # 1) 발화별 합성 + 길이 실측
    for i, ut in enumerate(f["utts"]):
        mp3 = os.path.join(TMP, f"{f['id']}_{i}.mp3")
        if not os.path.exists(mp3):
            synth(ut["text"], VOICE[ut["sp"]], mp3)
        ut["dur"] = dur_of(mp3)
        ut["file"] = mp3
    # 2) 타임라인 확정: 순차 배치(겹침 방지), ovl 발화는 예정 시각 고정(의도적 겹침)
    prev_end = 0.0
    for ut in f["utts"]:
        t0 = ut["plan"] if ut["ovl"] else max(ut["plan"], prev_end + 0.35)
        ut["t0"] = round(t0, 2)
        ut["t1"] = round(t0 + ut["dur"], 2)
        if not ut["ovl"]:
            prev_end = ut["t1"]
        else:
            prev_end = max(prev_end, ut["t1"])
    # 2.5) 개입 시점 스냅: 발화 중간이면 그 발화 끝+0.3s로 (재개 시 문장 끊김 방지)
    for key in ("redAt", "encourageAt"):
        v = f.get(key)
        if v is None:
            continue
        for ut in f["utts"]:
            if ut["t0"] < v < ut["t1"]:
                v = round(ut["t1"] + 0.3, 2)
        f[key] = v
    # 2.6) 기능별 가변 길이 = 마지막 발화 끝 + 1.2s (침묵 기능은 최소 40s 유지)
    dur_f = round(max(ut["t1"] for ut in f["utts"]) + 1.2, 1)
    if f["id"] == "silence":
        dur_f = max(dur_f, DUR)
    f["duration"] = dur_f
    # 3) ffmpeg 배치 합성 (adelay + amix), dur_f 패딩
    ins, fl = [], []
    for i, ut in enumerate(f["utts"]):
        ins += ["-i", wslpath(ut["file"])]
        d = int(ut["t0"] * 1000)
        vol = ",volume=2.0" if ut["loud"] else ""
        fl.append(f"[{i}]adelay={d}|{d}{vol}[a{i}]")
    n = len(f["utts"])
    fl.append("".join(f"[a{i}]" for i in range(n)) +
              f"amix=inputs={n}:normalize=0,apad,atrim=0:{dur_f}[out]")
    out = os.path.join(AUD, f"scenario_{f['id']}.mp3")
    sh(["ffmpeg.exe", "-y", "-loglevel", "error", *ins,
        "-filter_complex", ";".join(fl), "-map", "[out]", "-b:a", "96k", wslpath(out)])
    # 4) 개입 TTS
    iv = os.path.join(AUD, f"iv_{f['id']}.mp3")
    if not os.path.exists(iv):
        synth(f["ivText"], VOICE["AI"], iv)
    f["ivDur"] = round(dur_of(iv), 2)
    print(f"  scenario {dur_f}s / red {f.get('redAt')} / iv {f['ivDur']}s / 발화 {n}개", flush=True)


def main():
    for f in FEATURES:
        build_feature(f)
    data = {
        "topic": TOPIC, "stages": STAGES, "duration": DUR,
        "speakers": ["하준", "수아", "지호", "윤서"],
        "features": [
            {k: f.get(k) for k in
             ["id", "name", "icon", "type", "desc", "duration", "yellowAt", "redAt", "encourageAt",
              "yellowReason", "redReason", "ivText", "ivDur", "timerStart"]}
            | {"utts": [{k: ut[k] for k in ["t0", "t1", "sp", "text", "loud", "ovl", "off"]}
                        for ut in f["utts"]]}
            for f in FEATURES
        ],
    }
    with open(os.path.join(HERE, "data.js"), "w", encoding="utf-8") as fp:
        fp.write("// 자동 생성: gen_audio.py — 수정하지 말 것\n")
        fp.write("const DEMO_DATA = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n")
    print("완료 — audio/ + data.js", flush=True)


if __name__ == "__main__":
    main()
