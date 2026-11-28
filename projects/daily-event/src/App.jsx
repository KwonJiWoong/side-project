import { useCallback, useEffect, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import Tabs from './components/Tabs.jsx';
import TypePicker from './components/TypePicker.jsx';
import TodayPanel from './components/TodayPanel.jsx';
import CalendarPanel from './components/CalendarPanel.jsx';
import HandoffCard from './components/HandoffCard.jsx';
import AdSlot from './components/AdSlot.jsx';
import Faq from './components/Faq.jsx';
import Footer from './components/Footer.jsx';
import Icon from './components/Icon.jsx';
import TestBar from './components/TestBar.jsx';
import Intro from './components/Intro.jsx';
import { loadData, saveData, storageAvailable } from './lib/storage.js';
import { THEME } from './config.js';
import { pickEvent } from './lib/pick.js';
import { addDays, toKey } from './lib/date.js';

const canStore = storageAvailable();
const TEST_KEY = 'daily-event-test-offset';
const isTest = () => location.hash === '#test' || new URLSearchParams(location.search).has('test');
const readOffset = () => {
  try { return Number(localStorage.getItem(TEST_KEY)) || 0; } catch { return 0; }
};

export default function App() {
  const [data, setData] = useState(loadData);
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('loading'); /* loading | ready | error */
  /* 테스트 모드: 가상 날짜(실제 + offset일) */
  const [testMode, setTestMode] = useState(isTest);
  const [offset, setOffset] = useState(() => (isTest() ? readOffset() : 0));
  const offsetRef = useRef(offset);
  const realToday = () => addDays(toKey(new Date()), offsetRef.current);
  const [today, setToday] = useState(realToday);
  const [tab, setTab] = useState('today');
  const [picking, setPicking] = useState(!data.type);
  const [preview, setPreview] = useState(null);
  const [notice, setNotice] = useState('');
  const headingRef = useRef(null);
  const moved = useRef(false);

  /* 초대장 목록 불러오기 */
  const loadEvents = useCallback(() => {
    setStatus('loading');
    fetch('./data/events.json')
      .then((res) => {
        if (!res.ok) throw new Error(res.status);
        return res.json();
      })
      .then((json) => {
        setEvents(json.events);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  useEffect(loadEvents, [loadEvents]);

  /* 기록 저장 */
  useEffect(() => {
    if (canStore) saveData(data);
  }, [data]);

  /* 자정이 지나거나 다시 화면으로 돌아오면 날짜 다시 확인 */
  useEffect(() => {
    const check = () => setToday(realToday());
    const timer = setInterval(check, 60000);
    document.addEventListener('visibilitychange', check);
    window.addEventListener('focus', check);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('focus', check);
    };
  }, []);

  /* 테스트 모드 켜고 끄기 (#test) */
  useEffect(() => {
    const on = () => {
      const t = isTest();
      setTestMode(t);
      offsetRef.current = t ? readOffset() : 0;
      setOffset(offsetRef.current);
      setToday(realToday());
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  const changeOffset = (n) => {
    offsetRef.current = n;
    try { localStorage.setItem(TEST_KEY, String(n)); } catch { /* 저장 못 해도 이번 화면에서는 동작 */ }
    setOffset(n);
    setToday(realToday());
    setTab('today');
  };

  /* 화면 테마: html[data-theme] */
  const theme = THEME.switchable && ['pastel', 'airmail'].includes(data.theme) ? data.theme : THEME.default;
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'pastel' ? '#f6e7e1' : '#24407a';
  }, [theme]);
  const chooseTheme = THEME.switchable ? (id) => setData((prev) => ({ ...prev, theme: id })) : null;

  /* 유형 색: html[data-type] (고르는 중에는 미리보기 색) */
  const shownType = picking ? preview ?? data.type : data.type;
  useEffect(() => {
    const root = document.documentElement;
    if (shownType) root.dataset.type = shownType;
    else delete root.dataset.type;
  }, [shownType]);

  const showIntro = !data.type && !data.introSeen;

  /* 화면이 바뀌면 그 화면 제목으로 포커스 */
  useEffect(() => {
    if (!moved.current) return;
    headingRef.current?.focus();
  }, [tab, picking, showIntro]);

  const go = (next) => {
    moved.current = true;
    next();
  };

  /* 첫 방문: 소개 편지 → 유형 고르기 */
  const startFromIntro = () => {
    setData((prev) => ({ ...prev, introSeen: true }));
    go(() => setPicking(true));
  };

  const record = data.days[today];
  const updateToday = (patch) => {
    setData((prev) => ({
      ...prev,
      days: { ...prev.days, [today]: { ...prev.days[today], ...patch } }
    }));
  };

  /* 유형 고르기 */
  const chooseType = (type) => {
    setData((prev) => {
      const rec = prev.days[today];
      const days = { ...prev.days };
      /* 소인을 안 찍은 오늘 초대장은 새 유형으로 다시 받음 */
      if (rec && !rec.done && rec.type !== type) delete days[today];
      return { ...prev, type, days };
    });
    setPreview(null);
    go(() => {
      setPicking(false);
      setTab('today');
    });
  };

  /* 봉투 열기: 이때 오늘의 초대장이 정해짐 */
  const openInvite = () => {
    const ev = pickEvent(events, data.type, today, data.days);
    if (!ev) return;
    updateToday({ type: data.type, eventId: ev.id, opened: true });
    setNotice(`오늘의 초대장을 열었어요. ${ev.title}`);
  };

  const swapInvite = () => {
    if (!record || record.swapped) return;
    const ev = pickEvent(events, data.type, today, data.days, [record.eventId]);
    if (!ev) return;
    updateToday({ firstId: record.eventId, eventId: ev.id, swapped: true });
    setNotice(`다른 초대장으로 바꿨어요. ${ev.title}`);
  };

  const acceptInvite = () => {
    updateToday({ accepted: true });
    setNotice('도전을 시작했어요. 해내면 소인을 찍어 주세요.');
  };

  const toggleStamp = () => {
    const done = !record?.done;
    updateToday({ done });
    setNotice(done ? '오늘의 소인을 찍었어요.' : '소인을 취소했어요.');
  };

  const changeMemo = (memo) => updateToday({ memo });

  const closeHandoff = () => setData((prev) => ({ ...prev, handoffClosed: true }));

  const number = Object.values(data.days).filter((r) => r.opened).length || 1;
  const todayEvent = record?.eventId ? events.find((ev) => ev.id === record.eventId) : null;

  /* 첫 방문: 화면 전체를 덮는 소개 편지 */
  if (showIntro) return <Intro headingRef={headingRef} onStart={startFromIntro} theme={theme} onTheme={chooseTheme} />;

  return (
    <>
      <Header
        type={data.type}
        picking={picking}
        onChangeType={() => go(() => setPicking(true))}
      />
      {!picking && data.type && (
        <Tabs tab={tab} onChange={(next) => go(() => setTab(next))} />
      )}

      <main id="main" className="main" tabIndex={-1}>
        <div className="container">
          {!canStore && (
            <p className="notice notice--warn" role="status">
              <Icon name="i-info" />
              <span>이 브라우저에서는 기록이 저장되지 않아요. 초대장은 그대로 볼 수 있어요.</span>
            </p>
          )}

          {testMode && (
            <TestBar
              today={today}
              offset={offset}
              onNextDay={() => changeOffset(offset + 1)}
              onRealDay={() => changeOffset(0)}
              onResetToday={() => {
                setData((prev) => {
                  const days = { ...prev.days };
                  delete days[today];
                  return { ...prev, days };
                });
                setTab('today');
                setNotice('오늘 기록을 지웠어요. 봉투부터 다시 시작해요.');
              }}
              onResetAll={() => {
                setData((prev) => ({ v: 1, type: null, days: {}, handoffClosed: false, introSeen: false, theme: prev.theme }));
                changeOffset(0);
                setPicking(true);
                setNotice('모든 기록을 지웠어요.');
              }}
            />
          )}

          {!picking && !showIntro && !data.handoffClosed && <HandoffCard onClose={closeHandoff} />}

          {picking ? (
            <TypePicker
              headingRef={headingRef}
              current={data.type}
              theme={theme}
              onTheme={chooseTheme}
              onPreview={setPreview}
              onChoose={chooseType}
              onCancel={() => {
                setPreview(null);
                go(() => setPicking(false));
              }}
            />
          ) : tab === 'today' ? (
            <TodayPanel
              headingRef={headingRef}
              today={today}
              type={data.type}
              status={status}
              record={record}
              event={todayEvent}
              number={number}
              onRetry={loadEvents}
              onOpen={openInvite}
              onSwap={swapInvite}
              onAccept={acceptInvite}
              onStamp={toggleStamp}
              onMemo={changeMemo}
              onCalendar={() => go(() => setTab('calendar'))}
            />
          ) : (
            <CalendarPanel
              headingRef={headingRef}
              today={today}
              days={data.days}
              events={events}
              onToday={() => go(() => setTab('today'))}
            />
          )}

          {!picking && !showIntro && <AdSlot name="bottom" />}
          <Faq />
          <p className="sr-only" role="status">{notice}</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
