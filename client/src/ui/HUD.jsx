import { useGameStore } from '../core/useGameStore.js';

const TIER_COLORS = { S: '#ff3333', A: '#ff9900', B: '#4499ff' };

export function HUD() {
  const { players, localPlayerId, shuffleCountdown, localBuffs, hitFlash } = useGameStore();
  const localPlayer   = players.find((p) => p.id === localPlayerId);
  const alivePlayers  = players.filter((p) => !p.eliminated);

  if (!localPlayer) return null;

  const hpPct       = Math.max(0, localPlayer.hp / localPlayer.maxHp);
  const tierColor   = TIER_COLORS[localPlayer.tier] || '#ffffff';
  const shuffleUrgent = shuffleCountdown <= 10;

  // HP colour: green → yellow → red
  const hpColor = hpPct > 0.5
    ? `hsl(${120 * hpPct * 2}, 90%, 50%)`   // green range
    : hpPct > 0.25
      ? '#ffaa00'                             // orange
      : '#ff3333';                            // red

  return (
    <>
      {/* ── Hit flash ──────────────────────────────────────────────────────── */}
      {hitFlash && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(255,0,0,0.28)',
          pointerEvents: 'none',
          zIndex: 100,
          animation: 'hitFlash 0.2s ease-out forwards',
        }} />
      )}

      {/* ── Top-center: shuffle timer ───────────────────────────────────────── */}
      <div style={{
        position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        zIndex: 50, pointerEvents: 'none',
      }}>
        <div style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 11, letterSpacing: 3, color: '#aa7733',
          fontWeight: 600,
        }}>
          POWER SHUFFLE IN
        </div>
        <div style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: shuffleUrgent ? 52 : 40,
          fontWeight: 700,
          color: shuffleUrgent ? '#ff3333' : '#ffd700',
          textShadow: shuffleUrgent ? '0 0 24px #ff000099' : '0 0 16px #ffaa0055',
          lineHeight: 1,
          transition: 'font-size 0.3s, color 0.3s',
        }}>
          {String(shuffleCountdown).padStart(2, '0')}s
        </div>
        {shuffleUrgent && (
          <div style={{ color: '#ff4444', fontSize: 11, fontWeight: 700, letterSpacing: 2, animation: 'pulse 0.6s infinite' }}>
            ⚡ INCOMING ⚡
          </div>
        )}
      </div>

      {/* ── Top-right: alive count ──────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', top: 16, right: 20,
        textAlign: 'right', zIndex: 50, pointerEvents: 'none',
      }}>
        <div style={{ fontSize: 10, color: '#cc9966', letterSpacing: 3, marginBottom: 1, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>ALIVE</div>
        <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 28, fontWeight: 700, color: '#ffd700', lineHeight: 1 }}>
          {alivePlayers.length}
          <span style={{ fontSize: 14, color: '#cc9966' }}>/{players.length}</span>
        </div>
      </div>

      {/* ── Bottom-left: player stat panel ─────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 20, left: 20,
        background: 'linear-gradient(160deg, rgba(8,4,0,0.94), rgba(20,10,0,0.90))',
        border: `1px solid ${tierColor}33`,
        borderLeft: `4px solid ${tierColor}`,
        borderRadius: 10,
        padding: '14px 20px',
        minWidth: 260,
        zIndex: 50,
        backdropFilter: 'blur(10px)',
        boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.3)`,
      }}>
        {/* Name + tier on one row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#ffd700', letterSpacing: 1 }}>
            {localPlayer.name}
          </div>
          <div style={{
            background: tierColor + '22',
            border: `1px solid ${tierColor}`,
            borderRadius: 4,
            padding: '2px 10px',
            fontSize: 12, fontWeight: 700,
            color: tierColor, letterSpacing: 2,
          }}>
            TIER {localPlayer.tier}
          </div>
        </div>

        {/* ── HP section ──────────────────────────────────────────────────── */}
        <div>
          {/* HP numbers — big and readable */}
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: 6,
          }}>
            <span style={{
              fontSize: 11,
              letterSpacing: 3,
              color: '#cc9966',
              textTransform: 'uppercase',
            }}>
              Health
            </span>
            <span style={{
              fontSize: 22,
              fontWeight: 700,
              fontFamily: "'Rajdhani', sans-serif",
              color: hpColor,
              textShadow: `0 0 10px ${hpColor}66`,
              transition: 'color 0.4s',
              lineHeight: 1,
            }}>
              {localPlayer.hp}
              <span style={{ fontSize: 14, color: '#cc9966', fontWeight: 400 }}>
                /{localPlayer.maxHp}
              </span>
            </span>
          </div>

          {/* The actual bar — tall and wide so it's instantly readable */}
          <div style={{
            position: 'relative',
            background: 'rgba(0,0,0,0.6)',
            borderRadius: 6,
            height: 18,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            {/* Filled portion */}
            <div style={{
              width: `${hpPct * 100}%`,
              height: '100%',
              background: hpPct > 0.5
                ? `linear-gradient(90deg, #22aa44, ${hpColor})`
                : hpPct > 0.25
                  ? `linear-gradient(90deg, #aa6600, ${hpColor})`
                  : `linear-gradient(90deg, #880000, ${hpColor})`,
              transition: 'width 0.15s ease-out, background 0.4s',
              borderRadius: 6,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.15)`,
            }} />
            {/* Shine overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, transparent 60%)',
              borderRadius: 6,
              pointerEvents: 'none',
            }} />
          </div>

          {/* Critical HP warning text */}
          {hpPct <= 0.25 && (
            <div style={{
              marginTop: 5,
              fontSize: 11,
              fontWeight: 700,
              color: '#ff3333',
              letterSpacing: 2,
              textAlign: 'center',
              animation: 'pulse 0.5s infinite',
            }}>
              ⚠ CRITICAL ⚠
            </div>
          )}
        </div>

        {/* Active buffs */}
        {Object.keys(localBuffs).length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            {Object.keys(localBuffs).map((type) => (
              <BuffBadge key={type} type={type} />
            ))}
          </div>
        )}
      </div>

      {/* ── Top-left: scoreboard ────────────────────────────────────────────── */}
      <Scoreboard players={players} localPlayerId={localPlayerId} />

      {/* ── Bottom-right: controls hint ─────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 20, right: 20,
        textAlign: 'right', zIndex: 50,
        opacity: 0.45, pointerEvents: 'none',
        fontFamily: "'Rajdhani', sans-serif",
      }}>
        {[['WASD', 'Move'], ['SPACE', 'Jump'], ['CLICK', 'Attack']].map(([key, action]) => (
          <div key={key} style={{ fontSize: 11, marginBottom: 3, color: '#aa8855' }}>
            <span style={{ color: '#ffd70077', fontWeight: 700 }}>{key}</span> {action}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes hitFlash { 0%{opacity:1} 100%{opacity:0} }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.35} }
      `}</style>
    </>
  );
}

// ── Buff badge ─────────────────────────────────────────────────────────────────
function BuffBadge({ type }) {
  const cfg = {
    shield: { icon: '🛡', label: 'SHIELD', color: '#4499ff' },
    speed:  { icon: '⚡', label: 'SPEED',  color: '#44ffaa' },
    damage: { icon: '💥', label: 'DMG',    color: '#ff6622' },
  }[type] || { icon: '?', label: type, color: '#ffffff' };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      background: cfg.color + '22',
      border: `1px solid ${cfg.color}55`,
      borderRadius: 4,
      padding: '3px 8px',
      fontSize: 11, fontWeight: 700, color: cfg.color,
      animation: 'pulse 1.5s infinite',
    }}>
      <span>{cfg.icon}</span><span>{cfg.label}</span>
    </div>
  );
}

// ── Scoreboard ─────────────────────────────────────────────────────────────────
function Scoreboard({ players, localPlayerId }) {
  const TIER_C = { S: '#ff3333', A: '#ff9900', B: '#4499ff' };
  const sorted = [...players].sort((a, b) => {
    if (a.eliminated !== b.eliminated) return a.eliminated ? 1 : -1;
    return b.hp - a.hp;
  });

  return (
    <div style={{
      position: 'fixed', top: 16, left: 16,
      background: 'rgba(8,4,0,0.88)',
      border: '1px solid #3a2a10',
      borderRadius: 8,
      padding: '10px 14px',
      minWidth: 190,
      zIndex: 50,
      backdropFilter: 'blur(8px)',
      pointerEvents: 'none',
      fontFamily: "'Rajdhani', sans-serif",
    }}>
      <div style={{
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: 10, color: '#cc9966',
        fontWeight: 700, letterSpacing: 3, marginBottom: 8,
        textTransform: 'uppercase',
      }}>
        Leaderboard
      </div>
      {sorted.map((p, i) => (
        <div key={p.id} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          marginBottom: 5,
          opacity: p.eliminated ? 0.35 : 1,
        }}>
          <span style={{ fontSize: 10, color: '#aa8866', minWidth: 14 }}>{i + 1}.</span>
          <span style={{
            fontSize: 13, fontWeight: 700, flex: 1,
            color: p.id === localPlayerId ? '#ffd700' : '#e0d0b0',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {p.name}{p.id === localPlayerId ? ' ★' : ''}
          </span>
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: TIER_C[p.tier],
            minWidth: 16, textAlign: 'center',
          }}>
            {p.eliminated ? '💀' : p.tier}
          </span>
          <span style={{
            fontSize: 11, color: '#cc9966',
            minWidth: 38, textAlign: 'right',
          }}>
            {p.eliminated ? '—' : `${p.hp}hp`}
          </span>
        </div>
      ))}
    </div>
  );
}