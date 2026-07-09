# 온디바이스 AI 협력학습 퍼실리테이터 — 웹 체험 데모

KERIS 「온디바이스 AI 기반 협력학습 지원 시스템 개발 및 현장 적용 연구」(충남대학교)의
기능 체험용 웹 데모입니다. 선생님들이 브라우저에서 10가지 기능을 40초 내외 시나리오로 체험할 수 있습니다.

- **학생용 대시보드**(모둠 태블릿 화면)와 **교사용 대시보드**(실시간 모니터링)를 나란히 보여줍니다
- 기능을 고르면 모둠 대화(합성 음성)가 재생되고, 임계치를 넘는 순간
  교사 대시보드가 🟡 → 🔴로 바뀌며 AI가 음성으로 개입합니다
- 최소 개입 원칙: 🟡는 교사에게만, 🔴일 때만 학생에게 개입

## 기능 10종
발언 독점 케어 · 소외 학생 감지 · 침묵 관리 · 주제 이탈 감지 · 질문 유도 ·
발화 볼륨 안내 · 중첩 발화 안내 · 시간 관리 · 흐름(단계) 관리 · 격려

## 로컬에서 열기
`index.html`을 브라우저로 열면 됩니다 (서버 불필요).

## 음원 재생성
시나리오 대사·타이밍은 `gen_audio.py`에 정의되어 있습니다. 수정 후:
```
python gen_audio.py   # edge-tts + ffmpeg 필요 → audio/ 와 data.js 재생성
```

## GitHub Pages 배포
```
gh auth login
gh repo create ondeviceai-webdemo --public --source . --push
gh api -X POST repos/{owner}/{repo}/pages -f "source[branch]=master" -f "source[path]=/"
```
몇 분 뒤 `https://<계정>.github.io/ondeviceai-webdemo/` 에서 접속 가능합니다.

---
모든 음성은 데모용 합성 음성(가상의 학생)이며, 실제 시스템은 태블릿 내부에서만 음성을 처리합니다.
