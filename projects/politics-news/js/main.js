// 오늘의 정치 소식 - 기사 불러오기 / 언론사·인물별 보기 / 보기 설정
(() => {
  'use strict';

  /* 기본 요소 */
  const root = document.documentElement;
  const $ = (id) => document.getElementById(id);
  const SIZE_LABELS = ['보통', '크게', '아주 크게'];
  const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
  const PAGE_SIZE = 15;
  const VIEWS = ['news', 'people'];

  const el = {
    title: $('siteTitle'),
    home: $('homeBtn'),
    sizeText: $('sizeText'),
    fontDown: $('fontDown'),
    fontUp: $('fontUp'),
    contrast: $('contrastBtn'),
    updated: $('updatedText'),
    viewBtns: Array.from(document.querySelectorAll('[data-view]')),
    newsPanel: $('newsPanel'),
    newsTitle: $('newsTitle'),
    newsCount: $('newsCount'),
    newsFeed: $('newsFeed'),
    newsMore: $('newsMore'),
    sourceBtns: Array.from(document.querySelectorAll('[data-source]')),
    peoplePanel: $('peoplePanel'),
    peopleTitle: $('peopleTitle'),
    peopleList: $('peopleList'),
    peopleCount: $('peopleCount'),
    peopleFeed: $('peopleFeed'),
    peopleMore: $('peopleMore'),
    errorBox: $('errorBox'),
    errorTitle: $('errorTitle'),
    retry: $('retryBtn'),
    notice: $('notice')
  };

  /* 저장소 */
  const store = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* 무시 */ } }
  };

  /* 상태 */
  const savedSize = Number(store.get('politics-size'));
  const savedView = store.get('politics-view');
  const state = {
    size: Number.isInteger(savedSize) && savedSize >= 0 && savedSize < SIZE_LABELS.length ? savedSize : 0,
    isContrast: store.get('politics-contrast') === '1',
    view: VIEWS.includes(savedView) ? savedView : 'news',
    source: 'all',
    person: 'president',
    shown: { news: PAGE_SIZE, people: PAGE_SIZE },
    data: null,
    isError: false
  };

  /* 알림 */
  let noticeTimer = null;
  function say(message) {
    clearTimeout(noticeTimer);
    el.notice.textContent = '';
    window.requestAnimationFrame(() => { el.notice.textContent = message; });
    noticeTimer = setTimeout(() => { el.notice.textContent = ''; }, 4000);
  }

  /* 도우미 - 날짜 */
  const pad = (n) => (n < 10 ? '0' : '') + n;
  const dayKey = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());

  function dayLabel(d) {
    const today = new Date();
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
    const base = (d.getMonth() + 1) + '월 ' + d.getDate() + '일 ' + DAY_NAMES[d.getDay()] + '요일';
    if (dayKey(d) === dayKey(today)) return '오늘 · ' + base;
    if (dayKey(d) === dayKey(yesterday)) return '어제 · ' + base;
    return base;
  }

  function timeText(d) {
    const h = d.getHours();
    return (h < 12 ? '오전 ' : '오후 ') + (h % 12 === 0 ? 12 : h % 12) + ':' + pad(d.getMinutes());
  }

  /* 도우미 - 데이터 확인 (형식이 틀린 기사는 버림) */
  function cleanData(raw) {
    if (!raw || !Array.isArray(raw.items)) return null;
    const sources = Array.isArray(raw.sources) ? raw.sources : [];
    const people = Array.isArray(raw.people) ? raw.people : [];
    const sourceNames = {};
    sources.forEach((s) => { if (s && typeof s.id === 'string') sourceNames[s.id] = String(s.name || s.id); });

    const items = raw.items.filter((item) => item &&
      typeof item.title === 'string' &&
      typeof item.link === 'string' && /^https?:\/\//.test(item.link) &&
      !Number.isNaN(new Date(item.published).getTime())
    ).map((item) => ({
      title: item.title,
      link: item.link,
      source: String(item.source),
      sourceName: sourceNames[item.source] || '',
      date: new Date(item.published),
      people: Array.isArray(item.people) ? item.people : []
    }));
    items.sort((a, b) => b.date - a.date);

    return {
      updated: raw.updated ? new Date(raw.updated) : null,
      people: people.filter((p) => p && typeof p.id === 'string' && typeof p.name === 'string'),
      items: items
    };
  }

  /* 그리기 - 기사 한 개 */
  function newsItem(item) {
    const li = document.createElement('li');
    li.className = 'news-item';

    const link = document.createElement('a');
    link.className = 'news-item__link';
    link.href = item.link;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    const title = document.createElement('span');
    title.className = 'news-item__title';
    title.textContent = item.title;

    const meta = document.createElement('span');
    meta.className = 'news-item__meta';
    const source = document.createElement('span');
    source.className = 'news-item__source';
    source.textContent = item.sourceName;
    const time = document.createElement('time');
    time.dateTime = item.date.toISOString();
    time.textContent = timeText(item.date);
    const go = document.createElement('span');
    go.className = 'news-item__go';
    go.innerHTML = '<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-out"></use></svg>';
    go.append('기사 읽기');
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = ' (새 창으로 열림)';

    meta.append(source, time, go);
    link.append(title, meta, sr);
    li.append(link);
    return li;
  }

  /* 그리기 - 날짜별로 묶은 목록 */
  function renderFeed(feed, items, limit, emptyText) {
    feed.textContent = '';
    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'feed__empty';
      empty.textContent = emptyText;
      feed.append(empty);
      return;
    }

    let group = null;
    let list = null;
    items.slice(0, limit).forEach((item) => {
      const key = dayKey(item.date);
      if (!group || group.dataset.day !== key) {
        group = document.createElement('section');
        group.className = 'feed__group';
        group.dataset.day = key;
        const head = document.createElement('h3');
        head.className = 'feed__date';
        head.textContent = dayLabel(item.date);
        list = document.createElement('ol');
        list.className = 'feed__list';
        group.append(head, list);
        feed.append(group);
      }
      list.append(newsItem(item));
    });
  }

  /* 그리기 - 인물 버튼 (설정이 바뀌면 데이터에 맞춰 다시 만듦) */
  function renderPeopleButtons() {
    if (!state.data || !state.data.people.length) return;
    if (!state.data.people.some((p) => p.id === state.person)) state.person = state.data.people[0].id;
    el.peopleList.textContent = '';
    state.data.people.forEach((p) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'person';
      btn.dataset.person = p.id;
      const role = document.createElement('span');
      role.className = 'person__role';
      role.textContent = String(p.role || '');
      const name = document.createElement('span');
      name.className = 'person__name';
      name.textContent = p.name;
      btn.append(role, ' ', name);
      li.append(btn);
      el.peopleList.append(li);
    });
  }

  /* 그리기 - 전체 */
  function render() {
    // 보기 설정
    if (state.size > 0) root.setAttribute('data-size', String(state.size));
    else root.removeAttribute('data-size');
    el.sizeText.textContent = SIZE_LABELS[state.size];
    el.fontDown.disabled = state.size === 0;
    el.fontUp.disabled = state.size === SIZE_LABELS.length - 1;
    if (state.isContrast) root.setAttribute('data-contrast', 'high');
    else root.removeAttribute('data-contrast');
    el.contrast.setAttribute('aria-pressed', String(state.isContrast));

    // 보기 고르기
    el.viewBtns.forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.view === state.view)));
    el.sourceBtns.forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.source === state.source)));
    Array.from(el.peopleList.querySelectorAll('[data-person]')).forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.dataset.person === state.person));
    });

    el.errorBox.hidden = !state.isError;
    el.newsPanel.hidden = state.isError || state.view !== 'news';
    el.peoplePanel.hidden = state.isError || state.view !== 'people';
    if (!state.data) return;

    // 업데이트 시각
    const all = state.data.items;
    el.updated.textContent = state.data.updated
      ? '마지막 업데이트: ' + dayLabel(state.data.updated) + ' ' + timeText(state.data.updated)
      : '아직 모은 기사가 없어요. 잠시 뒤 다시 와 주세요.';

    // 언론사별
    const newsItems = state.source === 'all' ? all : all.filter((item) => item.source === state.source);
    renderFeed(el.newsFeed, newsItems, state.shown.news, '이 언론사의 최근 3일 기사가 아직 없어요.');
    el.newsCount.textContent = '기사 ' + newsItems.length + '개 중 ' + Math.min(state.shown.news, newsItems.length) + '개를 보고 있어요.';
    el.newsMore.hidden = newsItems.length <= state.shown.news;

    // 인물별
    const person = state.data.people.find((p) => p.id === state.person);
    const peopleItems = all.filter((item) => item.people.includes(state.person));
    renderFeed(el.peopleFeed, peopleItems, state.shown.people, (person ? person.name : '이 인물') + ' 관련 기사가 최근 3일 동안 없어요.');
    el.peopleCount.textContent = (person ? person.role + ' ' + person.name : '') + ' 관련 기사 ' + peopleItems.length + '개';
    el.peopleMore.hidden = peopleItems.length <= state.shown.people;
  }

  /* 기사 불러오기 */
  function load() {
    el.updated.textContent = '기사를 불러오는 중이에요…';
    return fetch('data/news.json', { cache: 'no-cache' })
      .then((res) => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then((raw) => {
        const data = cleanData(raw);
        if (!data) throw new Error('형식 오류');
        state.data = data;
        state.isError = false;
        renderPeopleButtons();
        render();
      })
      .catch(() => {
        state.isError = true;
        el.updated.textContent = '기사를 불러오지 못했어요.';
        render();
      });
  }

  /* 이벤트 - 보기 설정 */
  function changeSize(step) {
    const next = state.size + step;
    if (next < 0 || next >= SIZE_LABELS.length) return;
    state.size = next;
    store.set('politics-size', String(state.size));
    render();
    say('글자 크기: ' + SIZE_LABELS[state.size]);
  }
  el.fontDown.addEventListener('click', () => changeSize(-1));
  el.fontUp.addEventListener('click', () => changeSize(1));
  el.contrast.addEventListener('click', () => {
    state.isContrast = !state.isContrast;
    store.set('politics-contrast', state.isContrast ? '1' : '0');
    render();
    say(state.isContrast ? '고대비 보기를 켰어요.' : '고대비 보기를 껐어요.');
  });

  /* 이벤트 - 보기 고르기 (바꾸면 그 화면 제목으로 포커스) */
  el.viewBtns.forEach((btn) => btn.addEventListener('click', () => {
    state.view = btn.dataset.view;
    store.set('politics-view', state.view);
    render();
    (state.view === 'news' ? el.newsTitle : el.peopleTitle).focus();
  }));

  /* 이벤트 - 언론사 · 인물 고르기 */
  el.newsPanel.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-source]');
    if (!btn) return;
    state.source = btn.dataset.source;
    state.shown.news = PAGE_SIZE;
    render();
    say(btn.textContent.replace('✓', '').trim() + ' 기사를 보여 드려요.');
  });

  el.peopleList.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-person]');
    if (!btn) return;
    state.person = btn.dataset.person;
    state.shown.people = PAGE_SIZE;
    render();
    say(el.peopleCount.textContent + '를 보여 드려요.');
  });

  /* 이벤트 - 더 보기 (새로 나온 첫 기사로 포커스) */
  function showMore(key, feed) {
    const before = state.shown[key];
    state.shown[key] += PAGE_SIZE;
    render();
    const links = feed.querySelectorAll('.news-item__link');
    if (links[before]) links[before].focus();
  }
  el.newsMore.addEventListener('click', () => showMore('news', el.newsFeed));
  el.peopleMore.addEventListener('click', () => showMore('people', el.peopleFeed));

  /* 이벤트 - 처음으로 */
  el.home.addEventListener('click', () => {
    state.view = 'news';
    state.source = 'all';
    state.shown = { news: PAGE_SIZE, people: PAGE_SIZE };
    store.set('politics-view', state.view);
    render();
    window.scrollTo(0, 0);
    el.title.focus();
    say('처음 화면으로 돌아왔어요.');
  });

  /* 이벤트 - 다시 불러오기 */
  el.retry.addEventListener('click', () => {
    load().then(() => {
      if (state.isError) el.errorTitle.focus();
      else say('기사를 다시 불러왔어요.');
    });
  });

  /* 시작 */
  render();
  load();
})();
