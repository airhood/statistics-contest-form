export type ThemeMode = "light" | "dark";

export type AnswerValue = string | string[] | number | Record<string, number> | undefined;

export type VisibilityRule = {
  questionId: string;
  equals?: string | number;
  notEquals?: string | number;
  includes?: string;
  exists?: boolean;
};

export type QuestionType =
  | "short"
  | "long"
  | "email"
  | "contact"
  | "number"
  | "date"
  | "time"
  | "single"
  | "multi"
  | "scale"
  | "matrix"
  | "slider"
  | "dropdown"
  | "ranking";

export type Media =
  | { kind: "image"; src?: string; label?: string; alt?: string; ratio?: string }
  | { kind: "imagePair"; items: { src?: string; label: string; alt?: string }[]; ratio?: string }
  | { kind: "audio"; src?: string; label?: string; duration?: string }
  | { kind: "video"; src?: string; label?: string; poster?: string; ratio?: string }
  | { kind: "text"; body: string };

export type Question = {
  id: string;
  type: QuestionType;
  title: string;
  body?: string;
  hint?: string;
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
  options?: string[];
  items?: { id?: string; label: string; body?: string }[];
  scale?: number;
  labels?: string[];
  cols?: string[];
  rows?: { id: string; text: string }[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  media?: Media;
  showIf?: VisibilityRule;
};

export type Survey = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  questions: Question[];
};

export type QuestionInfo = {
  index: number;
  number: number;
  label: string;
  total: number;
};

export type SurveyResponse = {
  id: string;
  surveySlug: string;
  anonId: string;
  startedAt: string;
  submittedAt: string;
  answers: Record<string, AnswerValue>;
  userAgent?: string;
  schemaVersion: number;
};

export type ResponseSaveTarget = "pending" | "firebase" | "recovery" | "local";
