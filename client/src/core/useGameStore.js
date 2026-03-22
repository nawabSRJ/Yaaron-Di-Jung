import { create } from 'zustand';

export const useGameStore = create((set, get) => ({
  // Screens: 'menu' | 'lobby' | 'game' | 'spectator' | 'ended'
  screen: 'menu',

  // Local player info
  localPlayerId: null,
  localPlayerName: '',

  // Room info
  roomId: null,
  isHost: false,

  // All players
  players: [],

  // Power-ups in arena
  powerups: [],

  // Game meta
  shuffleCountdown: 60,
  gamePhase: 'lobby',

  // Winner info
  winner: null,

  // Arena time of day chosen by host
  timeOfDay: 'day', // 'day' | 'night'

  // Hit flash effect for local player
  hitFlash: false,

  // Active buffs on local player
  localBuffs: {},

  // ── Actions ──────────────────────────────────────────────

  setScreen: (screen) => set({ screen }),

  setLocalPlayer: (id, name) => set({ localPlayerId: id, localPlayerName: name }),

  setRoom: (roomId, isHost) => set({ roomId, isHost }),

  setPlayers: (players) => set({ players }),

  updatePlayers: (updatedPlayers) => set({ players: updatedPlayers }),

  setPowerups: (powerups) => set({ powerups }),

  removePowerup: (id) =>
    set((s) => ({ powerups: s.powerups.filter((p) => p.id !== id) })),

  addPowerup: (powerup) =>
    set((s) => ({ powerups: [...s.powerups, powerup] })),

  setShuffleCountdown: (n) => set({ shuffleCountdown: n }),

  setGamePhase: (phase) => set({ gamePhase: phase }),

  setWinner: (winner) => set({ winner }),

  setTimeOfDay: (t) => set({ timeOfDay: t }),

  triggerHitFlash: () => {
    set({ hitFlash: true });
    setTimeout(() => set({ hitFlash: false }), 200);
  },

  addBuff: (type, duration) => {
    const expiresAt = Date.now() + duration;
    set((s) => ({ localBuffs: { ...s.localBuffs, [type]: expiresAt } }));
  },

  removeBuff: (type) =>
    set((s) => {
      const b = { ...s.localBuffs };
      delete b[type];
      return { localBuffs: b };
    }),

  getLocalPlayer: () => {
    const { players, localPlayerId } = get();
    return players.find((p) => p.id === localPlayerId) || null;
  },
}));