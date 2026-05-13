/** Points earned in a life domain required for each full level step (floor division). */
export const POINTS_PER_DOMAIN_LEVEL = 100;

export function domainLevelFromPoints(points: number): number {
  return Math.floor(Math.max(0, points) / POINTS_PER_DOMAIN_LEVEL);
}

export function domainPointsForLevel(level: number): number {
  return Math.max(0, level) * POINTS_PER_DOMAIN_LEVEL;
}

/** Minimum additional domain points needed to reach `unlockLevel` (level threshold, not points inside level). */
export function pointsNeededToUnlockDomainLevel(domainPoints: number, unlockLevel: number): number {
  const need = domainPointsForLevel(unlockLevel);
  return Math.max(0, need - Math.max(0, domainPoints));
}

export function progressWithinCurrentDomainLevel(domainPoints: number): {
  level: number;
  pointsIntoLevel: number;
  fractionToNextLevel: number;
  pointsToNextLevel: number;
} {
  const level = domainLevelFromPoints(domainPoints);
  const pointsIntoLevel = Math.max(0, domainPoints) - level * POINTS_PER_DOMAIN_LEVEL;
  const pointsToNextLevel =
    domainPointsForLevel(level + 1) - Math.max(0, domainPoints);
  return {
    level,
    pointsIntoLevel,
    fractionToNextLevel: Math.min(1, pointsIntoLevel / POINTS_PER_DOMAIN_LEVEL),
    pointsToNextLevel,
  };
}
