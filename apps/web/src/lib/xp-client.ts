export type XpUpdateDetail = {
  totalXp: number;
  spendablePoints: number;
  pointsEarned?: number;
};

export const XP_UPDATED_EVENT = "grove:xp-updated";

export function dispatchXpUpdate(detail: XpUpdateDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<XpUpdateDetail>(XP_UPDATED_EVENT, { detail }));
}
