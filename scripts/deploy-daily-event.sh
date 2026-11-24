#!/usr/bin/env bash
# 소소한 일상의 이벤트 사이트를 빌드해서 S3에 올리고 CloudFront 캐시를 비움
# - Vite가 css · js 파일 이름에 해시를 붙이므로 assets/는 1년, 그림은 하루, 나머지는 매번 새로 받게
#
# 쓰는 법:
#   BUCKET=내-버킷-이름 DISTRIBUTION_ID=E123ABC ./scripts/deploy-daily-event.sh
#   (먼저 aws configure 로 로그인)
set -euo pipefail

: "${BUCKET:?BUCKET=S3 버킷 이름을 넣어 주세요}"
: "${DISTRIBUTION_ID:?DISTRIBUTION_ID=CloudFront 배포 ID를 넣어 주세요}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/projects/daily-event"
OUT="$SRC/dist"

echo "▶ 빌드"
(cd "$SRC" && npm ci && npm run build)
test -f "$OUT/index.html" || { echo "✗ 빌드 결과가 없어요"; exit 1; }

echo "▶ 해시가 붙은 css · js 올리기 (1년)"
aws s3 sync "$OUT/assets/" "s3://$BUCKET/assets/" --delete \
  --cache-control "public, max-age=31536000, immutable"

echo "▶ 그림 올리기 (하루)"
aws s3 sync "$OUT/images/" "s3://$BUCKET/images/" --delete \
  --cache-control "public, max-age=86400"

echo "▶ 매번 새로 받을 파일 올리기 (html · 데이터 · txt)"
aws s3 sync "$OUT/" "s3://$BUCKET/" --delete \
  --exclude "assets/*" --exclude "images/*" --exclude "manifest.webmanifest" \
  --cache-control "no-cache"
aws s3 cp "$OUT/manifest.webmanifest" "s3://$BUCKET/manifest.webmanifest" \
  --content-type "application/manifest+json" --cache-control "no-cache"

echo "▶ CloudFront 캐시 비우기"
aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*" --query 'Invalidation.Id' --output text

echo "✓ 올리기 끝"
