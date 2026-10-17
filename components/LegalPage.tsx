import Link from "next/link";
import type { ReactNode } from "react";

// Set NEXT_PUBLIC_SUPPORT_EMAIL in Vercel; kept out of the repo because it's public.
const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-6 pb-20 pt-10">
      <Link href="/" className="-ml-1 flex items-center gap-0.5 text-[15px] text-muted-foreground">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Lift
      </Link>
      <h1 className="mt-6 text-[28px] font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-[13px] text-muted-foreground">Last updated {updated}</p>
      <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-foreground/85 [&_h2]:mt-8 [&_h2]:text-[13px] [&_h2]:font-medium [&_h2]:uppercase [&_h2]:tracking-wider [&_h2]:text-muted-foreground">
        {children}
      </div>
    </main>
  );
}

export function Contact() {
  return supportEmail ? (
    <p>
      <a className="underline underline-offset-4" href={`mailto:${supportEmail}`}>
        {supportEmail}
      </a>
    </p>
  ) : (
    <p>Use the feedback button in the app, or message the person who invited you.</p>
  );
}
