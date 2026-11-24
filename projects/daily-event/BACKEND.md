# 소소한 일상의 이벤트 — 호스팅 · 배포

서버 코드는 없다. Vite로 빌드한 정적 파일(`dist/`)을 자체 도메인에 올린다. 공통 규칙은 `docs/CODING_GUIDE.md` 9장.

## 1. 구성
| 항목 | 내용 |
|---|---|
| 호스팅 | 자체 도메인 + S3(퍼블릭 차단) + CloudFront(OAC) + WAF |
| 배포 | 본인 컴퓨터에서 `scripts/deploy-daily-event.sh` (GitHub Actions에 AWS 권한 주지 않음) |
| GitHub Pages | 쓰지 않음. 저장소의 이 폴더는 빌드 전 원본이라 Pages 주소로는 열리지 않음 |
| 광고 | 도메인 맨 위 `/ads.txt` (빌드하면 `dist/ads.txt`) |

- 사이트를 도메인 **맨 위**(`https://도메인/`)에 둔다. `index.html`의 파비콘·manifest 경로가 `/`로 시작한다
- CloudFront: 자동 압축 켜기, 인증서 ACM `us-east-1`. 한 페이지 서비스라 다른 주소로 돌려보내는 설정은 필요 없음

## 2. 처음 올리기
1. S3 버킷 · CloudFront 배포 · 도메인 연결 (pill-check와 같은 방식, `scripts/LAUNCH-pill-check.md` 참고)
2. `src/config.js`의 `SITE.url` 채우기 → `npm run qr`
3. `public/robots.txt` Sitemap 줄, `public/sitemap.xml` 만들기
4. 배포:

```bash
aws configure   # 처음 한 번
BUCKET=버킷-이름 DISTRIBUTION_ID=E123ABC ./scripts/deploy-daily-event.sh
```

5. Google Search Console · 네이버 서치어드바이저에 sitemap 제출

## 3. 캐시
| 파일 | 보관 |
|---|---|
| `assets/*` (이름에 해시) | 1년, immutable |
| `images/*` | 하루 |
| html, `data/events.json`, txt, manifest | 매번 새로 받음 (`no-cache`) |

## 4. 주의
- **localStorage는 도메인마다 따로다.** 도메인을 옮기면 이용자 기록이 따라가지 않으니 처음부터 최종 도메인으로 연다
- 이벤트 목록(`events.json`)만 고쳐도 다시 빌드 · 배포해야 반영된다
