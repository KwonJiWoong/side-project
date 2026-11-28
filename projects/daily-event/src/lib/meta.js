/* 유형 · 분류 이름과 아이콘 */
export const TYPES = [
  { id: 'student', name: '학생', sub: '', slots: '등굣길 · 쉬는 시간 · 하굣길' },
  { id: 'worker', name: '직장인', sub: '', slots: '출근길 · 점심시간 · 퇴근길' },
  { id: 'free', name: '자유인', sub: '잠시 쉬어 가는 중', slots: '아침 산책 · 낮 시간 · 저녁' }
];

export const SLOT_NAMES = {
  student: { morning: '등굣길', day: '쉬는 시간', evening: '하굣길' },
  worker: { morning: '출근길', day: '점심시간', evening: '퇴근길' },
  free: { morning: '아침 산책', day: '낮 시간', evening: '저녁' }
};

export const CATEGORY_ICON = {
  '길 바꾸기': 'c-route',
  '먹어보기': 'c-taste',
  '관찰하기': 'c-look',
  '말 걸기': 'c-talk',
  '기록하기': 'c-note'
};

export function typeName(id) {
  return TYPES.find((t) => t.id === id)?.name ?? '';
}

/* 화면 테마 (편지지) */
export const THEMES = [
  { id: 'airmail', name: '항공우편', desc: '단정한 남색 편지' },
  { id: 'pastel', name: '파스텔', desc: '마스킹테이프와 꽃 편지' }
];
