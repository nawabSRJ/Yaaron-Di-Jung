import { GameState } from '../game/GameState.js';
import { PlayerState } from '../game/PlayerState.js';
import { PowerLogic } from '../game/PowerLogic.js';

// Arena bounds
const ARENA_HALF = 22;
const ARENA_Y_MIN = 0;
const ARENA_Y_MAX = 8;

// Power-up config
const POWERUP_TYPES = ['shield', 'speed', 'damage'];
const POWERUP_SPAWN_INTERVAL = 15000; // 15s
const POWERUP_DURATION = { shield: 10000, speed: 12000, damage: 10000 };
const MAX_ACTIVE_POWERUPS = 4;

let powerupIdCounter = 0;

export class GameRoom {
  constructor(io, roomId, hostSocketId, hostName) {
    this.io = io;
    this.roomId = roomId;
    this.hostSocketId = hostSocketId;

    this.gameState = new GameState(roomId);
    this.players = new Map(); // socketId -> PlayerState

    // Timers
    this._shuffleTimer = null;
    this._powerupSpawnTimer = null;
    this._broadcastTimer = null;

    // Power-ups currently in the arena
    this.activePowerups = new Map(); // id -> {id, type, position, expiresAt?}

    // Add host as first player
    this.addPlayer(hostSocketId, hostName, true);
  }

  addPlayer(socketId, name, isHost = false) {
    if (this.players.size >= 7) return { error: 'Room full' };

    const player = new PlayerState(socketId, name, isHost);
    this.players.set(socketId, player);
    this._broadcastLobbyState();
    return { success: true, player: player.toPublic() };
  }

  getPlayerCount() {
    return this.players.size;
  }

  getLobbyData() {
    return {
      roomId: this.roomId,
      hostId: this.hostSocketId,
      players: [...this.players.values()].map((p) => p.toPublic()),
      phase: this.gameState.phase,
    };
  }

  startGame() {
    if (this.gameState.phase !== 'lobby') return { error: 'Game already started' };
    if (this.players.size < 2) return { error: 'Need at least 2 players' };

    this.gameState.phase = 'playing';
    this.gameState.startedAt = Date.now();

    // Assign spawn positions & initial power tiers
    this._assignSpawnPositions();
    PowerLogic.assignPowerTiers([...this.players.values()]);

    // Broadcast game start
    this.io.to(this.roomId).emit('game:start', {
      players: this._getPublicPlayers(),
      shuffleIn: 60,
    });

    // Start shuffle timer
    this._startShuffleTimer();

    // Start power-up spawning
    this._startPowerupSpawner();

    // Start fast broadcast loop for positions
    this._startBroadcastLoop();

    console.log(`[GameRoom ${this.roomId}] Game started with ${this.players.size} players`);
    return { success: true };
  }

  handlePlayerInput(socketId, input) {
    const player = this.players.get(socketId);
    if (!player || player.eliminated) return;

    // Server-side validation of movement
    let { x, y, z, rotY, isAttacking, jumping } = input;

    // Clamp within arena
    x = Math.max(-ARENA_HALF, Math.min(ARENA_HALF, x));
    z = Math.max(-ARENA_HALF, Math.min(ARENA_HALF, z));
    y = Math.max(ARENA_Y_MIN, Math.min(ARENA_Y_MAX, y));

    player.position = { x, y, z };
    player.rotY = rotY;
    player.isAttacking = isAttacking;
    player.jumping = jumping;

    // Check power-up collection
    this._checkPowerupCollection(player);

    // Process attack
    if (isAttacking) {
      this._processAttack(player);
    }
  }

  handleAttack(attackerId) {
    const attacker = this.players.get(attackerId);
    if (!attacker || attacker.eliminated) return;
    this._processAttack(attacker);
  }

  _processAttack(attacker) {
    const ATTACK_RANGE = 2.5;
    const now = Date.now();

    // Attack cooldown: 600ms
    if (now - attacker.lastAttackTime < 600) return;
    attacker.lastAttackTime = now;

    const hits = [];

    for (const [id, target] of this.players) {
      if (id === attacker.id || target.eliminated) continue;
      if (target.shieldActive) continue; // Shield blocks damage

      const dx = target.position.x - attacker.position.x;
      const dz = target.position.z - attacker.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist <= ATTACK_RANGE) {
        const damage = attacker.attackDamage;
        target.hp = Math.max(0, target.hp - damage);

        // Knockback direction
        const kbMag = 3;
        const kbX = dist > 0 ? (dx / dist) * kbMag : 0;
        const kbZ = dist > 0 ? (dz / dist) * kbMag : 0;

        hits.push({
          targetId: id,
          damage,
          newHp: target.hp,
          knockback: { x: kbX, z: kbZ },
        });

        // Check elimination
        if (target.hp <= 0) {
          this._eliminatePlayer(target);
        }
      }
    }

    if (hits.length > 0) {
      this.io.to(this.roomId).emit('combat:hits', {
        attackerId: attacker.id,
        hits,
      });
    }
  }

  _eliminatePlayer(player) {
    player.eliminated = true;
    player.eliminatedAt = Date.now();

    this.io.to(this.roomId).emit('player:eliminated', {
      playerId: player.id,
      playerName: player.name,
    });

    console.log(`[GameRoom ${this.roomId}] ${player.name} eliminated`);

    // Check win condition
    const alivePlayers = [...this.players.values()].filter((p) => !p.eliminated);
    if (alivePlayers.length <= 1) {
      this._endGame(alivePlayers[0] || null);
    }
  }

  _endGame(winner) {
    this.gameState.phase = 'ended';
    this.cleanup();

    this.io.to(this.roomId).emit('game:end', {
      winnerId: winner?.id || null,
      winnerName: winner?.name || 'Nobody',
    });

    console.log(`[GameRoom ${this.roomId}] Game ended. Winner: ${winner?.name}`);
  }

  _startShuffleTimer() {
    this._shuffleTimer = setInterval(() => {
      if (this.gameState.phase !== 'playing') return;
      const alivePlayers = [...this.players.values()].filter((p) => !p.eliminated);
      if (alivePlayers.length < 2) return;

      PowerLogic.assignPowerTiers(alivePlayers);

      this.io.to(this.roomId).emit('power:shuffle', {
        players: this._getPublicPlayers(),
      });

      console.log(`[GameRoom ${this.roomId}] Power shuffled!`);
    }, 60000);
  }

  _startPowerupSpawner() {
    const spawnPowerup = () => {
      if (this.gameState.phase !== 'playing') return;
      if (this.activePowerups.size >= MAX_ACTIVE_POWERUPS) return;

      const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
      const id = `pu_${++powerupIdCounter}`;
      const position = {
        x: (Math.random() - 0.5) * (ARENA_HALF * 1.6),
        y: 0.5,
        z: (Math.random() - 0.5) * (ARENA_HALF * 1.6),
      };

      const powerup = { id, type, position };
      this.activePowerups.set(id, powerup);

      this.io.to(this.roomId).emit('powerup:spawn', powerup);
    };

    // Initial spawn after 5s
    setTimeout(spawnPowerup, 5000);
    this._powerupSpawnTimer = setInterval(spawnPowerup, POWERUP_SPAWN_INTERVAL);
  }

  _checkPowerupCollection(player) {
    const COLLECT_RADIUS = 1.5;
    for (const [id, pu] of this.activePowerups) {
      const dx = player.position.x - pu.position.x;
      const dz = player.position.z - pu.position.z;
      if (Math.sqrt(dx * dx + dz * dz) < COLLECT_RADIUS) {
        this._applyPowerup(player, pu);
        this.activePowerups.delete(id);
        this.io.to(this.roomId).emit('powerup:collected', {
          powerupId: id,
          playerId: player.id,
          type: pu.type,
        });
      }
    }
  }

  _applyPowerup(player, powerup) {
    const duration = POWERUP_DURATION[powerup.type] || 10000;

    if (powerup.type === 'shield') {
      player.shieldActive = true;
      setTimeout(() => {
        player.shieldActive = false;
        this.io.to(this.roomId).emit('powerup:expired', { playerId: player.id, type: 'shield' });
      }, duration);
    } else if (powerup.type === 'speed') {
      player.speedBoost = true;
      this.io.to(this.roomId).emit('powerup:active', { playerId: player.id, type: 'speed', duration });
      setTimeout(() => {
        player.speedBoost = false;
        this.io.to(this.roomId).emit('powerup:expired', { playerId: player.id, type: 'speed' });
      }, duration);
    } else if (powerup.type === 'damage') {
      const originalDmg = player.attackDamage;
      player.attackDamage = Math.floor(player.attackDamage * 1.8);
      this.io.to(this.roomId).emit('powerup:active', { playerId: player.id, type: 'damage', duration });
      setTimeout(() => {
        player.attackDamage = originalDmg;
        this.io.to(this.roomId).emit('powerup:expired', { playerId: player.id, type: 'damage' });
      }, duration);
    }
  }

  _startBroadcastLoop() {
    // Broadcast all player states at 20 ticks/s
    this._broadcastTimer = setInterval(() => {
      if (this.gameState.phase !== 'playing') return;
      this.io.to(this.roomId).emit('game:state', {
        players: this._getPublicPlayers(),
        timestamp: Date.now(),
      });
    }, 50); // 20 Hz
  }

  _assignSpawnPositions() {
    const playerList = [...this.players.values()];
    const count = playerList.length;
    const radius = 12;

    playerList.forEach((p, i) => {
      const angle = (i / count) * Math.PI * 2;
      p.position = {
        x: Math.cos(angle) * radius,
        y: 0.5,
        z: Math.sin(angle) * radius,
      };
    });
  }

  _getPublicPlayers() {
    return [...this.players.values()].map((p) => p.toPublic());
  }

  handlePlayerDisconnect(socketId) {
    const player = this.players.get(socketId);
    if (!player) return;

    if (this.gameState.phase === 'lobby') {
      this.players.delete(socketId);
      // Transfer host if needed
      if (socketId === this.hostSocketId && this.players.size > 0) {
        const newHost = [...this.players.values()][0];
        newHost.isHost = true;
        this.hostSocketId = newHost.id;
      }
      this._broadcastLobbyState();
    } else {
      // During game, treat as elimination
      if (!player.eliminated) {
        this._eliminatePlayer(player);
      }
    }
  }

  _broadcastLobbyState() {
    this.io.to(this.roomId).emit('lobby:update', this.getLobbyData());
  }

  cleanup() {
    clearInterval(this._shuffleTimer);
    clearInterval(this._powerupSpawnTimer);
    clearInterval(this._broadcastTimer);
  }
}