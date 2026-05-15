import { cn, type Tone } from "../../lib/theme";

export function MiniBars({
  values,
  labels,
  t,
}: {
  values: number[];
  labels?: string[];
  t: Tone;
}) {
  const max = Math.max(...values, 1);

  return (
    <div className="flex h-28 items-end gap-1.5">
      {values.map((value, index) => (
        <div className="flex min-w-0 flex-1 flex-col items-center gap-2" key={`${value}-${index}`}>
          <div className={cn("w-full rounded-t-[6px]", t.accentBg)} style={{ height: `${Math.max(6, (value / max) * 100)}%` }} />
          {labels && <span className={cn("w-full truncate text-center font-mono text-[10px]", t.textSoft)}>{labels[index]}</span>}
        </div>
      ))}
    </div>
  );
}

export function RatioBar({
  value,
  label,
  t,
}: {
  value: number;
  label: string;
  t: Tone;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
        <span className="truncate">{label}</span>
        <span className={cn("font-mono tabular-nums", t.textMute)}>{Math.round(value * 100)}%</span>
      </div>
      <div className={cn("h-2 overflow-hidden rounded-full", t.muteBg)}>
        <div className={cn("h-full rounded-full", t.accentBg)} style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
    </div>
  );
}
