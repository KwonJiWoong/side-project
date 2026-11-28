# 소소한 일상의 이벤트 — 호스팅 · 배포

서버 코드는 없다. Vite로 빌드한 정적 파일(`dist/`)을 자체 도메인에 올린다. 공통 규칙은 `docs/CODING_GUIDE.md` 9장.

## 1. 구성
| 항목 | 내용 |
|---|---|
| 호스팅 | `tinyevent.kr` + S3(퍼블릭 차단) + CloudFront(OAC) + WAF |
| 배포 | AWS CodeBuild `tinyevent-kr-deploy`가 공개 저장소를 받아 `scripts/deploy-daily-event.sh` 실행 (GitHub Actions에 AWS 권한 주지 않음) |
| GitHub Pages | 쓰지 않음. 저장소의 이 폴더는 빌드 전 원본이라 Pages 주소로는 열리지 않음 |
| 광고 | 도메인 맨 위 `/ads.txt` (빌드하면 `dist/ads.txt`) |

- 사이트를 도메인 **맨 위**(`https://도메인/`)에 둔다. `index.html`의 파비콘·manifest 경로가 `/`로 시작한다
- CloudFront: 자동 압축 켜기, 인증서 ACM `us-east-1`. 한 페이지 서비스라 다른 주소로 돌려보내는 설정은 필요 없음

## 2. 만들어 둔 AWS 자원 (계정 843012954327)
| 자원 | 값 |
|---|---|
| 도메인 | `tinyevent.kr` (가비아 구입, 네임서버는 Route 53 4개) |
| Route 53 호스팅 영역 | `Z05973113A0MFGKZYQQLG` (A · AAAA 별칭 → CloudFront, `www` 포함) |
| 인증서 (ACM `us-east-1`) | `tinyevent.kr`, `www.tinyevent.kr` |
| S3 버킷 | `tinyevent-kr-site-843012954327` (**시드니 `ap-southeast-2`**) |
| CloudFront | `EDYZ0WUAEAW9V` (`d3uh08kg7phe8.cloudfront.net`), OAC `E306CHNDATTFJI` |
| WAF | `tinyevent-kr-waf` — IP당 5분 1000회 넘으면 차단 |
| CloudFront 함수 | `tinyevent-kr-www-redirect` — `www.tinyevent.kr` → `tinyevent.kr` 301 |
| 오류 화면 | 403 · 404 → `/404.html` (응답 코드 404) |
| CodeBuild | `tinyevent-kr-deploy` (시드니), 역할 `tinyevent-kr-codebuild-role` (이 버킷 쓰기 + 캐시 비우기만) |

- 조직 SCP가 지역을 제한해서 S3 · CodeBuild는 **시드니만** 된다 (서울 불가). CloudFront가 앞에 있어 속도 차이는 거의 없음

## 3. 배포
1. 바뀐 내용을 `feature/daily-event` 브랜치(머지 뒤엔 `main`)에 push
2. AWS 콘솔 → CodeBuild(시드니) → `tinyevent-kr-deploy` → **빌드 시작**
   - 머지 뒤에는 프로젝트의 소스 버전을 `main`으로 바꾼다
3. 1~2분 뒤 `https://tinyevent.kr` 확인

본인 컴퓨터에서 올릴 때:

```bash
aws configure   # 처음 한 번 (지역 ap-southeast-2)
BUCKET=tinyevent-kr-site-843012954327 DISTRIBUTION_ID=EDYZ0WUAEAW9V ./scripts/deploy-daily-event.sh
```

4. Google Search Console · 네이버 서치어드바이저에 sitemap 제출 (처음 한 번)

## 4. 캐시
| 파일 | 보관 |
|---|---|
| `assets/*` (이름에 해시) | 1년, immutable |
| `images/*` | 하루 |
| html, `data/events.json`, txt, manifest | 매번 새로 받음 (`no-cache`) |

## 5. 주의
- **localStorage는 도메인마다 따로다.** 도메인을 옮기면 이용자 기록이 따라가지 않으니 처음부터 최종 도메인으로 연다
- 이벤트 목록(`events.json`)만 고쳐도 다시 빌드 · 배포해야 반영된다
