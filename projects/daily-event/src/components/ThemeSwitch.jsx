import { THEMES } from '../lib/meta.js';

/* 화면 테마 고르기 (항공우편 / 파스텔) — 누르는 즉시 바뀌고 저장됨 */
export default function ThemeSwitch({ theme, onTheme, className = '' }) {
  return (
    <div className={`theme-switch ${className}`.trim()} role="group" aria-label="편지지 테마">
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`theme-switch__btn theme-switch__btn--${t.id}`}
          aria-pressed={theme === t.id ? 'true' : 'false'}
          onClick={() => onTheme(t.id)}
        >
          <span className="theme-switch__swatch" aria-hidden="true" />
          {t.name}
        </button>
      ))}
    </div>
  );
}
