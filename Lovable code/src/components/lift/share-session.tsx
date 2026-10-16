import { Share } from "lucide-react";
import type { WorkoutDetail } from "@/lib/lift/types";
import { todayISO } from "@/lib/lift/api";
import { formatDay, formatValue } from "@/lib/lift/model";
import { haptic, unitLabel } from "@/lib/lift/prefs";

type Line = { name: string; sets: string[] };

function todaysLines(detail: WorkoutDetail): Line[] {
  const today = detail.sessions.find((s) => s.date === todayISO());
  if (!today) return [];
  return detail.exercises
    .map((e) => {
      const sets = detail.sets
        .filter((s) => s.session_id === today.id && s.exercise_id === e.id)
        .sort((a, b) => a.set_index - b.set_index)
        .map((s) => formatValue({ weight: s.weight == null ? null : Number(s.weight), reps: s.reps }))
        .filter((v) => v !== "—");
      return { name: e.name, sets };
    })
    .filter((l) => l.sets.length > 0);
}

async function render(detail: WorkoutDetail, lines: Line[]): Promise<Blob> {
  const W = 1080;
  const H = 1920;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const font = `-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif`;
  g.fillStyle = "#FCFBF8";
  g.fillRect(0, 0, W, H);
  g.fillStyle = "#1E1C19";

  const x = 110;
  let y = 300;
  g.font = `600 64px ${font}`;
  g.fillText("Lift", x, y);
  g.font = `300 26px ${font}`;
  g.fillStyle = "#8A8680";
  g.fillText("JUST HEAVY", x, y + 48);

  y += 220;
  g.fillStyle = "#1E1C19";
  g.font = `600 88px ${font}`;
  g.fillText(detail.workout.name, x, y);
  g.fillStyle = "#8A8680";
  g.font = `400 36px ${font}`;
  g.fillText(`${formatDay(todayISO())} · ${unitLabel()} × reps`, x, y + 60);

  y += 170;
  const rowH = Math.min(150, (H - y - 200) / Math.max(lines.length, 1));
  for (const line of lines) {
    g.fillStyle = "#E6E3DE";
    g.fillRect(x, y - rowH * 0.62, W - x * 2, 2);
    g.fillStyle = "#1E1C19";
    g.font = `400 42px ${font}`;
    g.fillText(line.name, x, y);
    g.fillStyle = "#5C5852";
    g.font = `400 34px ${font}`;
    g.fillText(line.sets.join("   "), x, y + 48);
    y += rowH;
  }

  return new Promise((resolve) => c.toBlob((b) => resolve(b!), "image/png"));
}

export function ShareSession({ detail }: { detail: WorkoutDetail }) {
  const lines = todaysLines(detail);
  if (lines.length === 0) return null;

  const share = async () => {
    haptic(10);
    const blob = await render(detail, lines);
    const file = new File([blob], `lift-${todayISO()}.png`, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
      } catch {
        /* cancelled */
      }
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button type="button" onClick={share} aria-label="Share today's session" className="p-1 text-muted-foreground">
      <Share aria-hidden className="size-[18px]" />
    </button>
  );
}
