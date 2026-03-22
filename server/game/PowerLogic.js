export class PowerLogic {
  static assignPowerTiers(alivePlayers) {
    if (alivePlayers.length === 0) return;
    const shuffled = [...alivePlayers].sort(() => Math.random() - 0.5);
    const lastS = alivePlayers.find((p) => p.tier === 'S');
    const sTier = shuffled.find((p) => p !== lastS) || shuffled[0];
    const count = alivePlayers.length;
    const aCount = count >= 5 ? 2 : count >= 3 ? 1 : 0;
    let aGiven = 0;
    shuffled.forEach((p) => {
      if (p === sTier) {
        p.applyTier('S');
      } else if (aGiven < aCount) {
        p.applyTier('A');
        aGiven++;
      } else {
        p.applyTier('B');
      }
    });
  }
}