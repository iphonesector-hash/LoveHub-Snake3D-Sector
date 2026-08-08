/**
 * LoveHub Snake 3D — i18n translations (EN + FA)
 */

export const translations = {
  en: {
    play: 'PLAY', duo: '2 PLAYERS', worlds: 'WORLDS', customize: 'CUSTOMIZE', settings: 'SETTINGS',
    score: 'Score', mass: 'Mass', best_score: 'Best', level: 'Level', coins: 'Coins',
    paused: 'PAUSED', resume: 'RESUME', restart: 'RESTART', quit: 'QUIT',
    game_over: 'GAME OVER', retry: 'RETRY', menu: 'MENU',
    loading: 'Loading Sector Arena...', subtitle: 'LoveHub Edition',
    objective_collect: 'Touch anywhere to steer',
    tip_swipe: 'Touch and drag anywhere to steer', tip_boost: 'Hold BOOST to speed up',
    back: 'BACK', language: 'Language', joystick_side: 'Boost side', sensitivity: 'Sensitivity',
    controls_hint: 'Touch anywhere to steer. Hold BOOST to speed up. Duo: 2nd finger or IJKL + B.',
    world_open: 'Playable', world_locked: 'Locked',
    winner_p1: 'Player 1 wins!', winner_p2: 'Player 2 wins!',
    init: 'Initializing…', ready: 'Ready',
  },
  fa: {
    play: 'شروع بازی', duo: 'دو نفره', worlds: 'جهان‌ها', customize: 'شخصی‌سازی', settings: 'تنظیمات',
    score: 'امتیاز', mass: 'جرم', best_score: 'بهترین', level: 'سطح', coins: 'سکه',
    paused: 'توقف', resume: 'ادامه', restart: 'شروع مجدد', quit: 'خروج',
    game_over: 'پایان بازی', retry: 'دوباره', menu: 'منو',
    loading: 'در حال بارگذاری آرنا…', subtitle: 'نسخه LoveHub',
    objective_collect: 'هر جای صفحه را لمس کنید',
    tip_swipe: 'لمس و کشیدن روی صفحه برای فرمان', tip_boost: 'نگه‌داشتن BOOST برای سرعت',
    back: 'بازگشت', language: 'زبان', joystick_side: 'سمت شتاب', sensitivity: 'حساسیت',
    controls_hint: 'هر جای صفحه را لمس کنید. BOOST را نگه دارید. دو نفره: انگشت دوم یا IJKL و B.',
    world_open: 'قابل بازی', world_locked: 'قفل',
    winner_p1: 'بازیکن ۱ برنده شد!', winner_p2: 'بازیکن ۲ برنده شد!',
    init: 'آماده‌سازی…', ready: 'آماده',
  },
};

export function t(key, lang = 'en') {
  return translations[lang]?.[key] ?? translations.en[key] ?? key;
}
