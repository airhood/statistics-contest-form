import { useEffect, useMemo, useRef, useState } from "react";
import { createSurveyResponse, listSurveyResponses, saveSurveyResponse } from "../lib/responses";
import { clearSurveyDraft, loadSurveyDraft, saveSurveyDraft } from "../lib/draft";
import { getAnonId, getVisibleQuestions, indexQuestions, normalizeVisibleAnswers, validate } from "../lib/survey";
import { loadRemoteSurveyDefinition, loadSurveyDefinition, SURVEY_DEFINITION_EVENT } from "../lib/surveyDefinition";
import { cn, tone } from "../lib/theme";
import type { AnswerValue, ResponseSaveTarget, SurveyResponse, ThemeMode } from "../lib/types";
import { AdminPage } from "./admin/AdminPage";
import { BottomMeta } from "./layout/BottomMeta";
import { CompletePage } from "./pages/CompletePage";
import { IntroPage } from "./pages/IntroPage";
import { QuestionPage } from "./pages/QuestionPage";
import { TopBar } from "./layout/TopBar";

export function App() {
  const [theme, setTheme] = useTheme();
  const [path, navigate] = usePath();
  const t = tone[theme];
  const [survey, setSurvey] = useState(() => loadSurveyDefinition());
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [direction, setDirection] = useState<"fwd" | "back">("fwd");
  const [saving, setSaving] = useState(false);
  const [submittedResponse, setSubmittedResponse] = useState<SurveyResponse | null>(null);
  const [responseSaveTarget, setResponseSaveTarget] = useState<ResponseSaveTarget | null>(null);
  const [draftLoadedFor, setDraftLoadedFor] = useState<string | null>(null);
  const saveTimer = useRef<number | null>(null);
  const anonId = useRef(getAnonId()).current;
  const startedAt = useRef(new Date().toISOString()).current;
  const visibleQuestions = useMemo(() => getVisibleQuestions(survey, answers), [answers, survey]);
  const visibleAnswers = useMemo(() => normalizeVisibleAnswers(survey, answers), [answers, survey]);
  const qInfo = useMemo(() => indexQuestions({ ...survey, questions: visibleQuestions }), [survey, visibleQuestions]);

  useEffect(() => {
    const sync = () => {
      setSurvey(loadSurveyDefinition());
      setAnswers({});
      setErrors({});
      setSubmittedResponse(null);
      setIdx(0);
    };
    window.addEventListener(SURVEY_DEFINITION_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SURVEY_DEFINITION_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    void loadRemoteSurveyDefinition().then((next) => setSurvey(next));
  }, []);

  const total = visibleQuestions.length;
  const isIntro = idx === 0;
  const isDone = idx > total;
  const current = !isIntro && !isDone ? visibleQuestions[idx - 1] : null;
  const progress = isIntro || total === 0 ? 0 : isDone ? 1 : (idx - 0.5) / total;

  useEffect(() => {
    if (idx > visibleQuestions.length && idx > 0) setIdx(visibleQuestions.length + 1);
  }, [idx, visibleQuestions.length]);

  useEffect(() => {
    if (Object.keys(answers).length === 0) return;
    if (!isDone && idx > 0) saveSurveyDraft(survey.slug, idx, answers);
    setSaving(true);
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => setSaving(false), 600);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [answers, idx, isDone, survey.slug]);

  useEffect(() => {
    if (draftLoadedFor === survey.slug) return;
    const draft = loadSurveyDraft(survey.slug);
    setDraftLoadedFor(survey.slug);
    if (!draft) return;
    setAnswers(draft.answers);
    setIdx(Math.min(Math.max(draft.idx, 0), visibleQuestions.length));
  }, [draftLoadedFor, survey.slug, visibleQuestions.length]);

  const setAnswer = (qId: string, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
    setErrors((prev) => (prev[qId] ? { ...prev, [qId]: null } : prev));
  };

  const next = () => {
    if (isIntro) {
      setDirection("fwd");
      setIdx(1);
      return;
    }
    if (!current || isDone) return;
    const error = validate(current, answers[current.id]);
    if (error) {
      setErrors((prev) => ({ ...prev, [current.id]: error }));
      return;
    }
    if (idx === total) {
      const response = createSurveyResponse({
        anonId,
        startedAt,
        answers: visibleAnswers,
        survey,
      });
      clearSurveyDraft(survey.slug);
      setSubmittedResponse(response);
      setResponseSaveTarget("pending");
      void saveSurveyResponse(response).then(setResponseSaveTarget);
    }
    setDirection("fwd");
    setIdx((value) => value + 1);
  };

  const back = () => {
    if (idx <= 0) return;
    setDirection("back");
    setIdx((value) => value - 1);
  };

  const restart = () => {
    setAnswers({});
    setErrors({});
    clearSurveyDraft(survey.slug);
    setSubmittedResponse(null);
    setResponseSaveTarget(null);
    setDirection("back");
    setIdx(0);
  };

  useEffect(() => {
    if (path === "/admin") return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName.toLowerCase();
      const inField =
        tag === "textarea" ||
        (tag === "input" &&
          !["checkbox", "radio", "range"].includes((target as HTMLInputElement).type));

      if (event.key === "Enter" && !inField) {
        event.preventDefault();
        next();
      } else if (event.key === "ArrowRight" && !inField) {
        next();
      } else if (event.key === "ArrowLeft" && !inField) {
        back();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (path === "/admin") {
    return (
      <AdminPage
        theme={theme}
        t={t}
        onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
        onOpenSurvey={() => navigate("/")}
        survey={survey}
      />
    );
  }

  return (
    <main className={cn("flex h-screen flex-col overflow-hidden font-sans antialiased", t.app)}>
      <TopBar
        idx={isIntro ? 0 : isDone ? total : idx}
        total={total}
        progress={progress}
        theme={theme}
        t={t}
        onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
      />
      <section className="relative min-h-0 flex-1 overflow-hidden">
        <div key={idx} className="h-full">
          {isIntro && <IntroPage survey={survey} t={t} onStart={next} />}
          {current && (
            <QuestionPage
              q={current}
              qInfo={qInfo[current.id]}
              value={answers[current.id]}
              error={errors[current.id]}
              onChange={(value) => setAnswer(current.id, value)}
              onNext={next}
              onBack={back}
              isLast={idx === total}
              t={t}
            />
          )}
          {isDone && (
            <CompletePage
              t={t}
              answers={visibleAnswers}
              survey={survey}
              response={submittedResponse}
              saveTarget={responseSaveTarget}
              totalResponses={listSurveyResponses(survey.slug).length}
              onRestart={restart}
            />
          )}
        </div>
      </section>
      <BottomMeta saved={!saving} anonId={anonId} t={t} />
    </main>
  );
}

function usePath(): [string, (path: string) => void] {
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = (next: string) => {
    window.history.pushState(null, "", next);
    setPath(next);
  };

  return [path, navigate];
}

function useTheme(): [ThemeMode, (theme: ThemeMode) => void] {
  const [manual, setManual] = useState<ThemeMode | null>(() => {
    try {
      return localStorage.getItem("survey_theme") as ThemeMode | null;
    } catch {
      return null;
    }
  });
  const [systemDark, setSystemDark] = useState(() =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false,
  );

  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const setTheme = (next: ThemeMode) => {
    setManual(next);
    try {
      localStorage.setItem("survey_theme", next);
    } catch {
      // ignore storage errors
    }
  };

  return [manual ?? (systemDark ? "dark" : "light"), setTheme];
}
