import { useEffect, useState } from 'react';
import { useGameStore } from '../core/useGameStore.js';
import { socket } from '../core/socket.js';

// ── Spectator overlay ──────────────────────────────────────────────────────────
export function SpectatorOverlay() {
  return (
    <div style={{
      position: 'fixed', top: 18, left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(10,5,0,0.88)',
      border: '1px solid rgba(255,100,0,0.3)',
      borderRadius: 10, padding: '10px 28px',
      zIndex: 150, textAlign: 'center',
      backdropFilter: 'blur(8px)',
      fontFamily: "'Rajdhani', sans-serif",
      pointerEvents: 'none',
    }}>
      <div style={{ fontSize: 10, letterSpacing: 3, color: '#884422', marginBottom: 3 }}>
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
  const { winner, players, localPlayerId, isHost } = useGameStore();
  const isWinner = winner?.id === localPlayerId;
  const [waiting, setWaiting] = useState(false);

  // Host resets room → server broadcasts lobby:update → SocketManager moves
  // everyone back to lobby screen. No reload, same room code, same group.
  const handlePlayAgain = () => {
    setWaiting(true);
    socket.emit('game:replay', {}, (res) => {
      if (res?.error) {
        setWaiting(false);
        alert(res.error);
      }
      // Success: lobby:update from server handles screen transition for everyone
    });
  };

  // Leave room entirely → go back to main menu
  const handleLeave = () => {
    socket.emit('room:leave');
    useGameStore.setState({
      screen: 'menu',
      roomId: null,
      players: [],
      winner: null,
      powerups: [],
      gamePhase: 'lobby',
      isHost: false,
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'radial-gradient(ellipse at center, rgba(20,10,0,0.97) 0%, rgba(5,3,0,0.99) 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 300, fontFamily: "'Rajdhani', sans-serif",
      animation: 'fadeIn 0.5s ease-out',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 420, padding: 40 }}>

        <div style={{ fontSize: 60, marginBottom: 12 }}>
          {isWinner ? '👑' : '💀'}
        </div>

        <div style={{
          fontFamily: "'Cinzel Decorative', serif",
          fontSize: 13, letterSpacing: 4, color: '#664422', marginBottom: 8,
        }}>
          {isWinner ? 'VICTORY' : 'GAME OVER'}
        </div>

        <div style={{
          fontFamily: "'Cinzel Decorative', serif",
          fontSize: 32, fontWeight: 900,
          color: isWinner ? '#ffd700' : '#ff4444',
          textShadow: isWinner ? '0 0 30px rgba(255,200,0,0.4)' : '0 0 20px rgba(255,0,0,0.3)',
          marginBottom: 6,
        }}>
          {winner?.name || 'Nobody'}
        </div>

        <div style={{ fontSize: 15, color: '#664422', marginBottom: 28 }}>
          {isWinner ? 'is the last warrior standing!' : 'has won the battle!'}
        </div>

        {/* Final standings */}
        <div style={{
          background: 'rgba(30,15,0,0.8)',
          border: '1px solid rgba(180,100,0,0.2)',
          borderRadius: 10, padding: '16px 20px',
          marginBottom: 28, textAlign: 'left',
        }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: '#cc9966', marginBottom: 10 }}>
            FINAL STANDINGS
          </div>
          {[...players]
            .sort((a, b) => {
              if (a.id === winner?.id) return -1;
              if (b.id === winner?.id) return 1;
              return (b.eliminatedAt || 0) - (a.eliminatedAt || 0);
            })
            .map((p, i) => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '6px 0',
                borderBottom: i < players.length - 1 ? '1px solid rgba(50,30,10,0.5)' : 'none',
              }}>
                <span style={{ fontSize: 16, minWidth: 24 }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                </span>
                <span style={{ flex: 1, fontWeight: 700, color: p.id === localPlayerId ? '#ffd700' : '#f0e6d3' }}>
                  {p.name}
                  {p.id === localPlayerId && <span style={{ color: '#664422', fontSize: 11 }}> (You)</span>}
                </span>
                <span style={{ fontSize: 12, color: '#664433' }}>
                  {p.id === winner?.id ? '👑' : '💀'}
                </span>
              </div>
            ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>

          {/* Play Again — host only triggers the reset */}
          {isHost ? (
            <button
              onClick={handlePlayAgain}
              disabled={waiting}
              style={{
                padding: '13px 32px',
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: 15, fontWeight: 700, letterSpacing: 2,
                color: '#0a0400',
                background: waiting ? 'rgba(150,100,0,0.4)' : 'linear-gradient(135deg, #ffcc00, #ff8800)',
                border: 'none', borderRadius: 8,
                cursor: waiting ? 'not-allowed' : 'pointer',
                boxShadow: '0 0 20px rgba(255,150,0,0.3)',
                opacity: waiting ? 0.7 : 1,
                transition: 'filter 0.15s',
              }}
            >
              {waiting ? '⏳ Resetting...' : '⚔️ Play Again'}
            </button>
          ) : (
            /* Non-host waits for host to reset */
            <div style={{
              padding: '13px 20px', fontSize: 13, color: '#664422',
              border: '1px solid rgba(100,60,0,0.3)', borderRadius: 8,
            }}>
              ⏳ Waiting for host to start again...
            </div>
          )}

          {/* Leave — visible to everyone */}
          <button
            onClick={handleLeave}
            style={{
              padding: '13px 24px',
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: 15, fontWeight: 700, letterSpacing: 1,
              color: '#cc9966', background: 'transparent',
              border: '1px solid rgba(150,100,0,0.4)',
              borderRadius: 8, cursor: 'pointer',
            }}
          >
            🚪 Leave
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}

// ── Power shuffle announcement ─────────────────────────────────────────────────
export function ShuffleAnnouncement() {
  const [visible, setVisible] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onShuffle = () => {
      setVisible(true);
      setShow(true);
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
          fontWeight: 900, color: '#ffd700',
          textShadow: '0 0 40px rgba(255,200,0,0.8), 0 0 80px rgba(255,150,0,0.4)',
          letterSpacing: 3,
          animation: 'shufflePop 0.4s ease-out',
        }}>
          ⚡ POWER SHUFFLE ⚡
        </div>
        <div style={{
          fontSize: 14, color: '#ff8800', marginTop: 10,
          letterSpacing: 4, textTransform: 'uppercase',
          fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
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