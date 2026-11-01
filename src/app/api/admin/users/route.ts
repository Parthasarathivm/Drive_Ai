import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { sessions, userRoles, users } from "@/db/schema";
import { ApiError, handle, parseBody } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { ROLES } from "@/lib/constants";

export const GET = handle(async () => {
  await requireRole();
  const rows = await db.select({ id: users.id, name: users.name, email: users.email, isActive: users.isActive, createdAt: users.createdAt }).from(users).orderBy(users.id);
  const roles = await db.select().from(userRoles).where(inArray(userRoles.userId, rows.map((r) => r.id).concat(-1)));
  return { users: rows.map((r) => ({ ...r, roles: roles.filter((x) => x.userId === r.id).map((x) => x.role) })) };
});

const Patch = z.object({ id: z.number().int(), roles: z.array(z.enum(ROLES)).optional(), isActive: z.boolean().optional() });
export const PATCH = handle(async (req) => {
  const admin = await requireRole(); // super_admin only
  const b = await parseBody(req, Patch);
  if (b.id === admin.id && (b.isActive === false || (b.roles && !b.roles.includes("super_admin")))) throw new ApiError(400, "You cannot remove your own Super Admin access or deactivate yourself.");
  if (b.roles) {
    const roles = [...new Set([...b.roles, "user" as const])];
    await db.delete(userRoles).where(eq(userRoles.userId, b.id));
    await db.insert(userRoles).values(roles.map((role) => ({ userId: b.id, role })));
  }
  if (b.isActive !== undefined) {
    await db.update(users).set({ isActive: b.isActive }).where(eq(users.id, b.id));
    if (!b.isActive) await db.delete(sessions).where(eq(sessions.userId, b.id));
  }
  await audit(req, admin, "update_user", "user", b.id, { roles: b.roles, isActive: b.isActive });
  return { ok: true };
});
