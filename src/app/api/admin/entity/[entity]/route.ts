import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { ruleVersions, states } from "@/db/schema";
import { ApiError, handle, parseBody } from "@/lib/api";
import { z } from "zod";
import { requireRole, requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { ENTITY_CONFIGS } from "@/lib/admin-config";
import { ENTITY_TABLES, autoKey, coerceFields } from "@/lib/admin-server";
import type { Role } from "@/lib/constants";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Ctx = { params: Promise<{ entity: string }> };

async function setup(entity: string, write: boolean) {
  const cfg = ENTITY_CONFIGS.find((c) => c.key === entity);
  const table = ENTITY_TABLES[entity];
  if (!cfg || !table) throw new ApiError(404, "Unknown entity.");
  const user = write ? await requireRole(...(cfg.roles as Role[])) : await requireUser();
  if (!write && !user.roles.some((r) => r !== "user")) throw new ApiError(403, "Staff access required.");
  return { cfg, table, user };
}

const pk = (table: any) => (table.code ?? table.id) as any;

export const GET = handle<Ctx>(async (_req, { params }) => {
  const { entity } = await params;
  const { cfg, table } = await setup(entity, false);
  const stateRows = await db.select().from(states);
  const orderCol = table.id ?? table.code;
  const rows = await db.select().from(table).orderBy(desc(orderCol)).limit(500);
  return {
    config: cfg,
    rows: rows.map((r: any) => ({ ...r, stateCode: r.stateId ? stateRows.find((s) => s.id === r.stateId)?.code ?? null : null })),
  };
});

export const POST = handle<Ctx>(async (req, { params }) => {
  const { entity } = await params;
  const { cfg, table, user } = await setup(entity, true);
  const raw = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!raw || typeof raw !== "object") throw new ApiError(400, "Invalid JSON body.");
  const values: any = await coerceFields(cfg.fields, raw, false);
  Object.assign(values, autoKey(entity, values));
  if (entity === "penalties" || entity === "legal_rules") values.jurisdictionLevel = values.jurisdictionLevel ?? (values.stateId ? "state" : "central");
  if ("isDemo" in table) values.isDemo = false;
  if (entity === "legal_rules") values.extractedBy = "manual";
  if (entity === "languages") values.enabled = values.enabled ?? true;
  const [row]: any[] = await (db.insert(table).values(values) as any).returning().catch((e: any) => {
    if (String(e?.message).includes("duplicate") || e?.code === "23505") throw new ApiError(409, "A record with the same unique key already exists.");
    throw e;
  });
  await audit(req, user, "create", entity, row.id ?? row.code, { title: values[cfg.titleField] });
  return { row };
});

const Patch = z.object({ id: z.union([z.number(), z.string()]), data: z.record(z.string(), z.unknown()) });

export const PATCH = handle<Ctx>(async (req, { params }) => {
  const { entity } = await params;
  const { cfg, table, user } = await setup(entity, true);
  const { id, data } = await parseBody(req, Patch);
  const values: any = await coerceFields(cfg.fields, data, true);
  const where = eq(pk(table), id as any);
  const [old] = await db.select().from(table).where(where).limit(1);
  if (!old) throw new ApiError(404, "Record not found.");
  // Editing legal content invalidates a previous human verification — it must be re-reviewed.
  if (cfg.hasStatus) {
    values.verificationStatus = "pending";
    values.reviewerId = null;
    values.lastVerifiedAt = null;
  }
  if (entity === "legal_rules") {
    await db.insert(ruleVersions).values({ ruleId: old.id, version: old.version, snapshot: JSON.parse(JSON.stringify(old)), changedBy: user.id, changeNote: "Edited via admin (status reset to pending)" });
    values.version = old.version + 1;
    values.updatedAt = new Date();
  }
  const [row]: any[] = await (db.update(table).set(values).where(where) as any).returning();
  await audit(req, user, "update", entity, id, { fields: Object.keys(data), resetToPending: cfg.hasStatus });
  return { row };
});

export const DELETE = handle<Ctx>(async (req, { params }) => {
  const { entity } = await params;
  const { table, user } = await setup(entity, true);
  const id = new URL(req.url).searchParams.get("id");
  if (!id) throw new ApiError(400, "id required");
  const val: any = entity === "languages" ? id : Number(id);
  if (entity === "legal_rules") await db.delete(ruleVersions).where(eq(ruleVersions.ruleId, val));
  await db.delete(table).where(eq(pk(table), val));
  await audit(req, user, "delete", entity, id);
  return { ok: true };
});
