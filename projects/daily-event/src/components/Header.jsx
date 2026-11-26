import Icon from './Icon.jsx';
import { typeName } from '../lib/meta.js';

/* 헤더: 사이트 이름 + 유형 바꾸기 */
export default function Header({ type, picking, onChangeType }) {
  return (
    <header className="header">
      <div className="container header__inner">
        <h1 className="header__title" id="siteTitle" tabIndex={-1}>
          <Icon name="i-mail" className="header__logo" />
          소소한 일상의 이벤트
        </h1>
        {type && !picking && (
          <button type="button" className="header__type" onClick={onChangeType}>
            <Icon name="i-edit" />
            {typeName(type)}
            <span className="sr-only"> · 내 하루 · 테마 바꾸기</span>
          </button>
        )}
      </div>
    </header>
  );
}
