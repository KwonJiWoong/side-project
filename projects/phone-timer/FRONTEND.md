# 자라는 시간 — 프론트엔드 가이드

자라는 시간의 화면 코드가 어떻게 짜여 있고, 고칠 때 무엇을 지켜야 하는지 정리한 문서입니다.

- **공통 규칙은 [`docs/CODING_GUIDE.md`](../../docs/CODING_GUIDE.md)를 따릅니다** (`const`/`let`, 화살표 함수, camelCase id, `el` 모음, BEM, 토큰 등). 이 문서에는 이 사이트에만 있는 내용만 적습니다.
- 모양(색·글자·간격)은 [`DESIGN.md`](DESIGN.md), 기능 기획은 [`PLAN.md`](PLAN.md)
- 이 문서와 코드가 다르면 **코드를 기준으로 이 문서를 고칩니다.**

---

## 1. 파일

공통 규칙의 예외로 **JS를 역할별 파일로 나눴습니다** (CODING_GUIDE 4-1 "역할별 파일 나누기").

```
phone-timer/
├─ index.html              화면 4개(시작·진행·결과·정원) + 대화 상자 3개 + 아이콘 모음
├─ manifest.webmanifest    홈 화면에 추가
├─ css/
│  ├─ reset.css            브라우저 초기화
│  ├─ common.css           토큰(밝은 화면 / 진행 화면), 부품(.btn · .field · .check · .notice · .dialog)
│  └─ style.css            화면별 스타일 (아래 섹션 순서)
├─ js/                     ↓ 이 순서대로 defer로 불러옴
│  ├─ config.js            바꿀 수 있는 값 (시간 기준 · 저장 키)
│  ├─ util.js              글자 만들기 · 날짜 계산
│  ├─ store.js             저장소, 기록 · 설정, 모은 시간 · 해금 계산
│  ├─ plants.js            식물 8종 데이터 + 단계별 SVG
│  ├─ device.js            화면 켜짐 유지(Wake Lock) · 효과음 · 진동
│  ├─ ui.js                화면 전환 · 주소, 확인 창, 글자 크게
│  ├─ setup.js             1. 시작 화면 + 사용 안내 + 홈 화면에 추가
│  ├─ timer.js             2. 진행 화면 + 이탈 감지 + 보너스
│  ├─ result.js            3. 결과 화면 + 기록 남기기
│  ├─ garden.js            4. 내 정원 (주간 화단)
│  ├─ share.js             화단 사진 만들기 · 공유 (Canvas)
│  └─ main.js              첫 실행: 끊긴 타이머 복구 또는 첫 화면 열기
└─ images/                 favicon.svg, icon-180/192/512.png
```

### JS 파일 규칙 (이 사이트만)
- 전역은 `window.GT` 하나. 파일마다 `((GT) => { … })(window.GT = window.GT || {});`로 감싸고 `GT.이름` 하나를 내보낸다
- 파일 위쪽에서 꺼내 둬도 되는 건 먼저 불러오는 기초 파일(`config` · `util` · `store` · `plants`)뿐. 나머지는 **쓰는 순간에** `GT.timer.start()`처럼 부른다
- 처음 그리기는 `main.js`만 한다. 다른 파일은 불러올 때 이벤트만 연결한다
- 화면 요소는 파일마다 위쪽 `const el = { … }`에 모은다 (그 파일이 다루는 화면의 요소만)

| 파일 | 내보내는 이름 | 공개 함수 · 값 |
|---|---|---|
| config.js | `GT.config` | `FAST`, `MINUTE`, `GRACE`, `PAUSE_MAX`, `BONUS_MAX`, `KEYS` |
| util.js | `GT.util` | `$`, `ico`, `pad`, `fmtMin`, `fmtClock`, `fmtAway`, `josa`, `md`, `dayKey`, `weekStart` |
| store.js | `GT.store` | `canStore`, `data`, `settings`, `saveData`, `addRecord`, `clearRecords`, `totalMinutes`, `isUnlocked`, `weekKeyOf`, `weekSuccessDays`, `session.get/set/clear` |
| plants.js | `GT.plants` | `SPECIES`, `STAGES`, `find`, `svg`, `stageOf` |
| device.js | `GT.device` | `unlockAudio`, `chime`, `vibrate`, `canKeepAwake`, `keepAwake`, `releaseAwake` |
| ui.js | `GT.ui` | `screens`, `headings`, `show`, `route`, `go`, `confirm`, `closeConfirm`, `applyFont` |
| setup.js | `GT.setup` | `render` |
| timer.js | `GT.timer` | `start`, `isRunning` |
| result.js | `GT.result` | `finish` |
| garden.js | `GT.garden` | `render`, `markNew` |
| share.js | `GT.share` | `draw` |

---

## 2. 화면 흐름과 상태

한 페이지 안에서 `<section class="screen" hidden>` 4개를 바꿔 보여 준다 (`GT.ui.show(이름)`). 주소는 `#timer`, `#garden` 두 개만 쓰고, 진행·결과 화면은 주소가 없다.

```
시작 화면 ──[시작하기]──▶ (처음이면 사용 안내) ──▶ GT.timer.start()
                                                         │
 진행 화면 (run.phase)                                   ▼
   grow ── 끝까지 ──▶ bonus ──[다 했어요]/화면 나감/30분──▶ GT.result.finish(성공 + 보너스)
    │
    ├─ 나갔다 10초 안에 옴 ──▶ 경고만, grow 계속
    ├─ 10초~5분 + 이어하기 안 씀 ──▶ paused ("자리를 비웠어요" 창, Esc로 안 닫힘)
    │      ├─[이어서 하기]──▶ 비운 시간만큼 start를 미루고 grow
    │      └─[그만두기]────▶ GT.result.finish(시듦)
    ├─ 그 밖의 이탈 / [그만두기] ──▶ GT.result.finish(시듦)
    └─ 창이 닫힘 · 새로고침 ──▶ 다음 실행 때 main.js가 세션으로 복구
```

- 모든 끝은 `GT.result.finish({ ok, held, bonus, reason }, info)` 하나로 처리한다. `held`·`bonus`는 밀리초, `info`는 `{ duration, plant }`
- 시간은 언제나 `Date.now()` 차이로 계산한다. `setInterval`(0.5초)은 화면을 다시 그리는 데만 쓴다
- 스크린리더 알림: 진행 화면은 `#runLive`에 **1분 단위 · 단계 변화만**, 화단 사진은 `#shareStatus`(`role="status"`)

### 상태 표시 (CSS가 보고 모양을 바꿈)
| 표시 | 붙는 곳 | 뜻 |
|---|---|---|
| `body[data-screen]` | body | 지금 화면 (`run`이면 어두운 토큰으로 바뀜) |
| `.run--bonus` | 진행 화면 | 꽃이 핀 뒤 보너스 시간 |
| `.result--success` / `--fail` | 결과 화면 | 성공 / 시듦 |
| `.plant[data-stage="0~3"]` | 식물 SVG | 성장 단계 (CSS가 줄기 · 잎 · 꽃을 보여 줌) |
| `.plant--wilted` | 식물 SVG | 시든 모습 |
| `.bed__item--new` | 화단 식물 | 방금 심음 |
| `html[data-font="lg"]` | html | 글자 크게 |

---

## 3. 저장소 (localStorage)

| 키 | 내용 |
|---|---|
| `growtime-v1` | 기록 + 설정 |
| `growtime-session` | 진행 중인 타이머 (끝나면 지움) |

```json
// growtime-v1
{
  "records": [
    { "id": 1732400000000, "plant": "rose", "stage": 3, "minutes": 31, "bonus": 6,
      "ok": true, "at": "2026-11-24T03:00:00.000Z" }
  ],
  "settings": { "sound": true, "guideSeen": true, "font": "lg", "minutes": 25, "plant": "rose" }
}
// growtime-session
{ "start": 0, "duration": 0, "plant": "daisy", "phase": "grow|paused|bonus",
  "bonusStart": null, "lastSeen": 0, "leftAt": null, "usedPause": false }
```
- `minutes`는 자란 시간 + 보너스. 모은 시간 · 해금은 `minutes`의 합으로 계산한다 (따로 저장하지 않음)
- 저장소를 쓸 수 없으면(시크릿 모드 등) 메모리에만 두고 `#storageNotice`를 보여 준다
- 구조를 바꿀 땐 키 뒤 숫자를 올리고(`growtime-v2`), 예전 값을 옮기는 코드를 `store.js`에 둔다

---

## 4. 식물 SVG (`plants.js`)

- `GT.plants.svg(id, stage, opts)` 하나로 모든 식물을 그린다. 좌표 기준은 DESIGN.md "식물 일러스트"
- `opts`: `label`(스크린리더 이름) · `wilted`(시듦) · `ground`(화분 없이 화단용) · `flat`(이미지 저장용 — CSS 없이도 단계가 보이게 필요한 부분만 그림)
- 화면에서는 `data-stage`만 바꾸면 CSS가 자라는 연출을 한다. 색은 CSS 변수 없이 색값으로 쓴다 (사진 저장 때도 보이게)

---

## 5. CSS — style.css 섹션 순서

새 규칙은 맞는 섹션 끝에 넣는다 (파일 맨 끝에 덧붙이지 않기).

1. 헤더 · 메뉴 → 2. 본문 · 화면 공통 → 3. 시작 화면 → 4. 진행 화면 → 5. 결과 화면 → 6. 내 정원 → 7. 대화 상자 내용 → 8. 푸터 → 9. 식물 SVG · 성장 연출 → 10. 반응형(768px → 1024px)

- 진행 화면의 어두운 색은 `common.css`의 `body[data-screen="run"]`에서 **토큰 값만** 바꾼다. 섞은 색(`--color-line`, `--color-soft`)은 `body`에서 계산해야 진행 화면 색이 반영된다
- 값이 계속 바뀌는 너비(다음 식물 진행 막대)만 `el.style.width`로 바꾼다. CSP가 `style` 속성을 막지만 CSSOM은 허용된다

---

## 6. 자주 하는 작업

| 하고 싶은 것 | 고칠 곳 |
|---|---|
| 식물 추가 | `plants.js` — `SPECIES`에 이름 · 해금 시간, `PARTS`에 꽃 모양 |
| 10초 유예 · 5분 이어하기 · 보너스 30분 | `config.js` |
| 시간 버튼(10 · 25 · 50분) | `index.html` 시간 고르기 라디오 |
| 결과 문구 | `result.js`의 `REASONS`와 `finish()` 안 문구 |
| 새 화면 추가 | `index.html`에 `section.screen` → `ui.js`의 `el` · `screens` · `headings` → 화면 파일을 새로 만들어 script 순서에 넣기 |

---

## 7. 확인 방법

- 주소 끝에 `?fast` → 1분이 1초 (10초 유예 · 5분 이어하기는 실제 시간 그대로)
- 이탈 확인: 다른 탭으로 갔다 오기 (`visibilitychange`)
- 완료 전: CODING_GUIDE 체크리스트 + 이탈 · 이어하기 · 보너스 · 새로고침 복구 · 사진 저장
