/* 광고 자리 (구글 애드센스)
   - 도장판 아래 한 곳에만 씀. 뽑기·타이머 버튼 근처에는 넣지 않음 (잘못 누르기 쉬움)
   - ADS.client · ADS.slots 를 채우고, 사이트 주소가 ADS.domain 일 때만 광고가 보임
     (비어 있으면 광고 자리는 숨겨진 채로 아무것도 불러오지 않음)
   - 자동 광고(화면 아래 고정 · 전면 광고)는 코드에서 막아 둠. 애드센스 화면에서도 꺼 둘 것 */
(() => {
  'use strict';
  const ADS = {
    client: '',          /* 예: 'ca-pub-1234567890123456' */
    domain: '',          /* 예: 'ddanjit.com' (www 포함 여부 상관없음) */
    slots: {             /* 애드센스에서 만든 '디스플레이 광고' 단위 ID */
      bottom: ''
    }
  };

  const host = location.hostname.replace(/^www\./, '');
  if (!ADS.client || !ADS.domain || host !== ADS.domain.replace(/^www\./, '')) return;

  function start() {
    const boxes = Array.from(document.querySelectorAll('[data-ad]')).filter((el) => ADS.slots[el.dataset.ad]);
    if (!boxes.length) return;

    window.adsbygoogle = window.adsbygoogle || [];
    const script = document.createElement('script');
    script.async = true;
    /* client를 주소에 붙이지 않아야 자동 광고가 켜지지 않음. 정해 둔 자리에만 광고 */
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);

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
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
