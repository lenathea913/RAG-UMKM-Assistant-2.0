import { NextRequest, NextResponse } from "next/server";
import { runFlow, isOutOfScope } from "@/lib/langflow";

export const maxDuration = 180;

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId } = (await req.json()) as {
      message?: string;
      sessionId?: string;
    };

    if (!message?.trim() || !sessionId) {
      return NextResponse.json(
        { error: "message dan sessionId wajib diisi" },
        { status: 400 }
      );
    }

    const reply = await runFlow(message.trim(), sessionId);
    return NextResponse.json({
      text: reply.text,
      sources: reply.sources,
      needHuman: isOutOfScope(reply.text),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal memanggil Langflow";
    console.error("[api/chat]", msg);
    return NextResponse.json(
      {
        error:
          "Maaf, asisten sedang tidak bisa dihubungi. Coba lagi sebentar, ya.",
        detail: msg,
      },
      { status: 502 }
    );
  }
}
