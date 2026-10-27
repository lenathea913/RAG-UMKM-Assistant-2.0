import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BadgePercent,
  Clock3,
  Gift,
  MessageCircle,
  Truck,
} from "lucide-react";

import { LogoMerak } from "@/components/logo-merak";

export const metadata: Metadata = {
  title: "Batik Larasati · Batik Tulis & Cap Pekalongan",
  description:
    "Butik batik tulis dan batik cap khas pesisir Pekalongan sejak 2015. Dilengkapi Rara, asisten AI yang menjawab 24/7 berdasarkan dokumen resmi toko.",
};

/**
 * Data di halaman ini — nama produk, kode, harga, kebijakan — diambil
 * langsung dari knowledge-base/ (katalog-produk.md, price-list.md,
 * faq-sop.md). Sengaja tidak dikarang agar konsisten dengan jawaban Rara.
 */
const HIGHLIGHTS = [
  {
    icon: Truck,
    title: "Gratis ongkir",
    desc: "Belanja di atas Rp 500.000 se-Jawa, di atas Rp 1.500.000 luar Jawa.",
  },
  {
    icon: Clock3,
    title: "Made to order",
    desc: "Batik tulis ditulis tangan, selesai dalam 2–3 minggu.",
  },
  {
    icon: BadgePercent,
    title: "Harga reseller",
    desc: "Diskon 15% min. 10 pcs untuk koleksi cap & ready to wear.",
  },
  {
    icon: Gift,
    title: "Wrapping kado",
    desc: "Gratis untuk koleksi ready to wear.",
  },
] as const;

const PRODUCTS = [
  {
    name: "Mega Mendung Premium",
    code: "BT-MM-001",
    desc: "Batik tulis · kain primissima · pewarna alami indigo",
    price: "Rp 1.850.000",
    img: "/aset/mega-mendung-premium.jpeg",
  },
  {
    name: "Buketan Klasik",
    code: "BT-BK-002",
    desc: "Batik tulis · motif khas pesisir, warna pastel",
    price: "Rp 1.450.000",
    img: "/aset/buketan-klasik.jpeg",
  },
  {
    name: "Mega Mendung Cap",
    code: "BC-MM-101",
    desc: "Batik cap · katun primissima",
    price: "Rp 385.000",
    img: "/aset/mega-mendung-cap.jpeg",
  },
  {
    name: "Kemeja Pria Parang Rusak",
    code: "RTW-KM-201",
    desc: "Ready to wear · ukuran M, L, XL, XXL",
    price: "Rp 425.000",
    img: "/aset/kemeja-parang-rusak.jpeg",
  },
] as const;

const CTA_CLASS =
  "inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-deep px-5 text-sm font-semibold text-white shadow-[0_4px_12px_-4px_rgba(47,68,112,0.55)] transition-all hover:bg-indigo-ink active:scale-[0.97]";

const GHOST_CLASS =
  "inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-surface px-5 text-sm font-semibold text-indigo-ink transition-colors hover:bg-indigo-mist/50";

export default function HomePage() {
  return (
    <div className="mega-mendung relative min-h-dvh overflow-hidden">
      {/* Latar halaman: background.jpeg dari folder aset — blur + opacity 50% */}
      <img
        src="/aset/background.jpeg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-50 blur-[6px]"
      />
      {/* Voil tipis agar teks & kartu tetap terbaca di atas motif */}
      <div className="pointer-events-none absolute inset-0 bg-canvas/45" />
      <div className="relative mx-auto w-full max-w-2xl px-4 pb-12">
        {/* Nav */}
        <header className="flex items-center gap-3 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-mist">
            <LogoMerak className="h-6 w-6 text-indigo-deep" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold tracking-[-0.01em] text-ink">
              Batik Larasati
            </p>
            <p className="text-xs text-ink-soft">Pekalongan</p>
          </div>
          <Link
            href="/chat"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-indigo-deep px-4 text-xs font-semibold text-white transition-colors hover:bg-indigo-ink"
          >
            Tanya Rara
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </header>

        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-line bg-surface p-6 shadow-[0_12px_32px_-16px_rgba(34,51,92,0.3)]">
          <LogoMerak
            className="pointer-events-none absolute -right-10 -top-12 h-56 w-56 rotate-6 text-indigo-deep opacity-[0.05]"
          />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-mist bg-indigo-mist/50 px-3 py-1 text-xs font-medium text-indigo-ink">
            Butik batik tulis &amp; cap · sejak 2015
          </span>
          <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.02em] text-ink">
            Batik Larasati
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Batik tulis &amp; cap khas pesisir Pekalongan, ditulis tangan oleh
            pengrajin lokal. Sekarang punya <strong>Rara</strong>, asisten AI
            yang menjawab tanya kamu 24 jam, berdasarkan dokumen resmi toko.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/chat" className={CTA_CLASS}>
              Tanya Rara sekarang
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="#koleksi" className={GHOST_CLASS}>
              Lihat koleksi
            </Link>
          </div>
        </section>

        {/* Info toko — fakta dari knowledge base */}
        <section className="mt-3 grid grid-cols-2 gap-3">
          {HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-line bg-surface p-4 shadow-[0_6px_16px_-12px_rgba(34,51,92,0.25)]"
            >
              <Icon className="h-4 w-4 text-indigo-deep" aria-hidden />
              <h2 className="mt-2 text-sm font-bold text-ink">{title}</h2>
              <p className="mt-0.5 text-xs leading-snug text-ink-soft">{desc}</p>
            </div>
          ))}
        </section>

        {/* Koleksi pilihan — harga resmi price-list.md */}
        <section id="koleksi" className="mt-8 scroll-mt-4">
          <h2 className="text-lg font-bold tracking-[-0.01em] text-ink">
            Koleksi pilihan
          </h2>
          <p className="mt-0.5 text-xs text-ink-soft">
            Harga resmi September 2026, belum termasuk ongkir.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {PRODUCTS.map((p) => (
              <div
                key={p.code}
                className="relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface p-4 shadow-[0_6px_16px_-12px_rgba(34,51,92,0.25)]"
              >
                {/* Motif sesuai nama produk — blur + opacity 50% */}
                <img
                  src={p.img}
                  alt=""
                  aria-hidden
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-50 blur-[3px]"
                />
                <div className="pointer-events-none absolute inset-0 bg-surface/50" />
                <div className="relative flex h-full flex-col">
                  {/* Ilustrasi motif — tampil jelas sebagai gambar produk */}
                  <div className="relative -mx-4 -mt-4 mb-3 h-24 overflow-hidden">
                    <img
                      src={p.img}
                      alt={`Motif ${p.name}`}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface/85 via-transparent to-transparent" />
                    <span className="absolute left-3 top-3 rounded-md bg-surface/90 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-indigo-ink shadow-sm">
                      {p.code}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-ink">{p.name}</h3>
                  <p className="mt-0.5 text-xs leading-snug text-ink-soft">
                    {p.desc}
                  </p>
                  <p className="mt-3 text-base font-extrabold text-indigo-ink">
                    {p.price}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-soft">
            Masih ada Dress Buketan &amp; Parang Rusak Cap.{" "}
            <Link
              href="/katalog"
              className="font-semibold text-indigo-deep underline underline-offset-2 hover:text-indigo-ink"
            >
              Lihat katalog lengkap &amp; harga reseller →
            </Link>{" "}
            atau tanya langsung ke Rara, Kak.
          </p>
        </section>

        {/* Kenalan dengan Rara */}
        <section className="mt-8 rounded-3xl border border-line bg-surface p-6 shadow-[0_12px_32px_-16px_rgba(34,51,92,0.3)]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-mist">
            <MessageCircle className="h-5 w-5 text-indigo-deep" aria-hidden />
          </div>
          <h2 className="mt-3 text-lg font-bold tracking-[-0.01em] text-ink">
            Kenalan dengan Rara
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-soft">
            <li className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-soft" />
              Jawabannya mengacu pada dokumen resmi toko. Harga dan info tidak
              dikarang.
            </li>
            <li className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-soft" />
              Kalau tidak tahu, Rara jujur lalu meneruskan pertanyaanmu ke
              admin.
            </li>
            <li className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-soft" />
              Admin membalas Senin–Sabtu 08.00–17.00 WIB, sedangkan Rara online
              24/7.
            </li>
          </ul>
          <Link href="/chat" className={`${CTA_CLASS} mt-5`}>
            Mulai chat
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </section>

        {/* Footer */}
        <footer className="mt-8 text-center">
          <p className="text-[11px] leading-snug text-ink-soft">
            Kamu bisa chat dengan asisten AI di halaman berikutnya. Jawaban
            mengacu pada dokumen resmi toko; untuk hal di luar itu, Rara akan
            meneruskan ke admin.
          </p>
          <p className="mt-2 text-[11px] font-semibold text-ink-soft">
            Batik Larasati Pekalongan · Senin–Sabtu 08.00–17.00 WIB
          </p>
        </footer>
      </div>
    </div>
  );
}
