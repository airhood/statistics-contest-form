import { SURVEY } from "../data/survey";
import type { AnswerValue, Question, QuestionInfo, Survey } from "./types";

export function getAnonId() {
  const key = "survey_anon_id";
  try {
    let value = localStorage.getItem(key);
    if (!value) {
      const hex = "0123456789abcdef";
      value = Array.from({ length: 8 }, () => hex[Math.floor(Math.random() * hex.length)]).join("");
      localStorage.setItem(key, value);
    }
    return value;
  } catch {
    return "demo0000";
  }
}

export function indexQuestions(survey: Survey = SURVEY) {
  const byId: Record<string, QuestionInfo> = {};
  survey.questions.forEach((question, index) => {
    byId[question.id] = {
      index,
      number: index + 1,
      label: `Q${String(index + 1).padStart(2, "0")}`,
      total: survey.questions.length,
    };
  });
  return byId;
}

export function isQuestionVisible(question: Question, answers: Record<string, AnswerValue>) {
  if (!question.showIf) return true;

  const value = answers[question.showIf.questionId];

  if (typeof question.showIf.exists === "boolean") {
    const exists =
      value != null &&
      value !== "" &&
      (!Array.isArray(value) || value.length > 0) &&
      (typeof value !== "object" || Array.isArray(value) || Object.keys(value).length > 0);
    if (exists !== question.showIf.exists) return false;
  }

  if (question.showIf.equals !== undefined && value !== question.showIf.equals) return false;
  if (question.showIf.notEquals !== undefined && value === question.showIf.notEquals) return false;
  if (question.showIf.includes !== undefined && (!Array.isArray(value) || !value.includes(question.showIf.includes))) return false;

  return true;
}

export function getVisibleQuestions(survey: Survey, answers: Record<string, AnswerValue>) {
  return survey.questions.filter((question) => isQuestionVisible(question, answers));
}

export function normalizeVisibleAnswers(survey: Survey, answers: Record<string, AnswerValue>) {
  const visibleIds = new Set(getVisibleQuestions(survey, answers).map((question) => question.id));
  return Object.fromEntries(Object.entries(answers).filter(([questionId]) => visibleIds.has(questionId)));
}

export function validate(question: Question, value: AnswerValue) {
  const empty =
    value == null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0);

  if (question.required && empty) {
    if (question.type === "multi") return "최소 1개 이상 선택해주세요.";
    if (question.type === "matrix") return "모든 항목에 응답해주세요.";
    if (question.type === "ranking") return "순위를 정해주세요.";
    return "이 문항은 필수입니다.";
  }

  if (
    question.type === "matrix" &&
    question.required &&
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    if (Object.keys(value).length < (question.rows?.length ?? 0)) {
      return "모든 항목에 응답해주세요.";
    }
  }

  if (
    question.type === "email" &&
    typeof value === "string" &&
    value &&
    !isEmail(value)
  ) {
    return "이메일 형식이 올바르지 않습니다.";
  }

  if (
    question.type === "contact" &&
    typeof value === "string" &&
    value &&
    !isEmail(value) &&
    !isPhone(value)
  ) {
    return "이메일 또는 전화번호 형식으로 입력해주세요.";
  }

  return null;
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isPhone(value: string) {
  const compact = value.replace(/[^\d+]/g, "");
  return /^(?:\+82|0)?1[016789]\d{7,8}$/.test(compact) || /^\+?\d{8,15}$/.test(compact);
}
