import { Flame } from "lucide-react";

type PointsHeaderProps = {
  displayName: string;
  totalPoints: number;
  streak: number;
};

function getLevel(points: number) {
  return Math.floor(points / 100) + 1;
}

export function PointsHeader({ displayName, totalPoints, streak }: PointsHeaderProps) {
  const level = getLevel(totalPoints);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-foreground">
          {greeting}, {displayName.split(" ")[0]} ⚡
        </p>
        <p className="text-xs text-muted-foreground">Lv {level}</p>
      </div>
      <div className="flex items-center gap-3">
        {streak > 0 && (
          <div className="flex items-center gap-1 text-sm font-medium text-orange-500">
            <Flame className="h-4 w-4" />
            {streak}
          </div>
        )}
        <div className="text-right">
          <p className="text-sm font-bold text-moss">{totalPoints.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">points</p>
        </div>
      </div>
    </div>
  );
}
