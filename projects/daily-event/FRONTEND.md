# 소소한 일상의 이벤트 — 프론트엔드 가이드

화면 코드가 어떻게 짜여 있고, 고칠 때 무엇을 지켜야 하는지 정리한 문서입니다.
모양(색·글자·간격)은 [`DESIGN.md`](DESIGN.md), 저장소 공통 규칙은 `docs/CODING_GUIDE.md`를 따릅니다. 이 문서와 코드가 다르면 **코드를 기준으로 이 문서를 고칩니다.**

- **이 사이트만 Vite + React** (저장소의 다른 사이트는 Vanilla JS). 마크업·CSS 규칙(시맨틱 태그, BEM, 토큰, 인라인 스타일 금지)은 다른 사이트와 같다
- 서버 없음. 기록은 모두 이용자 브라우저(localStorage)에 저장
- 외부 파일: Pretendard 글꼴 CDN, 고운바탕(Google Fonts), (승인 후) 애드센스

---

## 1. 실행

```bash
cd projects/daily-event
npm install
npm run dev       # 개발 서버 (http://localhost:5173)
npm run build     # dist/ 에 올릴 파일 만들기
npm run preview   # dist/ 미리 보기 (http://localhost:4173)
npm run qr        # SITE.url로 public/images/qr.svg 만들기 (도메인 정한 뒤)
```

- Node 20.19 이상. `node_modules/`, `dist/`는 저장소에 올리지 않는다
- GitHub Pages에서는 이 폴더가 빌드 전 원본이라 열리지 않는다. 배포는 [`BACKEND.md`](BACKEND.md)

---

## 2. 파일

```
daily-event/
├─ index.html              뼈대: <head>(SEO · 공유 미리보기), 아이콘 모음(<symbol>), #root
├─ privacy.html            개인정보 처리방침 (React 없음, CSS만)
├─ vite.config.js          빌드 설정 + JSON-LD 넣기, __SITE_URL__ 채우기
├─ src/
│  ├─ main.jsx             React 시작, CSS 불러오기
│  ├─ App.jsx              상태 전부 (유형, 날짜, 기록, 탭) + 화면 배치
│  ├─ config.js            사이트 주소(SITE), 광고 설정(ADS)
│  ├─ components/
│  │  ├─ Header.jsx        사이트 이름 + 유형 버튼
│  │  ├─ Tabs.jsx          오늘의 초대장 / 이벤트 달력
│  │  ├─ Intro.jsx         첫 방문 소개 편지 5장 (화면 전체, 타자 효과)
│  │  ├─ ThemeSwitch.jsx   테마 고르기 (항공우편 / 파스텔)
│  │  ├─ TypePicker.jsx    유형 고르기 (fieldset + 라디오 카드) + 테마
│  │  ├─ TodayPanel.jsx    봉투 → 초대장 → 도전 중(소인 · 한 줄 기록)
│  │  ├─ Envelope.jsx      봉투 그림
│  │  ├─ InviteCard.jsx    초대장 카드
│  │  ├─ StampMark.jsx     완료 소인
│  │  ├─ CalendarPanel.jsx 월간 달력 + 고른 날 상세
│  │  ├─ HandoffCard.jsx   PC 전용 휴대폰 안내 (QR · 링크 복사)
│  │  ├─ AdSlot.jsx        광고 자리
│  │  ├─ TestBar.jsx       테스트 모드 막대 (#test)
│  │  ├─ Faq.jsx · Footer.jsx · Icon.jsx
│  ├─ data/faq.js          자주 묻는 질문 (화면 + JSON-LD가 같이 씀)
│  ├─ lib/
│  │  ├─ date.js           날짜 키(YYYY-MM-DD), 달력 칸
│  │  ├─ pick.js           오늘의 초대장 고르기
│  │  ├─ storage.js        localStorage 읽기·쓰기
│  │  └─ meta.js           유형 · 시간대 · 분류 이름과 아이콘
│  └─ styles/              reset.css → common.css(토큰 · 공통 부품) → style.css(화면 순서)
├─ public/                 그대로 복사되는 파일
│  ├─ data/events.json     이벤트 75개
│  ├─ images/              favicon.svg, icon-180/192/512.png, og-image.png, (qr.svg)
│  ├─ manifest.webmanifest · llms.txt · robots.txt · ads.txt
├─ scripts/make-qr.mjs
└─ PLAN.md · DESIGN.md · FRONTEND.md · BACKEND.md
```

- 아이콘은 `index.html`의 `<svg class="sprite">` 안 `<symbol>`을 `<Icon name="i-이름" />`으로 쓴다 (`i-` UI, `c-` 분류, `t-` 유형)
- 스타일은 `className`으로만. `style={{…}}` 금지

---

## 3. 상태와 저장

`App.jsx` 한 곳에서 관리하고, 바뀔 때마다 localStorage `daily-event` 키에 통째로 저장한다.

```js
{
  v: 1,
  type: 'worker',                // student | worker | free | null(첫 방문)
  handoffClosed: false,          // PC 안내 카드를 닫았는지
  introSeen: true,               // 소개 편지를 끝까지 봤는지
  theme: 'airmail',              // airmail | pastel
  days: {
    '2026-11-24': {
      type: 'worker',            // 이 초대장을 받을 때의 유형
      eventId: 'w02',            // 지금 초대장
      firstId: 'w01',            // 바꾸기 전 초대장 (바꾼 날만)
      opened: true, swapped: true, accepted: true, done: true,
      memo: '3번 출구 쪽이 더 한산했다'
    }
  }
}
```

| 화면 | 판단 기준 |
|---|---|
| 소개 편지 (화면 전체) | `type`도 `introSeen`도 없음 |
| 유형 고르기 | `type`이 없음, 또는 헤더 버튼을 누름(`picking`) |
| 봉투 | 오늘 기록이 없거나 `opened`가 아님 |
| 초대장 | `opened` && !`accepted` |
| 도전 중 | `accepted` (소인은 `done`) |
| 불러오기 실패 | `status === 'error'` |

- 날짜 키는 **기기 현지 시간**. 1분마다 · 화면 복귀 때 `today`를 다시 계산한다
- 유형을 바꾸면 소인 안 찍은 오늘 기록은 지워 새 유형으로 다시 받는다

---

## 4. 초대장 고르기 (`lib/pick.js`)

1. 이 유형의 이벤트(`types`에 포함)만 남긴다
2. 최근 7일 기록의 `eventId` · `firstId`를 뺀다 (모두 빠지면 빼지 않고 고름)
3. `날짜-유형` 문자열의 해시로 하나를 고른다 → 같은 날 같은 결과
4. 바꾸기는 지금 초대장을 빼고 `-swap1`을 붙인 해시로 고른다

---

## 5. 접근성 처리

- 화면 전환(유형 고르기 ↔ 탭) 때 그 화면 `h2`로 포커스 (`headingRef`). 첫 로드는 옮기지 않음
- 초대장이 나오거나 바뀌면 초대장 제목(`h3`)으로 포커스
- 동작 결과는 `App` 아래 `role="status"` 한 곳에서 알림
- 탭은 `nav` 안 버튼 + `aria-current="page"`, 소인 버튼·달력 날짜는 `aria-pressed`
- 교체 소진은 `disabled` 대신 `aria-disabled` (포커스는 남기고 이유 문구를 읽게)

---

## 6. 도메인 · 광고 연결

1. `src/config.js` → `SITE.url = 'https://도메인/'`
2. `npm run qr` → `public/images/qr.svg` (PC 안내 카드에 QR이 나타남)
3. `npm run build` → `canonical`, `og:url`, `og:image`, JSON-LD `url`이 채워짐 (`SITE.url`이 비어 있으면 그 줄이 빠짐)
4. `public/robots.txt`의 Sitemap 줄, `public/sitemap.xml` 추가
5. 애드센스 승인 뒤 `ADS.client` · `domain` · `slots.bottom`, `public/ads.txt` 게시자 ID

---

## 7. 테스트 모드

주소 끝에 `#test`(또는 `?test`)를 붙이면 화면 위에 테스트 막대가 나온다. 하루 1통 규칙 때문에 여러 번 확인하기 어려운 것을 돕는다.

| 버튼 | 하는 일 |
|---|---|
| 다음 날로 | 가상 날짜를 하루 뒤로 (`daily-event-test-offset`에 저장). 7일 중복 방지 · 달력 확인용 |
| 오늘 다시 받기 | 가상 오늘의 기록만 지우고 봉투부터 |
| 실제 날짜로 | 가상 날짜를 되돌림 |
| 처음부터 | 기록을 모두 지우고 유형 고르기부터 |

- 가상 날짜로 만든 기록도 같은 저장소에 남는다. 테스트가 끝나면 [처음부터]로 지운다
- `#test`를 빼면 실제 날짜로 돌아간다 (저장된 offset은 테스트 모드에서만 씀)

---

## 8. 함께 고치기

- 자주 묻는 질문은 `src/data/faq.js` 하나만 고치면 화면과 JSON-LD가 같이 바뀐다
- 규칙(교체 횟수, 7일, 이벤트 수)이 바뀌면 `faq.js` · `public/llms.txt` · `index.html` description · `vite.config.js` featureList를 함께 고친다
- 저장 항목이 바뀌면 `privacy.html` 2장 표도 고친다
