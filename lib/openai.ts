import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("La variabile OPENAI_API_KEY non è configurata");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-5-mini";
