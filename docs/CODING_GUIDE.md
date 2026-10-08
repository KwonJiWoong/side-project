# 나의 코딩 가이드

웹 퍼블리싱 작업 전체(HTML · CSS · JavaScript · 작업 방식)에 적용하는 나의 기본 규칙입니다.
CSS 세부 규칙은 [`CSS_GUIDE.md`](CSS_GUIDE.md)에 따로 정리되어 있습니다.

- **적용 범위:** 이 폴더의 모든 사이트, 그리고 앞으로 만들 개인 프로젝트
- **우선순위:** 프로젝트별 `CLAUDE.md` > 이 가이드 > 일반적인 관례
- **기준 코드:** 포트폴리오 메인과 `projects/`의 사이트 4개(텃밭 수첩 · 오늘 뭐 먹지 · 밥풀이 · 오늘의 정치 소식)에서 실제로 쓰는 방식을 정리했다. 새 사이트는 가장 비슷한 사이트를 참고해서 시작한다.

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
7. **프레임워크 없이.** HTML5 / CSS3 / Vanilla JS. 외부 라이브러리는 꼭 필요할 때만, CDN 1~2개 이내로 쓴다. 지금은 글꼴 CDN(Pretendard, 필요하면 꾸밈 글꼴 1개)만 쓴다.

---

## 1. 폴더와 파일

### 1-1. 저장소 전체

```
side-project/                    GitHub Pages로 공개 (main 브랜치)
├─ index.html · css/ · js/ · images/   포트폴리오 메인
├─ projects/
│  ├─ garden-guide/              우리집 텃밭 수첩 (+ privacy.html)
│  ├─ menu/                      오늘 뭐 먹지?
│  ├─ menu-cute/                 밥풀이의 오늘 뭐 먹지?
│  └─ politics-news/             오늘의 정치 소식 (+ data/, scraper/)
├─ docs/                         작업 규칙 문서와 가이드 뷰어
├─ .github/workflows/            자동 실행 (정치 뉴스 수집)
├─ .nojekyll
└─ CLAUDE.md
```

### 1-2. 사이트 하나의 구조

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

- 루트에는 포트폴리오 메인 사이트를 둔다. 개인 작업 사이트는 `projects/사이트이름/`에 두고, 폴더마다 위 구조를 똑같이 둔다. 사이트끼리 파일을 나눠 쓰지 않는다 (`reset.css`도 폴더마다 따로).
- 새 사이트를 만들면 메인 `index.html`의 "직접 만든 사이트"에 카드를 추가한다 (번호 · 분야 · 연도, 설명, 태그 3개, "사이트 보기" 버튼).
- 모든 사이트에 `images/favicon.svg`를 둔다.
- 바깥에서 모아 오는 데이터가 있으면 `data/`(화면이 읽는 JSON)와 `scraper/`(모으는 스크립트와 `config.json`)를 더 둔다. 자세한 규칙은 아래 5장.
- 작업 규칙 문서(`CODING_GUIDE.md`, `CSS_GUIDE.md`)와 가이드 뷰어(`guide/`)는 `docs/`에 둔다. `CLAUDE.md`만 루트에 둔다.

### 1-3. 파일 이름

- **기본 형식:** 영어 소문자 + 하이픈(kebab-case)으로 쓴다. 예: `garden-guide`, `politics-news`, `privacy.html`
- **이미지:** 내용을 나타내는 이름을 쓴다. `img01.png` ✕ → `lettuce.svg` ○. 식물·음식 그림은 데이터의 `id`와 같은 이름으로 짓는다 (`data-id="lettuce"` → `lettuce.svg`).
- **쓰지 않는 파일은 바로 지운다.** "혹시 몰라" 남겨 두지 않는다.

### 1-4. 공통 형식

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
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
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
- **`theme-color`:** 그 사이트의 대표 색(헤더 배경색이나 주요 색)으로 맞춘다.
- **글꼴:** Pretendard CDN을 기본으로 넣는다. 꾸밈 글꼴이 필요하면 제목용으로 하나만 더한다 (예: 밥풀이 사이트의 Jua).
- **만든 사람 표시:** `<meta name="author" content="권지웅">`을 넣고, 푸터에 `© 2026 권지웅`과 포트폴리오로 돌아가는 링크를 둔다.
- **스크립트 위치:** `<body>` 맨 끝에 둔다.

### 2-2. 구조와 제목

- **영역 태그:** `header`, `nav`, `main`, `section`, `article`, `aside`, `footer`로 구조를 만든다. `div`는 묶을 의미가 없을 때만 쓴다.
- **h1:** 페이지당 한 개만 쓴다.
  - 포트폴리오 메인: 첫 화면의 큰 문장이 `h1`이고, 메뉴의 이름은 `<p class="gnb__brand">`로 쓴다.
  - 한 페이지짜리 작업 사이트: 헤더의 사이트 이름이 `h1`이다. `id="siteTitle" tabindex="-1"`을 달아 "처음으로" 버튼의 포커스 도착점으로 쓴다.
  - 하위 페이지(예: `privacy.html`): 헤더의 사이트 이름을 `<p class="header__title">`로 바꾸고 그 페이지 제목을 `h1`으로 한다.
- **제목 순서:** `h1 → h2 → h3`을 건너뛰지 않는다. 글자 크기 때문에 제목 단계를 고르지 않는다.
- **이름 붙이기:** `section`과 `article`은 `aria-labelledby`로 제목과 연결한다. 화면에 제목이 필요 없는 영역도 `<h2 class="sr-only">`로 제목을 둔다.

```html
<section class="panel" id="guide" aria-labelledby="guideTitle">
  <h2 class="panel__title" id="guideTitle">식물 키우기 안내</h2>
```

- **`nav`:** 여러 개면 `aria-label`로 구분한다 (예: "주요 메뉴", "사이트 정보", "보기 고르기").
- **현재 위치:** 현재 페이지·현재 메뉴에는 `aria-current="page"`, 목록 안에서 지금 보고 있는 항목에는 `aria-current="true"`를 단다.
- **보기 설정 묶음:** 글자 크기·고대비 버튼은 한곳에 묶는다.
  - 작업 사이트: 헤더 안 `<div class="tools" role="group" aria-label="보기 설정">`
  - 포트폴리오 메인: 맨 위 `<aside class="tools" aria-label="보기 설정">`
- **고르기 버튼 묶음:** 여러 개 중 하나를 고르는 버튼(끼니, 언론사, 식물 종류)은 `role="group"`과 `aria-label`로 묶고, 고른 버튼에 `aria-pressed="true"`를 단다.
- **카드 안 정보:** "이름: 값" 형태는 `<dl>` / `<dt>` / `<dd>`로 쓴다 (예: 텃밭 수첩의 "마지막 물 준 날", 메인의 경력 숫자).

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

- **짧은 글자 버튼:** "가 / 가+"처럼 글자가 짧으면 뜻을 `<span class="sr-only"> 글자 크게</span>`로 보충한다.
- **같은 글자 버튼이 여러 개:** "사이트 보기"처럼 같은 버튼이 반복되면 `<span class="sr-only"> - 사이트 이름</span>`으로 구분한다.
- **켜고 끄는 버튼:** `aria-pressed`를 쓴다. 다른 영역을 여닫는 버튼은 `aria-expanded`와 `aria-controls`를 쓴다.
- **새 창 링크:** `target="_blank" rel="noopener noreferrer"`를 쓰고, 화면 낭독기용으로 `<span class="sr-only"> (새 창으로 열림)</span>`을 붙인다.
- **금지:** `<div onclick>`, `<a href="#">` 버튼, 인라인 이벤트(`onclick="…"`)

### 2-4. 이미지와 아이콘

- **`alt`는 항상 쓴다.**
  - 내용을 전하는 그림: 무엇인지 설명한다 (`alt="상추 화분 그림"`).
  - 옆에 같은 글자가 있는 장식용 그림: `alt=""`로 비운다.
- **크기 지정:** `width`와 `height`를 적어서 그림이 늦게 떠도 화면이 밀리지 않게 한다.
- **UI 아이콘:** 사이트 성격에 따라 둘 중 하나로 통일한다.
  - **SVG 아이콘 모음** (메인, 텃밭 수첩, 정치 소식): `<body>` 바로 아래 숨긴 `<svg aria-hidden="true">`에 `<symbol id="i-이름">`을 모으고 `<use href="#i-이름">`으로 쓴다. 색은 `currentColor`.
  - **이모지** (메뉴 추천 두 사이트): `<span aria-hidden="true">🍚</span>`처럼 감싸서 낭독기가 읽지 않게 한다.
- **그림 SVG(캐릭터 등):** HTML 안에 직접 넣을 때는 `role="img"`과 `<title id>` + `aria-labelledby`로 설명한다. 부분 모양은 BEM 클래스(`.mascot__eyes`)로 꾸민다.
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
- **꼭 확인해야 하는 결과:** 복사 완료, 저장 실패처럼 사용자가 놓치면 안 되는 결과는 공통 알림창(아래 2-8)으로 보여 준다.
- **숨김:**
  - 화면에서도, 낭독기에서도 숨김: `hidden` 속성
  - 화면에서만 숨김: `.sr-only`
- **여닫기:** 펼침·접힘은 가능하면 `<details><summary>`를 쓴다. JS 없이도 동작한다.

### 2-7. 금지 목록

- 인라인 `style=""`, 인라인 `onclick=""`
- `<br>`로 간격 만들기 (줄바꿈이 의미일 때만 사용)
- `<table>`로 배치하기 (표 데이터에만 사용)
- 자동 재생, 자동 슬라이드, 깜빡임
- `alert()`, `confirm()`, `prompt()` (대신 공통 알림창을 쓴다. 아래 2-8)

### 2-8. 공통 알림창

브라우저 기본 `alert()` 대신 쓰는 알림창이다. 페이지마다 **하나만** 두고, 어디서든 JS의 `showAlert()`로 내용을 바꿔 연다.

- **태그:** `<dialog>`를 쓴다. 열리면 뒤 화면을 누를 수 없고, 포커스가 [확인] 버튼으로 가며, `Esc`로도 닫힌다.
- **위치:** `</body>` 바로 위, `<script>` 앞에 둔다.
- **종류:** `data-type`으로 구분하고, 색만이 아니라 **아이콘 + 제목 글자**가 함께 바뀐다.

| `type` | 아이콘 | 기본 제목 | 쓰는 때 |
|---|---|---|---|
| `success` | `#i-check` | 완료했어요 | 복사·저장이 끝났을 때 |
| `error` | `#i-alert` | 다시 확인해 주세요 | 실패했거나 입력이 잘못됐을 때 |
| `info` | `#i-info` | 알려 드려요 | 그 밖의 안내 |

```html
<!-- 공통 알림창 (showAlert로 엶) -->
<dialog class="alert" id="alertBox" data-type="info" aria-labelledby="alertTitle" aria-describedby="alertMessage">
  <div class="alert__body">
    <div class="alert__head">
      <svg class="ico alert__ico" aria-hidden="true" focusable="false"><use id="alertIcon" href="#i-info"></use></svg>
      <h2 class="alert__title" id="alertTitle">알려 드려요</h2>
    </div>
    <p class="alert__message" id="alertMessage"></p>
    <form class="alert__actions" method="dialog">
      <button type="submit" class="btn btn--primary btn--block" id="alertOk"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-check"></use></svg> 확인</button>
    </form>
  </div>
</dialog>
```

- **문구:** 제목은 결과를 짧게("복사했어요"), 본문은 **다음에 할 일**까지 쉬운 말로 쓴다 ("메일 쓰는 곳에 붙여 넣어 주세요.").
- **하지 않는 것:** 저절로 사라지게 만들지 않는다 (읽기 느린 사용자가 놓친다). 바깥을 눌러 닫히게 하지 않는다 (실수로 닫힌다).
- **되돌릴 수 없는 동작의 확인 단계**는 이 알림창이 아니라 화면 안의 `.confirm` 블록으로 만든다.

---

## 3. CSS (요약)

자세한 규칙은 [`CSS_GUIDE.md`](CSS_GUIDE.md)를 따른다. 핵심만 정리하면 다음과 같다.

| 항목 | 규칙 |
|---|---|
| 파일 | `reset.css → common.css → style.css` 순서. `style.css`는 화면 순서대로 |
| 토큰 | 색·글꼴·크기는 `:root` 변수. 새 사이트는 색 토큰 5개(바탕·표면·글자·주요·강조)로 시작한다. 색상 코드는 `:root`(와 고대비 덮어쓰기)에서만 |
| 이름 | BEM (`.블록__요소--변형`). 상태는 `aria-pressed`, `aria-current`, `aria-expanded` 같은 속성으로 |
| 선택자 | 클래스 하나가 기본. 태그·id 선택자, `!important` 금지 (예외: `[hidden]`, `prefers-reduced-motion`) |
| 단위 | 글자 `rem`, 여백 `clamp()`, 레이아웃 `%`·`fr`. px은 정해진 예외만 |
| 반응형 | 모바일 우선, 기준점 `768px` / `1024px` |
| 접근성 | 굵은 포커스 테두리, 터치 영역 `3.5rem` 이상, `prefers-reduced-motion` 지원 |
| 보기 설정 | 글자 크기 3단계(`html[data-size]`), 고대비 모드(`html[data-contrast="high"]`) |

---

## 4. JavaScript

### 4-1. 파일 구조

`main.js` 하나를 즉시 실행 함수로 감싸고, 아래 순서로 쓴다. 맨 위 한 줄 주석에 사이트 이름과 하는 일을 쓴다. 섹션 주석(`/* 이름 */`)은 그 사이트 기능에 맞게 한국어로 붙인다.

```js
// 오늘의 정치 소식 - 기사 불러오기 / 언론사·인물별 보기 / 보기 설정
(() => {
  'use strict';

  /* 기본 요소 */        // root, $, 상수(SIZE_LABELS 등), el 모음
  /* 저장소 */           // store.get / store.set
  /* 상태 */            // state 객체 하나 (저장값을 확인해서 시작값으로)
  /* 데이터 */           // 고정 데이터 (HTML의 data-*에서 읽기도 함)
  /* 알림 */            // say(), showAlert()
  /* 도우미 */          // 날짜·형식 변환 등 순수 함수
  /* 그리기 */          // render 함수들
  /* 이벤트 */          // addEventListener (기능마다 섹션 하나)
  /* 시작 */            // 처음 그리기, 데이터 불러오기
})();
```

- **요소 찾기:** `const $ = (id) => document.getElementById(id);`를 두고 `el` 객체에 한 번에 모은다.

```js
const el = {
  title: $('siteTitle'),
  sizeText: $('sizeText'),
  contrast: $('contrastBtn'),
  notice: $('notice')
};
```

- **전역 변수 금지:** 모든 코드는 즉시 실행 함수 안에 둔다.
- **공통 파일 하나:** 여러 페이지가 같은 `main.js`를 쓰면, 공통 기능(글자 크기, 고대비)을 먼저 실행한다. 그 페이지에 없는 요소가 나오면 `if (!el.xxx) return;`으로 멈춘다 (예: 텃밭 수첩 `/* 텃밭 기능이 없는 페이지는 여기까지 */`).

### 4-2. 이름 짓기

| 대상 | 형식 | 예 |
|---|---|---|
| 변수·함수 | camelCase | `renderMonth`, `findMine` |
| 변하지 않는 데이터 | UPPER_SNAKE | `SIZE_LABELS`, `PANELS` |
| 함수 | 동사로 시작 | `showPanel`, `addRecord`, `getStatus` |
| 참·거짓 값 | `is` / `has` / `can` | `isOpen`, `isContrast`, `hasHistory` |
| 저장소 키 | `사이트-항목` | `portfolio-size`, `garden-mine`, `politics-view` |
| 타이머 | `무엇Timer` | `noticeTimer`, `hopTimer` |

- **보기 설정 저장:** 사이트마다 `사이트-size`(0·1·2)와 `사이트-contrast`로 저장한다. 고대비 값은 새 사이트부터 `'1'` / `'0'`으로 맞춘다.
- **저장값 확인:** 불러온 글자 크기는 `Number.isInteger()`와 범위로 확인한 뒤 쓴다.

### 4-3. 문법

- **변수 선언:** `const`를 기본으로 쓰고, 값이 바뀔 때만 `let`을 쓴다. `var`는 쓰지 않는다.
- **비교:** `===`, `!==`만 쓴다.
- **함수 형태:** 짧은 함수는 화살표 함수로 쓴다. 이름이 필요한 함수는 `function`으로 선언한다.
- **문자열 이어 붙이기:** `+`로 통일한다 (지금 모든 사이트가 이 방식). 템플릿 문자열(`` `${}` ``)은 쓰지 않는다.
- **세미콜론:** 항상 붙인다.

### 4-4. HTML과 연결하기

- **JS가 찾는 것은 `id`와 `data-*`가 기본.** 클래스는 모양을 위한 것이다.
  - 예: `data-act="water"`, `data-id="lettuce"`, `data-nav="works"`, `data-view="news"`, `data-source="donga"`
  - 예외: 같은 부품 여러 개를 한꺼번에 잡을 때는 BEM 블록 클래스로 찾아도 된다 (`querySelectorAll('.meal-btn')`).
- **데이터를 HTML에 두기:** 화면에 이미 있는 내용은 JS에 다시 쓰지 않고 `data-*`에서 읽는다 (텃밭 수첩은 안내 카드의 `data-id`, `data-name`, `data-interval`로 식물 목록을 만든다).
- **이벤트 위임:** 목록처럼 버튼이 많으면 부모 하나에 이벤트를 단다.

```js
el.myList.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  // btn.dataset.act 에 따라 처리
});
```

- **상태는 속성으로:** `hidden`, `disabled`, `aria-pressed`, `aria-expanded`, `aria-current`를 바꾼다. 화면 표시는 CSS가 그 속성을 보고 처리한다.
  - 보기 설정은 `<html>`에 단다: `data-size="1|2"`(보통은 속성 없음), `data-contrast="high"`.
  - 글자 크기가 끝 단계면 그 버튼을 `disabled`로 바꾼다.
  - 잠깐 움직이는 효과(캐릭터 뛰기 등)만 `--변형` 클래스를 붙였다 뗀다.
- **화면 그리기:** `state`를 바꾼 뒤 `render()`를 호출해서 그린다. 여기저기서 화면을 직접 고치지 않는다.

### 4-5. 사용자에게 알리기와 포커스

- 동작이 끝나면 알림 영역(`role="status"`)에 결과를 쓴다 (예: "상추에 물 준 기록을 남겼어요."). 함수는 `say(message)` 하나로 쓴다. 같은 문장도 다시 읽히도록 비웠다가 다음 프레임에 넣고, 몇 초 뒤 지운다.

```js
let noticeTimer = null;
function say(message) {
  clearTimeout(noticeTimer);
  el.notice.textContent = '';
  window.requestAnimationFrame(() => { el.notice.textContent = message; });
  noticeTimer = setTimeout(() => { el.notice.textContent = ''; }, 4000);
}
```

- 놓치면 안 되는 결과는 공통 알림창으로 연다. 함수는 `main.js`의 "공통 알림창" 부분에 한 번만 만들고 어디서든 부른다.

```js
// 기본 요소
const ALERT_TYPES = {
  success: { icon: '#i-check', title: '완료했어요' },
  error: { icon: '#i-alert', title: '다시 확인해 주세요' },
  info: { icon: '#i-info', title: '알려 드려요' }
};

// 공통 알림창 - showAlert({ type, title, message })
let alertOpener = null;

function showAlert({ type = 'info', title, message }) {
  if (!el.alert) return;
  const preset = ALERT_TYPES[type] || ALERT_TYPES.info;
  alertOpener = document.activeElement;           // 닫은 뒤 돌아갈 버튼
  el.alert.dataset.type = type;
  el.alertIcon.setAttribute('href', preset.icon);
  el.alertTitle.textContent = title || preset.title;
  el.alertMessage.textContent = message;          // innerHTML 금지
  if (typeof el.alert.showModal === 'function') el.alert.showModal();
  else el.alert.setAttribute('open', '');
}

el.alert.addEventListener('close', () => {
  if (alertOpener && typeof alertOpener.focus === 'function') alertOpener.focus();
  alertOpener = null;
});

// 쓰는 곳
showAlert({ type: 'success', title: '복사했어요', message: '이메일 주소를 복사했어요. 메일 쓰는 곳에 붙여 넣어 주세요.' });
showAlert({ type: 'error', message: '날짜를 골라 주세요. 오늘이나 지난 날짜만 고를 수 있어요.' });
```

- 화면을 다시 그린 뒤에는 **사용자가 보던 버튼으로 포커스를 돌려준다.**
- 메뉴로 화면을 바꾸면 새 화면의 제목(`tabindex="-1"`)으로 포커스를 옮긴다.
- "처음으로" 버튼은 상태를 처음 값으로 되돌리고, 맨 위로 올린 뒤 `h1`(`#siteTitle`)로 포커스를 옮긴다.
- "더 보기"로 목록이 늘어나면 새로 나온 첫 항목으로 포커스를 옮긴다.

### 4-6. 저장소와 오류 처리

- **localStorage:** 반드시 `try/catch`로 감싼다. 시크릿 모드나 차단 환경에서는 저장소가 없을 수 있다.

```js
const store = {
  get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* 무시 */ } }
};
```

- **불러온 데이터 확인:** 형식이 맞는지 확인하고, 틀리면 기본값으로 시작한다.
- **`innerHTML`과 `textContent`:**
  - 사이트 안에 고정된 데이터로 만든 마크업(카드, 목록)은 문자열을 `+`로 조립해 `innerHTML`에 넣어도 된다. 아이콘은 `ico('drop')` 같은 도우미로 넣는다.
  - 사용자가 입력한 글이나 바깥에서 받아 온 데이터(JSON, RSS)는 `innerHTML`에 넣지 않는다. `createElement` + `textContent`로 만든다.
  - 글자만 바꿀 때는 항상 `textContent`. 목록을 비울 때는 `textContent = ''`.
- **날짜:** 날짜는 `YYYY-MM-DD` 문자열로 저장한다. 계산은 그 기기의 시간대(로컬)로 한다.

### 4-7. 금지 목록

- `alert`, `confirm`, `prompt` (공통 알림창 `showAlert()`를 쓴다)
- `setTimeout`으로 순서 맞추기 (이벤트나 함수 호출 순서로 해결). 알림 지우기·짧은 효과 끝내기에만 쓰고, 그 전에 `clearTimeout`을 먼저 부른다.
- 정리 안 된 `console.log` 남기기

---

## 5. 바깥 데이터 쓰기 (자동 수집)

정적 사이트라서 브라우저가 다른 사이트를 직접 읽지 않는다. 스크립트가 미리 모아 JSON으로 저장하고, 화면은 그 JSON만 읽는다. 기준 예: `projects/politics-news/`.

### 5-1. 흐름

```
GitHub Actions (하루 2번) → scraper/collect.py → data/news.json 커밋 → Pages가 다시 배포 → 화면이 fetch로 읽음
```

- **실행 설정:** `.github/workflows/사이트이름.yml`에 둔다. `schedule`(시간은 UTC로 쓰고 옆에 한국 시간을 주석으로), `workflow_dispatch`(직접 실행), `push`(스크립트가 바뀌면 바로 한 번)를 단다.
- **자동 커밋:** 바뀐 것이 있을 때만 `github-actions[bot]` 이름으로 `chore: 데이터 갱신` 커밋을 올린다.

### 5-2. 수집 스크립트 (`scraper/`)

- **파이썬 표준 라이브러리만** 쓴다 (`urllib`, `xml.etree`, `json`). 설치할 것이 없어야 어디서든 바로 돈다.
- **바뀔 수 있는 값은 `config.json`에:** 주소, 인물·검색어, 보관 기간, 개수 제한. 코드를 고치지 않고 설정만 바꿔서 쓴다.
- **공식 경로만:** 언론사·기관이 공개한 RSS나 공개 API만 쓴다. 공식 주소가 안 될 때만 `fallback_url`(예: Google 뉴스 RSS)을 쓴다.
- **저작권:** 기사는 **제목 · 출처 · 시간 · 원문 링크**만 저장한다. 본문·요약·사진은 저장하지 않는다. 화면의 "알아 두세요"에도 이 내용을 적는다.
- **실패해도 멈추지 않기:** 한 곳이 실패하면 그곳은 지난번 데이터를 그대로 두고 나머지를 계속 모은다. 모든 곳이 실패했을 때만 오류로 끝낸다.
- **로그는 한국어로 짧게:** `[성공] 동아일보: 50건`, `[실패] …` 형식으로 남긴다.

### 5-3. 데이터 파일 (`data/*.json`)

- **형식:** `updated`(ISO 날짜, 한국 시간) + 목록. 화면에서 쓸 이름(언론사, 인물)도 함께 넣어서 설정과 화면이 어긋나지 않게 한다.
- **처음 파일:** 빈 목록(`"items": []`)으로 넣어 둔다. 화면은 "아직 모은 기사가 없어요"를 보여 준다.

### 5-4. 화면에서 읽기

- **불러오기:** `fetch('data/news.json', { cache: 'no-cache' })`로 읽는다.
- **확인 먼저:** 받은 데이터는 `cleanData()` 같은 함수로 형식을 확인하고, 틀린 항목은 버린다. 링크는 `http(s)://`로 시작할 때만 쓴다.
- **상태 세 가지:** 불러오는 중(문구) / 실패(원인 + "다시 불러오기" 버튼) / 비어 있음(안내 문구)을 모두 만든다.
- **바깥 링크:** 새 창으로 열고 `(새 창으로 열림)`을 낭독기용으로 붙인다.

---

## 6. 접근성 · 시니어 UX 기준

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

## 7. 작업 방식

### 7-1. 작업 순서

1. **정하기:** 사이트 한 개의 목적과 대상을 한 줄로 쓴다.
2. **구조 먼저:** HTML로 내용과 구조를 만든다. CSS가 없어도 읽을 수 있어야 한다.
3. **토큰 정하기:** 색 5개, 글꼴, 크기 토큰을 정하고 대비를 확인한다.
4. **꾸미기:** 모바일(375px)부터 CSS를 쓰고, 768px / 1024px로 넓힌다.
5. **기능 붙이기:** JS를 붙인다. JS 없이도 핵심 내용은 보이게 둔다.
6. **확인:** 아래 완료 체크리스트로 점검한다.

### 7-2. 수정할 때

- 기존 파일과 스타일을 먼저 확인하고 톤을 맞춘다.
- 요청받은 것만 고치고, 관련 없는 파일은 건드리지 않는다.
- 끝나면 바꾼 파일과 내용을 2~3줄로 정리한다.

### 7-3. 가이드 문서 고칠 때

- 원본은 `docs/CODING_GUIDE.md`, `docs/CSS_GUIDE.md`다. 고친 뒤에는 같은 작업 안에서 `python3 docs/guide/build.py`를 실행해 `docs/guide/index.html`, `docs/guide/css.html`을 다시 만든다.
- `docs/guide/*.html`은 직접 고치지 않는다. 페이지 모양은 `docs/guide/css/`, `docs/guide/js/`, `docs/guide/build.py`에서 고친다.

### 7-4. Git

- **저장소:** `KwonJiWoong/side-project`. `main` 브랜치가 그대로 GitHub Pages에 공개된다.
- **브랜치:** `main`은 항상 동작하는 상태로 둔다. 작업은 `feature/기능-이름` 브랜치에서 하고, Pull Request로 `main`에 합친다.
- **작성자:** 커밋은 본인 계정(KwonJiWoong)으로 올린다. 자동 수집 커밋만 `github-actions[bot]`이다.
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

## 8. 완료 체크리스트

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
- [ ] 바깥 데이터를 쓰면: 불러오는 중 · 실패 · 비어 있음 화면을 모두 확인했다
- [ ] 인라인 스타일·인라인 이벤트·`!important`가 없다 (허용 예외 제외)
- [ ] 쓰지 않는 파일·클래스·코드가 없다

**품질**
- [ ] Lighthouse 접근성 95점 이상, SEO 90점 이상
- [ ] Chrome, Safari, Edge에서 확인했다
