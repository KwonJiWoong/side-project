/* 봉투 그림 (장식, 옆에 같은 글자가 있어 낭독기에서 숨김) */
export default function Envelope({ opening }) {
  return (
    <div className={`envelope${opening ? ' envelope--opening' : ''}`} aria-hidden="true">
      <svg className="envelope__svg" viewBox="0 0 300 210" focusable="false">
        <rect className="envelope__body" x="6" y="14" width="288" height="190" rx="10" />
        <path className="envelope__fold" d="M8 200 118 112M292 200 182 112" />
        <g className="envelope__flap">
          <path className="envelope__flap-shape" d="M8 18 150 122 292 18" />
          <circle className="envelope__seal" cx="150" cy="122" r="27" />
          <circle className="envelope__seal-ring" cx="150" cy="122" r="19" />
          <path className="envelope__seal-heart" d="m150 131-8.5-8.2a5 5 0 0 1 8.5-6 5 5 0 0 1 8.5 6z" />
        </g>
        <rect className="envelope__stamp-edge" x="226" y="26" width="52" height="62" />
        <rect className="envelope__stamp" x="232" y="32" width="40" height="50" />
        <circle className="envelope__stamp-line" cx="252" cy="50" r="7" />
        <path className="envelope__stamp-line" d="M236 76q10-14 16-6t16-4" />
        <path className="envelope__postmark" d="M196 40q8-6 16 0t16 0M196 52q8-6 16 0t16 0M196 64q8-6 16 0t16 0" />
      </svg>
    </div>
  );
}
