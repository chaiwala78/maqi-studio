import { type ReactNode } from "react";
import { ArrowDown, ArrowUp, Loader2, Trash2 } from "lucide-react";
import poster1 from "@/assets/poster-1.jpg";
import poster2 from "@/assets/poster-2.jpg";
import poster3 from "@/assets/poster-3.jpg";
import banner1 from "@/assets/banner-1.jpg";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAdmin } from "@/services/store";
import { cn } from "@/lib/utils";

export const IMAGES: Record<string, string> = {
  "poster-1": poster1, "poster-2": poster2, "poster-3": poster3, "banner-1": banner1,
};

export function Poster({ imageKey, title, className }: { imageKey?: string | undefined; title: string; className?: string }) {
  const src = imageKey ? IMAGES[imageKey] : undefined;
  return (
    <div className={cn("relative aspect-[2/3] shrink-0 overflow-hidden rounded-md bg-muted", className)}>
      {src ? (
        <img src={src} alt={title} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-end p-1.5 font-display text-[10px] leading-tight text-muted-foreground">{title}</div>
      )}
    </div>
  );
}

export function PageHeader({ eyebrow, title, action, children }: { eyebrow: string; title: string; action?: ReactNode; children?: ReactNode }) {
  return (
    <header className="mb-5 flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-1 text-2xl font-semibold md:text-3xl">{title}</h1>
        </div>
        {action}
      </div>
      {children && <p className="max-w-xl text-sm text-muted-foreground">{children}</p>}
    </header>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function ConfirmDelete({ what, onConfirm, label }: { what: string; onConfirm: () => void; label?: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Remove ${what}`} className="h-8 w-8 text-muted-foreground hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{label ?? "Remove"} {what}?</AlertDialogTitle>
          <AlertDialogDescription>This is staged in your draft. It only goes live after you review and publish.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function OrderButtons({ index, length, onMove }: { index: number; length: number; onMove: (d: -1 | 1) => void }) {
  return (
    <div className="flex flex-col">
      <button aria-label="Move up" disabled={index === 0} onClick={() => onMove(-1)} className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-25">
        <ArrowUp className="h-3.5 w-3.5" />
      </button>
      <button aria-label="Move down" disabled={index === length - 1} onClick={() => onMove(1)} className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-25">
        <ArrowDown className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function Tag({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "primary" | "success" | "warning" }) {
  const tones = {
    muted: "border-border text-muted-foreground",
    primary: "border-primary/40 text-primary",
    success: "border-success/40 text-success",
    warning: "border-warning/40 text-warning",
  };
  return <span className={cn("inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider", tones[tone])}>{children}</span>;
}

/** Renders loading / error states until the store is ready. */
export function Ready({ children }: { children: ReactNode }) {
  const s = useAdmin();
  if (s.status === "error") return <p className="rounded-md border border-destructive/40 p-4 text-sm text-destructive">Couldn't load configuration: {s.error}</p>;
  if (!s.draft) return <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading configuration…</div>;
  return <>{children}</>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-md border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">{children}</p>;
}
