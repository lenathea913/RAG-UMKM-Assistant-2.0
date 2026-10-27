# Frontend RAG-UMKM-Assistant-2.0

Chat layanan pelanggan "Rara" + dashboard pemilik UMKM. Backend RAG-nya berjalan **di dalam Next.js** — dokumen dibaca dari `../knowledge-base/`, jawaban dihasilkan dari **IBM Granite via Ollama** (`localhost:11434`, offline & gratis) **atau Google Gemini** (API key), tanpa Langflow, tanpa IBM Bob, tanpa vector store khusus.

---

## Menjalankan

```bash
cd frontend
npm install
cp .env.example .env.local
# edit .env.local: pilih MODEL_PROVIDER=ollama atau google, sesuaikan OLLAMA_MODEL / GEMINI_API_KEY
npm run dev
```

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
MODEL_PROVIDER=ollama
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
MODEL_PROVIDER=google
GEMINI_API_KEY=isi-kunci-mu-disini
```

Bila `MODEL_PROVIDER=google`, cek Ollama **tidak diperlukan** — `start.bat` dan backend otomatis lewati langkah Ollama.

---

## Konfigurasi toko

`.env.local` juga memuat metadata toko yang jadi sumber kebenaran Rara dan teks UI. Ikuti `.env.example` dan sesuaikan:

- `STORE_NAME`, `STORE_TAGLINE`, `STORE_SINCE` → nama, tagline, tahun lalu.
- `ADMIN_WHATSAPP`, `ADMIN_NAME` → nomor & nama orang yang terima eskalasi bila Rara tidak menemukan informasi di dokumen.

Informasi ini tidak diambil dari model — muncul langsung di UI dan jadi pembeda produk, jadi nongkrong di sini, bukan di hardcode di kode.

---

## Cara Rara bekerja (backend miniatur)

`POST /api/chat` lakukan:

1. Baca semua dokumen bisnis dari `../knowledge-base/*.md` → jadi satu **korpus**.
2. Baca system prompt dari `../langflow/agent-system-prompt.md` → jadi **pribadi Rara** (grounding ketat, anti-halusinasi, eskalasi).
3. Sisipkan korpus + riwayat sesi + pertanyaan ke prompt.
4. Hubungi LLM (Ollama atau Gemini) — dengan mode streaming jika client bisa.
5. Tampilkan jawaban. Jika jawaban gagal menemukan informasi, tampilkan tombol **Hubungi Admin** secara otomatis.

Aturan penting untuk developer:

- **Edit dokumen atau prompt**, Rara langsung berubah **tanpa restart server** — dokumentasi & knowledge base dibaca ulang tiap request.
- Evaluasi sebelum dan sesudah mengubah sesuatu: `python evals/run_evals.py --all` dari root repo.
- Task C (anti-halusinasi) **wajib lulus semua** — itu pembeda utama produk.

---

## Struktur

```
app/
├── page.tsx          ← Home + chat Rara
├── katalog/page.tsx  ← Katalog & harga reseller
├── admin/page.tsx    ← Dashboard pemilik (upload + eskalasi; masih demo lokal di browser)
└── api/chat/route.ts ← Backend Rara (single point of truth; bukan proxy ke Langflow)
lib/rag.ts            ← RAG lokal, per-provider LLM, streaming, memory sesi
```

---

## Catatan developer

- **Streaming**: endpoint `POST /api/chat` mendukung streaming (NDJSON untuk Ollama, SSE untuk Gemini). Client-side diimplementasi sesuai kemampuan; bila tidak didukung, jawaban diberikan utuh.
- **Kecepatan**: bila model didiamkan lama (Ollama), jawaban pertama bisa lambat karena model "cold start". Biasakan jalankan beberapa pertanyaan berurutan (atau gunakan `keep_alive` model Ollama) supaya respons lebih konsisten. Bila pakai Gemini, kecepatan relatif stabil selama endpoint tersedia.
- **Model choice**: `granite3.3:8b` kualitas tertinggi; `granite3.3:2b` respons lebih singkat; Gemini tercepat bila koneksi bagus.
- **Tiap request membaca knowledge base utuh**: untuk toko kecil (beberapa dokumen pendek) ini sengaja dipilih supaya setup lebih sederhana & lebih mudah dipahami — tidak dibutuhkan Ollama vector store atau embedding pipeline.

---

## Evaluasi

Tujuh belas (sebenarnya 20) kasus uji ada di `evals/` dari root repo:

- `evals/eval-questions.md` — daftar soal + kriteria lulus.
- `evals/eval-results.md` — ringkasan hasil terakhir & catatan.
- `evals/run_evals.py` — jalankan di root repo: `python evals/run_evals.py --all`.
- `evals/eval-run-latest.json` — hasil mentah sesi terakhir.

---

## Keamanan

- **Kunci API / file .env tidak pernah di-commit.** `.env.local` sudah di-gitignore.
- Jangan pernah copy `.env.local` ke `.env.example` atau ke dalam kode.
- `frontend/lib/rag.ts` kunci API (Gemini) hanya dibaca dari env bila dipakai, dan tidak dikirim ke client.

---

## Catatan soal Langflow & IBM Bob

Folder `langflow/` saat ini menyimpan sistem prompt sebagai sumber kebenaran dan instruksi yang sebelumnya digunakan. Backend sekarang **tidak pakai Langflow**. Folder `bob/` ada sebagai arsip developer tooling lama; bukan bagian produk akhir.

---

## Yang ditampilkan pengguna

- Chat ramah Rara dengan saran pertanyaan.
- Jawaban grounded & jujur bila info tidak ada; tombol eskalasi muncul otomatis.
- Disclaimer AI tetap di bawah input.
- Halaman katalog & harga reseller dari dokumen resmi toko.
- Dashboard pemilik (upload & eskalasi, demo lokal di browser).
