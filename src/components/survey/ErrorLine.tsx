export function ErrorLine({ error }: { error?: string | null }) {
  if (!error) return null;

  return (
    <div className="mt-3.5 flex items-center gap-2 text-[13px] font-medium text-red-600">
      <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-red-100 text-[11px] font-bold text-red-600">
        !
      </span>
      {error}
    </div>
  );
}
