export const FEATURE_CATALOG = [
  { key: "season_genius", label: "Season Genius", icon: "🌤️" },
  { key: "fatigue_meter", label: "Fatigue Meter", icon: "🧠" },
  { key: "weather_auto_swap", label: "Weather Auto-Swap", icon: "🌧️" },
  { key: "risk_radar", label: "Risk Radar", icon: "🛡️" },
  { key: "budget_dampener", label: "Budget Dampener", icon: "💰" },
  { key: "route_timing", label: "Route Timing", icon: "🗺️" },
  { key: "sleep_optimizer", label: "Sleep Optimizer", icon: "😴" },
  { key: "family_mode", label: "Family Mode", icon: "👨‍👩‍👧" },
  { key: "elder_mode", label: "Elder Mode", icon: "🧓" },
  { key: "crowd_predictor", label: "Crowd Predictor", icon: "👥" },
  { key: "shopping_heatmap", label: "Shopping Heatmap", icon: "🛍️" },
  { key: "culture_advisor", label: "Cultural Advisor", icon: "🏛️" },
  { key: "safetrip", label: "SafeTrip", icon: "🚨" },
  { key: "transport_genius", label: "Transport Genius", icon: "🚇" },
  { key: "story_mode", label: "Story Mode", icon: "🎬" },
  { key: "freshness_score", label: "Freshness Score", icon: "⏱️" },
  { key: "night_optimizer", label: "Night Optimizer", icon: "🌙" },
  { key: "meal_balancer", label: "Meal Balancer", icon: "🍽️" },
  { key: "budget_meter", label: "Budget Meter", icon: "📊" },
  { key: "weather_awareness", label: "Weather Awareness", icon: "☁️" },
] as const;

export const FEATURE_KEYS = FEATURE_CATALOG.map((f) => f.key);