/**
 * LoveHub Snake 3D — Sector Edition
 * Entry point
 */

import { GameEngine, GameState } from './engine/GameEngine.js';
import { I18n } from './i18n/I18n.js';
import { LoveHubBridge } from './integration/LoveHubBridge.js';
import { GameNetworkService } from './network/GameNetworkService.js';

class Snake3DApp {
  constructor() {
    this.i18n = new I18n();
    this.bridge = new LoveHubBridge();
    this.network = new GameNetworkService();
    this.engine = null;
    this.stats = null;

    this.els = {
      loading: document.getElementById('screen-loading'),
      menu: document.getElementById('screen-menu'),
      pause: document.getElementById('screen-pause'),
      gameover: document.getElementById('screen-gameover'),
      hud: document.getElementById('hud'),
      score: document.getElementById('score-value'),
      combo: document.getElementById('combo-display'),
      comboValue: document.getElementById('combo-value'),
      finalScore: document.getElementById('final-score'),
      finalBest: document.getElementById('final-best'),
      bestScore: document.getElementById('best-score'),
      coins: document.getElementById('coins'),
      playerLevel: document.getElementById('player-level'),
      loadingFill: document.getElementById('loading-fill'),
      loadingTip: document.getElementById('loading-tip'),
    };
  }

  async start() {
    this.i18n.apply();
    this._bindUI();
    this.stats = await this.bridge.getStats();
    this._renderStats();

    const container = document.getElementById('canvas-container');
    this.engine = new GameEngine(container, {
      onStateChange: (s) => this._onState(s),
      onScore: (score, combo) => this._onScore(score, combo),
      onGameOver: (data) => this._onGameOver(data),
    });

    this._setLoading(0.3, 'init');
    await this.engine.init();
    this._setLoading(1, 'ready');

    await new Promise((r) => setTimeout(r, 200));
    this.engine.startLoop();
    this._showScreen('menu');
  }

  _bindUI() {
    document.getElementById('btn-play')?.addEventListener('click', () => this._play());
    document.getElementById('btn-retry')?.addEventListener('click', () => this._play());
    document.getElementById('btn-restart')?.addEventListener('click', () => this._play());
    document.getElementById('btn-resume')?.addEventListener('click', () => this.engine.resume());
    document.getElementById('btn-quit')?.addEventListener('click', () => this._toMenu());
    document.getElementById('btn-menu')?.addEventListener('click', () => this._toMenu());
    document.getElementById('btn-pause')?.addEventListener('click', () => this.engine.pause());
    document.getElementById('btn-lang-en')?.addEventListener('click', () => {
      this.i18n.setLanguage('en');
      this._updateLangButtons();
    });
    document.getElementById('btn-lang-fa')?.addEventListener('click', () => {
      this.i18n.setLanguage('fa');
      this._updateLangButtons();
    });
  }

  _updateLangButtons() {
    document.getElementById('btn-lang-en')?.classList.toggle('active', this.i18n.language === 'en');
    document.getElementById('btn-lang-fa')?.classList.toggle('active', this.i18n.language === 'fa');
  }

  _setLoading(pct, tip) {
    if (this.els.loadingFill) this.els.loadingFill.style.width = `${Math.floor(pct * 100)}%`;
    if (tip && this.els.loadingTip) this.els.loadingTip.textContent = this.i18n.t(tip) || tip;
  }

  _showScreen(name) {
    const map = {
      loading: this.els.loading,
      menu: this.els.menu,
      pause: this.els.pause,
      gameover: this.els.gameover,
    };
    Object.entries(map).forEach(([k, el]) => {
      if (!el) return;
      el.classList.toggle('hidden', k !== name);
    });
    if (this.els.hud) this.els.hud.classList.toggle('hidden', name !== null && name !== 'playing');
  }

  _onState(s) {
    if (s === GameState.PLAYING) {
      this._showScreen(null);
      if (this.els.hud) this.els.hud.classList.remove('hidden');
      if (this.els.menu) this.els.menu.classList.add('hidden');
      if (this.els.pause) this.els.pause.classList.add('hidden');
      if (this.els.gameover) this.els.gameover.classList.add('hidden');
      if (this.els.loading) this.els.loading.classList.add('hidden');
    } else if (s === GameState.PAUSED) {
      this.els.pause?.classList.remove('hidden');
    } else if (s === GameState.GAMEOVER) {
      this.els.gameover?.classList.remove('hidden');
      if (this.els.hud) this.els.hud.classList.add('hidden');
    } else if (s === GameState.MENU) {
      this._showScreen('menu');
      if (this.els.hud) this.els.hud.classList.add('hidden');
    }
  }

  _onScore(score, combo) {
    if (this.els.score) this.els.score.textContent = score;
    const massEl = document.getElementById('mass-value');
    if (massEl && this.engine) massEl.textContent = this.engine.getLength();
    if (combo > 1 && this.els.combo && this.els.comboValue) {
      this.els.combo.classList.remove('hidden');
      this.els.comboValue.textContent = `x${combo.toFixed(1)}`;
    } else if (this.els.combo) {
      this.els.combo.classList.add('hidden');
    }
  }

  async _onGameOver(data) {
    if (this.els.finalScore) this.els.finalScore.textContent = data.score;
    this.stats = await this.bridge.saveScore(data.score);
    this._renderStats();
    if (this.els.finalBest) this.els.finalBest.textContent = this.stats.bestScore;
  }

  _renderStats() {
    if (!this.stats) return;
    if (this.els.bestScore) this.els.bestScore.textContent = this.stats.bestScore || 0;
    if (this.els.coins) this.els.coins.textContent = this.stats.coins || 0;
    if (this.els.playerLevel) this.els.playerLevel.textContent = this.stats.level || 1;
  }

  _play() {
    this.engine.startGame();
    const massEl = document.getElementById('mass-value');
    if (massEl) massEl.textContent = this.engine.getLength();
    if (this.els.score) this.els.score.textContent = '0';
  }

  _toMenu() {
    this.engine.setState(GameState.MENU);
    this.engine.input.setEnabled(false);
    this.engine.input.showControls?.(false);
    this.engine.input.showJoystick?.(false);
  }
}

const app = new Snake3DApp();
app.start().catch((err) => {
  console.error('[Snake3D] boot failed', err);
  const tip = document.getElementById('loading-tip');
  if (tip) tip.textContent = 'Failed to load. Please refresh.';
});
