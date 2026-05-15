import { cn, type Tone } from "../../lib/theme";
import type { Media } from "../../lib/types";
import { Icon } from "../icons";

export function MediaBlock({ media, t }: { media?: Media; t: Tone }) {
  if (!media) return null;

  if (media.kind === "image") {
    return (
      <div className="mt-[22px]">
        <div
          className={cn("relative flex w-full items-center justify-center overflow-hidden rounded-xl border", media.src ? t.soft : t.mediaStripe, t.border)}
          style={{ aspectRatio: media.ratio ?? "16 / 9" }}
        >
          {media.src ? (
            <img className="size-full object-contain" src={media.src} alt={media.alt ?? media.label ?? "survey image"} />
          ) : (
            <MediaLabel label={media.label ?? "image"} t={t} />
          )}
        </div>
        {media.src && media.label && <div className={cn("mt-2 font-mono text-[11px] tracking-[0.04em]", t.textSoft)}>{media.label}</div>}
      </div>
    );
  }

  if (media.kind === "video") {
    return (
      <div className="mt-[22px]">
        <div
          className={cn("relative flex w-full items-center justify-center overflow-hidden rounded-xl border", media.src ? "bg-black" : t.mediaStripe, t.border)}
          style={{ aspectRatio: media.ratio ?? "16 / 9" }}
        >
          {media.src ? (
            <video className="size-full object-contain" src={media.src} poster={media.poster} controls preload="metadata" />
          ) : (
            <>
              <span className="mb-10 inline-flex size-12 items-center justify-center rounded-full bg-black/55 text-white">
                <Icon.Play />
              </span>
              <MediaLabel label={media.label ?? "video"} t={t} />
            </>
          )}
        </div>
        {media.src && media.label && <div className={cn("mt-2 font-mono text-[11px] tracking-[0.04em]", t.textSoft)}>{media.label}</div>}
      </div>
    );
  }

  if (media.kind === "audio") {
    const bars = [22, 38, 16, 54, 28, 60, 44, 32, 50, 24, 58, 36, 46, 30, 52, 40, 26, 48, 34, 56, 28, 42, 30, 50, 22, 38, 18, 44];
    return (
      <div className="mt-[22px]">
        <div className={cn("flex items-center gap-3.5 rounded-xl border p-3.5", t.border, t.soft)}>
          {media.src ? (
            <audio className="h-10 min-w-0 flex-1" src={media.src} controls preload="metadata" />
          ) : (
            <>
              <button
                className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-full", t.accentBg, t.accentText)}
                type="button"
                aria-label="오디오 재생"
              >
                <Icon.Play />
              </button>
              <div className="flex h-9 flex-1 items-center gap-[3px] overflow-hidden">
                {bars.map((height, index) => (
                  <span
                    className={cn("inline-block w-0.5 rounded-full", index < 12 ? t.accentBg : t.waveMuted)}
                    style={{ height: `${height}%` }}
                    key={index}
                  />
                ))}
              </div>
            </>
          )}
          <span className={cn("shrink-0 font-mono text-[11px] tracking-[0.04em]", t.textSoft)}>
            {media.duration ?? media.label}
          </span>
        </div>
      </div>
    );
  }

  if (media.kind === "text") {
    return (
      <div
        className={cn(
          "mt-[22px] whitespace-pre-wrap rounded-xl border border-l-[3px] p-5 text-[14.5px] leading-[1.75]",
          t.soft,
          t.border,
          t.borderAccent,
        )}
      >
        {media.body}
      </div>
    );
  }

  return null;
}

function MediaLabel({ label, t }: { label: string; t: Tone }) {
  return (
    <span
      className={cn(
        "absolute rounded-md border px-2 py-1 font-mono text-[11px] tracking-[0.04em]",
        t.app,
        t.border,
        t.textSoft,
      )}
    >
      {label}
    </span>
  );
}
