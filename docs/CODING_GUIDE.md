# 나의 코딩 가이드

웹 퍼블리싱 작업 전체(HTML · CSS · JavaScript · 작업 방식)에 적용하는 나의 기본 규칙입니다.
CSS 세부 규칙은 [`CSS_GUIDE.md`](CSS_GUIDE.md)에 따로 정리되어 있습니다.

- **적용 범위:** 이 폴더의 모든 사이트, 그리고 앞으로 만들 개인 프로젝트
- **우선순위:** 프로젝트별 `CLAUDE.md` > 이 가이드 > 일반적인 관례

---

## 0. 기본 원칙

> **"노약자도 쉽게 쓸 수 있는 UI/UX"**
> 모든 결정은 고령자와 시력·운동 능력이 낮은 사용자를 기준으로 한다. 화려함보다 명확함과 편안함이 먼저다.

1. **한 화면에 한 가지 목적.** 정보는 적게, 여백은 넉넉하게 둔다.
2. **보이는 것이 곧 기능.** 누를 수 있는 것은 누를 수 있게 생겨야 하고, 모든 버튼에는 아이콘과 글자가 함께 있다.
3. **색만으로 말하지 않는다.** 상태는 색 + 아이콘 + 글자로 같이 알린다.
4. **즉시 알려 준다.** 누르거나 제출하면 결과를 바로 보여 준다.
5. **되돌릴 수 없는 일은 한 번 더 묻는다.**
6. **표준을 먼저 쓴다.** 직접 만들기 전에 HTML 기본 요소(`button`, `details`, `dialog`, `form`)로 되는지 확인한다.
7. **프레임워크 없이.** HTML5 / CSS3 / Vanilla JS. 외부 라이브러리는 꼭 필요할 때만, CDN 1~2개 이내로 쓴다.

---

## 1. 폴더와 파일

### 1-1. 사이트 하나의 구조

```
사이트이름/
├─ index.html
├─ (추가 페이지).html      예: privacy.html
├─ css/
│  ├─ reset.css           브라우저 초기화
│  ├─ common.css          토큰 · 기본값 · 공통 부품
│  └─ style.css           화면별 스타일
├─ js/
│  └─ main.js
└─ images/
```

- 루트에는 포트폴리오 메인 사이트를 둔다. 개인 작업 사이트는 `projects/사이트이름/`에 두고, 폴더마다 위 구조를 똑같이 둔다.
- 작업 규칙 문서(`CODING_GUIDE.md`, `CSS_GUIDE.md`)와 가이드 뷰어(`guide/`)는 `docs/`에 둔다. `CLAUDE.md`만 루트에 둔다.

### 1-2. 파일 이름

- **기본 형식:** 영어 소문자 + 하이픈(kebab-case)으로 쓴다. 예: `garden-guide`, `privacy.html`, `green-onion.svg`
- **이미지:** 내용을 나타내는 이름을 쓴다. `img01.png` ✕ → `lettuce.svg` ○
- **쓰지 않는 파일은 바로 지운다.** "혹시 몰라" 남겨 두지 않는다.

### 1-3. 공통 형식

- **들여쓰기와 인코딩:** 들여쓰기 2칸(스페이스), 인코딩 UTF-8, 파일 끝에 빈 줄 하나
- **따옴표:** HTML 속성은 큰따옴표(`"`), JS 문자열은 작은따옴표(`'`)
- **주석:** 한국어로, 섹션 구분용으로만 짧게 쓴다. 코드가 무엇을 하는지는 이름으로 드러낸다.

---

## 2. HTML

### 2-1. 문서 기본 틀

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="이 페이지가 무엇인지 한두 문장으로">
  <meta name="theme-color" content="#285232">
  <title>사이트 이름 | 페이지 설명</title>
  <link rel="icon" href="images/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="css/reset.css">
  <link rel="stylesheet" href="css/common.css">
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <a class="skip-link" href="#main">본문 바로가기</a>
  <header>…</header>
  <main id="main" tabindex="-1">…</main>
  <footer>…</footer>
  <script src="js/main.js"></script>
</body>
</html>
```

- **필수 요소:** `lang="ko"`, `description`, `title`을 빠뜨리지 않는다 (SEO와 화면 낭독기 모두에 필요).
- **스크립트 위치:** `<body>` 맨 끝에 둔다.

### 2-2. 구조와 제목

- **영역 태그:** `header`, `nav`, `main`, `section`, `article`, `aside`, `footer`로 구조를 만든다. `div`는 묶을 의미가 없을 때만 쓴다.
- **h1:** 페이지당 한 개만 쓴다. 다른 페이지에서는 사이트 이름을 `<p>`로 바꾸고 그 페이지 제목을 `h1`으로 한다.
- **제목 순서:** `h1 → h2 → h3`을 건너뛰지 않는다. 글자 크기 때문에 제목 단계를 고르지 않는다.
- **이름 붙이기:** `section`과 `article`은 `aria-labelledby`로 제목과 연결한다.

```html
<section class="panel" id="guide" aria-labelledby="guideTitle">
  <h2 class="panel__title" id="guideTitle">식물 키우기 안내</h2>
```

- **`nav`:** 여러 개면 `aria-label`로 구분한다 (예: "주요 메뉴", "사이트 정보").
- **현재 위치:** 현재 페이지·현재 메뉴에는 `aria-current="page"`를 단다.

### 2-3. 버튼과 링크

| 하는 일 | 태그 |
|---|---|
| 다른 페이지·위치로 이동 | `<a href="…">` |
| 화면 안에서 동작 (열기, 저장, 전환) | `<button type="button">` |
| 폼 제출 | `<button type="submit">` |

- **기본 형식:** `button`에는 항상 `type`을 쓴다. 아이콘을 앞에, 글자를 뒤에 둔다. 아이콘은 `aria-hidden="true"`로 숨긴다.

```html
<button type="button" class="btn">
  <svg class="ico" aria-hidden="true" focusable="false"><use href="#i-calendar"></use></svg>
  날짜 고르기
</button>
```

- **켜고 끄는 버튼:** `aria-pressed`를 쓴다. 다른 영역을 여닫는 버튼은 `aria-expanded`와 `aria-controls`를 쓴다.
- **새 창 링크:** `target="_blank" rel="noopener noreferrer"`를 쓰고, 화면 낭독기용으로 `<span class="sr-only"> (새 창으로 열림)</span>`을 붙인다.
- **금지:** `<div onclick>`, `<a href="#">` 버튼, 인라인 이벤트(`onclick="…"`)

### 2-4. 이미지와 아이콘

- **`alt`는 항상 쓴다.**
  - 내용을 전하는 그림: 무엇인지 설명한다 (`alt="상추 화분 그림"`).
  - 옆에 같은 글자가 있는 장식용 그림: `alt=""`로 비운다.
- **크기 지정:** `width`와 `height`를 적어서 그림이 늦게 떠도 화면이 밀리지 않게 한다.
- **UI 아이콘:** 페이지 위쪽 SVG 아이콘 모음(`<symbol id="i-이름">`)에 넣고 `<use>`로 불러 쓴다. 색은 `currentColor`로 글자색을 따라가게 한다.
- **그림 형식:** 아이콘과 일러스트는 SVG로 만든다. 사진만 JPG나 WebP로 쓴다.

### 2-5. 폼

- **입력칸:** 모든 입력칸은 `<label for>`로 연결한다. placeholder를 label 대신 쓰지 않는다.
- **오류 처리:** 브라우저 기본 오류창 대신 `novalidate`를 쓰고, 오류는 직접 보여 준다.
  - 입력칸에 `aria-invalid="true"`, `aria-describedby="오류문구id"`
  - 오류 문구는 **원인과 해결 방법**을 쉬운 말로 쓴다. 예: "오늘 이후 날짜는 기록할 수 없어요. 오늘이나 지난 날짜를 골라 주세요."
  - 오류가 나면 그 입력칸으로 포커스를 옮긴다.
- **항목 수:** 입력 항목은 최소로 둔다. 기본값을 미리 채워 둔다 (예: 날짜 = 오늘).

### 2-6. 알림과 숨김

- **알림:** 결과 알림은 `role="status"`(또는 `aria-live="polite"`) 영역에 글자를 넣어 화면 낭독기도 읽게 한다.
- **숨김:**
  - 화면에서도, 낭독기에서도 숨김: `hidden` 속성
  - 화면에서만 숨김: `.sr-only`
- **여닫기:** 펼침·접힘은 가능하면 `<details><summary>`를 쓴다. JS 없이도 동작한다.

### 2-7. 금지 목록

- 인라인 `style=""`, 인라인 `onclick=""`
- `<br>`로 간격 만들기 (줄바꿈이 의미일 때만 사용)
- `<table>`로 배치하기 (표 데이터에만 사용)
- 자동 재생, 자동 슬라이드, 깜빡임
- `alert()`, `confirm()`, `prompt()` (화면 안에 확인 단계를 직접 만든다)

---

## 3. CSS (요약)

자세한 규칙은 [`CSS_GUIDE.md`](CSS_GUIDE.md)를 따른다. 핵심만 정리하면 다음과 같다.

| 항목 | 규칙 |
|---|---|
| 파일 | `reset.css → common.css → style.css` 순서. `style.css`는 화면 순서대로 |
| 토큰 | 색·글꼴·크기는 `:root` 변수. 색 토큰 5개 이내, 색상 코드는 `:root`에서만 |
| 이름 | BEM (`.블록__요소--변형`). 상태는 `aria-pressed`, `aria-current`, `aria-expanded` 같은 속성으로 |
| 선택자 | 클래스 하나가 기본. 태그·id 선택자, `!important` 금지 |
| 단위 | 글자 `rem`, 여백 `clamp()`, 레이아웃 `%`·`fr`. px은 정해진 예외만 |
| 반응형 | 모바일 우선, 기준점 `768px` / `1024px` |
| 접근성 | 굵은 포커스 테두리, 터치 영역 `3.5rem` 이상, `prefers-reduced-motion` 지원 |
| 보기 설정 | 글자 크기 3단계(`html[data-size]`), 고대비 모드(`html[data-contrast="high"]`) |

---

## 4. JavaScript

### 4-1. 파일 구조

`main.js` 하나를 즉시 실행 함수로 감싸고, 아래 순서로 쓴다.

```js
(() => {
  'use strict';

  /* 기본 요소 */        // 자주 쓰는 요소 모음(el), 상수
  /* 저장소 */           // localStorage 읽기·쓰기
  /* 데이터 */           // 화면에 뿌릴 데이터
  /* 도우미 함수 */       // 날짜, 형식 변환 등 순수 함수
  /* 상태 */            // state 객체 하나
  /* 그리기 */          // render 함수들
  /* 이벤트 */          // addEventListener
  /* 시작 */            // 저장값 불러오기 → 처음 그리기
})();
```

- **전역 변수 금지:** 모든 코드는 즉시 실행 함수 안에 둔다.
- **공통 파일 하나:** 여러 페이지가 같은 `main.js`를 쓰면, 공통 기능(글자 크기, 고대비)을 먼저 실행한다. 그 페이지에 없는 요소가 나오면 `if (!el.xxx) return;`으로 멈춘다.

### 4-2. 이름 짓기

| 대상 | 형식 | 예 |
|---|---|---|
| 변수·함수 | camelCase | `renderMonth`, `findMine` |
| 변하지 않는 데이터 | UPPER_SNAKE | `SIZE_LABELS`, `PANELS` |
| 함수 | 동사로 시작 | `showPanel`, `addRecord`, `getStatus` |
| 참·거짓 값 | `is` / `has` / `can` | `isOpen`, `hasHistory` |
| 저장소 키 | `사이트-항목` | `garden-mine`, `garden-size` |

### 4-3. 문법

- **변수 선언:** `const`를 기본으로 쓰고, 값이 바뀔 때만 `let`을 쓴다. `var`는 쓰지 않는다.
- **비교:** `===`, `!==`만 쓴다.
- **함수 형태:** 짧은 함수는 화살표 함수로 쓴다. 이름이 필요한 함수는 `function`으로 선언한다.
- **문자열 이어 붙이기:** 템플릿 문자열(`` `${}` ``)이나 `+` 중 한 파일 안에서는 하나로 통일한다.
- **세미콜론:** 항상 붙인다.

### 4-4. HTML과 연결하기

- **JS가 찾는 것은 `id`와 `data-*`만.** 클래스는 모양을 위한 것이라 JS가 의존하지 않는다.
  - 예: `data-act="water"`, `data-id="lettuce"`, `data-filter="veg"`
- **이벤트 위임:** 목록처럼 버튼이 많으면 부모 하나에 이벤트를 단다.

```js
el.myList.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  // btn.dataset.act 에 따라 처리
});
```

- **상태는 속성으로:** `hidden`, `disabled`, `aria-pressed`, `aria-expanded`, `aria-current`를 바꾼다. 화면 표시는 CSS가 그 속성을 보고 처리한다.
- **화면 그리기:** `state`를 바꾼 뒤 `render()`를 호출해서 그린다. 여기저기서 화면을 직접 고치지 않는다.

### 4-5. 사용자에게 알리기와 포커스

- 동작이 끝나면 알림 영역(`role="status"`)에 결과를 쓴다 (예: "상추에 물 준 기록을 남겼어요.").
- 화면을 다시 그린 뒤에는 **사용자가 보던 버튼으로 포커스를 돌려준다.**
- 메뉴로 화면을 바꾸면 새 화면의 제목(`tabindex="-1"`)으로 포커스를 옮긴다.

### 4-6. 저장소와 오류 처리

- **localStorage:** 반드시 `try/catch`로 감싼다. 시크릿 모드나 차단 환경에서는 저장소가 없을 수 있다.

```js
const store = {
  get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* 무시 */ } }
};
```

- **불러온 데이터 확인:** 형식이 맞는지 확인하고, 틀리면 기본값으로 시작한다.
- **외부에서 온 글자:** 사용자가 입력한 글이나 외부 데이터는 `innerHTML`에 넣지 않는다. `textContent`를 쓴다.
- **날짜:** 날짜는 `YYYY-MM-DD` 문자열로 저장한다. 계산은 그 기기의 시간대(로컬)로 한다.

### 4-7. 금지 목록

- `alert`, `confirm`, `prompt`
- `setTimeout`으로 순서 맞추기 (이벤트나 함수 호출 순서로 해결)
- 정리 안 된 `console.log` 남기기

---

## 5. 접근성 · 시니어 UX 기준

| 영역 | 기준 |
|---|---|
| 글자 | 본문 18px 이상(`1rem`), 버튼·중요 안내 20px 이상. 행간 1.6 이상, 굵기 400 이상 |
| 글꼴 | Pretendard 또는 Noto Sans KR |
| 대비 | 글자 대비 7:1 목표, 최소 4.5:1 |
| 터치 | 누르는 곳 최소 48×48px(`3.5rem`), 간격 8px 이상 |
| 조작 | 호버·더블클릭·드래그·길게 누르기에 기능을 숨기지 않는다 |
| 키보드 | 키보드만으로 모든 기능 사용 가능. 포커스 테두리 3px 이상 |
| 메뉴 | 5~6개 이하, 쉬운 우리말, 아이콘 + 글자, 현재 위치 표시, "처음으로" 버튼 항상 노출 |
| 보기 설정 | 글자 크기 조절(보통 / 크게 / 아주 크게), 고대비 보기 |
| 확대 | 브라우저 200% 확대에서도 깨지지 않음 |
| 움직임 | 자동 재생·깜빡임 금지, `prefers-reduced-motion` 존중 |
| 문구 | 존댓말 + 쉬운 말. 전문 용어·영어 약어는 피한다. 버튼은 무엇이 일어나는지 쓴다 ("오늘 물 줬어요", "네, 뺄게요") |

---

## 6. 작업 방식

### 6-1. 작업 순서

1. **정하기:** 사이트 한 개의 목적과 대상을 한 줄로 쓴다.
2. **구조 먼저:** HTML로 내용과 구조를 만든다. CSS가 없어도 읽을 수 있어야 한다.
3. **토큰 정하기:** 색 5개, 글꼴, 크기 토큰을 정하고 대비를 확인한다.
4. **꾸미기:** 모바일(375px)부터 CSS를 쓰고, 768px / 1024px로 넓힌다.
5. **기능 붙이기:** JS를 붙인다. JS 없이도 핵심 내용은 보이게 둔다.
6. **확인:** 아래 완료 체크리스트로 점검한다.

### 6-2. 수정할 때

- 기존 파일과 스타일을 먼저 확인하고 톤을 맞춘다.
- 요청받은 것만 고치고, 관련 없는 파일은 건드리지 않는다.
- 끝나면 바꾼 파일과 내용을 2~3줄로 정리한다.

### 6-3. Git (도입할 때)

- **브랜치:** `main`은 항상 동작하는 상태로 둔다. 작업은 `feature/기능-이름` 브랜치에서 한다.
- **커밋:** 하나의 커밋에는 하나의 변경만 담는다. 메시지는 `종류: 한국어 요약` 형식으로 쓴다.

| 종류 | 언제 |
|---|---|
| `feat` | 기능 추가 |
| `fix` | 버그 수정 |
| `style` | 화면 모양 변경 (기능 변화 없음) |
| `refactor` | 동작은 그대로, 코드 정리 |
| `docs` | 문서 수정 |
| `chore` | 설정, 파일 정리 |

```
feat: 식물 고르기를 종류별로 묶음
fix: 모바일에서 달 이름이 세 줄로 깨지는 문제 수정
refactor: 태그 선택자를 BEM 클래스로 변경
```

- **올리면 안 되는 것:** 비밀번호, API 키, 개인정보. `.gitignore`로 막는다.

---

## 7. 완료 체크리스트

**화면**
- [ ] 모바일(375px) / 태블릿(768px) / PC(1280px)에서 가로 스크롤이 없다
- [ ] 글자 "아주 크게"와 브라우저 200% 확대에서 깨지지 않는다
- [ ] 고대비 모드에서 모든 글자와 아이콘이 보인다

**접근성**
- [ ] 키보드(Tab, Enter, Space)만으로 모든 기능을 쓸 수 있다
- [ ] 모든 버튼에 아이콘 + 글자가 있고, 터치 영역이 48px 이상이다
- [ ] 글자 대비 7:1 (최소 4.5:1)
- [ ] 이미지 `alt`, 폼 `label`, 제목 순서, h1 한 개

**코드**
- [ ] 콘솔 에러가 없다
- [ ] 인라인 스타일·인라인 이벤트·`!important`가 없다 (허용 예외 제외)
- [ ] 쓰지 않는 파일·클래스·코드가 없다

**품질**
- [ ] Lighthouse 접근성 95점 이상, SEO 90점 이상
- [ ] Chrome, Safari, Edge에서 확인했다
