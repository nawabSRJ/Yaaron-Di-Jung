/**
 * AudioSystem — singleton audio manager for Yaaron Di Jung
 *
 * FILE PLACEMENT:
 * Put your audio files in:  client/public/audio/
 *
 * Required files (rename your downloaded files to match):
 *   bgm.mp3           — background music (loops forever)
 *   punch.mp3         — local player punches
 *   jump.mp3          — local player jumps
 *   footstep.mp3      — local player footstep (looped while moving)
 *   pickup_shield.mp3 — shield power-up collected
 *   pickup_speed.mp3  — speed power-up collected
 *   pickup_damage.mp3 — damage power-up collected
 *   eliminated.mp3    — local player gets eliminated
 *   shuffle.mp3       — power shuffle event
 *   hit_taken.mp3     — local player receives a hit
 *
 * All sounds are LOCAL ONLY — only the player themselves hears their own sounds.
 * No sound is broadcast to other players.
 */

const BASE = '/audio/';

class AudioSystem {
  constructor() {
    this._bgm         = null;
    this._footstep    = null;
    this._isFootstep  = false;

    // Settings (persisted to localStorage)
    this._bgmVolume   = parseFloat(localStorage.getItem('ydj_bgm_vol')  ?? '0.4');
    this._sfxVolume   = parseFloat(localStorage.getItem('ydj_sfx_vol')  ?? '0.7');
    this._bgmEnabled  = localStorage.getItem('ydj_bgm_on')  !== 'false';
    this._sfxEnabled  = localStorage.getItem('ydj_sfx_on')  !== 'false';

    // Pre-load SFX buffers so they play instantly with no delay
    this._cache = {};
    this._preload([
      'punch', 'jump', 'footstep',
      'pickup_shield', 'pickup_speed', 'pickup_damage',
      'eliminated', 'shuffle', 'hit_taken',
    ]);
  }

  // ── Pre-loading ─────────────────────────────────────────────────────────────
  _preload(names) {
    names.forEach((name) => {
      const audio = new Audio(`${BASE}${name}.mp3`);
      audio.preload = 'auto';
      this._cache[name] = audio;
    });
  }

  // ── BGM ─────────────────────────────────────────────────────────────────────
  startBGM() {
    if (this._bgm) return; // already running
    this._bgm = new Audio(`${BASE}bgm.mp3`);
    this._bgm.loop   = true;
    this._bgm.volume = this._bgmEnabled ? this._bgmVolume : 0;
    this._bgm.play().catch(() => {
      // Autoplay blocked — will start on first user interaction
      const resume = () => {
        this._bgm?.play().catch(() => {});
        window.removeEventListener('click', resume);
        window.removeEventListener('keydown', resume);
      };
      window.addEventListener('click',   resume, { once: true });
      window.addEventListener('keydown', resume, { once: true });
    });
  }

  stopBGM() {
    if (!this._bgm) return;
    this._bgm.pause();
    this._bgm.currentTime = 0;
    this._bgm = null;
  }

  // ── SFX playback ────────────────────────────────────────────────────────────
  play(name) {
    if (!this._sfxEnabled) return;
    const original = this._cache[name];
    if (!original) return;

    // Clone the audio node so rapid plays don't cut each other off
    const clone = original.cloneNode();
    clone.volume = this._sfxVolume;
    clone.play().catch(() => {});
  }

  // ── Footstep loop ──────────────────────────────────────────────────────────
  startFootstep() {
    if (this._isFootstep) return;
    this._isFootstep = true;
    const fs = this._cache['footstep'];
    if (!fs || !this._sfxEnabled) return;
    fs.loop   = true;
    fs.volume = this._sfxVolume * 0.5; // footsteps quieter than other SFX
    fs.play().catch(() => {});
  }

  stopFootstep() {
    if (!this._isFootstep) return;
    this._isFootstep = false;
    const fs = this._cache['footstep'];
    if (!fs) return;
    fs.pause();
    fs.currentTime = 0;
  }

  // ── Settings getters / setters ──────────────────────────────────────────────
  get bgmEnabled()  { return this._bgmEnabled; }
  get sfxEnabled()  { return this._sfxEnabled; }
  get bgmVolume()   { return this._bgmVolume; }
  get sfxVolume()   { return this._sfxVolume; }

  setBgmEnabled(val) {
    this._bgmEnabled = val;
    localStorage.setItem('ydj_bgm_on', val);
    if (this._bgm) this._bgm.volume = val ? this._bgmVolume : 0;
  }

  setSfxEnabled(val) {
    this._sfxEnabled = val;
    localStorage.setItem('ydj_sfx_on', val);
    if (!val) this.stopFootstep();
  }

  setBgmVolume(val) {
    this._bgmVolume = val;
    localStorage.setItem('ydj_bgm_vol', val);
    if (this._bgm && this._bgmEnabled) this._bgm.volume = val;
  }

  setSfxVolume(val) {
    this._sfxVolume = val;
    localStorage.setItem('ydj_sfx_vol', val);
    const fs = this._cache['footstep'];
    if (fs) fs.volume = val * 0.5;
  }
}

// Export a single shared instance used everywhere
export const audio = new AudioSystem();