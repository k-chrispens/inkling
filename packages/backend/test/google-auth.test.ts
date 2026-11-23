import assert from "node:assert/strict";
import test from "node:test";

import {
  isGoogleEmailAllowed,
  parseAllowedGoogleDomains,
  parseAllowedGoogleEmails,
  startGoogleAuthentication,
} from "../src/google-auth.ts";

test("Google sign-in fails closed when allowed-domain configuration is absent", async () => {
  const response = await startGoogleAuthentication(
    new Request("https://rfcs.example.com/api/auth/google/start"),
    {},
  );
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    code: "oauth_unavailable",
    message: "Google authentication is not configured.",
    retryable: false,
  });
});

test("Google sign-in domain allowlists are normalized and matched exactly", () => {
  const domains = parseAllowedGoogleDomains(
    " Example.COM, @writers.example.org,example.com,not a domain ",
  );

  assert.deepEqual(domains, ["example.com", "writers.example.org"]);
  assert.equal(isGoogleEmailAllowed("writer@example.com", domains), true);
  assert.equal(isGoogleEmailAllowed("WRITER@WRITERS.EXAMPLE.ORG", domains), true);
  assert.equal(isGoogleEmailAllowed("writer@notexample.com", domains), false);
  assert.equal(isGoogleEmailAllowed("writer@example.com.attacker.invalid", domains), false);
  assert.equal(isGoogleEmailAllowed("missing-domain", domains), false);
});

test("Google sign-in email allowlists admit single addresses outside the allowed domains", () => {
  const emails = parseAllowedGoogleEmails(" Writer@Gmail.com, writer@gmail.com,not-an-email ");

  assert.deepEqual(emails, ["writer@gmail.com"]);
  assert.equal(isGoogleEmailAllowed("WRITER@gmail.com", ["example.com"], emails), true);
  assert.equal(isGoogleEmailAllowed("other@gmail.com", ["example.com"], emails), false);
  assert.equal(isGoogleEmailAllowed("writer@example.com", ["example.com"], emails), true);
  assert.equal(isGoogleEmailAllowed("writer@gmail.com", [], emails), true);
});

async function requestedScope(directorySync?: string): Promise<string | null> {
  const response = await startGoogleAuthentication(new Request("https://inkling.example/"), {
    GOOGLE_ALLOWED_DOMAINS: "example.com",
    GOOGLE_CLIENT_ID: "client",
    GOOGLE_CLIENT_SECRET: "secret",
    GOOGLE_DIRECTORY_SYNC: directorySync,
  });
  return new URL(response.headers.get("Location") ?? "").searchParams.get("scope");
}

test("Google sign-in asks for the user directory unless directory sync is off", async () => {
  assert.match((await requestedScope()) ?? "", /admin\.directory\.user\.readonly/u);
  assert.equal(await requestedScope("false"), "openid email profile");
});
