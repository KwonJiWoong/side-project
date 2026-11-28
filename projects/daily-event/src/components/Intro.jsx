import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import ThemeSwitch from './ThemeSwitch.jsx';

/* 첫 방문 소개: 일상 우체국에서 온 편지 (여러 장)
   - 한 장씩 큰 글씨로 한 글자씩 써지고, 다 써지면 [다음 장]
   - 써지는 중에 버튼을 누르면 그 장의 글이 바로 다 보임
   - 낭독기는 장마다 숨긴 전체 글을 읽음 (타자 효과 부분은 aria-hidden)
   - 움직임 줄이기 설정이면 글이 처음부터 다 보임, 반복 · 깜빡임 없음 */
const PAGES = [
  {
    head: '오늘 하루, 어땠어요?',
    body: '어제랑 비슷했다면 괜찮아요. 우리 대부분이 그렇게 하루를 보내고 있으니까요.'
  },
  {
    head: '매일 같은 길, 같은 창밖',
    body: '익숙한 건 편하지만, 가끔은 하루가 조금 아깝게 느껴지기도 하죠.'
  },
  {
    head: '그래서 작은 초대장을 준비했어요',
    body: '한 정거장 먼저 내려 걸어 보기, 안 가본 식당 문 열어 보기. 5분이면 되는 아주 사소한 일들이에요.'
  },
  {
    head: '하루에 딱 한 통',
    body: '해냈다면 소인을 꾹 찍어 주세요. 하나씩 모인 소인은 당신만의 작은 기억이 될 거예요.'
  },
  {
    head: '오늘은 어제와 딱 하나만 다르게',
    body: '가입도 설치도 필요 없어요. 기록은 이 기기에만 조용히 남아요. 우리, 같이 해 볼까요?'
  }
];
const CHAR_MS = 55;
const HEAD_PAUSE_MS = 350;

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const lengthOf = (i) => PAGES[i].head.length + PAGES[i].body.length;

export default function Intro({ headingRef, onStart, theme, onTheme }) {
  const [page, setPage] = useState(0);
  const { head, body } = PAGES[page];
  const total = lengthOf(page);
  const [count, setCount] = useState(() => (reduced() ? total : 0));
  const done = count >= total;
  const last = page === PAGES.length - 1;
  const pageRef = useRef(null);
  const moved = useRef(false);

  /* 한 글자씩: 제목 줄이 끝나면 잠깐 쉼 */
  useEffect(() => {
    if (done) return undefined;
    const wait = count === head.length ? HEAD_PAUSE_MS : CHAR_MS;
    const timer = setTimeout(() => setCount((c) => c + 1), wait);
    return () => clearTimeout(timer);
  }, [count, done, head.length]);

  /* 장이 바뀌면 낭독기 포커스를 새 장 제목으로 */
  useEffect(() => {
    if (!moved.current) return;
    pageRef.current?.focus();
  }, [page]);

  const go = (next) => {
    moved.current = true;
    setPage(next);
    setCount(reduced() ? lengthOf(next) : 0);
  };

  const onNext = () => {
    if (!done) {
      setCount(total);
      return;
    }
    if (last) onStart();
    else go(page + 1);
  };

  /* 편지지를 눌러도 넘어감: 글이 다 써진 뒤에만 (키보드는 아래 버튼으로) */
  const onLetterTap = () => {
    if (!done) return;
    if (last) onStart();
    else go(page + 1);
  };

  const bodyShown = Math.max(0, count - head.length);
  const caretInHead = !done && count < head.length;
  const dots = useMemo(() => PAGES.map((_, i) => i), []);

  return (
    <main className="intro" id="main" tabIndex={-1}>
      <h1 className="sr-only" ref={headingRef} tabIndex={-1}>일상 우체국에서 온 편지</h1>

      <div className="intro__top">
        <p className="intro__brand">
          <Icon name="i-mail" />
          소소한 일상의 이벤트
        </p>
        {onTheme && <ThemeSwitch theme={theme} onTheme={onTheme} className="intro__theme" />}
      </div>

      <article className={`letter${done ? ' letter--ready' : ''}`} aria-label={`편지 ${page + 1}장`} onClick={onLetterTap}>
        {page === 0 && <p className="letter__to">To. 오늘의 나</p>}

        {/* 낭독기용 전체 글 */}
        <h2 className="sr-only" ref={pageRef} tabIndex={-1}>{head}</h2>
        <p className="sr-only">{body}</p>

        {/* 화면용 타자 효과 (아직 안 쓴 글자도 자리를 잡아 둠) */}
        <div className="letter__body" key={page} aria-hidden="true">
          <p className="letter__head">
            <span>{head.slice(0, count)}</span>
            {caretInHead && <span className="letter__caret" />}
            <span className="letter__rest">{head.slice(count)}</span>
          </p>
          <p className="letter__text">
            <span>{body.slice(0, bodyShown)}</span>
            {!done && !caretInHead && <span className="letter__caret" />}
            <span className="letter__rest">{body.slice(bodyShown)}</span>
          </p>
        </div>

        {last && <p className={`letter__from${done ? ' letter__from--show' : ''}`}>From. 일상 우체국</p>}
        {theme === 'pastel' ? (
          <>
            <span className="letter__tape letter__tape--left" aria-hidden="true" />
            <span className="letter__tape letter__tape--right" aria-hidden="true" />
            <svg className="letter__flower" viewBox="0 0 120 150" aria-hidden="true" focusable="false">
              <path className="letter__flower-stem" d="M60 148C58 110 52 80 40 52M58 112c12-16 26-22 38-24M54 90c-12-6-24-6-34-2" />
              <g className="letter__flower-petal">
                <ellipse cx="40" cy="40" rx="9" ry="14" transform="rotate(-20 40 40)" />
                <ellipse cx="28" cy="50" rx="9" ry="14" transform="rotate(-80 28 50)" />
                <ellipse cx="50" cy="52" rx="9" ry="14" transform="rotate(40 50 52)" />
                <ellipse cx="34" cy="62" rx="9" ry="14" transform="rotate(-140 34 62)" />
              </g>
              <circle className="letter__flower-core" cx="38" cy="51" r="6" />
              <g className="letter__flower-berry">
                <circle cx="98" cy="84" r="6" /><circle cx="104" cy="92" r="5" /><circle cx="94" cy="94" r="5" />
              </g>
            </svg>
          </>
        ) : (
          <span className="letter__stamp" aria-hidden="true">
            <Icon name="i-mail" />
          </span>
        )}
      </article>

      <div className="intro__progress">
        <ol className="intro__dots" aria-hidden="true">
          {dots.map((i) => (
            <li key={i} className={`intro__dot${i === page ? ' intro__dot--now' : ''}${i < page ? ' intro__dot--read' : ''}`} />
          ))}
        </ol>
        <p className="intro__count">
          <span className="sr-only">편지 </span>
          {page + 1} / {PAGES.length}
          <span className="sr-only">장</span>
        </p>
      </div>

      <div className="intro__actions">
        {page > 0 && (
          <button type="button" className="btn intro__prev" onClick={() => go(page - 1)}>
            <Icon name="i-prev" />
            이전
          </button>
        )}
        <button type="button" className="btn intro__next" onClick={onNext}>
          {!done ? '글 모두 보기' : last ? '내 하루 고르기' : '다음 장'}
          <Icon name="i-next" />
        </button>
      </div>
    </main>
  );
}
