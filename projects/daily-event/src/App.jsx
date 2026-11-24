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
import { loadData, saveData, storageAvailable } from './lib/storage.js';
import { pickEvent } from './lib/pick.js';
import { toKey } from './lib/date.js';

const canStore = storageAvailable();

export default function App() {
  const [data, setData] = useState(loadData);
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('loading'); /* loading | ready | error */
  const [today, setToday] = useState(() => toKey(new Date()));
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
    const check = () => setToday(toKey(new Date()));
    const timer = setInterval(check, 60000);
    document.addEventListener('visibilitychange', check);
    window.addEventListener('focus', check);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('focus', check);
    };
  }, []);

  /* 유형 색: html[data-type] (고르는 중에는 미리보기 색) */
  const shownType = picking ? preview ?? data.type : data.type;
  useEffect(() => {
    const root = document.documentElement;
    if (shownType) root.dataset.type = shownType;
    else delete root.dataset.type;
  }, [shownType]);

  /* 화면이 바뀌면 그 화면 제목으로 포커스 */
  useEffect(() => {
    if (!moved.current) return;
    headingRef.current?.focus();
  }, [tab, picking]);

  const go = (next) => {
    moved.current = true;
    next();
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

          {!picking && !data.handoffClosed && <HandoffCard onClose={closeHandoff} />}

          {picking ? (
            <TypePicker
              headingRef={headingRef}
              current={data.type}
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

          {!picking && <AdSlot name="bottom" />}
          <Faq />
          <p className="sr-only" role="status">{notice}</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
