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
    this.pendingMode = 'solo';

    this.els = {
      loading: document.getElementById('screen-loading'),
      menu: document.getElementById('screen-menu'),
      pause: document.getElementById('screen-pause'),
      gameover: document.getElementById('screen-gameover'),
      worlds: document.getElementById('screen-worlds'),
      settings: document.getElementById('screen-settings'),
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
      duoResult: document.getElementById('duo-result'),
    };
  }

  async start() {
    this.i18n.apply();
    this._bindUI();
    this.stats = await this.bridge.getPlayerStats();
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

    await new Promise((r) => setTimeout(r, 180));
    this.engine.startLoop();
    this._showScreen('menu');
  }

  _bindUI() {
    document.getElementById('btn-play')?.addEventListener('click', () => { this.pendingMode = 'solo'; this._play(); });
    document.getElementById('btn-duo')?.addEventListener('click', () => { this.pendingMode = 'local2'; this._play(); });
    document.getElementById('btn-retry')?.addEventListener('click', () => this._play());
    document.getElementById('btn-restart')?.addEventListener('click', () => this._play());
    document.getElementById('btn-resume')?.addEventListener('click', () => this.engine.resume());
    document.getElementById('btn-quit')?.addEventListener('click', () => this._toMenu());
    document.getElementById('btn-menu')?.addEventListener('click', () => this._toMenu());
    document.getElementById('btn-pause')?.addEventListener('click', () => this.engine.pause());
    document.getElementById('btn-worlds')?.addEventListener('click', () => this._showScreen('worlds'));
    document.getElementById('btn-worlds-back')?.addEventListener('click', () => this._showScreen('menu'));
    document.getElementById('btn-settings')?.addEventListener('click', () => { this._syncSettingsUI(); this._showScreen('settings'); });
    document.getElementById('btn-settings-back')?.addEventListener('click', () => this._showScreen('menu'));

    const setLang = (lang) => { this.i18n.setLanguage(lang); this._updateLangButtons(); };
    document.getElementById('btn-lang-en')?.addEventListener('click', () => setLang('en'));
    document.getElementById('btn-lang-fa')?.addEventListener('click', () => setLang('fa'));
    document.getElementById('btn-set-en')?.addEventListener('click', () => setLang('en'));
    document.getElementById('btn-set-fa')?.addEventListener('click', () => setLang('fa'));

    document.getElementById('btn-set-joy')?.addEventListener('click', () => {
      const side = this.engine.input.side === 'left' ? 'right' : 'left';
      this.engine.input.side = side;
      localStorage.setItem('snake3d_joy_side', side);
      this.engine.input._applySide();
    });

    document.getElementById('input-sens')?.addEventListener('input', (e) => {
      this.engine.input.setSensitivity(Number(e.target.value) / 100);
    });
  }

  _syncSettingsUI() {
    const sens = document.getElementById('input-sens');
    if (sens && this.engine?.input) sens.value = String(Math.round((this.engine.input.sensitivity || 1) * 100));
    this._updateLangButtons();
  }

  _updateLangButtons() {
    const en = this.i18n.language === 'en';
    document.getElementById('btn-lang-en')?.classList.toggle('active', en);
    document.getElementById('btn-lang-fa')?.classList.toggle('active', !en);
    document.getElementById('btn-set-en')?.classList.toggle('active', en);
    document.getElementById('btn-set-fa')?.classList.toggle('active', !en);
  }

  _setLoading(pct, tip) {
    if (this.els.loadingFill) this.els.loadingFill.style.width = `${Math.floor(pct * 100)}%`;
    if (tip && this.els.loadingTip) this.els.loadingTip.textContent = this.i18n.t(tip) || tip;
  }

  _showScreen(name) {
    const map = {
      loading: this.els.loading, menu: this.els.menu, pause: this.els.pause,
      gameover: this.els.gameover, worlds: this.els.worlds, settings: this.els.settings,
    };
    Object.entries(map).forEach(([k, el]) => { if (el) el.classList.toggle('hidden', k !== name); });
    if (this.els.hud) this.els.hud.classList.add('hidden');
  }

  _onState(s) {
    if (s === GameState.PLAYING) {
      this._showScreen(null);
      if (this.els.hud) this.els.hud.classList.remove('hidden');
      ['loading','menu','pause','gameover','worlds','settings'].forEach((k) => this.els[k]?.classList.add('hidden'));
    } else if (s === GameState.PAUSED) {
      this.els.pause?.classList.remove('hidden');
    } else if (s === GameState.GAMEOVER) {
      this.els.gameover?.classList.remove('hidden');
      if (this.els.hud) this.els.hud.classList.add('hidden');
    } else if (s === GameState.MENU) {
      this._showScreen('menu');
    }
  }

  _onScore(score, combo) {
    if (this.els.score) this.els.score.textContent = score;
    const massEl = document.getElementById('mass-value');
    if (massEl && this.engine) massEl.textContent = this.engine.getLength();
    if (combo > 1 && this.els.combo && this.els.comboValue) {
      this.els.combo.classList.remove('hidden');
      this.els.comboValue.textContent = `x${combo.toFixed(1)}`;
    } else if (this.els.combo) this.els.combo.classList.add('hidden');
  }

  async _onGameOver(data) {
    if (this.els.finalScore) this.els.finalScore.textContent = data.score;
    if (this.els.duoResult) {
      if (data.mode === 'local2' && data.winner) {
        this.els.duoResult.classList.remove('hidden');
        this.els.duoResult.textContent = data.winner === 'p1' ? this.i18n.t('winner_p1') : this.i18n.t('winner_p2');
      } else this.els.duoResult.classList.add('hidden');
    }
    this.stats = await this.bridge.submitScore(data.score);
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
    this.engine.setMode(this.pendingMode);
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
