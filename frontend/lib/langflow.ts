/**
 * Integrasi ke Langflow (RAG "Rara").
 *
 * Endpoint: POST {LANGFLOW_URL}/api/v1/run/{FLOW_ID}
 * - Ambil FLOW_ID dari URL browser saat flow dibuka di Langflow,
 *   atau klik ikon "API" di pojok flow → salin cURL-nya.
 * - Nama flow juga bisa dipakai, mis. "UMKM%20Assistant".
 * - session_id wajib dikirim agar memory percakapan per-sesi.
 *
 * Struktur respons bisa sedikit beda antar versi Langflow —
 * ekstraksi di bawah menangani beberapa bentuk yang umum.
 */

const LANGFLOW_URL = process.env.LANGFLOW_URL ?? "http://localhost:7860";
const FLOW_ID = process.env.LANGFLOW_FLOW_ID ?? "UMKM%20Assistant";
const LANGFLOW_API_KEY = process.env.LANGFLOW_API_KEY; // opsional

export type LangflowReply = {
  text: string;
  sources: string[];
  raw?: unknown;
};

/** Ekstrak teks jawaban dari berbagai bentuk respons Langflow. */
function extractText(data: unknown): string {
  // Bentuk umum: outputs[0].outputs[0].results.message.text
  const d = data as {
    outputs?: Array<{
      outputs?: Array<{
        results?: { message?: { text?: string } | string };
        messages?: Array<{ text?: string; message?: string }>;
      }>;
    }>;
  };
  const out0 = d?.outputs?.[0]?.outputs?.[0];
  const m = out0?.results?.message;
  if (typeof m === "string") return m;
  if (m?.text) return m.text;
  const msg = out0?.messages?.[0];
  if (typeof msg?.message === "string") return msg.message;
  if (msg?.text) return msg.text;
  return "";
}

/** Coba ambil nama dokumen sumber kalau Langflow menyertakannya. */
function extractSources(data: unknown): string[] {
  const d = data as {
    outputs?: Array<{
      outputs?: Array<{
        results?: {
          message?: { properties?: { source?: unknown } };
          artifacts?: unknown;
        };
      }>;
    }>;
  };
  const out0 = d?.outputs?.[0]?.outputs?.[0];
  const src = out0?.results?.message?.properties?.source;
  const names: string[] = [];
  const push = (s: unknown) => {
    if (typeof s === "string" && s.trim()) names.push(s.trim());
    else if (s && typeof s === "object") {
      const o = s as Record<string, unknown>;
      const name = (o.file ?? o.source ?? o.title ?? o.filename) as unknown;
      if (typeof name === "string" && name.trim()) names.push(name.trim());
    }
  };
  if (Array.isArray(src)) src.forEach(push);
  else push(src);
  return [...new Set(names)];
}

export async function runFlow(
  message: string,
  sessionId: string
): Promise<LangflowReply> {
  const res = await fetch(
    `${LANGFLOW_URL}/api/v1/run/${FLOW_ID}?stream=false`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(LANGFLOW_API_KEY
          ? { "x-api-key": LANGFLOW_API_KEY }
          : {}),
      },
      body: JSON.stringify({
        input_value: message,
        session_id: sessionId,
        output_type: "chat",
        input_type: "chat",
      }),
      // Jawaban Granite lokal bisa lambat (±1–2 menit di CPU).
      signal: AbortSignal.timeout(170_000),
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Langflow ${res.status}: ${body.slice(0, 300) || res.statusText}`
    );
  }

  const data = await res.json();
  const text = extractText(data);
  if (!text) throw new Error("Respons Langflow tidak berisi teks jawaban.");
  return { text, sources: extractSources(data), raw: data };
}

/**
 * Deteksi kasus "informasi tidak ditemukan → eskalasi ke admin".
 * Dicocokkan dengan frasa penolakan pada system prompt Rara,
 * plus frasa umum lain agar tahan perubahan prompt.
 */
const ESCALATION_PATTERNS = [
  /belum (bisa )?menemukan/i,
  /tidak (bisa )?menemukan/i,
  /tidak (ditemukan|tersedia|ada informasi)/i,
  /informasi(nya)? (belum|tidak) (ada|tersedia|ditemukan)/i,
  /diteruskan (kepada |ke )?admin/i,
  /hubungi admin/i,
  /eskalas/i,
  /bantu teruskan/i,
  /terhubung(kan)? (dengan |ke )?(admin|pemilik|tim)/i,
  /belum tercantum/i,
  /tidak tercantum/i,
  /di luar (cakupan )?pengetahuan/i,
  /sebagai (asisten )?ai/i,
];

export function isOutOfScope(text: string): boolean {
  return ESCALATION_PATTERNS.some((re) => re.test(text));
}
