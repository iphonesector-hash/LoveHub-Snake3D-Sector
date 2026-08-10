/**
 * AchievementSystem — 30+ achievements, localStorage persistence, fully wired.
 */
export const ACHIEVEMENTS = [
  { id: 'first_kill', name: 'First Blood', nameFa: '\u0627\u0648\u0644\u06cc\u0646 \u062e\u0648\u0646', desc: 'Get your first kill', target: 1, stat: 'kills' },
  { id: 'kills_10', name: 'Hunter', nameFa: '\u0634\u06a9\u0627\u0631\u0686\u06cc', desc: '10 kills', target: 10, stat: 'kills' },
  { id: 'kills_50', name: 'Predator', nameFa: '\u0634\u06a9\u0627\u0631\u0686\u06cc \u0628\u0632\u0631\u06af', desc: '50 kills', target: 50, stat: 'kills' },
  { id: 'kills_100', name: 'Apex', nameFa: '\u0631\u0627\u0633', desc: '100 kills', target: 100, stat: 'kills' },
  { id: 'giant', name: 'Giant Snake', nameFa: '\u0645\u0627\u0631 \u0639\u0638\u06cc\u0645', desc: 'Reach mass 40', target: 40, stat: 'bestMass' },
  { id: 'colossus', name: 'Colossus', nameFa: '\u062c\u0628\u0627\u0631', desc: 'Reach mass 80', target: 80, stat: 'bestMass' },
  { id: 'survivor', name: 'Survivor', nameFa: '\u0646\u0627\u062c\u06cc', desc: 'Travel 500 distance', target: 500, stat: 'bestDistance' },
  { id: 'explorer', name: 'Explorer', nameFa: '\u06a9\u0627\u0634\u0641', desc: 'Travel 2000 distance', target: 2000, stat: 'bestDistance' },
  { id: 'level_5', name: 'Rising', nameFa: '\u0635\u0639\u0648\u062f', desc: 'Reach level 5', target: 5, stat: 'level' },
  { id: 'level_10', name: 'Veteran', nameFa: '\u0642\u062f\u06cc\u0645\u06cc', desc: 'Reach level 10', target: 10, stat: 'level' },
  { id: 'level_25', name: 'Master', nameFa: '\u0627\u0633\u062a\u0627\u062f', desc: 'Reach level 25', target: 25, stat: 'level' },
  { id: 'level_50', name: 'Legend', nameFa: '\u0627\u0641\u0633\u0627\u0646\u0647', desc: 'Reach level 50', target: 50, stat: 'level' },
  { id: 'level_100', name: 'Mythic', nameFa: '\u0627\u0633\u0637\u0648\u0631\u0647\u200c\u0627\u06cc', desc: 'Reach level 100', target: 100, stat: 'level' },
  { id: 'coins_500', name: 'Saver', nameFa: '\u067e\u0633\u0627\u0646\u062f\u0627\u0632', desc: 'Hold 500 coins', target: 500, stat: 'coins' },
  { id: 'coins_2000', name: 'Millionaire', nameFa: '\u0645\u06cc\u0644\u06cc\u0648\u0646\u0631', desc: 'Hold 2000 coins', target: 2000, stat: 'coins' },
  { id: 'score_1k', name: 'Scorer', nameFa: '\u0627\u0645\u062a\u06cc\u0627\u0632\u06af\u06cc\u0631', desc: 'Score 1000', target: 1000, stat: 'bestScore' },
  { id: 'score_5k', name: 'High Roller', nameFa: '\u0628\u0627\u0644\u0627\u0646\u0634\u06cc\u0646', desc: 'Score 5000', target: 5000, stat: 'bestScore' },
  { id: 'score_20k', name: 'Unstoppable', nameFa: '\u0646\u0627\u0645\u062d\u062f\u0648\u062f', desc: 'Score 20000', target: 20000, stat: 'bestScore' },
  { id: 'deaths_10', name: 'Persistent', nameFa: '\u067e\u0627\u06cc\u062f\u0627\u0631', desc: 'Die 10 times', target: 10, stat: 'deaths' },
  { id: 'worlds_3', name: 'Traveler', nameFa: '\u0645\u0633\u0627\u0641\u0631', desc: 'Visit 3 worlds', target: 3, stat: 'worldsVisited' },
  { id: 'worlds_all', name: 'World Traveler', nameFa: '\u062c\u0647\u0627\u0646\u06af\u0631\u062f', desc: 'Visit all worlds', target: 12, stat: 'worldsVisited' },
  { id: 'boss_1', name: 'Boss Slayer', nameFa: '\u0642\u0627\u062a\u0644 \u0628\u0627\u0633', desc: 'Defeat 1 boss', target: 1, stat: 'bossKills' },
  { id: 'boss_5', name: 'Boss Hunter', nameFa: '\u0634\u06a9\u0627\u0631\u0686\u06cc \u0628\u0627\u0633', desc: 'Defeat 5 bosses', target: 5, stat: 'bossKills' },
  { id: 'chests_5', name: 'Treasure Hunter', nameFa: '\u06af\u0646\u062c\u06cc\u0646\u0647\u200c\u06cc\u0627\u0628', desc: 'Open 5 chests', target: 5, stat: 'chests' },
  { id: 'chests_20', name: 'Treasure Lord', nameFa: '\u062e\u0632\u0627\u0646\u0647\u200c\u062f\u0627\u0631', desc: 'Open 20 chests', target: 20, stat: 'chests' },
  { id: 'powers_20', name: 'Power Collector', nameFa: '\u062c\u0645\u0639\u200c\u06a9\u0646\u0646\u062f\u0647 \u0642\u062f\u0631\u062a', desc: 'Collect 20 power-ups', target: 20, stat: 'powerUps' },
  { id: 'powers_100', name: 'Power Master', nameFa: '\u0627\u0633\u062a\u0627\u062f \u0642\u062f\u0631\u062a', desc: 'Collect 100 power-ups', target: 100, stat: 'powerUps' },
  { id: 'campaign_10', name: 'Campaign Starter', nameFa: '\u0634\u0631\u0648\u0639 \u0645\u0631\u0627\u062d\u0644', desc: 'Clear 10 campaign levels', target: 10, stat: 'campaignMax' },
  { id: 'campaign_50', name: 'Campaign Hero', nameFa: '\u0642\u0647\u0631\u0645\u0627\u0646 \u0645\u0631\u0627\u062d\u0644', desc: 'Clear 50 campaign levels', target: 50, stat: 'campaignMax' },
  { id: 'campaign_100', name: 'Campaign Legend', nameFa: '\u0627\u0641\u0633\u0627\u0646\u0647 \u0645\u0631\u0627\u062d\u0644', desc: 'Clear all 100 levels', target: 100, stat: 'campaignMax' },
];

const STORAGE_KEY = 'snake3d_achievements';

export class AchievementSystem {
  constructor() {
    this.unlocked = new Set();
    this.stats = {
      kills: 0, bestMass: 0, bestDistance: 0, level: 1, coins: 0,
      bestScore: 0, deaths: 0, worldsVisited: 0, bossKills: 0,
      chests: 0, powerUps: 0, campaignMax: 1,
    };
    this._visitedWorlds = new Set();
    this._load();
  }

  _load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (raw.unlocked) this.unlocked = new Set(raw.unlocked);
      if (raw.stats) Object.assign(this.stats, raw.stats);
      if (raw.worlds) this._visitedWorlds = new Set(raw.worlds);
      this.stats.worldsVisited = this._visitedWorlds.size;
    } catch {}
  }

  _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        unlocked: [...this.unlocked],
        stats: this.stats,
        worlds: [...this._visitedWorlds],
      }));
    } catch {}
  }

  track(stat, value) {
    if (typeof value === 'number') {
      if (stat === 'kills' || stat === 'deaths' || stat === 'bossKills' ||
          stat === 'chests' || stat === 'powerUps') {
        this.stats[stat] = (this.stats[stat] || 0) + value;
      } else {
        this.stats[stat] = Math.max(this.stats[stat] || 0, value);
      }
    }
    return this._check();
  }

  visitWorld(worldId) {
    if (!worldId) return [];
    this._visitedWorlds.add(worldId);
    this.stats.worldsVisited = this._visitedWorlds.size;
    return this._check();
  }

  _check() {
    const newly = [];
    for (const a of ACHIEVEMENTS) {
      if (this.unlocked.has(a.id)) continue;
      const v = this.stats[a.stat] || 0;
      if (v >= a.target) {
        this.unlocked.add(a.id);
        newly.push(a);
      }
    }
    if (newly.length) this._save();
    else this._save();
    return newly;
  }

  isUnlocked(id) { return this.unlocked.has(id); }
  getUnlockedCount() { return this.unlocked.size; }
  getAll() { return ACHIEVEMENTS; }
}
