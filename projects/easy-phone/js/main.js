/* 가이드 데이터 (검색용) */
const GUIDES = [
  { title: '카카오톡으로 사진 보내기', cat: '카카오톡', url: 'guides/kakaotalk-photo.html', keys: '카톡 사진 전송 앨범' },
  { title: '카카오톡 친구 추가하기', cat: '카카오톡', url: 'guides/kakaotalk-friend.html', keys: '카톡 친구 전화번호 연락처' },
  { title: '패스트푸드점 키오스크 주문하기', cat: '키오스크', url: 'guides/kiosk-fastfood.html', keys: '햄버거 무인 주문기 결제 세트' },
  { title: '카페 키오스크로 음료 주문하기', cat: '키오스크', url: 'guides/kiosk-cafe.html', keys: '커피 무인 주문기 음료 아이스 결제' },
  { title: '은행앱으로 돈 보내기', cat: '은행앱', url: 'guides/bank-transfer.html', keys: '송금 이체 계좌 은행' },
  { title: '은행앱으로 잔액 확인하기', cat: '은행앱', url: 'guides/bank-balance.html', keys: '통장 잔고 거래내역 은행' },
  { title: '휴대폰으로 사진 찍기', cat: '사진', url: 'guides/photo-take.html', keys: '카메라 촬영' },
  { title: '찍은 사진 찾아보기', cat: '사진', url: 'guides/photo-find.html', keys: '갤러리 앨범 사진첩 휴지통' },
  { title: '전화번호 저장하기', cat: '전화·문자', url: 'guides/call-save.html', keys: '연락처 번호 저장' },
  { title: '문자 보내기', cat: '전화·문자', url: 'guides/call-message.html', keys: '메시지 문자 답장' },
  { title: '글자 크게 만들기', cat: '기본설정', url: 'guides/setting-font.html', keys: '글씨 크기 설정 화면' },
  { title: '벨소리 크게 만들기', cat: '기본설정', url: 'guides/setting-volume.html', keys: '소리 음량 진동 무음 설정' }
];

/* 글자 크기 조절 */
const initFontControl = () => {
  const root = document.documentElement;
  const buttons = document.querySelectorAll('.font-control__btn');
  if (!buttons.length) return;

  const SIZES = ['base', 'lg', 'xl'];

  const apply = (size) => {
    if (!SIZES.includes(size)) size = 'base';
    if (size === 'base') root.removeAttribute('data-font');
    else root.setAttribute('data-font', size);
    buttons.forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.size === size)));
  };

  let saved = 'base';
  try { saved = localStorage.getItem('fontSize') || 'base'; } catch (e) { /* 저장소 사용 불가 */ }
  apply(saved);

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!SIZES.includes(btn.dataset.size)) return;
      apply(btn.dataset.size);
      try { localStorage.setItem('fontSize', btn.dataset.size); } catch (e) { /* 저장소 사용 불가 */ }
    });
  });
};

/* 검색 */
const initSearch = () => {
  const form = document.getElementById('search-form');
  const section = document.getElementById('search-result');
  if (!form || !section) return;

  const input = document.getElementById('search-input');
  const title = document.getElementById('search-result-title');
  const msg = document.getElementById('search-result-msg');
  const list = document.getElementById('search-result-list');

  const normalize = (text) => text.replace(/\s+/g, '').toLowerCase();

  const runSearch = () => {
    const query = normalize(input.value);
    list.innerHTML = '';
    section.hidden = false;

    if (!query) {
      msg.textContent = '찾을 말을 적어주세요. 예) 카톡 사진';
      input.focus();
      return;
    }

    const words = input.value.trim().split(/\s+/).map(normalize);
    const results = GUIDES.filter((g) => {
      const target = normalize(`${g.title} ${g.cat} ${g.keys}`);
      return words.every((w) => target.includes(w));
    });

    msg.textContent = results.length
      ? `‘${input.value.trim()}’ 관련 글 ${results.length}개를 찾았습니다.`
      : `‘${input.value.trim()}’ 관련 글이 없습니다. 아래 분야에서 골라보세요.`;

    results.forEach((g) => {
      const li = document.createElement('li');
      li.className = 'guide-list__item';
      const a = document.createElement('a');
      a.className = 'guide-list__link';
      a.href = g.url;
      const span = document.createElement('span');
      span.className = 'guide-list__title';
      span.textContent = g.title;
      const cat = document.createElement('span');
      cat.className = 'guide-list__cat';
      cat.textContent = g.cat;
      span.appendChild(cat);
      a.appendChild(span);
      li.appendChild(a);
      list.appendChild(li);
    });

    title.focus();
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    runSearch();
  });

  // 하위 페이지에서 넘어온 검색어(?q=) 처리
  const q = new URLSearchParams(window.location.search).get('q');
  if (q && q.trim()) {
    input.value = q.trim();
    runSearch();
  }
};

initFontControl();
initSearch();
