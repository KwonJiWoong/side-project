import { FAQ } from '../data/faq.js';

/* 자주 묻는 질문 (글은 data/faq.js, JSON-LD와 같은 글) */
export default function Faq() {
  return (
    <section className="faq" aria-labelledby="faqTitle">
      <h2 className="faq__title" id="faqTitle">자주 묻는 질문</h2>
      {FAQ.map((item) => (
        <details key={item.q} className="faq__item">
          <summary className="faq__q">{item.q}</summary>
          <p className="faq__a">{item.a}</p>
        </details>
      ))}
    </section>
  );
}
