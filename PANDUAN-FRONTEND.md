# Panduan Onboarding — RAG-UMKM-Assistant-2.0

> Dokumen ini untuk **kamu** yang akan menjalankan dan melanjutkan project ini
> dari sisi developer — baca sampai habis sebelum koding. Semuanya penting. 🙂

---

## 1. Project dalam 60 detik

**RAG-UMKM-Assistant-2.0** = asisten layanan pelanggan UMKM berbahasa Indonesia.
Pemilik bisnis upload dokumen (katalog, harga, FAQ) → asisten **Rara** menjawab
pertanyaan pelanggan 24/7 dalam Bahasa Indonesia, **hanya berdasarkan isi dokumen**
(RAG). Kalau informasi tidak ada di dokumen, asisten **jujur menolak dan menawarkan
eskalasi ke manusia** — tanpa mengarang. Inilah pembeda utama di rubrik **Responsible AI**.

- **Konteks asal**: submission Hacktiv8 National Hackathon 2026 (tema
  *Productivity & Smart Business*), kolaborasi IBM SkillsBuild.
- **Stack sekarang**: Next.js + backend RAG lokal di route handler, Ollama (IBM
  Granite) dan/atau Google Gemini sebagai LLM, dokumen Markdown sebagai knowledge
  base. **Tidak ada Langflow, tidak ada IBM Bob.**
- **Yang sebelumnya ada**: versi lama dibangun dengan IBM Langflow + IBM Bob.
  Sekarang sudah dibongkar jadi backend Next.js. Folder `langflow/` hanya menyimpan
  system prompt sebagai sumber kebenaran (bukan alat runtime). Folder `bob/` adalah
  arsip developer tooling lama.

---

## 2. Arsitektur (yang perlu kamu tahu)

```
Pelanggan (browser/ HP)
   │  chat
   ▼
FRONTEND Next.js (Rara UI + halaman home/katalog/admin)
   │  POST /api/chat
   ▼
BACKEND Rara (frontend/app/api/chat/route.ts)
   │
   ├─ 1. Baca knowledge-base/*.md   →  korpus dokumen toko (semua dokumen)
   ├─ 2. Baca langflow/agent-system-prompt.md   →  system prompt Rara
   ├─ 3. Susun prompt: system → konteks toko → korpus → riwayat sesi → pertanyaan
   ├─      (korpus di pesan system, supaya prefix cache inter-request jalan)
   ├─ 4. Kirim ke LLM (Ollama atau Gemini)
   │
   ▼
LLM (granite3.3:8b via Ollama / Google Gemini)
   │  jawaban grounded + Bahasa Indonesia + sapaan "Kak"
   ▼
Chat bubble + disclaimer AI permanen + tombol Hubungi Admin (jika perlu)
```

Poin arsitektur utama:

- **Backend mini & sederhana**: satu route handler (`POST /api/chat`) yang lakukan
  pembacaan dokumen + penyusunan prompt + LLM call.
- **Tidak ada vector store, tidak ada langflow, tidak ada MCP server** — karena
  cukup baca dokumen Markdown langsung. Bagi toko UMKM kecil ini lebih sederhana
  dan lebih mudah dijelaskan (dan di-audit).
- **Dua provider LLM**: pilih di `.env.local` — `ollama` (lokal, offline, gratis,
  100% CPU) atau `google` (Gemini, cloud, cepat). Backend multi-provider
  (`frontend/lib/rag.ts`).
- **Streaming** didukung: endpoint membedakan NDJSON (Ollama) dan SSE (Gemini)
  bila client memungkinkan; fallback jawaban penuh bila tidak.
- **Memory sesi** ada di sebagian `sessionStorage` frontend, dikirim tiap request
  supaya Rara "mengingat" percakapan dalam satu tab.
- **Dokumen & prompt bersifat live**: dibaca tiap request, jadi perubahan langsung
  efektif tanpa restart.

Folder penting:

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

## 3. Setup dari nol (Ollama / Gemini)

### Prasyarat umum

- Node.js ≥ 20 (mesin ini pakai Node.js portable di
  `D:\Project\node-portable`; masukkan ke PATH atau jalankan από terminal yang
  tau lokasinya).
- Python 3.10+ jika mau jalankan `evals/run_evals.py` (bukan wajib untuk run app).

### Jalankan aplikasi

```bash
cd frontend
npm install
cp .env.example .env.local
# edit .env.local sesuai pilihan provider di bawah
npm run dev
```

Akses:

- `http://localhost:3000` — halaman utama & chat Rara.
- `http://localhost:3000/katalog` — katalog produk & harga reseller.
- `http://localhost:3000/admin` — dashboard pemilik (demo lokal di browser).

### Pilihan A — Ollama lokal

1. Install Ollama (ollama.com) → server jalan `http://localhost:11434`.
2. Pull model:
   - `ollama pull granite3.3:8b` → kualitas lebih baik (lebih berat di CPU).
   - `ollama pull granite3.3:2b` → lebih cepat, cocok kalau CPU terbatas.
3. `.env.local`:
   ```ini
   MODEL_PROVIDER=ollama
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=granite3.3:8b     # atau 2b
   ```
4. Pastikan aplikasi sudah jalan, tes: *"Berapa harga Mega Mendung Premium?"*
   seharusnya jawab **Rp 1.850.000** dengan gaya Rara.

### Pilihan B — Gemini

1. Dapatkan API key dari Google AI Studio (atau platform yang kamu punya).
2. `.env.local`:
   ```ini
   MODEL_PROVIDER=google
   GEMINI_API_KEY=isi-kunci-mu-disini
   ```
3. Saat pilih Gemini, start.bat & backend otomatis **skip cek Ollama**.

### Metadata toko

Edit di `.env.local`:

- `STORE_NAME` — nama toko.
- `STORE_TAGLINE` — tagline toko.
- `STORE_SINCE` — tahun berdiri.
- `ADMIN_WHATSAPP` — nomor WhatsApp admin (untuk eskalasi).
- `ADMIN_NAME` — nama admin (untuk eskalasi).

Metadata ini muncul langsung di UI dan jadi pembeda produk — jadi setel di sini,
bukan hardcode di kode.

---

## 4. Cara Rara bekerja (hingga kamu bisa menjelaskannya ke orang lain)

Langkah logging interen:

1. **Korpus**: semua file di `knowledge-base/*.md` dirangkai jadi satu teks korpus.
2. **System prompt**: isi `langflow/agent-system-prompt.md` dibaca & jadi
   instruksi dasar Rara — grounding ketat, anti-halusinasi, penolakan dengan
   eskalasi, bahasa Indonesia santun, sapaan "Kak".
3. **Prompt final**: dibangun sebagai system → konteks toko → korpus → riwayat
   per sesi → pertanyaan user.
4. **LLM call**: dikirim ke provider yang dipilih (Ollama / Gemini).
5. **Respons**: bila jawaban berhasil menemukan informasi → tampilkan. Jika tidak
   menemukan informasi → tampilkan penolakan jujur + tombol Hubungi Admin.

Alasan korpus diletakkan di pesan system (bukan user):

- Supaya **prefix prompt** antar request mirip → bila model mendukung prefix
  cache (mis. Ollama), respons jadi lebih cepat pada request berikutnya.
- Bukan untuk "memaksa jawaban", melainkan penempatan yang efisien & konsisten.

---

## 5. Evaluasi (wajib sebelum & sesudah ubah sesuatu)

Kualitas jawaban Rara diukur dengan 20 kasus uji yang ada di `evals/`.

- `evals/eval-questions.md` — daftar soal plus kriteria lulus tiap kasus.
- `evals/run_evals.py` — jalankan dari root repo:

  ```bash
  python evals/run_evals.py --all
  ```

  Tanpa perlu `LANGFLOW_API_KEY` (backend sekarang bukan Langflow).

- `evals/eval-results.md` — ringkasan hasil terakhir, termasuk catatan kasus.
- `evals/eval-run-latest.json` — hasil mentah sesi terakhir.

**Aturan utama**: jalankan ulang evaluasi sebelum dan sesudah mengubah dokumen
atau prompt. **Kasus C (anti-halusinasi) wajib lulus semua** — itu kriteria
penilaian & product differentiation.

---

## 6. Aturan produk (ini dinilai)

1. Tampilkan indikator asisten AI (disclaimer kecil di chat).
2. Tampilkan jawaban apa adanya — termasuk bila asisten bilang
   "informasi belum ditemukan, diteruskan ke admin". Itu **fitur**, jangan
   disembunyikan.
3. Sediakan tombol **Hubungi Admin** (eskalasi manusia) di chat.
4. **Jangan pernah minta / menyimpan data pribadi pelanggan** di frontend.
5. Semua teks UI dalam Bahasa Indonesia, nada ramah ("Kak").
6. Tiap kali ubah prompt atau dokumen → jalankan ulang `evals/run_evals.py --all`,
   laporkan di `evals/eval-results.md`, lalu commit.

---

## 7. Status & roadmap

Sudah jalan:

- Backend RAG 2.0 (Next.js, tanpa Langflow/Bob).
- Multi-provider: Ollama (Granite 3.3 2b / 8b) dan Gemini.
- Streaming endpoint (NDJSON Ollama / SSE Gemini).
- Eval 20 kasus termasuk 7 anti-halusinasi.
- Halaman home, chat, katalog, admin, motif batik.

Sedang dikerjakan (bisa kamu lanjutkan):

- Panel admin integrasi ke knowledge base & penyimpanan server (sekarang masih
  demo localStorage).
- Eksperimen berbagai model & metode grounding.
- Skrip evaluasi & kasus uji yang lebih tajam.

---

## 8. Troubleshooting

| Gejala | Kemungkinan penyebab | Solusi |
|---|---|---|
| Rara: "koneksi bermasalah" | Ollama mati / model belum pull / Gemini key bermasalah | Cek `GET /api/chat`; pastikan provider sesuai `.env.local` |
| Jawaban selalu "tidak menemukan info" | Dokumen kosong / prompt tidak dibaca / provider tidak sesuai | Cek isi knowledge-base & apakah `MODEL_PROVIDER` benar |
| Jawaban bahasa Inggris | Instruksi bahasa lemah / prompt tidak aktif | Lihat `langflow/agent-system-prompt.md` |
| Jawaban mengarang (halusinasi) | Grounding tidak ketat / korpus tidak masuk prompt | Verifikasi `rag.ts` & prompt; jalankan kasus C eval |
| Lambat (>1 menit) | Model Ollama cold-start / CPU terbatas | Hangatkan model dengan beberapa request berurutan, atau pilih model lebih kecil |
| Gemini 503 / unavailable | Service cloud ramai / kunci bermasalah | Retry; atau ganti ke Ollama sementara |

---

## 9. Konvensi tim & file

- Repo: `github.com/lenathea913/RAG-UMKM-Assistant-2.0`, branch `main`.
- Commit pesan ringkas dalam Bahasa Indonesia.
- **DILARANG commit kredensial** (API key, token). Pakai `.env` + `.gitignore`.
- File contoh konfigurasi cukup ditulis `.env.example` (tanpa isi kunci).
- Folder `submission/` = paket submission hackathon (arsip).
- File yang wajib dibaca sebelum mulai: `frontend/app/api/chat/route.ts`,
  `frontend/lib/rag.ts`, `knowledge-base/*.md`, `langflow/agent-system-prompt.md`,
  `evals/eval-questions.md`, `evals/eval-results.md`.

---

## 10. Penutup

Kamu sekarang punya toko contoh (Batik Larasati) serta alur Rara yang nyata dan
terukur. Mulai dari `frontend/app/api/chat/route.ts` → `frontend/lib/rag.ts` →
`knowledge-base/` → `evals/`. Kalau buntu, mulai dari `rag.ts` — kalau perlu bantuan
lebih lanjut, cek `evals/eval-results.md` untuk tahu komponen mana yang perlu
ditingkatkan.

---

> ⚠️ **Hati-hati**: ini bukan dokumen Langflow lama — baca versi ini dulu.
> Yang dulu (Langflow) tidak dipakai lagi.
