import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

// Replace with the real contact address once created.
export const SUPPORT_EMAIL = "support@example.com";

export function LegalPage({ title, updated, children }: { title: string; updated?: string; children: ReactNode }) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-6 pb-20 pt-10">
      <Link to="/" className="-ml-1 flex items-center gap-0.5 text-[15px] text-muted-foreground">
        <ChevronLeft aria-hidden className="size-4" />
        Lift
      </Link>
      <h1 className="mt-6 text-[28px] font-semibold tracking-tight">{title}</h1>
      {updated ? <p className="mt-1 text-[13px] text-muted-foreground">Last updated {updated}</p> : null}
      <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-foreground/85 [&_h2]:mt-8 [&_h2]:text-[13px] [&_h2]:font-medium [&_h2]:uppercase [&_h2]:tracking-wider [&_h2]:text-muted-foreground">
        {children}
      </div>
    </main>
  );
}

export function head(title: string, description: string) {
  return {
    meta: [
      { title: `${title} — Lift` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} — Lift` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  };
}
