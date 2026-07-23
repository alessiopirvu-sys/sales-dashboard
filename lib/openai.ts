import OpenAI from "openai";

export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-5-mini";

export function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("La variabile OPENAI_API_KEY non è configurata");
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}
