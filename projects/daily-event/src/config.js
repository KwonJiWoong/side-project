/* 사이트 설정 — 도메인이 정해지면 여기만 고친다 (README: FRONTEND.md 6장) */
export const SITE = {
  name: '소소한 일상의 이벤트',
  /* 예: 'https://example.com/' (끝에 / 포함). 비어 있으면 canonical·og:url·QR을 만들지 않음 */
  url: ''
};

/* 광고 (구글 애드센스) — 셋 다 채우고, 사이트 주소가 domain일 때만 광고 자리가 보임 */
export const ADS = {
  client: '',   /* 예: 'ca-pub-1234567890123456' */
  domain: '',   /* 예: 'example.com' (www 포함 여부 상관없음) */
  slots: {
    bottom: ''  /* 애드센스 '디스플레이 광고' 단위 ID */
  }
};

/* 화면 테마 — 지금은 파스텔만 보임. 항공우편을 다시 열려면 switchable: true */
export const THEME = {
  default: 'pastel',  /* 'pastel' | 'airmail' */
  switchable: false   /* true면 소개 편지 · 유형 고르기에 테마 고르기가 나타남 */
};
