import { useEffect, useRef } from 'react';
import { socket } from '../core/socket.js';
import { useGameStore } from '../core/useGameStore.js';
import { audio } from '../systems/AudioSystem.js';

export function SocketManager() {
  const shuffleIntervalRef = useRef(null);

  useEffect(() => {
    socket.on('connect', () => {
      useGameStore.setState({ localPlayerId: socket.id });
    });

    socket.on('lobby:update', (data) => {
      const isHost = data.hostId === socket.id;
      const currentScreen = useGameStore.getState().screen;
      // If we're on the end screen and the host resets, bring everyone back to lobby
      const nextScreen = currentScreen === 'ended' || currentScreen === 'spectator'
        ? 'lobby'
        : currentScreen === 'game' ? 'lobby' : currentScreen;
      useGameStore.setState({
        players: data.players,
        roomId: data.roomId,
        isHost,
        // Only switch screen if the game has been reset (phase back to lobby)
        ...(data.phase === 'lobby' && currentScreen !== 'menu' && currentScreen !== 'lobby'
          ? { screen: 'lobby', gamePhase: 'lobby', winner: null, powerups: [] }
          : {}),
      });
    });

    socket.on('game:start', (data) => {
      useGameStore.setState({
        players: data.players,
        screen: 'game',
        gamePhase: 'playing',
        shuffleCountdown: 60,
        powerups: [],
      });
      audio.stopBGM(); // stop menu BGM when battle begins
      _startShuffleCountdown();
    });

    socket.on('game:state', (data) => {
      useGameStore.setState({ players: data.players });
    });

    socket.on('combat:hits', (data) => {
      const localId = useGameStore.getState().localPlayerId;
      const wasHit = data.hits.some((h) => h.targetId === localId);
      if (wasHit) {
        useGameStore.getState().triggerHitFlash();
        audio.play('hit_taken');
      }
    });

    socket.on('player:eliminated', (data) => {
      const localId = useGameStore.getState().localPlayerId;
      if (data.playerId === localId) {
        useGameStore.setState({ screen: 'spectator' });
        audio.play('eliminated');
        audio.stopFootstep();
      }
    });

    socket.on('power:shuffle', (data) => {
      useGameStore.setState({ players: data.players, shuffleCountdown: 60 });
      audio.play('shuffle');
      _startShuffleCountdown();
    });

    socket.on('powerup:spawn', (pu) => {
      useGameStore.getState().addPowerup(pu);
    });

    socket.on('powerup:collected', (data) => {
      useGameStore.getState().removePowerup(data.powerupId);
      const localId = useGameStore.getState().localPlayerId;
      if (data.playerId === localId) {
        const durations = { shield: 10000, speed: 12000, damage: 10000 };
        useGameStore.getState().addBuff(data.type, durations[data.type] || 10000);
        // Play the matching pickup sound only for local player
        audio.play(`pickup_${data.type}`);
      }
    });

    socket.on('powerup:expired', (data) => {
      const localId = useGameStore.getState().localPlayerId;
      if (data.playerId === localId) {
        useGameStore.getState().removeBuff(data.type);
      }
    });

    socket.on('game:end', (data) => {
      _stopShuffleCountdown();
      audio.stopFootstep();
      useGameStore.setState({
        screen: 'ended',
        gamePhase: 'ended',
        winner: { id: data.winnerId, name: data.winnerName },
      });
    });

    return () => {
      socket.off('connect');
      socket.off('lobby:update');
      socket.off('game:start');
      socket.off('game:state');
      socket.off('combat:hits');
      socket.off('player:eliminated');
      socket.off('power:shuffle');
      socket.off('powerup:spawn');
      socket.off('powerup:collected');
      socket.off('powerup:expired');
      socket.off('game:end');
      _stopShuffleCountdown();
    };
  }, []);

  function _startShuffleCountdown() {
    _stopShuffleCountdown();
    let count = 60;
    useGameStore.setState({ shuffleCountdown: count });
    shuffleIntervalRef.current = setInterval(() => {
      count--;
      useGameStore.setState({ shuffleCountdown: Math.max(0, count) });
      if (count <= 0) _stopShuffleCountdown();
    }, 1000);
  }

  function _stopShuffleCountdown() {
    if (shuffleIntervalRef.current) {
      clearInterval(shuffleIntervalRef.current);
      shuffleIntervalRef.current = null;
    }
  }

  return null;
}