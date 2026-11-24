import Icon from './Icon.jsx';
import { CATEGORY_ICON, SLOT_NAMES } from '../lib/meta.js';

/* 초대장 카드 (우표 톱니 테두리) */
export default function InviteCard({ event, type, number, entering, titleRef }) {
  const slot = SLOT_NAMES[type]?.[event.slot] ?? '';
  const brave = event.level === '살짝 용기';
  return (
    <article className={`invite${entering ? ' invite--enter' : ''}`} aria-labelledby="inviteTitle">
      <div className="invite__paper">
        <div className="invite__head">
          <div className="invite__heading">
            <p className="invite__label">오늘의 초대장 · 제 {number}호</p>
            <h3 className="invite__title" id="inviteTitle" ref={titleRef} tabIndex={-1}>{event.title}</h3>
          </div>
          <span className="invite__stamp" aria-hidden="true">
            <span className="invite__stamp-inner">
              <Icon name={CATEGORY_ICON[event.category]} className="invite__stamp-ico" />
              <span className="invite__stamp-text">{event.category}</span>
            </span>
          </span>
        </div>
        <p className="invite__desc">{event.desc}</p>
        <ul className="tags" aria-label="초대장 정보">
          <li className="tags__item">{slot}</li>
          <li className="tags__item">{event.category}</li>
          <li className="tags__item">
            {brave && <Icon name="i-star" className="tags__star" />}
            {event.level}
          </li>
        </ul>
        <p className="invite__from">발신: 일상 우체국 · 수신: 오늘의 나</p>
      </div>
    </article>
  );
}
