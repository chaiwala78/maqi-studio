import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDelete, PageHeader, Ready, Tag } from "@/components/admin/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mutate, useAdmin } from "@/services/store";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/users")({
  head: pageHead("Admins", "Firebase sign-in status and authorized MaQi administrators."),
  component: UsersPage,
});

function UsersPage() {
  const s = useAdmin();
  const [email, setEmail] = useState("");
  function add(): void {
    const e = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { toast.error("Enter a valid email."); return; }
    if (s.draft!.admins.some((a) => a.email === e)) { toast.error("Already authorized."); return; }
    mutate("admins", (a) => [...a, { email: e, role: "editor", addedAt: new Date().toISOString().slice(0, 10) }], "Authorized admin", e);
    setEmail("");
  }
  return (
    <>
      <PageHeader eyebrow="Security" title="Firebase & Admins">Only explicitly listed emails may use the panel. No end-user tracking is collected here.</PageHeader>
      <section className="mb-6 rounded-lg border border-border p-4">
        <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-warning" /><p className="text-sm font-medium">Firebase Authentication</p><Tag tone="warning">not connected</Tag></div>
        <p className="mt-2 text-sm text-muted-foreground">Sign-in is not active. Once your Firebase project is linked, the allowlist will be enforced on the server, not just in this screen.</p>
      </section>
      <Ready>
        <div className="mb-3 flex gap-2">
          <Input type="email" placeholder="admin@email.com" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
          <Button onClick={add}><Plus className="h-4 w-4" /> Authorize</Button>
        </div>
        <ul className="divide-y divide-border rounded-lg border border-border">
          {s.draft?.admins.map((a) => (
            <li key={a.email} className="flex items-center gap-3 px-3 py-2.5">
              <div className="min-w-0 flex-1"><p className="truncate text-sm">{a.email}</p><p className="font-mono text-[11px] text-muted-foreground">added {a.addedAt}</p></div>
              <Tag tone={a.role === "owner" ? "primary" : "muted"}>{a.role}</Tag>
              {a.role !== "owner" && <ConfirmDelete label="Revoke" what={a.email} onConfirm={() => mutate("admins", (l) => l.filter((x) => x.email !== a.email), "Revoked admin", a.email)} />}
            </li>
          ))}
        </ul>
      </Ready>
    </>
  );
}
