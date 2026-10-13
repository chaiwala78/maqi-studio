import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Ready, Tag, Empty } from "@/components/admin/kit";
import { Button } from "@/components/ui/button";
import { resetDemo, useAdmin } from "@/services/store";
import { adminService } from "@/services/admin-service";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/settings")({
  head: pageHead("Settings & Activity", "MaQi backend connection status and admin activity log."),
  component: SettingsPage,
});

function SettingsPage() {
  const s = useAdmin();
  return (
    <>
      <PageHeader eyebrow="System" title="Settings & Activity" />
      <section className="mb-6 divide-y divide-border glass rounded-2xl">
        <Row label="Data source" value={<Tag tone="warning">{adminService.mode}</Tag>} />
        <Row label="Worker URL" value={<span className="font-mono text-xs text-muted-foreground">Not configured — to be read from your Worker source</span>} />
        <Row label="Admin API" value={<span className="text-xs text-muted-foreground">Not connected</span>} />
        <Row label="Polling" value={<span className="text-xs text-muted-foreground">Off — loaded once per session</span>} />
      </section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Activity log</h2>
        <Button size="sm" variant="ghost" onClick={() => { if (window.confirm("Reset all demo data and log?")) resetDemo(); }}>Reset demo</Button>
      </div>
      <Ready>
        {s.log.length ? (
          <ul className="divide-y divide-border glass rounded-2xl">
            {s.log.map((l) => (
              <li key={l.id} className="flex flex-col gap-0.5 px-3 py-2.5 text-sm md:flex-row md:justify-between">
                <span><span className="text-muted-foreground">{l.action}</span> {l.target}</span>
                <time className="font-mono text-[11px] text-muted-foreground">{new Date(l.at).toLocaleString()}</time>
              </li>
            ))}
          </ul>
        ) : <Empty>No activity yet.</Empty>}
      </Ready>
    </>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return <div className="flex items-center justify-between gap-4 px-3 py-3 text-sm"><span>{label}</span>{value}</div>;
}
