import assert from "node:assert/strict";
import fs from "node:fs";

const component = fs.readFileSync("src/components/marketing/NewVisitorSignupModal.tsx", "utf8");
const layout = fs.readFileSync("src/app/layout.tsx", "utf8");

assert.match(component, /gene_signup_popup_seen/);
assert.match(component, /7 \* 24 \* 60 \* 60 \* 1000/);
assert.match(component, /OPEN_DELAY_MS = 2400/);
assert.match(component, /auth\.getSession\(\)/);
assert.match(component, /role="dialog"/);
assert.match(component, /aria-modal="true"/);
assert.match(component, /event\.key === "Escape"/);
assert.match(component, /document\.body\.style\.overflow = "hidden"/);
assert.match(component, /\/signup\?next=/);
assert.match(component, /\/signin\?next=/);
assert.match(component, /signup_popup_viewed/);
assert.match(layout, /<NewVisitorSignupModal \/>/);

console.log("new visitor popup guardrails passed");
