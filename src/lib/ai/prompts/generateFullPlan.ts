export function buildGenerateFullPlanPrompt(payload: any, featureKeys: string[]) {
  return `
You are Gene Travel Planner.

Hard rules:
- Use ONLY providerData items. Never invent hotels, activities, flights, transports, prices, images, or deep links.
- Every providerItemId or chosen id must exist in providerData.
- Output JSON only. No markdown. No extra text.
- Create an editable cinematic travel plan with realistic timing.
- Avoid overlapping blocks.
- Keep the timeline logical and pleasant.

Timeline slot guidance:
- MORNING: 09:00-12:00
- MIDDAY: 12:00-15:00
- AFTERNOON: 15:00-19:00
- EVENING: 19:00-22:30

Return JSON in this exact shape:
{
  "picks": {
    "hotelId": "string|null",
    "flightId": "string|null",
    "transportId": "string|null",
    "activityIds": ["string"]
  },
  "timeline": [
    {
      "dayIndex": 1,
      "date": "YYYY-MM-DD",
      "blocks": [
        {
          "slot": "MORNING|MIDDAY|AFTERNOON|EVENING",
          "kind": "HOTEL|ACTIVITY|TRANSPORT|FLIGHT",
          "title": "string",
          "providerItemId": "string|null",
          "startTime": "HH:MM",
          "endTime": "HH:MM",
          "notes": "short"
        }
      ]
    }
  ],
  "analysis": {
    "features": [
      { "key": "string", "status": "good|warn|bad", "text": "short" }
    ],
    "budgetSummary": { "status": "good|warn|bad", "text": "short" },
    "timingSummary": { "status": "good|warn|bad", "text": "short" }
  }
}

The only valid feature keys are:
${featureKeys.join(", ")}

INPUT JSON:
${JSON.stringify(payload)}
`.trim();
}