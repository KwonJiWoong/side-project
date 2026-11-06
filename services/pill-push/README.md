# 아 맞다 약! 웹 푸시 알림 서버

정한 시각에 "아침 약 드실 시간이에요" 알림을 보내는 서버예요. 사이트(`projects/pill-check`)와 따로, AWS에 올려요.

## 구성

```
휴대폰 ──(알림 받기)──▶ API Gateway ─▶ ApiFunction ─▶ DynamoDB
                                                         ▲
EventBridge Scheduler (5분마다) ─▶ SenderFunction ───────┘
                                       │
                                       └─▶ 구글 · 애플 등 푸시 서비스 ─▶ 휴대폰
```

| 이름 | 하는 일 |
|---|---|
| `src/api.mjs` | `POST /push` 구독 저장 · 갱신 · 해지 |
| `src/sender.mjs` | 5분마다 지금 시각에 먹을 약이 있는 사람에게 알림 |
| `src/schedule.mjs` | 먹는 날 계산 (사이트와 같은 규칙), 입력 검사 |
| `src/db.mjs` | DynamoDB 읽기 · 쓰기 |
| `template.yaml` | AWS에 한 번에 만드는 설정 (SAM) |

### 저장하는 것 / 안 하는 것
- 저장: 알림 주소, 시간대별 먹는 시각, 먹는 날 규칙(요일 · 며칠마다 · 끝나는 날), 시간대
- 안 함: 약 이름, 메모, 먹은 기록, 몸 상태
- 알림을 끄면 바로 지우고, 90일 동안 갱신이 없으면 자동 삭제(사이트가 7일마다 갱신)
- 실행 기록(CloudWatch)은 14일만, 숫자만 남김

## 올리는 순서

### 1. 준비 (한 번만)
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html), [SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html), Node.js 22 설치
- `aws configure` 로 로그인 (리전: `ap-northeast-2` 서울)

### 2. VAPID 키 만들기 (한 번만)
```bash
cd services/pill-push/src
npm install
npx web-push generate-vapid-keys
```
나온 **Public Key / Private Key**를 적어 두세요. Private Key는 저장소 · 카톡 등에 올리지 마세요.
키를 바꾸면 기존 구독이 모두 끊기니, 한 번 정하면 계속 쓰세요.

### 3. 올리기
```bash
cd services/pill-push
sam build
sam deploy --guided
```
물어보는 값:

| 항목 | 넣을 값 |
|---|---|
| Stack Name | `pill-push` |
| AWS Region | `ap-northeast-2` |
| SiteOrigin | 사이트 주소, 끝에 `/` 없이 (예: `https://example.com`) |
| VapidPublicKey | 2번의 Public Key |
| VapidPrivateKey | 2번의 Private Key |
| VapidSubject | 그대로 엔터 (`mailto:kjobaba@naver.com`) |
| 나머지 | 엔터 (기본값), `ApiFunction has no authentication` 질문은 `y` |

끝나면 **Outputs**에 `PushEndpoint` 주소가 나와요.

### 4. 사이트에 연결
`projects/pill-check/js/main.js` 에서:
```js
const PUSH = { publicKey: '2번 Public Key', endpoint: '3번 PushEndpoint' };
```
그리고 `?v=` 버전 숫자와 `sw.js` 의 `VERSION` 을 올린 뒤 S3에 다시 올리면, [먹는 시각] 화면에 **알림 받기** 버튼이 나타나요.

### 5. 확인
- 안드로이드 크롬: 사이트 → 먹는 시각 → 알림 받기 → 시각을 5분 뒤로 저장 → 알림 오는지
- 아이폰: iOS 16.4 이상, **홈 화면에 추가한 앱**에서만 알림 가능
- 보낸 결과: AWS 콘솔 → CloudWatch → `/aws/lambda/pill-push-SenderFunction-…` 에서 `{"sent":1}` 같은 기록

## 고칠 때
```bash
cd services/pill-push/src && npm test     # 일정 계산 · 입력 검사 · 흐름 테스트
cd .. && sam build && sam deploy          # 다시 올리기 (두 번째부터는 --guided 없이)
```
먹는 날 규칙을 바꾸면 사이트 `js/main.js` 의 `isDue` 와 `src/schedule.mjs` 의 `isDue` 를 **같이** 고치세요.

## 비용 (참고)
사용자 수천 명까지는 대부분 무료 범위예요.
- Lambda · DynamoDB · EventBridge Scheduler: 상시 무료 한도 안
- API Gateway(HTTP API): 첫 12개월 무료, 이후 100만 건당 약 $1
- 5분마다 실행 = 한 달 약 8,640번

## 알아 둘 한계
- 이미 약을 먹었어도 알림이 와요 (먹은 기록은 휴대폰에만 있어서)
- 서머타임이 있는 나라는 시간이 바뀐 뒤 사이트를 한 번 열어야 시각이 맞춰져요 (한국은 해당 없음)
- 알림은 정한 시각부터 최대 5분 늦게 올 수 있어요
