#!/usr/bin/env python3
"""핏루틴 HTML 생성 스크립트: 루틴·팁 데이터를 고친 뒤 python3 build.py 로 5개 페이지를 다시 만듦"""
import json, math, sys
from html import escape
from urllib.parse import quote

import os
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.abspath(__file__))

# ===== 아이콘 =====
SW = 'fill="none" stroke="currentColor"'
ICONS = {
 'dumbbell': f'<path d="M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11" {SW} stroke-width="2.4" stroke-linecap="round"/>',
 'list': f'<path d="M9 6h11M9 12h11M9 18h11" {SW} stroke-width="2.2" stroke-linecap="round"/><circle cx="4.5" cy="6" r="1.5" fill="currentColor"/><circle cx="4.5" cy="12" r="1.5" fill="currentColor"/><circle cx="4.5" cy="18" r="1.5" fill="currentColor"/>',
 'timer': f'<circle cx="12" cy="13.5" r="7.5" {SW} stroke-width="2.1"/><path d="M12 9.5v4l2.5 2M9.5 2.5h5M12 2.5V6" {SW} stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>',
 'calendar': f'<rect x="3.5" y="5" width="17" height="15.5" rx="2" {SW} stroke-width="2.1"/><path d="M3.5 10h17M8 3v4M16 3v4" {SW} stroke-width="2.1" stroke-linecap="round"/>',
 'plus': f'<path d="M12 5v14M5 12h14" {SW} stroke-width="2.4" stroke-linecap="round"/>',
 'play': '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>',
 'pause': f'<path d="M8.5 5.5v13M15.5 5.5v13" {SW} stroke-width="3" stroke-linecap="round"/>',
 'skip': f'<path d="M6 5.5v13l9-6.5zM18 5.5v13" {SW} stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
 'reset': f'<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3L4.5 9M4.5 4.5V9H9" {SW} stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>',
 'sound': f'<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" {SW} stroke-width="2" stroke-linejoin="round"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11" {SW} stroke-width="2" stroke-linecap="round"/>',
 'check': f'<path d="M5 12.5l4.5 4.5L19 7.5" {SW} stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
 'alert': f'<path d="M12 3.5 21 19.5H3z" {SW} stroke-width="2" stroke-linejoin="round"/><path d="M12 10v4M12 16.9v.1" {SW} stroke-width="2.2" stroke-linecap="round"/>',
 'left': f'<path d="M14.5 5.5 8 12l6.5 6.5" {SW} stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
 'right': f'<path d="M9.5 5.5 16 12l-6.5 6.5" {SW} stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
 'up': f'<path d="M5.5 14.5 12 8l6.5 6.5" {SW} stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
 'down': f'<path d="M5.5 9.5 12 16l6.5-6.5" {SW} stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
 'flame': f'<path d="M12 3c.8 3.2 5.5 5.3 5.5 10.5a5.5 5.5 0 0 1-11 0c0-2.6 1.4-4.3 2.6-5.3.2 2 1.2 3.1 2.4 3.3-.4-3.1.1-5.8.5-8.5z" {SW} stroke-width="2" stroke-linejoin="round"/>',
 'trash': f'<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" {SW} stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>',
 'edit': f'<path d="M4.5 19.5h4l10-10-4-4-10 10zM13 7l4 4" {SW} stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>',
 'swap': f'<path d="M7 4.5 3.5 8 7 11.5M3.5 8h13M17 12.5l3.5 3.5-3.5 3.5M20.5 16h-13" {SW} stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>',
 'font': f'<path d="M4 7V5h16v2M12 5v14M8.5 19h7" {SW} stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
 'tip': f'<circle cx="12" cy="12" r="8.5" {SW} stroke-width="2.1"/><path d="M12 11v5.5M12 7.5v.1" {SW} stroke-width="2.4" stroke-linecap="round"/>',
 'chair': f'<path d="M7 3.5v9h10v-9M7 12.5v8M17 12.5v8M5.5 12.5h13" {SW} stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>',
}

def ico(name, cls=''):
    c = f'ico {cls}'.strip()
    return f'<svg class="{c}" aria-hidden="true" focusable="false"><use href="#i-{name}"></use></svg>'

ICON_SPRITE = '  <!-- 아이콘 모음 -->\n  <svg class="sr-only" aria-hidden="true" focusable="false">\n' + \
    '\n'.join(f'    <symbol id="i-{k}" viewBox="0 0 24 24">{v}</symbol>' for k, v in ICONS.items()) + '\n  </svg>'

CSP = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'"

def head(title, desc, page=''):
    page_attr = f' data-page="{page}"' if page else ''
    return f'''<!doctype html>
<html lang="ko"{page_attr}>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta http-equiv="Content-Security-Policy" content="{CSP}">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <meta name="theme-color" content="#0e1013">
  <title>{title}</title>
  <meta name="description" content="{desc}">
  <link rel="icon" href="images/favicon.svg" type="image/svg+xml">
  <script src="js/mode.js"></script>
  <link rel="stylesheet" href="css/reset.css">
  <link rel="stylesheet" href="css/common.css">
  <link rel="stylesheet" href="css/style.css">
  <script src="js/main.js" defer></script>
</head>
<body>
  <a class="skip-link" href="#main">본문 바로가기</a>

{ICON_SPRITE}
'''

NAV = [('routine.html', 'list', '루틴'), ('timer.html', 'timer', '타이머'),
       ('record.html', 'calendar', '기록'), ('my-routine.html', 'plus', '내 루틴')]

def header(current=None, plain=False):
    nav = ''
    if not plain:
        items = []
        for href, icon, label in NAV:
            cur = ' aria-current="page"' if href == current else ''
            items.append(f'          <li><a class="gnb__link" href="{href}"{cur}>{ico(icon, "gnb__ico")}{label}</a></li>')
        nav = '''
      <nav class="gnb" aria-label="주 메뉴">
        <ul class="gnb__list">
''' + '\n'.join(items) + '''
        </ul>
      </nav>'''
    return f'''
  <!-- 헤더 -->
  <header class="header">
    <div class="wrap header__inner">
      <a class="header__logo" href="routine.html">{ico("dumbbell", "header__mark")}핏루틴</a>{nav}
      <div class="header__tools">
        <button class="btn btn--sm btn--toggle" id="font-toggle" type="button" aria-pressed="false" data-mode-only="senior">{ico("font")}글자 크게{ico("check", "btn__check")}</button>
        <a class="btn btn--sm" href="index.html?select=1">{ico("swap")}화면 바꾸기</a>
      </div>
    </div>
  </header>
'''

FOOTER = '''
  <!-- 푸터 -->
  <footer class="footer">
    <div class="wrap">
      <p class="footer__text">기록과 내 루틴은 이 브라우저에만 저장돼요.</p>
      <p class="footer__copy">© 2026 핏루틴 · 웹 퍼블리싱 포트폴리오</p>
    </div>
  </footer>
'''

ALERT = f'''
  <!-- 알림창 -->
  <dialog class="alert" id="alert" aria-labelledby="alert-title" aria-describedby="alert-message">
    <form method="dialog">
      <div class="alert__head">
        {ico("check", "alert__ico")}
        <h2 class="alert__title" id="alert-title">알림</h2>
      </div>
      <p class="alert__message" id="alert-message"></p>
      <div class="alert__actions">
        <button class="btn alert__btn" id="alert-cancel" type="submit" value="cancel" hidden>취소</button>
        <button class="btn btn--primary alert__btn" id="alert-ok" type="submit" value="ok">확인</button>
      </div>
    </form>
  </dialog>
'''

END = '</body>\n</html>\n'

def page_head(eyebrow, title, desc_html):
    return f'''
  <main class="wrap" id="main">
    <!-- 페이지 제목 -->
    <section class="page-head" aria-labelledby="page-title">
      <p class="page-head__eyebrow" data-mode-only="general">{eyebrow}</p>
      <h1 class="page-head__title" id="page-title">{title}</h1>
      <p class="page-head__desc">{desc_html}</p>
    </section>
'''

# ===== 루틴 데이터 =====
# (이름, 세트, 횟수 문자열 또는 None, 시간(초) 또는 None, 시간 표시, 휴식, [팁])
GENERAL = [
 ('chest', '가슴', '가슴 루틴', '밀어내는 힘을 기르는 기본 4종. 푸시업으로 몸을 데우고 시작해요.', [
  ('푸시업', 4, '15회', None, None, 60, ['손은 어깨보다 조금 넓게, 머리부터 발끝까지 일직선을 유지해요.', '내려갈 때 팔꿈치가 옆으로 벌어지지 않게 45도 정도로 모아요.']),
  ('벤치프레스', 4, '10회', None, None, 90, ['어깨뼈를 모으고 가슴을 살짝 들어 고정해요.', '바는 가슴 중간으로 천천히 내리고, 무거우면 보조자와 함께 해요.']),
  ('인클라인 덤벨 프레스', 3, '12회', None, None, 60, ['벤치 각도는 30~45도가 적당해요.', '덤벨을 올릴 때 서로 부딪치지 않게 살짝 모아요.']),
  ('딥스', 3, '10회', None, None, 60, ['상체를 약간 앞으로 숙이면 가슴에 더 자극이 와요.', '어깨가 아프면 내려가는 깊이를 줄여요.'])]),
 ('back', '등', '등 루틴', '당기는 동작 위주. 어깨를 내리고 팔꿈치로 당긴다는 느낌을 기억하세요.', [
  ('풀업', 4, '8회', None, None, 90, ['어깨를 먼저 내린 뒤 팔꿈치로 당겨요.', '한 개도 어렵다면 점프해서 올라간 뒤 천천히 내려오기부터 해요.']),
  ('바벨 로우', 4, '10회', None, None, 90, ['허리를 곧게 펴고 상체를 45도 정도 숙여요.', '바를 배꼽 쪽으로 당겨요.']),
  ('랫풀다운', 3, '12회', None, None, 60, ['바를 쇄골 쪽으로 당기고, 목 뒤로 당기지 않아요.', '몸을 뒤로 크게 젖혀 반동을 쓰지 않아요.']),
  ('시티드 케이블 로우', 3, '12회', None, None, 60, ['가슴을 펴고 손잡이를 배꼽 쪽으로 당겨요.', '돌아갈 때 어깨가 앞으로 말리지 않게 해요.'])]),
 ('legs', '하체', '하체 루틴', '가장 큰 근육을 쓰는 날. 무릎이 발끝 방향을 따라가게 해주세요.', [
  ('스쿼트', 4, '12회', None, None, 90, ['발은 어깨너비, 발끝은 살짝 바깥을 향해요.', '무릎이 발끝 방향을 따라가게 하고 허리는 곧게 펴요.']),
  ('런지', 3, '다리별 12회', None, None, 60, ['앞 무릎이 발끝보다 너무 앞으로 나가지 않게 해요.', '상체는 세우고 뒷무릎을 바닥 쪽으로 내려요.']),
  ('레그 프레스', 4, '12회', None, None, 90, ['무릎을 끝까지 펴서 잠그지 않아요.', '허리가 등받이에서 뜨지 않는 깊이까지만 내려요.']),
  ('카프 레이즈', 3, '20회', None, None, 45, ['끝까지 올라가서 1초 멈춰요.', '내려올 때 천천히, 반동 없이 해요.'])]),
 ('shoulder', '어깨', '어깨 루틴', '가벼운 무게로 정확하게. 앞·옆·뒤를 고르게 채워요.', [
  ('오버헤드 프레스', 4, '10회', None, None, 90, ['배에 힘을 주고 허리를 과하게 젖히지 않아요.', '바는 얼굴 가까이 수직으로 올려요.']),
  ('사이드 레터럴 레이즈', 3, '15회', None, None, 45, ['팔꿈치를 살짝 굽히고 어깨 높이까지만 들어요.', '어깨가 귀 쪽으로 으쓱 올라가지 않게 해요.']),
  ('페이스 풀', 3, '15회', None, None, 45, ['로프를 얼굴 쪽으로 당기며 양손을 벌려요.', '팔꿈치가 손과 같거나 더 높게 유지해요.']),
  ('리어 델트 플라이', 3, '15회', None, None, 45, ['상체를 숙이고 팔을 옆으로 벌려요.', '가벼운 무게로 어깨 뒤쪽에 집중해요.'])]),
 ('arm', '팔', '팔 루틴', '이두와 삼두를 번갈아 진행해요. 반동 없이 천천히 내리는 게 핵심이에요.', [
  ('바벨 컬', 3, '12회', None, None, 60, ['팔꿈치를 옆구리에 붙여 고정해요.', '몸을 흔들어 반동을 쓰지 않아요.']),
  ('트라이셉스 푸시다운', 3, '12회', None, None, 60, ['팔꿈치는 몸 옆에 고정하고 아래팔만 움직여요.', '끝까지 펴고 1초 멈춰요.']),
  ('해머 컬', 3, '12회', None, None, 60, ['손바닥이 서로 마주 보게 잡아요.', '천천히 내리며 긴장을 유지해요.']),
  ('오버헤드 익스텐션', 3, '12회', None, None, 60, ['팔꿈치가 양옆으로 벌어지지 않게 해요.', '머리 뒤로 천천히 내렸다가 펴요.'])]),
 ('core', '코어', '코어 루틴', '매트만 있으면 어디서든 OK. 허리가 바닥에서 뜨지 않게 주의하세요.', [
  ('플랭크', 3, None, 45, '45초', 30, ['팔꿈치는 어깨 바로 아래에 둬요.', '엉덩이가 처지거나 올라가지 않게 일직선을 유지해요.']),
  ('크런치', 3, '20회', None, None, 30, ['목을 당기지 말고 배 힘으로 올라와요.', '어깨뼈가 바닥에서 뜰 정도면 충분해요.']),
  ('레그 레이즈', 3, '15회', None, None, 45, ['허리가 뜨면 무릎을 굽혀서 해요.', '내릴 때 천천히, 바닥에 닿기 직전에 멈춰요.']),
  ('러시안 트위스트', 3, '20회', None, None, 30, ['등을 둥글게 말지 말고 곧게 펴요.', '어렵다면 발을 바닥에 두고 해요.'])]),
]

SENIOR = [
 ('s-upper', '상체', '상체 운동', '의자에 앉아서 하는 상체 운동이에요. 무게 없이 시작해도 충분해요.', [
  ('앉아서 팔 앞으로 들기', 2, '10회', None, None, 60, ['등받이에서 등을 떼고 바르게 앉아요.', '어깨 높이까지만 천천히 들었다 내려요.']),
  ('벽 짚고 팔굽혀펴기', 2, '8회', None, None, 60, ['벽에서 한 걸음 떨어져 손을 어깨 높이에 대요.', '몸을 곧게 유지하며 천천히 벽 쪽으로 다가가요.']),
  ('물병 들고 팔 굽히기', 2, '10회', None, None, 60, ['500ml 물병 정도의 가벼운 무게로 해요.', '팔꿈치를 옆구리에 붙이고 천천히 굽혀요.']),
  ('앉아서 어깨 돌리기', 2, '10회', None, None, 30, ['앞으로 5번, 뒤로 5번 크게 돌려요.', '숨을 참지 말고 편하게 쉬어요.'])]),
 ('s-lower', '하체', '하체 운동', '넘어지지 않게 튼튼한 의자를 옆에 두고 하세요.', [
  ('의자에서 앉았다 일어서기', 2, '8회', None, None, 60, ['팔걸이가 있는 튼튼한 의자를 써요.', '힘들면 손으로 무릎을 짚고 일어나도 괜찮아요.']),
  ('앉아서 다리 펴기', 2, '다리별 10회', None, None, 45, ['무릎을 쭉 펴고 2초 멈춰요.', '발끝은 몸 쪽으로 당겨요.']),
  ('의자 잡고 발뒤꿈치 들기', 2, '10회', None, None, 45, ['의자 등받이를 두 손으로 잡아요.', '천천히 올라갔다 천천히 내려와요.']),
  ('의자 잡고 다리 옆으로 들기', 2, '다리별 8회', None, None, 60, ['상체가 기울지 않게 바로 서요.', '작게 들어도 괜찮으니 천천히 정확하게 해요.'])]),
 ('s-stretch', '스트레칭', '스트레칭', '운동 전후나 오래 앉아 있었을 때 해주세요.', [
  ('목 옆으로 늘이기', 2, None, 20, '20초', 15, ['귀를 어깨 쪽으로 천천히 기울여요.', '아프지 않을 만큼만, 반동 없이 해요.']),
  ('앉아서 허리 비틀기', 2, None, 20, '20초', 15, ['엉덩이는 의자에 붙이고 상체만 돌려요.', '숨을 내쉬며 천천히 돌려요.']),
  ('앉아서 허벅지 뒤 늘이기', 2, None, 20, '다리별 20초', 15, ['한쪽 다리를 앞으로 뻗고 발끝을 몸 쪽으로 당겨요.', '허리를 펴고 몸을 살짝 앞으로 기울여요.']),
  ('손목·발목 돌리기', 2, '10회', None, None, 15, ['양쪽 방향으로 번갈아 돌려요.', '아침에 일어났을 때 하면 좋아요.'])]),
 ('s-balance', '균형·걷기', '균형·걷기', '넘어짐을 예방하는 운동이에요. 꼭 잡을 곳을 옆에 두세요.', [
  ('의자 잡고 한 발 서기', 2, None, 15, '다리별 15초', 30, ['반드시 의자나 벽을 잡고 해요.', '익숙해지면 한 손만 잡아요.']),
  ('제자리 걷기', 2, None, 60, '1분', 60, ['무릎을 편안한 높이로 들어요.', '팔을 함께 흔들며 리듬 있게 걸어요.']),
  ('일자로 걷기', 2, None, 30, '30초', 30, ['벽을 따라 걸으며 필요하면 벽을 짚어요.', '한 발 뒤꿈치를 다른 발 앞꿈치에 붙이며 걸어요.']),
  ('앉아서 발끝·뒤꿈치 들기', 2, '15회', None, None, 30, ['앞꿈치와 뒤꿈치를 번갈아 들어요.', 'TV를 보면서도 할 수 있어요.'])]),
]

def qs(params):
    return '&amp;'.join(f'{k}={quote(str(v), safe="")}' for k, v in params)

def plan_href(exs):
    plan = []
    for name, sets, reps, work, _, rest, _ in exs:
        o = {'n': name, 's': sets, 'r': rest}
        if reps: o['p'] = reps
        if work: o['w'] = work
        plan.append(o)
    return 'timer.html?plan=' + quote(json.dumps(plan, ensure_ascii=False, separators=(',', ':')), safe='')

def minutes(exs):
    return math.ceil(sum(s * ((w or 40) + r) for _, s, _, w, _, r, _ in exs) / 60)

def tabs_and_panels(data, mode, label):
    tabs, panels = [], []
    for i, (pid, tab, title, desc, exs) in enumerate(data):
        on = i == 0
        tabs.append(f'      <button class="tabs__tab" id="tab-{pid}" type="button" role="tab" aria-selected="{"true" if on else "false"}" aria-controls="panel-{pid}" data-part="{pid}"{"" if on else " tabindex=\"-1\""}>{tab}</button>')
        cards = []
        for n, (name, sets, reps, work, wlabel, rest, tips) in enumerate(exs, 1):
            params = [('name', name)]
            if work: params.append(('work', work))
            if reps: params.append(('reps', reps))
            params += [('sets', sets), ('rest', rest)]
            amount = (f'<div class="exercise__item"><dt class="exercise__term">횟수</dt><dd class="exercise__def">{reps}</dd></div>' if reps
                      else f'<div class="exercise__item"><dt class="exercise__term">시간</dt><dd class="exercise__def">{wlabel}</dd></div>')
            tip_items = '\n'.join(f'                  <li class="exercise__tip-item">{escape(t)}</li>' for t in tips)
            cards.append(f'''        <li>
          <article class="exercise">
            <span class="exercise__num" aria-hidden="true">{n:02d}</span>
            <div class="exercise__body">
              <h3 class="exercise__name">{name}</h3>
              <dl class="exercise__meta">
                <div class="exercise__item"><dt class="exercise__term">세트</dt><dd class="exercise__def">{sets}</dd></div>
                {amount}
                <div class="exercise__item"><dt class="exercise__term">휴식</dt><dd class="exercise__def">{rest}초</dd></div>
              </dl>
              <details class="exercise__tip">
                <summary class="exercise__tip-btn">{ico("tip")}자세 팁<span class="sr-only">: {name}</span></summary>
                <ul class="exercise__tip-list">
{tip_items}
                </ul>
              </details>
              <a class="btn btn--sm exercise__link" href="timer.html?{qs(params)}">{ico("timer")}이 운동만 하기<span class="sr-only">: {name}</span></a>
            </div>
          </article>
        </li>''')
        total_sets = sum(e[1] for e in exs)
        panels.append(f'''
    <section class="routine" id="panel-{pid}" role="tabpanel" aria-labelledby="tab-{pid}" data-mode-only="{mode}"{"" if on else " hidden"}>
      <header class="routine__head">
        <h2 class="routine__title">{title}</h2>
        <p class="routine__desc">{desc}</p>
        <ul class="routine__stats">
          <li class="routine__stat"><strong class="routine__num">{len(exs)}</strong>개 운동</li>
          <li class="routine__stat"><strong class="routine__num">{total_sets}</strong>세트</li>
          <li class="routine__stat">약 <strong class="routine__num">{minutes(exs)}</strong>분</li>
        </ul>
        <a class="btn btn--primary routine__start" href="{plan_href(exs)}">{ico("play")}{title} 처음부터 끝까지 하기</a>
      </header>
      <ol class="routine__list">
{chr(10).join(cards)}
      </ol>
    </section>''')
    tablist = f'''
    <div class="tabs__list" role="tablist" aria-label="{label}" data-mode-only="{mode}">
{chr(10).join(tabs)}
    </div>'''
    return tablist + ''.join(panels)

# ===== index.html (화면 선택) =====
def item(text):
    return f'<span class="choice__item">{ico("check", "choice__check")}{text}</span>'

index = head('핏루틴 - 일반용·노약자용 운동 루틴 플래너',
             '근력 운동 루틴과 어르신을 위한 의자 운동·스트레칭·균형 운동을 타이머와 기록으로 관리하는 운동 플래너입니다.', 'select') + header(plain=True) + f'''
  <main class="wrap choice-page" id="main">
    <section class="page-head" aria-labelledby="page-title">
      <p class="page-head__eyebrow">Welcome</p>
      <h1 class="page-head__title" id="page-title">어떤 화면으로 운동할까요?</h1>
      <p class="page-head__desc">한 번 고르면 기억해 두고, 다음부터는 바로 운동 화면으로 이동해요. 언제든 위쪽 ‘화면 바꾸기’로 바꿀 수 있어요.</p>
    </section>

    <!-- 화면 선택 -->
    <div class="choices" role="group" aria-label="화면 종류">
      <button class="choice" type="button" data-choose-mode="general" aria-pressed="false">
        <span class="choice__top">{ico("dumbbell", "choice__ico")}<span class="choice__current">지금 사용 중</span></span>
        <span class="choice__title">일반용</span>
        <span class="choice__desc">헬스장·홈트레이닝 근력 운동 · 어두운 화면</span>
        <span class="choice__list">
          {item("가슴·등·하체 등 부위별 루틴 6가지")}
          {item("타바타·인터벌 타이머")}
          {item("주간 기록과 나만의 루틴")}
        </span>
        <span class="choice__go">일반용으로 시작{ico("right")}</span>
      </button>
      <button class="choice" type="button" data-choose-mode="senior" aria-pressed="false">
        <span class="choice__top">{ico("chair", "choice__ico")}<span class="choice__current">지금 사용 중</span></span>
        <span class="choice__title">노약자용</span>
        <span class="choice__desc">무리 없는 운동 · 밝은 화면과 큰 글씨</span>
        <span class="choice__list">
          {item("의자 운동·스트레칭·균형 운동")}
          {item("큰 글씨, 큰 버튼, 글자 크기 조절")}
          {item("천천히 쉬어 가는 타이머")}
        </span>
        <span class="choice__go">노약자용으로 시작{ico("right")}</span>
      </button>
    </div>
  </main>
''' + FOOTER + END

# ===== routine.html =====
routine = head('운동 루틴 | 핏루틴', '부위별 근력 루틴과 어르신용 의자 운동·스트레칭·균형 운동을 자세 팁과 함께 확인하고 타이머로 바로 시작하세요.') + header('routine.html') + f'''
  <main class="wrap" id="main">
    <!-- 페이지 제목 -->
    <section class="page-head" aria-labelledby="page-title">
      <p class="page-head__eyebrow" data-mode-only="general">Routine</p>
      <h1 class="page-head__title" id="page-title">오늘의 운동 루틴</h1>
      <p class="page-head__desc"><span data-mode-only="general">오늘 운동할 부위를 고르세요. 루틴 전체를 순서대로 하거나, 운동 하나만 골라 할 수 있어요.</span><span data-mode-only="senior">오늘 할 운동을 고르세요. ‘자세 팁’을 누르면 동작 요령을 볼 수 있어요.</span></p>
    </section>

    <p class="notice" data-mode-only="senior">{ico("alert", "notice__ico")}<span>통증이나 어지러움이 있으면 바로 멈추세요. 지병이 있다면 의사와 상의한 뒤 시작하세요.</span></p>
''' + tabs_and_panels(GENERAL, 'general', '운동 부위') + tabs_and_panels(SENIOR, 'senior', '운동 종류') + '''
  </main>
''' + FOOTER + END

# ===== timer.html =====
def preset(mode, value, name, label):
    return f'<li data-mode-only="{mode}"><button class="btn btn--sm presets__btn" type="button" data-preset="{value}">{name} <span class="presets__value">{label}</span></button></li>'

def num_field(fid, label, mn, mx, val):
    return f'''              <div class="field">
                <label class="field__label" for="timer-{fid}">{label}</label>
                <input class="field__input" id="timer-{fid}" name="{fid}" type="number" inputmode="numeric" min="{mn}" max="{mx}" value="{val}" required aria-describedby="timer-{fid}-error">
                <p class="field__error" id="timer-{fid}-error" hidden>{ico("alert")}<span data-msg></span></p>
              </div>'''

timer = head('운동 타이머 | 핏루틴', '운동·휴식 시간과 세트 수를 정해 쓰는 인터벌 운동 타이머. 루틴 전체를 순서대로 이어서 진행할 수도 있어요.') + header('timer.html') + page_head(
    'Timer', '운동 타이머',
    '횟수를 다 채웠으면 ‘세트 완료’를 눌러 바로 휴식으로 넘어가요. 끝까지 마치면 오늘 기록에 자동으로 체크돼요.') + f'''
    <div class="timer">
      <!-- 타이머 화면 -->
      <section class="panel timer__display" aria-labelledby="timer-name">
        <p class="timer__step" id="timer-step" hidden></p>
        <h2 class="timer__name" id="timer-name">자유 운동</h2>
        <p class="timer__goal" id="timer-goal" hidden></p>

        <div class="ring" id="ring" data-phase="ready">
          <svg class="ring__svg" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
            <circle class="ring__track" cx="60" cy="60" r="54" fill="none" stroke-width="7"/>
            <circle class="ring__bar" id="ring-bar" cx="60" cy="60" r="54" fill="none" stroke-width="7" stroke-linecap="round"/>
          </svg>
          <p class="ring__center">
            <span class="ring__phase" id="timer-phase">준비</span>
            <span class="ring__time" id="timer-time">00:40</span>
            <span class="ring__set" id="timer-set">1 / 4 세트</span>
          </p>
        </div>

        <ol class="timer__dots" id="timer-dots" aria-hidden="true"></ol>

        <div class="timer__controls">
          <button class="btn btn--primary timer__btn" id="timer-toggle" type="button">{ico("play")}<span id="timer-toggle-text">시작</span></button>
          <button class="btn timer__btn" id="timer-skip" type="button" disabled>{ico("skip")}<span id="timer-skip-text">세트 완료</span></button>
        </div>

        <div class="timer__sub">
          <button class="btn btn--sm" id="timer-reset" type="button">{ico("reset")}처음부터</button>
          <button class="btn btn--sm btn--toggle" id="timer-sound" type="button" aria-pressed="true">{ico("sound")}알림음{ico("check", "btn__check")}</button>
        </div>

        <p class="sr-only" id="timer-status" aria-live="polite"></p>
      </section>

      <!-- 루틴 순서 (루틴 전체 진행 시) -->
      <section class="panel plan" id="plan" aria-labelledby="plan-title" hidden>
        <h2 class="panel__title" id="plan-title">루틴 순서</h2>
        <ol class="plan__list" id="plan-list"></ol>
        <a class="btn btn--sm" href="timer.html">{ico("timer")}한 가지 운동만 하기</a>
      </section>

      <!-- 타이머 설정 -->
      <section class="panel" id="timer-settings" aria-labelledby="timer-set-title">
        <h2 class="panel__title" id="timer-set-title">타이머 설정</h2>
        <form class="timer-form" id="timer-form" novalidate>
          <fieldset class="timer-form__set" id="timer-fieldset">
            <legend class="sr-only">운동 시간, 휴식 시간, 세트 수</legend>

            <p class="presets__title" id="preset-title">빠른 설정</p>
            <ul class="presets" aria-labelledby="preset-title">
              {preset("general", "20,10,8", "타바타", "20/10초 × 8")}
              {preset("general", "40,60,4", "근력", "40/60초 × 4")}
              {preset("general", "30,15,10", "인터벌", "30/15초 × 10")}
              {preset("senior", "20,40,3", "가볍게", "20/40초 × 3")}
              {preset("senior", "30,60,3", "보통", "30/60초 × 3")}
              {preset("senior", "60,60,2", "걷기", "1분/1분 × 2")}
            </ul>

            <div class="timer-form__grid">
              <div class="field field--full">
                <label class="field__label" for="timer-name-input">운동 이름 <span class="field__opt">(선택)</span></label>
                <input class="field__input" id="timer-name-input" name="name" type="text" maxlength="20" placeholder="예) 스쿼트" autocomplete="off">
              </div>
{num_field("work", "운동(초)", 5, 600, 40)}
{num_field("rest", "휴식(초)", 0, 600, 60)}
{num_field("sets", "세트", 1, 20, 4)}
            </div>
          </fieldset>
          <p class="field__hint timer-form__hint">값을 바꾸면 바로 적용돼요. 타이머가 도는 중에는 바꿀 수 없어요.</p>
        </form>
      </section>
    </div>
  </main>
''' + FOOTER + ALERT + END

# ===== record.html =====
record = head('주간 운동 기록 | 핏루틴', '운동한 날을 주간 캘린더에 체크하고 연속 운동일, 이번 달 운동일, 주간 목표 달성률을 확인하세요.') + header('record.html') + page_head(
    'Record', '주간 운동 기록', '운동한 날을 눌러 체크하세요. 타이머를 끝까지 마치면 자동으로 체크돼요.') + f'''
    <div class="record">
      <!-- 주간 캘린더 -->
      <section class="panel week" aria-labelledby="week-title">
        <h2 class="week__title" id="week-title" aria-live="polite">이번 주</h2>
        <ol class="week__list" id="week-list"></ol>
        <p class="field__hint week__hint">날짜를 누르면 운동한 날로 체크되고, 한 번 더 누르면 취소돼요.</p>
        <div class="week__nav">
          <button class="btn btn--sm" id="week-prev" type="button">{ico("left")}이전 주</button>
          <button class="btn btn--sm" id="week-today" type="button">이번 주</button>
          <button class="btn btn--sm" id="week-next" type="button">다음 주{ico("right")}</button>
        </div>
      </section>

      <!-- 기록 요약 -->
      <section class="summary" aria-labelledby="summary-title">
        <h2 class="summary__title" id="summary-title">기록 요약 <span class="summary__note">오늘 기준</span></h2>
        <dl class="stats">
          <div class="stats__item">
            <dt class="stats__term">이번 주</dt>
            <dd class="stats__value"><span id="stat-week">0</span><span class="stats__unit">일</span></dd>
          </div>
          <div class="stats__item stats__item--hot">
            <dt class="stats__term">{ico("flame")}연속 운동</dt>
            <dd class="stats__value"><span id="stat-streak">0</span><span class="stats__unit">일</span></dd>
          </div>
          <div class="stats__item">
            <dt class="stats__term">이번 달</dt>
            <dd class="stats__value"><span id="stat-month">0</span><span class="stats__unit">일</span></dd>
          </div>
          <div class="stats__item">
            <dt class="stats__term">전체 기록</dt>
            <dd class="stats__value"><span id="stat-total">0</span><span class="stats__unit">일</span></dd>
          </div>
        </dl>
      </section>

      <!-- 주간 목표 -->
      <section class="panel goal" aria-labelledby="goal-title">
        <h2 class="panel__title" id="goal-title">주간 목표</h2>
        <div class="field">
          <label class="field__label" for="goal-select">일주일에 며칠 운동할까요?</label>
          <select class="field__input" id="goal-select">
''' + '\n'.join(f'            <option value="{d}"{" selected" if d == 4 else ""}>{d}일</option>' for d in range(1, 8)) + '''
          </select>
        </div>
        <label class="goal__label" for="goal-bar">이번 주 달성률</label>
        <progress class="goal__bar" id="goal-bar" max="4" value="0">0 / 4일</progress>
        <p class="goal__msg" id="goal-msg" aria-live="polite"></p>
      </section>
    </div>
  </main>
''' + FOOTER + END

# ===== my-routine.html =====
def err(fid):
    return f'<p class="field__error" id="{fid}-error" hidden>{ico("alert")}<span data-msg></span></p>'

parts = ''.join(f'<option>{p}</option>' for p in ['가슴', '등', '하체', '어깨', '팔', '코어', '상체', '스트레칭', '균형·걷기', '전신'])
my = head('나만의 루틴 만들기 | 핏루틴', '요일별·목적별로 나만의 운동 루틴을 여러 개 만들고, 운동 순서를 정해 타이머로 처음부터 끝까지 이어서 진행하세요.') + header('my-routine.html') + page_head(
    'My Routine', '나만의 루틴 만들기', '루틴을 여러 개 만들고 운동 순서를 정해 두세요. ‘이 루틴 시작’을 누르면 타이머가 순서대로 이어서 진행해요.') + f'''
    <div class="my">
      <div class="my__side">
        <!-- 루틴 고르기 -->
        <section class="panel" aria-labelledby="rt-title">
          <h2 class="panel__title" id="rt-title">루틴 고르기</h2>
          <div class="field">
            <label class="field__label" for="rt-select">편집할 루틴</label>
            <select class="field__input" id="rt-select"></select>
          </div>
          <div class="rt__actions">
            <button class="btn btn--sm" id="rt-new" type="button" aria-controls="rt-form" aria-expanded="false">{ico("plus")}새 루틴</button>
            <button class="btn btn--sm" id="rt-rename" type="button" aria-controls="rt-form" aria-expanded="false">{ico("edit")}이름 바꾸기</button>
            <button class="btn btn--sm btn--danger" id="rt-delete" type="button">{ico("trash")}루틴 삭제</button>
          </div>
          <form class="rt-form" id="rt-form" hidden novalidate>
            <div class="field">
              <label class="field__label" id="rt-form-label" for="rt-name">새 루틴 이름</label>
              <input class="field__input" id="rt-name" name="rtname" type="text" maxlength="20" placeholder="예) 월요일 상체" autocomplete="off" required aria-describedby="rt-name-error">
              {err("rt-name")}
            </div>
            <div class="rt-form__actions">
              <button class="btn btn--primary" id="rt-form-submit" type="submit">{ico("check")}<span id="rt-form-submit-text">만들기</span></button>
              <button class="btn" id="rt-form-cancel" type="button">취소</button>
            </div>
          </form>
        </section>

        <!-- 운동 추가·수정 -->
        <section class="panel my__add" aria-labelledby="add-title">
          <h2 class="panel__title" id="add-title">운동 추가하기</h2>
          <form class="my-form" id="my-form" novalidate>
            <div class="field field--full">
              <label class="field__label" for="my-name">운동 이름 <span class="field__opt">(필수)</span></label>
              <input class="field__input" id="my-name" name="name" type="text" maxlength="20" placeholder="예) 덤벨 숄더 프레스" autocomplete="off" required aria-describedby="my-name-error">
              {err("my-name")}
            </div>
            <div class="field field--full">
              <label class="field__label" for="my-part">부위</label>
              <select class="field__input" id="my-part" name="part">{parts}</select>
            </div>
            <div class="field">
              <label class="field__label" for="my-sets">세트</label>
              <input class="field__input" id="my-sets" name="sets" type="number" inputmode="numeric" min="1" max="10" value="3" required aria-describedby="my-sets-error">
              {err("my-sets")}
            </div>
            <div class="field">
              <label class="field__label" for="my-reps">횟수</label>
              <input class="field__input" id="my-reps" name="reps" type="number" inputmode="numeric" min="1" max="100" value="12" required aria-describedby="my-reps-error">
              {err("my-reps")}
            </div>
            <div class="field field--full">
              <label class="field__label" for="my-rest">세트 사이 휴식</label>
              <select class="field__input" id="my-rest" name="rest">
                <option value="15">15초</option>
                <option value="30">30초</option>
                <option value="45">45초</option>
                <option value="60" selected>60초</option>
                <option value="90">90초</option>
                <option value="120">120초</option>
              </select>
            </div>
            <div class="my-form__actions">
              <button class="btn btn--primary btn--block" id="my-submit" type="submit">{ico("plus")}<span id="my-submit-text">루틴에 추가</span></button>
              <button class="btn btn--block" id="my-cancel" type="button" hidden>수정 취소</button>
            </div>
          </form>
        </section>
      </div>

      <!-- 루틴 속 운동 목록 -->
      <section class="my__list" aria-labelledby="list-title">
        <div class="my__head">
          <h2 class="my__title" id="list-title" tabindex="-1">내 루틴</h2>
          <p class="my__count" id="my-count">0개 운동</p>
        </div>
        <a class="btn btn--primary btn--block my__start" id="rt-start" href="timer.html" hidden>{ico("play")}이 루틴 시작</a>
        <p class="my__empty" id="my-empty">아직 추가한 운동이 없어요. ‘운동 추가하기’에서 첫 운동을 등록하면 루틴을 시작할 수 있어요.</p>
        <ol class="my-list" id="my-list"></ol>
        <p class="sr-only" id="my-status" aria-live="polite"></p>
      </section>
    </div>

    <!-- 목록 항목 틀 -->
    <template id="my-item-tpl">
      <li>
        <article class="my-item">
          <header class="my-item__head">
            <span class="my-item__num" data-field="num"></span>
            <span class="my-item__part" data-field="part"></span>
          </header>
          <h3 class="my-item__name" data-field="name"></h3>
          <p class="my-item__meta" data-field="meta"></p>
          <div class="my-item__actions">
            <a class="btn btn--sm" data-field="timer" href="timer.html">{ico("timer")}이 운동만 하기</a>
            <button class="btn btn--sm" type="button" data-act="edit">{ico("edit")}수정</button>
            <button class="btn btn--sm btn--danger" type="button" data-act="delete">{ico("trash")}삭제</button>
          </div>
          <div class="my-item__order">
            <button class="btn btn--sm" type="button" data-act="up">{ico("up")}위로</button>
            <button class="btn btn--sm" type="button" data-act="down">{ico("down")}아래로</button>
          </div>
        </article>
      </li>
    </template>
  </main>
''' + FOOTER + ALERT + END

for name, html in [('index', index), ('routine', routine), ('timer', timer), ('record', record), ('my-routine', my)]:
    with open(f'{OUT}/{name}.html', 'w', encoding='utf-8') as f:
        f.write(html)
print('ok')
