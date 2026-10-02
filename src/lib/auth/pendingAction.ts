"use client";

export const PENDING_ACTION_KEY = "gene.pendingAction";
const PENDING_ACTION_MAX_AGE_MS = 30 * 60 * 1000;

type PendingAction = {
  type?: string;
  readyPlanId?: string;
  endpoint?: string;
  method?: string;
  payload?: unknown;
  returnTo?: string;
  createdAt?: number;
};

export function safeInternalPath(path: unknown, fallback = "/profile") {
  return typeof path === "string" && path.startsWith("/") && !path.startsWith("//") && !path.includes("\\")
    ? path
    : fallback;
}

function readPendingAction(): PendingAction | null {
  try {
    const raw = window.localStorage.getItem(PENDING_ACTION_KEY);
    if (!raw) return null;
    const action = JSON.parse(raw) as PendingAction;
    if (!action.createdAt || Date.now() - action.createdAt > PENDING_ACTION_MAX_AGE_MS) {
      window.localStorage.removeItem(PENDING_ACTION_KEY);
      return null;
    }
    return action;
  } catch {
    window.localStorage.removeItem(PENDING_ACTION_KEY);
    return null;
  }
}

export async function completePendingAction(defaultReturnPath: string) {
  const fallback = safeInternalPath(defaultReturnPath);
  const action = readPendingAction();
  if (!action) return fallback;

  const returnTo = safeInternalPath(action.returnTo, fallback);
  const isReadyPlan = action.type === "favorite_ready_plan" && Boolean(action.readyPlanId);
  const isHomeFavorite =
    action.type === "home_favorite" &&
    ["/api/profile/wishlist", "/api/profile/destinations"].includes(action.endpoint || "");

  if (!isReadyPlan && !isHomeFavorite) {
    window.localStorage.removeItem(PENDING_ACTION_KEY);
    return returnTo;
  }

  const endpoint = isReadyPlan ? "/api/profile/favorites" : String(action.endpoint);
  const payload = isReadyPlan ? { readyPlanId: action.readyPlanId } : action.payload ?? {};

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (response.ok || [400, 404, 409, 503].includes(response.status)) {
      window.localStorage.removeItem(PENDING_ACTION_KEY);
    }
  } catch {
    // Keep the short-lived intent so the customer can retry after a network interruption.
  }

  return returnTo;
}
