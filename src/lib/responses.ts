import { collection, deleteDoc, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import { db } from "./firebase";
import { loadSurveyDefinition } from "./surveyDefinition";
import type { AnswerValue, ResponseSaveTarget, Survey, SurveyResponse } from "./types";

const RESPONSE_PREFIX = "survey_responses";
const RESPONSE_COLLECTION = "survey_responses";
const RESPONSE_LOG_COLLECTION = "survey_response_logs";

export function createSurveyResponse({
  anonId,
  startedAt,
  answers,
  survey = loadSurveyDefinition(),
}: {
  anonId: string;
  startedAt: string;
  answers: Record<string, AnswerValue>;
  survey?: Survey;
}): SurveyResponse {
  return {
    id: makeResponseId(),
    surveySlug: survey.slug,
    anonId,
    startedAt,
    submittedAt: new Date().toISOString(),
    answers,
    userAgent: typeof navigator === "undefined" ? undefined : navigator.userAgent,
    schemaVersion: 1,
  };
}

export async function saveSurveyResponse(response: SurveyResponse): Promise<ResponseSaveTarget> {
  saveLocalSurveyResponse(response);
  return saveRemoteSurveyResponse(response);
}

export async function syncLocalResponses(surveySlug = loadSurveyDefinition().slug) {
  const local = listSurveyResponses(surveySlug);
  let synced = 0;
  let recovered = 0;

  for (const response of local) {
    const target = await saveRemoteSurveyResponse(response);
    if (target === "firebase") synced += 1;
    if (target === "recovery") recovered += 1;
  }

  return {
    attempted: local.length,
    synced,
    recovered,
    failed: local.length - synced - recovered,
  };
}

export async function deleteSurveyResponse(responseId: string, surveySlug = loadSurveyDefinition().slug) {
  const local = listSurveyResponses(surveySlug);
  localStorage.setItem(responseKey(surveySlug), JSON.stringify(local.filter((response) => response.id !== responseId)));

  if (!db) return { remoteDeleted: false };

  try {
    await deleteDoc(doc(db, RESPONSE_COLLECTION, responseId));
    return { remoteDeleted: true };
  } catch (error) {
    console.error("Failed to delete survey response from Firebase", error);
    return { remoteDeleted: false };
  }
}

export async function clearSurveyResponses(surveySlug = loadSurveyDefinition().slug) {
  const localDeleted = listSurveyResponses(surveySlug).length;
  localStorage.removeItem(responseKey(surveySlug));

  if (!db) {
    return { localDeleted, remoteDeleted: 0, remoteFailed: 0 };
  }

  try {
    const snapshot = await getDocs(query(collection(db, RESPONSE_COLLECTION), where("surveySlug", "==", surveySlug)));
    let remoteDeleted = 0;
    let remoteFailed = 0;

    for (const item of snapshot.docs) {
      try {
        await deleteDoc(item.ref);
        remoteDeleted += 1;
      } catch (error) {
        console.error("Failed to delete survey response from Firebase", error);
        remoteFailed += 1;
      }
    }

    return { localDeleted, remoteDeleted, remoteFailed };
  } catch (error) {
    console.error("Failed to load survey responses for clearing", error);
    return { localDeleted, remoteDeleted: 0, remoteFailed: 1 };
  }
}

export function listSurveyResponses(surveySlug = loadSurveyDefinition().slug): SurveyResponse[] {
  try {
    const raw = localStorage.getItem(responseKey(surveySlug));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function loadSurveyResponses(surveySlug = loadSurveyDefinition().slug): Promise<SurveyResponse[]> {
  const local = listSurveyResponses(surveySlug);
  if (!db) return local;

  try {
    const snapshot = await getDocs(query(collection(db, RESPONSE_COLLECTION), where("surveySlug", "==", surveySlug)));
    const remote = snapshot.docs.map((item) => item.data() as SurveyResponse);
    const merged = mergeResponses(remote, local);
    localStorage.setItem(responseKey(surveySlug), JSON.stringify(merged));
    return merged;
  } catch (error) {
    console.error("Failed to load survey responses from Firebase", error);
    return local;
  }
}

export function countAnswered(answers: Record<string, AnswerValue>, survey: Survey = loadSurveyDefinition()) {
  return survey.questions.filter((q) => {
    const value = answers[q.id];
    if (value == null || value === "") return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return Object.keys(value).length > 0;
    return true;
  }).length;
}

export function summarizeResponses(responses: SurveyResponse[], survey: Survey = loadSurveyDefinition()) {
  const totalQuestions = survey.questions.length;
  const answeredCounts = responses.map((response) => countAnswered(response.answers, survey));
  const averageAnswered =
    answeredCounts.length === 0
      ? 0
      : answeredCounts.reduce((sum, count) => sum + count, 0) / answeredCounts.length;

  return {
    totalResponses: responses.length,
    totalQuestions,
    averageAnswered,
    requiredQuestions: survey.questions.filter((q) => q.required).length,
    optionalQuestions: survey.questions.filter((q) => !q.required).length,
  };
}

function makeResponseId() {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(16).slice(2, 10);
  return `resp_${Date.now().toString(36)}_${random}`;
}

function responseKey(surveySlug: string) {
  return `${RESPONSE_PREFIX}:${surveySlug}`;
}

function saveLocalSurveyResponse(response: SurveyResponse) {
  try {
    const responses = listSurveyResponses(response.surveySlug);
    const next = [response, ...responses.filter((item) => item.id !== response.id)];
    localStorage.setItem(responseKey(response.surveySlug), JSON.stringify(next));
  } catch (error) {
    console.error("Failed to save survey response to localStorage", error, response);
  }
}

function mergeResponses(primary: SurveyResponse[], secondary: SurveyResponse[]) {
  const byId = new Map<string, SurveyResponse>();
  for (const response of [...primary, ...secondary]) byId.set(response.id, response);
  return Array.from(byId.values()).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

async function saveRemoteSurveyResponse(response: SurveyResponse): Promise<ResponseSaveTarget> {
  if (!db) return "local";

  try {
    await setDoc(doc(db, RESPONSE_COLLECTION, response.id), response);
    return "firebase";
  } catch (error) {
    console.error("Failed to save survey response to Firebase", error);
    const savedRecoveryLog = await saveRemoteResponseLog(response, error);
    return savedRecoveryLog ? "recovery" : "local";
  }
}

async function saveRemoteResponseLog(response: SurveyResponse, error: unknown) {
  if (!db) return false;

  try {
    await setDoc(doc(db, RESPONSE_LOG_COLLECTION, `log_${response.id}`), {
      id: `log_${response.id}`,
      responseId: response.id,
      surveySlug: response.surveySlug,
      anonId: response.anonId,
      submittedAt: response.submittedAt,
      createdAt: new Date().toISOString(),
      payloadJson: JSON.stringify(response),
      errorMessage: error instanceof Error ? error.message : String(error),
      userAgent: response.userAgent ?? "",
      schemaVersion: 1,
    });
    return true;
  } catch (logError) {
    console.error("Failed to save survey response recovery log", logError, response);
    return false;
  }
}
