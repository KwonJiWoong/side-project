/* 완료 소인 (찍기 전에는 점선 자리) */
export default function StampMark({ done, dateText, fresh }) {
  if (!done) {
    return <div className="stamp stamp--empty"><span className="stamp__empty-text">소인 자리</span></div>;
  }
  return (
    <div className={`stamp${fresh ? ' stamp--fresh' : ''}`}>
      <div className="stamp__ring">
        <span className="stamp__office">일상 우체국</span>
        <span className="stamp__date">{dateText}</span>
        <span className="stamp__word">완료</span>
      </div>
    </div>
  );
}
