/* 서비스 워커: 오프라인 열기 + 웹 푸시 알림 받기 (푸시는 서버 붙이면 사용)
   서버가 보내는 내용 예: { "title": "아침 약 드실 시간이에요", "body": "오전 8시 · 2개", "slot": "morning" }
   잠금 화면에 보이므로 약 이름은 넣지 않는 것을 원칙으로 함 */
/* 인터넷이 끊겨도 열리게: 화면 파일을 휴대폰에 보관
   VERSION은 index.html의 ?v= 값과 같이 바꾸기 (바꾸면 새 파일로 다시 보관) */
const VERSION = '2026110506';
const CACHE = 'pill-' + VERSION;
const SHELL = [
  './', 'index.html', 'privacy.html', 'manifest.webmanifest',
  'css/reset.css?v=' + VERSION, 'css/common.css?v=' + VERSION, 'css/style.css?v=' + VERSION,
  'js/main.js?v=' + VERSION, 'js/page.js?v=' + VERSION, 'fonts/pretendard.css?v=' + VERSION,
  'images/logo.svg', 'images/mascot.svg', 'images/icon-192.png', 'images/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.indexOf('pill-') === 0 && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

/* 화면(html)은 인터넷 먼저 → 안 되면 보관본, 나머지 파일은 보관본 먼저 (글꼴은 쓰는 대로 보관) */
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((res) => {
      const copy = res.clone();
      if (res.ok) caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok && /\/fonts\//.test(req.url)) {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
    }
    return res;
  })));
});

self.addEventListener('push', (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (err) { data = { body: e.data ? e.data.text() : '' }; }
  const title = data.title || '약 드실 시간이에요';
  e.waitUntil(self.registration.showNotification(title, {
    body: data.body || '눌러서 오늘 먹을 약을 확인해 주세요.',
    icon: 'images/icon-192.png',
    badge: 'images/icon-192.png',
    tag: 'pill-' + (data.slot || 'now'),
    renotify: true,
    lang: 'ko',
    data: { url: './#today' }
  }));
});

/* 알림을 누르면 열려 있는 화면으로, 없으면 새로 열기 */
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './#today', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    const win = list.find((c) => c.url.indexOf(self.registration.scope) === 0);
    if (win) { win.navigate(url); return win.focus(); }
    return self.clients.openWindow(url);
  }));
});
