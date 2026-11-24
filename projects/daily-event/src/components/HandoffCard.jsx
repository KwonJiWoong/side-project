import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { SITE } from '../config.js';

const QUERY = '(min-width: 1024px), (pointer: fine)';

/* PC에서만: 휴대폰으로 이어서 하기 (QR + 링크 복사) */
export default function HandoffCard({ onClose }) {
  const [show, setShow] = useState(() => window.matchMedia(QUERY).matches);
  const [msg, setMsg] = useState('');
  const [manual, setManual] = useState(false);
  const inputRef = useRef(null);
  const link = SITE.url || `${location.origin}${location.pathname}`;

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const on = () => setShow(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  useEffect(() => {
    if (manual) inputRef.current?.select();
  }, [manual]);

  if (!show) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setMsg('복사했어요. 카카오톡 나와의 채팅 등에 붙여 넣어 휴대폰에서 열어 보세요.');
      setManual(false);
    } catch {
      setMsg('자동으로 복사하지 못했어요. 아래 주소를 직접 복사해 주세요.');
      setManual(true);
    }
  };

  return (
    <section className="handoff" aria-labelledby="handoffTitle">
      {SITE.url && (
        <img className="handoff__qr" src="./images/qr.svg" alt="이 사이트 주소 QR 코드" width="112" height="112" />
      )}
      <div className="handoff__body">
        <h2 className="handoff__title" id="handoffTitle">휴대폰으로 이어서 하기</h2>
        <p className="handoff__desc">
          기록은 이 기기에만 저장돼요. {SITE.url ? '카메라로 QR을 찍거나 ' : ''}링크를 복사해 매일 쓰는 휴대폰에서 열어 보세요.
        </p>
        <div className="handoff__actions">
          <button type="button" className="btn" onClick={copy}>
            <Icon name="i-link" />
            링크 복사
          </button>
        </div>
        {manual && (
          <label className="handoff__manual">
            <span className="sr-only">사이트 주소</span>
            <input ref={inputRef} className="handoff__input" type="text" readOnly value={link} />
          </label>
        )}
        <p className="handoff__msg" role="status">{msg}</p>
      </div>
      <button type="button" className="btn btn--icon handoff__close" onClick={onClose} aria-label="휴대폰 안내 닫기">
        <Icon name="i-close" />
      </button>
    </section>
  );
}
