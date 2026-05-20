import { dispatchXpUpdate } from "@/lib/xp-client";

export type TaskCompleteResponse = {
  ok?: boolean;
  error?: string;
  points_earned?: number;
  total_xp?: number;
  spendable_points?: number;
};

export function applyTaskCompleteXp(payload: TaskCompleteResponse): void {
  if (typeof payload.total_xp === "number" && typeof payload.spendable_points === "number") {
    dispatchXpUpdate({
      totalXp: payload.total_xp,
      spendablePoints: payload.spendable_points,
      pointsEarned: payload.points_earned,
    });
  }
}
