"use client";

// Last resort when the root layout itself fails; it must render its own <html>.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "96px 24px", maxWidth: 448, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0 }}>Something went wrong</h1>
        <p style={{ fontSize: 17, color: "#6b6b6b", marginTop: 4 }}>Your logged sets are safe.</p>
        <button
          type="button"
          onClick={reset}
          style={{ marginTop: 32, fontSize: 15, fontWeight: 500, background: "none", border: 0, padding: 0 }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
