import { eq, and, sql, isNotNull, desc } from "drizzle-orm";
import {
  form,
  formPublishSnapshot,
  formResponse,
  formAnalyticsSummary,
  type FormRecord,
  type FormPublishSnapshotRecord,
  type FormResponseRecord,
  type AnswerEntry,
} from "@flowform/database/models";
import { getDb } from "@flowform/database/connection";

export class PublicFormRepository {
  private get db() {
    return getDb();
  }

  // Form Lookup

  async findPublishedForm(idOrSlug: string): Promise<FormRecord | null> {
    const [bySlug] = await this.db
      .select()
      .from(form)
      .where(
        and(
          eq(form.slug, idOrSlug),
          eq(form.status, "PUBLISHED"),
          eq(form.isDeleted, false),
        ),
      )
      .limit(1);

    if (bySlug) return bySlug;

    const [byId] = await this.db
      .select()
      .from(form)
      .where(
        and(
          eq(form.id, idOrSlug),
          eq(form.status, "PUBLISHED"),
          eq(form.isDeleted, false),
        ),
      )
      .limit(1);

    return byId ?? null;
  }

  async getSubmissionCountFromSummary(formId: string): Promise<number> {
    const [row] = await this.db
      .select({ submissions: formAnalyticsSummary.submissions })
      .from(formAnalyticsSummary)
      .where(eq(formAnalyticsSummary.formId, formId))
      .limit(1);
    return row?.submissions ?? 0;
  }

  async getSnapshot(
    formId: string,
    publishVersion: number,
  ): Promise<FormPublishSnapshotRecord | null> {
    const [snapshot] = await this.db
      .select()
      .from(formPublishSnapshot)
      .where(
        and(
          eq(formPublishSnapshot.formId, formId),
          eq(formPublishSnapshot.publishVersion, publishVersion),
        ),
      )
      .limit(1);

    return snapshot ?? null;
  }

  async findFormForPreview(formId: string) {
    const [row] = await this.db
      .select()
      .from(form)
      .where(and(eq(form.id, formId), eq(form.isDeleted, false)))
      .limit(1);
    return row ?? null;
  }

  async hasSubmittedResponse(formId: string, fingerprint: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: formResponse.id })
      .from(formResponse)
      .where(
        and(
          eq(formResponse.formId, formId),
          eq(formResponse.fingerprint, fingerprint),
          isNotNull(formResponse.submittedAt),
        ),
      )
      .limit(1);

    return !!row;
  }

  // Session (Three-Phase Flow)

  async createSession(data: {
    formId: string;
    workspaceId: string;
    formVersion: number;
    fingerprint: string;
    timezone: string | null;
    device: string;
  }): Promise<FormResponseRecord> {
    const [row] = await this.db
      .insert(formResponse)
      .values({
        formId: data.formId,
        workspaceId: data.workspaceId,
        formVersion: data.formVersion,
        fingerprint: data.fingerprint,
        timezone: data.timezone,
        device: data.device,
        answers: [],
        startedAt: new Date(),
        submittedAt: null,
      })
      .returning();
    return row!;
  }

  async findSessionById(responseId: string): Promise<FormResponseRecord | null> {
    const [row] = await this.db
      .select()
      .from(formResponse)
      .where(eq(formResponse.id, responseId))
      .limit(1);
    return row ?? null;
  }

  // Atomic update — only succeeds if submittedAt IS NULL (natural mutex)
  async finalizeResponse(data: {
    responseId: string;
    answers: AnswerEntry[];
    respondentEmail: string | null;
  }): Promise<FormResponseRecord | null> {
    const [row] = await this.db
      .update(formResponse)
      .set({
        answers: data.answers,
        respondentEmail: data.respondentEmail,
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(formResponse.id, data.responseId),
          sql`${formResponse.submittedAt} IS NULL`,
        ),
      )
      .returning();
    return row ?? null;
  }

  // Called async after startSession — does not block the response.
  // Also patches formAnalyticsSummary when the response was already submitted
  // (race: geo lookup resolved after the user submitted the form).
  async updateGeo(
    responseId: string,
    geo: { country: string; continent: string; city: string },
  ): Promise<void> {
    // 1. Write to the individual response row and get back formId + submittedAt
    const [updated] = await this.db
      .update(formResponse)
      .set({ country: geo.country, continent: geo.continent, city: geo.city })
      .where(eq(formResponse.id, responseId))
      .returning({ formId: formResponse.formId, submittedAt: formResponse.submittedAt });

    // 2. If the response was already submitted when geo arrived, patch the summary.
    //    (Happy path: geo arrives before submit is handled by incrementSubmission.)
    if (updated?.submittedAt && updated?.formId) {
      const { formId } = updated;
      await this.db
        .insert(formAnalyticsSummary)
        .values({
          formId,
          continents: geo.continent ? { [geo.continent]: 1 } : {},
          countries: geo.country ? { [geo.country]: 1 } : {},
        })
        .onConflictDoUpdate({
          target: formAnalyticsSummary.formId,
          set: {
            continents: geo.continent
              ? sql`jsonb_set(${formAnalyticsSummary.continents}, ${`{${geo.continent}}`}, (COALESCE(${formAnalyticsSummary.continents}->>${geo.continent}, '0')::int + 1)::text::jsonb)`
              : formAnalyticsSummary.continents,
            countries: geo.country
              ? sql`jsonb_set(${formAnalyticsSummary.countries}, ${`{${geo.country}}`}, (COALESCE(${formAnalyticsSummary.countries}->>${geo.country}, '0')::int + 1)::text::jsonb)`
              : formAnalyticsSummary.countries,
            updatedAt: new Date(),
          },
        });
    }
  }

  // Analytics Summary (Upsert)

  async incrementViews(formId: string): Promise<void> {
    await this.db
      .insert(formAnalyticsSummary)
      .values({ formId, views: 1 })
      .onConflictDoUpdate({
        target: formAnalyticsSummary.formId,
        set: {
          views: sql`${formAnalyticsSummary.views} + 1`,
          updatedAt: new Date(),
        },
      });
  }

  async incrementStarts(formId: string): Promise<void> {
    await this.db
      .insert(formAnalyticsSummary)
      .values({ formId, starts: 1 })
      .onConflictDoUpdate({
        target: formAnalyticsSummary.formId,
        set: {
          starts: sql`${formAnalyticsSummary.starts} + 1`,
          updatedAt: new Date(),
        },
      });
  }

  // Explore — list published public forms
  // ⚠️  Uses JSON operators to extract ONLY the safe subset of each column.
  //     Never returns accessCode, userId, workspaceId, draftContent, the full
  //     settings object, the full theme object, or the full font object.
  async listPublicForms(opts: {
    limit: number;
    offset: number;
    search?: string;
  }) {
    const conditions: ReturnType<typeof sql>[] = [
      sql`${form.status} = 'PUBLISHED'`,
      sql`${form.isDeleted} = false`,
      sql`${form.settings}->>'accessType' = 'public'`,
      sql`(${form.closeAt} IS NULL OR ${form.closeAt} > NOW())`,
    ];

    if (opts.search?.trim()) {
      const term = `%${opts.search.trim()}%`;
      conditions.push(
        sql`(${form.title} ILIKE ${term} OR ${form.description} ILIKE ${term})`,
      );
    }

    const whereClause = and(...conditions);

    const [rows, countResult] = await Promise.all([
      this.db
        .select({
          id: form.id,
          slug: form.slug,
          title: form.title,
          description: form.description,
          // Extract only primaryColor — never backgroundImage (signed S3 URL)
          primaryColor: sql<string>`${form.theme}->>'primaryColor'`,
          // Extract only the two safe settings fields
          formLayout: sql<string>`${form.settings}->>'formLayout'`,
          collectEmail: sql<boolean>`(${form.settings}->>'collectEmail')::boolean`,
          // Analytics (safe aggregates)
          views: sql<number>`COALESCE(${formAnalyticsSummary.views}, 0)`,
          submissions: sql<number>`COALESCE(${formAnalyticsSummary.submissions}, 0)`,
          avgTimeMs: formAnalyticsSummary.avgTimeMs,
          // Publish date from snapshot
          publishedAt: formPublishSnapshot.publishedAt,
          // Count questions across all pages without returning content
          questionCount: sql<number>`COALESCE((
            SELECT COUNT(*)::int
            FROM jsonb_array_elements(
              COALESCE(${formPublishSnapshot.content}, '{"pages":[]}'::jsonb)->'pages'
            ) AS page_el,
                 jsonb_array_elements(page_el->'questions') AS q_el
          ), 0)`,
        })
        .from(form)
        .leftJoin(
          formAnalyticsSummary,
          eq(formAnalyticsSummary.formId, form.id),
        )
        .leftJoin(
          formPublishSnapshot,
          and(
            eq(formPublishSnapshot.formId, form.id),
            eq(formPublishSnapshot.publishVersion, form.publishVersion),
          ),
        )
        .where(whereClause)
        .orderBy(desc(formPublishSnapshot.publishedAt))
        .limit(opts.limit)
        .offset(opts.offset),

      this.db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(form)
        .where(whereClause),
    ]);

    return { rows, total: countResult[0]?.count ?? 0 };
  }

  async incrementSubmission(data: {
    formId: string;
    clampedTimeMs: number;
    device: "desktop" | "mobile" | "tablet";
    country: string | null;
    continent: string | null;
  }): Promise<void> {
    const { formId, clampedTimeMs, device, country, continent } = data;

    // Running average: new_avg = (old_avg * old_count + new_value) / new_count
    // Since we increment submissions first, old_count = submissions (before increment)
    const avgExpr = sql`
      CASE
        WHEN ${formAnalyticsSummary.avgTimeMs} IS NULL THEN ${clampedTimeMs}
        ELSE (${formAnalyticsSummary.avgTimeMs} * ${formAnalyticsSummary.submissions} + ${clampedTimeMs})
             / (${formAnalyticsSummary.submissions} + 1)
      END
    `;

    const deviceCol = device === "mobile"
      ? sql`jsonb_set(${formAnalyticsSummary.devices}, '{mobile}', ((${formAnalyticsSummary.devices}->>'mobile')::int + 1)::text::jsonb)`
      : device === "tablet"
      ? sql`jsonb_set(${formAnalyticsSummary.devices}, '{tablet}', ((${formAnalyticsSummary.devices}->>'tablet')::int + 1)::text::jsonb)`
      : sql`jsonb_set(${formAnalyticsSummary.devices}, '{desktop}', ((${formAnalyticsSummary.devices}->>'desktop')::int + 1)::text::jsonb)`;

    const baseValues = {
      formId,
      submissions: 1,
      avgTimeMs: clampedTimeMs,
      devices: device === "mobile"
        ? { desktop: 0, mobile: 1, tablet: 0 }
        : device === "tablet"
        ? { desktop: 0, mobile: 0, tablet: 1 }
        : { desktop: 1, mobile: 0, tablet: 0 },
      countries: country ? { [country]: 1 } : {},
      continents: continent ? { [continent]: 1 } : {},
    };

    await this.db
      .insert(formAnalyticsSummary)
      .values(baseValues)
      .onConflictDoUpdate({
        target: formAnalyticsSummary.formId,
        set: {
          submissions: sql`${formAnalyticsSummary.submissions} + 1`,
          avgTimeMs: avgExpr,
          devices: deviceCol,
          countries: country
            ? sql`jsonb_set(${formAnalyticsSummary.countries}, ${`{${country}}`}, (COALESCE(${formAnalyticsSummary.countries}->>${country}, '0')::int + 1)::text::jsonb)`
            : formAnalyticsSummary.countries,
          continents: continent
            ? sql`jsonb_set(${formAnalyticsSummary.continents}, ${`{${continent}}`}, (COALESCE(${formAnalyticsSummary.continents}->>${continent}, '0')::int + 1)::text::jsonb)`
            : formAnalyticsSummary.continents,
          updatedAt: new Date(),
        },
      });
  }
}
