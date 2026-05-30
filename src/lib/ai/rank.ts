import { openai } from "./openai";

export async function rankHotels({
  userInput,
  hotels,
}: {
  userInput: any;
  hotels: any[];
}) {
  const prompt = `
User preferences:
${JSON.stringify(userInput, null, 2)}

Hotels (real data):
${JSON.stringify(hotels, null, 2)}

Rank the hotels from best to worst.
Return JSON only:
[
 { "id": "...", "score": 0-100, "reason": "..." }
]
`;

  const res = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  return JSON.parse(res.choices[0].message.content!);
}
