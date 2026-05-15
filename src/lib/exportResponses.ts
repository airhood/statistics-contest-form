import type { Survey, SurveyResponse } from "./types";

export function responsesToJson(responses: SurveyResponse[], survey?: Survey) {
  if (!survey) return JSON.stringify(responses, null, 2);

  return JSON.stringify(
    responses.map((response) => ({
      ...response,
      answers: Object.fromEntries(survey.questions.map((question) => [question.id, response.answers[question.id] ?? ""])),
    })),
    null,
    2,
  );
}

export function responsesToCsv(survey: Survey, responses: SurveyResponse[]) {
  const headers = [
    "response_id",
    "survey_slug",
    "anon_id",
    "started_at",
    "submitted_at",
    ...survey.questions.map((question) => question.id),
  ];
  const rows = responses.map((response) => [
    response.id,
    response.surveySlug,
    response.anonId,
    response.startedAt,
    response.submittedAt,
    ...survey.questions.map((question) => formatCell(response.answers[question.id])),
  ]);
  return [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
}

export function downloadText(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function formatCell(value: unknown) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return JSON.stringify(value);
}

function escapeCsv(value: string) {
  if (!/[",\n\r]/.test(value)) return value;
  return `"${value.replaceAll('"', '""')}"`;
}
