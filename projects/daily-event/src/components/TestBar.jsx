import Icon from './Icon.jsx';
import { formatLong } from '../lib/date.js';

/* 테스트 모드 (주소 끝 #test 또는 ?test): 날짜 넘기기 · 기록 지우기 */
export default function TestBar({ today, offset, onNextDay, onRealDay, onResetToday, onResetAll }) {
  return (
    <section className="test-bar" aria-labelledby="testTitle">
      <h2 className="test-bar__title" id="testTitle">테스트 모드</h2>
      <p className="test-bar__date">
        {formatLong(today)}
        {offset > 0 && <span className="test-bar__offset"> (실제보다 {offset}일 뒤)</span>}
      </p>
      <div className="test-bar__actions">
        <button type="button" className="btn test-bar__btn" onClick={onNextDay}>
          <Icon name="i-next" />
          다음 날로
        </button>
        <button type="button" className="btn test-bar__btn" onClick={onResetToday}>
          <Icon name="i-retry" />
          오늘 다시 받기
        </button>
        <button type="button" className="btn test-bar__btn" onClick={onRealDay} disabled={offset === 0}>
          <Icon name="i-calendar" />
          실제 날짜로
        </button>
        <button type="button" className="btn test-bar__btn" onClick={onResetAll}>
          <Icon name="i-undo" />
          처음부터
        </button>
      </div>
    </section>
  );
}
