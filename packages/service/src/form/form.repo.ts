import { eq, and, desc, ne } from "drizzle-orm";
import { getDb } from "@flowform/database/connection";
import type { Tx } from "@flowform/database/connection";
import {
  form,
  formPublishSnapshot,
  type FormRecord,
  type FormContent,
  type FormTheme,
  type FormFont,
  type FormSettings,
} from "@flowform/database/models";

export type CreateFormData = {
  userId: string;
  workspaceId: string;
  title: string;
  description?: string | null;
  draftContent: FormContent;
  theme: FormTheme;
  font: FormFont;
  settings: FormSettings;
};

export type UpdateFormData = Partial<{
  title: string;
  description: string | null;
  slug: string | null;
  draftContent: FormContent;
  theme: FormTheme;
  font: FormFont;
  settings: FormSettings;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  hasDraft: boolean;
  editVersion: number;
  publishVersion: number;
  accessCode: string | null;
  closeAt: Date | null;
  isDeleted: boolean;
  updatedAt: Date;
}>;

export type CreateSnapshotData = {
  formId: string;
  publishVersion: number;
  content: FormContent;
  theme: FormTheme;
  font: FormFont;
  settings: FormSettings;
};

export type PatchSnapshotData = Partial<{
  content: FormContent;
  theme: FormTheme;
  font: FormFont;
  settings: FormSettings;
}>;

export class FormRepository {
  private get db() {
    return getDb();
  }

  async create(
    data: CreateFormData,
    onCreated: (tx: Tx) => Promise<void>,
  ): Promise<FormRecord> {
    return this.db.transaction(async (tx) => {
      const [doc] = await tx.insert(form).values(data).returning();
      await onCreated(tx);
      return doc!;
    });
  }

  async findActiveByIdAndWorkspace(
    formId: string,
    workspaceId: string,
  ): Promise<FormRecord | null> {
    const [doc] = await this.db
      .select()
      .from(form)
      .where(
        and(
          eq(form.id, formId),
          eq(form.workspaceId, workspaceId),
          eq(form.isDeleted, false),
        ),
      )
      .limit(1);
    return doc ?? null;
  }

  async listActiveByWorkspace(
    workspaceId: string,
    status?: "DRAFT" | "PUBLISHED" | "ARCHIVED",
  ): Promise<FormRecord[]> {
    const conditions = [
      eq(form.workspaceId, workspaceId),
      eq(form.isDeleted, false),
    ];
    if (status) conditions.push(eq(form.status, status));

    return this.db
      .select()
      .from(form)
      .where(and(...conditions))
      .orderBy(desc(form.updatedAt));
  }

  async updateByIdAndWorkspace(
    formId: string,
    workspaceId: string,
    data: UpdateFormData,
  ): Promise<FormRecord | null> {
    const [doc] = await this.db
      .update(form)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(form.id, formId),
          eq(form.workspaceId, workspaceId),
          eq(form.isDeleted, false),
        ),
      )
      .returning();
    return doc ?? null;
  }

  async updateByVersionAndWorkspace(
    formId: string,
    workspaceId: string,
    expectedVersion: number,
    data: UpdateFormData,
  ): Promise<FormRecord | null> {
    const [doc] = await this.db
      .update(form)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(form.id, formId),
          eq(form.workspaceId, workspaceId),
          eq(form.editVersion, expectedVersion),
          eq(form.isDeleted, false),
        ),
      )
      .returning();
    return doc ?? null;
  }

  async softDelete(
    formId: string,
    workspaceId: string,
    onDeleted: (tx: Tx) => Promise<void>,
  ): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const [doc] = await tx
        .update(form)
        .set({ isDeleted: true, updatedAt: new Date() })
        .where(
          and(
            eq(form.id, formId),
            eq(form.workspaceId, workspaceId),
            eq(form.isDeleted, false),
          ),
        )
        .returning({ id: form.id });
      if (!doc) return false;
      await onDeleted(tx);
      return true;
    });
  }

  async publish(
    formId: string,
    workspaceId: string,
    snapshot: CreateSnapshotData,
    data: UpdateFormData,
  ): Promise<FormRecord | null> {
    return this.db.transaction(async (tx) => {
      await tx.insert(formPublishSnapshot).values({
        formId: snapshot.formId,
        publishVersion: snapshot.publishVersion,
        content: snapshot.content,
        theme: snapshot.theme,
        font: snapshot.font,
        settings: snapshot.settings,
        publishedAt: new Date(),
      });
      const [doc] = await tx
        .update(form)
        .set({ ...data, updatedAt: new Date() })
        .where(
          and(
            eq(form.id, formId),
            eq(form.workspaceId, workspaceId),
            eq(form.isDeleted, false),
          ),
        )
        .returning();
      return doc ?? null;
    });
  }

  async createSnapshot(data: CreateSnapshotData): Promise<void> {
    await this.db.insert(formPublishSnapshot).values({
      formId: data.formId,
      publishVersion: data.publishVersion,
      content: data.content,
      theme: data.theme,
      font: data.font,
      settings: data.settings,
      publishedAt: new Date(),
    });
  }

  async updateSnapshot(
    formId: string,
    publishVersion: number,
    data: PatchSnapshotData,
  ): Promise<void> {
    if (Object.keys(data).length === 0) return;
    await this.db
      .update(formPublishSnapshot)
      .set(data)
      .where(
        and(
          eq(formPublishSnapshot.formId, formId),
          eq(formPublishSnapshot.publishVersion, publishVersion),
        ),
      );
  }

  async patchPublish(
    formId: string,
    workspaceId: string,
    expectedEditVersion: number,
    content: FormContent,
  ): Promise<FormRecord | null> {
    return this.db.transaction(async (tx) => {
      const [doc] = await tx
        .update(form)
        .set({
          draftContent: content,
          hasDraft: false,
          editVersion: expectedEditVersion + 1,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(form.id, formId),
            eq(form.workspaceId, workspaceId),
            eq(form.editVersion, expectedEditVersion),
            eq(form.isDeleted, false),
          ),
        )
        .returning();

      if (!doc) return null;

      await tx
        .update(formPublishSnapshot)
        .set({ content, theme: doc.theme, font: doc.font, settings: doc.settings })
        .where(
          and(
            eq(formPublishSnapshot.formId, formId),
            eq(formPublishSnapshot.publishVersion, doc.publishVersion),
          ),
        );

      return doc;
    });
  }

  async isSlugAvailable(slug: string, excludeFormId?: string): Promise<boolean> {
    const conditions = [
      eq(form.slug, slug),
      eq(form.isDeleted, false),
    ];
    if (excludeFormId) conditions.push(ne(form.id, excludeFormId));

    const [row] = await this.db
      .select({ id: form.id })
      .from(form)
      .where(and(...conditions))
      .limit(1);
    return !row;
  }

  async findBySlug(slug: string): Promise<FormRecord | null> {
    const [doc] = await this.db
      .select()
      .from(form)
      .where(
        and(
          eq(form.slug, slug),
          eq(form.isDeleted, false),
        ),
      )
      .limit(1);
    return doc ?? null;
  }
}
