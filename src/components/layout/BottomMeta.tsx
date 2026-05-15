import { cn, type Tone } from "../../lib/theme";

export function BottomMeta({
  saved,
  anonId,
  t,
}: {
  saved: boolean;
  anonId: string;
  t: Tone;
}) {
  return (
    <footer
      className={cn(
        "flex shrink-0 items-center justify-between border-t px-7 py-2.5 font-mono text-[11px] tracking-[0.02em] max-[640px]:px-4",
        t.border,
        t.textSoft,
      )}
    >
      <span className="inline-flex items-center gap-1.5">
        <span className={cn("size-1.5 rounded-full", saved ? "bg-green-500" : "bg-yellow-400")} />
        {saved ? "자동 저장됨" : "저장 중"}
      </span>
      <span>anon · {anonId}</span>
    </footer>
  );
}
