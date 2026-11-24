import { useEffect, useRef } from 'react';
import { ADS } from '../config.js';

/* 광고 자리 (구글 애드센스)
   - 화면 아래 한 곳에만. 주요 버튼 근처에는 넣지 않음
   - ADS.client · domain · slots를 채우고, 사이트 주소가 domain일 때만 보임 (비어 있으면 아무것도 안 그림)
   - 자동 광고(아래 고정 · 전면)는 켜지 않음. 애드센스 화면에서도 꺼 둘 것 */
let scriptAdded = false;

function enabled(name) {
  const host = location.hostname.replace(/^www\./, '');
  return Boolean(ADS.client && ADS.domain && ADS.slots[name] && host === ADS.domain.replace(/^www\./, ''));
}

export default function AdSlot({ name }) {
  const boxRef = useRef(null);
  const on = enabled(name);

  useEffect(() => {
    if (!on || !boxRef.current || boxRef.current.childElementCount) return;
    if (!scriptAdded) {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
      scriptAdded = true;
    }
    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle ad__unit';
    ins.dataset.adClient = ADS.client;
    ins.dataset.adSlot = ADS.slots[name];
    ins.dataset.adFormat = 'auto';
    ins.dataset.fullWidthResponsive = 'true';
    boxRef.current.appendChild(ins);
    window.adsbygoogle = window.adsbygoogle || [];
    try { window.adsbygoogle.push({}); } catch { /* 광고를 못 불러와도 화면은 그대로 */ }
  }, [on, name]);

  if (!on) return null;
  return (
    <aside className="ad" aria-label="광고">
      <p className="ad__label">광고</p>
      <div className="ad__box" ref={boxRef} />
    </aside>
  );
}
