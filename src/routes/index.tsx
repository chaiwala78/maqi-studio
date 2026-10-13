import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { PageHeader, Poster, Ready } from "@/components/admin/kit";
import { changedKeys, useAdmin } from "@/services/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview — MaQi Admin" },
      { name: "description", content: "Status of MaQi catalog, banners, sections and providers." },
      { property: "og:title", content: "Overview — MaQi Admin" },
      { property: "og:description", content: "Status of MaQi catalog, banners, sections and providers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Overview,
});

function Overview() {
  const s = useAdmin();
  return (
    <>
      <PageHeader eyebrow="MaQi Admin" title="Overview" />
      <Ready>
        {s.draft && (() => {
          const d = s.draft;
          const stats = [
            { to: "/catalog", label: "Catalog titles", value: d.catalog.length, sub: `${d.catalog.filter((c) => c.visibility === "visible").length} visible` },
            { to: "/banners", label: "Hero banners", value: d.banners.filter((b) => b.enabled).length, sub: `of ${d.banners.length} active` },
            { to: "/sections", label: "Home sections", value: d.sections.filter((x) => x.enabled).length, sub: `of ${d.sections.length} enabled` },
            { to: "/providers", label: "Providers", value: d.providers.filter((p) => p.enabled).length, sub: `of ${d.providers.length} enabled` },
          ] as const;
          const pending = changedKeys(s).length;
          const hero = d.banners.find((b) => b.enabled);
          return (
            <div className="space-y-6">
              {hero && (
                <Link to="/banners" className="group relative block aspect-[16/9] overflow-hidden rounded-lg border border-border md:aspect-[21/8]">
                  <Poster imageKey={hero.imageKey} title={hero.title} className="absolute inset-0 aspect-auto h-full w-full rounded-none" />
                  <div className="scrim-bottom absolute inset-0" />
                  <div className="absolute bottom-0 p-4">
                    <p className="eyebrow">Current lead banner</p>
                    <p className="font-display text-2xl font-semibold">{hero.title}</p>
                    <p className="text-sm text-muted-foreground">{hero.tagline}</p>
                  </div>
                </Link>
              )}
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">
                {stats.map((x) => (
                  <Link key={x.to} to={x.to} className="bg-background p-4 hover:bg-card">
                    <p className="eyebrow">{x.label}</p>
                    <p className="mt-2 font-display text-3xl font-semibold">{x.value}</p>
                    <p className="text-xs text-muted-foreground">{x.sub}</p>
                  </Link>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {pending ? <><span className="text-foreground">{pending}</span> area(s) have unpublished draft changes.</> : "No unpublished changes."}
              </p>
              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Recent activity</h2>
                  <Link to="/settings" className="flex items-center text-xs text-muted-foreground hover:text-foreground">Full log <ChevronRight className="h-3 w-3" /></Link>
                </div>
                {s.log.length ? (
                  <ul className="divide-y divide-border rounded-lg border border-border">
                    {s.log.slice(0, 5).map((l) => (
                      <li key={l.id} className="flex justify-between gap-3 px-3 py-2.5 text-sm">
                        <span><span className="text-muted-foreground">{l.action}</span> {l.target}</span>
                        <time className="shrink-0 font-mono text-[11px] text-muted-foreground">{new Date(l.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-muted-foreground">No changes yet in this session.</p>}
              </section>
            </div>
          );
        })()}
      </Ready>
    </>
  );
}
