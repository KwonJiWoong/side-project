/* 광고 자리 (구글 애드센스)
   - 안내 글(도움말 · 식전식후 · 가족 · 잊지 않는 법)에만 씀. 약 화면 · 방침 · 약관 · 404에는 넣지 않음
   - ADS.client · ADS.slots 를 채우고, 사이트 주소가 ADS.domain 일 때만 광고가 보임
     (비어 있으면 광고 자리는 숨겨진 채로 아무것도 불러오지 않음)
   - 애드센스 화면에서 '자동 광고'의 앵커(화면 아래 고정) · 전면 광고는 꺼 둘 것 (어르신이 잘못 누르기 쉬움)
   - 건강 정보 글이라 개인 맞춤 광고는 끄고(비개인 맞춤) 보여 줌 */
(() => {
  'use strict';
  const ADS = {
    client: '',          /* 예: 'ca-pub-1234567890123456' */
    domain: '',          /* 예: 'amatdayak.com' (www 포함 여부 상관없음) */
    nonPersonalized: true,
    slots: {             /* 애드센스에서 만든 '디스플레이 광고' 단위 ID */
      'help-1': '', 'help-2': '',
      'meal-1': '', 'meal-2': '',
      'family-1': '', 'family-2': '',
      'remember-1': '', 'remember-2': ''
    }
  };

  const host = location.hostname.replace(/^www\./, '');
  if (!ADS.client || !ADS.domain || host !== ADS.domain.replace(/^www\./, '')) return;

  const boxes = Array.from(document.querySelectorAll('[data-ad]')).filter((el) => ADS.slots[el.dataset.ad]);
  if (!boxes.length) return;

  window.adsbygoogle = window.adsbygoogle || [];
  if (ADS.nonPersonalized) window.adsbygoogle.requestNonPersonalizedAds = 1;
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(ADS.client);
  s.crossOrigin = 'anonymous';
  document.head.appendChild(s);

  boxes.forEach((box) => {
    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle ad__unit';
    ins.dataset.adClient = ADS.client;
    ins.dataset.adSlot = ADS.slots[box.dataset.ad];
    ins.dataset.adFormat = 'auto';
    ins.dataset.fullWidthResponsive = 'true';
    box.querySelector('.ad__box').appendChild(ins);
    box.hidden = false;
    try { window.adsbygoogle.push({}); } catch (e) { box.hidden = true; }
  });
})();
