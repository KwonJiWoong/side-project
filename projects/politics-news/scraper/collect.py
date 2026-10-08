"""
정치 뉴스 모으기

언론사 공식 RSS에서 정치 기사의 제목·언론사·시간·원문 링크만 모아
../data/news.json 으로 저장한다. (기사 본문·요약·사진은 저장하지 않는다)

실행: python projects/politics-news/scraper/collect.py
설정: 같은 폴더의 config.json (언론사 주소, 인물·검색어, 보관 기간)
필요한 것: 파이썬 3.9 이상, 추가 설치 없음
"""
import hashlib
import html
import json
import os
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime

HERE = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(HERE, 'config.json')
OUT_PATH = os.path.join(os.path.dirname(HERE), 'data', 'news.json')
KST = timezone(timedelta(hours=9))
USER_AGENT = 'Mozilla/5.0 (compatible; politics-news-rss/1.0; +https://github.com/KwonJiWoong/side-project)'


# ---------- 가져오기 ----------
def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT, 'Accept': 'application/rss+xml, application/xml, text/xml'})
    with urllib.request.urlopen(req, timeout=20) as res:
        return res.read()


# ---------- 다듬기 ----------
def clean_text(text):
    text = html.unescape(text or '')
    text = re.sub(r'<[^>]+>', '', text)
    return re.sub(r'\s+', ' ', text).strip()


def parse_date(text):
    text = (text or '').strip()
    if not text:
        return None
    try:
        d = parsedate_to_datetime(text)
    except (TypeError, ValueError):
        try:
            d = datetime.fromisoformat(text.replace('Z', '+00:00'))
        except ValueError:
            return None
    if d.tzinfo is None:
        d = d.replace(tzinfo=KST)
    return d.astimezone(KST)


def local_name(tag):
    return tag.rsplit('}', 1)[-1]


def child_text(node, *names):
    for child in node:
        if local_name(child.tag) in names:
            if local_name(child.tag) == 'link' and child.get('href'):
                return child.get('href')
            return child.text or ''
    return ''


def parse_feed(raw, source):
    """RSS 2.0 / Atom 모두 읽어서 [{title, link, published}] 로 돌려준다."""
    root = ET.fromstring(raw)
    nodes = [n for n in root.iter() if local_name(n.tag) in ('item', 'entry')]
    suffix = ' - ' + source['name']
    items = []
    for node in nodes:
        title = clean_text(child_text(node, 'title'))
        if title.endswith(suffix):
            title = title[: -len(suffix)].strip()
        link = clean_text(child_text(node, 'link'))
        if not title or not re.match(r'^https?://', link):
            continue
        published = parse_date(child_text(node, 'pubDate', 'date', 'published', 'updated'))
        items.append({'title': title, 'link': link, 'published': published})
    return items


# ---------- 인물 찾기 ----------
def match_people(title, people):
    compact = title.replace(' ', '')
    found = []
    for person in people:
        if any(word.replace(' ', '') in compact for word in person['keywords']):
            found.append(person['id'])
    return found


# ---------- 기존 데이터 ----------
def load_old():
    try:
        with open(OUT_PATH, encoding='utf-8') as f:
            data = json.load(f)
        return data.get('items', []) if isinstance(data, dict) else []
    except (OSError, ValueError):
        return []


def main():
    with open(CONFIG_PATH, encoding='utf-8') as f:
        config = json.load(f)

    now = datetime.now(KST).replace(microsecond=0)
    cutoff = now - timedelta(days=config['keep_days'])
    old_items = load_old()
    old_by_link = {item['link']: item for item in old_items}
    results = []
    ok_count = 0

    for source in config['sources']:
        urls = [source['url']] + ([source['fallback_url']] if source.get('fallback_url') else [])
        fresh = None
        for url in urls:
            try:
                fresh = parse_feed(fetch(url), source)
                if fresh:
                    print('[성공] ' + source['name'] + ': ' + str(len(fresh)) + '건 (' + url + ')')
                    break
                print('[비어 있음] ' + source['name'] + ': ' + url)
            except Exception as e:  # 한 언론사가 실패해도 나머지는 계속
                print('[실패] ' + source['name'] + ': ' + url + ' - ' + type(e).__name__ + ': ' + str(e))
                fresh = None

        kept = [item for item in old_items if item.get('source') == source['id']]
        if not fresh:
            print('  → 지난번에 모은 ' + str(len(kept)) + '건을 그대로 둡니다.')
            results.extend(kept)
            continue

        ok_count += 1
        merged = {item['link']: item for item in kept}
        for item in fresh:
            before = old_by_link.get(item['link'])
            published = item['published']
            if published is None:
                # 시간이 없는 기사는 처음 본 시각을 쓴다
                published = parse_date(before['published']) if before else now
            merged[item['link']] = {
                'id': hashlib.sha1(item['link'].encode('utf-8')).hexdigest()[:12],
                'source': source['id'],
                'title': item['title'],
                'link': item['link'],
                'published': published.isoformat(),
            }
        results.extend(merged.values())

    # 3일 지난 기사 빼기 → 최신순 → 언론사별 개수 제한 → 인물 표시
    items = [item for item in results if parse_date(item['published']) and parse_date(item['published']) >= cutoff]
    items.sort(key=lambda item: item['published'], reverse=True)
    counts = {}
    final = []
    for item in items:
        counts[item['source']] = counts.get(item['source'], 0) + 1
        if counts[item['source']] > config['max_per_source']:
            continue
        item['people'] = match_people(item['title'], config['people'])
        final.append(item)

    data = {
        'updated': now.isoformat(),
        'keepDays': config['keep_days'],
        'sources': [{'id': s['id'], 'name': s['name']} for s in config['sources']],
        'people': [{'id': p['id'], 'name': p['name'], 'role': p['role']} for p in config['people']],
        'items': final,
    }
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
        f.write('\n')
    print('저장: 기사 ' + str(len(final)) + '건 → ' + OUT_PATH)

    if ok_count == 0:
        print('모든 언론사에서 가져오지 못했어요.')
        sys.exit(1)


if __name__ == '__main__':
    main()
