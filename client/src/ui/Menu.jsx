import { useState, useEffect } from 'react';
import { socket } from '../core/socket.js';
import { useGameStore } from '../core/useGameStore.js';
import { audio } from '../systems/AudioSystem.js';

export function Menu() {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Start BGM as soon as the opening screen appears
  useEffect(() => {
    audio.startBGM();
  }, []);

  const setScreen = useGameStore((s) => s.setScreen);
  const setRoom = useGameStore((s) => s.setRoom);

  const handleCreate = () => {
    if (!name.trim()) return setError('Enter your name, yaar!');
    setLoading(true);
    socket.emit('room:create', { playerName: name.trim() }, (res) => {
      setLoading(false);
      if (res.error) return setError(res.error);
      useGameStore.setState({
        localPlayerId: socket.id,
        localPlayerName: name.trim(),
        roomId: res.roomId,
        isHost: true,
        players: res.lobby.players,
        screen: 'lobby',
      });
    });
  };

  const handleJoin = () => {
    if (!name.trim()) return setError('Enter your name first!');
    if (!roomCode.trim()) return setError('Enter the room code!');
    setLoading(true);
    socket.emit('room:join', { playerName: name.trim(), roomId: roomCode.trim().toUpperCase() }, (res) => {
      setLoading(false);
      if (res.error) return setError(res.error);
      useGameStore.setState({
        localPlayerId: socket.id,
        localPlayerName: name.trim(),
        roomId: res.roomId,
        isHost: false,
        players: res.lobby.players,
        screen: 'lobby',
      });
    });
  };

  return (
    <div style={styles.bg}>
      {/* Background decorative lines */}
      <div style={styles.bgLines} />

      <div style={styles.container}>
        {/* Game title */}
        <div style={styles.titleWrap}>
          <h1 style={styles.title}>Yaaron Di Jung</h1>
          <div style={styles.titleSub}>The Last Avatar Standing</div>
        </div>

        {/* Main card */}
        <div style={styles.card}>
          {/* Name input — always shown */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>YOUR NAME</label>
            <input
              style={styles.input}
              type="text"
              placeholder="Enter warrior name..."
              maxLength={16}
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter' && mode === 'create') handleCreate(); if (e.key === 'Enter' && mode === 'join') handleJoin(); }}
            />
          </div>

          {/* Mode selector */}
          {!mode && (
            <div style={styles.modeButtons}>
              <button style={styles.btnPrimary} onClick={() => setMode('create')}>
                ⚔️ Create Battle Room
              </button>
              <button style={styles.btnSecondary} onClick={() => setMode('join')}>
                🔗 Join with Code
              </button>
            </div>
          )}

          {/* Create mode */}
          {mode === 'create' && (
            <div style={{ animation: 'fadeIn 0.2s' }}>
              <button
                style={{ ...styles.btnPrimary, width: '100%' }}
                onClick={handleCreate}
                disabled={loading}
              >
                {loading ? '⏳ Creating...' : '🚀 Create Room'}
              </button>
              <button style={styles.backBtn} onClick={() => { setMode(null); setError(''); }}>
                ← Back
              </button>
            </div>
          )}

          {/* Join mode */}
          {mode === 'join' && (
            <div style={{ animation: 'fadeIn 0.2s' }}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>ROOM CODE</label>
                <input
                  style={{ ...styles.input, textTransform: 'uppercase', letterSpacing: 6, fontSize: 22, fontWeight: 700 }}
                  type="text"
                  placeholder="XXXXXX"
                  maxLength={6}
                  value={roomCode}
                  onChange={(e) => { setRoomCode(e.target.value.toUpperCase()); setError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                />
              </div>
              <button
                style={{ ...styles.btnPrimary, width: '100%' }}
                onClick={handleJoin}
                disabled={loading}
              >
                {loading ? '⏳ Joining...' : '🔗 Join Battle'}
              </button>
              <button style={styles.backBtn} onClick={() => { setMode(null); setError(''); setRoomCode(''); }}>
                ← Back
              </button>
            </div>
          )}

          {/* Error message */}
          {error && <div style={styles.error}>{error}</div>}
        </div>

        {/* Feature bullets */}
        <div style={styles.features}>
          {[
            ['⚡', 'Powers reshuffle every 60s — stay sharp'],
            ['🛡', 'Grab power-ups: Shield, Speed, Damage'],
            ['👁', 'Eliminated? Watch as a spectator'],
            ['👑', '2–7 warriors, one last one standing'],
          ].map(([icon, text]) => (
            <div key={text} style={styles.feature}>
              <span style={styles.featureIcon}>{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        input::placeholder { color: #4a3020; }
        input:focus { outline: none; border-color: rgba(255,200,0,0.5) !important; box-shadow: 0 0 12px rgba(255,180,0,0.15); }
      `}</style>
    </div>
  );
}

const styles = {
  bg: {
    position: 'fixed', inset: 0,
    background: 'radial-gradient(ellipse at 50% 30%, #1f0d00 0%, #0a0704 60%, #050302 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Rajdhani', sans-serif",
    overflowY: 'auto',
  },
  bgLines: {
    position: 'absolute', inset: 0,
    backgroundImage: `
      repeating-linear-gradient(0deg, transparent, transparent 80px, rgba(100,50,0,0.04) 80px, rgba(100,50,0,0.04) 81px),
      repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(100,50,0,0.04) 80px, rgba(100,50,0,0.04) 81px)
    `,
    pointerEvents: 'none',
  },
  container: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 16,
    width: '100%',
    maxWidth: 460,
    padding: '20px 20px',
    zIndex: 1,
  },
  titleWrap: {
    textAlign: 'center',
  },
  title: {
    fontFamily: "'Cinzel Decorative', serif",
    fontSize: 'clamp(32px, 6vw, 58px)',
    fontWeight: 900,
    color: '#ffd700',
    margin: 0,
    letterSpacing: 4,
    lineHeight: 1.1,
    whiteSpace: 'nowrap',
    textShadow: '0 0 40px rgba(255,200,0,0.5), 0 4px 8px rgba(0,0,0,0.9), 0 0 80px rgba(255,140,0,0.25)',
  },
  titleSub: {
    fontSize: 11,
    letterSpacing: 6,
    color: '#aa7733',
    marginTop: 6,
    textTransform: 'uppercase',
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 600,
  },
  card: {
    width: '100%',
    background: 'linear-gradient(160deg, rgba(22,12,4,0.97), rgba(12,6,2,0.98))',
    border: '1px solid rgba(160,100,0,0.25)',
    borderTop: '2px solid rgba(200,130,0,0.5)',
    borderRadius: 14,
    padding: '28px 32px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(150,80,0,0.08)',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    display: 'block',
    fontSize: 10,
    letterSpacing: 3,
    color: '#664422',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    background: 'rgba(255,180,50,0.05)',
    border: '1px solid rgba(150,100,0,0.3)',
    borderRadius: 8,
    padding: '12px 14px',
    fontSize: 16,
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 600,
    color: '#f0e6d3',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  modeButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginTop: 4,
  },
  btnPrimary: {
    padding: '13px 0',
    background: 'linear-gradient(135deg, #cc8800, #ff6600)',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 700,
    letterSpacing: 1,
    color: '#0a0400',
    cursor: 'pointer',
    transition: 'transform 0.1s, box-shadow 0.2s',
    boxShadow: '0 4px 20px rgba(200,100,0,0.25)',
  },
  btnSecondary: {
    padding: '12px 0',
    background: 'transparent',
    border: '1px solid rgba(150,100,0,0.4)',
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 600,
    color: '#aa7733',
    cursor: 'pointer',
    letterSpacing: 1,
  },
  backBtn: {
    display: 'block',
    width: '100%',
    marginTop: 8,
    padding: '8px 0',
    background: 'transparent',
    border: 'none',
    color: '#554433',
    fontSize: 13,
    fontFamily: "'Rajdhani', sans-serif",
    cursor: 'pointer',
    textAlign: 'center',
  },
  error: {
    marginTop: 12,
    padding: '8px 12px',
    background: 'rgba(200,0,0,0.1)',
    border: '1px solid rgba(200,0,0,0.3)',
    borderRadius: 6,
    color: '#ff6655',
    fontSize: 13,
    textAlign: 'center',
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    width: '100%',
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '7px 12px',
    background: 'rgba(255,180,0,0.04)',
    border: '1px solid rgba(100,60,0,0.2)',
    borderRadius: 7,
    fontSize: 12,
    color: '#886644',
  },
  featureIcon: {
    fontSize: 16,
  },
};