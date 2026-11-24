# 딴짓 메뉴 백엔드 가이드

딴짓 메뉴를 **어디에 올리고, 데이터가 어디에 있고, 서버 쪽을 어떻게 다루는지** 정리한 문서입니다.
화면 코드는 [`FRONTEND.md`](FRONTEND.md), 모양은 [`DESIGN.md`](DESIGN.md), 저장소 공통 규칙은 `docs/CODING_GUIDE.md` 9장(서버 · 배포)을 따릅니다.

> **지금 딴짓 메뉴에는 서버가 없습니다.** 정적 파일만 올리고, 이용자 기록은 모두 이용자 브라우저에 저장합니다.
> 이 문서의 "백엔드"는 호스팅 · 배포 · 도메인 · 광고 인증 · 보안 설정, 그리고 나중에 서버 기능을 붙일 때의 규칙입니다.

---

## 1. 지금 구조

```
이용자 브라우저
 ├─ HTML · CSS · JS · data/activities.json ◀── GitHub Pages (main 브랜치)
 ├─ Pretendard 글꼴                         ◀── jsDelivr CDN
 ├─ 광고 (ID를 넣은 뒤에만)                  ◀── Google AdSense
 └─ 뽑은 메뉴 · 타이머 · 도장 기록            ──▶ localStorage (이 기기 브라우저에만)
```

| 데이터 | 있는 곳 | 바꾸는 방법 |
|---|---|---|
| 활동 목록 | `data/activities.json` (정적 파일) | 파일 고쳐서 커밋 → 배포 |
| 이용자 기록 | 이용자 브라우저 localStorage (키 4개, FRONTEND.md 4장) | 이용자만 지울 수 있음 |
| 광고 설정 | `js/ads.js`, 저장소 루트 `ads.txt` | 파일 고쳐서 커밋 → 배포 |

- 운영자가 받는 데이터는 **없다.** 접속 기록(IP 등)은 호스팅·CDN 업체 쪽에서만 처리된다 (`privacy.html` 3번)
- 방문 분석 도구(GA 등)는 쓰지 않는다. 붙이려면 처리방침을 먼저 고친다

---

## 2. 배포 (지금: GitHub Pages)

- 주소: `https://kwonjiwoong.github.io/side-project/projects/dopamine-menu/`
- `main` 브랜치에 병합하면 GitHub Pages가 1~2분 안에 자동으로 다시 올린다. 따로 할 일 없음
- 작업 순서: `feature/…` 브랜치 → Pull Request → `main` 병합 (CODING_GUIDE 7-4)
- 캐시: Pages는 파일을 약 10분 동안 캐시한다. CSS · JS를 고친 직후 옛 모양이 보이면 10분 뒤나 강력 새로고침으로 확인
- `activities.json`은 화면에서 `cache: 'no-cache'`로 읽어서, 고치면 바로 반영된다
- `DESIGN.md` · `FRONTEND.md` · `BACKEND.md` · `PLAN.md`도 Pages에 공개되지만 화면에서 링크하지 않는다. 비밀 정보는 적지 않는다

---

## 3. 광고를 켜려면 자체 도메인이 필요

애드센스는 **도메인 단위로 심사**하고, `ads.txt`를 **도메인 맨 위(`https://도메인/ads.txt`)**에서 찾는다.
지금 주소(`kwonjiwoong.github.io/side-project/…`)는 하위 폴더라 이 조건을 맞출 수 없다. 그래서 광고를 켜는 시점 = **자체 도메인으로 옮기는 시점**이다.

옮길 때 꼭 알아 둘 것:
- **localStorage는 주소(도메인)별로 따로 저장된다.** 새 도메인으로 옮기면 기존 이용자의 도장 기록은 따라오지 않는다 → 이용자가 적을 때 일찍 옮긴다
- 옛 주소(github.io)는 "새 주소로 옮겼어요" 안내로 바꾸거나 Pages에서 빼서, 검색에 두 곳이 잡히지 않게 한다
- 도메인 이름은 서비스 이름에 맞춘 짧은 주소를 추천 (예: `ddanjit.com` — 정해지면 여기에 적기)

---

## 4. 오픈할 때 호스팅 (권장: 아 맞다 약!과 같은 방식)

아직 정하지 않았다. 정하면 이 장을 확정본으로 고친다. 기준 예는 `scripts/LAUNCH-pill-check.md`, `scripts/deploy-pill-check.sh`.

```
이용자 ──▶ 도메인 (ACM 인증서, us-east-1)
            └─▶ CloudFront (압축 · 보안 헤더 · 오류 페이지) + WAF 속도 제한
                  └─▶ S3 버킷 (퍼블릭 차단, OAC로만 읽기)
```

| 항목 | 설정 |
|---|---|
| S3 | 퍼블릭 차단 유지. 아 맞다 약!과 같은 계정 · 리전 |
| CloudFront | OAC, **자동 압축 켜기**, 기본 문서 `index.html` |
| WAF | IP당 5분 1,000건 넘으면 차단 |
| 오류 페이지 | 403 · 404 → `/404.html`(만들어야 함), 응답 코드 404 |
| 보안 헤더 | HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, 프레임 차단 |
| 배포 | 본인 컴퓨터에서 스크립트로 올림 (GitHub Actions 연결 안 함) |

**캐시 규칙** (배포 스크립트가 정한다)

| 파일 | 보관 |
|---|---|
| `*.html`, `data/activities.json`, `ads.txt`, `robots.txt`, `sitemap.xml` | 매번 새로 (`no-cache`) |
| `css/*.css`, `js/*.js` | 1년 — 대신 HTML에서 `?v=버전`을 붙이고 배포할 때마다 바꾼다 |
| `images/*` | 하루 |

**옮기기 전에 할 일**
- [ ] HTML의 CSS · JS 링크에 `?v=` 붙이기 (지금은 없음. Pages에선 필요 없어서 안 붙였다)
- [ ] `scripts/deploy-dopamine-menu.sh` 만들기 (`deploy-pill-check.sh`를 본떠서). **`.md` 파일은 올리지 않는다**
- [ ] 도메인 루트에 `ads.txt`(실제 게시자 ID), `robots.txt`, `sitemap.xml`, `404.html`
- [ ] `index.html`에 `canonical`, 공유 미리보기(`og:*`) 넣기
- [ ] `js/ads.js`의 `client` · `domain` · `slots.bottom` 채우기
- [ ] `privacy.html` 3번의 "GitHub"를 실제 호스팅 업체(Amazon Web Services)로 고치고 시행일 바꾸기

---

## 5. 서버 기능을 붙일 때

지금 기획(PLAN.md)에는 서버가 필요한 기능이 없다. 아래 같은 기능을 넣게 되면 이 규칙을 따른다.

| 생길 수 있는 기능 | 서버가 필요한 이유 |
|---|---|
| 주간 도장판 공유 링크 | 다른 사람이 볼 수 있게 저장 |
| 활동 제안 받기 | 이용자가 보낸 글 저장 |
| 기기 바꿔도 기록 유지 | 계정 · 동기화 |

1. **먼저 서버 없이 되는지 본다.** 공유는 링크 주소에 담거나(서버 안 거침) 이미지로 저장하는 방법이 먼저다
2. **구성은 `services/dopamine-…/`에 AWS 서버리스로.** API Gateway(HTTP API) + Lambda(Node.js) + DynamoDB, SAM `template.yaml`로 한 번에 만든다. 기준 예: `services/pill-push/`
3. **저장은 최소로.** 꼭 필요한 값만, 이름 · 연락처 같은 개인정보는 받지 않는다. DynamoDB TTL로 기간이 지나면 자동 삭제
4. **입력은 서버에서 다시 확인.** 길이 · 형식 · 허용 값 검사, 틀리면 400. 화면 검사만 믿지 않는다
5. **CORS는 서비스 도메인 하나만** 허용
6. **속도 제한:** API Gateway 제한(초당 건수)을 걸고, 이용자가 늘면 WAF를 붙일 수 있는 구성으로 바꾼다
7. **비밀 값**(키 · 토큰)은 저장소에 올리지 않는다. `sam deploy --guided` 매개변수나 AWS 비밀 저장소에 둔다
8. **로그는 짧게, 숫자만.** CloudWatch 보관 14일, 이용자 입력 내용은 남기지 않는다
9. **테스트와 문서:** `npm test`로 입력 검사 · 흐름 테스트, `README.md`에 올리는 순서와 확인 방법
10. **처리방침 먼저:** 서버에 무엇을 얼마나 저장하는지 `privacy.html`에 적고 나서 기능을 켠다. 화면 쪽은 서버가 응답하지 않아도 지금처럼 동작해야 한다 (서버는 덤)

---

## 6. 체크리스트

**배포할 때마다**
- [ ] `main`에 병합 후 실제 주소에서 뽑기 → 시작 → 도장까지 한 번
- [ ] `activities.json`을 고쳤다면 형식이 맞는지(쉼표 · 따옴표) 확인 — 틀리면 화면이 "메뉴를 불러오지 못했어요"가 된다

**도메인으로 옮길 때**
- [ ] 4장 "옮기기 전에 할 일" 전부
- [ ] 새 주소에서 HTTPS, 404 페이지, 보안 헤더 확인
- [ ] `https://도메인/ads.txt`가 열리는지
- [ ] 옛 github.io 주소 정리
