/**
 * RAG lokal UMKM Assistant — tanpa Langflow, tanpa IBM Bob.
 *
 * Alurnya:
 *   1. Baca seluruh korpus `knowledge-base/` (±3,7 KB — terlalu kecil untuk
 *      butuh vector store, jadi dimasukkan utuh ke prompt).
 *   2. Ambil system prompt dari `langflow/agent-system-prompt.md` (sumber
 *      kebenaran prompt, sesuai aturan tim).
 *   3. Panggil LLM lewat provider yang dipilih di .env.local:
 *      - "ollama" (default) → POST {OLLAMA_URL}/api/chat — IBM Granite lokal.
 *      - "gemini" → API Google Generative Language (butuh GEMINI_API_KEY).
 *   4. Riwayat percakapan per sesi disimpan in-memory (pengganti memory bawaan
 *      flow Langflow yang dulu menangani `session_id`).
 */
import fs from "node:fs/promises";
import path from "node:path";

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const MODEL = process.env.OLLAMA_MODEL ?? "granite3.3:8b";
const TEMPERATURE = Number(process.env.LLM_TEMPERATURE ?? "0.2");
const TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS ?? 600_000);

/** Provider LLM: "ollama" (lokal, default) atau "gemini" (API Google). */
const PROVIDER = (process.env.LLM_PROVIDER ?? "ollama").trim().toLowerCase();
/** Hanya dibaca saat PROVIDER=gemini. Jangan pernah memakai awalan NEXT_PUBLIC_. */
const GEMINI_KEY = process.env.GEMINI_API_KEY ?? "";
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";
const GEMINI_API = "https://generativelanguage.googleapis.com/v1beta/models";

/** Cukup besar untuk korpus + riwayat pendek; Granite pakai Q4 sehingga aman. */
const NUM_CTX = 8192;
/** Jawaban maksimal — jawaban Rara memang diminta pendek oleh system prompt. */
const NUM_PREDICT = 500;
/** Pertahankan model tetap termuat selama proses Ollama hidup (±6,5 GB dari
 *  16 GB RAM) supaya tanya berikutnya tidak pernah menunggu reload dari disk
 *  yang dulu makan ±2 menit. Ganti ke angka detik, mis. 300, kalau RAM ketat. */
const KEEP_ALIVE = -1;
/** Riwayat yang dikirim ulang ke model: 4 giliran terakhir. */
const MAX_HISTORY_TURNS = 8;
/** Batas sesi di memori, agar proses server tidak tumbuh tanpa batas. */
const MAX_SESSIONS = 500;

const SYSTEM_PROMPT_PATH = path.resolve(
  process.cwd(),
  "..",
  "langflow",
  "agent-system-prompt.md"
);
const KB_DIR_CANDIDATES = [
  ...(process.env.KNOWLEDGE_DIR ? [path.resolve(process.env.KNOWLEDGE_DIR)] : []),
  path.resolve(process.cwd(), "..", "knowledge-base"),
  path.resolve(process.cwd(), "knowledge-base"),
];

export type RaraReply = {
  text: string;
  sources: string[];
};

type Turn = { role: "user" | "assistant"; content: string };

// ---------------------------------------------------------------------------
// Sumber data
// ---------------------------------------------------------------------------

type KnowledgeBase = { files: string[]; text: string };

/** Baca semua dokumen .md/.txt dari knowledge-base/ (dibaca per request agar
 *  edit dokumen langsung terpakai tanpa restart). */
async function loadKnowledgeBase(): Promise<KnowledgeBase> {
  const tried: string[] = [];

  for (const dir of KB_DIR_CANDIDATES) {
    let names: string[];
    try {
      names = (await fs.readdir(dir)).filter((f) => /\.(md|txt)$/i.test(f)).sort();
    } catch {
      tried.push(dir);
      continue;
    }
    if (!names.length) {
      tried.push(`${dir} (tanpa file .md/.txt)`);
      continue;
    }

    const parts: string[] = [];
    for (const name of names) {
      const content = await fs.readFile(path.join(dir, name), "utf8");
      parts.push(`### Dokumen: ${name}\n${content.trim()}`);
    }
    return { files: names, text: parts.join("\n\n") };
  }

  throw new Error(`Knowledge base tidak ditemukan. Dicek di: ${tried.join(" | ")}`);
}

/** System prompt ada di dalam fence ```text di file markdown-nya. */
async function loadSystemPrompt(): Promise<string> {
  const raw = await fs.readFile(SYSTEM_PROMPT_PATH, "utf8");
  const fenced = raw.match(/```(?:text|txt)?\s*\n([\s\S]*?)```/);
  const prompt = (fenced?.[1] ?? "").trim();
  if (!prompt) {
    throw new Error(`Sistem prompt tidak ditemukan di ${SYSTEM_PROMPT_PATH}`);
  }
  return prompt;
}

// ---------------------------------------------------------------------------
// Memory per sesi (pengganti session_id di Langflow)
// ---------------------------------------------------------------------------

const history = new Map<string, Turn[]>();

function getHistory(sessionId: string): Turn[] {
  return history.get(sessionId) ?? [];
}

function pushTurn(sessionId: string, turn: Turn) {
  const turns = getHistory(sessionId);
  turns.push(turn);
  // sisakan N giliran terakhir saja — konteks panjang memperlambat prefill
  if (turns.length > MAX_HISTORY_TURNS) turns.splice(0, turns.length - MAX_HISTORY_TURNS);

  if (!history.has(sessionId) && history.size >= MAX_SESSIONS) {
    const oldest = history.keys().next().value;
    if (oldest !== undefined) history.delete(oldest);
  }
  history.set(sessionId, turns);
}

// ---------------------------------------------------------------------------
// Panggilan model
// ---------------------------------------------------------------------------

type ChatMessage = { role: string; content: string };

/** Rakit pesan + korpus untuk satu pertanyaan. */
async function prepare(
  message: string,
  sessionId: string
): Promise<{ messages: ChatMessage[]; files: string[] }> {
  const [{ files, text }, systemPrompt] = await Promise.all([
    loadKnowledgeBase(),
    loadSystemPrompt(),
  ]);

  // Konteks dokumen ditaruh di pesan system (teksnya identik dengan template
  // grounding Langflow dulu), BUKAN di pesan user. Alasannya performa: dengan
  // urutan ini prefix (system prompt + korpus) selalu sama antar request,
  // sehingga KV-cache Ollama mengenali prefix yang sama — prefill ulang korpus
  // (~1.300 token) tidak perlu diulang tiap chat. Diukur di CPU ini: tanpa
  // cache, prefill korpus makan 15-20 detik per pertanyaan.
  const contextBlock =
    `=== KONTEKS DOKUMEN ===\n${text}\n=== AKHIR KONTEKS ===`;

  return {
    files,
    messages: [
      { role: "system", content: `${systemPrompt}\n\n${contextBlock}` },
      ...getHistory(sessionId),
      { role: "user", content: message },
    ],
  };
}

function ollamaBody(messages: ChatMessage[], stream: boolean): string {
  return JSON.stringify({
    model: MODEL,
    messages,
    stream,
    keep_alive: KEEP_ALIVE,
    options: {
      temperature: TEMPERATURE,
      num_ctx: NUM_CTX,
      num_predict: NUM_PREDICT,
    },
  });
}

async function callOllama(
  messages: ChatMessage[],
  stream: boolean,
  signal?: AbortSignal
): Promise<Response> {
  const signals = [AbortSignal.timeout(TIMEOUT_MS)];
  if (signal) signals.push(signal);

  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: ollamaBody(messages, stream),
    signal: AbortSignal.any(signals),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Ollama ${res.status}: ${body.slice(0, 300) || res.statusText}`
    );
  }
  return res;
}

// ---------------------------------------------------------------------------
// Gemini (API Google) — dipilih lewat LLM_PROVIDER=gemini
// ---------------------------------------------------------------------------

type GeminiEvent = {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
};

/** Ambil teks jawaban dari respons Gemini (JSON maupun satu baris SSE). */
function geminiText(ev: GeminiEvent): string {
  const parts = ev?.candidates?.[0]?.content?.parts;
  if (!parts) return "";
  return parts.map((p) => p.text ?? "").join("");
}

/** Rakit body Gemini dari daftar pesan yang sama dengan yang dipakai Ollama. */
function geminiBody(messages: ChatMessage[]): string {
  const system = messages.find((m) => m.role === "system");
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  return JSON.stringify({
    ...(system ? { systemInstruction: { parts: [{ text: system.content }] } } : {}),
    contents,
    generationConfig: {
      temperature: TEMPERATURE,
      maxOutputTokens: NUM_PREDICT,
    },
  });
}

async function callGemini(
  messages: ChatMessage[],
  stream: boolean,
  signal?: AbortSignal
): Promise<Response> {
  if (!GEMINI_KEY) {
    throw new Error("GEMINI_API_KEY belum diisi di frontend/.env.local.");
  }
  const signals = [AbortSignal.timeout(TIMEOUT_MS)];
  if (signal) signals.push(signal);

  // Streaming memakai SSE (?alt=sse): baris "data: {...}" per potongan teks.
  const action = stream ? "streamGenerateContent?alt=sse" : "generateContent";
  const res = await fetch(`${GEMINI_API}/${GEMINI_MODEL}:${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": GEMINI_KEY,
    },
    body: geminiBody(messages),
    signal: AbortSignal.any(signals),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Gemini ${res.status}: ${body.slice(0, 300) || res.statusText}`
    );
  }
  return res;
}

/** Mode JSON sekali panggil (Ollama). */
async function askOllamaOnce(
  messages: ChatMessage[],
  signal?: AbortSignal
): Promise<string> {
  const res = await callOllama(messages, false, signal);
  const data = (await res.json()) as { message?: { content?: string } };
  const answer = data.message?.content?.trim() ?? "";
  if (!answer) throw new Error("Ollama tidak mengembalikan jawaban kosong.");
  return answer;
}

/** Mode JSON sekali panggil (Gemini). */
async function askGeminiOnce(
  messages: ChatMessage[],
  signal?: AbortSignal
): Promise<string> {
  const res = await callGemini(messages, false, signal);
  const data = (await res.json()) as GeminiEvent;
  const answer = geminiText(data).trim();
  if (!answer) {
    const block = data.promptFeedback?.blockReason;
    throw new Error(
      `Gemini tidak mengembalikan jawaban kosong${block ? ` (blockReason: ${block})` : ""}.`
    );
  }
  return answer;
}

/** Simpan pertanyaan mentah (bukan prompt berkonteks) agar riwayat tetap ringan. */
function commit(sessionId: string, message: string, answer: string) {
  pushTurn(sessionId, { role: "user", content: message });
  pushTurn(sessionId, { role: "assistant", content: answer });
}

/** Mode JSON — dipakai evals/run_evals.py. */
export async function askRara(
  message: string,
  sessionId: string,
  signal?: AbortSignal
): Promise<RaraReply> {
  const { messages, files } = await prepare(message, sessionId);
  const answer =
    PROVIDER === "gemini"
      ? await askGeminiOnce(messages, signal)
      : await askOllamaOnce(messages, signal);

  commit(sessionId, message, answer);
  return { text: answer, sources: files };
}

/**
 * Mode streaming — Ollama mengirim NDJSON, Gemini mengirim SSE (baris
 * "data: {...}"); keduanya diparse per baris dan `onDelta` dipanggil untuk tiap
 * potongan teks yang keluar sehingga UI bisa menampilkan jawaban bertahap.
 */
export async function askRaraStream(
  message: string,
  sessionId: string,
  onDelta: (chunk: string) => void,
  signal?: AbortSignal
): Promise<RaraReply> {
  const { messages, files } = await prepare(message, sessionId);
  const gemini = PROVIDER === "gemini";
  const res = gemini
    ? await callGemini(messages, true, signal)
    : await callOllama(messages, true, signal);

  const reader = res.body?.getReader();
  if (!reader) throw new Error("Model tidak mengembalikan aliran jawaban.");

  const decoder = new TextDecoder();
  let buf = "";
  let answer = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });

      let nl: number;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line) continue;

        // SSE: buang prefix "data:" sebelum di-parse.
        const payload = gemini && line.startsWith("data:")
          ? line.slice(5).trim()
          : line;

        let ev:
          | (GeminiEvent & { message?: { content?: string }; error?: string })
          | null = null;
        try {
          ev = JSON.parse(payload);
        } catch {
          continue; // bukan JSON valid (mis. baris SSE "event:" / keep-alive)
        }
        if (!ev) continue;
        if (!gemini && ev.error) throw new Error(ev.error);

        const chunk = gemini ? geminiText(ev) : ev.message?.content;
        if (chunk) {
          answer += chunk;
          onDelta(chunk);
        }
      }
    }
  } finally {
    // Putuskan koneksi bila kita keluar lebih awal (error / klien batal).
    reader.cancel().catch(() => {});
  }

  answer = answer.trim();
  if (!answer) {
    throw new Error(
      gemini
        ? "Gemini tidak mengembalikan jawaban kosong."
        : "Ollama tidak mengembalikan jawaban kosong."
    );
  }

  commit(sessionId, message, answer);
  return { text: answer, sources: files };
}

// ---------------------------------------------------------------------------
// Preflight (dipakai GET /api/chat oleh evals/run_evals.py --inspect)
// ---------------------------------------------------------------------------

export type RagaHealth = {
  model: string;
  ollamaUrl: string;
  ollamaOk: boolean;
  modelReady: boolean;
  models: string[];
  kbFiles: string[];
  kbError?: string;
};

export async function getHealth(): Promise<RagaHealth> {
  const gemini = PROVIDER === "gemini";
  const health: RagaHealth = {
    model: gemini ? GEMINI_MODEL : MODEL,
    // Nama field lama dipertahankan agar kontrak eval tidak berubah;
    // saat provider=gemini isinya menunjuk backend Google.
    ollamaUrl: gemini ? "https://generativelanguage.googleapis.com" : OLLAMA_URL,
    ollamaOk: false,
    modelReady: false,
    models: [],
    kbFiles: [],
  };

  if (gemini) {
    try {
      const res = await fetch(`${GEMINI_API}?pageSize=200`, {
        headers: { "x-goog-api-key": GEMINI_KEY },
        signal: AbortSignal.timeout(5000),
      });
      const data = (await res.json()) as { models?: { name?: string }[] };
      health.ollamaOk = res.ok;
      health.models = (data.models ?? []).map((m) =>
        (m.name ?? "?").replace(/^models\//, "")
      );
      health.modelReady =
        GEMINI_KEY !== "" && health.models.includes(GEMINI_MODEL);
    } catch {
      health.ollamaOk = false;
    }
  } else {
    try {
      const res = await fetch(`${OLLAMA_URL}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      });
      const data = (await res.json()) as { models?: { name?: string }[] };
      health.ollamaOk = res.ok;
      health.models = (data.models ?? []).map((m) => m.name ?? "?");
      health.modelReady = health.models.includes(MODEL);
    } catch {
      health.ollamaOk = false;
    }
  }

  try {
    health.kbFiles = (await loadKnowledgeBase()).files;
  } catch (err) {
    health.kbError = err instanceof Error ? err.message : "Knowledge base gagal dibaca";
  }

  return health;
}

// ---------------------------------------------------------------------------
// Deteksi kasus "informasi tidak ditemukan → eskalasi ke admin"
// ---------------------------------------------------------------------------

/**
 * Pola penolakan pada system prompt Rara, plus frasa umum lain agar tahan
 * perubahan prompt. (Diambil utuh dari integrasi Langflow sebelumnya.)
 */
const ESCALATION_PATTERNS = [
  /belum (bisa )?menemukan/i,
  /tidak (bisa )?menemukan/i,
  /tidak (ditemukan|tersedia|ada informasi)/i,
  /informasi(nya)? (belum|tidak) (ada|tersedia|ditemukan)/i,
  /teruskan (kepada |ke )?admin/i, // aktif "akan saya teruskan ke admin" maupun pasif "diteruskan ke admin"
  /hubungi admin/i,
  /eskalas/i,
  /bantu teruskan/i,
  /terhubung(kan)? (dengan |ke )?(admin|pemilik|tim)/i,
  /belum tercantum/i,
  /tidak tercantum/i,
  /luar cakupan/i, // "di luar cakupan saya/toko/pengetahuan"
  /sebagai (asisten )?ai/i,
];

export function isOutOfScope(text: string): boolean {
  return ESCALATION_PATTERNS.some((re) => re.test(text));
}
