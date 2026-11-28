import Icon from './Icon.jsx';

/* 탭: 오늘의 초대장 / 이벤트 달력 (한 페이지 안에서 화면만 바꿈) */
const ITEMS = [
  { id: 'today', label: '오늘의 초대장', icon: 'i-mail' },
  { id: 'calendar', label: '이벤트 달력', icon: 'i-calendar' }
];

export default function Tabs({ tab, onChange }) {
  return (
    <nav className="tabs" aria-label="주요 메뉴">
      <ul className="container tabs__list">
        {ITEMS.map((item) => (
          <li key={item.id} className="tabs__item">
            <button
              type="button"
              className="tabs__btn"
              aria-current={tab === item.id ? 'page' : undefined}
              onClick={() => onChange(item.id)}
            >
              <Icon name={item.icon} />
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
