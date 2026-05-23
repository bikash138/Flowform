import type { QuestionType } from "@flowform/database";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

const QUESTION_PREFIX: Record<QuestionType, string> = {
  text: "T",
  email: "E",
  number: "N",
  select: "S",
  radio: "R",
  checkbox: "C",
  rating: "G",
  date: "D",
};

function genId(prefix: string): string {
  let suffix = "";
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  for (const b of bytes) suffix += ALPHABET[b % ALPHABET.length];
  return prefix + suffix;
}

export function genQuestionId(type: QuestionType): string {
  return genId(QUESTION_PREFIX[type]);
}

export function genPageId(): string {
  return genId("P");
}
