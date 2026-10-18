import { NextResponse } from "next/server";
import { MAX_AUDIO_BYTES, isAiConfigured, transcribe } from "@/lib/ai/openai";
import { getSignedInClient } from "@/lib/api/auth";

export const maxDuration = 40;

export async function POST(request: Request) {
  const session = await getSignedInClient();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isAiConfigured()) return NextResponse.json({ text: "", error: "unavailable" }, { status: 503 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || !file.size || file.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ text: "", error: "invalid" }, { status: 400 });
  }

  const { data: allowed } = await session.supabase.rpc("claim_voice_transcription");
  if (!allowed) return NextResponse.json({ text: "", error: "limit" }, { status: 429 });

  try {
    return NextResponse.json({ text: await transcribe(file) });
  } catch {
    return NextResponse.json({ text: "", error: "failed" }, { status: 502 });
  }
}
