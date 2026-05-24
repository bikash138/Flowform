import { FormService } from "@flowform/services/form";
import {
  WorkspaceCoreService,
  WorkspaceMemberService,
  WorkspaceInviteService,
} from "@flowform/services/workspace";
import { PublicFormService } from "@flowform/services/public";
import { AnalyticsService } from "@flowform/services/analytics";
import { BillingService } from "@flowform/services/billing";

export const formService = new FormService();
export const workspaceCoreService = new WorkspaceCoreService();
export const workspaceMemberService = new WorkspaceMemberService();
export const workspaceInviteService = new WorkspaceInviteService();
export const publicFormService = new PublicFormService();
export const analyticsService = new AnalyticsService();
export const billingService = new BillingService();
