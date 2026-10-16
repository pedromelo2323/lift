const GATEWAY = "https://ai.gateway.lovable.dev/v1";

export class AiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function apiKey() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new AiError(401, "AI is not configured");
  return key;
}

async function readSse(res: Response, onEvent: (e: Record<string, unknown>) => void) {
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        onEvent(JSON.parse(data));
      } catch {
        /* ignore partial */
      }
    }
  }
}

/** Streams a strict-JSON Responses call and returns the parsed object. */
export async function generateJson<T>(instructions: string, input: string, schema: Record<string, unknown>): Promise<T> {
  const key = apiKey();
  const res = await fetch(`${GATEWAY}/responses`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      instructions,
      input,
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      text: { format: { type: "json_schema", name: "plan", strict: true, schema } },
    }),
  });
  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    console.error("AI plan error", res.status, body.slice(0, 500));
    throw new AiError(res.status, "AI request failed");
  }
  let text = "";
  await readSse(res, (e) => {
    if (e["type"] === "response.output_text.delta" && typeof e["delta"] === "string") text += e["delta"];
  });
  return JSON.parse(text) as T;
}

export async function transcribeAudio(file: File): Promise<string> {
  const key = apiKey();
  if (!file.size || file.size > 10 * 1024 * 1024) throw new AiError(400, "Recording too long");
  const form = new FormData();
  form.append("model", "openai/gpt-transcribe");
  form.append("file", file, file.name);
  form.append("response_format", "json");
  form.append("stream", "true");
  const res = await fetch(`${GATEWAY}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    console.error("Transcribe error", res.status, body.slice(0, 500));
    throw new AiError(res.status, "Transcription failed");
  }
  let delta = "";
  let final = "";
  await readSse(res, (e) => {
    if (e["type"] === "transcript.text.delta" && typeof e["delta"] === "string") delta += e["delta"];
    if (e["type"] === "transcript.text.done" && typeof e["text"] === "string") final = e["text"];
  });
  return (final || delta).trim();
}
