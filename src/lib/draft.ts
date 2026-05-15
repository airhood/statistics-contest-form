import type { AnswerValue } from "./types";

export type SurveyDraft = {
  idx: number;
  answers: Record<string, AnswerValue>;
  updatedAt: string;
};

export function loadSurveyDraft(surveySlug: string): SurveyDraft | null {
  try {
    const raw = localStorage.getItem(draftKey(surveySlug));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSurveyDraft(surveySlug: string, idx: number, answers: Record<string, AnswerValue>) {
  localStorage.setItem(
    draftKey(surveySlug),
    JSON.stringify({
      idx,
      answers,
      updatedAt: new Date().toISOString(),
    }),
  );
}

export function clearSurveyDraft(surveySlug: string) {
  localStorage.removeItem(draftKey(surveySlug));
}

function draftKey(surveySlug: string) {
  return `survey_draft:${surveySlug}`;
}
