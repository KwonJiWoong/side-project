import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { FAQ } from './src/data/faq.js';
import { SITE } from './src/config.js';

/* index.html에 구조화 데이터(JSON-LD)를 넣고, 주소가 필요한 줄을 채움 */
function seoPlugin() {
  return {
    name: 'daily-event-seo',
    transformIndexHtml(html) {
      const url = SITE.url;
      const app = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: SITE.name,
        description: '학생 · 직장인 · 자유인의 하루에 맞춰, 평소와 조금 다른 행동 하나를 매일 초대장으로 보내 주는 웹 서비스.',
        applicationCategory: 'LifestyleApplication',
        operatingSystem: '웹 브라우저 (iOS, Android, Windows, macOS)',
        inLanguage: 'ko',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' },
        featureList: ['학생 · 직장인 · 자유인 유형 고르기', '하루 한 통 이벤트 초대장', '하루 1번 다른 초대장 받기', '완료 소인과 한 줄 기록', '월간 이벤트 달력', '가입 없이 기기에만 기록 저장']
      };
      if (url) {
        app.url = url;
        app.image = url + 'images/og-image.png';
      }
      const faq = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQ.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a }
        }))
      };
      const ld = `<script type="application/ld+json">\n${JSON.stringify([app, faq], null, 2)}\n  </script>`;
      let out = html.replace('<!-- JSON-LD -->', ld);
      /* 주소가 비어 있으면 __SITE_URL__ 이 들어간 줄을 지움 */
      out = url
        ? out.replaceAll('__SITE_URL__', url)
        : out.split('\n').filter((line) => !line.includes('__SITE_URL__')).join('\n');
      return out;
    }
  };
}

/* events.html: public/data/events.json으로 이벤트 목록을 글로 채움 (검색·광고 검토용) */
function eventsPagePlugin() {
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const GENERIC = { morning: '아침', day: '낮', evening: '저녁' };
  return {
    name: 'daily-event-events-page',
    transformIndexHtml(html) {
      if (!html.includes('<!-- EVENTS_LIST -->')) return html;
      const data = JSON.parse(readFileSync(resolve(import.meta.dirname, 'public/data/events.json'), 'utf-8'));
      const { events, meta } = data;
      const sections = meta.categories.map((cat, i) => {
        const items = events.filter((e) => e.category === cat).map((e) => {
          const all = e.types.length === Object.keys(meta.types).length;
          const who = all ? '모든 하루' : e.types.map((t) => meta.types[t]).join(' · ');
          const when = all ? GENERIC[e.slot] : meta.slots[e.types[0]][e.slot];
          return `          <li class="event-list__item">
            <h3 class="event-list__title">${esc(e.title)}</h3>
            <p class="event-list__desc">${esc(e.desc)}</p>
            <p class="event-list__tags"><span class="event-list__tag">${esc(who)}</span><span class="event-list__tag">${esc(when)}</span><span class="event-list__tag">${esc(e.level)}</span></p>
          </li>`;
        }).join('\n');
        const count = events.filter((e) => e.category === cat).length;
        return `      <section class="doc__section" aria-labelledby="cat${i}">
        <h2 class="doc__heading" id="cat${i}">${esc(cat)} <span class="doc__count">${count}가지</span></h2>
        <ul class="event-list">
${items}
        </ul>
      </section>`;
      }).join('\n\n');
      return html.replace('<!-- EVENTS_LIST -->', sections).replace('<!-- EVENTS_COUNT -->', String(events.length));
    }
  };
}

/* 404.html은 아무 주소에서나 열리므로 css · 그림 경로를 맨 위(/) 기준으로 바꿈 */
function notFoundPathPlugin() {
  return {
    name: 'daily-event-404-path',
    generateBundle: {
      order: 'post',
      handler(_, bundle) {
        const page = bundle['404.html'];
        if (page) page.source = String(page.source).replaceAll('"./', '"/');
      }
    }
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), eventsPagePlugin(), seoPlugin(), notFoundPathPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        privacy: resolve(import.meta.dirname, 'privacy.html'),
        guide: resolve(import.meta.dirname, 'guide.html'),
        events: resolve(import.meta.dirname, 'events.html'),
        about: resolve(import.meta.dirname, 'about.html'),
        notfound: resolve(import.meta.dirname, '404.html')
      }
    }
  }
});
