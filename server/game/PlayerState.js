export const TIER_CONFIGS = {
  S: { maxHp: 200, attackDamage: 25, speedMultiplier: 0.8, scale: 1.4 },
  A: { maxHp: 130, attackDamage: 18, speedMultiplier: 1.0, scale: 1.15 },
  B: { maxHp: 80,  attackDamage: 12, speedMultiplier: 1.3, scale: 0.9 },
};

const PLAYER_COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12',
  '#9b59b6', '#1abc9c', '#e67e22',
];
let colorIndex = 0;

export class PlayerState {
  constructor(socketId, name, isHost = false) {
    this.id = socketId;
    this.name = name;
    this.isHost = isHost;
    this.baseColor = PLAYER_COLORS[colorIndex++ % PLAYER_COLORS.length];
    this.position = { x: 0, y: 0.5, z: 0 };
    this.rotY = 0;
    this.jumping = false;
    this.tier = 'B';
    this.maxHp = TIER_CONFIGS.B.maxHp;
    this.hp = this.maxHp;
    this.attackDamage = TIER_CONFIGS.B.attackDamage;
    this.speedMultiplier = TIER_CONFIGS.B.speedMultiplier;
    this.scale = TIER_CONFIGS.B.scale;
    this.eliminated = false;
    this.eliminatedAt = null;
    this.lastAttackTime = 0;
    this.shieldActive = false;
    this.speedBoost = false;
  }

  applyTier(tier) {
    const cfg = TIER_CONFIGS[tier];
    if (!cfg) return;
    this.tier = tier;
    this.maxHp = cfg.maxHp;
    this.hp = cfg.maxHp;
    this.attackDamage = cfg.attackDamage;
    this.speedMultiplier = cfg.speedMultiplier;
    this.scale = cfg.scale;
  }

  toPublic() {
    return {
      id: this.id,
      name: this.name,
      isHost: this.isHost,
      position: this.position,
      rotY: this.rotY,
      jumping: this.jumping,
      tier: this.tier,
      hp: this.hp,
      maxHp: this.maxHp,
      scale: this.scale,
      baseColor: this.baseColor,
      eliminated: this.eliminated,
      shieldActive: this.shieldActive,
      speedBoost: this.speedBoost,
      speedMultiplier: this.speedMultiplier,
    };
  }
}