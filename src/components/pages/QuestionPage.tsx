import { cn, type Tone } from "../../lib/theme";
import type { AnswerValue, Question, QuestionInfo } from "../../lib/types";
import { Icon } from "../icons";
import { MediaBlock } from "../survey/MediaBlock";
import { QuestionRenderer } from "../survey/QuestionRenderer";

export function QuestionPage({
  q,
  qInfo,
  value,
  onChange,
  error,
  onNext,
  onBack,
  isLast,
  t,
}: {
  q: Question;
  qInfo: QuestionInfo;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  error?: string | null;
  onNext: () => void;
  onBack: () => void;
  isLast: boolean;
  t: Tone;
}) {
  const wide = q.type === "matrix" || q.type === "ranking";

  return (
    <section
      className={cn(
        "mx-auto grid h-full content-center px-7 py-9 max-[640px]:px-[18px]",
        wide ? "max-w-[760px]" : "max-w-[620px]",
      )}
    >
      <div className={cn("mb-[18px] font-mono text-[11px] uppercase tracking-[0.12em]", t.textSoft)}>
        {qInfo.label} · {qInfo.number} / {qInfo.total}
        {q.required && <span className={cn("ml-2", t.accent)}>· 필수</span>}
      </div>
      <h2 className="m-0 text-[26px] font-semibold leading-[1.32] tracking-[-0.02em] text-pretty max-[640px]:text-[21px]">
        {q.title}
      </h2>
      {q.hint && <p className={cn("mb-0 mt-2 text-[13.5px] leading-[1.55]", t.textMute)}>{q.hint}</p>}
      <MediaBlock media={q.media} t={t} />
      <div className="mt-6">
        <QuestionRenderer q={q} value={value} onChange={onChange} error={error} t={t} />
      </div>
      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          className={cn(
            "inline-flex h-11 items-center justify-center gap-2 rounded-[14px] px-5 text-sm font-semibold outline-none transition-colors hover:bg-current/5 focus-visible:ring-3",
            t.textMute,
            t.focus,
          )}
          type="button"
          onClick={onBack}
        >
          <Icon.ArrowLeft /> 이전
        </button>
        <div className="flex items-center gap-3">
          <span className={cn("font-mono text-[11px] max-[640px]:hidden", t.textSoft)}>Enter로도 진행</span>
          <button
            className={cn(
              "inline-flex h-11 items-center justify-center gap-2 rounded-[14px] px-5 text-sm font-semibold outline-none transition-colors focus-visible:ring-3",
              t.accentBg,
              t.accentText,
              t.accentHover,
              t.focus,
            )}
            type="button"
            onClick={onNext}
          >
            {isLast ? "제출하기" : "다음"} {isLast ? <Icon.Check /> : <Icon.ArrowRight />}
          </button>
        </div>
      </div>
    </section>
  );
}
