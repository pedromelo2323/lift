import Link from "next/link";

export default function NotFound() {
  return (
    <div className="px-6 pb-20 pt-24">
      <h1 className="text-[28px] font-semibold leading-tight tracking-tight">Nothing here</h1>
      <p className="mt-1 text-[17px] text-muted-foreground">This page doesn&apos;t exist, or it moved.</p>
      <Link href="/" className="mt-8 inline-block text-[15px] font-medium text-foreground active:opacity-60">
        Back to workouts
      </Link>
    </div>
  );
}
