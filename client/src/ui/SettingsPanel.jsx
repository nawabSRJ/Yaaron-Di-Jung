import { useState, useEffect } from 'react';
import { audio } from '../systems/AudioSystem.js';

export function SettingsPanel() {
  const [open, setOpen]     = useState(false);
  const [bgmOn, setBgmOn]   = useState(audio.bgmEnabled);
  const [sfxOn, setSfxOn]   = useState(audio.sfxEnabled);
  const [bgmVol, setBgmVol] = useState(audio.bgmVolume);
  const [sfxVol, setSfxVol] = useState(audio.sfxVolume);

  const toggleBgm = () => { const n = !bgmOn; setBgmOn(n); audio.setBgmEnabled(n); };
  const toggleSfx = () => { const n = !sfxOn; setSfxOn(n); audio.setSfxEnabled(n); };

  const handleBgmVol = (e) => { const v = parseFloat(e.target.value); setBgmVol(v); audio.setBgmVolume(v); };
  const handleSfxVol = (e) => { const v = parseFloat(e.target.value); setSfxVol(v); audio.setSfxVolume(v); };

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (!e.target.closest('#ydj-settings')) setOpen(false); };
    setTimeout(() => document.addEventListener('click', close), 50);
    return () => document.removeEventListener('click', close);
  }, [open]);

  return (
    <div id="ydj-settings" style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 300 }}>

      {/* Sliding panel */}
      <div style={{
        position: 'absolute', bottom: 52, right: 0,
        width: 260,
        background: 'linear-gradient(160deg, rgba(10,5,0,0.97), rgba(20,10,0,0.95))',
        border: '1px solid rgba(180,120,0,0.35)',
        borderRadius: 12,
        padding: '18px 20px',
        fontFamily: "'Rajdhani', sans-serif",
        boxShadow: '0 -4px 30px rgba(0,0,0,0.6)',
        transform: open ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.97)',
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'all' : 'none',
        transition: 'transform 0.2s ease, opacity 0.2s ease',
      }}>
        <div style={{
          fontSize: 12, fontWeight: 700, letterSpacing: 3,
          color: '#cc9966', textTransform: 'uppercase',
          marginBottom: 16, borderBottom: '1px solid rgba(180,120,0,0.2)', paddingBottom: 10,
        }}>
          ⚙ Settings
        </div>

        <SettingRow label="Background Music" icon="🎵" enabled={bgmOn} volume={bgmVol} onToggle={toggleBgm} onVolume={handleBgmVol} />
        <SettingRow label="Sound Effects"    icon="🔊" enabled={sfxOn} volume={sfxVol} onToggle={toggleSfx} onVolume={handleSfxVol} />

        <div style={{ fontSize: 10, color: '#664433', marginTop: 12, lineHeight: 1.5 }}>
          SFX: punch · jump · footsteps · power-ups · hits
        </div>
      </div>

      {/* Gear button */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: 40, height: 40,
          background: open ? 'rgba(180,120,0,0.3)' : 'rgba(10,5,0,0.85)',
          border: '1px solid rgba(180,120,0,0.4)',
          borderRadius: 8, cursor: 'pointer', fontSize: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.2s, transform 0.2s',
          transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          backdropFilter: 'blur(6px)',
        }}
        title="Settings"
      >
        ⚙️
      </button>
    </div>
  );
}

function SettingRow({ label, icon, enabled, volume, onToggle, onVolume }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#e0c89a' }}>{icon} {label}</span>
        <div onClick={onToggle} style={{
          width: 38, height: 20,
          background: enabled ? '#cc7700' : '#2a1a08',
          border: '1px solid rgba(180,120,0,0.4)',
          borderRadius: 10, cursor: 'pointer', position: 'relative',
          transition: 'background 0.2s',
        }}>
          <div style={{
            position: 'absolute', top: 2, left: enabled ? 20 : 2,
            width: 14, height: 14, borderRadius: '50%',
            background: enabled ? '#ffd700' : '#664422',
            transition: 'left 0.2s',
          }} />
        </div>
      </div>
      <input
        type="range" min="0" max="1" step="0.05"
        value={volume} onChange={onVolume} disabled={!enabled}
        style={{ width: '100%', accentColor: '#cc7700', opacity: enabled ? 1 : 0.35, cursor: enabled ? 'pointer' : 'not-allowed' }}
      />
    </div>
  );
}