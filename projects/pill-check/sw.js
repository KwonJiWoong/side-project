/* 서비스 워커: 웹 푸시 알림 받기 (서버 붙이면 사용)
   서버가 보내는 내용 예: { "title": "아침 약 드실 시간이에요", "body": "오전 8시 · 2개", "slot": "morning" }
   잠금 화면에 보이므로 약 이름은 넣지 않는 것을 원칙으로 함 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

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
