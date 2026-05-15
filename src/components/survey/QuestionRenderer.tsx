import { useEffect, useMemo, useRef, useState } from "react";
import { cn, type Tone } from "../../lib/theme";
import type { AnswerValue, Question } from "../../lib/types";
import { Icon } from "../icons";
import { ErrorLine } from "./ErrorLine";

export function QuestionRenderer({
  q,
  value,
  onChange,
  error,
  t,
}: {
  q: Question;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  error?: string | null;
  t: Tone;
}) {
  switch (q.type) {
    case "short":
    case "email":
    case "contact":
    case "number":
    case "date":
    case "time":
      return <NativeInput q={q} value={value as string} onChange={onChange} error={error} t={t} />;
    case "long":
      return <LongInput q={q} value={value as string} onChange={onChange} error={error} t={t} />;
    case "single":
      return <SingleChoice q={q} value={value as string} onChange={onChange} error={error} t={t} />;
    case "multi":
      return <MultiChoice q={q} value={value as string[]} onChange={onChange} error={error} t={t} />;
    case "scale":
      return <ScaleChoice q={q} value={value as number} onChange={onChange} error={error} t={t} />;
    case "matrix":
      return <Matrix q={q} value={(value as Record<string, number>) ?? {}} onChange={onChange} error={error} t={t} />;
    case "slider":
      return <Slider q={q} value={value as number} onChange={onChange} error={error} t={t} />;
    case "dropdown":
      return <Dropdown q={q} value={value as string} onChange={onChange} error={error} t={t} />;
    case "ranking":
      return <Ranking q={q} value={value as string[]} onChange={onChange} error={error} t={t} />;
    default:
      return <div className={t.textSoft}>Unknown type</div>;
  }
}

function NativeInput({
  q,
  value,
  onChange,
  error,
  t,
}: {
  q: Question;
  value?: string;
  onChange: (value: string) => void;
  error?: string | null;
  t: Tone;
}) {
  const type = ["email", "number", "date", "time"].includes(q.type) ? q.type : "text";
  const inputMode = q.type === "contact" ? "email" : q.type === "number" ? "numeric" : undefined;

  return (
    <div>
      <input
        className={cn(
          "w-full rounded-[14px] border px-4 py-[13px] text-[15px] outline-none focus-visible:ring-3",
          error ? "border-red-300" : t.border,
          t.app,
          t.focus,
        )}
        type={type}
        inputMode={inputMode}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={q.placeholder}
        maxLength={q.maxLength}
        autoFocus
      />
      {q.maxLength && (
        <div className={cn("mt-1.5 text-right font-mono text-[11px]", t.textSoft)}>
          {(value ?? "").length} / {q.maxLength}
        </div>
      )}
      <ErrorLine error={error} />
    </div>
  );
}

function LongInput({
  q,
  value,
  onChange,
  error,
  t,
}: {
  q: Question;
  value?: string;
  onChange: (value: string) => void;
  error?: string | null;
  t: Tone;
}) {
  return (
    <div>
      <textarea
        className={cn(
          "w-full resize-y rounded-[14px] border px-4 py-3 text-[15px] leading-[1.55] outline-none focus-visible:ring-3",
          error ? "border-red-300" : t.border,
          t.app,
          t.focus,
        )}
        rows={4}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={q.placeholder}
        maxLength={q.maxLength}
        autoFocus
      />
      {q.maxLength && (
        <div className={cn("mt-1.5 text-right font-mono text-[11px]", t.textSoft)}>
          {(value ?? "").length} / {q.maxLength}
        </div>
      )}
      <ErrorLine error={error} />
    </div>
  );
}

function SingleChoice({
  q,
  value,
  onChange,
  error,
  t,
}: {
  q: Question;
  value?: string;
  onChange: (value: string) => void;
  error?: string | null;
  t: Tone;
}) {
  return (
    <div>
      <div className={cn("border-t", t.border)}>
        {q.options?.map((option, index) => {
          const selected = value === option;
          return (
            <button
              className={cn(
                "flex w-full items-center gap-3 border-b px-1 py-3.5 text-left text-[15px] outline-none transition-colors hover:bg-current/5 focus-visible:ring-3",
                t.border,
                t.focus,
              )}
              key={option}
              type="button"
              onClick={() => onChange(option)}
            >
              <span className={cn("inline-flex size-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px]", selected ? t.borderAccent : t.borderStrong)}>
                {selected && <span className={cn("size-2 rounded-full", t.accentBg)} />}
              </span>
              <span className={cn("flex-1", selected ? "font-medium" : "font-normal")}>{option}</span>
              <span className={cn("font-mono text-[11px]", t.textSoft)}>{String.fromCharCode(65 + index)}</span>
            </button>
          );
        })}
      </div>
      <ErrorLine error={error} />
    </div>
  );
}

function MultiChoice({
  q,
  value,
  onChange,
  error,
  t,
}: {
  q: Question;
  value?: string[];
  onChange: (value: string[]) => void;
  error?: string | null;
  t: Tone;
}) {
  const selected = new Set(value ?? []);

  return (
    <div>
      <div className="flex flex-col gap-2">
        {q.options?.map((option) => {
          const on = selected.has(option);
          return (
            <button
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left text-[14.5px] outline-none transition-colors focus-visible:ring-3",
                on ? cn(t.accentSoft, t.borderAccent) : cn(t.app, t.border),
                t.focus,
              )}
              key={option}
              type="button"
              onClick={() => {
                const next = new Set(selected);
                if (next.has(option)) next.delete(option);
                else next.add(option);
                onChange(Array.from(next));
              }}
            >
              <span className={cn("inline-flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px]", on ? cn(t.accentBg, t.borderAccent, t.accentText) : t.borderStrong)}>
                {on && <Icon.Check className="size-2.5" />}
              </span>
              <span className={cn("flex-1", on ? "font-medium" : "font-normal")}>{option}</span>
            </button>
          );
        })}
      </div>
      <ErrorLine error={error} />
    </div>
  );
}

function ScaleChoice({
  q,
  value,
  onChange,
  error,
  t,
}: {
  q: Question;
  value?: number;
  onChange: (value: number) => void;
  error?: string | null;
  t: Tone;
}) {
  const count = q.scale ?? 5;

  return (
    <div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
        {Array.from({ length: count }, (_, index) => index + 1).map((score) => {
          const selected = value === score;
          return (
            <button
              className={cn(
                "rounded-xl border py-4 text-base font-semibold outline-none transition-colors focus-visible:ring-3",
                selected ? cn(t.accentSoft, t.accent, t.borderAccent) : cn(t.app, t.border),
                t.focus,
              )}
              key={score}
              type="button"
              onClick={() => onChange(score)}
            >
              {score}
            </button>
          );
        })}
      </div>
      {q.labels && (
        <div className={cn("mt-2.5 flex justify-between text-[11.5px]", t.textSoft)}>
          <span>{q.labels[0]}</span>
          <span>{q.labels[1]}</span>
        </div>
      )}
      <ErrorLine error={error} />
    </div>
  );
}

function Matrix({
  q,
  value,
  onChange,
  error,
  t,
}: {
  q: Question;
  value: Record<string, number>;
  onChange: (value: Record<string, number>) => void;
  error?: string | null;
  t: Tone;
}) {
  const scale = q.scale ?? 5;

  return (
    <div>
      <div className={cn("overflow-hidden rounded-[14px] border", t.border)}>
        <div
          className={cn("grid text-[11px] font-medium tracking-[0.04em] max-[640px]:hidden", t.soft, t.textSoft)}
          style={{ gridTemplateColumns: `1.4fr repeat(${scale}, minmax(0, 1fr))` }}
        >
          <div className="px-4 py-3" />
          {q.cols?.map((col, index) => (
            <div className={cn("border-l px-1.5 py-3 text-center", t.border)} key={col}>
              {index + 1} · {col}
            </div>
          ))}
        </div>
        <div className="max-[640px]:hidden">
          {q.rows?.map((row, rowIndex) => (
            <div
              className={cn("grid", rowIndex === 0 ? "" : "border-t", rowIndex === 0 ? "" : t.border)}
              style={{ gridTemplateColumns: `1.4fr repeat(${scale}, minmax(0, 1fr))` }}
              key={row.id}
            >
              <div className="px-4 py-3.5 text-sm leading-[1.45]">{row.text}</div>
              {Array.from({ length: scale }, (_, index) => index + 1).map((score) => {
                const selected = value[row.id] === score;
                return (
                  <button
                    className={cn("flex items-center justify-center border-l py-2.5 outline-none hover:bg-current/5 focus-visible:ring-3", t.border, t.focus)}
                    key={score}
                    type="button"
                    aria-label={`${row.text} ${score}점 ${q.cols?.[score - 1] ?? ""}`}
                    aria-pressed={selected}
                    onClick={() => onChange({ ...value, [row.id]: score })}
                  >
                    <span className={cn("inline-flex size-[18px] items-center justify-center rounded-full border-[1.5px]", selected ? t.borderAccent : t.borderStrong)}>
                      {selected && <span className={cn("size-2 rounded-full", t.accentBg)} />}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="hidden flex-col gap-3 p-3 max-[640px]:flex">
          {q.rows?.map((row) => (
            <div className={cn("rounded-[14px] border p-3.5", t.border, t.app)} key={row.id}>
              <div className="mb-3 text-sm font-medium leading-normal">{row.text}</div>
              <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${scale}, minmax(0, 1fr))` }}>
                {Array.from({ length: scale }, (_, index) => index + 1).map((score) => {
                  const selected = value[row.id] === score;
                  return (
                    <button
                      className={cn(
                        "rounded-[10px] border py-3 text-sm font-semibold outline-none focus-visible:ring-3",
                        selected ? cn(t.accentSoft, t.accent, t.borderAccent) : cn(t.app, t.border),
                        t.focus,
                      )}
                      key={score}
                      type="button"
                      aria-label={`${row.text} ${score}점 ${q.cols?.[score - 1] ?? ""}`}
                      aria-pressed={selected}
                      onClick={() => onChange({ ...value, [row.id]: score })}
                    >
                      {score}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <ErrorLine error={error} />
    </div>
  );
}

function Slider({
  q,
  value,
  onChange,
  error,
  t,
}: {
  q: Question;
  value?: number;
  onChange: (value: number) => void;
  error?: string | null;
  t: Tone;
}) {
  const min = q.min ?? 0;
  const max = q.max ?? 100;
  const current = value ?? 50;

  useEffect(() => {
    if (value == null) onChange(current);
  }, [current, onChange, value]);

  return (
    <div>
      <div className="mb-3.5 flex items-baseline justify-between">
        <span className={cn("text-[13px]", t.textMute)}>{q.labels?.[0] ?? min}</span>
        <span className="font-mono text-[28px] font-semibold tracking-[-0.02em] tabular-nums">
          {current}
          {q.unit}
        </span>
        <span className={cn("text-[13px]", t.textMute)}>{q.labels?.[1] ?? max}</span>
      </div>
      <input
        className={cn("h-8 w-full", t.accentColor)}
        type="range"
        min={min}
        max={max}
        step={q.step ?? 1}
        value={current}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className={cn("mt-2 flex justify-between font-mono text-[11px]", t.textSoft)}>
        {[0, 25, 50, 75, 100].map((tick) => (
          <span key={tick}>
            {min + (tick / 100) * (max - min)}
            {q.unit}
          </span>
        ))}
      </div>
      <ErrorLine error={error} />
    </div>
  );
}

function Dropdown({
  q,
  value,
  onChange,
  error,
  t,
}: {
  q: Question;
  value?: string;
  onChange: (value: string) => void;
  error?: string | null;
  t: Tone;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        className={cn("flex w-full items-center justify-between gap-3 rounded-[14px] border px-4 py-[13px] text-left text-[15px] outline-none focus-visible:ring-3", error ? "border-red-300" : t.border, t.app, t.focus)}
        type="button"
        onClick={() => setOpen((next) => !next)}
      >
        <span className={value ? "" : t.textSoft}>{value ?? "선택해주세요"}</span>
        <span className={cn("transition-transform", open ? "rotate-180" : "")}>⌄</span>
      </button>
      {open && (
        <div className={cn("absolute left-0 right-0 top-[calc(100%+6px)] z-20 max-h-[280px] overflow-auto rounded-[14px] border p-1", t.app, t.border)}>
          {q.options?.map((option) => {
            const selected = option === value;
            return (
              <button
                className={cn("flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left text-sm", selected ? cn(t.accentSoft, t.accent, "font-semibold") : "font-normal hover:bg-current/5")}
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
              >
                <span className="flex-1">{option}</span>
                {selected && <Icon.Check className="text-current" />}
              </button>
            );
          })}
        </div>
      )}
      <ErrorLine error={error} />
    </div>
  );
}

function Ranking({
  q,
  value,
  onChange,
  error,
  t,
}: {
  q: Question;
  value?: string[];
  onChange: (value: string[]) => void;
  error?: string | null;
  t: Tone;
}) {
  const defaultOrder = useMemo(() => q.options ?? [], [q.options]);
  const order = value && value.length ? value : defaultOrder;

  useEffect(() => {
    if (!value || value.length === 0) onChange(defaultOrder);
  }, [defaultOrder, onChange, value]);

  const move = (index: number, delta: number) => {
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= order.length) return;
    const next = [...order];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    onChange(next);
  };

  return (
    <div>
      <div className={cn("overflow-hidden rounded-[14px] border", t.border)}>
        {order.map((option, index) => (
          <div className={cn("flex items-center gap-3 px-3.5 py-3 text-[14.5px]", index === 0 ? "" : "border-t", index === 0 ? "" : t.border)} key={option}>
            <span className={cn("inline-flex size-7 items-center justify-center rounded-lg font-mono text-[13px] font-semibold", t.muteBg, t.textMute)}>
              {index + 1}
            </span>
            <span className="flex-1">{option}</span>
            <div className="flex gap-1">
              <button className={cn("inline-flex size-[30px] items-center justify-center rounded-lg border disabled:cursor-not-allowed disabled:opacity-40", t.border, t.textMute)} type="button" aria-label={`${option} 위로 이동`} disabled={index === 0} onClick={() => move(index, -1)}>
                ⌃
              </button>
              <button className={cn("inline-flex size-[30px] items-center justify-center rounded-lg border disabled:cursor-not-allowed disabled:opacity-40", t.border, t.textMute)} type="button" aria-label={`${option} 아래로 이동`} disabled={index === order.length - 1} onClick={() => move(index, 1)}>
                ⌄
              </button>
            </div>
          </div>
        ))}
      </div>
      <ErrorLine error={error} />
    </div>
  );
}
