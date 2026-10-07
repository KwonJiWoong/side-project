# CSS 작성 가이드

이 폴더의 모든 사이트(`/`, `/menu-cute`, `/garden-guide` 및 이후 추가할 사이트)에 공통으로 적용하는 CSS 규칙입니다.
상위 원칙은 `CLAUDE.md`를 따르며, 이 문서는 그 원칙을 **CSS 코드 수준에서 어떻게 지키는지**를 정리합니다.

> 판단 기준: 규칙이 애매하면 "노약자가 더 쉽게 쓰는 쪽"을 고른다.

---

## 1. 파일 구조

| 파일 | 담는 것 | 담지 않는 것 |
|---|---|---|
| `css/reset.css` | 브라우저 기본 스타일 초기화, `[hidden]` 처리 | 색, 글꼴, 컴포넌트 |
| `css/common.css` | 디자인 토큰, 고대비·글자 크기 단계, `body` 기본값, 포커스, 공통 부품(`.btn`, `.container`, `.sr-only`, `.skip-link`, `.ico`), 모션 최소화 | 특정 화면에만 쓰는 스타일 |
| `css/style.css` | 화면별 블록 스타일 | 토큰 정의, 공통 부품 |

- 불러오는 순서는 항상 `reset.css → common.css → style.css`.
- `style.css`는 **화면에 보이는 순서대로** 블록을 배치한다. (헤더 → 메뉴 → 본문 섹션 순서 → 푸터 → 고대비 보정 → 미디어쿼리 보정)
- 블록이 시작될 때마다 한 줄 주석을 단다. 주석은 섹션 구분용으로만, 한국어로 쓴다.

```css
/* 내 식물 목록 */
.my-list { … }
```

---

## 2. 디자인 토큰

### 2-1. 공통 토큰 (모든 사이트 필수)

| 토큰 | 용도 |
|---|---|
| `--color-bg` | 페이지 배경 (흰색 또는 아주 밝은 톤) |
| `--color-surface` | 카드·버튼 바탕 |
| `--color-text` | 본문 글자 |
| `--color-primary` | 주요 색 (버튼, 링크, 현재 메뉴) |
| `--color-accent` | 강조 색 (주의, 포커스 테두리) |
| `--font-sans` | 본문 글꼴 스택 |
| `--border-w` | 기본 테두리 두께 |
| `--radius` | 기본 모서리 둥글기 |
| `--touch` | 버튼 최소 크기 (3.5rem 이상) |
| `--page-pad` | 화면 좌우 여백 |

### 2-2. 추가 토큰 규칙

- 사이트에 필요한 토큰은 추가해도 되지만 **같은 접두어**를 쓴다.
  - 색: `--color-*` (예: `--color-soft`, `--color-on-primary`)
  - 글꼴: `--font-*`
  - 크기·간격: `--radius-*`, `--gap`, `--space-*`
- **색 토큰은 사이트당 5개 이내**로 한다. 고대비 모드는 이 개수에 넣지 않는다.
- 텍스트 대비는 배경 대비 **7:1 이상**을 목표로 하고, 최소 4.5:1은 반드시 지킨다. 토큰을 정할 때 대비 값을 주석으로 남긴다.

### 2-3. 토큰 사용 규칙

- **색상 코드(hex, rgb)는 `:root`와 고대비 블록에서만 쓴다.** 컴포넌트에는 항상 `var(--color-*)`만 쓴다.
  - 예외: SVG 이미지 파일 안의 색
- **고대비 모드:** `html[data-contrast="high"]`에서 **토큰 값만 바꾼다.** 컴포넌트별 보정이 꼭 필요할 때만 `style.css` 끝의 "고대비 모드 보정" 블록에 모은다.
- **글자 크기 단계:** `html[data-size="1|2"]`가 `html`의 `font-size`를 바꾼다. 그래서 모든 크기를 rem으로 쓰면 자동으로 함께 커진다.

```css
/* 좋음 */
.status--due { color: var(--color-accent); }

/* 나쁨: 고대비 모드에서 바뀌지 않음 */
.status--due { color: #8a3f0e; }
```

---

## 3. 클래스 이름: BEM

### 3-1. 형식

```
.블록              .plant-card
.블록__요소         .plant-card__name
.블록--변형         .plant-card--due
.블록__요소--변형    .week__day--today
```

- **이름 짓기:** 소문자 영어 + 하이픈(kebab-case)으로 쓴다. 블록 이름은 **역할**로 짓고 모양으로 짓지 않는다. (`.green-box` ✕ → `.tip` ○)
- **요소는 한 단계만:** `.plant-card__head__img` ✕ → `.plant-card__img` ○
- **블록끼리 섞기(mix):** 공통 부품에 화면별 클래스를 함께 붙인다.
  `class="btn btn--toggle picker__btn"`

### 3-2. 상태 표시: ARIA 속성 먼저

화면 낭독기가 읽는 상태와 화면에 보이는 상태가 어긋나지 않도록, **상태는 ARIA 속성이나 HTML 속성으로 스타일을 준다.**

| 상태 | 사용할 속성 | 예시 |
|---|---|---|
| 눌림/선택 | `aria-pressed` | `.filter__btn[aria-pressed="true"]` |
| 현재 위치 | `aria-current="page"` | `.gnb__link[aria-current="page"]` |
| 펼침 | `aria-expanded`, `details[open]` | `.guide-card__more[open]` |
| 입력 오류 | `aria-invalid="true"` | `.date-form__input[aria-invalid="true"]` |
| 숨김 | `hidden` 속성 | JS에서 `el.hidden = true` |
| 사용 불가 | `disabled` | `.btn[disabled]` |

- 속성으로 표현할 수 없는 **보이는 모양 차이**만 `--변형` 클래스로 만든다. (`.plant-card--due`, `.summary--due`)
- **JS에서 쓰는 이름:** JS가 요소를 찾을 때는 `id`나 `data-*`(`data-act`, `data-id`, `data-filter`)를 쓴다. **클래스 이름을 바꿔도 JS가 깨지지 않게** 하기 위해서다.

### 3-3. 전역 클래스 (BEM 예외)

어디서나 쓰는 공통 클래스는 아래만 허용한다. 새로 만들지 않는다.

`.container` `.sr-only` `.skip-link` `.btn` `.ico`

---

## 4. 선택자 규칙

1. **클래스 선택자 하나**를 기본으로 한다. 상태 속성이나 가상 클래스를 붙이는 것은 괜찮다.
   `.btn:hover`, `.btn--toggle[aria-pressed="true"]::before`
2. **태그 선택자 금지.** 꾸밀 요소에는 클래스를 준다.
   - 예외 1: `reset.css`와 `common.css`의 `body`, `strong`, `main`
   - 예외 2: **문장 안에 섞이는 글**(`<strong>`, `<a>`)은 블록 아래 한 단계만 허용 (예: `.policy__body a`)
3. **id 선택자로 스타일을 주지 않는다.** id는 JS와 `aria-labelledby`용이다.
4. **중첩은 최대 2단계.** `.a .b` 까지만 쓴다.
5. **`!important` 금지.**
   - 예외: `reset.css`의 `[hidden]`, `common.css`의 `prefers-reduced-motion` 블록

```css
/* 나쁨 */
.plant-card__info dt { … }

/* 좋음 */
.plant-card__label { … }
```

---

## 5. 단위

| 대상 | 단위 | 비고 |
|---|---|---|
| 글자 크기 | `rem` | 본문 최소 `1rem`(=18px), 버튼·중요 안내 `1.125rem` 이상 |
| 행간 | 단위 없는 숫자 | `1.6` 이상 (기본 `1.7`) |
| 여백·간격 | `rem`, `clamp()` | 화면 크기에 따라 변하는 큰 여백은 `clamp()` |
| 레이아웃 너비 | `%`, `fr`, `min()` | 고정 너비 금지 |
| 테두리 두께 | `--border-w` 또는 `rem` | 가는 선은 `0.0625rem` |
| 둥근 모서리 | `--radius`, `--radius-pill` | `999px` 같은 값을 직접 쓰지 않는다 |

**px 허용 예외** (주석에 이유를 쓴다)
- 미디어쿼리 기준점 (`768px`, `1024px`)
- `.sr-only`의 `1px` (표준 패턴)
- 광고 규격 (`max-width: 728px`, `min-height: 90px / 100px`)
- `--radius-pill: 999px` 토큰 정의 (알약 모양은 아주 큰 값이 필요)
- `env(safe-area-inset-*, 0px)`의 기본값

---

## 6. 반응형

- **모바일 우선:** 기본 스타일은 375px 기준으로 쓰고, `min-width` 미디어쿼리로만 넓힌다.
- **기준점은 두 개만:** `768px`(태블릿), `1024px`(PC).
- **미디어쿼리 위치:** 해당 블록 바로 아래에 둔다. 흩어지면 `style.css` 맨 끝의 "태블릿 이상" 블록에 모은다.
- **카드 목록:** 아래 패턴을 쓴다. 글자를 키우거나 200%로 확대하면 칸 수가 자동으로 줄어든다.

```css
grid-template-columns: repeat(auto-fill, minmax(min(100%, 18rem), 1fr));
```

- **글이 들어가는 요소:** 너비를 고정하지 않는다. 버튼 글자가 넘치면 글자를 줄이거나 칸을 넓힌다. 글자 크기를 줄여서 해결하지 않는다.

---

## 7. 접근성 필수 CSS

| 항목 | 규칙 |
|---|---|
| 포커스 | `:focus-visible`에 `0.25rem` 이상 굵은 outline, 강조 색, `outline-offset` 확보. `outline: none` 금지 (단, `tabindex="-1"`로 포커스만 옮기는 제목은 예외) |
| 터치 영역 | 버튼·링크 `min-height: var(--touch)`, 요소 사이 간격 `0.5rem` 이상 |
| 버튼 모양 | 테두리나 배경이 있어 "누를 수 있는 것"으로 보여야 한다 |
| 상태 표시 | 색만으로 상태를 알리지 않는다. 아이콘·글자·테두리 굵기를 함께 바꾼다 (예: 눌린 버튼에 `✓`) |
| 호버 | 호버에만 의존하는 정보 금지. 호버는 배경색 변화 정도만 준다 |
| 모션 | `transition`은 `0.15s` 이하의 색 변화만 쓴다. `prefers-reduced-motion`이면 모두 끈다 |
| 숨김 | 화면에서만 숨길 때는 `.sr-only`, 완전히 숨길 때는 `hidden` 속성 |

---

## 8. 아이콘과 그림

| 종류 | 방식 | 클래스 |
|---|---|---|
| UI 아이콘 (버튼, 메뉴, 상태) | HTML 상단 아이콘 모음 `<svg><use href="#i-이름"></use></svg>` | `.ico` |
| 식물 그림 등 콘텐츠 이미지 | `<img>` + 의미 있는 `alt` | 블록 요소 클래스 (`.guide-card__img`, `.picker__img`) |

- **`.ico` 쓰는 법:** `aria-hidden="true"`를 붙이고, **항상 글자 라벨과 함께** 쓴다. 색은 `currentColor`라서 버튼 글자색과 고대비 모드를 자동으로 따라간다.
- **새 아이콘:** 아이콘 모음에 `i-이름` 심볼로 추가한다. 아이콘을 이미지 파일로 따로 만들지 않는다.
- **장식용 그림:** 옆에 같은 내용의 글자가 있으면 `alt=""`로 비운다.

---

## 9. 공통 부품: 버튼

| 클래스 | 용도 |
|---|---|
| `.btn` | 기본 버튼 (흰 바탕 + 주요 색 테두리) |
| `.btn--primary` | 화면의 핵심 동작 1개 (채운 배경, 큰 글자) |
| `.btn--block` | 가로 꽉 채움 |
| `.btn--toggle` | 켜고 끄는 버튼 (`aria-pressed`와 함께) |
| `.btn--danger` | 되돌리기 어려운 동작 (빼기, 삭제) |
| `.btn--home`, `.btn--tool` | 머리글의 "처음으로", 보기 설정 버튼 |

- **핵심 버튼은 하나만:** 한 카드나 화면에 `.btn--primary`는 1개만 쓴다.
- **위험한 동작은 확인 단계와 함께:** `.btn--danger` 버튼은 확인 단계(`.confirm` 블록)를 거치게 한다.

---

## 10. 속성 작성 순서

한 규칙 안에서는 아래 순서로 쓴다.

1. 위치: `position`, `top/right/bottom/left`, `z-index`
2. 상자 배치: `display`, `flex-*`, `grid-*`, `align-*`, `justify-*`, `gap`
3. 크기: `width`, `min-/max-width`, `height`, `aspect-ratio`
4. 여백: `margin`, `padding`
5. 글자: `font-*`, `line-height`, `letter-spacing`, `text-*`
6. 색과 모양: `color`, `background`, `border`, `border-radius`, `box-shadow`
7. 기타: `cursor`, `transition`, `transform`

---

## 11. 작업 전 확인 목록

- [ ] `:root`·고대비 블록 밖에 hex 색상이 없다
- [ ] 태그 선택자, id 선택자, `!important`가 없다 (허용 예외 제외)
- [ ] 새 클래스가 BEM 형식이고 요소가 한 단계다
- [ ] 상태를 ARIA·HTML 속성으로 표현했다
- [ ] 글자는 rem, px은 허용 예외에만 썼다
- [ ] 모든 버튼에 `.ico` 아이콘과 글자 라벨이 함께 있다
- [ ] 375px / 768px / 1024px, 글자 "아주 크게", 고대비 모드에서 깨지지 않는다

---

## 부록. garden-guide 정리 기록

이 가이드에 맞춰 2026-10-01에 정리한 내용입니다.

| 위치 | 이전 | 정리 후 |
|---|---|---|
| 내 식물 카드 정보 | `.plant-card__info dt/dd` | `.plant-card__label`, `.plant-card__value` |
| 안내 카드 자세히 보기 | `.guide-card__detail dt` | `.guide-card__term`, `.guide-card__def` |
| 이달의 할 일 | `.todo__item strong` | `.todo__text`, `.todo__title` |
| 개인정보 처리방침 | `.policy__toc ol/a`, `.policy__section h2/p/ul/a`, `.policy__list li + li`, `.fill` | `.policy__toc-list`, `.policy__toc-link`, `.policy__heading`, `.policy__text`, `.policy__item`, `.policy__link`, `.policy__fill` |
| 알약 모양 모서리 | `border-radius: 999px` | `var(--radius-pill)` |
| 식물 고르기 그림 | `.icon` (common.css) | `.picker__img`, `.icon` 삭제 |
| 안 쓰는 아이콘 파일 | `images/icon-*.svg` 4개 | 삭제 |
