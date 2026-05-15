import { cn, type Tone } from "../../lib/theme";
import type { Survey } from "../../lib/types";
import { Icon } from "../icons";

export function IntroPage({ survey, onStart, t }: { survey: Survey; onStart: () => void; t: Tone }) {
  return (
    <section className="mx-auto grid h-full max-w-[620px] content-center px-7 py-10 max-[640px]:px-[18px]">
      <h1 className="m-0 text-[38px] font-semibold leading-[1.18] tracking-[-0.025em] text-pretty max-[640px]:text-[28px]">
        {survey.subtitle}
      </h1>
      <p className={cn("mb-7 mt-[18px] max-w-[520px] text-[15px] leading-[1.65]", t.textMute)}>
        {survey.description}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          className={cn(
            "inline-flex h-11 items-center justify-center gap-2 rounded-[14px] px-5 text-sm font-semibold outline-none transition-colors focus-visible:ring-3",
            t.accentBg,
            t.accentText,
            t.accentHover,
            t.focus,
          )}
          type="button"
          onClick={onStart}
        >
          시작하기 <Icon.ArrowRight />
        </button>
        <span className={cn("font-mono text-[11.5px]", t.textSoft)}>Enter로도 시작</span>
      </div>
    </section>
  );
}
