import { cn, type Tone } from "../../lib/theme";
import type { ThemeMode } from "../../lib/types";
import { Icon } from "../icons";

export function TopBar({
  idx,
  total,
  progress,
  theme,
  onToggleTheme,
  t,
}: {
  idx: number;
  total: number;
  progress: number;
  theme: ThemeMode;
  onToggleTheme: () => void;
  t: Tone;
}) {
  return (
    <header
      className={cn(
        "grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 border-b px-7 py-5 max-[640px]:grid-cols-[1fr_auto] max-[640px]:px-4 max-[640px]:py-3",
        t.border,
        t.rootBg,
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5 overflow-hidden whitespace-nowrap">
        <span className={cn("size-[18px] shrink-0 rounded-[5px]", t.accentBg)} />
        <span className="truncate text-[13px] font-semibold">AI 콘텐츠 구별 실험</span>
        <span className={cn("truncate text-xs max-[640px]:hidden", t.textSoft)}>
          · 통계 데이터 수집
        </span>
      </div>
      <div className="w-[280px] max-[640px]:hidden">
        <div className={cn("h-[3px] overflow-hidden rounded-full", t.muteBg)}>
          <span
            className={cn("block h-full rounded-full transition-[width] duration-300", t.accentBg)}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
      <div className="flex items-center justify-end gap-3">
        <span className={cn("font-mono text-xs tabular-nums", t.textMute)}>
          <b className="font-semibold text-current">{String(idx).padStart(2, "0")}</b>
          <span className="mx-1 opacity-40">/</span>
          {String(total).padStart(2, "0")}
        </span>
        <button
          className={cn(
            "inline-flex size-[30px] items-center justify-center rounded-[10px] border outline-none focus-visible:ring-3",
            t.border,
            t.focus,
            t.textMute,
          )}
          aria-label="theme"
          type="button"
          onClick={onToggleTheme}
        >
          {theme === "dark" ? <Icon.Sun /> : <Icon.Moon />}
        </button>
      </div>
      <div className={cn("col-span-full mt-0.5 hidden h-[3px] overflow-hidden rounded-full max-[640px]:block", t.muteBg)}>
        <span
          className={cn("block h-full rounded-full transition-[width] duration-300", t.accentBg)}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </header>
  );
}
