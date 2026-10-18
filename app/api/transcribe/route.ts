import { NextResponse } from "next/server";
import { MAX_AUDIO_BYTES, isAiConfigured, transcribe } from "@/lib/ai/openai";
import { getSignedInClient } from "@/lib/api/auth";

export const maxDuration = 40;

// Matches the limit in claim_voice_transcription().
const VOICE_DAILY_LIMIT = 30;

export async function POST(request: Request) {
  const session = await getSignedInClient();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isAiConfigured()) return NextResponse.json({ text: "", error: "unavailable" }, { status: 503 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || !file.size || file.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ text: "", error: "invalid" }, { status: 400 });
  }

  // Check the daily limit up front, but only count recordings that worked.
  const { data: usage } = await session.supabase
    .from("plan_usage")
    .select("voice_day, voice_count")
    .eq("user_id", session.userId)
    .maybeSingle();
  const today = new Date().toISOString().slice(0, 10);
  if (usage?.voice_day === today && usage.voice_count >= VOICE_DAILY_LIMIT) {
    return NextResponse.json({ text: "", error: "limit" }, { status: 429 });
  }

  let text: string;
  try {
    text = await transcribe(file);
  } catch (error) {
    console.error("Transcription failed", file.type, file.size, error instanceof Error ? error.message : error);
    return NextResponse.json({ text: "", error: "failed" }, { status: 502 });
  }
  if (!text) return NextResponse.json({ text: "", error: "failed" }, { status: 502 });

  await session.supabase.rpc("claim_voice_transcription");
  return NextResponse.json({ text });
}
