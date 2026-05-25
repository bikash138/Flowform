# Flowform API

The API server for Flowform — a form builder SaaS. Built on **Express.js** with **tRPC** for type-safe RPC, **Drizzle ORM** over PostgreSQL, and **Redis** for caching and rate limiting. The server also exposes a REST-compatible OpenAPI surface via `trpc-to-openapi`.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Bootstrap & Startup](#bootstrap--startup)
- [Middleware Stack](#middleware-stack)
- [Request Routing](#request-routing)
- [Authorization Layers](#authorization-layers)
- [Service Layer](#service-layer)
- [Caching Strategy](#caching-strategy)
- [Form Lifecycle](#form-lifecycle)
- [Public Form & Submission Pipeline](#public-form--submission-pipeline)
- [Workspace & Invite Flow](#workspace--invite-flow)
- [Billing & Plan Gating](#billing--plan-gating)
- [Analytics](#analytics)
- [Email System](#email-system)
- [S3 Logo Upload](#s3-logo-upload)
- [Error Handling](#error-handling)
- [Environment Variables](#environment-variables)
- [Key Design Decisions](#key-design-decisions)

---

## Architecture Overview

```
HTTP Request
     │
     ▼
Express Server (apps/api)
     │
     ├─ CORS + Trust Proxy
     ├─ Request ID injection
     ├─ Pino HTTP logging
     ├─ Rate limiting (Redis-backed)
     ├─ Better Auth session middleware
     │
     ▼
Route Handler
     ├─ /trpc/*  → tRPC Express adapter
     ├─ /api/*   → OpenAPI REST adapter (same tRPC router)
     ├─ /docs    → Scalar interactive docs
     └─ /health  → liveness check
          │
          ▼
     tRPC Router (packages/trpc)
          │
          ├─ publicProcedure     (no auth)
          ├─ protectedProcedure  (session required)
          ├─ workspaceProcedure  (session + membership)
          ├─ permissionProcedure (session + membership + RBAC)
          └─ featureProcedure    (session + membership + plan)
               │
               ▼
          Service Layer (packages/service)
               │
               ▼
          Drizzle ORM → PostgreSQL
          Redis (cache, rate limit, counters)
```

The monorepo has three layers that never bleed into each other:

| Layer | Package | Responsibility |
|---|---|---|
| Transport | `apps/api` + `packages/trpc` | HTTP, auth, routing, authorization |
| Domain | `packages/service` | Business rules, validation, side effects |
| Storage | `packages/database` | Schema definitions, typed query results |

---

## Bootstrap & Startup

On `npm start` the server runs this sequence before accepting any connections:

```
1. Connect PostgreSQL (Drizzle)
2. Connect Redis
3. Health-assert both (exit(1) on failure)
4. Seed plan catalog (idempotent upsert of FREE/PRO/PRO_MAX)
5. Start HTTP server
```

The `ServerBuilder` class wires middleware in a fixed, explicit order:

```ts
new ServerBuilder()
  .setupCoreMiddlewares()   // CORS, trust-proxy, request-id, pino
  .setupRateLimiting()      // global + auth-route limiters
  .setupAuth()              // Better Auth session handler
  .setupParsers()           // JSON body parser
  .setupHealth()            // GET /health
  .setupOpenApi()           // /openapi.json + /docs
  .setupRoutes()            // /trpc, /api
  .setupFallbackHandlers()  // 404 + error boundary
  .build()
```

**Graceful shutdown** listens to `SIGINT`/`SIGTERM`, closes the server, disconnects Redis and DB, and force-exits after 10 seconds if it takes too long.

---

## Middleware Stack

### CORS
Origin is locked to `env.http.frontendUrl`. Credentials are enabled so session cookies are forwarded.

### Request ID
Every inbound request gets a unique ID (`base64url(8 random bytes)`), injected as `X-Request-Id`. All structured log lines carry this ID for distributed tracing.

### Pino HTTP Logging
Custom log-level mapping: `error` for 5xx, `warn` for 4xx, `info` for everything else. The `/trpc` path is silenced at the transport level — only application-level logs from the service layer surface there.

### Rate Limiting
Redis-backed via `rate-limit-redis`. Two tiers:

| Limiter | Window | Limit | Applied to |
|---|---|---|---|
| Global | 15 min | 500 req/IP | All routes |
| Auth | 15 min | 20 000 req/IP | `/api/auth/*` |

Responses return RFC Draft-8 `RateLimit-*` headers. Rejections are `429` JSON `{ success: false, message }`.

---

## Request Routing

| Path | Handler | Auth |
|---|---|---|
| `GET /health` | Inline | None |
| `GET /openapi.json` | Auto-generated from tRPC routes | None |
| `GET /docs` | Scalar API Reference | None |
| `/trpc/*` | tRPC Express middleware | Via tRPC context |
| `/api/*` | OpenAPI→tRPC bridge | Via tRPC context |

The same router handles both `/trpc` and `/api` — the REST surface is derived automatically from `openapi` meta attached to each procedure.

---

## Authorization Layers

Every tRPC procedure sits on exactly one of four bases. Each base extends the one above it:

### 1. `publicProcedure`
No authentication required. Used for public form fetching, submission, plan catalog, and invite token preview.

### 2. `protectedProcedure`
Requires an active session (`ctx.userId !== null`). Throws `UNAUTHORIZED` otherwise.

### 3. `workspaceProcedure`
Extends `protectedProcedure`. Expects `{ workspaceId }` in the input. On every request it:

1. Fetches the caller's workspace membership (from Redis cache, falling back to DB)
2. Fetches the workspace plan
3. Rejects with `FORBIDDEN` if the caller is not a member
4. Injects `ctx.role`, `ctx.workspaceId`, `ctx.workspacePlan` for downstream use

### 4. `permissionProcedure(permission)`
Extends `workspaceProcedure`. Checks `hasPermission(ctx.role, permission)` using the RBAC matrix. Throws `FORBIDDEN` on denial.

### 5. `featureProcedure(feature)`
Extends `workspaceProcedure`. Checks `hasFeatureAccess(ctx.workspacePlan, feature)`. Throws `FORBIDDEN` if the workspace's current plan does not include the feature. Used for analytics and advanced settings.

### RBAC Permission Matrix

```
VIEWER   → form:view, member:view
EDITOR   → form:view, form:create, form:edit, member:view
ADMIN    → (EDITOR) + form:delete, form:publish, member:invite, member:remove, member:update-role
OWNER    → (ADMIN) + workspace:update, workspace:delete, billing:purchase
```

---

## Service Layer

Services live in `packages/service` and contain all domain logic. They are never imported by `apps/api` directly — the tRPC routes import from `packages/trpc/server/services`, which instantiates singletons.

### Repositories
Every service has a companion repository that owns all DB queries. Services call repositories and never write raw SQL. This keeps business rules out of query code and makes repositories independently testable.

### Anonymous Session Context
The tRPC context resolves an `anonId` from the `anon_session` cookie on every request (authenticated or not). If the cookie is absent it is created as a UUID and set as an `HttpOnly`, `SameSite=Lax` cookie with a 30-day max-age. This ID is used for view deduplication and bot detection on public forms.

---

## Caching Strategy

Redis is used as a cache-aside store. The pattern is consistent across all services:

```ts
return cache.getOrSet(key, () => db.fetchExpensive(), TTL)
```

| Cache Key | TTL | Invalidated when |
|---|---|---|
| `membership:{workspaceId}:{userId}` | Short | Role updated or member removed |
| `billing:workspace-plan:{workspaceId}` | 15 min | Plan activated, form/member count changes, workspace deleted |
| `billing:response-limit-usage:{workspaceId}:{YYYY-MM}` | Month-end | Counter incremented (written through) |
| `analytics:question-stats:{formId}:{version}` | 1 hour | Form published |
| `public:snapshot:{formId}:{version}` | Long | Form published or patch-published |

**Response counters** use `INCR` directly on Redis keys for atomic, lock-free increments. On the first increment after a Redis restart (count equals 1), the service resyncs the current value from the DB to avoid losing data.

---

## Form Lifecycle

```
create  →  draft (sync loop)  →  publish  →  archive
                                    ↓
                              patch-publish (update snapshot in-place)
```

### Sync (Draft Editing)
The client sends the full draft content plus the current `editVersion`. The repository uses an optimistic concurrency query:

```sql
UPDATE form SET draft_content = $1, edit_version = edit_version + 1
WHERE id = $2 AND edit_version = $3
```

If zero rows are updated, the service returns a `CONFLICT` error and the client must re-fetch before retrying.

### Publish
Publish is an atomic transaction:

1. Insert a `formPublishSnapshot` row (immutable; keyed by `formId + publishVersion`)
2. Update the form: `status = PUBLISHED`, `publishVersion++`, `hasDraft = false`
3. On the first publish: set `closeAt = now + settings.closeAtDays`
4. Evict the snapshot cache

Snapshots are never mutated after creation **except** via patch-publish, which updates the snapshot row matching the current `publishVersion` in the same transaction that updates the form.

### Duplication
Clones the full draft with new UUIDs for every page, question, and logic rule. IDs inside logic conditions are remapped to the new IDs. The clone starts as a fresh `DRAFT` with its own version counters.

### Settings & Feature Gating
`updateFormSettings` enforces per-plan access by filtering the incoming patch to only the keys allowed by the plan before writing:

- **FREE**: `accessType`, `collectEmail`, `progressBar`
- **PRO**: + `closeAtDays` (only before publish), `languages`, `defaultLanguage`, `navbar`, `redirectOnComplete`
- **PRO_MAX**: + `removeWatermark`, `confirmationEmail`

### Theme Tiers
Themes carry a tier tag (`FREE`, `PRO`, `PRO_MAX`). The service rejects a theme update if the workspace plan tier rank is lower than the theme's required rank.

---

## Public Form & Submission Pipeline

The public surface is unauthenticated. Response submission runs through nine sequential checks before writing to the DB:

```
1. Rate limit check      — per IP per form per action
2. Honeypot check        — silent discard if _hp field is populated
3. Parallel fetch        — session, form, snapshot, submission count
4. Session validation    — session must reference this form; prevents double-submit
5. Form guard            — must be PUBLISHED, not closed, not over response limit
6. Bot detection         — form completion time must be ≥ 800ms/question and ≤ 60s/question
7. Answer validation     — validated against the published snapshot schema; required fields enforced
8. Email check           — required if collectEmail is enabled
9. Atomic finalization   — WHERE submittedAt IS NULL prevents race conditions
```

**Deduplication**: Each `(formId, anonId)` pair is cached. A repeat view from the same anonymous session is counted once and does not re-track. This keeps analytics clean without requiring a login.

**Geo lookup** happens asynchronously after the response is written — it never blocks the submission response. Country, continent, and city are stored for analytics.

**Access codes** are bcrypt-hashed at rest. The public form endpoint checks the hash before returning form content if `accessType === "password_protected"`.

---

## Workspace & Invite Flow

### Workspace Deletion
Deletion is a soft delete — the workspace row is flagged `isDeleted = true` and all `workspace_member` rows are hard-deleted in the same transaction. Personal workspaces cannot be deleted. After deletion, the billing plan cache for the workspace is evicted.

### Invite Flow

```
Owner/Admin sends invite
      │
      ├─ Rate limit: 20 invites/hour per workspace
      ├─ Reject if workspace is personal
      ├─ Reject duplicate pending invite (same email)
      ├─ Check member limit (plan-gated)
      ├─ Generate raw token + SHA256 hash
      ├─ Store hash in DB (never the raw token)
      └─ Send email with /invite/{rawToken} link

Recipient clicks link
      │
      ├─ validateInviteToken (public, previews workspace name + role)
      ├─ User signs in / signs up
      ├─ acceptInvite called
      │    ├─ Verify caller email matches invite recipient email
      │    ├─ Verify invite not expired (7 day TTL)
      │    ├─ Re-check member limit at acceptance time
      │    ├─ Insert workspace_member row
      │    ├─ Increment team member count (atomic)
      │    └─ Mark invite ACCEPTED
      └─ Redirect to /ws/{workspaceId}
```

**Resend logic**: Each invite can be resent up to 3 times with a 60-second minimum cooldown. If the original token is expired at resend time, a fresh token is generated and the expiry is reset.

---

## Billing & Plan Gating

The billing service acts as both a feature-flag registry and a usage counter. It has no direct dependency on a payment provider — Polar.sh integration hooks in via webhooks that call `activatePlan`.

### Plan Features

| Feature | FREE | PRO | PRO_MAX |
|---|---|---|---|
| Response limit/month | 100 | 1 000 | 10 000 |
| Form limit | 3 | Unlimited | Unlimited |
| Team members | 1 | 5 | 20 |
| Multi-language | ✗ | ✓ | ✓ |
| Custom close date | ✗ | ✓ | ✓ |
| Custom slug | ✗ | ✓ | ✓ |
| Advanced analytics | ✗ | ✓ | ✓ |
| Redirect on complete | ✗ | ✓ | ✓ |
| Remove watermark | ✗ | ✗ | ✓ |
| Confirmation email | ✗ | ✗ | ✓ |

### Monthly Usage Counters
Response count is tracked per workspace per calendar month in the `workspace_usage` table. The live counter lives in Redis (`INCR` on every submission). The DB row is the source of truth and is synced periodically or on Redis restart.

### Workspace Plan Cache
`getWorkspacePlan` is cached per workspace. The cache is invalidated on: plan activation, form count change, member count change, and workspace deletion. The `featureProcedure` middleware reads this cache on every gated request.

---

## Analytics

All analytics routes require `featureProcedure("advancedAnalytics")` — they are only available on PRO and above.

Every analytics query verifies that the requested form belongs to the requested workspace before touching data. This prevents cross-workspace data leakage even if a formId is guessed.

| Endpoint | What it returns |
|---|---|
| Summary | Views, starts, submissions, completion rate, avg time |
| Question stats | Per-question option counts + percentages / rating distribution + avg score. Cached per `(formId, publishVersion)`. |
| Responses list | Paginated; columns = questions, rows = answers |
| Export | All responses for a form version (for CSV export) |
| Geo | Country and continent breakdown |
| Cities | Top cities filterable by continent |

Question stats only aggregate "chartable" question types: `radio`, `checkbox`, `select`, `rating`. Free-text and date fields are excluded.

---

## Email System

Email sending is abstracted behind an `EmailProvider` interface with two implementations:

- **`ResendEmailProvider`** — production, sends via Resend API
- **`ConsoleEmailProvider`** — development, logs the rendered HTML to stdout

The active provider is selected at startup based on whether `RESEND_API_KEY` is present. Switching providers requires no service changes.

**Emails sent by the system:**

1. **Workspace Invite** — sent to the invitee with a tokenised `/invite/{token}` link. The token in the link is the raw token; only its SHA256 hash is stored in the DB.
2. **Submission Confirmation** — optionally sent to the respondent after form submission if `confirmationEmail` is enabled (PRO_MAX). Six branded templates available.

---

## S3 Logo Upload

Workspace logo uploads use a **presigned PUT URL** flow to avoid routing large files through the API server:

```
Frontend                      API                        S3 (Tigris)
   │                            │                             │
   │── POST getLogoUploadUrl ──>│                             │
   │                            │── generate presigned PUT ──>│
   │<── { uploadUrl, publicUrl }│                             │
   │                            │                             │
   │── PUT {uploadUrl} (webp) ────────────────────────────>  │
   │<── 200 OK ────────────────────────────────────────────  │
   │                            │                             │
   │── updateWorkspace(logo: publicUrl) ──>│                 │
```

The S3 key is always `brand/{workspaceId}.webp`. Replacing the logo overwrites the same key — no orphan files accumulate. A `?v={timestamp}` query parameter is appended to `publicUrl` on every generation so the browser cache is busted on each upload.

The client converts the selected image to WebP via the Canvas API before uploading, so the server always receives a consistent format regardless of the original file type.

---

## Error Handling

tRPC maps all service errors to typed `TRPCError` codes which are then translated to HTTP status codes by the OpenAPI adapter:

| tRPC code | HTTP | When |
|---|---|---|
| `UNAUTHORIZED` | 401 | No active session |
| `FORBIDDEN` | 403 | Insufficient role, plan gate, or feature gate |
| `NOT_FOUND` | 404 | Resource does not exist or is deleted |
| `CONFLICT` | 409 | Optimistic concurrency failure (edit version mismatch) |
| `TOO_MANY_REQUESTS` | 429 | Rate limit exceeded |
| `BAD_REQUEST` | 400 | Invalid input (malformed data) |
| `UNPROCESSABLE_CONTENT` | 422 | Answer validation failure on submission |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected failure |

Zod validation errors are flattened into `data.zodError.fieldErrors` in the response body so the frontend can map errors directly to form fields without extra parsing.

---

## Environment Variables

All variables are validated and transformed at startup by `@flowform/env` using Zod. The server will not start if any required variable is missing.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `BETTER_AUTH_SECRET` | Session signing key |
| `BETTER_AUTH_URL` | Auth callback base URL |
| `FRONTEND_URL` | CORS origin + invite link base |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | OAuth |
| `RESEND_API_KEY` | Email delivery (optional in dev — falls back to console) |
| `AWS_REGION` | S3 region |
| `AWS_ENDPOINT_URL_S3` | S3 endpoint (Tigris-compatible) |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | S3 credentials |
| `S3_BUCKET_NAME` | Target bucket |
| `PORT` | HTTP port (default 4000) |
| `LOG_LEVEL` | Pino log level |

---

## Key Design Decisions

### Soft Deletes
Workspaces and forms are soft-deleted (`isDeleted = true`) rather than hard-deleted. This preserves foreign key integrity, keeps historical analytics valid, and allows recovery if needed. All list queries filter out deleted records.

### Optimistic Concurrency on Form Sync
Form editing uses an `editVersion` counter rather than pessimistic locking. The sync mutation requires the client to send its known version. A mismatch means someone else edited concurrently — the client receives a `CONFLICT` and must re-fetch. This keeps editing responsive without serializing writes.

### Immutable Publish Snapshots
Every publish creates an immutable `formPublishSnapshot` row. Response validation and analytics are always performed against a specific snapshot version, not the current live form. This means editing and republishing a form never corrupts historical response data.

### Two-Step Presigned Upload
Uploading logos through the API would require streaming multipart data, adding latency and load to the API server. The presigned PUT URL pattern offloads the transfer entirely to S3 and keeps the API server stateless.

### Anonymous Sessions for Public Forms
A lightweight `anon_session` cookie (UUID, `HttpOnly`, 30-day expiry) tracks anonymous visitors for view deduplication without requiring signup. This is set on every request regardless of auth state so public forms always have a stable identity to deduplicate against.

### Redis Counters for Rate Limiting and Usage
Both the Express rate limiter and the monthly response counter use Redis `INCR`. This is atomic, avoids row-level DB locks, and scales horizontally. The response counter syncs back to PostgreSQL so data survives Redis restarts.

### Plan Enforcement at Multiple Layers
Plan limits are checked in two places:
1. **Before** the operation (e.g. `checkFormLimit` before creating a form)
2. **In the middleware** via `featureProcedure` for feature-flagged endpoints

This prevents both over-limit resource creation and unauthorized access to gated features even if the service-layer check is bypassed.
