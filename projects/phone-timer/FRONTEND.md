# 자라는 시간 — 프론트엔드 가이드

> 화면 모양은 [DESIGN.md](DESIGN.md), 기능 기획은 [PLAN.md](PLAN.md). 이 문서는 **코드를 어디에 어떻게 쓰는지**를 정한다.

## 1. 기본 원칙
- 빌드 도구·프레임워크·외부 라이브러리 없음. 순수 HTML / CSS / JS
- 한 페이지(`index.html`) 안에서 화면 4개(시작·진행·결과·정원)를 바꿔 보여 준다. 주소는 `#timer`, `#garden` 두 개만 쓴다
- CSP가 `'self'`만 허용한다 → **인라인 `<script>`·`style` 속성 금지**. 보이고 숨기기는 `hidden` 속성, 모양 바꾸기는 클래스·`data-*` 속성으로. 예외: 진행 막대 너비처럼 값이 계속 바뀌는 것만 `el.style.width` (CSSOM은 CSP에 막히지 않음)
- 저장은 이 기기의 `localStorage`만. 서버 통신 없음

## 2. 폴더 구조
```
projects/phone-timer/
├─ index.html              화면 4개 + 대화 상자 3개 + 아이콘 모음(SVG symbol)
├─ manifest.webmanifest    홈 화면에 추가
├─ PLAN.md · DESIGN.md · FRONTEND.md
├─ css/
│  ├─ reset.css            브라우저 기본값 초기화 (저장소 공통, 고치지 않음)
│  ├─ common.css           디자인 토큰 + 어디서나 쓰는 부품 (버튼·입력·안내문·대화 상자)
│  └─ style.css            화면별 모양 + 식물 SVG 연출 + 반응형
├─ js/                     ↓ 아래 순서대로 불러옴 (모두 defer)
│  ├─ config.js            시간 기준·저장 키 등 바꿀 수 있는 값
│  ├─ util.js              글자 만들기·날짜 계산 도우미
│  ├─ store.js             저장소, 기록·설정, 모은 시간·해금 계산
│  ├─ plants.js            식물 8종 데이터 + 단계별 SVG
│  ├─ device.js            화면 켜짐 유지(Wake Lock), 효과음, 진동
│  ├─ ui.js                화면 전환·주소, 확인 창, 글자 크게
│  ├─ setup.js             1. 시작 화면 + 사용 안내 + 홈 화면에 추가
│  ├─ timer.js             2. 진행 화면 + 이탈 감지 + 보너스
│  ├─ result.js            3. 결과 화면 + 기록 남기기
│  ├─ garden.js            4. 내 정원 (주간 화단)
│  ├─ share.js             화단 사진 만들기·공유 (Canvas)
│  └─ main.js              첫 실행: 끊긴 타이머 복구 또는 첫 화면 열기
└─ images/                 favicon.svg, icon-180/192/512.png
```

## 3. HTML 규칙
| 대상 | 규칙 | 예 |
|---|---|---|
| 화면 | `<section class="screen 이름" id="screen-이름" hidden>` 하나에 화면 하나 | `#screen-garden` |
| 화면 제목 | `h2` + `tabindex="-1"` → 화면이 바뀌면 여기로 포커스 | `#garden-title` |
| 제목 순서 | `h1` 서비스 이름(헤더) 하나 → 화면 `h2` → 영역 `h3` → 화단 `h4` | |
| id | JS가 찾는 요소에만. `화면-역할` 꼴, 소문자 kebab | `#run-time`, `#share-btn` |
| class | 모양에만. JS는 class로 요소를 찾지 않는다 (`.plant` 같은 그림 내부는 예외) | |
| 아이콘 | 위쪽 `<symbol id="i-이름">`에 모으고 `<svg class="ico"><use href="#i-이름">`로 씀. 항상 `aria-hidden="true"` + 옆에 글자 | `#i-garden` |
| 대화 상자 | `<dialog class="dialog">` + `aria-labelledby`. `showModal()`로 열기 | `#confirm-dialog` |
| 알림 | 화면마다 `aria-live` 하나만. 진행 화면은 `#run-live`(1분 단위·단계 변화만) | |
| 상태 | 보이기/숨기기는 `hidden` 속성 | `doneBtn.hidden = false` |

## 4. CSS 규칙
### 파일 역할
- `common.css`: `:root` 토큰 → 진행 화면 토큰(`body[data-screen="run"]`) → 기본 요소 → 부품(`.btn`, `.field`, `.check`, `.notice`, `.dialog`) → 모션 줄이기
- `style.css`: 화면별. 아래 **섹션 순서**를 지키고, 새 규칙은 맞는 섹션 끝에 넣는다 (파일 맨 끝에 덧붙이지 않기)

### style.css 섹션 순서
1. 헤더 · 메뉴
2. 본문 · 화면 공통
3. 시작 화면 (시간·식물 고르기, 설정)
4. 진행 화면 (게이지, 보너스)
5. 결과 화면
6. 내 정원 (통계, 다음 식물, 주간 화단, 화단 사진)
7. 대화 상자 내용 (사용 안내, 홈 화면에 추가)
8. 푸터
9. 식물 SVG · 성장 연출
10. 반응형 (768px → 1024px)

### 이름 · 값
- BEM: `블록__요소--상태` (예: `.bed__item--new`, `.btn--primary`). 블록은 화면이나 부품 이름
- 색·간격·글자 크기·모서리는 **토큰만** (`var(--color-primary)`, `var(--space-md)`). 색값을 직접 쓰는 곳은 `plants.js`의 식물 색과 Canvas 그림뿐
- 상태 표시용 클래스·속성은 이것만 쓴다

| 표시 | 붙는 곳 | 뜻 |
|---|---|---|
| `body[data-screen]` | body | 지금 화면 (`run`이면 어두운 토큰) |
| `.run--bonus` | 진행 화면 | 꽃이 핀 뒤 보너스 시간 |
| `.result--success` / `--fail` | 결과 화면 | 성공 / 시듦 |
| `.plant[data-stage="0~3"]` | 식물 SVG | 성장 단계 (CSS가 줄기·잎·꽃을 보여 줌) |
| `.plant--wilted` | 식물 SVG | 시든 모습 |
| `.bed__item--new` | 화단 식물 | 방금 심음 |
| `html[data-font="lg"]` | html | 글자 크게 |

- 단위: 글자 `rem`, 폭·간격 `%`·`fr`·`clamp()`·`rem`. `px`는 쓰지 않는다 (SVG 좌표 제외)
- 모바일 먼저 쓰고 `@media (min-width: 768px)`, `(min-width: 1024px)`에서만 덧씀
- 움직임은 `transition`/`animation`으로만. `prefers-reduced-motion`은 `common.css`에서 한꺼번에 끈다

## 5. JS 규칙
### 파일 틀
```js
/* 파일이 하는 일 한 줄 */
(function (GT) {
  'use strict';

  /* ===== 구역 이름 ===== */
  function doSomething() { ... }

  GT.이름 = { doSomething: doSomething };
})(window.GT = window.GT || {});
```
- 전역은 `window.GT` 하나만. 파일마다 `GT.이름` 하나를 내보낸다
- **다른 파일의 기능은 쓰는 순간에 `GT.이름.함수()`로 부른다.** 파일 위쪽에서 `var store = GT.store`처럼 미리 꺼내 두는 건 `config`·`util`·`store`·`plants`(먼저 불러오는 기초 파일)만 허용
- 화면을 처음 그리는 일은 `main.js`만 한다. 다른 파일은 불러올 때 이벤트만 연결한다
- `var`·`function` 문법 (저장소의 다른 사이트와 같은 톤). 비동기는 `Promise`
- HTML은 문자열로 만들어 `innerHTML`에 넣는다. **사용자가 입력한 글자는 넣지 않는다** (지금 입력은 숫자뿐이고 `Number()`로 바꿔 씀)
- 시간은 언제나 `Date.now()` 차이로 계산한다 (`setInterval` 횟수를 세지 않음 → 백그라운드에서 느려져도 정확)
- 문구는 해요체. 사용자에게 보이는 문구는 각 화면 파일 안에 모아 둔다 (결과 문구 → `result.js`의 `REASONS`)

### 파일별 공개 함수
| 파일 | 이름 | 공개 함수 |
|---|---|---|
| config.js | `GT.config` | `FAST`, `MINUTE`, `GRACE`, `PAUSE_MAX`, `BONUS_MAX`, `KEYS` |
| util.js | `GT.util` | `$`, `icon`, `fmtMin`, `fmtClock`, `fmtAway`, `pad`, `josa`, `md`, `dayKey`, `weekStart` |
| store.js | `GT.store` | `canStore`, `data`, `settings`, `saveData`, `addRecord`, `clearRecords`, `totalMinutes`, `isUnlocked`, `weekKeyOf`, `weekSuccessDays`, `session.get/set/clear` |
| plants.js | `GT.plants` | `SPECIES`, `STAGES`, `find`, `svg`, `stageOf` |
| device.js | `GT.device` | `unlockAudio`, `chime`, `vibrate`, `keepAwake`, `releaseAwake`, `canKeepAwake` |
| ui.js | `GT.ui` | `screens`, `headings`, `show`, `route`, `go`, `confirm`, `closeConfirm`, `applyFont` |
| setup.js | `GT.setup` | `render` |
| timer.js | `GT.timer` | `start`, `isRunning` |
| result.js | `GT.result` | `finish` |
| garden.js | `GT.garden` | `render`, `markNew` |
| share.js | `GT.share` | `draw` |

### 화면 흐름
```
시작 화면 ──[시작하기]──▶ (처음이면 사용 안내) ──▶ timer.start()
                                                      │
 진행 화면 (phase)                                    ▼
   grow ── 끝까지 ──▶ bonus ──[다 했어요]/이탈/30분──▶ result.finish(성공 + 보너스)
    │
    ├─ 나갔다 10초 안에 옴 ──▶ 경고만, grow 계속
    ├─ 10초~5분 + 이어하기 안 씀 ──▶ paused (자리를 비웠어요)
    │      ├─[이어서 하기]──▶ 비운 시간만큼 start를 미루고 grow
    │      └─[그만두기]────▶ result.finish(시듦)
    ├─ 그 밖의 이탈 / [그만두기] ──▶ result.finish(시듦)
    └─ 창이 닫힘·새로고침 ──▶ 다음 실행 때 main.js가 세션으로 복구
```
- `result.finish({ ok, held, bonus, reason }, session)` 하나로 모든 끝을 처리한다. `held`·`bonus`는 밀리초

## 6. 저장 구조 (localStorage)
| 키 | 내용 |
|---|---|
| `growtime-v1` | 기록 + 설정 (아래) |
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
- `minutes`는 자란 시간 + 보너스. 모은 시간·해금은 `minutes`의 합으로 계산 (따로 저장하지 않음)
- 구조를 바꿀 땐 키 뒤 숫자를 올리고(`growtime-v2`), 예전 값을 옮기는 코드를 `store.js`에 둔다

## 7. 자주 하는 작업
| 하고 싶은 것 | 고칠 곳 |
|---|---|
| 식물 추가 | `plants.js` — `SPECIES`에 이름·해금 시간, `PARTS`에 꽃 모양. 색은 색값으로 |
| 10초 유예·5분 이어하기·보너스 30분 바꾸기 | `config.js` |
| 시간 버튼(10·25·50분) 바꾸기 | `index.html` 시간 고르기 라디오 |
| 결과 문구 | `result.js`의 `REASONS`와 `finish()` 안 문구 |
| 새 화면 추가 | `index.html`에 `section.screen` → `ui.js`의 `screens`·`headings` → 화면 파일 새로 만들어 `index.html`의 script 순서에 넣기 |

## 8. 확인 방법
- 주소 끝에 `?fast` → 1분이 1초 (10초 유예·5분 이어하기는 실제 시간 그대로)
- 이탈 확인: 다른 탭으로 갔다 오기 (`visibilitychange`)
- 완료 전 체크: 375 / 768 / 1280px, 글자 크게 + 320px 가로 넘침 없음, 키보드로 끝까지, 콘솔 에러 없음, Lighthouse 접근성 95 이상
