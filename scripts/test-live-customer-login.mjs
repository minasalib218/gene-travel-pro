const email = String(process.argv[2] || "").trim().toLowerCase();
const password = String(process.argv[3] || "");

if (!email || !password) {
  throw new Error("Usage: node scripts/test-live-customer-login.mjs customer@example.com password");
}

const response = await fetch("https://genefortravelers.com/api/auth/session", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});

const body = await response.json().catch(() => ({}));
console.log(
  JSON.stringify(
    {
      ok: response.ok && body?.ok === true,
      status: response.status,
      setCookie: response.headers.has("set-cookie"),
      error: body?.error || null,
    },
    null,
    2,
  ),
);

if (!response.ok || body?.ok !== true) {
  process.exitCode = 1;
}
