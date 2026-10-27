# Folder Screenshot Submission

Folder ini untuk menampung **3–5 screenshot** yang di-upload ke form submission
(maks 10 MB/file, format PNG/JPG). Simpan semua file di folder ini dengan nama
yang persis seperti daftar di bawah.

## Daftar file yang wajib ada

### `01-chat-playground.png` — Jawaban grounded (wajib)
Di aplikasi: `http://localhost:3000`.
- Tanya: `Berapa harga Batik Tulis Mega Mendung Premium?`
- Pastikan terlihat: pertanyaan + jawaban berisi **Rp 1.850.000** dan persona Rara.
- 💡 Untuk jawaban lebih tajam, pastikan Ollama model `granite3.3:8b` aktif (atau pakai Gemini).

### `02-anti-halusinasi.png` — Buktinya AI jujur (paling menentukan!)
Masih di aplikasi, tab chat yang sama atau baru.
- Tanya: `Harga Mega Mendung Premium kalau dibayar tunai diskon 10%?`
- Pastikan terlihat: jawaban **menolak menghitung** + menyebut harga tetap
  Rp 1.850.000 + tawaran meneruskan ke admin.
- 💡 Ini pembeda Responsible AI — pastikan teks jawabannya terbaca jelas.

### `03-arsitektur.png` — Struktur project (opsional)
Screenshot struktur folder atau diagram arsitektur backend Next.js.
- Pastikan terlihat: `frontend/app/api/chat/route.ts`, `frontend/lib/rag.ts`,
  dan `knowledge-base/*.md`.
- 💡 Bisa juga screenshot contoh dokumen knowledge base.

### `04-katalog.png` — Halaman katalog & harga reseller (opsional)
Halaman `http://localhost:3000/katalog`.
- Pastikan terlihat: tabel harga produk + tabel harga reseller (diskon 15%).

### `05-eval-suite.png` — Kualitas terukur
Terminal berisi hasil `python evals/run_evals.py --all` (beberapa soal cukup, tidak
harus --all penuh).
- Pastikan terlihat: ID soal (A1/C7 dll), durasi, dan potongan jawaban.

## Tips umum

- Ukuran & keterbacaan: screenshot di 125–150% zoom biasanya paling tajam.
- Hapus informasi pribadi (email, nama lengkap di header, API key — apapun itu).
- Nama file jangan diubah (memudahkan reviewer).
- Total ukuran folder jaga di bawah ±8 MB supaya aman saat upload satu per satu.

## Status

- [ ] 01-chat-playground.png
- [ ] 02-anti-halusinasi.png
- [ ] 03-arsitektur.png (opsional)
- [ ] 04-katalog.png (opsional)
- [ ] 05-eval-suite.png

---

## Catatan

Screenshots ini diambil dari aplikasi RAG 2.0 (Next.js), bukan dari Langflow.
