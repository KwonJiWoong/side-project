import { useState } from 'react';
import Icon from './Icon.jsx';
import ThemeSwitch from './ThemeSwitch.jsx';
import { TYPES } from '../lib/meta.js';

/* 유형 고르기 (첫 방문 · 헤더의 바꾸기) */
export default function TypePicker({ headingRef, current, theme, onTheme, onPreview, onChoose, onCancel }) {
  const [picked, setPicked] = useState(current ?? null);
  const [error, setError] = useState(false);

  const pick = (id) => {
    setPicked(id);
    setError(false);
    onPreview(id);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!picked) {
      setError(true);
      return;
    }
    onChoose(picked);
  };

  return (
    <section className="picker" aria-labelledby="pickerTitle">
      <p className="picker__eyebrow">{current ? '내 하루 바꾸기' : '처음 오셨네요'}</p>
      <h2 className="picker__title" id="pickerTitle" ref={headingRef} tabIndex={-1}>
        당신의 하루는<br />어떤 모습인가요?
      </h2>
      <p className="picker__desc">고른 하루에 맞춰 매일 초대장을 보내 드릴게요. 나중에 언제든 바꿀 수 있어요.</p>

      <form className="picker__form" onSubmit={submit} noValidate>
        <fieldset className="picker__group" aria-describedby={error ? 'pickerError' : undefined}>
          <legend className="picker__legend">나의 하루 고르기</legend>
          {TYPES.map((t) => (
            <label key={t.id} className="type-card" data-type={t.id}>
              <input
                className="type-card__radio"
                type="radio"
                name="dayType"
                value={t.id}
                checked={picked === t.id}
                onChange={() => pick(t.id)}
              />
              <span className="type-card__icon">
                <Icon name={`t-${t.id}`} />
              </span>
              <span className="type-card__text">
                <span className="type-card__name">
                  {t.name}
                  {t.sub && <span className="type-card__sub"><span className="sr-only">, </span>{t.sub}</span>}
                </span>
                <span className="type-card__slots">{t.slots}</span>
              </span>
              <Icon name="i-check" className="type-card__check" />
            </label>
          ))}
        </fieldset>

        <div className="picker__theme">
          <p className="picker__legend" id="themeLabel">편지지 테마</p>
          <ThemeSwitch theme={theme} onTheme={onTheme} />
        </div>

        {error && (
          <p className="notice notice--warn" id="pickerError" role="alert">
            <Icon name="i-info" />
            <span>학생, 직장인, 자유인 중 하나를 골라 주세요.</span>
          </p>
        )}
        {current && picked && picked !== current && (
          <p className="notice">
            <Icon name="i-info" />
            <span>오늘 소인을 아직 안 찍었다면, 오늘 초대장도 새 하루에 맞게 다시 와요.</span>
          </p>
        )}

        <div className="picker__actions">
          <button type="submit" className="btn btn--primary btn--block">
            <Icon name="i-check" />
            {current ? '이 하루로 바꾸기' : '시작하기'}
          </button>
          {current && (
            <button type="button" className="btn btn--block" onClick={onCancel}>
              <Icon name="i-undo" />
              그대로 두기
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
