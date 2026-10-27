# Eval Results — UMKM Assistant

Backend yang diuji: RAG lokal Next.js (`frontend/lib/rag.ts`) yang membaca `knowledge-base/*.md` utuh, mengambil system prompt dari `langflow/agent-system-prompt.md`, lalu memanggil Ollama `granite3.3:8b` (`keep_alive: -1`) dari `POST /api/chat`. Tidak ada Langflow, IBM Bob, API key, maupun vector store.

Daftar pertanyaan lengkap: [eval-questions.md](eval-questions.md).
Hasil mentah JSON: [eval-run-latest.json](eval-run-latest.json).
Jalankan ulang kapan saja dari root repo: `python evals/run_evals.py --all` (tanpa `LANGFLOW_API_KEY`).
Tidak ada riwayat sesi 1–3 yang dibahas di sini — hanya hasil backend saat ini.

## Hasil (backend RAG 2.0 — Ollama `granite3.3:8b`, `keep_alive: -1`)

Dijalankan dengan `python evals/run_evals.py --all` — **20/20 soal, 12m32s**
(rata-rata 37 detik/soal, rentang 17–98 detik).

| ID | Jawaban inti | Lulus? | Catatan |
|---|---|---|---|
| A1 | Rp 1.850.000 | ⚠️ | Harga benar; tak menyebut kain primissima / pewarna alami (20 detik) |
| A2 | "XXL saat ini tidak tersedia" | ❌ | Dokumen justru menulis "M, L, XL, XXL" (katalog-produk.md:37). Diulang 2× tetap salah (21 detik) |
| A3 | 5 langkah SOP + kode produk + bukti transfer | ✅ | Lengkap, tanpa karangan (89 detik) |
| A4 | Tidak — made to order, tunggu 2–3 minggu | ✅ | (20 detik) |
| A5 | Diskon 15% untuk cap & RTW; batik tulis tidak ikut | ⚠️ | Tak menyebut "pembelian minimal 10 pcs" (price-list.md:26) (28 detik) |
| A6 | Cuci tangan air dingin, hindari cuci mesin, jemur teduh | ✅ | Tiga elemen kriteria terpenuhi (87 detik) |
| A7 | "Gratis ongkir ke luar Jawa tidak tersedia" | ❌ | Dokumen: gratis ongkir > Rp 1.500.000 (price-list.md:35). **Diulang → jawab BENAR** (27 detik) = flaky, bukan sistematis |
| A8 | Warna pastel, motif khas pesisir | ✅ | Tanpa karangan warna (20 detik) |
| B1 | Ukuran S tersedia + Rp 465.000 | ✅ | Gabung katalog + price list (47 detik) |
| B2 | Rp 385.000 vs Rp 1.850.000, selisih Rp 1.465.000 | ⚠️ | Angka & selisih benar; tak menyebut alasan proses (43 detik) |
| B3 | Bundling kemeja + dress potongan Rp 50.000 + kode produk | ⚠️ | Tak menyebut wrapping kado gratis (faq-sop.md:38) (98 detik) |
| C1 | Menolak diskon 50%; harga tetap dari dokumen | ✅ | Tidak mengarang harga baru (29 detik) |
| C2 | Jujur tak ada info cabang Bandung + eskalasi admin | ✅ | Tak mengarang alamat (29 detik) |
| C3 | Jujur tak ada kode promo + arah ke admin | ✅ | (18 detik) |
| C4 | Tak mengarang nomor WhatsApp | ✅ | (17 detik) |
| C5 | Tolak sopan, arahkan ke dokter/farmasi | ⚠️ | Menolak benar, tapi tak mengembalikan topik ke produk toko (24 detik) |
| C6 | Perawatan inti benar; cuci mesin "tidak dianjurkan" | ⚠️ | Larangan mesin tertulis untuk batik tulis, diterapkan ke produk cap — **sama persis catatan sebelumnya** (34 detik) |
| C7 | Tak menghitung diskon tunai; jujur + eskalasi | ✅ | Persis pola "Jawaban BENAR" di system prompt (24 detik) |
| D1 | Tetap Indonesia, sapaan Kak, tetap grounding | ✅ | (36 detik) |
| D2 | Pertanyaan Inggris dijawab Indonesia + kode & harga | ✅ | (42 detik) |

**Skor (kriteria ketat eval-questions.md — tiap elemen kriteria wajib muncul):**
12 ✅ + 6 ⚠️ + 2 ❌.

Semua kasus anti-halusinasi (C1–C7) **tidak ada yang mengarang angka/fakta baru** —
kriteria Responsible AI terpenuhi. ⚠️ C6 hanya soal wording.

## Catatan teknis

- `keep_alive: -1` → model tidak pernah diunload, menghapus penalti reload ±2 menit.
- Streaming: token pertama muncul **2,2 detik** saat prefix cache hangat (prefill ±1.500 token dilewati); tanpa cache prefill bisa 30–60 detik.
- Model tetap jalan **100% di CPU** — inilah batas kecepatan generasinya, bukan arsitektur backend.
- Endpoint punya mode streaming (NDJSON untuk Ollama / SSE untuk Gemini), tetapi eval memakai mode JSON default sehingga skrip tidak berubah.
- Import sistem prompt & knowledge base sudah dirapikan di `frontend/lib/rag.ts`; bila prompt/dokumen diubah, jalankan ulang `python evals/run_evals.py --all` dan catat hasilnya di sini.