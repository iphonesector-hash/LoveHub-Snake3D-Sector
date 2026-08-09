/** Distinct world identities — visual + gameplay */
export const WORLD_DEFS = {
  sectorCity: {
    id: 'sectorCity', name: 'Sector City', nameFa: 'شهر سکتور', theme: 'cyber',
    bg: 0x0a1628, fog: 0x0a1628, fogDensity: 0.0065, ground: 0x0c1a30, gridA: 0x1a4a70, gridB: 0x102438,
    accent: 0x2ee6ff, secondary: 0x4b7bff, propColors: [0x1a3048, 0x2ee6ff, 0x4b7bff], foodTint: 0x3dffb5,
    boundsSoft: 1e9, eventBias: 'cyber_rush', aiBias: ['hunter', 'speedster', 'aggressive'],
  },
  neonDistrict: {
    id: 'neonDistrict', name: 'Neon District', nameFa: 'منطقه نئون', theme: 'neon',
    bg: 0x14081c, fog: 0x14081c, fogDensity: 0.007, ground: 0x1a0e24, gridA: 0x8020a0, gridB: 0x301040,
    accent: 0xff4fd8, secondary: 0xff9a3c, propColors: [0x2a1038, 0xff4fd8, 0xff9a3c], foodTint: 0xff6b9d,
    boundsSoft: 1e9, eventBias: 'neon_combo', aiBias: ['aggressive', 'hunter', 'collector'],
  },
  crystalReef: {
    id: 'crystalReef', name: 'Crystal Reef', nameFa: 'صخره کریستال', theme: 'crystal',
    bg: 0x061a22, fog: 0x061a22, fogDensity: 0.006, ground: 0x0a2430, gridA: 0x208080, gridB: 0x0e3040,
    accent: 0x40f0d0, secondary: 0x80ffe0, propColors: [0x0e3848, 0x40f0d0, 0xa0ffe8], foodTint: 0x60ffe0,
    boundsSoft: 1e9, eventBias: 'crystal_storm', aiBias: ['explorer', 'collector', 'defensive'],
  },
  emberValley: {
    id: 'emberValley', name: 'Ember Valley', nameFa: 'دره اخگر', theme: 'ember',
    bg: 0x1a0a08, fog: 0x1a0a08, fogDensity: 0.0075, ground: 0x221208, gridA: 0x803020, gridB: 0x301808,
    accent: 0xff6040, secondary: 0xffd060, propColors: [0x301808, 0xff6040, 0xffa040], foodTint: 0xff9040,
    boundsSoft: 1e9, eventBias: 'meteor', aiBias: ['aggressive', 'giant', 'hunter'],
  },
  voidStation: {
    id: 'voidStation', name: 'Void Station', nameFa: 'ایستگاه خلاء', theme: 'void',
    bg: 0x080814, fog: 0x080814, fogDensity: 0.0055, ground: 0x10101c, gridA: 0x404080, gridB: 0x181830,
    accent: 0x8090ff, secondary: 0xc0d0ff, propColors: [0x181830, 0x6080ff, 0xa0b0ff], foodTint: 0xa0b0ff,
    boundsSoft: 1e9, eventBias: 'ai_invasion', aiBias: ['defensive', 'elite', 'speedster'],
  },
  auroraPeak: {
    id: 'auroraPeak', name: 'Aurora Peak', nameFa: 'قله شفق', theme: 'aurora',
    bg: 0x08141c, fog: 0x08141c, fogDensity: 0.006, ground: 0x0c1c28, gridA: 0x208060, gridB: 0x103040,
    accent: 0x50ffc0, secondary: 0xa0ffe0, propColors: [0x103040, 0x50ffc0, 0xe0ffff], foodTint: 0x80ffe0,
    boundsSoft: 1e9, eventBias: 'food_storm', aiBias: ['explorer', 'defensive', 'collector'],
  },
};
export const ZONE_TYPES = ['open','crystal','ruins','forest','industrial','arena','treasure','danger','recovery','boss'];
