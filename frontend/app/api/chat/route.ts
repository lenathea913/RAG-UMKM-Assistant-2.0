import { NextRequest, NextResponse } from "next/server";
import { askRara, askRaraStream, getHealth, isOutOfScope } from "@/lib/rag";

// Granite di CPU bisa butuh 2–4 menit per jawaban — jangan potong di tengah.
export const maxDuration = 600;

/** Preflight: dipakai `evals/run_evals.py --inspect` untuk cek kesiapan. */
export async function GET() {
  return NextResponse.json(await getHealth());
}

type ChatBody = { message?: string; sessionId?: string; stream?: boolean };

export async function POST(req: NextRequest) {
  let body: ChatBody;
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return NextResponse.json({ error: "Body harus berupa JSON" }, { status: 400 });
  }

  const message = body.message?.trim();
  const sessionId = body.sessionId;
  if (!message || !sessionId) {
    return NextResponse.json(
      { error: "message dan sessionId wajib diisi" },
      { status: 400 }
    );
  }

  // Mode streaming (NDJSON — satu objek per baris) untuk UI, supaya jawaban
  // tampil bertahap selama model masih menghasilkan token.
  if (body.stream) return streamReply(message, sessionId, req.signal);

  // Mode JSON (default) — kontrak yang dibaca evals/run_evals.py, jangan diubah.
  try {
    const reply = await askRara(message, sessionId);
    return NextResponse.json({
      text: reply.text,
      sources: reply.sources,
      needHuman: isOutOfScope(reply.text),
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Gagal memanggil model";
    console.error("[api/chat]", detail);
    return NextResponse.json(
      {
        error: "Maaf, asisten sedang tidak bisa dihubungi. Coba lagi sebentar, ya.",
        detail,
      },
      { status: 502 }
    );
  }
}

/**
 * Balasan streaming:
 *   {"type":"delta","text":"..."}      tiap potongan token
 *   {"type":"done","sources":[...],"needHuman":false}   penutup
 *   {"type":"error","error":"..."}     kegagalan (mis. Ollama mati)
 */
function streamReply(message: string, sessionId: string, signal?: AbortSignal) {
  const encoder = new TextEncoder();
  let cancelled = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: unknown) => {
        if (cancelled) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          cancelled = true; // koneksi klien sudah tertutup
        }
      };

      try {
        const reply = await askRaraStream(
          message,
          sessionId,
          (text) => send({ type: "delta", text }),
          signal
        );
        send({
          type: "done",
          sources: reply.sources,
          needHuman: isOutOfScope(reply.text),
        });
      } catch (err) {
        const detail = err instanceof Error ? err.message : "Gagal memanggil model";
        console.error("[api/chat:stream]", detail);
        send({
          type: "error",
          error: "Maaf, asisten sedang tidak bisa dihubungi. Coba lagi sebentar, ya.",
        });
      } finally {
        if (!cancelled) {
          try {
            controller.close();
          } catch {
            /* stream sudah tertutup */
          }
        }
      }
    },
    cancel() {
      cancelled = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      // Cegah buffering di balik proxy — token harus langsung sampai ke browser.
      "X-Accel-Buffering": "no",
    },
  });
}
