# RAG-UMKM-Assistant-2.0

> Tema: **Productivity & Smart Business** — Hacktiv8 National Hackathon 2026 × IBM SkillsBuild

![Node.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs)
![Ollama](https://img.shields.io/badge/Ollama-Granite_3.3-lightgrey?logo=ollama)
![Gemini](https://img.shields.io/badge/LLM-Google_Gemini-blue?logo=google)
![Runtime](https://img.shields.io/badge/runtime-CPU-orange?label=100%25+CPU)
![Build](https://img.shields.io/badge/build-passing-green?label=build)
![Chat](https://img.shields.io/badge/chat-online-green?label=Rara%20AI%20chat)

Asisten layanan pelanggan UMKM berbahasa Indonesia — menjawab **hanya dari dokumen resmi toko** (harga, katalog, SOP), dan jujur menolak / meneruskan ke admin jika informasinya tidak ada. Backend RAG berjalan **lokal di Next.js**, tanpa Langflow, IBM Bob, atau vector store khusus — cukup Ollama (IBM Granite) atau Google Gemini, cukup dokumen Markdown.

Demo nyata: [Batik Larasati Pekalongan](https://github.com/lenathea913/RAG-UMKM-Assistant-2.0), toko batik tulis & cap yang dibangun sebagai contoh knowledge base.

---

## Apa yang dibangun

Pemilik UMKM tidak punya tim customer service — pertanyaan berulang (harga, stok, cara order, garansi) dijawab manual, dan di luar jam operasional pertanyaan menganggur. Solusinya: asisten AI yang *membaca* dokumen bisnis jadi jawaban akurat.

Yang membedakan dari chatbot generik:

- **Grounding ketat** — jawaban hanya dari dokumen bisnis, bukan pengetahuan model.
- **Anti-halusinasi terukur** — 7 kasus jebakan (diskon fiktif, nomor telepon, cabang, promo) **wajib ditolak dengan benar**; tidak satu pun fakta yang diarang.
- **Human-in-the-loop sebagai fitur** — pertanyaan di luar cakupan diakuin jujur dan dikasih opsi eskalasi ke manusia, bukan diimprovisasi.
- **Tanpa kode untuk pemilik** — cukup ganti dokumen, asisten ikut berubah.

---

## Arsitektur (sesudah RAG 2.0)

```
Pelanggan (HP/browser)
  │  chat
  ▼
Frontend Next.js
  │  POST /api/chat
  ▼
Backend Rara (lib/rag.ts)
  │  1. baca knowledge-base/*.md  →  2 korpus (semua dokumen toko)
  │  2. baca langflow/agent-system-prompt.md  →  system prompt Rara
  │  3. cari jawaban dari korpus; kalau tidak ada → tolak + eskalasi
  │  4. kirim ke LLM (Ollama / Gemini) dengan riwayat per sesi
  ▼
LLM (granite3.3:8b via Ollama, atau google/gemini via API)
  │  jawaban grounded + bahasa Indonesia + sapaan "Kak"
  ▼
Chat bubble + disclaimer AI tetap di bawah input
  Tambahan: tombol Hubungi Admin muncul otomatis saat jawaban gagal menemukan
```

Poin kunci arsitektur:

- **Tidak ada Langflow, tidak ada IBM Bob, tidak ada vector store** — hanya Next.js route handler + LLM API (lokal / cloud).
- **Dokumen dibaca utuh** dari folder `knowledge-base/`, bukan di-chunk/di-embed. Untuk toko kecil (beberapa dokumen pendek) pendekatan ini lebih sederhana dan lebih mudah dipahami — cocok untuk UMKM non-teknis.
- **Korpus diletakkan di pesan system** (setelah system prompt & konteks definisi toko), bukan di pesan user, supaya prefix prompt mirip antar request → model (terutama Ollama) dapat memanfaatkan prefix cache dan jawaban jadi lebih cepat.
- **Memory per sesi** disimpan di `sessionStorage` frontend dan dikirim tiap request, jadi Rara "mengingat" percakapan dalam satu tab.
- **Dua provider LLM**: Ollama lokal (offline, gratis, CPU) atau Gemini (cloud, cepat). Sakelar di `.env.local`. Backend tidak hardcode — cukup pilih `MODEL_PROVIDER=ollama` atau `google`.
- **Streaming** didukung (NDJSON untuk Ollama, SSE untuk Gemini) supaya jawaban muncul pelan-pelan.

Komponen produk yang terlihat pengguna:

- **Chat (Rara)** — `/`, asisten layanan pelanggan, dengan saran pertanyaan, loading, eskalasi otomatis, dan disclaimer AI.
- **Halaman home** — `/` juga pakai layout home (hero + fakta toko + koleksi produk + CTA ke chat).
- **Katalog & harga reseller** — `/katalog`, tabel harga lengkap dari dokumen resmi, plus tabel harga reseller (diskon 15% untuk batik cap & ready-to-wear; batik tulis tidak termasuk).
- **Dashboard pemilik** — `/admin`, upload dokumen & panel pertanyaan yang tidak terjawab (saat ini masih demo lokal di browser; integrasi penuh ke knowledge base menyusul).

---

## Cara menjalankan

### Prasyarat

- Node.js ≥ 20 (portable-repo menggunakan Node.js di `D:\Project\node-portable\`, masukkan ke PATH atau jalankan dari terminal yang sudah tau lokasinya).
- **Salah satu** dari:
  - **Ollama** jalan di `localhost:11434`, model sudah di-pull (mis. `ollama pull granite3.3:8b` atau `granite3.3:2b` untuk demo yang jauh lebih cepat).
  - **Atau** Google Gemini API key (bila pakai provider cloud).

### Setup (sekali)

```bash
cd frontend
npm install
cp .env.example .env.local
```

### Konfigurasi

Edit `.env.local` (file ini **tidak boleh di-commit**; sudah masuk `.gitignore`):

```ini
# Pilih salah satu:
MODEL_PROVIDER=ollama          # atau "google" kalau pakai Gemini

# Jalur Ollama (hanya dipakai kalau MODEL_PROVIDER=ollama)
OLLAMA_BASE_URL=http://localhost:11434

# Model (Ollama): set sesuai model yang di-pull
OLLAMA_MODEL=granite3.3:8b     # atau granite3.3:2b untuk lebih cepat

# API key Gemini (hanya dipakai kalau MODEL_PROVIDER=google)
GEMINI_API_KEY=               # isi kunci-mu; jangan di-commit

# Metadata toko (ganti sesuai toko yang didemokan)
STORE_NAME=Batik Larasati
STORE_TAGLINE=Batik tulis & cap · sejak 2015
STORE_SINCE=2015

# Nomer kontak admin (kalau pesan perlu eskalasi / nggak ada dokumen)
ADMIN_WHATSAPP=+62 878-7256-6458
ADMIN_NAME=Rara Admin
```

### Jalankan

```bash
cd frontend
npm run dev
```

Buka:

- `http://localhost:3000` — halaman utama & chat Rara.
- `http://localhost:3000/katalog` — katalog + harga reseller.
- `http://localhost:3000/admin` — dashboard pemilik.

### Cara tercepat kalau mau demo di Ollama

1. Pastikan Ollama jalan (`ollama serve`, atau aplikasi Ollama di system tray).
2. Pull model (satu kali): `ollama pull granite3.3:8b` (lebih tajam) atau `ollama pull granite3.3:2b` (lebih cepat, cocok kalau CPU terbatas).
3. `.env.local`: `MODEL_PROVIDER=ollama`, `OLLAMA_MODEL=granite3.3:8b` (atau `2b`).
4. `npm run dev` → tes: *"Berapa harga Mega Mendung Premium?"* → seharusnya **Rp 1.850.000**, dengan gaya jawaban Rara.

### Preferensi model untuk demo

- **granite3.3:8b** → kualitas tertinggi; cukup "hangat" (jalankan pertanyaan berurutan) kalau di CPU.
- **granite3.3:2b** → lebih cepat; cocok bila demo butuh respons singkat.
- **Gemini** → paling cepat bila koneksi bagus; jangan pakai bila kunci bermasalah / layanan gelembung.

### Jalankan via start.bat (Windows)

Repo sudah menyertakan `start.bat` yang mempermudah:

1. Cek Ollama: apakah port 11434 didengarkan, dan apakah model tersedia lewat HTTP.
2. **Jika pakai Gemini**, skip cek Ollama dan langsung lanjut ke langkah berikutnya.
3. **Preheat model** (Ollama) — satu request kecil sebelum chat, supaya jawaban pertama cepat; skip kalau pakai Gemini.
4. Jalankan `npm run dev`.

### Tanpa Ollama / tanpa API key

Chat tetap terbuka, tapi Rara menampilkan pesan ramah: *"Maaf Kak, koneksinya bermasalah. Coba lagi ya."* Cek `GET /api/chat` untuk melihat status preflight (Ollama hidup/mati, model, daftar dokumen).

---

## Struktur repo

```
RAG-UMKM-Assistant-2.0/
├── README.md                          ← file ini
├── start.bat                         ← jalanin di Windows dengan cek Ollama/Gemini otomatis
├── .gitignore
├── knowledge-base/                   ← dokumen bisnis toko contoh (sumber kebenaran Rara)
│   ├── katalog-produk.md
│   ├── price-list.md
│   └── faq-sop.md
├── langflow/
│   └── agent-system-prompt.md        ← system prompt Rara (sumber kebenaran; edit di sini)
├── evals/                            ← tes kualitas jawaban Rara
│   ├── eval-questions.md             ← 20 kasus uji (termasuk 7 kasus anti-halusinasi)
│   ├── eval-results.md               ← ringkasan hasil sesi terakhir
│   ├── run_evals.py                  ← jalankan: python evals/run_evals.py --all
│   └── eval-run-latest.json          ← hasil mentah sesi terakhir
├── bob/                              ← arsip developer tooling lama (bukan produk)
├── submission/                       ← paket submission hackathon
│   ├── pitch-draft.md
│   ├── pitch-deck-slides.md
│   ├── form-answers.md
│   ├── deskripsi-singkat.md
│   └── screenshots/
└── frontend/
    ├── package.json
    ├── .env.example                  ← templat .env.local (tanpa kunci)
    ├── .gitignore
    ├── README.md                     ← ringkasan frontend
    └── app/
        ├── layout.tsx               ← metadata halaman
        ├── globals.css              ← token warna & tipografi toko
        ├── page.tsx                 ← Home + chat Rara
        ├── katalog/page.tsx         ← Katalog & harga reseller
        ├── admin/page.tsx           ← Dashboard pemilik
        ├── api/chat/route.ts        ← Backend Rara (single point of truth)
        ├── components/
        │   ├── ui/raised-button.tsx
        │   └── logo-merak.tsx
        └── lib/
            ├── rag.ts               ← RAG lokal, per-provider LLM, streaming, memory
            └── ...                  ← util color, dsb.
```

---

## Evaluasi kualitas (kriteria juri)

Evaluasi jawaban Rara dijalankan lewat `evals/run_evals.py --all` (tanpa API key Langflow). 20 kasus uji:

- **A — Grounding**: jawaban sesuai dokumen.
- **B — Multi-dokumen**: gabung info 2 dokumen.
- **C — Anti-halusinasi (WAJIB lulus semua)**: menolak/meng-eskalasi, tidak mengarang.
- **D — Bahasa & persona**: tetap Bahasa Indonesia, sapaan "Kak", tetap grounded.

Hasil terakhir: lihat `evals/eval-results.md` deskripsi hasil & catatan.

Aturan singkat: sebelum merubah prompt atau dokumen, jalankan ulang evaluasi; kasus C wajib lulus semua. `eval-results.md` wajib diperbarui tiap kali dijalankan ulang.

---

## Bahasa & gaya

- Semua teks UI & jawaban dalam Bahasa Indonesia.
- Nada ramah, sapaan "Kak".
- Tidak pakai tanda hubung panjang (em dash); ditulis dengan koma, titik, atau kata sambung biasa, di seluruh sumber yang terlihat pengguna.

---

## Catatan soal IBM / Langflow / Bob

Project ini dulunya dibangun dengan IBM Langflow + IBM Bob sebagai pipeline RAG visual. Versi ini (RAG 2.0) sudah **tidak bergantung** pada keduanya lagi — backendnya Next.js. Folder `langflow/` saat ini hanya menyimpan *system prompt* sebagai sumber kebenaran dan dokumen pendamping. Folder `bob/` masih ada sebagai arsip developer tool lama (bukan produk akhir).

---

## Security & kredensial

- **Kunci API & file env tidak pernah di-commit.** `.env.local` tidak ter-track, dan `.gitignore` melindunginya.
- Jangan pernah menyalin `.env.local` ke `.env.example` atau kode.
- Eval: `run_evals.py` beroperasi tanpa kunci API ketiga (hanya Ollama atau Gemini sesuai konfigurasi lokal).

---

## Repo ini untuk tugas / submission

Repo ini dibuat sebagai projek UTS kamu (nanti bisa dipublikasi jika diminta oleh dosen / panitia). Tiru toko, dokumen, dan logo sesuai permintaan. Saat dipublikasi: public kan repo jika diminta reviewer; jangan sampai melekat kunci API.

---

## Changelog singkat (RAG 2.0)

Perubahan utama di versi ini dibanding repo lama:

- Backend RAG lokal di Next.js: `frontend/lib/rag.ts` baca `knowledge-base/*.md`, pakai system prompt dari `langflow/agent-system-prompt.md`, panggil Ollama/Gemini.
- Hapus ketergantungan Langflow & IBM Bob dari backend (`frontend/lib/langflow.ts` dihapus, `api/chat/route.ts` bukan proxy Langflow lagi).
- Streaming endpoint (`POST /api/chat`, mode NDJSON untuk Ollama / SSE untuk Gemini).
- Korpus dipindah supaya prefix prompt identik antar request (lebih cepat di Ollama).
- Eval: `run_evals.py` berjalan tanpa `LANGFLOW_API_KEY`.
- Halaman: `/`, `/katalog`, `/admin` lengkap + aset motif batik di `frontend/public/aset`.
- Dokumentasi: README GitHub + cara menjalankan + arsitektur, bebas em dash di semua teks yang terlihat pengguna.

---

## Status

- [x] Backend RAG 2.0 (tanpa Langflow/Bob)
- [x] Streaming (NDJSON / SSE)
- [x] Multi-provider (ollama / gemini)
- [x] Eval 20 kasus + anti-halusinasi
- [ ] Integrasi penyimpanan server untuk panel admin (plan berikutnya)
