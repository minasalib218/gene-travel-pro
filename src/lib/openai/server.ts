import OpenAI from "openai";

export const openai = new OpenAI({
  // Keep module evaluation build-safe for environments that intentionally do
  // not receive production secrets. Requests still fail closed at OpenAI when
  // no real server-side key is configured.
  apiKey: process.env.OPENAI_API_KEY || "missing-openai-api-key",
});
