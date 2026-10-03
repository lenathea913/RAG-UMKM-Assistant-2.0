"use client";

import { useEffect, useRef, useState } from "react";
import {
  FileText,
  Phone,
  SendHorizontal,
  Settings,
} from "lucide-react";

import { RaisedButton } from "@/components/ui/raised-button";
import { LogoMerak } from "@/components/logo-merak";

type Msg = {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: string[];
  needHuman?: boolean;
  failed?: boolean;
};

const SUGGESTIONS = [
  "Berapa harga Batik Tulis Mega Mendung Premium?",
  "Cara ordernya gimana, Kak?",
  "Gratis ongkir nggak ke luar Jawa?",
  "Ada stok kemeja Parang Rusak XXL?",
];

const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

function getSessionId(): string {
  try {
    const KEY = "umkm_session_id";
    let sid = localStorage.getItem(KEY);
    if (!sid) {
      sid = newId();
      localStorage.setItem(KEY, sid);
    }
    return sid;
  } catch {
    return newId();
  }
}

/** Pola jawaban "info tidak ditemukan" → tombol eskalasi muncul otomatis. */
const OUT_OF_SCOPE = [
  /belum (bisa )?menemukan/i,
  /tidak (bisa )?menemukan/i,
  /tidak (ditemukan|tersedia|ada informasi)/i,
  /informasi(nya)? (belum|tidak) (ada|tersedia|ditemukan)/i,
  /diteruskan (kepada |ke )?admin/i,
  /eskalas/i,
  /belum tercantum/i,
  /tidak tercantum/i,
  /di luar (cakupan )?pengetahuan/i,
];

function looksOutOfScope(t: string) {
  return OUT_OF_SCOPE.some((re) => re.test(t));
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: newId(),
      role: "assistant",
      text: "Halo, Kak! Aku Rara, asisten Batik Larasati. Mau tanya soal produk, harga, stok, atau cara order? Aku bantu 24 jam, Kak.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(getSessionId);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || loading) return;

    const userMsg: Msg = { id: newId(), role: "user", text: question };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, sessionId }),
      });
      const data = await res.json();

      const reply: Msg = res.ok
        ? {
            id: newId(),
            role: "assistant",
            text: data.text as string,
            sources: data.sources as string[] | undefined,
            needHuman: Boolean(data.needHuman) || looksOutOfScope(data.text),
          }
        : {
            id: newId(),
            role: "assistant",
            text:
              (data?.error as string) ??
              "Maaf Kak, ada kendala. Coba ulang sebentar ya.",
            failed: true,
          };
      setMessages((m) => [...m, reply]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: newId(),
          role: "assistant",
          text: "Maaf Kak, koneksinya bermasalah. Coba lagi ya.",
          failed: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mega-mendung flex h-dvh flex-col">
      <div className="mx-auto flex h-full w-full min-w-0 max-w-2xl flex-col">
        {/* Header */}
        <header className="flex min-w-0 items-center gap-3 border-b border-line bg-surface px-4 py-3 sm:rounded-b-2xl sm:border-x sm:shadow-[0_8px_24px_-12px_rgba(34,51,92,0.25)]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-mist">
            <LogoMerak className="h-6 w-6 text-indigo-deep" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[15px] font-bold tracking-[-0.01em] text-ink">
              Batik Larasati
            </h1>
            <p className="flex items-center gap-1.5 text-xs text-ink-soft">
              <span className="relative inline-flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 motion-safe:animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              {loading ? "Rara sedang mengetik…" : "Online — dibalas instan"}
            </p>
          </div>
          <a
            href="/admin"
            aria-label="Buka dashboard admin"
            title="Dashboard admin"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-indigo-mist/60 hover:text-indigo-ink"
          >
            <Settings className="h-[18px] w-[18px]" aria-hidden />
          </a>
        </header>

        {/* Area chat */}
        <main className="thin-scroll min-w-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((m) => (
            <Bubble key={m.id} msg={m} onAsk={send} />
          ))}

          {loading && (
            <div className="msg-in flex justify-start">
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-line bg-surface px-4 py-3 shadow-[0_6px_16px_-8px_rgba(34,51,92,0.2)]">
                <TypingDots />
                <span className="sr-only">Rara sedang mengetik</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </main>

        {/* Footer: chip saran + input + disclaimer */}
        <footer className="min-w-0 border-t border-line bg-surface px-4 pb-3 pt-2 sm:rounded-t-2xl sm:border-x sm:shadow-[0_-8px_24px_-14px_rgba(34,51,92,0.2)]">
          <div className="thin-scroll mb-2 flex gap-2 overflow-x-auto pb-1">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                disabled={loading}
                className="whitespace-nowrap rounded-full border border-indigo-mist bg-indigo-mist/50 px-3 py-1.5 text-xs font-medium text-indigo-ink transition-colors hover:bg-indigo-mist disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tulis pertanyaanmu, Kak…"
              className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-canvas px-4 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft focus:border-indigo-soft focus:bg-surface"
              aria-label="Tulis pertanyaanmu"
            />
            <RaisedButton
              type="submit"
              size="icon"
              color="#2f4470"
              disabled={loading || !input.trim()}
              aria-label="Kirim pertanyaan"
            >
              <SendHorizontal className="h-4 w-4" aria-hidden />
            </RaisedButton>
          </form>

          <p className="mt-2 text-center text-[11px] leading-snug text-ink-soft">
            Kamu sedang chat dengan asisten AI. Jawaban mengacu pada dokumen
            resmi toko; untuk hal di luar itu, Rara akan meneruskan ke admin.
          </p>
        </footer>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1" aria-hidden>
      {[0, 150, 300].map((d) => (
        <span
          key={d}
          className="dot-pulse inline-block h-1.5 w-1.5 rounded-full bg-indigo-soft"
          style={{ animationDelay: `${d}ms` }}
        />
      ))}
    </span>
  );
}

function Bubble({ msg, onAsk }: { msg: Msg; onAsk: (t: string) => void }) {
  if (msg.role === "user") {
    return (
      <div className="msg-in flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm border border-indigo-deep/40 bg-indigo-deep px-4 py-2.5 text-sm text-white shadow-[0_6px_16px_-8px_rgba(47,68,112,0.5)]">
          {msg.text}
        </div>
      </div>
    );
  }

  return (
    <div className="msg-in flex justify-start">
      <div className="max-w-[85%] space-y-2">
        <div
          className={`rounded-2xl rounded-bl-sm border px-4 py-2.5 text-sm shadow-[0_6px_16px_-10px_rgba(34,51,92,0.25)] ${
            msg.failed
              ? "border-clay/30 bg-clay/10 text-clay-deep"
              : "border-line bg-surface text-ink"
          }`}
        >
          <p className="whitespace-pre-wrap">{msg.text}</p>
        </div>

        {msg.sources && msg.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {msg.sources.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 rounded-full bg-indigo-mist px-2 py-0.5 text-[11px] font-medium text-indigo-ink"
              >
                <FileText className="h-3 w-3" aria-hidden />
                {s}
              </span>
            ))}
          </div>
        )}

        {msg.needHuman && (
          <a
            href="https://wa.me/6280000000000?text=Halo%20admin%20Batik%20Larasati"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-[#226e4f]/40 bg-[#226e4f] px-4 py-2 text-xs font-semibold text-white shadow-[0_4px_10px_-4px_rgba(34,110,79,0.5)] transition-transform active:scale-[0.96]"
          >
            <Phone className="h-3.5 w-3.5" aria-hidden />
            Hubungi Admin
          </a>
        )}
      </div>
    </div>
  );
}
