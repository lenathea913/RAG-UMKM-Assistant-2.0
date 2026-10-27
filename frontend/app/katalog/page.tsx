import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BadgePercent, CreditCard, Truck } from "lucide-react";

import { LogoMerak } from "@/components/logo-merak";

export const metadata: Metadata = {
  title: "Katalog & Daftar Harga · Batik Larasati",
  description:
    "Daftar harga resmi Batik Larasati Pekalongan: batik tulis, batik cap, ready to wear, dan harga reseller min. 10 pcs.",
};

/**
 * Semua isi halaman ini diambil persis dari knowledge-base/price-list.md
 * (berlaku 1 September 2026). Harga reseller = harga reguler − 15% untuk
 * batik cap & ready to wear sesuai ketentuan dokumen; batik tulis tidak
 * termasuk program reseller.
 */
type Item = {
  name: string;
  code: string;
  price: string;
  img: string;
  reseller: string | null;
};

const KATEGORI: { title: string; note: string; items: Item[] }[] = [
  {
    title: "Batik Tulis",
    note: "Ditulis tangan penuh · made to order 2–3 minggu",
    items: [
      {
        name: "Mega Mendung Premium",
        code: "BT-MM-001",
        price: "Rp 1.850.000",
        img: "/aset/mega-mendung-premium.jpeg",
        reseller: null,
      },
      {
        name: "Buketan Klasik",
        code: "BT-BK-002",
        price: "Rp 1.450.000",
        img: "/aset/buketan-klasik.jpeg",
        reseller: null,
      },
    ],
  },
  {
    title: "Batik Cap",
    note: "Kain katun · pewarna aman",
    items: [
      {
        name: "Mega Mendung Cap",
        code: "BC-MM-101",
        price: "Rp 385.000",
        img: "/aset/mega-mendung-cap.jpeg",
        reseller: "Rp 327.250",
      },
      {
        name: "Parang Rusak Cap",
        code: "BC-PR-102",
        price: "Rp 350.000",
        img: "/aset/parang-rusak-cap.jpeg",
        reseller: "Rp 297.500",
      },
    ],
  },
  {
    title: "Ready to Wear",
    note: "Siap pakai · wrapping kado gratis",
    items: [
      {
        name: "Kemeja Pria Parang Rusak",
        code: "RTW-KM-201",
        price: "Rp 425.000",
        img: "/aset/kemeja-parang-rusak.jpeg",
        reseller: "Rp 361.250",
      },
      {
        name: "Dress Wanita Buketan",
        code: "RTW-DR-202",
        price: "Rp 465.000",
        img: "/aset/dress-wanita-buketan.jpeg",
        reseller: "Rp 395.250",
      },
    ],
  },
];

const SEMUA_ITEM = KATEGORI.flatMap((k) => k.items);

const CARA_BAYAR = [
  {
    icon: CreditCard,
    title: "Pembayaran",
    desc: "Transfer bank (BCA, BRI, BSI) atau QRIS.",
  },
  {
    icon: Truck,
    title: "Gratis ongkir",
    desc: "Di atas Rp 500.000 ke seluruh Jawa; di atas Rp 1.500.000 ke luar Jawa.",
  },
  {
    icon: BadgePercent,
    title: "Promo bundling",
    desc: "Beli kemeja + dress dapat potongan Rp 50.000.",
  },
] as const;

const CARD =
  "rounded-2xl border border-line bg-surface p-4 shadow-[0_6px_16px_-12px_rgba(34,51,92,0.25)]";

export default function KatalogPage() {
  return (
    <div className="mega-mendung relative min-h-dvh overflow-hidden">
      {/* Latar: motif background.jpeg dari folder aset — blur + opacity 50% */}
      <img
        src="/aset/background.jpeg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-50 blur-[6px]"
      />
      <div className="pointer-events-none absolute inset-0 bg-canvas/45" />

      <div className="relative mx-auto w-full max-w-2xl px-4 pb-12">
        {/* Nav */}
        <header className="flex items-center gap-3 py-4">
          <Link
            href="/"
            aria-label="Kembali ke halaman utama"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-mist transition-colors hover:bg-indigo-mist/70"
          >
            <LogoMerak className="h-6 w-6 text-indigo-deep" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[15px] font-bold tracking-[-0.01em] text-ink">
              Katalog &amp; Daftar Harga
            </h1>
            <p className="text-xs text-ink-soft">Batik Larasati Pekalongan</p>
          </div>
          <Link
            href="/chat"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-indigo-deep px-4 text-xs font-semibold text-white transition-colors hover:bg-indigo-ink"
          >
            Tanya Rara
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </header>

        {/* Intro */}
        <section className={CARD}>
          <h2 className="text-lg font-bold tracking-[-0.01em] text-ink">
            Daftar Harga Resmi
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-ink-soft">
            Berlaku mulai 1 September 2026. Harga dalam Rupiah, belum termasuk
            ongkir. Untuk stok &amp; ukuran, tanya langsung ke Rara.
          </p>
        </section>

        {/* Tabel per kategori */}
        {KATEGORI.map((kat) => (
          <section key={kat.title} className={`${CARD} mt-3`}>
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-base font-bold text-ink">{kat.title}</h2>
              <p className="text-right text-[11px] text-ink-soft">{kat.note}</p>
            </div>
            <div className="thin-scroll mt-3 overflow-x-auto">
              <table className="w-full min-w-[300px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-[11px] uppercase tracking-wide text-ink-soft">
                    <th className="pb-2 font-semibold">Produk</th>
                    <th className="pb-2 font-semibold">Kode</th>
                    <th className="pb-2 text-right font-semibold">Harga</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {kat.items.map((it) => (
                    <tr key={it.code}>
                      <td className="py-2.5 pr-3">
                        <span className="flex items-center gap-2.5">
                          <img
                            src={it.img}
                            alt={`Motif ${it.name}`}
                            className="h-9 w-9 shrink-0 rounded-lg border border-line object-cover"
                          />
                          <span className="text-sm font-semibold text-ink">
                            {it.name}
                          </span>
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-xs tracking-wide text-ink-soft">
                        {it.code}
                      </td>
                      <td className="py-2.5 text-right text-sm font-bold text-indigo-ink">
                        {it.price}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        {/* Harga reseller */}
        <section className={`${CARD} mt-3`}>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-mist">
              <BadgePercent className="h-4 w-4 text-indigo-deep" aria-hidden />
            </span>
            <h2 className="text-base font-bold text-ink">Harga Reseller</h2>
          </div>
          <ul className="mt-2 space-y-1 text-xs leading-relaxed text-ink-soft">
            <li>• Pembelian minimal 10 pcs, boleh campur kode.</li>
            <li>
              • Diskon 15% dari harga reguler untuk <strong>batik cap</strong> dan{" "}
              <strong>ready to wear</strong>.
            </li>
            <li>• Batik tulis TIDAK termasuk program reseller.</li>
          </ul>

          <div className="thin-scroll mt-3 overflow-x-auto">
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[11px] uppercase tracking-wide text-ink-soft">
                  <th className="pb-2 font-semibold">Produk</th>
                  <th className="pb-2 text-right font-semibold">Reguler</th>
                  <th className="pb-2 text-right font-semibold">
                    Reseller −15%
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {SEMUA_ITEM.map((it) => (
                  <tr key={it.code}>
                    <td className="py-2.5 pr-3">
                      <span className="block text-sm font-semibold text-ink">
                        {it.name}
                      </span>
                      <span className="block text-[11px] tracking-wide text-ink-soft">
                        {it.code}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-xs text-ink-soft">
                      {it.price}
                    </td>
                    <td className="py-2.5 text-right">
                      {it.reseller ? (
                        <span className="text-sm font-bold text-indigo-ink">
                          {it.reseller}
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-clay-deep">
                          tidak termasuk
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Pembayaran & promo */}
        <section className={`${CARD} mt-3`}>
          <h2 className="text-base font-bold text-ink">Pembayaran &amp; Promo</h2>
          <div className="mt-3 space-y-3">
            {CARA_BAYAR.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-2.5">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-mist/70">
                  <Icon className="h-3.5 w-3.5 text-indigo-deep" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{title}</p>
                  <p className="text-xs leading-relaxed text-ink-soft">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-3 rounded-2xl border border-indigo-soft/50 bg-indigo-deep p-5 text-white shadow-[0_10px_28px_-14px_rgba(47,68,112,0.6)]">
          <p className="text-sm font-semibold">
            Siap pesan atau mau tanya stok?
          </p>
          <p className="mt-1 text-xs leading-relaxed text-indigo-mist">
            Rara menjawab 24 jam berdasarkan dokumen resmi toko, dari harga
            sampai cara order.
          </p>
          <Link
            href="/chat"
            className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-surface px-4 text-sm font-semibold text-indigo-ink transition-transform hover:bg-white active:scale-[0.97]"
          >
            Tanya Rara sekarang
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </section>

        {/* Footer */}
        <footer className="mt-8 text-center">
          <p className="text-[11px] leading-snug text-ink-soft">
            Harga &amp; kebijakan di halaman ini mengikuti dokumen resmi toko;
            untuk hal di luar itu, Rara akan meneruskan ke admin.
          </p>
          <p className="mt-2 text-[11px] font-semibold text-ink-soft">
            Batik Larasati Pekalongan · Senin–Sabtu 08.00–17.00 WIB
          </p>
        </footer>
      </div>
    </div>
  );
}
