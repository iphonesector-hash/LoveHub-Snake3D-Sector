/**
 * Campaign levels — progressive goals
 */

export const LEVELS = [
  { id: 1, world: 'sectorCity', targetScore: 80, targetLength: 10, timeLimit: 0, label: 'Awakening' },
  { id: 2, world: 'sectorCity', targetScore: 150, targetLength: 14, timeLimit: 0, label: 'First Circuit' },
  { id: 3, world: 'sectorCity', targetScore: 250, targetLength: 18, timeLimit: 90, label: 'Rush Hour' },
  { id: 4, world: 'neonDistrict', targetScore: 200, targetLength: 16, timeLimit: 0, label: 'Pink Pulse' },
  { id: 5, world: 'neonDistrict', targetScore: 320, targetLength: 20, timeLimit: 80, label: 'Neon Sprint' },
  { id: 6, world: 'crystalReef', targetScore: 280, targetLength: 18, timeLimit: 0, label: 'Reef Entry' },
  { id: 7, world: 'crystalReef', targetScore: 400, targetLength: 24, timeLimit: 100, label: 'Deep Blue' },
  { id: 8, world: 'emberValley', targetScore: 350, targetLength: 20, timeLimit: 0, label: 'Ember Trail' },
  { id: 9, world: 'emberValley', targetScore: 480, targetLength: 26, timeLimit: 90, label: 'Heat Wave' },
  { id: 10, world: 'voidStation', targetScore: 400, targetLength: 22, timeLimit: 0, label: 'Void Gate' },
  { id: 11, world: 'voidStation', targetScore: 550, targetLength: 28, timeLimit: 100, label: 'Station Core' },
  { id: 12, world: 'auroraPeak', targetScore: 500, targetLength: 26, timeLimit: 0, label: 'Aurora Rise' },
  { id: 13, world: 'auroraPeak', targetScore: 700, targetLength: 32, timeLimit: 120, label: 'Peak Master' },
  { id: 14, world: 'sectorCity', targetScore: 600, targetLength: 30, timeLimit: 75, label: 'City Legend' },
  { id: 15, world: 'neonDistrict', targetScore: 800, targetLength: 36, timeLimit: 90, label: 'Neon King' },
];

export function getLevel(id) {
  return LEVELS.find((l) => l.id === id) || LEVELS[0];
}

export function nextLevelId(id) {
  const i = LEVELS.findIndex((l) => l.id === id);
  if (i < 0 || i >= LEVELS.length - 1) return null;
  return LEVELS[i + 1].id;
}
