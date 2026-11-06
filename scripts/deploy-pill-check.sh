#!/usr/bin/env bash
# 아 맞다 약! 사이트를 S3에 올리고 CloudFront 캐시를 비움
# - ?v= 버전과 sw.js VERSION을 올릴 때마다 자동으로 새 값으로 바꿈 (손으로 안 바꿔도 됨)
# - html · sw.js · manifest는 매번 새로 받게, css · js · 글꼴은 1년, 그림은 하루 보관
#
# 쓰는 법:
#   BUCKET=내-버킷-이름 DISTRIBUTION_ID=E123ABC ./scripts/deploy-pill-check.sh
#   (먼저 aws configure 로 로그인)
set -euo pipefail

: "${BUCKET:?BUCKET=S3 버킷 이름을 넣어 주세요}"
: "${DISTRIBUTION_ID:?DISTRIBUTION_ID=CloudFront 배포 ID를 넣어 주세요}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/projects/pill-check"
OUT="$(mktemp -d)"
trap 'rm -rf "$OUT"' EXIT

# 버전: 날짜시각 + git 커밋 (예: 202611061030-a1b2c3d)
VERSION="$(date +%Y%m%d%H%M)-$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || echo local)"
echo "▶ 버전 $VERSION"

cp -R "$SRC/." "$OUT/"

# 버전 바꾸기 (html의 ?v=, sw.js의 VERSION)
for f in "$OUT"/*.html; do
  sed -i.bak -E "s/\?v=[A-Za-z0-9-]+\"/?v=$VERSION\"/g" "$f"
done
sed -i.bak -E "s/const VERSION = '[^']*';/const VERSION = '$VERSION';/" "$OUT/sw.js"
find "$OUT" -name '*.bak' -delete

# 바뀌었는지 확인
grep -q "?v=$VERSION\"" "$OUT/index.html" || { echo "✗ index.html 버전 바꾸기 실패"; exit 1; }
grep -q "'$VERSION'" "$OUT/sw.js" || { echo "✗ sw.js 버전 바꾸기 실패"; exit 1; }

echo "▶ 오래 보관할 파일 올리기 (버전이 붙는 css · js · 글꼴: 1년)"
aws s3 sync "$OUT/" "s3://$BUCKET/" --delete \
  --exclude "*" --include "css/*" --include "js/*" --include "fonts/*" \
  --cache-control "public, max-age=31536000, immutable"

echo "▶ 그림 올리기 (버전이 안 붙어서 하루만 보관)"
aws s3 sync "$OUT/" "s3://$BUCKET/" --delete \
  --exclude "*" --include "images/*" \
  --cache-control "public, max-age=86400"

echo "▶ 매번 새로 받을 파일 올리기 (html · sw.js · manifest)"
aws s3 sync "$OUT/" "s3://$BUCKET/" \
  --exclude "*" --include "*.html" --include "sw.js" --include "robots.txt" --include "sitemap.xml" \
  --cache-control "no-cache"
aws s3 cp "$OUT/manifest.webmanifest" "s3://$BUCKET/manifest.webmanifest" \
  --content-type "application/manifest+json" --cache-control "no-cache"

echo "▶ CloudFront 캐시 비우기"
aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*" --query 'Invalidation.Id' --output text

echo "✓ 올리기 끝 (버전 $VERSION)"
