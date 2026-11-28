/* 푸터 — 안내 페이지 링크 (정적 페이지 푸터와 같은 목록) */
const LINKS = [
  { href: './guide.html', label: '이용 방법' },
  { href: './events.html', label: '이벤트 모아보기' },
  { href: './about.html', label: '만든 이유' },
  { href: './privacy.html', label: '개인정보 처리방침' }
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <nav className="footer__nav" aria-label="사이트 안내">
          <ul className="footer__list">
            {LINKS.map((link) => (
              <li key={link.href}><a className="footer__link" href={link.href}>{link.label}</a></li>
            ))}
          </ul>
        </nav>
        <p className="footer__copy">© 2026 소소한 일상의 이벤트</p>
      </div>
    </footer>
  );
}
