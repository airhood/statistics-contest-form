import { countAnswered } from "../../lib/responses";
import { cn, type Tone } from "../../lib/theme";
import type { AnswerValue, ResponseSaveTarget, Survey, SurveyResponse } from "../../lib/types";
import { Icon } from "../icons";

export function CompletePage({
  answers,
  survey,
  response,
  saveTarget,
  totalResponses,
  onRestart,
  t,
}: {
  answers: Record<string, AnswerValue>;
  survey: Survey;
  response: SurveyResponse | null;
  saveTarget: ResponseSaveTarget | null;
  totalResponses: number;
  onRestart: () => void;
  t: Tone;
}) {
  const answered = countAnswered(answers, survey);

  return (
    <section className="mx-auto grid h-full max-w-[620px] content-center px-7 py-10 max-[640px]:px-[18px]">
      <div className={cn("mb-[22px] inline-flex size-11 items-center justify-center rounded-full", t.accentSoft, t.accent)}>
        <Icon.Check />
      </div>
      <h2 className="m-0 text-3xl font-semibold leading-tight tracking-[-0.025em]">응답이 저장되었습니다.</h2>
      <p className={cn("mb-7 mt-3 max-w-[480px] text-[15px] leading-[1.65]", t.textMute)}>
        시간 내어 참여해주셔서 감사합니다. 익명 처리된 응답은 통계 분석에만 사용됩니다.
      </p>
      <div className={cn("mb-7 grid grid-cols-3 overflow-hidden rounded-[14px] border", t.border)}>
        {[
          [`${answered}`, "응답 문항"],
          [`${totalResponses}`, "저장된 응답"],
          [response?.id.slice(-8) ?? "-", "응답 ID"],
        ].map(([value, label], index) => (
          <div className={cn("p-[18px]", index === 0 ? "" : "border-l", index === 0 ? "" : t.border)} key={label}>
            <div className="font-mono text-[22px] font-semibold tracking-[-0.02em] tabular-nums">{value}</div>
            <div className={cn("mt-1 text-xs", t.textSoft)}>{label}</div>
          </div>
        ))}
      </div>
      <div className={cn("mb-4 text-sm", t.textMute)}>{saveTargetLabel(saveTarget)}</div>
      <button
        className={cn(
          "inline-flex h-11 w-fit items-center justify-center rounded-[14px] border px-5 text-sm font-semibold outline-none hover:bg-current/5 focus-visible:ring-3",
          t.borderStrong,
          t.focus,
        )}
        type="button"
        onClick={onRestart}
      >
        다시 응답하기
      </button>
    </section>
  );
}

function saveTargetLabel(target: ResponseSaveTarget | null) {
  if (target === "firebase") return "Firebase에 저장되었습니다.";
  if (target === "recovery") return "정상 저장은 실패했지만 복구 로그에 원본 응답을 보관했습니다.";
  if (target === "local") return "Firebase 저장에 실패해 브라우저 로컬 캐시에 보관했습니다.";
  return "Firebase 저장을 확인하는 중입니다.";
}
