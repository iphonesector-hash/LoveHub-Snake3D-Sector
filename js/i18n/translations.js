export const translations = {
  en: {
    play: 'PLAY', campaign: 'CAMPAIGN', worlds: 'WORLDS', settings: 'SETTINGS',
    score: 'Score', mass: 'Mass', best_score: 'Best', level: 'Level', coins: 'Coins',
    paused: 'PAUSED', resume: 'RESUME', restart: 'RESTART', quit: 'QUIT',
    game_over: 'GAME OVER', retry: 'RETRY', menu: 'MENU', loading: 'Loading…',
    subtitle: 'LoveHub Edition', back: 'BACK', language: 'Language',
    boost_side: 'Boost side', sensitivity: 'Sensitivity',
    world_open: 'Open', world_locked: 'Locked',
    level_clear: 'LEVEL CLEAR', next_level: 'NEXT LEVEL',
    init: 'Initializing…', ready: 'Ready', target: 'Goal',
  },
  fa: {
    play: 'شروع', campaign: 'مراحل', worlds: 'جهان‌ها', settings: 'تنظیمات',
    score: 'امتیاز', mass: 'جرم', best_score: 'بهترین', level: 'سطح', coins: 'سکه',
    paused: 'توقف', resume: 'ادامه', restart: 'شروع مجدد', quit: 'خروج',
    game_over: 'پایان', retry: 'دوباره', menu: 'منو', loading: 'بارگذاری…',
    subtitle: 'نسخه LoveHub', back: 'بازگشت', language: 'زبان',
    boost_side: 'سمت شتاب', sensitivity: 'حساسیت',
    world_open: 'باز', world_locked: 'قفل',
    level_clear: 'مرحله تمام شد', next_level: 'مرحله بعد',
    init: 'آماده‌سازی…', ready: 'آماده', target: 'هدف',
  },
};

export function t(key, lang = 'en') {
  return translations[lang]?.[key] ?? translations.en[key] ?? key;
}
