import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import Envelope from './Envelope.jsx';
import InviteCard from './InviteCard.jsx';
import StampMark from './StampMark.jsx';
import { formatDot, formatLong } from '../lib/date.js';
import { SLOT_NAMES } from '../lib/meta.js';

const OPEN_MS = 650;
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* 오늘의 초대장: 봉투 → 초대장 → 도전 중(소인 · 한 줄 기록) */
export default function TodayPanel({
  headingRef, today, type, status, record, event, number,
  onRetry, onOpen, onSwap, onAccept, onStamp, onMemo, onCalendar
}) {
  const [opening, setOpening] = useState(false);
  const [entering, setEntering] = useState(false);
  const [freshStamp, setFreshStamp] = useState(false);
  const titleRef = useRef(null);
  const stage = !record?.opened || !event ? 'envelope' : record.accepted ? 'doing' : 'invite';

  /* 봉투 열기 연출 뒤 초대장 */
  const open = () => {
    if (opening) return;
    if (reduced()) {
      onOpen();
      setEntering(true);
      return;
    }
    setOpening(true);
    setTimeout(() => {
      onOpen();
      setOpening(false);
      setEntering(true);
    }, OPEN_MS);
  };

  /* 초대장이 새로 나오면 제목으로 포커스 */
  useEffect(() => {
    if (entering && stage === 'invite') titleRef.current?.focus();
  }, [entering, stage, event?.id]);

  const stamp = () => {
    setFreshStamp(!record?.done);
    onStamp();
  };

  const memo = record?.memo ?? '';

  return (
    <section className="today" aria-labelledby="todayTitle">
      <p className="today__date">{formatLong(today)}</p>
      <h2 className="today__title" id="todayTitle" ref={headingRef} tabIndex={-1}>
        오늘은 어제와<br />딱 하나만 다르게
      </h2>

      {status === 'loading' && stage === 'envelope' && (
        <p className="notice" role="status"><Icon name="i-mail" /><span>초대장을 가져오고 있어요.</span></p>
      )}

      {status === 'error' && (
        <div className="empty">
          <svg className="empty__art" viewBox="0 0 72 52" aria-hidden="true" focusable="false">
            <rect x="2" y="2" width="68" height="48" rx="6" />
            <path d="M2 8l34 22L70 8" />
          </svg>
          <h3 className="empty__title">초대장이 아직 도착하지 않았어요</h3>
          <p className="empty__desc">인터넷 연결을 확인하고 다시 시도해 주세요.</p>
          <button type="button" className="btn btn--primary" onClick={onRetry}>
            <Icon name="i-retry" />
            다시 시도
          </button>
        </div>
      )}

      {status !== 'error' && stage === 'envelope' && (
        <>
          <section className="mailbox" aria-labelledby="mailboxTitle">
            <h3 className="mailbox__title" id="mailboxTitle">
              <span className="mailbox__badge">새 우편</span>
              도착한 초대장 1통
            </h3>
            <Envelope opening={opening} />
            <p className="mailbox__from">발신: 일상 우체국 · 수신: 오늘의 나</p>
          </section>
          <div className="today__actions">
            <button
              type="button"
              className="btn btn--primary btn--block"
              onClick={open}
              disabled={status !== 'ready'}
              aria-describedby="openHint"
            >
              <Icon name="i-open" />
              초대장 열기
            </button>
            <p className="today__hint" id="openHint">하루 1통 · 자정이 지나면 새 초대장이 도착해요</p>
          </div>
        </>
      )}

      {stage === 'invite' && (
        <>
          <InviteCard event={event} type={type} number={number} entering={entering} titleRef={titleRef} />
          <div className="today__actions">
            <button type="button" className="btn btn--primary btn--block" onClick={onAccept}>
              <Icon name="i-check" />
              도전할게요
            </button>
            <button
              type="button"
              className="btn btn--block"
              onClick={() => {
                if (record.swapped) return;
                setEntering(true);
                onSwap();
              }}
              aria-disabled={record.swapped ? 'true' : undefined}
              aria-describedby="swapHint"
            >
              <Icon name="i-change" />
              다른 초대장 받기 (오늘 {record.swapped ? 0 : 1}회 남음)
            </button>
            <p className="today__hint" id="swapHint">
              {record.swapped ? '오늘의 초대장은 이걸로 확정이에요. 내일 새 초대장이 도착해요.' : '하기 어려운 상황이면 한 번 바꿀 수 있어요.'}
            </p>
          </div>
        </>
      )}

      {stage === 'doing' && (
        <>
          <article className="summary" aria-labelledby="summaryTitle">
            <div className="summary__text">
              <p className="summary__label">오늘의 초대장 · {SLOT_NAMES[type]?.[event.slot]}</p>
              <h3 className="summary__title" id="summaryTitle">{event.title}</h3>
            </div>
            <span className={`summary__state${record.done ? ' summary__state--done' : ''}`}>
              {record.done ? <><Icon name="i-check" />완료</> : '도전 중'}
            </span>
          </article>

          <section className="stamp-box" aria-labelledby="stampTitle">
            <h3 className="stamp-box__title" id="stampTitle">
              {record.done ? '오늘의 소인을 찍었어요' : '해냈다면 소인을 찍어 주세요'}
            </h3>
            <StampMark done={record.done} dateText={formatDot(today)} fresh={freshStamp} />
            <button
              type="button"
              className={`btn btn--block${record.done ? '' : ' btn--primary'}`}
              onClick={stamp}
              aria-pressed={record.done ? 'true' : 'false'}
            >
              <Icon name={record.done ? 'i-undo' : 'i-stamp'} />
              {record.done ? '소인 취소하기' : '완료 소인 찍기'}
            </button>
          </section>

          <form className="memo" onSubmit={(e) => e.preventDefault()}>
            <label className="memo__label" htmlFor="memo">
              한 줄 기록 <span className="memo__optional">(선택)</span>
            </label>
            <input
              className="memo__input"
              id="memo"
              type="text"
              maxLength={30}
              value={memo}
              onChange={(e) => onMemo(e.target.value.slice(0, 30))}
              placeholder="예) 몰랐던 빵집을 발견했다"
              aria-describedby="memoCount"
              autoComplete="off"
            />
            <p className={`memo__count${memo.length >= 30 ? ' memo__count--full' : ''}`} id="memoCount">
              {memo.length >= 30 ? '30자까지 쓸 수 있어요 · ' : '쓰는 대로 저장돼요 · '}
              {memo.length} / 30자
            </p>
          </form>

          <button type="button" className="btn btn--block" onClick={onCalendar}>
            <Icon name="i-calendar" />
            달력에서 보기
          </button>
        </>
      )}
    </section>
  );
}
