import { useEffect, useState } from 'react';
import { socket } from '../core/socket.js';
import { useGameStore } from '../core/useGameStore.js';

// ── Spectator overlay (shown over the 3D scene) ────────────────────────────────
export function SpectatorOverlay() {
  return (
    <div style={{
      position: 'fixed',
      top: 18,
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(10,5,0,0.88)',
      border: '1px solid rgba(255,100,0,0.3)',
      borderRadius: 10,
      padding: '10px 28px',
      zIndex: 150,
      textAlign: 'center',
      backdropFilter: 'blur(8px)',
      fontFamily: "'Rajdhani', sans-serif",
      pointerEvents: 'none',
    }}>
      <div style={{
        fontSize: 10, letterSpacing: 3,
        color: '#884422', marginBottom: 3,
      }}>
        YOU HAVE BEEN ELIMINATED
      </div>
      <div style={{ fontSize: 16, color: '#ff6644', fontWeight: 700 }}>
        👁 SPECTATING
      </div>
      <div style={{ fontSize: 11, color: '#554433', marginTop: 4 }}>
        Watch the battle unfold
      </div>
    </div>
  );
}

// ── Game over screen ────────────────────────────────────────────────────────────
export function GameEndScreen() {
  const { winner, players, localPlayerId } = useGameStore();
  const isWinner = winner?.id === localPlayerId;

  const handlePlayAgain = () => {
    window.location.reload();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'radial-gradient(ellipse at center, rgba(20,10,0,0.97) 0%, rgba(5,3,0,0.99) 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 300, fontFamily: "'Rajdhani', sans-serif",
      animation: 'fadeInScale 0.5s ease-out',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 440, padding: '0 24px' }}>

        {/* Trophy / skull */}
        <div style={{ fontSize: 72, marginBottom: 12, lineHeight: 1 }}>
          {isWinner ? '👑' : '💀'}
        </div>

        {/* Label */}
        <div style={{
          fontFamily: "'Cinzel Decorative', serif",
          fontSize: 11, letterSpacing: 5,
          color: '#664422', marginBottom: 10,
        }}>
          {isWinner ? 'VICTORY' : 'GAME OVER'}
        </div>

        {/* Winner name */}
        <div style={{
          fontFamily: "'Cinzel Decorative', serif",
          fontSize: 'clamp(24px, 5vw, 38px)',
          fontWeight: 900,
          color: isWinner ? '#ffd700' : '#ff4444',
          textShadow: isWinner
            ? '0 0 30px rgba(255,200,0,0.45)'
            : '0 0 20px rgba(255,0,0,0.35)',
          marginBottom: 8,
        }}>
          {winner?.name || 'Nobody'}
        </div>

        <div style={{ fontSize: 15, color: '#664422', marginBottom: 32 }}>
          {isWinner ? 'is the last warrior standing!' : 'has won the battle!'}
        </div>

        {/* Final standings */}
        <div style={{
          background: 'rgba(25,12,0,0.85)',
          border: '1px solid rgba(180,100,0,0.2)',
          borderRadius: 10, padding: '16px 20px',
          marginBottom: 28, textAlign: 'left',
        }}>
          <div style={{
            fontSize: 9, letterSpacing: 3, color: '#554433',
            marginBottom: 12, textTransform: 'uppercase',
          }}>
            Final Standings
          </div>

          {[...players]
            .sort((a, b) => {
              if (a.id === winner?.id) return -1;
              if (b.id === winner?.id) return 1;
              const aTime = a.eliminatedAt || 0;
              const bTime = b.eliminatedAt || 0;
              return bTime - aTime;
            })
            .map((p, i) => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '7px 0',
                borderBottom: i < players.length - 1
                  ? '1px solid rgba(50,25,5,0.6)'
                  : 'none',
              }}>
                <span style={{ fontSize: 18, minWidth: 28 }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                </span>
                <span style={{
                  flex: 1, fontWeight: 700, fontSize: 15,
                  color: p.id === localPlayerId ? '#ffd700' : '#f0e6d3',
                }}>
                  {p.name}
                  {p.id === localPlayerId &&
                    <span style={{ color: '#664422', fontSize: 11 }}> (You)</span>}
                </span>
                <span style={{ fontSize: 12, color: '#664433' }}>
                  {p.id === winner?.id ? '👑 Winner' : '💀'}
                </span>
              </div>
            ))}
        </div>

        {/* Play again */}
        <button
          onClick={handlePlayAgain}
          style={{
            padding: '13px 48px',
            fontFamily: "'Cinzel Decorative', serif",
            fontSize: 14, fontWeight: 700,
            color: '#0a0400',
            background: 'linear-gradient(135deg, #ffcc00, #ff8800)',
            border: 'none', borderRadius: 8,
            cursor: 'pointer', letterSpacing: 1,
            boxShadow: '0 0 24px rgba(255,150,0,0.3)',
            transition: 'filter 0.15s, transform 0.1s',
          }}
          onMouseEnter={(e) => e.target.style.filter = 'brightness(1.12)'}
          onMouseLeave={(e) => e.target.style.filter = 'brightness(1)'}
        >
          ⚔️ Play Again
        </button>
      </div>

      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.94); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

// ── Power shuffle announcement ──────────────────────────────────────────────────
export function ShuffleAnnouncement() {
  const [visible, setVisible] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onShuffle = () => {
      setVisible(true);
      setShow(true);
      // Start fade-out after 2.5s, fully hide at 3s
      setTimeout(() => setShow(false), 2500);
      setTimeout(() => setVisible(false), 3000);
    };

    socket.on('power:shuffle', onShuffle);
    return () => socket.off('power:shuffle', onShuffle);
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none', zIndex: 200,
      opacity: show ? 1 : 0,
      transition: 'opacity 0.5s ease-out',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontFamily: "'Cinzel Decorative', serif",
          fontSize: 'clamp(26px, 5vw, 50px)',
          fontWeight: 900,
          color: '#ffd700',
          textShadow: '0 0 40px rgba(255,200,0,0.8), 0 0 80px rgba(255,150,0,0.4)',
          letterSpacing: 3,
          animation: 'shufflePop 0.4s ease-out',
        }}>
          ⚡ POWER SHUFFLE ⚡
        </div>
        <div style={{
          fontSize: 14,
          color: '#ff8800',
          marginTop: 10,
          letterSpacing: 4,
          textTransform: 'uppercase',
          animation: 'shufflePop 0.4s ease-out 0.1s both',
        }}>
          The tides of battle have changed
        </div>
      </div>

      <style>{`
        @keyframes shufflePop {
          0%   { opacity: 0; transform: scale(0.6) translateY(10px); }
          65%  { opacity: 1; transform: scale(1.05) translateY(0); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}