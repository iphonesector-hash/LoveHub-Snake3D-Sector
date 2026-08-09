import { GameEngine, GameState } from './engine/GameEngine.js';
import { I18n } from './i18n/I18n.js';
import { LoveHubBridge } from './integration/LoveHubBridge.js';
import { GameNetworkService } from './network/GameNetworkService.js';
import { WORLD_DEFS } from './worlds/SectorCity.js';
import { LEVELS } from './data/levels.js';

class Snake3DApp {
  constructor() {
    this.i18n = new I18n();
    this.bridge = new LoveHubBridge();
    this.network = new GameNetworkService();
    this.engine = null; this.stats = null;
    this.pendingMode = 'arcade'; this.pendingLevel = 1; this.nextAfterClear = null;
    this.campaignProgress = this._loadProgress();
    this.els = {
      loading: document.getElementById('screen-loading'), menu: document.getElementById('screen-menu'),
      pause: document.getElementById('screen-pause'), gameover: document.getElementById('screen-gameover'),
      worlds: document.getElementById('screen-worlds'), settings: document.getElementById('screen-settings'),
      campaign: document.getElementById('screen-campaign'), levelclear: document.getElementById('screen-levelclear'),
      hud: document.getElementById('hud'), score: document.getElementById('score-value'),
      combo: document.getElementById('combo-display'), comboValue: document.getElementById('combo-value'),
      finalScore: document.getElementById('final-score'), finalBest: document.getElementById('final-best'),
      bestScore: document.getElementById('best-score'), coins: document.getElementById('coins'),
      playerLevel: document.getElementById('player-level'), loadingFill: document.getElementById('loading-fill'),
      loadingTip: document.getElementById('loading-tip'), clearScore: document.getElementById('clear-score'),
      hudLevel: document.getElementById('hud-level'), levelLabel: document.getElementById('level-label'),
      hudTimer: document.getElementById('hud-timer'), timerValue: document.getElementById('timer-value'),
      hudGoalBar: document.getElementById('hud-goal-bar'), hudGoal: document.getElementById('hud-goal'),
    };
  }
  _loadProgress() { try { return JSON.parse(localStorage.getItem('snake3d_campaign') || '{\"max\":1}'); } catch { return { max: 1 }; } }
  _saveProgress() { localStorage.setItem('snake3d_campaign', JSON.stringify(this.campaignProgress)); }
  async start() {
    this.i18n.apply(); this._bindUI(); this._buildWorlds(); this._buildLevels();
    this.stats = await this.bridge.getPlayerStats(); this._renderStats();
    this.engine = new GameEngine(document.getElementById('canvas-container'), {
      onStateChange: (s) => this._onState(s), onScore: (s, c) => this._onScore(s, c),
      onGameOver: (d) => this._onGameOver(d), onLevelClear: (d) => this._onLevelClear(d),
      onGoal: (d) => this._onGoal(d), onStatus: (d) => this._onStatus(d),
      onEvent: (d) => this._onEvent(d), onMission: (d) => this._onMission(d),
      onProgress: (d) => this._onProgress(d),
      onWorldEnter: (d) => this._onWorldEnter(d),
    });
    this._setLoading(0.3, 'init'); await this.engine.init(); this._setLoading(1, 'ready');
    await new Promise((r) => setTimeout(r, 150)); this.engine.startLoop(); this._showScreen('menu');
  }
  _buildWorlds() {
    const grid = document.getElementById('world-grid'); if (!grid) return; grid.innerHTML = '';
    Object.values(WORLD_DEFS).forEach((w) => {
      const btn = document.createElement('button'); btn.className = 'world-card';
      const name = this.i18n.language === 'fa' ? w.nameFa : w.name;
      btn.innerHTML = `<div class=\"world-name\">${name}</div><div class=\"world-meta\">${this.i18n.t('world_open')}</div>`;
      btn.addEventListener('click', () => { this.pendingMode = 'arcade'; this.engine.setWorld(w.id); this.engine.setMode('arcade'); this._play(); });
      grid.appendChild(btn);
    });
  }
  _buildLevels() {
    const list = document.getElementById('level-list'); if (!list) return; list.innerHTML = '';
    const fa = this.i18n.language === 'fa';
    LEVELS.forEach((lv) => {
      const open = lv.id <= (this.campaignProgress.max || 1);
      const btn = document.createElement('button');
      btn.className = 'level-card' + (open ? '' : ' locked'); btn.disabled = !open;
      const name = fa && lv.labelFa ? lv.labelFa : lv.label;
      const tip = fa && lv.tipFa ? lv.tipFa : (lv.tip || '');
      const g = lv.goal || {}; let goalTxt = g.type === 'score' ? `${g.value} pts` : g.type === 'length' ? `L${g.value}` : g.type === 'stars' ? `${g.value} ★` : g.type === 'crystals' ? `${g.value} ◆` : g.type === 'survive' ? `${g.value}s` : g.type === 'combo' ? `x${g.value}` : '';
      btn.innerHTML = `<span class=\"lv-id\">${lv.id}</span><span class=\"lv-name\">${name}<span class=\"lv-tip\">${tip}</span></span><span class=\"lv-goal\">${goalTxt}</span>`;
      if (open) btn.addEventListener('click', () => { this.pendingMode = 'campaign'; this.pendingLevel = lv.id; this.engine.setMode('campaign'); this.engine.setLevel(lv.id); this._play(); });
      list.appendChild(btn);
    });
  }
  _bindUI() {
    document.getElementById('btn-play')?.addEventListener('click', () => { this.pendingMode = 'arcade'; this.engine.setMode('arcade'); this._play(); });
    document.getElementById('btn-campaign')?.addEventListener('click', () => { this._buildLevels(); this._showScreen('campaign'); });
    document.getElementById('btn-campaign-back')?.addEventListener('click', () => this._showScreen('menu'));
    document.getElementById('btn-worlds')?.addEventListener('click', () => { this._buildWorlds(); this._showScreen('worlds'); });
    document.getElementById('btn-worlds-back')?.addEventListener('click', () => this._showScreen('menu'));
    document.getElementById('btn-settings')?.addEventListener('click', () => { this._syncSettingsUI(); this._showScreen('settings'); });
    document.getElementById('btn-settings-back')?.addEventListener('click', () => this._showScreen('menu'));
    document.getElementById('btn-retry')?.addEventListener('click', () => this._play());
    document.getElementById('btn-restart')?.addEventListener('click', () => this._play());
    document.getElementById('btn-resume')?.addEventListener('click', () => this.engine.resume());
    document.getElementById('btn-quit')?.addEventListener('click', () => this._toMenu());
    document.getElementById('btn-menu')?.addEventListener('click', () => this._toMenu());
    document.getElementById('btn-clear-menu')?.addEventListener('click', () => this._toMenu());
    document.getElementById('btn-pause')?.addEventListener('click', () => this.engine.pause());
    document.getElementById('btn-next-level')?.addEventListener('click', () => {
      if (this.nextAfterClear) { this.pendingMode = 'campaign'; this.pendingLevel = this.nextAfterClear; this.engine.setMode('campaign'); this.engine.setLevel(this.nextAfterClear); this._play(); }
      else this._toMenu();
    });
    const setLang = (lang) => { this.i18n.setLanguage(lang); this._updateLangButtons(); this._buildWorlds(); this._buildLevels(); };
    document.getElementById('btn-lang-en')?.addEventListener('click', () => setLang('en'));
    document.getElementById('btn-lang-fa')?.addEventListener('click', () => setLang('fa'));
    document.getElementById('btn-set-en')?.addEventListener('click', () => setLang('en'));
    document.getElementById('btn-set-fa')?.addEventListener('click', () => setLang('fa'));
    document.getElementById('btn-set-joy')?.addEventListener('click', () => {
      this.engine.input.side = this.engine.input.side === 'left' ? 'right' : 'left';
      localStorage.setItem('snake3d_joy_side', this.engine.input.side); this.engine.input._applySide();
    });
    document.getElementById('input-sens')?.addEventListener('input', (e) => this.engine.input.setSensitivity(Number(e.target.value) / 100));
  }
  _syncSettingsUI() {
    const sens = document.getElementById('input-sens');
    if (sens && this.engine?.input) sens.value = String(Math.round((this.engine.input.sensitivity || 1) * 100));
    this._updateLangButtons();
  }
  _updateLangButtons() {
    const en = this.i18n.language === 'en';
    ['btn-lang-en', 'btn-set-en'].forEach((id) => document.getElementById(id)?.classList.toggle('active', en));
    ['btn-lang-fa', 'btn-set-fa'].forEach((id) => document.getElementById(id)?.classList.toggle('active', !en));
  }
  _setLoading(pct, tip) {
    if (this.els.loadingFill) this.els.loadingFill.style.width = `${Math.floor(pct * 100)}%`;
    if (tip && this.els.loadingTip) this.els.loadingTip.textContent = this.i18n.t(tip) || tip;
  }
  _showScreen(name) {
    ['loading','menu','pause','gameover','worlds','settings','campaign','levelclear'].forEach((k) => this.els[k]?.classList.toggle('hidden', k !== name));
    this.els.hud?.classList.add('hidden');
  }
  _onState(s) {
    if (s === GameState.PLAYING) {
      ['loading','menu','pause','gameover','worlds','settings','campaign','levelclear'].forEach((k) => this.els[k]?.classList.add('hidden'));
      this.els.hud?.classList.remove('hidden');
      const camp = this.pendingMode === 'campaign';
      this.els.hudLevel?.classList.toggle('hidden', !camp);
      if (camp && this.els.levelLabel) this.els.levelLabel.textContent = `Lv ${this.pendingLevel}`;
    } else if (s === GameState.PAUSED) this.els.pause?.classList.remove('hidden');
    else if (s === GameState.GAMEOVER) { this.els.gameover?.classList.remove('hidden'); this.els.hud?.classList.add('hidden'); }
    else if (s === GameState.LEVELCLEAR) { this.els.levelclear?.classList.remove('hidden'); this.els.hud?.classList.add('hidden'); }
    else if (s === GameState.MENU) this._showScreen('menu');
  }
  _onScore(score, combo) {
    if (this.els.score) this.els.score.textContent = score;
    const massEl = document.getElementById('mass-value');
    if (massEl && this.engine) massEl.textContent = this.engine.getLength();
    if (combo > 1 && this.els.combo && this.els.comboValue) { this.els.combo.classList.remove('hidden'); this.els.comboValue.textContent = `x${combo.toFixed(1)}`; }
    else this.els.combo?.classList.add('hidden');
  }
  _onStatus(data) {
    if (!data) return;
    const map = {
      bite: ['fx-bite', 'BITE'], speed: ['fx-speed', 'SPD'], shield: ['fx-shield', 'SHIELD'],
      magnet: ['fx-magnet', 'MAG'], ghost: ['fx-ghost', 'GHOST'], multiplier: ['fx-mult', 'x2'],
      freeze: ['fx-freeze', 'FRZ'], golden_bite: ['fx-gbite', 'G-BITE'], double_xp: ['fx-xp', '2XP'],
    };
    for (const [k, [id, label]] of Object.entries(map)) {
      const el = document.getElementById(id);
      if (!el) continue;
      const v = data[k] || 0;
      el.classList.toggle('hidden', !(v > 0));
      el.textContent = v > 0 ? `${label} ${Math.ceil(v)}s` : '';
    }
    const riv = document.getElementById('rivals-count');
    if (riv) riv.textContent = data.rivals ?? 0;
    const dist = document.getElementById('hud-distance');
    if (dist) dist.textContent = data.distance ?? 0;
    const zone = document.getElementById('hud-zone');
    if (zone) zone.textContent = data.zone || '';
  }
  _onEvent(data) {
    const el = document.getElementById('hud-event');
    if (!el) return;
    if (!data) { el.classList.add('hidden'); el.textContent = ''; return; }
    el.classList.remove('hidden');
    const fa = this.i18n.language === 'fa';
    el.textContent = fa && data.labelFa ? data.labelFa : data.label;
    el.style.borderColor = data.color || '#3dffb5';
  }
  _onMission(data) {
    const el = document.getElementById('hud-mission');
    if (!el) return;
    if (!data) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    const fa = this.i18n.language === 'fa';
    const label = fa && data.labelFa ? data.labelFa : data.label;
    el.textContent = data.done ? `✓ ${label}` : `${label} (${data.progress}/${data.target})`;
    el.classList.toggle('done', !!data.done);
  }
  _onProgress(data) {
    if (!data) return;
    const dist = document.getElementById('hud-distance');
    if (dist) dist.textContent = data.distance ?? 0;
  }
  _onWorldEnter(def) {
    if (!def) return;
    const el = document.getElementById('hud-world-banner');
    if (!el) return;
    const fa = this.i18n.language === 'fa';
    const title = fa && def.nameFa ? def.nameFa : def.name;
    const sub = fa && def.taglineFa ? def.taglineFa : (def.tagline || '');
    el.innerHTML = '<div class="wb-title">' + title + '</div><div class="wb-sub">' + sub + '</div>';
    el.classList.remove('hidden');
    el.style.borderColor = def.accent ? '#' + Number(def.accent).toString(16).padStart(6, '0') : '#2ee6ff';
    clearTimeout(this._wbTimer);
    this._wbTimer = setTimeout(function() { el.classList.add('hidden'); }, 3200);
  }
  _onGoal(data) {
    if (!this.els.hudGoalBar || !this.els.hudGoal) return;
    if (!data?.level) { this.els.hudGoalBar.classList.add('hidden'); return; }
    this.els.hudGoalBar.classList.remove('hidden');
    const g = data.level.goal, p = data.progress || {}, fa = this.i18n.language === 'fa';
    let text = '';
    if (g.type === 'score') text = fa ? `امتیاز ${p.score||0}/${g.value}` : `Score ${p.score||0}/${g.value}`;
    else if (g.type === 'length') text = fa ? `طول ${p.length||0}/${g.value}` : `Length ${p.length||0}/${g.value}`;
    else if (g.type === 'stars') text = fa ? `ستاره ${p.stars||0}/${g.value}` : `Stars ${p.stars||0}/${g.value}`;
    else if (g.type === 'crystals') text = fa ? `کریستال ${p.crystals||0}/${g.value}` : `Crystals ${p.crystals||0}/${g.value}`;
    else if (g.type === 'survive') text = fa ? `زنده ${Math.floor(p.survive||0)}/${g.value}ث` : `Survive ${Math.floor(p.survive||0)}/${g.value}s`;
    else if (g.type === 'combo') text = `Combo x${(p.combo||1).toFixed(1)} / x${g.value}`;
    this.els.hudGoal.textContent = text;
  }
  async _onGameOver(data) {
    if (this.els.finalScore) this.els.finalScore.textContent = data.score;
    this.stats = await this.bridge.submitScore(data.score); this._renderStats();
    if (this.els.finalBest) this.els.finalBest.textContent = this.stats.bestScore;
  }
  _onLevelClear(data) {
    if (this.els.clearScore) this.els.clearScore.textContent = data.score;
    this.nextAfterClear = data.nextLevelId;
    if (data.nextLevelId && data.nextLevelId > (this.campaignProgress.max || 1)) { this.campaignProgress.max = data.nextLevelId; this._saveProgress(); }
    document.getElementById('btn-next-level')?.classList.toggle('hidden', !data.nextLevelId);
    this.bridge.submitScore(data.score);
  }
  _renderStats() {
    if (!this.stats) return;
    if (this.els.bestScore) this.els.bestScore.textContent = this.stats.bestScore || 0;
    if (this.els.coins) this.els.coins.textContent = this.stats.coins || 0;
    if (this.els.playerLevel) this.els.playerLevel.textContent = this.stats.level || 1;
  }
  _play() {
    this.engine.setMode(this.pendingMode);
    if (this.pendingMode === 'campaign') this.engine.setLevel(this.pendingLevel);
    this.engine.startGame();
    const massEl = document.getElementById('mass-value');
    if (massEl) massEl.textContent = this.engine.getLength();
    if (this.els.score) this.els.score.textContent = '0';
  }
  _toMenu() {
    this.engine.setState(GameState.MENU);
    this.engine.input.setEnabled(false);
    this.engine.input.showControls?.(false);
  }
}
const app = new Snake3DApp();
app.start().catch((err) => {
  console.error('[Snake3D] boot failed', err);
  const tip = document.getElementById('loading-tip');
  if (tip) tip.textContent = 'Failed to load. Please refresh.';
});
