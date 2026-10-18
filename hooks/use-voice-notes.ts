import { useCallback, useEffect, useRef, useState } from "react";

const MAX_RECORDING_MS = 60_000;

/** Records up to a minute of audio and appends the transcript via onText. */
export function useVoiceNotes(onText: (text: string) => void) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const autoStop = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  const stop = useCallback(() => {
    if (autoStop.current) clearTimeout(autoStop.current);
    autoStop.current = null;
    if (recorder.current?.state === "recording") recorder.current.stop();
    setRecording(false);
  }, []);

  const send = useCallback(async (blob: Blob, type: string) => {
    const form = new FormData();
    form.append("file", new File([blob], `voice.${type.includes("mp4") ? "m4a" : "webm"}`, { type }));
    setTranscribing(true);
    try {
      const res = await fetch("/api/transcribe", { method: "POST", body: form });
      const body = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
      if (body.text) onTextRef.current(body.text);
      else if (body.error === "limit") setError("That's enough voice for today. You can type instead.");
      else setError("Didn't catch that. Try again or type it.");
    } catch {
      setError("Didn't catch that. Try again or type it.");
    } finally {
      setTranscribing(false);
    }
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ["audio/webm", "audio/mp4"].find((m) => MediaRecorder.isTypeSupported(m));
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const type = (rec.mimeType || "audio/webm").split(";")[0]!.replace("video/", "audio/");
        if (chunks.length) void send(new Blob(chunks, { type }), type);
      };
      rec.start();
      recorder.current = rec;
      setRecording(true);
      autoStop.current = setTimeout(stop, MAX_RECORDING_MS);
    } catch {
      setError("Microphone not available. You can type instead.");
    }
  }, [send, stop]);

  useEffect(
    () => () => {
      if (autoStop.current) clearTimeout(autoStop.current);
      if (recorder.current?.state === "recording") {
        recorder.current.onstop = null;
        recorder.current.stream.getTracks().forEach((t) => t.stop());
        recorder.current.stop();
      }
    },
    [],
  );

  return { recording, transcribing, error, start, stop };
}
