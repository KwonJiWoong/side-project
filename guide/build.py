"""
가이드 HTML 만들기

원본: ../CODING_GUIDE.md, ../CSS_GUIDE.md (가이드 내용은 md에서만 고친다)
결과: index.html(코딩 가이드), css.html(CSS 가이드)

실행: python guide/build.py   (처음 한 번: pip install markdown)
"""
import re, html, os
import markdown

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.dirname(HERE)
OUT = HERE

S='fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"'
F='fill="currentColor"'
ICONS = {
 "home": f'<path {S} d="M3 11.5 12 4l9 7.5M6 10v10h12V10"/><path {S} d="M10 20v-5h4v5"/>',
 "text-minus": f'<circle {S} cx="10.5" cy="10.5" r="6.5"/><path {S} d="m15.5 15.5 5 5M7.5 10.5h6"/>',
 "text-plus": f'<circle {S} cx="10.5" cy="10.5" r="6.5"/><path {S} d="m15.5 15.5 5 5M7.5 10.5h6M10.5 7.5v6"/>',
 "contrast": f'<circle {S} cx="12" cy="12" r="8.5"/><path {F} d="M12 3.5a8.5 8.5 0 0 1 0 17z"/>',
 "code": f'<path {S} d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
 "palette": f'<path {S} d="M12 3.5a8.5 8.5 0 1 0 0 17c1.4 0 2-1 1.5-2.2-.6-1.3.3-2.8 1.8-2.8H17a3.5 3.5 0 0 0 3.5-3.5C20.5 7 16.7 3.5 12 3.5z"/><circle {F} cx="7.5" cy="11" r="1.3"/><circle {F} cx="10" cy="7.3" r="1.3"/><circle {F} cx="14.5" cy="7.3" r="1.3"/>',
 "list": f'<path {S} d="M9 6h11M9 12h11M9 18h11"/><circle {F} cx="4.5" cy="6" r="1.4"/><circle {F} cx="4.5" cy="12" r="1.4"/><circle {F} cx="4.5" cy="18" r="1.4"/>',
 "up": f'<path {S} stroke-width="2.6" d="m5 15 7-7 7 7"/>',
 "check": f'<path {S} stroke-width="2.8" d="m5 12.5 4.5 4.5L19 7.5"/>',
 "reset": f'<path {S} d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4"/>',
}
sprite = '  <!-- 아이콘 모음 -->\n  <svg class="sprite" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" hidden>\n' + "\n".join(
    f'    <symbol id="i-{k}" viewBox="0 0 24 24">{v}</symbol>' for k,v in ICONS.items()) + '\n  </svg>'
def ico(n): return f'<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-{n}"></use></svg>'

def slug(text, used):
    s = re.sub(r'<[^>]+>','',text)
    s = html.unescape(s)
    s = re.sub(r'^[\d.\-]+\s*','',s).strip()
    s = re.sub(r'[^\w가-힣\s-]','',s)
    s = re.sub(r'\s+','-',s).lower() or 'sec'
    base, n = s, 2
    while s in used: s = f'{base}-{n}'; n += 1
    used.add(s); return s

def convert(md_text, page):
    # 목록 앞에 빈 줄이 없으면 넣기 (python-markdown은 빈 줄이 필요)
    md_text = re.sub(r'(?m)^(?!\s*(?:[-*] |\d+\. )|\s*$|\s*\||\s*```)(.+)\n(?=\s*(?:- |\d+\. ))', r'\1\n\n', md_text)
    md_text = md_text.replace('[`CSS_GUIDE.md`](CSS_GUIDE.md)','[CSS 가이드](css.html)').replace('(CSS_GUIDE.md)','(css.html)').replace('(CODING_GUIDE.md)','(index.html)')
    body = markdown.markdown(md_text, extensions=['tables','fenced_code','sane_lists'])
    # 제목(h1)과 첫 설명은 따로 뽑기
    m = re.match(r'\s*<h1>(.*?)</h1>', body, re.S)
    title = m.group(1); body = body[m.end():]
    used=set(); toc=[]
    def h(mo):
        lvl, inner = mo.group(1), mo.group(2)
        sid = slug(inner, used)
        if lvl=='2': toc.append((sid, re.sub(r'<[^>]+>','',inner)))
        cls = 'doc__h2' if lvl=='2' else 'doc__h3'
        return f'<h{lvl} class="{cls}" id="{sid}" tabindex="-1">{inner}</h{lvl}>'
    body = re.sub(r'<h([23])>(.*?)</h\1>', h, body, flags=re.S)
    # 체크리스트
    cnt=[0]
    def chk(mo):
        cnt[0]+=1; cid=f'{page}-check-{cnt[0]}'
        return f'<li class="doc__item doc__item--check"><input class="doc__checkbox" type="checkbox" id="{cid}" data-check="{cid}"><label class="doc__check-label" for="{cid}">{mo.group(1)}</label></li>'
    body = re.sub(r'<li>\[ \] (.*?)</li>', chk, body, flags=re.S)
    body = re.sub(r'<ul>(\s*<li class="doc__item doc__item--check")', r'<ul class="doc__list doc__list--check">\1', body)
    # 클래스 붙이기 (BEM)
    rep = [
     (r'<p>', '<p class="doc__text">'), (r'<ul>', '<ul class="doc__list">'), (r'<ol>', '<ol class="doc__list doc__list--num">'),
     (r'<li>', '<li class="doc__item">'), (r'<blockquote>', '<blockquote class="doc__quote">'),
     (r'<hr />', '<hr class="doc__divider">'), (r'<strong>', '<strong class="doc__strong">'),
     (r'<th>', '<th class="doc__th" scope="col">'), (r'<td>', '<td class="doc__td">'),
     (r'<thead>', '<thead class="doc__thead">'), (r'<tbody>', '<tbody>'),
     (r'<th style="[^"]*">', '<th class="doc__th" scope="col">'), (r'<td style="[^"]*">', '<td class="doc__td">'),
    ]
    for a,b in rep: body = re.sub(a,b,body)
    body = re.sub(r'<table>', '<div class="doc__table-wrap" role="region" aria-label="표" tabindex="0"><table class="doc__table">', body)
    body = body.replace('</table>', '</table></div>')
    body = re.sub(r'<pre><code(?: class="language-([\w-]+)")?>', lambda mo: f'<pre class="doc__pre" tabindex="0"><code class="doc__code">', body)
    body = re.sub(r'<code>', '<code class="doc__inline-code">', body)
    def link(mo):
        href = mo.group(1)
        if href.startswith('http'):
            return f'<a class="doc__link" href="{href}" target="_blank" rel="noopener noreferrer">'
        return f'<a class="doc__link" href="{href}">'
    body = re.sub(r'<a href="([^"]+)">', link, body)
    body = re.sub(r'(target="_blank" rel="noopener noreferrer">)(.*?)</a>', r'\1\2<span class="sr-only"> (새 창으로 열림)</span></a>', body)
    # 첫 문단(h2 전) = 소개
    i = body.find('<h2')
    intro, rest = body[:i], body[i:]
    # 섹션으로 나누기
    parts = re.split(r'(?=<h2 )', rest)
    secs=[]
    for p in parts:
        if not p.strip(): continue
        p = re.sub(r'\s*<hr class="doc__divider">\s*$','',p.strip())
        hid = re.search(r'id="([^"]+)"', p).group(1)
        secs.append(f'<section class="doc__section" aria-labelledby="{hid}">\n{p}\n<p class="doc__top"><a class="doc__top-link" href="#top">{ico("up")} 맨 위로</a></p>\n</section>')
    intro = re.sub(r'\s*<hr class="doc__divider">\s*$','',intro.strip())
    return title, intro, toc, "\n".join(secs), cnt[0]

PAGES = [
 ('index', 'CODING_GUIDE.md', '코딩 가이드', 'code', 'HTML·CSS·JavaScript·작업 방식까지, 모든 웹 퍼블리싱 작업에 적용하는 나의 코딩 규칙입니다.'),
 ('css', 'CSS_GUIDE.md', 'CSS 가이드', 'palette', '디자인 토큰, BEM 이름 짓기, 선택자, 단위, 반응형, 접근성까지 CSS 작성 규칙을 정리했습니다.'),
]
for page, src, label, icon, desc in PAGES:
    title, intro, toc, secs, nchecks = convert(open(os.path.join(SRC, src), encoding='utf-8').read(), page)
    CUR = ' aria-current="page"'
    nav = "\n".join(
        f'        <li><a class="gnb__link" href="{p}.html"{CUR if p==page else ""}>{ico(ic)} {lb}</a></li>'
        for p,_,lb,ic,_ in PAGES)
    toc_html = "\n".join(f'          <li class="toc__item"><a class="toc__link" href="#{sid}">{html.escape(html.unescape(t))}</a></li>' for sid,t in toc)
    reset_btn = f'\n          <button type="button" class="btn btn--block" data-reset-checks>{ico("reset")} 체크 모두 지우기</button>' if nchecks else ''
    doc = f'''<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="{desc}">
  <meta name="theme-color" content="#1f4b7a">
  <title>{label} | 나의 코딩 가이드</title>
  <link rel="icon" href="images/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
  <link rel="stylesheet" href="css/reset.css">
  <link rel="stylesheet" href="css/common.css">
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <a class="skip-link" href="#main">본문 바로가기</a>

{sprite}

  <!-- 헤더 -->
  <header class="header" id="top">
    <div class="container header__inner">
      <p class="header__title"><img class="header__logo" src="images/favicon.svg" alt="" width="40" height="40"> 나의 코딩 가이드</p>

      <div class="tools" role="group" aria-label="보기 설정">
        <p class="tools__label">글자 크기: <strong class="tools__value" id="sizeText">보통</strong></p>
        <button type="button" class="btn btn--tool" id="fontDown">{ico("text-minus")} 글자 작게</button>
        <button type="button" class="btn btn--tool" id="fontUp">{ico("text-plus")} 글자 크게</button>
        <button type="button" class="btn btn--tool btn--toggle" id="contrastBtn" aria-pressed="false">{ico("contrast")} 고대비 보기</button>
      </div>
    </div>

    <!-- 가이드 메뉴 -->
    <nav class="gnb" aria-label="가이드 고르기">
      <ul class="container gnb__list">
{nav}
      </ul>
    </nav>
  </header>

  <div class="container layout">
    <!-- 목차 -->
    <aside class="toc" aria-labelledby="tocTitle">
      <details class="toc__box" id="tocBox" open>
        <summary class="toc__summary"><span class="toc__summary-text">{ico("list")} <span id="tocTitle">목차</span></span></summary>
        <ol class="toc__list">
{toc_html}
        </ol>{reset_btn}
      </details>
    </aside>

    <main class="doc" id="main" tabindex="-1">
      <h1 class="doc__title">{title}</h1>
      <div class="doc__intro">
{intro}
      </div>

{secs}
    </main>
  </div>

  <!-- 푸터 -->
  <footer class="footer">
    <div class="container">
      <p class="footer__text">원본: <code class="footer__code">{src}</code> · 규칙이 다르면 프로젝트의 <code class="footer__code">CLAUDE.md</code>가 우선합니다.</p>
    </div>
  </footer>

  <p class="toast" id="notice" role="status" aria-live="polite"></p>

  <script src="js/main.js"></script>
</body>
</html>
'''
    open(os.path.join(OUT, f'{page}.html'), 'w', encoding='utf-8', newline='\n').write(doc)
    print(f'{page}.html 생성: 섹션 {len(toc)}개, 체크 {nchecks}개')
