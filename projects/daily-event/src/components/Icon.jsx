/* 아이콘 (index.html 위쪽 아이콘 모음의 symbol을 씀) */
export default function Icon({ name, className = '' }) {
  return (
    <svg className={`ico ${className}`.trim()} aria-hidden="true" focusable="false">
      <use href={`#${name}`} />
    </svg>
  );
}
