import { useState } from 'react';
import { socket } from '../core/socket.js';
import { useGameStore } from '../core/useGameStore.js';

const TIER_COLORS = { S: '#ff3333', A: '#ff9900', B: '#4499ff' };

export function Lobby() {
  const { roomId, isHost, players, localPlayerId } = useGameStore();

  const handleStart = () => {
    socket.emit('game:start', {}, (res) => {
      if (res?.error) alert(res.error);
    });
  };

  const canStart = players.length >= 2;

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        {/* Title */}
        <div style={styles.title}>Yaaron Di Jung</div>
        <div style={styles.subtitle}>⚔️ Warriors Ready ⚔️</div>

        {/* Room code */}
        <div style={styles.roomCode}>
          <div style={styles.roomLabel}>ROOM CODE</div>
          <div style={styles.roomId}>{roomId}</div>
          <div style={styles.roomHint}>Share this code with your yaars</div>
        </div>

        {/* Player list */}
        <div style={styles.playerList}>
          <div style={styles.sectionLabel}>
            Warriors ({players.length}/7)
          </div>
          {players.map((p) => (
            <div key={p.id} style={{
              ...styles.playerRow,
              background: p.id === localPlayerId
                ? 'linear-gradient(90deg,rgba(180,120,0,0.15),transparent)'
                : 'transparent',
              borderLeft: p.id === localPlayerId ? '2px solid #ffd700' : '2px solid transparent',
            }}>
              <div style={styles.playerDot} />
              <span style={{
                flex: 1,
                fontWeight: p.id === localPlayerId ? 700 : 400,
                color: p.id === localPlayerId ? '#ffd700' : '#f0e6d3',
              }}>
                {p.name}
                {p.id === localPlayerId && <span style={{ color: '#aa7733', fontSize: 11 }}> (You)</span>}
              </span>
              {p.isHost && (
                <span style={styles.hostBadge}>HOST</span>
              )}
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: Math.max(0, 2 - players.length) }).map((_, i) => (
            <div key={`empty-${i}`} style={{ ...styles.playerRow, opacity: 0.3 }}>
              <div style={{ ...styles.playerDot, background: '#333' }} />
              <span style={{ color: '#554433' }}>Waiting for player...</span>
            </div>
          ))}
        </div>

        {/* Start button (host only) */}
        {isHost ? (
          <button
            onClick={handleStart}
            disabled={!canStart}
            style={{
              ...styles.startBtn,
              opacity: canStart ? 1 : 0.45,
              cursor: canStart ? 'pointer' : 'not-allowed',
            }}
          >
            {canStart ? '⚔️ START BATTLE' : `Need ${2 - players.length} more warrior${2 - players.length !== 1 ? 's' : ''}`}
          </button>
        ) : (
          <div style={styles.waitingMsg}>
            ⏳ Waiting for host to start the battle...
          </div>
        )}

        {/* Info */}
        <div style={styles.infoRow}>
          <InfoBadge icon="⚡" label="Powers shuffle every 60s" />
          <InfoBadge icon="💀" label="Last one standing wins" />
          <InfoBadge icon="🛡" label="Grab power-ups to survive" />
        </div>
      </div>
    </div>
  );
}

function InfoBadge({ icon, label }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      background: 'rgba(255,180,0,0.07)',
      border: '1px solid rgba(255,180,0,0.15)',
      borderRadius: 6,
      padding: '6px 10px',
      fontSize: 11,
      color: '#aa8855',
    }}>
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'radial-gradient(ellipse at center, #1a0d00 0%, #0a0704 70%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 200,
    fontFamily: "'Rajdhani', sans-serif",
  },
  panel: {
    background: 'linear-gradient(160deg, rgba(25,15,5,0.97), rgba(15,8,0,0.98))',
    border: '1px solid rgba(180,120,0,0.3)',
    borderTop: '3px solid #cc7700',
    borderRadius: 16,
    padding: '36px 40px',
    maxWidth: 480,
    width: '90%',
    boxShadow: '0 0 60px rgba(180,100,0,0.15), 0 30px 80px rgba(0,0,0,0.7)',
  },
  title: {
    fontFamily: "'Cinzel Decorative', serif",
    fontSize: 36,
    fontWeight: 900,
    color: '#ffd700',
    textAlign: 'center',
    letterSpacing: 3,
    textShadow: '0 0 30px rgba(255,200,0,0.4)',
    marginBottom: 4,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 13,
    color: '#885522',
    letterSpacing: 4,
    marginBottom: 28,
  },
  roomCode: {
    background: 'rgba(180,120,0,0.08)',
    border: '1px solid rgba(180,120,0,0.2)',
    borderRadius: 10,
    padding: '14px 20px',
    textAlign: 'center',
    marginBottom: 24,
  },
  roomLabel: {
    fontSize: 10,
    letterSpacing: 3,
    color: '#664422',
    marginBottom: 4,
  },
  roomId: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 34,
    fontWeight: 700,
    color: '#ffd700',
    letterSpacing: 8,
  },
  roomHint: {
    fontSize: 11,
    color: '#664422',
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 3,
    color: '#774422',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  playerList: {
    marginBottom: 24,
  },
  playerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 10px',
    borderRadius: 6,
    marginBottom: 4,
    transition: 'background 0.2s',
  },
  playerDot: {
    width: 8, height: 8,
    borderRadius: '50%',
    background: '#44ff66',
    boxShadow: '0 0 6px #44ff66',
    flexShrink: 0,
  },
  hostBadge: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 2,
    color: '#ffd700',
    background: 'rgba(255,200,0,0.12)',
    border: '1px solid rgba(255,200,0,0.3)',
    borderRadius: 4,
    padding: '1px 6px',
  },
  startBtn: {
    width: '100%',
    padding: '14px 0',
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: 3,
    color: '#0a0500',
    background: 'linear-gradient(135deg, #ffcc00, #ff8800)',
    border: 'none',
    borderRadius: 8,
    boxShadow: '0 0 20px rgba(255,150,0,0.3)',
    transition: 'transform 0.1s, box-shadow 0.2s',
    marginBottom: 20,
    cursor: 'pointer',
  },
  waitingMsg: {
    textAlign: 'center',
    color: '#664422',
    fontSize: 13,
    padding: '14px 0',
    marginBottom: 20,
  },
  infoRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
};