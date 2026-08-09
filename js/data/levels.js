/**
 * Campaign levels — unique goals + modifiers per stage
 */

export const LEVELS = [
  { id: 1, world: 'sectorCity', label: 'Awakening', labelFa: 'بیداری', goal: { type: 'score', value: 60 }, mods: { foodMax: 40, speed: 1 }, tip: 'Collect orbs to reach the score', tipFa: 'گوی‌ها را جمع کن تا به امتیاز برسی' },
  { id: 2, world: 'sectorCity', label: 'Growth Spurt', labelFa: 'رشد سریع', goal: { type: 'length', value: 14 }, mods: { foodMax: 48, speed: 1, crystalBias: 0.25 }, tip: 'Grow to length 14', tipFa: 'طول مار را به ۱۴ برسان' },
  { id: 3, world: 'sectorCity', label: 'Star Hunter', labelFa: 'شکار ستاره', goal: { type: 'stars', value: 3 }, mods: { foodMax: 55, starBias: 0.12, speed: 1.05 }, tip: 'Collect 3 golden stars', tipFa: '۳ ستاره طلایی جمع کن' },
  { id: 4, world: 'neonDistrict', label: 'Pink Pulse', labelFa: 'تپش صورتی', goal: { type: 'score', value: 180 }, mods: { foodMax: 45, speed: 1.12 }, tip: 'Neon speed is higher', tipFa: 'سرعت نئون بالاتر است' },
  { id: 5, world: 'neonDistrict', label: 'No Boost Zone', labelFa: 'منطقه بدون شتاب', goal: { type: 'score', value: 200 }, mods: { foodMax: 50, speed: 1.08, noBoost: true }, tip: 'Boost is disabled', tipFa: 'شتاب غیرفعال است' },
  { id: 6, world: 'crystalReef', label: 'Crystal Diet', labelFa: 'رژیم کریستال', goal: { type: 'crystals', value: 8 }, mods: { foodMax: 40, crystalBias: 0.35, speed: 1 }, tip: 'Collect 8 crystals', tipFa: '۸ کریستال جمع کن' },
  { id: 7, world: 'crystalReef', label: 'Tight Reef', labelFa: 'صخره تنگ', goal: { type: 'score', value: 220 }, mods: { foodMax: 35, boundsScale: 0.72, speed: 1.05 }, tip: 'Smaller arena', tipFa: 'آرنا کوچک‌تر است' },
  { id: 8, world: 'emberValley', label: 'Heat Rush', labelFa: 'هجوم حرارت', goal: { type: 'score', value: 280 }, mods: { foodMax: 42, speed: 1.25 }, tip: 'Faster movement', tipFa: 'حرکت سریع‌تر' },
  { id: 9, world: 'emberValley', label: 'Survive the Heat', labelFa: 'زنده بمان', goal: { type: 'survive', value: 45 }, mods: { foodMax: 50, speed: 1.15, hazards: 4 }, tip: 'Survive 45s — avoid red hazards', tipFa: '۴۵ ثانیه زنده بمان — از خطر قرمز دوری کن' },
  { id: 10, world: 'voidStation', label: 'Sparse Void', labelFa: 'خلأ پراکنده', goal: { type: 'score', value: 250 }, mods: { foodMax: 18, speed: 1.1 }, tip: 'Very few food items', tipFa: 'غذا خیلی کم است' },
  { id: 11, world: 'voidStation', label: 'Combo Master', labelFa: 'استاد کمبو', goal: { type: 'combo', value: 5 }, mods: { foodMax: 60, speed: 1.1 }, tip: 'Reach combo x5', tipFa: 'کمبو را به x5 برسان' },
  { id: 12, world: 'auroraPeak', label: 'Aurora Trail', labelFa: 'مسیر شفق', goal: { type: 'length', value: 22 }, mods: { foodMax: 50, crystalBias: 0.2, speed: 1.08 }, tip: 'Reach length 22', tipFa: 'طول ۲۲' },
  { id: 13, world: 'auroraPeak', label: 'Hazard Peak', labelFa: 'قله خطر', goal: { type: 'score', value: 320 }, mods: { foodMax: 45, speed: 1.15, hazards: 6, boundsScale: 0.85 }, tip: 'Score while dodging hazards', tipFa: 'امتیاز با دوری از خطرها' },
  { id: 14, world: 'sectorCity', label: 'Blitz 60', labelFa: 'Blitz ۶۰', goal: { type: 'score', value: 350 }, mods: { foodMax: 55, speed: 1.2, timeLimit: 60 }, tip: '350 points in 60 seconds', tipFa: '۳۵۰ امتیاز در ۶۰ ثانیه' },
  { id: 15, world: 'neonDistrict', label: 'Neon King', labelFa: 'پادشاه نئون', goal: { type: 'score', value: 500 }, mods: { foodMax: 40, speed: 1.3, hazards: 5, boundsScale: 0.8, starBias: 0.08 }, tip: 'Hard finale', tipFa: 'پایان سخت' },
];

export function getLevel(id) {
  return LEVELS.find((l) => l.id === id) || LEVELS[0];
}

export function nextLevelId(id) {
  const i = LEVELS.findIndex((l) => l.id === id);
  if (i < 0 || i >= LEVELS.length - 1) return null;
  return LEVELS[i + 1].id;
}
