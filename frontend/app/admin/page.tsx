"use client";

import { useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  FileText,
  Inbox,
  MessageCircleQuestion,
  UploadCloud,
} from "lucide-react";

import { RaisedButton } from "@/components/ui/raised-button";
import { LogoMerak } from "@/components/logo-merak";

type Unanswered = { id: string; question: string; time: string };

const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export default function AdminPage() {
  const [items, setItems] = useState<Unanswered[]>([]);
  const [files, setFiles] = useState<{ name: string; size: number }[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  function refreshEscalations() {
    try {
      const raw = localStorage.getItem("umkm_escalations");
      setItems(raw ? JSON.parse(raw) : []);
    } catch {
      setItems([]);
    }
  }

  function addDemo() {
    const demo: Unanswered[] = JSON.parse(
      localStorage.getItem("umkm_escalations") ?? "[]",
    );
    demo.unshift({
      id: newId(),
      question: "Bisa custom motif warna biru untuk pesanan kantor?",
      time: new Date().toLocaleTimeString("id-ID"),
    });
    localStorage.setItem("umkm_escalations", JSON.stringify(demo));
    refreshEscalations();
  }

  function handleFiles(list: FileList | null) {
    if (!list?.length) return;
    setUploading(true);
    // v0: belum benar-benar masuk Knowledge Base — demo alurnya dulu.
    setTimeout(() => {
      setFiles((f) => [
        ...f,
        ...Array.from(list).map((file) => ({ name: file.name, size: file.size })),
      ]);
      setUploading(false);
    }, 900);
  }

  return (
    <div className="mega-mendung min-h-dvh">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <header className="mb-8">
          <a
            href="/"
            className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft transition-colors hover:text-indigo-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Kembali ke Chat Rara
          </a>
          <h1 className="flex items-center gap-2.5 text-2xl font-extrabold tracking-[-0.02em] text-ink">
            <LogoMerak className="h-7 w-7 text-indigo-deep" />
            Dashboard Pemilik
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Batik Larasati — kelola dokumen, pantau pertanyaan yang belum
            terjawab asisten.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Upload dokumen */}
          <section className="flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-[0_10px_28px_-16px_rgba(34,51,92,0.28)]">
            <div className="mb-1 flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-deep" aria-hidden />
              <h2 className="font-bold tracking-[-0.01em] text-ink">
                Dokumen Toko
              </h2>
            </div>
            <p className="mb-4 text-xs text-ink-soft">
              Katalog, price list, FAQ/SOP. Asisten hanya menjawab dari dokumen
              ini.
            </p>

            <button
              type="button"
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFiles(e.dataTransfer.files);
              }}
              onClick={() => fileInput.current?.click()}
              className={`flex w-full flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
                dragOver
                  ? "border-indigo-soft bg-indigo-mist/60"
                  : "border-line hover:border-indigo-soft"
              }`}
            >
              {uploading ? (
                <span className="flex items-center gap-2 text-sm text-ink-soft">
                  <UploadCloud className="h-4 w-4 animate-pulse" aria-hidden />
                  Memproses…
                </span>
              ) : (
                <>
                  <UploadCloud className="h-6 w-6 text-indigo-deep" aria-hidden />
                  <span className="mt-2 text-sm font-medium text-ink">
                    Tarik file ke sini, atau klik untuk pilih
                  </span>
                  <span className="mt-1 text-xs text-ink-soft">
                    PDF / Markdown / TXT
                  </span>
                </>
              )}
              <input
                ref={fileInput}
                type="file"
                multiple
                accept=".pdf,.md,.txt,.docx"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </button>

            {files.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {files.map((f) => (
                  <li
                    key={f.name + f.size}
                    className="flex items-center justify-between rounded-lg bg-canvas px-3 py-2 text-xs"
                  >
                    <span className="flex min-w-0 items-center gap-1.5 text-ink">
                      <FileText className="h-3 w-3 shrink-0 text-indigo-deep" aria-hidden />
                      <span className="truncate">{f.name}</span>
                    </span>
                    <span className="ml-2 shrink-0 text-ink-soft">
                      {(f.size / 1024).toFixed(0)} KB
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Panel eskalasi */}
          <section className="flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-[0_10px_28px_-16px_rgba(34,51,92,0.28)]">
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircleQuestion
                  className="h-4 w-4 text-clay"
                  aria-hidden
                />
                <h2 className="font-bold tracking-[-0.01em] text-ink">
                  Belum Terjawab
                </h2>
              </div>
              <button
                onClick={refreshEscalations}
                className="text-xs font-medium text-indigo-deep hover:underline"
              >
                Muat ulang
              </button>
            </div>
            <p className="mb-4 text-xs text-ink-soft">
              Pertanyaan pelanggan yang tidak bisa dijawab dari dokumen — sinyal
              dokumen baru perlu ditambahkan.
            </p>

            <div className="mb-3">
              <RaisedButton
                size="sm"
                color="#2f4470"
                variant="default"
                onClick={addDemo}
                className="text-xs"
              >
                Tambah contoh data
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              </RaisedButton>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-xl bg-canvas px-4 py-8 text-center">
                <Inbox className="h-5 w-5 text-indigo-soft" aria-hidden />
                <p className="mt-2 text-sm font-medium text-ink-soft">
                  Belum ada pertanyaan yang terescalasi
                </p>
                <p className="mt-0.5 text-xs text-ink-soft/80">
                  Semua pertanyaan pelanggan terjawab oleh dokumen.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {items.map((it) => (
                  <li
                    key={it.id}
                    className="rounded-xl border border-clay/25 bg-clay/10 px-3 py-2.5 text-sm"
                  >
                    <p className="text-ink">“{it.question}”</p>
                    <p className="mt-0.5 text-[11px] text-ink-soft">
                      {it.time} · perlu ditindaklanjuti admin
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <p className="mt-8 text-center text-[11px] text-ink-soft">
          v0 demo — upload & eskalasi masih lokal di browser; integrasi penuh ke
          Knowledge Base menyusul.
        </p>
      </div>
    </div>
  );
}
