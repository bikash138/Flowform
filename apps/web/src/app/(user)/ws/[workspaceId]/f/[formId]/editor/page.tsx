import { FormEditorCanvas } from "@/components/user/editor/form-editor-canvas";

export default async function EditorPage({
  params,
}: {
  params: Promise<{ workspaceId: string; formId: string }>;
}) {
  await params;
  return <FormEditorCanvas />;
}
