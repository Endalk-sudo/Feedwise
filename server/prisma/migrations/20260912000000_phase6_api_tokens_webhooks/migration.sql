-- Phase 6 (D4 + V3/F7): public API tokens (hash-stored) + outbound webhooks.
CREATE TABLE IF NOT EXISTS "ApiToken" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL DEFAULT 'integration',
  "tokenHash" TEXT NOT NULL UNIQUE,
  "tokenPrefix" TEXT NOT NULL,
  "scopes" TEXT[] NOT NULL DEFAULT ARRAY['feedback:read','analytics:read']::TEXT[],
  "expiresAt" TIMESTAMP(3),
  "lastUsedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "ApiToken_organizationId_idx" ON "ApiToken"("organizationId");

CREATE TABLE IF NOT EXISTS "Webhook" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "url" TEXT NOT NULL,
  "secret" TEXT NOT NULL,
  "events" TEXT[] NOT NULL DEFAULT ARRAY['feedback.high_urgency']::TEXT[],
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Webhook_organizationId_idx" ON "Webhook"("organizationId");

CREATE TABLE IF NOT EXISTS "WebhookLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "webhookId" TEXT REFERENCES "Webhook"("id") ON DELETE SET NULL,
  "event" TEXT NOT NULL,
  "status" INTEGER NOT NULL DEFAULT 0,
  "attempts" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "WebhookLog_organizationId_createdAt_idx" ON "WebhookLog"("organizationId", "createdAt");
