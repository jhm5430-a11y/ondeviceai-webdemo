// 자동 생성: gen_audio.py — 수정하지 말 것
const DEMO_DATA = {
 "topic": "AI가 작성한 보고서나 발표자료를 학습자의 산출물로 인정할 수 있는가",
 "stages": [
  "문제탐색",
  "아이디어발산",
  "비판검토",
  "해결안합의"
 ],
 "duration": 40.0,
 "speakers": [
  "하준",
  "수아",
  "지호",
  "윤서"
 ],
 "features": [
  {
   "id": "gini",
   "name": "발언 독점 케어",
   "icon": "🗣️",
   "type": "gini",
   "desc": "한 학생이 발언을 독점하면 감지해 골고루 참여하도록 안내합니다.",
   "duration": 49.1,
   "yellowAt": 18,
   "redAt": 32.71,
   "encourageAt": null,
   "yellowReason": "발언 독점 감지 (하준 점유 급증)",
   "redReason": "발언 독점 지속 — Gini 0.41 ≥ 0.30",
   "ivText": "하준 학생의 의견 잘 들었어요. 이번에는 다른 친구들의 생각도 한번 들어볼까요?",
   "ivDur": 7.37,
   "timerStart": null,
   "utts": [
    {
     "t0": 0.5,
     "t1": 5.2,
     "sp": "수아",
     "text": "AI가 만든 보고서를 어디까지 인정할지 이야기해 보자.",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 5.55,
     "t1": 12.46,
     "sp": "하준",
     "text": "나는 확실히 반대야. AI가 다 써 주면 그게 왜 내 산출물이야?",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 12.81,
     "t1": 23.08,
     "sp": "하준",
     "text": "그리고 평가도 불공정해져. AI 잘 쓰는 애만 유리하잖아. 노력한 사람이 손해 보는 구조라고.",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 23.43,
     "t1": 32.41,
     "sp": "하준",
     "text": "게다가 실력 확인도 안 되지, 스스로 생각하는 힘도 약해지지. 안 좋은 점이 한둘이 아니야.",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 32.76,
     "t1": 39.17,
     "sp": "하준",
     "text": "그러니까 결론은 무조건 반대야. 더 말할 것도 없어.",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 39.52,
     "t1": 44.1,
     "sp": "수아",
     "text": "고마워. 그럼 윤서는 어떻게 생각해?",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 44.45,
     "t1": 47.88,
     "sp": "윤서",
     "text": "나는 조건을 붙이면 인정할 수 있다고 생각해.",
     "loud": false,
     "ovl": false,
     "off": false
    }
   ]
  },
  {
   "id": "neglect",
   "name": "소외 학생 감지",
   "icon": "🫥",
   "type": "neglect",
   "desc": "발언이 없는 학생을 감지해 자연스럽게 참여를 이끌어냅니다.",
   "duration": 41.1,
   "yellowAt": 20,
   "redAt": 28.58,
   "encourageAt": null,
   "yellowReason": "윤서 저참여 (누적 발화 0%)",
   "redReason": "윤서 무발언 지속",
   "ivText": "윤서 학생은 어떻게 생각하나요? 윤서의 생각도 궁금해요.",
   "ivDur": 5.59,
   "timerStart": null,
   "utts": [
    {
     "t0": 0.5,
     "t1": 5.49,
     "sp": "하준",
     "text": "AI 사용을 밝히기만 하면 인정해도 된다고 생각해.",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 5.84,
     "t1": 12.01,
     "sp": "수아",
     "text": "밝히는 것만으로는 부족하지 않아? 직접 고친 부분이 있어야지.",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 12.36,
     "t1": 16.01,
     "sp": "지호",
     "text": "맞아, 수정 과정을 같이 내면 어떨까?",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 16.36,
     "t1": 21.26,
     "sp": "하준",
     "text": "오, 그럼 어디를 고쳤는지 표시하는 조건을 넣자.",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 21.61,
     "t1": 28.28,
     "sp": "수아",
     "text": "좋아. 그럼 조건이 두 개네. 사용 공개랑 수정 표시.",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 28.63,
     "t1": 31.7,
     "sp": "지호",
     "text": "정리 좋다. 그렇게 가자.",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 32.05,
     "t1": 36.87,
     "sp": "윤서",
     "text": "음… 나는 설명할 수 있어야 한다는 조건도 필요하다고 생각해.",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 37.22,
     "t1": 39.91,
     "sp": "수아",
     "text": "오, 좋은 생각이야!",
     "loud": false,
     "ovl": false,
     "off": false
    }
   ]
  },
  {
   "id": "silence",
   "name": "침묵 관리",
   "icon": "🤫",
   "type": "silence",
   "desc": "모둠 전체가 오래 침묵하면 사고를 여는 질문으로 대화를 재개합니다.",
   "duration": 40.0,
   "yellowAt": 24,
   "redAt": 31,
   "encourageAt": null,
   "yellowReason": "침묵 12초 경과",
   "redReason": "침묵 19초 경과",
   "ivText": "지금 어떤 부분이 고민되나요? 방금 나온 조건 중에서 하나씩 의견을 말해 볼까요?",
   "ivDur": 7.49,
   "timerStart": null,
   "utts": [
    {
     "t0": 0.5,
     "t1": 5.32,
     "sp": "지호",
     "text": "조건부 인정으로 간다면, 어떤 조건이 제일 중요할까?",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 5.8,
     "t1": 9.78,
     "sp": "하준",
     "text": "음… 그게 좀 어렵네.",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 10.13,
     "t1": 13.2,
     "sp": "수아",
     "text": "생각할 시간이 필요할 것 같아.",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 34.0,
     "t1": 37.65,
     "sp": "윤서",
     "text": "나는 직접 설명할 수 있는 게 제일 중요한 것 같아.",
     "loud": false,
     "ovl": false,
     "off": false
    }
   ]
  },
  {
   "id": "topic",
   "name": "주제 이탈 감지",
   "icon": "🧭",
   "type": "topic",
   "desc": "대화가 토론 주제에서 벗어나면 감지해 주제로 되돌립니다.",
   "duration": 44.6,
   "yellowAt": 22,
   "redAt": 33.56,
   "encourageAt": null,
   "yellowReason": "주제 집중도 하락 (0.46)",
   "redReason": "주제 집중도 0.31 < 0.37",
   "ivText": "재미있는 이야기지만, 지금은 AI 산출물을 인정할 조건을 정하고 있어요. 주제로 돌아와 볼까요?",
   "ivDur": 8.62,
   "timerStart": null,
   "utts": [
    {
     "t0": 0.5,
     "t1": 4.92,
     "sp": "수아",
     "text": "AI가 쓴 부분을 표시하자는 조건까지 정리했어.",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 5.27,
     "t1": 11.85,
     "sp": "지호",
     "text": "아 맞다, 어제 월드컵 예선 봤어? 후반 역전골 진짜 대단하던데.",
     "loud": false,
     "ovl": false,
     "off": true
    },
    {
     "t0": 12.2,
     "t1": 17.74,
     "sp": "하준",
     "text": "봤지! 마지막 프리킥 완전 소름이었잖아.",
     "loud": false,
     "ovl": false,
     "off": true
    },
    {
     "t0": 18.09,
     "t1": 24.07,
     "sp": "지호",
     "text": "다음 경기 상대 어디더라? 이대로면 십육강은 무난할 것 같은데.",
     "loud": false,
     "ovl": false,
     "off": true
    },
    {
     "t0": 24.42,
     "t1": 28.21,
     "sp": "윤서",
     "text": "우리 반에서 다 같이 축구 직관 가자는 얘기도 있던데.",
     "loud": false,
     "ovl": false,
     "off": true
    },
    {
     "t0": 28.56,
     "t1": 33.26,
     "sp": "하준",
     "text": "직관 가고 싶다. 표는 얼마지?",
     "loud": false,
     "ovl": false,
     "off": true
    },
    {
     "t0": 33.61,
     "t1": 38.87,
     "sp": "수아",
     "text": "그래, 월드컵 얘기는 이따 하고 다시 조건 이야기로 돌아가자.",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 39.22,
     "t1": 43.44,
     "sp": "지호",
     "text": "미안 미안. 표시 조건 다음으로 넘어가자.",
     "loud": false,
     "ovl": false,
     "off": false
    }
   ]
  },
  {
   "id": "question",
   "name": "질문 유도",
   "icon": "❓",
   "type": "question",
   "desc": "서로 묻지 않고 각자 주장만 이어지면 질문을 유도합니다.",
   "duration": 43.3,
   "yellowAt": 24,
   "redAt": 30,
   "encourageAt": null,
   "yellowReason": "질문 없음 지속",
   "redReason": "상호 질문 부재 — 논의 심화 정체",
   "ivText": "서로의 생각에 대해 궁금한 점을 질문해 보면 어떨까요? 왜 그 조건이 중요한지 물어봐도 좋아요.",
   "ivDur": 8.06,
   "timerStart": null,
   "utts": [
    {
     "t0": 0.5,
     "t1": 4.58,
     "sp": "하준",
     "text": "나는 표시 조건이 제일 중요하다고 봐.",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 5.0,
     "t1": 8.22,
     "sp": "지호",
     "text": "나는 설명 가능해야 한다는 조건.",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 9.5,
     "t1": 11.78,
     "sp": "수아",
     "text": "나는 사용 공개.",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 13.5,
     "t1": 19.6,
     "sp": "하준",
     "text": "다들 자기 조건만 말하네. 아무튼 내 생각은 그래.",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 19.95,
     "t1": 23.02,
     "sp": "지호",
     "text": "그래, 각자 생각은 알겠어.",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 33.0,
     "t1": 37.58,
     "sp": "수아",
     "text": "하준아, 왜 표시 조건이 제일 중요하다고 생각해?",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 37.93,
     "t1": 42.11,
     "sp": "하준",
     "text": "베낀 건지 고친 건지 그걸로 구분되니까.",
     "loud": false,
     "ovl": false,
     "off": false
    }
   ]
  },
  {
   "id": "volume",
   "name": "발화 볼륨 안내",
   "icon": "📢",
   "type": "volume",
   "desc": "목소리가 지나치게 커지면 차분한 대화를 안내합니다.",
   "duration": 42.8,
   "yellowAt": 20,
   "redAt": 27,
   "encourageAt": null,
   "yellowReason": "발화 볼륨 상승 (하준)",
   "redReason": "큰 소리 지속 10초+",
   "ivText": "목소리가 조금 커졌어요. 중요한 의견일수록 차분하게 말하면 더 잘 전달돼요.",
   "ivDur": 7.37,
   "timerStart": null,
   "utts": [
    {
     "t0": 0.5,
     "t1": 4.39,
     "sp": "수아",
     "text": "표시 조건이 너무 번거롭다는 의견도 있었어.",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 5.5,
     "t1": 11.64,
     "sp": "하준",
     "text": "번거로워도 해야지! 그게 없으면 다 베껴도 모르잖아!",
     "loud": true,
     "ovl": false,
     "off": false
    },
    {
     "t0": 11.99,
     "t1": 14.99,
     "sp": "지호",
     "text": "알겠는데, 목소리가 좀…",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 15.34,
     "t1": 21.58,
     "sp": "하준",
     "text": "아니, 진짜 중요한 문제라니까! 이걸 왜 몰라!",
     "loud": true,
     "ovl": false,
     "off": false
    },
    {
     "t0": 21.93,
     "t1": 26.06,
     "sp": "하준",
     "text": "표시가 없으면 평가 자체가 안 된다고!",
     "loud": true,
     "ovl": false,
     "off": false
    },
    {
     "t0": 30.5,
     "t1": 36.48,
     "sp": "하준",
     "text": "미안, 내가 좀 흥분했네. 차분히 말할게.",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 36.83,
     "t1": 41.56,
     "sp": "수아",
     "text": "괜찮아. 네 근거가 뭔지 다시 말해 줘.",
     "loud": false,
     "ovl": false,
     "off": false
    }
   ]
  },
  {
   "id": "overlap",
   "name": "중첩 발화 안내",
   "icon": "🗯️",
   "type": "overlap",
   "desc": "여러 명이 동시에 말하면 감지해 차례대로 말하도록 안내합니다.",
   "duration": 41.2,
   "yellowAt": 14,
   "redAt": 26,
   "encourageAt": null,
   "yellowReason": "중첩 발화 감지",
   "redReason": "중첩 발화 반복 — 스팬 5초+",
   "ivText": "여러 명이 동시에 말하고 있어요. 한 사람씩 차례대로 이야기해 볼까요?",
   "ivDur": 6.14,
   "timerStart": null,
   "utts": [
    {
     "t0": 0.5,
     "t1": 3.43,
     "sp": "지호",
     "text": "그럼 최종 조건을 정리해 보자.",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 4.8,
     "t1": 9.72,
     "sp": "하준",
     "text": "첫째는 사용 공개, 둘째는 수정한 부분 표시…",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 7.5,
     "t1": 11.94,
     "sp": "수아",
     "text": "아니 잠깐, 순서가 그게 아니라 설명이 먼저지!",
     "loud": false,
     "ovl": true,
     "off": false
    },
    {
     "t0": 13.5,
     "t1": 16.96,
     "sp": "지호",
     "text": "둘 다 동시에 말하니까 하나도 안 들려.",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 18.0,
     "t1": 24.12,
     "sp": "하준",
     "text": "내가 먼저 말할게. 첫째, 사용 공개.",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 20.5,
     "t1": 22.42,
     "sp": "윤서",
     "text": "아 나도 할 말 있는데!",
     "loud": false,
     "ovl": true,
     "off": false
    },
    {
     "t0": 30.0,
     "t1": 34.66,
     "sp": "수아",
     "text": "그래, 하준이부터 말하고 그다음 윤서가 말하자.",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 35.01,
     "t1": 40.05,
     "sp": "하준",
     "text": "좋아. 첫째 조건부터 다시 갈게.",
     "loud": false,
     "ovl": false,
     "off": false
    }
   ]
  },
  {
   "id": "timer",
   "name": "시간 관리",
   "icon": "⏱️",
   "type": "timer",
   "desc": "단계별 남은 시간을 관리하고 시간이 다 되면 정리를 안내합니다.",
   "duration": 44.9,
   "yellowAt": 20,
   "redAt": 31.19,
   "encourageAt": null,
   "yellowReason": "단계 종료 10초 전",
   "redReason": "단계 시간 종료",
   "ivText": "이번 단계 시간이 다 되었어요. 지금까지 나온 조건을 정리하고, 다음 단계로 넘어가 볼까요?",
   "ivDur": 8.16,
   "timerStart": 30,
   "utts": [
    {
     "t0": 0.5,
     "t1": 3.96,
     "sp": "수아",
     "text": "표시 조건의 단점부터 검토해 보자.",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 5.5,
     "t1": 10.11,
     "sp": "하준",
     "text": "일일이 표시하는 게 번거롭다는 반론이 나올 수 있어.",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 11.0,
     "t1": 16.98,
     "sp": "지호",
     "text": "그럼 설명 조건도 검토하자. 외워서 설명만 하면 뚫리지 않아?",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 17.5,
     "t1": 22.92,
     "sp": "윤서",
     "text": "그러네. 그럼 발표 때 질문을 받게 하는 건 어때? 이것도 따져 보자.",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 23.5,
     "t1": 30.89,
     "sp": "하준",
     "text": "좋아, 그리고 공개 조건도 아직 검토 안 했잖아. 그것도 보자.",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 33.5,
     "t1": 39.36,
     "sp": "수아",
     "text": "벌써 시간이 다 됐구나. 나온 것까지 정리해서 넘어가자.",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 39.71,
     "t1": 43.65,
     "sp": "지호",
     "text": "그래, 나머지는 합의 단계에서 반영하자.",
     "loud": false,
     "ovl": false,
     "off": false
    }
   ]
  },
  {
   "id": "flow",
   "name": "흐름(단계) 관리",
   "icon": "🪜",
   "type": "flow",
   "desc": "같은 논의가 반복되며 정체되면 다음 단계로의 진행을 안내합니다.",
   "duration": 39.3,
   "yellowAt": 18,
   "redAt": 27,
   "encourageAt": null,
   "yellowReason": "논의 정체 감지 (동일 주장 반복)",
   "redReason": "정체 지속 — 단계 진행 필요",
   "ivText": "같은 논의가 반복되고 있어요. 지금까지 나온 의견을 바탕으로, 해결안 합의 단계로 넘어가 볼까요?",
   "ivDur": 8.59,
   "timerStart": null,
   "utts": [
    {
     "t0": 0.5,
     "t1": 4.12,
     "sp": "하준",
     "text": "그러니까 사용을 밝히면 된다니까.",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 4.8,
     "t1": 8.45,
     "sp": "지호",
     "text": "아까도 말했지만 밝히는 걸로는 부족해.",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 9.8,
     "t1": 13.78,
     "sp": "하준",
     "text": "아니 그러니까, 밝히면 된다고.",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 14.5,
     "t1": 18.22,
     "sp": "지호",
     "text": "그 얘기 아까 했잖아. 부족하다니까.",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 19.5,
     "t1": 23.03,
     "sp": "수아",
     "text": "계속 같은 이야기가 반복되는 것 같아.",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 31.0,
     "t1": 35.51,
     "sp": "수아",
     "text": "좋아, 그럼 조건을 최종 문장으로 만들어 보자.",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 35.86,
     "t1": 38.09,
     "sp": "윤서",
     "text": "첫 문장은 내가 써 볼게.",
     "loud": false,
     "ovl": false,
     "off": false
    }
   ]
  },
  {
   "id": "encourage",
   "name": "격려",
   "icon": "✨",
   "type": "encourage",
   "desc": "근거를 들어 활발히 토론하면 AI가 칭찬과 격려로 흐름을 북돋습니다.",
   "duration": 39.4,
   "yellowAt": null,
   "redAt": null,
   "encourageAt": 29.01,
   "yellowReason": null,
   "redReason": null,
   "ivText": "모두 근거를 들어 활발하게 참여하고 있어요! 아주 좋아요. 이 흐름 그대로 이어가 볼까요?",
   "ivDur": 8.33,
   "timerStart": null,
   "utts": [
    {
     "t0": 0.5,
     "t1": 3.55,
     "sp": "수아",
     "text": "왜 그 조건이 중요하다고 생각해?",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 4.5,
     "t1": 11.27,
     "sp": "하준",
     "text": "직접 고친 게 남아야 배운 게 있으니까. 예를 들면 결론 부분.",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 11.62,
     "t1": 19.32,
     "sp": "지호",
     "text": "좋은 근거다. 나는 설명 가능성이 중요하다고 봐. 발표에서 검증할 수 있으니까.",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 19.67,
     "t1": 23.75,
     "sp": "윤서",
     "text": "둘 다 설득력 있어. 두 조건을 합치면 어떨까?",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 24.1,
     "t1": 28.71,
     "sp": "수아",
     "text": "오, 좋다. 근거까지 다 있네.",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 30.5,
     "t1": 35.01,
     "sp": "하준",
     "text": "좋아, 그럼 합친 조건으로 정리해 보자.",
     "loud": false,
     "ovl": false,
     "off": false
    },
    {
     "t0": 35.36,
     "t1": 38.22,
     "sp": "지호",
     "text": "이번 모둠 발표 기대되는데?",
     "loud": false,
     "ovl": false,
     "off": false
    }
   ]
  }
 ]
};
