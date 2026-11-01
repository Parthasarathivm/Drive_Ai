import { db } from "@/db";
import { adminAuditLogs } from "@/db/schema";
import { clientIp } from "@/lib/api";
import type { SessionUser } from "@/lib/auth";

export async function audit(
  req: Request,
  user: SessionUser | null,
  action: string,
  entityType?: string,
  entityId?: string | number,
  details?: Record<string, unknown>,
) {
  await db.insert(adminAuditLogs).values({
    userId: user?.id,
    userEmail: user?.email,
    action,
    entityType,
    entityId: entityId === undefined ? undefined : String(entityId),
    details,
    ip: clientIp(req),
  });
}
