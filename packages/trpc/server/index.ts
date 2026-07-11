import { router } from "./trpc";
import { formRouter } from "./routes/form.route";
import { workspaceCoreRouter } from "./routes/workspace/workspace-core.route";
import { workspaceMembersRouter } from "./routes/workspace/workspace-member.route";
import { workspaceInvitesRouter } from "./routes/workspace/workspace-invite.route";
import { analyticsRouter } from "./routes/analytics.route";
import { publicRouter } from "./routes/public.route";
import { billingRouter } from "./routes/billing.route";

export const serverRouter = router({
  forms: formRouter,
  workspace: router({
    core: workspaceCoreRouter,
    members: workspaceMembersRouter,
    invites: workspaceInvitesRouter,
  }),
  analytics: analyticsRouter,
  billing: billingRouter,
  public: publicRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
