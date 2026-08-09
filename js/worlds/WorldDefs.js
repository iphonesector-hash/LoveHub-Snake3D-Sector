/** Distinct world identities — visual + gameplay + environmental */
export const WORLD_DEFS = {
  sectorCity: {
    id: 'sectorCity', name: 'Sector City', nameFa: '\u0634\u0647\u0631 \u0633\u06a9\u062a\u0648\u0631', theme: 'cyber',
    bg: 0x0a1628, fog: 0x0a1628, fogDensity: 0.0055, ground: 0x0c1a30, gridA: 0x1a4a70, gridB: 0x102438,
    accent: 0x2ee6ff, secondary: 0x4b7bff, propColors: [0x1a3048, 0x2ee6ff, 0x4b7bff, 0x0a2038],
    foodTint: 0x3dffb5, skyTop: 0x0a2038, skyBot: 0x050a14,
    boundsSoft: 1e9, eventBias: 'cyber_rush', aiBias: ['hunter', 'speedster', 'aggressive'],
    safeZone: 'Central Plaza', relic: 'Cyber Core',
  },
  neonDistrict: {
    id: 'neonDistrict', name: 'Neon District', nameFa: '\u0645\u0646\u0637\u0642\u0647 \u0646\u0626\u0648\u0646', theme: 'neon',
    bg: 0x14081c, fog: 0x14081c, fogDensity: 0.006, ground: 0x1a0e24, gridA: 0x8020a0, gridB: 0x301040,
    accent: 0xff4fd8, secondary: 0xff9a3c, propColors: [0x2a1038, 0xff4fd8, 0xff9a3c, 0x1a0820],
    foodTint: 0xff6b9d, skyTop: 0x1a0a28, skyBot: 0x080410,
    boundsSoft: 1e9, eventBias: 'neon_combo', aiBias: ['aggressive', 'hunter', 'collector'],
    safeZone: 'Neon Lounge', relic: 'Neon Fragment',
  },
  crystalReef: {
    id: 'crystalReef', name: 'Crystal Reef', nameFa: '\u0635\u062e\u0631\u0647 \u06a9\u0631\u06cc\u0633\u062a\u0627\u0644', theme: 'crystal',
    bg: 0x061a22, fog: 0x061a22, fogDensity: 0.005, ground: 0x0a2430, gridA: 0x208080, gridB: 0x0e3040,
    accent: 0x40f0d0, secondary: 0x80ffe0, propColors: [0x0e3848, 0x40f0d0, 0xa0ffe8, 0x082838],
    foodTint: 0x60ffe0, skyTop: 0x0a3040, skyBot: 0x041018,
    boundsSoft: 1e9, eventBias: 'crystal_storm', aiBias: ['explorer', 'collector', 'defensive'],
    safeZone: 'Crystal Sanctuary', relic: 'Ancient Crystal',
  },
  emberValley: {
    id: 'emberValley', name: 'Ember Valley', nameFa: '\u062f\u0631\u0647 \u0627\u062e\u06af\u0631', theme: 'ember',
    bg: 0x1a0a08, fog: 0x1a0a08, fogDensity: 0.0065, ground: 0x221208, gridA: 0x803020, gridB: 0x301808,
    accent: 0xff6040, secondary: 0xffd060, propColors: [0x301808, 0xff6040, 0xffa040, 0x1a0c08],
    foodTint: 0xff9040, skyTop: 0x2a1008, skyBot: 0x100404,
    boundsSoft: 1e9, eventBias: 'meteor', aiBias: ['aggressive', 'giant', 'hunter'],
    safeZone: 'Ash Camp', relic: 'Ember Core',
  },
  voidStation: {
    id: 'voidStation', name: 'Void Station', nameFa: '\u0627\u06cc\u0633\u062a\u06af\u0627\u0647 \u062e\u0644\u0627\u0621', theme: 'void',
    bg: 0x080814, fog: 0x080814, fogDensity: 0.0045, ground: 0x10101c, gridA: 0x404080, gridB: 0x181830,
    accent: 0x8090ff, secondary: 0xc0d0ff, propColors: [0x181830, 0x6080ff, 0xa0b0ff, 0x0c0c18],
    foodTint: 0xa0b0ff, skyTop: 0x101028, skyBot: 0x040408,
    boundsSoft: 1e9, eventBias: 'ai_invasion', aiBias: ['defensive', 'elite', 'speedster'],
    safeZone: 'Station Hub', relic: 'Void Artifact',
  },
  auroraPeak: {
    id: 'auroraPeak', name: 'Aurora Peak', nameFa: '\u0642\u0644\u0647 \u0634\u0641\u0642', theme: 'aurora',
    bg: 0x08141c, fog: 0x08141c, fogDensity: 0.005, ground: 0x0c1c28, gridA: 0x208060, gridB: 0x103040,
    accent: 0x50ffc0, secondary: 0xa0ffe0, propColors: [0x103040, 0x50ffc0, 0xe0ffff, 0x081820],
    foodTint: 0x80ffe0, skyTop: 0x0c2840, skyBot: 0x041018,
    boundsSoft: 1e9, eventBias: 'food_storm', aiBias: ['explorer', 'defensive', 'collector'],
    safeZone: 'Frozen Sanctuary', relic: 'Aurora Shard',
  },
};

export const ZONE_TYPES = [
  'open', 'crystal', 'ruins', 'forest', 'industrial',
  'arena', 'treasure', 'danger', 'recovery', 'boss',
];

export const ZONE_LABELS = {
  open: 'Open Field', crystal: 'Crystal Zone', ruins: 'Ruins', forest: 'Forest',
  industrial: 'Industrial', arena: 'Arena', treasure: 'Treasure Zone',
  danger: 'Danger Zone', recovery: 'Safe Zone', boss: 'Boss Zone',
};
