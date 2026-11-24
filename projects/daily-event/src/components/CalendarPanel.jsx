import { useMemo, useState } from 'react';
import Icon from './Icon.jsx';
import { WEEKDAYS, fromKey, monthWeeks } from '../lib/date.js';

/* 월간 이벤트 달력 */
export default function CalendarPanel({ headingRef, today, days, events, onToday }) {
  const now = fromKey(today);
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [sel, setSel] = useState(today);

  const weeks = useMemo(() => monthWeeks(view.y, view.m), [view]);
  const isThisMonth = view.y === now.getFullYear() && view.m === now.getMonth();
  const eventOf = (rec) => (rec?.eventId ? events.find((ev) => ev.id === rec.eventId) : null);

  /* 이번 달 요약 */
  const doneKeys = weeks.flat().filter((key) => key && days[key]?.done);
  const topCategory = useMemo(() => {
    const count = {};
    doneKeys.forEach((key) => {
      const ev = eventOf(days[key]);
      if (ev) count[ev.category] = (count[ev.category] || 0) + 1;
    });
    const top = Object.entries(count).sort((a, b) => b[1] - a[1])[0];
    return top ? top[0] : '—';
  }, [doneKeys.join(), events]);

  const move = (diff) => {
    const d = new Date(view.y, view.m + diff, 1);
    setView({ y: d.getFullYear(), m: d.getMonth() });
  };

  /* 고른 날 상세 */
  const selRec = days[sel];
  const selEv = eventOf(selRec);
  const selDate = fromKey(sel);
  let detail;
  if (selRec?.done && selEv) detail = { title: `${selDate.getMonth() + 1}월 ${selDate.getDate()}일 · 완료`, ev: selEv.title, memo: selRec.memo ? `“${selRec.memo}”` : '한 줄 기록 없음', done: true };
  else if (sel === today) detail = { title: `${selDate.getMonth() + 1}월 ${selDate.getDate()}일 · 오늘`, ev: selEv ? selEv.title : '아직 초대장을 열지 않았어요', memo: selEv ? '소인을 찍으면 달력에 표시돼요' : '' };
  else if (sel > today) detail = { title: `${selDate.getMonth() + 1}월 ${selDate.getDate()}일`, ev: '아직 오지 않은 날이에요', memo: '' };
  else detail = { title: `${selDate.getMonth() + 1}월 ${selDate.getDate()}일`, ev: selEv ? selEv.title : '이날은 기록이 없어요', memo: selEv ? '이날은 소인이 없어요' : '' };

  return (
    <section className="calendar" aria-labelledby="calendarTitle">
      <h2 className="calendar__title" id="calendarTitle" ref={headingRef} tabIndex={-1}>
        {view.m + 1}월의 이벤트
      </h2>

      <dl className="calendar__stats">
        <div className="calendar__stat">
          <dt className="calendar__stat-label">완료한 날</dt>
          <dd className="calendar__stat-value">{doneKeys.length}일</dd>
        </div>
        <div className="calendar__stat">
          <dt className="calendar__stat-label">가장 많이 한 분류</dt>
          <dd className="calendar__stat-value calendar__stat-value--text">{topCategory}</dd>
        </div>
      </dl>

      <div className="month">
        <div className="month__head">
          <button type="button" className="btn btn--icon" onClick={() => move(-1)} aria-label="이전 달">
            <Icon name="i-prev" />
          </button>
          <p className="month__name" aria-live="polite">{view.y}년 {view.m + 1}월</p>
          <button type="button" className="btn btn--icon" onClick={() => move(1)} aria-label="다음 달" disabled={isThisMonth}>
            <Icon name="i-next" />
          </button>
        </div>

        <table className="month__table">
          <caption className="sr-only">{view.y}년 {view.m + 1}월 이벤트 달력. 날짜를 누르면 그날 기록이 아래에 나와요.</caption>
          <thead>
            <tr>
              {WEEKDAYS.map((w) => <th key={w} scope="col" className="month__weekday">{w}</th>)}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, i) => (
              <tr key={i}>
                {week.map((key, j) => {
                  if (!key) return <td key={j} className="month__cell" />;
                  const rec = days[key];
                  const done = !!rec?.done;
                  const isToday = key === today;
                  const n = fromKey(key).getDate();
                  const label = `${view.m + 1}월 ${n}일${done ? ', 완료' : ''}${isToday ? ', 오늘' : ''}`;
                  const cls = ['month__day', done && 'month__day--done', isToday && 'month__day--today'].filter(Boolean).join(' ');
                  return (
                    <td key={j} className="month__cell">
                      <button type="button" className={cls} aria-label={label} aria-pressed={sel === key ? 'true' : 'false'} onClick={() => setSel(key)}>
                        {n}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        <ul className="month__legend" aria-label="달력 표시">
          <li className="month__legend-item"><span className="month__legend-mark month__legend-mark--done" aria-hidden="true" />완료 소인</li>
          <li className="month__legend-item"><span className="month__legend-mark month__legend-mark--today" aria-hidden="true" />오늘</li>
        </ul>
      </div>

      {doneKeys.length === 0 && isThisMonth ? (
        <div className="empty empty--small">
          <span className="empty__ring" aria-hidden="true" />
          <h3 className="empty__title">이번 달 첫 소인을 찍어 보세요</h3>
          <button type="button" className="btn" onClick={onToday}>
            <Icon name="i-mail" />
            오늘의 초대장 보기
          </button>
        </div>
      ) : (
        <section className="day-detail" aria-labelledby="dayTitle" aria-live="polite">
          <h3 className={`day-detail__title${detail.done ? ' day-detail__title--done' : ''}`} id="dayTitle">{detail.title}</h3>
          <p className="day-detail__event">{detail.ev}</p>
          {detail.memo && <p className="day-detail__memo">{detail.memo}</p>}
        </section>
      )}

      <p className="notice">
        <Icon name="i-info" />
        <span>기록은 이 기기 브라우저에만 저장돼요. 브라우저 데이터를 지우면 사라져요.</span>
      </p>
    </section>
  );
}
