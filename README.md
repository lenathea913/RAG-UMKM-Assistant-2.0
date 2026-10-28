# RAG-UMKM-Assistant-2.0

> Tema: **Productivity & Smart Business** 

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs)
![IBM Granite](https://img.shields.io/badge/Model-IBM%20Granite_3.3-lightgrey?logo=ibm)
![Gemini](https://img.shields.io/badge/LLM-Google_Gemini-blue?logo=google)
![Ollama](https://img.shields.io/badge/Ollama-local-lightgrey?logo=ollama)
![Runtime](https://img.shields.io/badge/runtime-CPU-orange?label=100%25+CPU)
![Build](https://img.shields.io/badge/build-passing-green?label=build)
![Chat](https://img.shields.io/badge/chat-online-green?label=Rara%20AI%20chat)
![Architecture](https://img.shields.io/badge/architecture-diagram-blue?logo=readme)

Asisten layanan pelanggan UMKM berbahasa Indonesia — menjawab **hanya dari dokumen resmi toko** (harga, katalog, SOP), dan jujur menolak / meneruskan ke admin jika informasinya tidak ada. Backend RAG berjalan **lokal di Next.js**, tanpa Langflow, IBM Bob, atau vector store khusus — cukup Ollama (IBM Granite) atau Google Gemini, cukup dokumen Markdown.

Demo nyata: [Batik Larasati Pekalongan](https://github.com/lenathea913/RAG-UMKM-Assistant-2.0), toko batik tulis & cap yang dibangun sebagai contoh knowledge base.

---

## Diagram arsitektur

Ada diagram interaktif yang dibuat dengan Archify:

- [Arsitektur RAG UMKM Assistant 2.0](.archify/architecture-rag-umkm-assistant-20261028-092326/rag-umkm-assistant.html) — alur pelanggan → halaman Next.js → `POST /api/chat` → orkestrator RAG (`lib/rag.ts`) → Ollama/Gemini, plus riwayat sesi, eskalasi WhatsApp, dan jalur eval.

Buka file HTML itu di browser (bisa dikirim ke orang lain, semua interaksi ikut serta).

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
# edit .env.local: pilih LLM_PROVIDER=ollama atau google, sesuaikan OLLAMA_MODEL / GEMINI_API_KEY
npm run dev
```

Bisa juga klik `start.bat` (development) atau `start.bat prod` (produksi) dari Windows Explorer.

Buka:

- `http://localhost:3000` — halaman utama & chat Rara.
- `http://localhost:3000/katalog` — katalog produk & harga reseller.
- `http://localhost:3000/admin` — dashboard pemilik.

> Node.js di mesin ini portable, ada di `D:\Project\node-portable`. Tambahkan ke PATH atau jalankan lewat terminal yang sudah tahu lokasinya.

---

## Pilih LLM

Dua pilihan, setel di `.env.local` (isi satu blok sesuai yang dipakai):

### Ollama lokal (offline, gratis, 100% CPU)

```ini
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=granite3.3:8b      # atau granite3.3:2b untuk lebih cepat
```

Pastikan Ollama jalan (`ollama serve` / aplikasi Ollama) dan model sudah di-pull:

```bash
ollama pull granite3.3:8b        # kualitas lebih baik, lebih berat
ollama pull granite3.3:2b        # lebih cepat; cocok kalau CPU terbatas
```

### Gemini (cloud, tercepat bila koneksi bagus)

```ini
LLM_PROVIDER=google
GEMINI_API_KEY=isi-kunci-mu-disini
```

Bila `LLM_PROVIDER=google`, cek Ollama **tidak diperlukan** — `start.bat` dan backend otomatis lewati langkah Ollama.

---

## Konfigurasi toko

`.env.local` juga memuat metadata toko yang jadi sumber kebenaran Rara dan teks UI. Ikuti `.env.example` dan sesuaikan:

```ini
STORE_NAME=Batik Larasati Pekalongan
STORE_TAGLINE=Batik tulis & cap khas pesisir Pekalongan, ditulis tangan oleh pengrajin setempat
STORE_SINCE=2015
ADMIN_WHATSAPP=+6287872566458
ADMIN_NAME=Rara
DISCLAIMER_AI=Bot AI layanan pelanggan
```

Metadata ini muncul langsung di UI dan jadi pembeda produk — jadi setel di sini, bukan hardcode di kode.

---

## Knowledge base

Dokumen toko ada di `knowledge-base/`:

- `katalog-produk.md` — daftar produk & kode.
- `price-list.md` — harga resmi & harga reseller.
- `faq-sop.md` — FAQ & SOP layanan pelanggan.

Backend membaca file-file ini tiap request, jadi perubahan langsung efektif tanpa restart.

Untuk menambah produk/harga/aturan baru:

1. Edit file Markdown di `knowledge-base/`.
2. Simpan.
3. Coba tanya Rara soal yang baru — jawaban sudah sesuai.

Untuk perubahan aturan perilaku Rara (gaya jawaban, aturan penolakan, contoh kasus), edit `langflow/agent-system-prompt.md` — file ini tetap jadi sumber kebenaran prompt meski tidak pakai Langflow lagi.

---

## Evaluasi

Kualitas jawaban Rara diukur dengan 20 kasus uji yang ada di `evals/`.

- `evals/eval-questions.md` — daftar soal plus kriteria lulus tiap kasus.
- `evals/run_evals.py` — jalankan dari root repo:

  ```bash
  python evals/run_evals.py --all
  ```

  Tanpa perlu `LANGFLOW_API_KEY` (backend sekarang bukan Langflow).

- `evals/eval-results.md` — ringkasan hasil terakhir, termasuk catatan kasus.
- `evals/eval-run-latest.json` — hasil mentah sesi terakhir.

**Aturan utama**: jalankan ulang evaluasi sebelum dan sesudah mengubah dokumen atau prompt. **Kasus C (anti-halusinasi) wajib lulus semua** — itu kriteria penilaian & product differentiation.

---

## Tampilan & aset toko

Halaman depan menggunakan latar belakang dan ilustrasi motif batik dari folder `frontend/public/aset/`. Setiap produk di koleksi dan di kartu produk menggunakan gambarnya sendiri, dipasang sebagai mini background kartu (blur + opacity 50%):

| Produk | File aset |
|---|---|
| Mega Mendung Premium | `frontend/public/aset/mega-mendung-premium.jpeg` |
| Buketan Klasik | `frontend/public/aset/buketan-klasik.jpeg` |
| Mega Mendung Cap | `frontend/public/aset/mega-mendung-cap.jpeg` |
| Kemeja Parang Rusak | `frontend/public/aset/kemeja-parang-rusak.jpeg` |

Latar halaman utama pakai `frontend/public/aset/background.jpeg`. Jika ingin mengganti suasana toko, ganti file-file itu (atau setel ulang `STORE_*` di `.env.local` untuk teks).

---

## Aturan produk (ini dinilai)

1. Tampilkan indikator asisten AI (disclaimer kecil di chat).
2. Tampilkan jawaban apa adanya — termasuk bila asisten bilang "informasi belum ditemukan, diteruskan ke admin". Itu **fitur**, jangan disembunyikan.
3. Sediakan tombol **Hubungi Admin** (eskalasi manusia) di chat.
4. **Jangan pernah minta / menyimpan data pribadi pelanggan** di frontend.
5. Semua teks UI dalam Bahasa Indonesia, nada ramah ("Kak").
6. Tiap kali ubah prompt atau dokumen → jalankan ulang `evals/run_evals.py --all`, laporkan di `evals/eval-results.md`, lalu commit.

---

## Status & roadmap

Sudah jalan:

- Backend RAG 2.0 (Next.js, tanpa Langflow/Bob).
- Multi-provider: Ollama (Granite 3.3 2b / 8b) dan Gemini.
- Streaming endpoint (NDJSON Ollama / SSE Gemini).
- Eval 20 kasus termasuk 7 anti-halusinasi.
- Halaman home, chat, katalog, admin, motif batik.
- Diagram arsitektur interaktif (Archify).

Sedang dikerjakan (bisa kamu lanjutkan):

- Panel admin integrasi ke knowledge base & penyimpanan server (sekarang masih demo localStorage).
- Eksperimen berbagai model & metode grounding.
- Skrip evaluasi & kasus uji yang lebih tajam.

---

## Folder penting

| Path | Menjadi apa |
|---|---|
| `frontend/app/api/chat/route.ts` | Backend Rara — single entrypoint |
| `frontend/lib/rag.ts` | Logika RAG: baca dokumen, baca prompt, susun prompt, multi-provider, streaming, memory |
| `knowledge-base/*.md` | Dokumen bisnis toko — sumber kebenaran jawaban Rara |
| `langflow/agent-system-prompt.md` | System prompt Rara — sumber kebenaran gaya & aturan |
| `evals/` | Evaluasi kualitas jawaban (termasuk 7 kasus anti-halusinasi) |
| `submission/` | Paket submission hackathon (arsip; lihat isinya jika relevan) |
| `submission/screenshots/` | Placeholder screenshot untuk submission (nanti diisi) |

Arsip yang perlu kamu tahu tapi biasanya tidak disentuh:

- `langflow/UMKM-Assistant-export.json` — export flow Langflow lama.
- `langflow/BUILD-GUIDE.md` — dokumentasi cara membangun flow Langflow versi lama.
- `bob/` — konfigurasi IBM Bob (developer tooling, bukan produk).

---

## Submission & dokumentasi pendukung

- `submission/pitch-deck-slides.md` — isi teks 10 slide pitch deck, siap salin ke Canva/PowerPoint.
- `submission/form-answers.md` — jawaban form submission, jadi siap tempel.
- `submission/deskripsi-singkat.md` — deskripsi singkat project.
- `submission/pitch-draft.md` — draf narasi pitch.
- `submission/screenshots/README.md` — panduan ambil 5 gambar screenshot untuk submission.
- `PANDUAN-FRONTEND.md` — panduan onboarding developer yang lebih panjang.

---

## Repositori

- Repo utama: https://github.com/lenathea913/RAG-UMKM-Assistant-2.0
- Demo toko contoh: [Batik Larasati Pekalongan](https://github.com/lenathea913/RAG-UMKM-Assistant-2.0)
- Repo pendahulunya (versi Langflow/IBM Bob): https://github.com/lenathea913/umkm-assistant

---



