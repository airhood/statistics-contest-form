import { useEffect, useMemo, useState, type ReactNode } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut } from "firebase/auth";
import { downloadText, responsesToCsv, responsesToJson } from "../../lib/exportResponses";
import {
  clearSurveyResponses,
  countAnswered,
  deleteSurveyResponse,
  listSurveyResponses,
  loadSurveyResponses,
  summarizeResponses,
  syncLocalResponses,
} from "../../lib/responses";
import { auth, hasFirebaseConfig } from "../../lib/firebase";
import { resetSurveyDefinition, saveSurveyDefinitionWithStatus, validateSurveyDefinition } from "../../lib/surveyDefinition";
import { cn, type Tone } from "../../lib/theme";
import type { AnswerValue, ResponseSaveTarget, Survey, SurveyResponse, ThemeMode } from "../../lib/types";
import { Icon } from "../icons";
import { MediaBlock } from "../survey/MediaBlock";
import { QuestionRenderer } from "../survey/QuestionRenderer";
import { MiniBars, RatioBar } from "./AdminCharts";

type AdminView = "list" | "builder" | "dashboard" | "states";
type ConfirmationRequest = {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
};

const navItems: Array<{ id: AdminView; label: string }> = [
  { id: "list", label: "설문 목록" },
  { id: "builder", label: "JSON 빌더" },
  { id: "dashboard", label: "대시보드" },
  { id: "states", label: "상태 화면" },
];

function AdminLoading({ t }: { t: Tone }) {
  return (
    <main className={cn("grid h-screen place-items-center font-sans antialiased", t.app)}>
      <div className={cn("rounded-[16px] border px-5 py-4 text-sm", t.border, t.soft, t.textMute)}>관리자 세션 확인 중</div>
    </main>
  );
}

function AdminLogin({ t }: { t: Tone }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    if (!auth) return;
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={cn("grid h-screen place-items-center px-5 font-sans antialiased", t.app)}>
      <section className="w-full max-w-[420px]">
        <div className="mb-7 flex items-center gap-2">
          <span className={cn("size-[18px] rounded-[5px]", t.accentBg)} />
          <span className="text-[14px] font-semibold">Survey Admin</span>
        </div>
        <h1 className="m-0 text-[28px] font-semibold tracking-[-0.025em]">관리자 로그인</h1>
        <p className={cn("mb-6 mt-2 text-sm leading-[1.6]", t.textMute)}>
          Firebase가 연결된 환경에서는 관리자 인증 후 설문 정의와 응답을 관리합니다.
        </p>
        <div className="space-y-3">
          <input
            className={cn("h-11 w-full rounded-[14px] border px-4 text-[15px] outline-none focus-visible:ring-3", t.app, t.border, t.focus)}
            type="email"
            value={email}
            placeholder="admin@example.com"
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            className={cn("h-11 w-full rounded-[14px] border px-4 text-[15px] outline-none focus-visible:ring-3", t.app, t.border, t.focus)}
            type="password"
            value={password}
            placeholder="password"
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void signIn();
            }}
          />
          {error && <div className="text-sm text-red-500">{error}</div>}
          <button
            className={cn("h-11 w-full rounded-[14px] text-sm font-semibold outline-none focus-visible:ring-3 disabled:opacity-60", t.accentBg, t.accentText, t.focus)}
            type="button"
            disabled={loading}
            onClick={() => void signIn()}
          >
            {loading ? "로그인 중" : "로그인"}
          </button>
        </div>
      </section>
    </main>
  );
}

export function AdminPage({
  theme,
  survey,
  t,
  onToggleTheme,
  onOpenSurvey,
}: {
  theme: ThemeMode;
  survey: Survey;
  t: Tone;
  onToggleTheme: () => void;
  onOpenSurvey: () => void;
}) {
  const [view, setView] = useState<AdminView>("list");
  const [responses, setResponses] = useState(() => listSurveyResponses(survey.slug));
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [syncingLocal, setSyncingLocal] = useState(false);
  const [clearingResponses, setClearingResponses] = useState(false);
  const [deletingResponseId, setDeletingResponseId] = useState<string | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationRequest | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(!auth);
  const [signedIn, setSignedIn] = useState(!auth);
  const refresh = async () => {
    setLoadingResponses(true);
    try {
      setResponses(await loadSurveyResponses(survey.slug));
    } finally {
      setLoadingResponses(false);
    }
  };
  const title = navItems.find((item) => item.id === view)?.label ?? "관리자";
  const handleSignOut = () => {
    if (auth) void firebaseSignOut(auth);
  };
  const syncCachedResponses = async () => {
    setSyncingLocal(true);
    setSyncMessage(null);
    try {
      const result = await syncLocalResponses(survey.slug);
      setSyncMessage(
        `캐시 응답 ${result.synced}/${result.attempted}개를 Firebase에 동기화했습니다.${result.recovered > 0 ? ` 복구 로그 ${result.recovered}개` : ""}${result.failed > 0 ? ` 실패 ${result.failed}개` : ""}`,
      );
      await refresh();
    } finally {
      setSyncingLocal(false);
    }
  };
  const handleConfirm = async () => {
    if (!confirmation) return;
    setConfirming(true);
    try {
      await confirmation.onConfirm();
      setConfirmation(null);
    } finally {
      setConfirming(false);
    }
  };
  const removeResponse = (response: SurveyResponse) => {
    setConfirmation({
      title: "응답 삭제",
      body: `${response.id} 응답을 삭제합니다. 삭제한 응답은 복구할 수 없습니다.`,
      confirmLabel: "삭제",
      onConfirm: async () => {
        setDeletingResponseId(response.id);
        setSyncMessage(null);
        try {
          const result = await deleteSurveyResponse(response.id, survey.slug);
          setResponses((prev) => prev.filter((item) => item.id !== response.id));
          if (selectedResponse?.id === response.id) setSelectedResponse(null);
          setSyncMessage(result.remoteDeleted || !hasFirebaseConfig ? "응답을 삭제했습니다." : "로컬에서는 삭제했지만 Firebase 삭제에는 실패했습니다.");
          await refresh();
        } finally {
          setDeletingResponseId(null);
        }
      },
    });
  };
  const clearResponses = () => {
    if (responses.length === 0) return;
    setConfirmation({
      title: "응답 초기화",
      body: `현재 설문의 응답 ${responses.length}개를 모두 삭제합니다. 이 작업은 되돌릴 수 없습니다.`,
      confirmLabel: "전체 삭제",
      onConfirm: async () => {
        setClearingResponses(true);
        setSyncMessage(null);
        try {
          const result = await clearSurveyResponses(survey.slug);
          setResponses([]);
          setSelectedResponse(null);
          setSyncMessage(`응답을 초기화했습니다. 로컬 ${result.localDeleted}개, Firebase ${result.remoteDeleted}개 삭제${result.remoteFailed > 0 ? `, 실패 ${result.remoteFailed}개` : ""}.`);
          await refresh();
        } finally {
          setClearingResponses(false);
        }
      },
    });
  };

  useEffect(() => {
    if (auth && !signedIn) return;
    void refresh();
  }, [signedIn, survey.slug]);

  useEffect(() => {
    if (!auth) return;
    let alive = true;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!alive) return;
      setSignedIn(Boolean(user));
      setAuthReady(true);
    });
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  if (!authReady) {
    return <AdminLoading t={t} />;
  }

  if (auth && !signedIn) {
    return <AdminLogin t={t} />;
  }

  return (
    <main className={cn("flex h-screen overflow-hidden font-sans antialiased", t.app)}>
      <aside className={cn("flex w-[248px] shrink-0 flex-col border-r p-4 max-[780px]:hidden", t.border, t.soft)}>
        <button className="mb-8 flex items-center gap-2 text-left" type="button" onClick={() => setView("list")}>
          <span className={cn("size-[18px] rounded-[5px]", t.accentBg)} />
          <span className="text-[14px] font-semibold">Survey Admin</span>
        </button>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const selected = item.id === view;
            return (
              <button
                className={cn(
                  "h-10 rounded-[12px] px-3 text-left text-sm font-medium outline-none transition-colors focus-visible:ring-3",
                  selected ? cn(t.accentSoft, t.accent) : cn(t.textMute, "hover:bg-current/5"),
                  t.focus,
                )}
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="mt-auto flex items-center gap-2">
          <button
            className={cn("inline-flex size-9 items-center justify-center rounded-[12px] border outline-none focus-visible:ring-3", t.border, t.focus, t.textMute)}
            type="button"
            aria-label="theme"
            onClick={onToggleTheme}
          >
            {theme === "dark" ? <Icon.Sun /> : <Icon.Moon />}
          </button>
          <button
            className={cn("h-9 flex-1 rounded-[12px] border px-3 text-sm font-semibold outline-none hover:bg-current/5 focus-visible:ring-3", t.border, t.focus)}
            type="button"
            onClick={onOpenSurvey}
          >
            설문 보기
          </button>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className={cn("flex h-[64px] shrink-0 items-center justify-between gap-3 border-b px-6 max-[640px]:px-4", t.border)}>
          <div>
            <div className={cn("text-[11px] font-medium uppercase tracking-[0.14em]", t.textSoft)}>관리자 페이지</div>
            <h1 className="m-0 text-[20px] font-semibold tracking-[-0.02em]">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("hidden rounded-full px-2.5 py-1 text-xs font-semibold sm:inline-flex", hasFirebaseConfig ? cn(t.accentSoft, t.accent) : cn(t.muteBg, t.textMute))}>
              {hasFirebaseConfig ? "Firebase 연결 준비됨" : "Local 저장"}
            </span>
            <button
              className={cn("h-9 rounded-[12px] border px-3 text-sm font-semibold outline-none hover:bg-current/5 focus-visible:ring-3", t.border, t.focus)}
              type="button"
              onClick={refresh}
            >
              {loadingResponses ? "동기화 중" : "새로고침"}
            </button>
            <button
              className={cn("hidden h-9 rounded-[12px] px-3 text-sm font-semibold outline-none focus-visible:ring-3 max-[780px]:inline-flex", t.accentBg, t.accentText, t.focus)}
              type="button"
              onClick={onOpenSurvey}
            >
              설문
            </button>
            {auth && (
              <button
                className={cn("h-9 rounded-[12px] border px-3 text-sm font-semibold outline-none hover:bg-current/5 focus-visible:ring-3", t.border, t.focus)}
                type="button"
                onClick={handleSignOut}
              >
                로그아웃
              </button>
            )}
          </div>
        </header>
        <nav className={cn("hidden shrink-0 gap-1 overflow-x-auto border-b px-4 py-2 max-[780px]:flex", t.border)}>
          {navItems.map((item) => {
            const selected = item.id === view;
            return (
              <button
                className={cn(
                  "h-8 shrink-0 rounded-[10px] px-3 text-[12px] font-semibold outline-none focus-visible:ring-3",
                  selected ? cn(t.accentSoft, t.accent) : cn(t.textMute, "hover:bg-current/5"),
                  t.focus,
                )}
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
        {syncMessage && <div className={cn("border-b px-6 py-2 text-[12px] max-[640px]:px-4", t.border, t.textMute)}>{syncMessage}</div>}
        <div className="min-h-0 flex-1 overflow-hidden">
          {view === "list" && (
            <ListView
              survey={survey}
              responses={responses}
              t={t}
              syncingLocal={syncingLocal}
              clearingResponses={clearingResponses}
              deletingResponseId={deletingResponseId}
              onOpenSurvey={onOpenSurvey}
              onOpenDashboard={() => setView("dashboard")}
              onSyncCachedResponses={() => void syncCachedResponses()}
              onClearResponses={clearResponses}
              onOpenResponse={setSelectedResponse}
              onDeleteResponse={removeResponse}
            />
          )}
          {view === "builder" && <BuilderView survey={survey} t={t} />}
          {view === "dashboard" && <DashboardView survey={survey} responses={responses} t={t} />}
          {view === "states" && <StatesView t={t} />}
        </div>
      </section>
      {selectedResponse && <ResponseDetailModal response={selectedResponse} survey={survey} t={t} onClose={() => setSelectedResponse(null)} onDelete={() => void removeResponse(selectedResponse)} />}
      {confirmation && (
        <ConfirmationDialog
          title={confirmation.title}
          body={confirmation.body}
          confirmLabel={confirmation.confirmLabel}
          loading={confirming}
          t={t}
          onCancel={() => setConfirmation(null)}
          onConfirm={() => void handleConfirm()}
        />
      )}
    </main>
  );
}

function ListView({
  survey,
  responses,
  t,
  syncingLocal,
  clearingResponses,
  deletingResponseId,
  onOpenSurvey,
  onOpenDashboard,
  onSyncCachedResponses,
  onClearResponses,
  onOpenResponse,
  onDeleteResponse,
}: {
  survey: Survey;
  responses: SurveyResponse[];
  t: Tone;
  syncingLocal: boolean;
  clearingResponses: boolean;
  deletingResponseId: string | null;
  onOpenSurvey: () => void;
  onOpenDashboard: () => void;
  onSyncCachedResponses: () => void;
  onClearResponses: () => void;
  onOpenResponse: (response: SurveyResponse) => void;
  onDeleteResponse: (response: SurveyResponse) => void;
}) {
  const filenameBase = `${survey.slug}-responses`;

  return (
    <div className="h-full overflow-auto px-6 py-6 max-[640px]:px-4">
      <div className={cn("overflow-hidden rounded-[14px] border", t.border)}>
        <div className={cn("grid grid-cols-[1.4fr_120px_120px_160px_170px] gap-0 border-b px-4 py-3 text-[11px] font-medium uppercase tracking-[0.12em] max-[920px]:hidden", t.border, t.textSoft)}>
          <div>설문</div>
          <div>상태</div>
          <div>문항</div>
          <div>응답</div>
          <div>작업</div>
        </div>
        <div className={cn("grid grid-cols-[1.4fr_120px_120px_160px_170px] items-center px-4 py-4 max-[920px]:grid-cols-1 max-[920px]:gap-3", t.soft)}>
          <div>
            <div className="text-[15px] font-semibold">{survey.title}</div>
            <div className={cn("mt-1 font-mono text-[11px]", t.textSoft)}>{survey.slug}</div>
          </div>
          <StatusBadge status="open" t={t} />
          <div className="font-mono text-sm tabular-nums">{survey.questions.length}</div>
          <div className="font-mono text-sm tabular-nums">{responses.length}</div>
          <div className="flex flex-wrap gap-2">
            <button className={cn("h-9 rounded-[12px] border px-3 text-sm font-semibold hover:bg-current/5", t.border)} type="button" onClick={onOpenSurvey}>
              열기
            </button>
            <button className={cn("h-9 rounded-[12px] px-3 text-sm font-semibold", t.accentBg, t.accentText)} type="button" onClick={onOpenDashboard}>
              분석
            </button>
            <button
              className={cn("h-9 rounded-[12px] border px-3 text-sm font-semibold hover:bg-current/5", t.border)}
              type="button"
              onClick={() => downloadText(`${filenameBase}.csv`, responsesToCsv(survey, responses), "text/csv;charset=utf-8")}
            >
              CSV
            </button>
            <button
              className={cn("h-9 rounded-[12px] border px-3 text-sm font-semibold hover:bg-current/5", t.border)}
              type="button"
              onClick={() => downloadText(`${filenameBase}.json`, responsesToJson(responses, survey), "application/json;charset=utf-8")}
            >
              JSON
            </button>
            {hasFirebaseConfig && (
              <button
                className={cn("h-9 rounded-[12px] border px-3 text-sm font-semibold hover:bg-current/5 disabled:opacity-50", t.border)}
                type="button"
                disabled={syncingLocal}
                onClick={onSyncCachedResponses}
                title="Firebase 저장 실패로 브라우저에 남은 응답을 다시 동기화합니다."
              >
                캐시 동기화
              </button>
            )}
            <button
              className="h-9 rounded-[12px] border border-red-500/30 px-3 text-sm font-semibold text-red-500 hover:bg-red-500/10 disabled:opacity-50"
              type="button"
              disabled={clearingResponses || responses.length === 0}
              onClick={onClearResponses}
            >
              응답 초기화
            </button>
          </div>
        </div>
      </div>

      <section className="mt-6 grid grid-cols-3 gap-3 max-[900px]:grid-cols-1">
        <StatCard label="저장된 응답" value={String(responses.length)} t={t} />
        <StatCard label="문항 수" value={String(survey.questions.length)} t={t} />
        <StatCard label="필수 문항" value={String(survey.questions.filter((q) => q.required).length)} t={t} />
      </section>

      <RecentResponses
        survey={survey}
        responses={responses}
        t={t}
        deletingResponseId={deletingResponseId}
        onOpenResponse={onOpenResponse}
        onDeleteResponse={onDeleteResponse}
      />
    </div>
  );
}

function BuilderView({ survey, t }: { survey: Survey; t: Tone }) {
  const initial = useMemo(() => JSON.stringify(survey, null, 2), [survey]);
  const [json, setJson] = useState(initial);
  const [parsed, setParsed] = useState<Survey>(survey);
  const [error, setError] = useState<string | null>(null);
  const [saveTarget, setSaveTarget] = useState<ResponseSaveTarget | null>(null);
  const [savingDefinition, setSavingDefinition] = useState(false);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [answer, setAnswer] = useState<Record<string, AnswerValue>>({});

  const formatJson = () => {
    try {
      const next = validateSurveyDefinition(JSON.parse(json));
      setJson(JSON.stringify(next, null, 2));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "JSON을 확인해주세요.");
    }
  };

  const applyJson = () => {
    try {
      const next = validateSurveyDefinition(JSON.parse(json));
      setJson(JSON.stringify(next, null, 2));
      setParsed(next);
      setPreviewIdx(0);
      setAnswer({});
      setError(null);
      setSaveTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "JSON을 확인해주세요.");
    }
  };

  const saveJson = async () => {
    try {
      setSavingDefinition(true);
      const result = await saveSurveyDefinitionWithStatus(validateSurveyDefinition(JSON.parse(json)));
      setJson(JSON.stringify(result.survey, null, 2));
      setParsed(result.survey);
      setPreviewIdx(0);
      setAnswer({});
      setError(null);
      setSaveTarget(result.target);
    } catch (err) {
      setError(err instanceof Error ? err.message : "JSON을 확인해주세요.");
    } finally {
      setSavingDefinition(false);
    }
  };

  const resetJson = () => {
    const next = resetSurveyDefinition();
    const nextJson = JSON.stringify(next, null, 2);
    setJson(nextJson);
    setParsed(next);
    setPreviewIdx(0);
    setAnswer({});
    setError(null);
    setSaveTarget(null);
  };

  const q = parsed.questions[previewIdx - 1];

  return (
    <div className="grid h-full grid-cols-[minmax(360px,0.95fr)_minmax(360px,1.05fr)] gap-0 max-[980px]:grid-cols-1">
      <section className={cn("min-h-0 border-r p-5 max-[980px]:border-r-0 max-[980px]:border-b", t.border)}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="m-0 text-[17px] font-semibold">설문 JSON</h2>
            <p className={cn("m-0 mt-1 text-[12px]", t.textMute)}>적용은 미리보기, 저장은 실제 응답자 설문에 반영됩니다.</p>
          </div>
          <div className="flex gap-2">
            <button className={cn("h-9 rounded-[12px] border px-3 text-sm font-semibold hover:bg-current/5", t.border)} type="button" onClick={resetJson}>
              초기화
            </button>
            <button className={cn("h-9 rounded-[12px] border px-3 text-sm font-semibold hover:bg-current/5", t.border)} type="button" onClick={formatJson}>
              포맷
            </button>
            <button className={cn("h-9 rounded-[12px] border px-3 text-sm font-semibold hover:bg-current/5", t.border)} type="button" onClick={applyJson}>
              적용
            </button>
            <button className={cn("h-9 rounded-[12px] px-3 text-sm font-semibold disabled:opacity-60", t.accentBg, t.accentText)} type="button" disabled={savingDefinition} onClick={() => void saveJson()}>
              {savingDefinition ? "저장 중" : "저장"}
            </button>
          </div>
        </div>
        <textarea
          className={cn("h-[calc(100%-86px)] w-full resize-none rounded-[14px] border p-4 font-mono text-[12px] leading-[1.55] outline-none focus-visible:ring-3", t.app, t.border, t.focus)}
          value={json}
          onChange={(event) => setJson(event.target.value)}
          spellCheck={false}
        />
        {saveTarget && <div className={cn("mt-2 text-sm", saveTarget === "firebase" ? t.accent : t.textMute)}>{definitionSaveLabel(saveTarget)}</div>}
        {error && <div className="mt-2 text-sm text-red-500">{error}</div>}
      </section>

      <section className="min-h-0 overflow-auto p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <PreviewStep label="시작" selected={previewIdx === 0} onClick={() => setPreviewIdx(0)} t={t} />
          {parsed.questions.map((item, index) => (
            <PreviewStep key={item.id} label={`Q${String(index + 1).padStart(2, "0")}`} selected={previewIdx === index + 1} onClick={() => setPreviewIdx(index + 1)} t={t} />
          ))}
        </div>
        <div className={cn("mx-auto max-w-[620px] rounded-[18px] border p-6", t.border, t.soft)}>
          {previewIdx === 0 ? (
            <>
              <div className={cn("mb-3 font-mono text-[11px] uppercase tracking-[0.14em]", t.textSoft)}>intro</div>
              <h2 className="m-0 text-[28px] font-semibold leading-tight tracking-[-0.02em]">{parsed.subtitle}</h2>
              <p className={cn("mt-3 text-[14px] leading-[1.65]", t.textMute)}>{parsed.description}</p>
            </>
          ) : q ? (
            <>
              <div className={cn("mb-3 font-mono text-[11px] uppercase tracking-[0.14em]", t.textSoft)}>
                Q{String(previewIdx).padStart(2, "0")}
                {q.required && <span className={cn("ml-2", t.accent)}>필수</span>}
              </div>
              <h2 className="m-0 text-[23px] font-semibold leading-[1.32] tracking-[-0.02em]">{q.title}</h2>
              {q.hint && <p className={cn("mt-2 text-[13px] leading-[1.55]", t.textMute)}>{q.hint}</p>}
              <MediaBlock media={q.media} t={t} />
              <div className="mt-5">
                <QuestionRenderer q={q} value={answer[q.id]} onChange={(value) => setAnswer((prev) => ({ ...prev, [q.id]: value }))} t={t} />
              </div>
            </>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function DashboardView({ survey, responses, t }: { survey: Survey; responses: SurveyResponse[]; t: Tone }) {
  const summary = summarizeResponses(responses, survey);
  const countsByDay = useMemo(() => responsesByDay(responses), [responses]);
  const q2 = optionDistribution(responses, "q2");
  const q3 = optionDistribution(responses, "q3");

  return (
    <div className="h-full overflow-auto px-6 py-6 max-[640px]:px-4">
      <section className="grid grid-cols-4 gap-3 max-[1060px]:grid-cols-2 max-[640px]:grid-cols-1">
        <StatCard label="총 응답" value={String(summary.totalResponses)} t={t} />
        <StatCard label="평균 응답 문항" value={summary.averageAnswered.toFixed(1)} t={t} />
        <StatCard label="필수 문항" value={String(summary.requiredQuestions)} t={t} />
        <StatCard label="선택 문항" value={String(summary.optionalQuestions)} t={t} />
      </section>

      <section className="mt-6 grid grid-cols-[1fr_1fr] gap-4 max-[980px]:grid-cols-1">
        <Panel title="응답 추이" subtitle="브라우저 로컬 저장 기준" t={t}>
          <MiniBars values={countsByDay.values} labels={countsByDay.labels} t={t} />
        </Panel>
        <Panel title="연령대 분포" subtitle="Q02 dropdown" t={t}>
          <div className="space-y-3">
            {q2.map(([label, value]) => <RatioBar key={label} label={label} value={value} t={t} />)}
            {q2.length === 0 && <EmptyLine t={t}>아직 응답 데이터가 없습니다.</EmptyLine>}
          </div>
        </Panel>
        <Panel title="이미지 판별 응답" subtitle="Q03 single choice" t={t}>
          <div className="space-y-3">
            {q3.map(([label, value]) => <RatioBar key={label} label={label} value={value} t={t} />)}
            {q3.length === 0 && <EmptyLine t={t}>아직 응답 데이터가 없습니다.</EmptyLine>}
          </div>
        </Panel>
        <Panel title="원본 응답" subtitle="최근 5개" t={t}>
          <RecentResponses survey={survey} responses={responses.slice(0, 5)} compact t={t} />
        </Panel>
      </section>
    </div>
  );
}

function StatesView({ t }: { t: Tone }) {
  const states = [
    ["빈 데이터", "아직 응답이 없을 때 표시되는 화면입니다."],
    ["저장 완료", "응답 제출 후 관리자에서 확인 가능한 상태입니다."],
    ["JSON 오류", "설문 정의가 깨졌을 때 빌더에 표시되는 오류 상태입니다."],
    ["로딩", "Firebase 연결 뒤 네트워크 요청 중 사용할 상태입니다."],
  ];

  return (
    <div className="h-full overflow-auto px-6 py-6 max-[640px]:px-4">
      <div className="grid grid-cols-2 gap-4 max-[900px]:grid-cols-1">
        {states.map(([title, body]) => (
          <div className={cn("rounded-[16px] border p-5", t.border, t.soft)} key={title}>
            <div className={cn("mb-4 inline-flex size-9 items-center justify-center rounded-full", t.accentSoft, t.accent)}>
              <Icon.Check />
            </div>
            <h2 className="m-0 text-[17px] font-semibold">{title}</h2>
            <p className={cn("mb-0 mt-2 text-sm leading-[1.6]", t.textMute)}>{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentResponses({
  survey,
  responses,
  t,
  compact = false,
  deletingResponseId = null,
  onOpenResponse,
  onDeleteResponse,
}: {
  survey: Survey;
  responses: SurveyResponse[];
  t: Tone;
  compact?: boolean;
  deletingResponseId?: string | null;
  onOpenResponse?: (response: SurveyResponse) => void;
  onDeleteResponse?: (response: SurveyResponse) => void;
}) {
  return (
    <section className={compact ? "" : "mt-6"}>
      {!compact && <h2 className="mb-3 text-[17px] font-semibold">최근 응답</h2>}
      <div className={cn("overflow-hidden rounded-[14px] border", t.border)}>
        {responses.length === 0 ? (
          <div className={cn("p-5 text-sm", t.textMute)}>아직 저장된 응답이 없습니다.</div>
        ) : (
          responses.map((response, index) => (
            <div
              className={cn(
                "grid items-center gap-3 px-4 py-3 text-sm max-[720px]:grid-cols-1",
                compact ? "grid-cols-[1fr_120px_160px]" : "grid-cols-[1fr_120px_160px_150px]",
                index === 0 ? "" : "border-t",
                index === 0 ? "" : t.border,
              )}
              key={response.id}
            >
              <div>
                <div className="font-mono text-xs">{response.id}</div>
                <div className={cn("mt-1 text-xs", t.textSoft)}>anon · {response.anonId}</div>
              </div>
              <div className="font-mono tabular-nums">{countAnswered(response.answers, survey)} / {survey.questions.length}</div>
              <div className={cn("font-mono text-xs tabular-nums", t.textMute)}>{formatDate(response.submittedAt)}</div>
              {!compact && (
                <div className="flex justify-end gap-2 max-[720px]:justify-start">
                  <button
                    className={cn("h-8 rounded-[10px] border px-3 text-[12px] font-semibold hover:bg-current/5", t.border)}
                    type="button"
                    onClick={() => onOpenResponse?.(response)}
                  >
                    보기
                  </button>
                  <button
                    className="h-8 rounded-[10px] border border-red-500/30 px-3 text-[12px] font-semibold text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                    type="button"
                    disabled={deletingResponseId === response.id}
                    onClick={() => onDeleteResponse?.(response)}
                  >
                    {deletingResponseId === response.id ? "삭제 중" : "삭제"}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function ResponseDetailModal({
  response,
  survey,
  t,
  onClose,
  onDelete,
}: {
  response: SurveyResponse;
  survey: Survey;
  t: Tone;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-4 py-5 backdrop-blur-sm">
      <section className={cn("flex max-h-full w-full max-w-[860px] flex-col overflow-hidden rounded-[18px] border shadow-2xl", t.border, t.app)}>
        <header className={cn("flex shrink-0 items-start justify-between gap-4 border-b px-5 py-4", t.border)}>
          <div className="min-w-0">
            <div className={cn("text-[11px] font-medium uppercase tracking-[0.14em]", t.textSoft)}>response detail</div>
            <h2 className="mt-1 truncate font-mono text-[17px] font-semibold">{response.id}</h2>
            <p className={cn("m-0 mt-1 text-[12px]", t.textMute)}>
              {formatDate(response.submittedAt)} · {countAnswered(response.answers, survey)} / {survey.questions.length} 문항
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button className="h-9 rounded-[12px] border border-red-500/30 px-3 text-sm font-semibold text-red-500 hover:bg-red-500/10" type="button" onClick={onDelete}>
              삭제
            </button>
            <button className={cn("h-9 rounded-[12px] border px-3 text-sm font-semibold hover:bg-current/5", t.border)} type="button" onClick={onClose}>
              닫기
            </button>
          </div>
        </header>

        <div className="min-h-0 overflow-auto px-5 py-5">
          <section className="grid grid-cols-4 gap-3 max-[760px]:grid-cols-2 max-[520px]:grid-cols-1">
            <MetaItem label="설문" value={response.surveySlug} t={t} />
            <MetaItem label="익명 ID" value={response.anonId} t={t} />
            <MetaItem label="시작" value={formatDate(response.startedAt)} t={t} />
            <MetaItem label="제출" value={formatDate(response.submittedAt)} t={t} />
          </section>

          <section className="mt-5 space-y-3">
            {survey.questions.map((question, index) => (
              <div className={cn("rounded-[14px] border p-4", t.border, t.soft)} key={question.id}>
                <div className={cn("mb-2 font-mono text-[11px] uppercase tracking-[0.12em]", t.textSoft)}>
                  Q{String(index + 1).padStart(2, "0")} · {question.id}
                </div>
                <h3 className="m-0 text-[15px] font-semibold leading-[1.45]">{question.title}</h3>
                <AnswerPreview question={question} value={response.answers[question.id]} t={t} />
              </div>
            ))}
          </section>

          {response.userAgent && (
            <div className={cn("mt-5 rounded-[14px] border p-4 font-mono text-[11px] leading-[1.6]", t.border, t.textMute)}>
              {response.userAgent}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function MetaItem({ label, value, t }: { label: string; value: string; t: Tone }) {
  return (
    <div className={cn("rounded-[14px] border p-3", t.border, t.soft)}>
      <div className={cn("text-[11px]", t.textSoft)}>{label}</div>
      <div className="mt-1 break-all font-mono text-[12px]">{value}</div>
    </div>
  );
}

function AnswerPreview({ question, value, t }: { question: Survey["questions"][number]; value: AnswerValue; t: Tone }) {
  if (value == null || value === "" || (Array.isArray(value) && value.length === 0)) {
    return <p className={cn("m-0 mt-3 text-sm", t.textMute)}>미응답</p>;
  }

  if (Array.isArray(value)) {
    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {value.map((item) => (
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", t.accentSoft, t.accent)} key={item}>
            {item}
          </span>
        ))}
      </div>
    );
  }

  if (typeof value === "object") {
    return (
      <div className="mt-3 space-y-2">
        {Object.entries(value).map(([rowId, score]) => (
          <div className={cn("flex items-center justify-between gap-3 rounded-[12px] border px-3 py-2 text-sm", t.border)} key={rowId}>
            <span>{question.rows?.find((row) => row.id === rowId)?.text ?? rowId}</span>
            <span className="font-mono font-semibold tabular-nums">{score}</span>
          </div>
        ))}
      </div>
    );
  }

  return <p className="m-0 mt-3 whitespace-pre-wrap text-sm leading-[1.65]">{String(value)}</p>;
}

function ConfirmationDialog({
  title,
  body,
  confirmLabel,
  loading,
  t,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  loading: boolean;
  t: Tone;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/50 px-4 backdrop-blur-sm">
      <section className={cn("w-full max-w-[420px] rounded-[18px] border p-5 shadow-2xl", t.border, t.app)}>
        <div className="mb-4 flex items-start gap-3">
          <div className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-red-500/12 text-red-500">
            <Icon.Alert />
          </div>
          <div>
            <h2 className="m-0 text-[17px] font-semibold tracking-[-0.01em]">{title}</h2>
            <p className={cn("m-0 mt-2 text-sm leading-[1.65]", t.textMute)}>{body}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            className={cn("h-10 rounded-[12px] border px-4 text-sm font-semibold outline-none hover:bg-current/5 focus-visible:ring-3 disabled:opacity-50", t.border, t.focus)}
            type="button"
            disabled={loading}
            onClick={onCancel}
          >
            취소
          </button>
          <button
            className="h-10 rounded-[12px] bg-red-500 px-4 text-sm font-semibold text-white outline-none hover:bg-red-600 focus-visible:ring-3 focus-visible:ring-red-500/25 disabled:opacity-50"
            type="button"
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? "처리 중" : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

function Panel({ title, subtitle, t, children }: { title: string; subtitle: string; t: Tone; children: ReactNode }) {
  return (
    <section className={cn("rounded-[16px] border p-5", t.border, t.soft)}>
      <div className="mb-5">
        <h2 className="m-0 text-[16px] font-semibold">{title}</h2>
        <p className={cn("m-0 mt-1 text-xs", t.textSoft)}>{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function StatCard({ label, value, t }: { label: string; value: string; t: Tone }) {
  return (
    <div className={cn("rounded-[16px] border p-5", t.border, t.soft)}>
      <div className="font-mono text-[28px] font-semibold tracking-[-0.03em] tabular-nums">{value}</div>
      <div className={cn("mt-1 text-sm", t.textMute)}>{label}</div>
    </div>
  );
}

function StatusBadge({ status, t }: { status: "open" | "closed" | "draft"; t: Tone }) {
  const label = status === "open" ? "진행중" : status === "closed" ? "종료" : "초안";
  return <span className={cn("inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold", status === "open" ? cn(t.accentSoft, t.accent) : cn(t.muteBg, t.textMute))}>{label}</span>;
}

function definitionSaveLabel(target: ResponseSaveTarget) {
  if (target === "firebase") return "Firebase에 저장되었습니다. 설문 화면에 바로 반영됩니다.";
  if (target === "local") return "Firebase 저장에 실패해 브라우저 로컬 캐시에만 저장했습니다.";
  return "Firebase 저장을 확인하는 중입니다.";
}

function PreviewStep({ label, selected, onClick, t }: { label: string; selected: boolean; onClick: () => void; t: Tone }) {
  return (
    <button
      className={cn("h-8 rounded-[10px] border px-2.5 font-mono text-[11px] font-semibold outline-none focus-visible:ring-3", selected ? cn(t.accentSoft, t.accent, t.borderAccent) : cn(t.border, t.textMute), t.focus)}
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function EmptyLine({ children, t }: { children: ReactNode; t: Tone }) {
  return <div className={cn("rounded-[12px] border px-4 py-6 text-center text-sm", t.border, t.textMute)}>{children}</div>;
}

function optionDistribution(responses: SurveyResponse[], questionId: string) {
  const counts = new Map<string, number>();
  let total = 0;
  for (const response of responses) {
    const value = response.answers[questionId];
    if (typeof value !== "string" || value === "") continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
    total += 1;
  }
  return Array.from(counts.entries()).map(([label, count]) => [label, total === 0 ? 0 : count / total] as [string, number]);
}

function responsesByDay(responses: SurveyResponse[]) {
  const days = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - offset));
    return date.toISOString().slice(0, 10);
  });
  const counts = new Map(days.map((day) => [day, 0]));
  for (const response of responses) {
    const day = response.submittedAt.slice(0, 10);
    if (counts.has(day)) counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  return {
    labels: days.map((day) => day.slice(5).replace("-", "/")),
    values: days.map((day) => counts.get(day) ?? 0),
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
