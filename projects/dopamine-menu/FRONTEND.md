# 딴짓 메뉴 프론트엔드 가이드

딴짓 메뉴의 화면 코드(HTML · CSS · JS)가 어떻게 짜여 있고, 고칠 때 무엇을 지켜야 하는지 정리한 문서입니다.
모양(색·글자·간격)은 [`DESIGN.md`](DESIGN.md), 저장소 공통 규칙은 `docs/CODING_GUIDE.md`를 따릅니다. 이 문서와 코드가 다르면 **코드를 기준으로 이 문서를 고칩니다.**

- 서버 없음. 정적 파일만으로 동작하고, 기록은 모두 이용자 브라우저(localStorage)에 저장
- 프레임워크·빌드 없음. HTML5 / CSS3 / Vanilla JS, 외부 파일은 Pretendard 글꼴 CDN과 (승인 후) 애드센스뿐

---

## 1. 파일

```
dopamine-menu/
├─ index.html            메인 화면 (메뉴판 · 타이머 · 도장판이 한 페이지)
├─ privacy.html          개인정보 처리방침 (JS 없음)
├─ css/
│  ├─ reset.css          브라우저 초기화
│  ├─ common.css         색 토큰(밝은/어두운), 기본값, .btn · .ico · .sr-only 등 공통 부품
│  └─ style.css          화면별 스타일 (헤더 → 탭 → 카드 → 타이머 → 도장판 → 자주 묻는 질문 → 광고 → 푸터 → 처리방침 순)
├─ js/
│  ├─ main.js            화면 동작 전부
│  └─ ads.js             광고 자리 (ID가 비어 있으면 아무것도 안 함)
├─ data/activities.json  활동 목록
├─ images/              favicon.svg, og-image.png(1200×630 공유 미리보기)
├─ sitemap.xml           검색 엔진용 페이지 목록 (Search Console에 제출)
├─ llms.txt              AI 검색용 서비스 요약
├─ DESIGN.md · FRONTEND.md
```

- `main.js`는 `index.html`에서만 불러온다. `privacy.html`은 CSS만 쓴다
- 아이콘은 `index.html` 위쪽 `<svg class="sprite">` 안의 `<symbol>`로 모아 두고 `<use href="#i-이름">`으로 쓴다 (`privacy.html`은 로고 하나만 직접 넣음)

---

## 2. 화면 흐름과 상태

한 페이지 안에서 섹션을 숨기고 보여 주는 방식이다. 페이지 이동은 없다.

```
[불러오는 중] ─실패→ [불러오기 실패: 다시 시도]
      │성공
      ▼
[뽑기 전] ─오늘의 추천 뽑기→ [뽑은 뒤] ─다른 거(하루 3번)→ [뽑은 뒤]
                                  │이걸로 할게요
                                  ▼
                            [타이머 진행] ─시간 끝 / 다 했어요→ 도장 → [뽑기 전] + 도장판 갱신
                                  │그만하기
                                  ▼
                            [뽑은 뒤] (뽑은 메뉴 그대로)
```

| 상태 | 화면 | 판단 기준 |
|---|---|---|
| 불러오는 중 | 안내 문구, 뽑기 버튼 비활성 | `state.status === 'loading'` |
| 불러오기 실패 | 오류 블록 + [다시 시도], 카드 숨김 | `state.status === 'error'` |
| 뽑기 전 | 카드 앞면(?), [오늘의 추천 뽑기] | 지금 탭 시간대에 오늘 뽑은 메뉴가 없음 |
| 뽑은 뒤 | 카드 뒷면, [이걸로 할게요] [다른 거] | `state.today.picks[시간]`이 있음 |
| 타이머 | 메뉴판(`#order`) 숨김, 타이머(`#timer`) 보임 | `state.timer`가 있음 |
| 타이머 완료 | "시간이 다 됐어요" 표시, 숫자 00:00 | `state.timer.isDone` |
| 도장판 | 항상 보임 | — |

---

## 3. 활동 데이터 (`data/activities.json`)

```json
{
  "categories": { "move": "몸 움직이기", "hand": "손으로 하기", "tidy": "정리", "outside": "바깥", "rest": "쉬기" },
  "activities": [
    { "id": "t5-01", "time": 5, "title": "창문 열고 바깥 소리 3가지 찾기", "desc": "…", "category": "rest" }
  ]
}
```

| 필드 | 규칙 |
|---|---|
| `id` | `t{시간}-{두 자리 번호}`. **한 번 정하면 바꾸거나 다른 활동에 다시 쓰지 않는다** (오늘 뽑은 메뉴·최근 목록이 id로 저장됨) |
| `time` | `5`, `15`, `30` 중 하나. 다른 값이면 무시됨 |
| `title` | 한 줄, 카드 제목. 필수 |
| `desc` | 한 문장 설명 |
| `category` | `categories`의 키. 없으면 "딴짓"으로 표시 |

- 활동 추가: 맨 아래에 같은 형식으로 한 줄 추가. 시간대별 15~20개 유지
- 활동 빼기: 그 줄만 지우면 된다. 그 활동을 오늘 뽑아 둔 사람은 [뽑기 전]으로 돌아간다
- 작성 기준: 준비물 없이, 혼자, 안전하게, 한 문장으로 (기획서 기준)
- 형식이 틀린 항목은 조용히 빠진다. 남는 항목이 하나도 없으면 [불러오기 실패]가 된다

---

## 4. 저장소 (localStorage)

| 키 | 내용 | 언제 새로 시작하나 |
|---|---|---|
| `dopamine-today` | `{ date, changesLeft, picks: { 5: id, 15: id, 30: id } }` | 날짜(`YYYY-MM-DD`)가 바뀌면 |
| `dopamine-recent` | `{ 5: [id×3], 15: [...], 30: [...] }` 시간대별 최근 뽑은 3개 | 안 지움 (계속 덮어씀) |
| `dopamine-timer` | `{ id, title, desc, category, time, startAt, duration, isDone }` | 도장 찍기·그만하기 때 삭제 |
| `dopamine-stamps` | `{ weekStart, items: [{ date, id, title, time, category }] }` | 월요일(`weekStart`)이 바뀌면 |

- 모든 읽기·쓰기는 `store` 객체로만 한다. `try/catch`로 감싸져 있고, 저장소를 못 쓰는 환경(시크릿 모드 등)에서는 **메모리에만 보관**하고 `#storageNote` 안내를 띄운다
- 읽은 값은 형식을 확인하고, 틀리면 기본값으로 시작한다 (`ensureToday`, `ensureWeek`, `loadRecent`, `loadTimer`)
- 타이머와 도장 기록에는 활동 이름까지 복사해 둔다. 활동 데이터를 못 불러와도 타이머·도장판은 그려진다
- 새 키를 만들면 `dopamine-` 접두어를 쓰고, `privacy.html` 2번 표에도 추가한다

---

## 5. 규칙 로직

| 규칙 | 구현 |
|---|---|
| 첫 뽑기는 무료 | [오늘의 추천 뽑기]는 횟수를 안 씀 (`onDraw`) |
| 바꾸기 하루 3번 | `CHANGE_LIMIT = 3`. [다른 거]를 누를 때마다 `changesLeft - 1`. 0이면 버튼을 숨기고 `#limitNote` 표시. **세 시간대가 함께 쓴다** |
| 탭을 오가도 공짜 뽑기 없음 | 시간대마다 뽑은 메뉴를 그날 동안 `picks`에 유지 |
| 최근 3개 제외 | `RECENT_SIZE = 3`. 후보가 없으면 지금 메뉴만 빼고, 그래도 없으면 전체에서 뽑음 (`drawActivity`) |
| 도장 찍으면 새로 뽑기 | 도장을 찍은 시간대의 `picks`를 지움 → 같은 시간대에서 다시 무료로 뽑을 수 있음 |
| 날짜·주가 바뀜 | 동작할 때와 화면으로 돌아올 때(`visibilitychange`) `ensureToday` · `ensureWeek`로 확인 |

---

## 6. 타이머

- 시작할 때 `startAt = Date.now()`, `duration = 분 × 60000`을 **저장**한다
- 남은 시간 = `startAt + duration - Date.now()`. 화면을 끄거나 새로고침해도 정확하다
- `setInterval` 1초는 **화면 갱신용**일 뿐 시간을 세지 않는다. 타이머가 없거나 끝나면 멈춘다 (`syncTicker`)
- 진행 중에는 브라우저 탭 제목 앞에 `04:59 남음 · `이 붙고, 끝나면 `다 했어요! · `로 바뀐다
- 다른 탭에 있다가 돌아오면(`visibilitychange`) 바로 다시 계산한다
- [다 했어요, 도장 찍기]는 시간이 남아 있어도 바로 도장을 찍는다

---

## 7. `main.js` 구조

즉시 실행 함수 하나에 아래 순서로 들어 있다. 새 코드도 맞는 칸에 넣는다.

| 칸 | 내용 |
|---|---|
| 기본 요소 | 상수(`TIMES`, `CHANGE_LIMIT`, `RECENT_SIZE`, `DAY_NAMES`, `KEY`), 요소 모음 `el` |
| 저장소 | `store`, `readJSON`, `writeJSON` |
| 도우미 함수 | 날짜(`toDateKey`, `getMonday`, `addDays`), 형식(`formatClock`, `formatHour`) |
| 상태 | `state` 객체 하나 |
| 저장값 불러오기 | `ensureToday`, `ensureWeek`, `loadRecent`, `loadTimer` |
| 데이터 | `loadActivities`(fetch), `drawActivity`(뽑기) |
| 알림 | `say` — 화면 낭독기용 `#notice`에 결과 문장 쓰기 |
| 그리기 | `renderOrder`, `renderTimer`·`renderClock`, `renderBoard`, `renderAll` |
| 동작 | `selectTab`, `onDraw`, `onChange`, `onStart`, `onStamp`, `onQuit` |
| 이벤트 | 버튼·탭·`visibilitychange` 연결 |
| 시작 | 저장값 불러오기 → 처음 그리기 → 활동 데이터 불러오기 |

**고치는 순서는 항상 `state` 바꾸기 → 저장 → `render…()` 호출.** 화면 요소를 동작 함수 안에서 직접 고치지 않는다 (예외: 포커스 이동, 카드 회전 애니메이션 클래스).

---

## 8. HTML ↔ JS 연결

- JS는 **`id`와 `data-*`로만** 요소를 찾는다. 클래스는 모양 전용이라 이름을 바꿔도 JS가 깨지지 않는다
- 상태는 속성으로 표시하고, 모양은 CSS가 그 속성을 보고 정한다

| 속성 | 요소 | 의미 |
|---|---|---|
| `hidden` | 섹션·버튼·안내 | 보이기/숨기기 |
| `disabled` | `#drawBtn` | 불러오는 중 |
| `aria-selected`, `tabindex` | 시간 탭 | 선택된 탭 (선택 = 0, 나머지 = -1) |
| `data-flipped="true/false"` | `#ticket` | 카드 앞/뒷면 |
| `inert` + `aria-hidden` | `#ticketFront`, `#ticketBack` | 뒤집혀 안 보이는 면은 낭독·포커스에서 제외 |
| `aria-current="date"` | 도장판 칸 | 오늘 |
| `data-time` | 시간 탭 | 5 / 15 / 30 |
| `data-ad` | 광고 자리 | `ads.js`의 `slots` 키 |

주요 `id`: `drawBtn` · `startBtn` · `changeBtn` · `changeLeft` · `limitNote` / `ticket` · `ticketMeta` · `ticketTitle` · `ticketDesc` / `timer` · `timerLeft` · `timerProgress` · `timerEnd` · `timerDone` · `stampBtn` · `quitBtn` / `boardDays` · `boardList` / `loadError` · `retryBtn` · `storageNote` · `notice`

---

## 9. 접근성 구현

- **탭**: `role="tablist"` / `tab` / `tabpanel`. 방향키 ←→(끝에서 처음으로 이어짐), Home, End로 이동하고 바로 선택된다. 탭 하나가 패널 하나(`#orderPanel`)를 쓰고 `aria-labelledby`만 바꾼다
- **포커스 이동**: 동작 뒤 사용자가 다음에 볼 곳으로 옮긴다

| 동작 | 포커스 |
|---|---|
| 뽑기 | 카드 제목 `#ticketTitle` |
| 다른 거 | [다른 거] 그대로 (다 쓰면 카드 제목) |
| 이걸로 할게요 | 타이머 제목 `#timerTitle` |
| 도장 찍기 | 도장판 제목 `#boardTitle` |
| 그만하기 | [이걸로 할게요] |
| 다시 시도 성공 | [오늘의 추천 뽑기] |

  포커스만 받는 제목은 `tabindex="-1"`이고 포커스 테두리를 그리지 않는다
- **결과 알림**: 모든 동작은 `say()`로 `#notice`(`role="status"`)에 한 문장을 남긴다. 같은 문장도 다시 읽히도록 비웠다가 다음 프레임에 쓴다
- **타이머 숫자**는 `role="timer"`(낭독기가 매초 읽지 않음). 시작·끝만 `say()`로 알린다
- **움직임 줄이기**: 3D 뒤집기·회전·도장 애니메이션을 끄고 카드 면은 0.3초 페이드로 바뀐다 (`common.css`·`style.css`의 `prefers-reduced-motion` 블록)
- 외부 데이터(활동 이름 등)는 **`textContent`로만** 넣는다. `innerHTML` 금지

---

## 10. CSS

- 순서: `reset.css → common.css → style.css`
- 색은 `var(--color-*)` 토큰만. 다크 모드는 `common.css`의 `@media (prefers-color-scheme: dark)`에서 **토큰 값만** 바꾼다. 화면별 다크 보정은 만들지 않는다
- 이름은 BEM(`.블록__요소--변형`). 지금 블록: `header` `note` `intro` `section-title` `time-tabs` `order` `load-error` `ticket` `timer` `board` `ad` `footer` `policy`
- 기준점은 `768px` 하나만 쓰고 있다 (카드 높이·도장 크기). 본문은 가운데 한 열 (`.container` 최대 32rem → 36rem)
- 3D 뒤집기는 `.ticket`(perspective) → `.ticket__inner`(preserve-3d, 회전) → `.ticket__face`(겹치기 `grid-area: 1/1`, backface-visibility) 구조. 두 면 높이는 grid로 큰 쪽에 맞춰진다

---

## 11. 광고 (`js/ads.js`)

```js
const ADS = {
  client: '',          // 'ca-pub-…' 애드센스 게시자 ID
  domain: '',          // 실제 서비스 도메인. 이 주소에서만 광고가 켜짐
  slots: { bottom: '' } // 디스플레이 광고 단위 ID
};
```

- 세 값이 모두 차 있고 접속 주소가 `domain`일 때만 애드센스 스크립트를 불러오고 `[data-ad]` 자리를 보여 준다. 아니면 자리는 `hidden` 그대로
- 스크립트 주소에 `client`를 붙이지 않아 **자동 광고(하단 고정·전면)가 켜지지 않는다**. 애드센스 화면에서도 자동 광고를 꺼 둔다
- 루트 `ads.txt`의 게시자 ID도 함께 바꾼다
- 자리를 늘릴 때: HTML에 `<aside class="ad" data-ad="이름" aria-label="광고" hidden>…</aside>`를 추가하고 `slots`에 같은 이름을 넣는다. 뽑기·타이머 버튼 근처에는 두지 않는다

---

## 12. 확인 방법

- `fetch`를 쓰기 때문에 **파일을 더블클릭해서 열면 [불러오기 실패]가 뜬다.** 저장소 루트에서 로컬 서버로 연다

```bash
python3 -m http.server 8000
# http://localhost:8000/projects/dopamine-menu/
```

- 처음 상태로 되돌리기: 개발자 도구 → Application → Local Storage에서 `dopamine-` 키 4개 삭제
- 타이머 끝을 빨리 보기: `dopamine-timer`의 `startAt`을 숫자만큼 줄이고 새로고침 (예: 300000 = 5분 전)
- 바꾸기 제한 보기: [다른 거] 3번 → 버튼이 사라지고 안내가 나오는지
- 다크 모드: 개발자 도구 → Rendering → `prefers-color-scheme: dark`
- 움직임 줄이기: 같은 곳의 `prefers-reduced-motion: reduce`

**올리기 전 체크**
- [ ] 375px · 768px · 1280px에서 가로 스크롤 없음
- [ ] 밝은 / 어두운 화면 모두 글자 대비 7:1
- [ ] 키보드만으로 탭 이동 → 뽑기 → 시작 → 도장까지 가능
- [ ] 새로고침해도 뽑은 메뉴·남은 횟수·타이머·도장 유지
- [ ] `activities.json`을 못 불러올 때 [다시 시도]가 동작
- [ ] 콘솔 에러 없음

---

## 13. 하지 않는 것

- 활동 `id` 바꾸기·재사용
- JS에서 클래스 이름으로 요소 찾기
- `innerHTML`로 데이터 넣기, `alert` · `confirm` · `prompt`
- `setTimeout`으로 순서 맞추기 (애니메이션은 `animationend`, 시간은 `Date.now()` 차이로)
- 저장소를 `try/catch` 없이 직접 쓰기
- 화면 안에 다크 모드·글자 크기 전환 버튼 추가 (기기 설정을 따름)

---

## 검색 · AI 검색

공통 기준은 `docs/CODING_GUIDE.md` 8-5. 이 사이트에서 함께 고쳐야 하는 곳:

- `index.html` `<head>`: `canonical`, `robots`, 설명, 공유 미리보기(OG), JSON-LD 2개(`WebApplication`, `FAQPage`)
- 도장판 아래 **자주 묻는 질문**(`<details>`)과 JSON-LD `FAQPage`는 문구가 똑같아야 한다
- 활동 수(지금 51가지)·하루 바꾸기 횟수(3번)·광고 상태가 바뀌면 FAQ · JSON-LD · `llms.txt`를 같이 고친다
- 자체 도메인으로 옮길 때(BACKEND.md 3장) `canonical` · `og:url` · `og:image` · JSON-LD 주소 · `sitemap.xml` · `llms.txt`를 한꺼번에 고친다
