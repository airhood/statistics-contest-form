import { doc, getDoc, setDoc } from "firebase/firestore";
import { SURVEY } from "../data/survey";
import { db } from "./firebase";
import type { ResponseSaveTarget, Survey } from "./types";

const SURVEY_DEFINITION_KEY = "survey_definition";
const SURVEY_DEFINITION_COLLECTION = "survey_definitions";
export const SURVEY_DEFINITION_EVENT = "survey-definition-updated";

export function loadSurveyDefinition(): Survey {
  try {
    const raw = localStorage.getItem(SURVEY_DEFINITION_KEY);
    if (!raw) return SURVEY;
    return validateSurveyDefinition(JSON.parse(raw));
  } catch {
    return SURVEY;
  }
}

export async function loadRemoteSurveyDefinition(slug = loadSurveyDefinition().slug): Promise<Survey> {
  const local = loadSurveyDefinition();
  if (!db) return local;

  try {
    const snapshot = await getDoc(doc(db, SURVEY_DEFINITION_COLLECTION, slug));
    if (!snapshot.exists()) return local;
    const data = snapshot.data();
    if (!data.isActive || !data.definition) return local;
    return saveSurveyDefinition(validateSurveyDefinition(data.definition), { syncRemote: false });
  } catch {
    return local;
  }
}

export function saveSurveyDefinition(survey: Survey, options: { syncRemote?: boolean } = {}) {
  const valid = validateSurveyDefinition(survey);
  localStorage.setItem(SURVEY_DEFINITION_KEY, JSON.stringify(valid));
  window.dispatchEvent(new CustomEvent(SURVEY_DEFINITION_EVENT, { detail: valid }));
  if (options.syncRemote !== false) void saveRemoteSurveyDefinition(valid);
  return valid;
}

export async function saveSurveyDefinitionWithStatus(survey: Survey): Promise<{
  survey: Survey;
  target: ResponseSaveTarget;
}> {
  const valid = validateSurveyDefinition(survey);
  localStorage.setItem(SURVEY_DEFINITION_KEY, JSON.stringify(valid));
  window.dispatchEvent(new CustomEvent(SURVEY_DEFINITION_EVENT, { detail: valid }));
  const savedRemote = await saveRemoteSurveyDefinition(valid);
  return { survey: valid, target: savedRemote ? "firebase" : "local" };
}

export function resetSurveyDefinition() {
  localStorage.removeItem(SURVEY_DEFINITION_KEY);
  window.dispatchEvent(new CustomEvent(SURVEY_DEFINITION_EVENT, { detail: SURVEY }));
  return SURVEY;
}

export function validateSurveyDefinition(value: unknown): Survey {
  if (!value || typeof value !== "object") throw new Error("설문 JSON은 객체여야 합니다.");
  const raw = value as Survey & { meta?: unknown; sections?: unknown };
  const survey: Survey = {
    slug: raw.slug,
    title: raw.title,
    subtitle: raw.subtitle,
    description: raw.description,
    questions: Array.isArray(raw.questions)
      ? raw.questions.map((question) => {
          const { section: _section, ...rest } = question as Survey["questions"][number] & { section?: unknown };
          return rest;
        })
      : raw.questions,
  };
  if (!survey.slug || typeof survey.slug !== "string") throw new Error("slug가 필요합니다.");
  if (!survey.title || typeof survey.title !== "string") throw new Error("title이 필요합니다.");
  if (!survey.subtitle || typeof survey.subtitle !== "string") throw new Error("subtitle이 필요합니다.");
  if (!survey.description || typeof survey.description !== "string") throw new Error("description이 필요합니다.");
  if (!Array.isArray(survey.questions) || survey.questions.length === 0) throw new Error("questions 배열이 필요합니다.");

  const questionIds = new Set(survey.questions.map((question) => question.id));
  for (const question of survey.questions) {
    if (!question.id || !question.title || !question.type) throw new Error("모든 문항에는 id, title, type이 필요합니다.");
    if (question.showIf && typeof question.showIf.questionId !== "string") {
      throw new Error(`${question.id}의 showIf.questionId가 필요합니다.`);
    }
    if (question.showIf && !questionIds.has(question.showIf.questionId)) {
      throw new Error(`${question.id}의 showIf가 존재하지 않는 문항을 참조합니다.`);
    }
    if ((question.type === "single" || question.type === "multi" || question.type === "dropdown" || question.type === "ranking") && !Array.isArray(question.options)) {
      throw new Error(`${question.id}에는 options 배열이 필요합니다.`);
    }
    if (question.type === "matrix" && (!Array.isArray(question.rows) || !Array.isArray(question.cols))) {
      throw new Error(`${question.id}에는 rows와 cols 배열이 필요합니다.`);
    }
  }

  return survey;
}

async function saveRemoteSurveyDefinition(survey: Survey) {
  if (!db) return false;

  try {
    await setDoc(doc(db, SURVEY_DEFINITION_COLLECTION, survey.slug), {
      slug: survey.slug,
      title: survey.title,
      definition: survey,
      isActive: true,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error("Failed to save survey definition to Firebase", error);
    return false;
  }
}
