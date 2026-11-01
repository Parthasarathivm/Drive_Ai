"use client";
import type { ReactNode } from "react";
import { LockKeyhole } from "lucide-react";
import { useApp } from "@/components/Providers";
import { EmptyState, LinkButton, LoadingBlock } from "@/components/ui";
import type { Role } from "@/lib/constants";

export function RequireLogin({ children, message = "Log in to use this feature." }: { children: ReactNode; message?: string }) {
  const { user, userLoading } = useApp();
  if (userLoading) return <LoadingBlock rows={2} />;
  if (!user) {
    return (
      <EmptyState icon={<LockKeyhole className="h-8 w-8" />} title="Login required" text={message}
        action={<div className="flex gap-2"><LinkButton href="/login">Log in</LinkButton><LinkButton href="/register" variant="secondary">Create account</LinkButton></div>} />
    );
  }
  return <>{children}</>;
}

/** Client-side convenience guard — real authorisation is enforced by the API on every request. */
export function RequireStaff({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const { user, userLoading, isStaff, hasRole } = useApp();
  if (userLoading) return <LoadingBlock rows={2} />;
  if (!user) return <RequireLogin message="Log in with a staff account to access administration.">{null}</RequireLogin>;
  if (!isStaff || (roles && !hasRole(...roles))) {
    return <EmptyState icon={<LockKeyhole className="h-8 w-8" />} title="Access denied" text="Your account does not have permission to view this page. Ask a Super Admin to assign you a role." />;
  }
  return <>{children}</>;
}
