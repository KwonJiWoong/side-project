/* QR 코드 만들기: src/config.js의 SITE.url로 public/images/qr.svg를 만든다
   도메인이 정해진 뒤 한 번 실행: npm run qr */
import { writeFile } from 'node:fs/promises';
import QRCode from 'qrcode';
import { SITE } from '../src/config.js';

if (!SITE.url) {
  console.error('src/config.js의 SITE.url을 먼저 채워 주세요.');
  process.exit(1);
}

const svg = await QRCode.toString(SITE.url, {
  type: 'svg',
  margin: 1,
  errorCorrectionLevel: 'M',
  color: { dark: '#23201b', light: '#fffdf8' }
});
await writeFile(new URL('../public/images/qr.svg', import.meta.url), svg);
console.log('public/images/qr.svg를 만들었어요:', SITE.url);
