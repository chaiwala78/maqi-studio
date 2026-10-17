import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { PageHeader, Poster, Ready } from "@/components/admin/kit";
import { changedKeys, useAdmin } from "@/services/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview — MaQi Admin" },
      { name: "description", content: "Status of MaQi sections, curated collections, banners and providers." },
      { property: "og:title", content: "Overview — MaQi Admin" },
      { property: "og:description", content: "Status of MaQi sections, curated collections, banners and providers." },
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
            { to: "/sections", label: "Curated Collections", value: d.curated.length, sub: `${d.curated.filter((c) => c.enabled !== false).length} active` },
            { to: "/banners", label: "Hero banners", value: d.banners.filter((b) => b.enabled).length, sub: `of ${d.banners.length} active` },
            { to: "/sections", label: "Home sections", value: d.sections.filter((x) => x.enabled).length, sub: `of ${d.sections.length} enabled` },
            { to: "/providers", label: "Providers", value: d.providers.filter((p) => p.enabled).length, sub: `of ${d.providers.length} enabled` },
          ] as const;
          const pending = changedKeys(s).length;
          const hero = d.banners.find((b) => b.enabled);
          return (
            <div className="space-y-6">
              {hero && (
                <Link to="/banners" className="group relative block aspect-[16/9] overflow-hidden glass rounded-2xl md:aspect-[21/8]">
                  <Poster imageKey={hero.imageKey} title={hero.title} className="absolute inset-0 aspect-auto h-full w-full rounded-none" />
                  <div className="scrim-bottom absolute inset-0" />
                  <div className="absolute bottom-0 p-4">
                    <p className="eyebrow">Current lead banner</p>
                    <p className="font-display text-2xl font-semibold">{hero.title}</p>
                    <p className="text-sm text-muted-foreground">{hero.tagline}</p>
                  </div>
                </Link>
              )}
              <div className="grid grid-cols-2 gap-px overflow-hidden glass rounded-2xl bg-border md:grid-cols-4">
                {stats.map((x) => (
                  <Link key={x.label} to={x.to} className="bg-background p-4 hover:bg-card">
                    <p className="eyebrow">{x.label}</p>
                    <p className="mt-2 font-display text-3xl font-semibold">{x.value}</p>
                    <p className="text-xs text-muted-foreground">{x.sub}</p>
                  </Link>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {pending ? <><span className="text-foreground">{pending}</span> area(s) have unpublished draft changes.</> : "No unpublished changes."}
              </p>
            </div>
          );
        })()}
      </Ready>
    </>
  );
}
