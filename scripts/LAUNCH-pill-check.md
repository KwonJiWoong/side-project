# 아 맞다 약! 오픈 체크리스트

AWS에 처음 올릴 때 순서대로 확인해요.

## 1. 사이트 (S3 + CloudFront + WAF)
- [ ] S3 버킷 (서울 리전, 퍼블릭 차단 유지) + CloudFront 정액 무료 요금제 + OAC
- [ ] WAF 속도 제한: IP당 5분 1,000건, 차단
- [ ] CloudFront **압축(Compress objects automatically) 켜기**
- [ ] CloudFront **응답 헤더 정책**: HSTS, X-Content-Type-Options, Referrer-Policy(`strict-origin-when-cross-origin`), 프레임 차단
- [ ] CloudFront **오류 페이지**: 403 · 404 → `/404.html`, 응답 코드 404 (S3는 없는 파일에 403을 줌)
- [ ] 도메인 연결 (ACM 인증서 us-east-1)
- [ ] 올리기: `BUCKET=… DISTRIBUTION_ID=… ./scripts/deploy-pill-check.sh`
  - 버전(`?v=`, `sw.js` VERSION)은 스크립트가 자동으로 바꿔요. 손으로 안 바꿔도 돼요.
  - 캐시: html · sw.js · manifest는 매번 새로, css · js · 글꼴은 1년, 그림은 하루

## 2. 도메인 정해지면 채울 곳
- [ ] `index.html`: `<link rel="canonical">`, `og:url`, `og:image`(`https://도메인/images/og-image.png`) 추가
- [ ] `robots.txt`: `Sitemap:` 줄 주석 풀기
- [ ] `sitemap.xml`: `https://도메인/` 바꾸기
- [ ] 카톡 공유 미리보기 확인 (안 바뀌면 카카오 공유 디버거에서 캐시 지우기)

## 3. 알림 서버 (선택)
- [ ] `services/pill-push/README.md` 순서대로 `sam deploy`
- [ ] `js/main.js` 의 `PUSH` 에 공개 키와 주소 넣기
- [ ] 알림 서버 주소는 WAF 보호를 못 받아요 (HTTP API는 WAF 미지원). 지금은 초당 10건 제한만 있어요. 이용자가 많아지면 REST API + WAF로 바꾸는 것을 고려

## 4. GitHub Pages 쪽 정리 (오픈하는 날)
- [ ] `projects/pill-check/` 를 "새 주소로 옮겼어요" 안내 페이지로 바꾸거나, Pages에서 이 폴더가 안 보이게 하기
  - 그대로 두면 github.io 주소로 쓰는 사람의 기록이 따로 저장되고, 검색에도 두 개가 잡혀요
- [ ] 포트폴리오 카드 링크를 새 주소로

## 5. 오픈 전 확인
- [ ] 상표 확인: 키프리스(kipris.or.kr)에서 '아 맞다 약' 검색
- [ ] 개인정보처리방침 · 이용약관 시행일을 오픈 날짜로, 전문가 확인
- [ ] 실제 기기: 아이폰 사파리(홈 화면 추가 포함), 삼성 인터넷, 크롬
- [ ] 어르신 3~5명 직접 사용 테스트

## 지금까지 점검 결과 (2026-11-06, 로컬)
- Lighthouse(모바일): 접근성 100 · SEO 100 · 권장사항 100 · 성능 78~91 (로컬 서버라 압축 없음 → CloudFront 압축 켜면 더 좋아짐)
- 320px 폭, 화면 200% 확대, 글자 200% 확대: 가로로 넘치는 곳 없음
