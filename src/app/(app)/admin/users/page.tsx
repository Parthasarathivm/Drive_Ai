"use client";
import { Users } from "lucide-react";
import { RequireStaff } from "@/components/Guards";
import { useApp } from "@/components/Providers";
import { Badge, Button, Card, ErrorState, LoadingBlock, Notice, PageHeader } from "@/components/ui";
import { api, useFetch } from "@/lib/client";
import { ROLES, ROLE_LABEL, type Role } from "@/lib/constants";

type U = { id: number; name: string; email: string; isActive: boolean; roles: Role[]; createdAt: string };

function Inner() {
  const { user, toast, hasRole } = useApp();
  const { data, loading, error, reload } = useFetch<{ users: U[] }>(hasRole() ? "/api/admin/users" : null);
  if (!user?.roles.includes("super_admin")) return <Notice tone="amber">Only Super Admins can manage users and roles.</Notice>;
  if (loading) return <LoadingBlock />;
  if (error || !data) return <ErrorState message={error ?? "Failed"} onRetry={reload} />;
  async function patch(id: number, body: object) { try { await api("/api/admin/users", { method: "PATCH", body: { id, ...body } }); toast("User updated.", "success"); reload(); } catch (e) { toast(e instanceof Error ? e.message : "Failed", "error"); } }
  return (
    <div className="space-y-3">{data.users.map((u) => (
      <Card key={u.id} className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2"><div><b>{u.name}</b> <span className="text-sm text-muted">{u.email}</span> {!u.isActive && <Badge tone="red">deactivated</Badge>}</div>
          <Button size="sm" variant={u.isActive ? "secondary" : "primary"} onClick={() => patch(u.id, { isActive: !u.isActive })}>{u.isActive ? "Deactivate" : "Activate"}</Button></div>
        <div className="flex flex-wrap gap-3">{ROLES.filter((r) => r !== "user").map((r) => (
          <label key={r} className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={u.roles.includes(r)} onChange={() => patch(u.id, { roles: u.roles.includes(r) ? u.roles.filter((x) => x !== r) : [...u.roles, r] })} />{ROLE_LABEL[r]}</label>))}</div>
      </Card>))}</div>
  );
}
export default function UsersPage() {
  return (<><PageHeader title="Users & Roles" icon={<Users className="h-5 w-5" />} description="Assign Super Admin, Legal Reviewer, Data Manager and Translator roles. Every change is written to the audit log." /><RequireStaff><Inner /></RequireStaff></>);
}
