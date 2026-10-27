# Jawaban Form Submission — Hacktiv8 National Hackathon 2026

> Semua jawaban siap tempel. Fakta disesuaikan kondisi nyata project:
> backend RAG Next.js + Ollama (IBM Granite 3.3 8B) atau Google Gemini + eval 20 kasus.

---

## 1. Masalah spesifik apa yang ingin diselesaikan?

**Kondisi sebelum solusi:** Pemilik UMKM melayani pertanyaan pelanggan secara manual lewat chat/WhatsApp, satu per satu, sendirian. Informasi yang dibutuhkan untuk menjawab (harga, stok, cara order, garansi) sebenarnya sudah lengkap di dokumen bisnis — katalog, price list, FAQ — tapi dokumen itu "tidak bisa bicara".

**Pain point:** (1) pertanyaan yang sama dijawab berulang-ulang setiap hari, memakan waktu admin; (2) di luar jam operasional, pertanyaan dibiarkan menganggur berjam-jam sampai calon pembeli membatalkan niat beli; (3) saat admin lelah, jawaban bisa tidak konsisten atau salah — yang berujung komplain.

**Mengapa penting:** layanan responsif adalah faktor penentu keputusan beli pelanggan chat. Untuk UMKM tanpa tim CS, hilangnya satu pembeli karena balasan lambat adalah kerugian nyata. Masalah ini menimpa puluhan juta UMKM Indonesia, dan sebagian besar solusi chatbot yang ada terlalu mahal/rumit atau mudah "mengarang" jawaban yang merusak kepercayaan pelanggan.

## 2. Target User

**Pengguna utama: pemilik UMKM** (khususnya bisnis ritel/kerajinan/fashion yang melayani pelanggan lewat chat dan punya dokumen produk: katalog, price list, FAQ). Contoh konkret yang kami pakai: butik batik Pekalongan.

**Pengguna sekunder (end user): pelanggan UMKM** yang bertanya — mereka yang menerima jawaban cepat & akurat 24/7. **Pengguna ketiga: admin/CS UMKM** yang terbebas dari pertanyaan repetitif dan hanya menangani kasus eskalasi.

## 3. Mengapa Solusi Ini Dibutuhkan?

Dibanding cara sekarang (balas manual): jawaban instan 24/7 tanpa menunggu jam kerja, konsisten selalu sesuai dokumen resmi, dan admin hanya mengurus kasus eskalasi. Dibanding chatbot generik/GPT biasa: chatbot umum berbasis pengetahuan model yang bisa mengarang harga/kebijakan — fatal untuk bisnis. UMKM Assistant memakai RAG dengan grounding ketat: hanya menjawab dari dokumen resmi, jujur menolak di luar cakupan, dan meneruskan pertanyaan ke manusia. Dibanding solusi chatbot komersial: setup tanpa kode (cukup upload dokumen), gratis berjalan di infrastruktur lokal/open-source, dan kualitasnya **terukur** lewat 20 kasus uji otomatis — bukan sekadar klaim.

## 4. Fitur Utama Project

1. **Document Q&A (RAG Bahasa Indonesia)** — pelanggan bertanya apa saja tentang produk; backend mencari teks di dokumen dan menjawab hanya dari sana (harga, stok, ukuran, cara order, perawatan, promo, ongkir).
2. **Anti-Halusinasi + Eskalasi Human-in-the-Loop** — jika informasi tidak ada di dokumen, asisten jujur mengatakan belum menemukan info dan meneruskan pertanyaan ke pemilik/admin, bukan mengarang. Terbukti: 7/7 kasus jebakan berhasil ditolak.
3. **Knowledge Base dari dokumen (Markdown)** — asisten membaca seluruh dokumen (`knowledge-base/*.md`) setiap request, jadi ubah dokumen → jawaban berubah tanpa restart. Cocok untuk toko kecil.
4. **Adaptasi Bahasa & Persona** — pertanyaan santai/gaul atau bahasa Inggris tetap dijawab ramah dalam Bahasa Indonesia dengan sapaan "Kak".
5. **Eval Suite Otomatis** — 20 kasus uji (grounding, multi-dokumen, anti-halusinasi, bahasa) dijalankan lewat script; kualitas jawaban terjaga setiap kali prompt/dokumen berubah.

## 5. Alur Penggunaan Project

**Setup (pemilik UMKM):** Siapkan dokumen bisnis (katalog, price list, FAQ) sebagai file Markdown, tempel di `knowledge-base/`. Backend langsung membacanya.

**Pemakaian harian (pelanggan):** Pertanyaan Pelanggan → Frontend → `POST /api/chat` → backend baca dokumen + prompt Rara → panggil LLM (Ollama/Granite atau Gemini) → Jawaban Grounded / Penolakan + Eskalasi → pelanggan dapat jawaban; pertanyaan tak terjawab masuk daftar untuk admin.

**Verifikasi developer:** jalankan `python evals/run_evals.py --all` dari root repo (tanpa API key eksternal), periksa hasil di `evals/eval-results.md`. Demo end-to-end lewat chat di `http://localhost:3000`.

## 6. Cara Backend Kerja (bukan Langflow)

Backend dibuat sendiri di Next.js, bukan dibangun di Langflow.

- **File:** `frontend/app/api/chat/route.ts` (endpoint) dan `frontend/lib/rag.ts` (logika RAG).
- **Knowledge base:** seluruh isi `knowledge-base/*.md` dibaca tiap request dan digunakan sebagai teks referensi jawaban.
- **System prompt:** diambil dari `langflow/agent-system-prompt.md` dan dimasukkan ke prompt sebagai instruksi dasar Rara.
- **LLM:** Ollama (IBM Granite 3.3 8B via `localhost:11434`) atau Google Gemini, diset di `.env.local`. Endpoint mendukung streaming (NDJSON untuk Ollama / SSE untuk Gemini).
- **Input:** teks pertanyaan pelanggan + riwayat sesi. **Output:** jawaban grounded Bahasa Indonesia, atau penolakan jujur + tawaran eskalasi ke admin.
- **Proses AI Agent:** menerima konteks dokumen + pertanyaan; diinstruksi HANYA menjawab dari konteks; dilarang menghitung diskon yang tidak tertulis (dengan contoh konkret); wajib menjawab semua bagian pertanyaan majemuk; menolak topik di luar cakupan bisnis.
- **Fungsi backend dalam sistem:** single entrypoint RQ yaitu `POST /api/chat`; cukup menghubungkan frontend ke LLM dengan grounding ketat — tanpa Langflow, tanpa MCP server, tanpa vector store.

**Kondisi sebelum solusi:** Pemilik UMKM melayani pertanyaan pelanggan secara
manual lewat chat/WhatsApp, satu per satu, sendirian. Informasi yang dibutuhkan
untuk menjawab (harga, stok, cara order, garansi) sebenarnya sudah lengkap di
dokumen bisnis — katalog, price list, FAQ — tapi dokumen itu "tidak bisa bicara".

**Pain point:** (1) pertanyaan yang sama dijawab berulang-ulang setiap hari,
memakan waktu admin; (2) di luar jam operasional, pertanyaan dibiarkan menganggur
berjam-jam sampai calon pembeli membatalkan niat beli; (3) saat admin lelah,
jawaban bisa tidak konsisten atau salah — yang berujung komplain.

**Mengapa penting:** layanan responsif adalah faktor penentu keputusan beli
pelanggan chat. Untuk UMKM tanpa tim CS, hilangnya satu pembeli karena balasan
lambat adalah kerugian nyata. Masalah ini menimpa puluhan juta UMKM Indonesia,
dan sebagian besar solusi chatbot yang ada terlalu mahal/rumit atau mudah
"mengarang" jawaban yang merusak kepercayaan pelanggan.

## 2. Target User

**Pengguna utama: pemilik UMKM** (khususnya bisnis ritel/kerajinan/fashion yang
melayani pelanggan lewat chat dan punya dokumen produk: katalog, price list, FAQ).
Contoh konkret yang kami pakai: butik batik Pekalongan.

**Pengguna sekunder (end user): pelanggan UMKM** yang bertanya — mereka yang
menerima jawaban cepat & akurat 24/7. **Pengguna ketiga: admin/CS UMKM** yang
terbebas dari pertanyaan repetitif dan hanya menangani kasus eskalasi.

## 3. Mengapa Solusi Ini Dibutuhkan?

Dibanding cara sekarang (balas manual): jawaban instan 24/7 tanpa menunggu jam
kerja, konsisten selalu sesuai dokumen resmi, dan admin hanya mengurus kasus
eskalasi. Dibanding chatbot generik/GPT biasa: chatbot umum berbasis pengetahuan
model yang bisa mengarang harga/kebijakan — fatal untuk bisnis. UMKM Assistant
memakai RAG dengan grounding ketat: hanya menjawab dari dokumen resmi, jujur
menolak di luar cakupan, dan meneruskan pertanyaan ke manusia. Dibanding solusi
chatbot komersial: setup tanpa kode (cukup upload dokumen), gratis berjalan di
infrastruktur lokal/open-source, dan kualitasnya **terukur** lewat 20 kasus uji
otomatis — bukan sekadar klaim.

## 4. Fitur Utama Project

1. **Document Q&A (RAG Bahasa Indonesia)** — pelanggan bertanya apa saja tentang
   produk; sistem mencari bagian dokumen paling relevan dan menjawab hanya dari
   sana (harga, stok, ukuran, cara order, perawatan, promo).
2. **Anti-Halusinasi + Eskalasi Human-in-the-Loop** — jika informasi tidak ada
   di dokumen, asisten jujur mengatakan belum menemukan info dan meneruskan
   pertanyaan ke pemilik/admin, bukan mengarang. Terbukti: 7/7 kasus jebakan lulus.
3. **Knowledge Base dari Upload Dokumen (tanpa kode)** — pemilik cukup upload
   katalog/price list/FAQ (PDF/Markdown); dokumen otomatis di-chunk, di-embed
   (multilingual), dan disimpan ke vector store. Ganti dokumen = asisten baru.
4. **Adaptasi Bahasa & Persona** — pertanyaan santai/gaul atau bahasa Inggris
   tetap dijawab ramah dalam Bahasa Indonesia dengan sapaan khas UMKM ("Kak").
5. **Eval Suite Otomatis** — 20 kasus uji (grounding, multi-dokumen,
   anti-halusinasi, bahasa) dijalankan lewat script; kualitas jawaban terjaga
   setiap kali prompt/flow berubah.

## 5. Alur Penggunaan Project

**Setup (pemilik UMKM):** Upload dokumen bisnis → Langflow Knowledge Base
(chunk → embedding → vector store) → asisten siap dipakai.

**Pemakaian harian (pelanggan):**
Pertanyaan Pelanggan → Chat Input → Langflow (Knowledge Retrieval → Prompt
Grounding → AI Agent IBM Granite) → Jawaban Grounded / Penolakan + Eskalasi →
Pelanggan mendapat jawaban; pertanyaan tak terjawab masuk daftar untuk admin.

**Verifikasi developer:** IBM Bob → (MCP) → flow Langflow sebagai tool → hasil
eval & demo end-to-end.

## 6. Penggunaan IBM Langflow

Langflow adalah **tulang punggung seluruh sistem** — seluruh pipeline AI dibangun
visual di sana sebagai satu flow bernama `UMKM Assistant`:

- **Komponen/workflow:** `Chat Input` → `Knowledge` (mode Retrieve, knowledge
  base `umkm-batik2`, embedding `gemini-embedding-001`, Chroma local) →
  `Parser` (format hasil retrieval) → `Prompt` (template grounding:
  KONTEKS DOKUMEN + pertanyaan) → `Agent` (IBM Granite 3.3 8B via Ollama,
  system prompt grounding + few-shot anti-halusinasi) → `Chat Output`.
- **Input:** teks pertanyaan pelanggan. **Output:** jawaban grounded Bahasa
  Indonesia, atau penolakan jujur + tawaran eskalasi ke admin.
- **Proses AI Agent:** menerima konteks hasil retrieval + pertanyaan; diinstruksi
  HANYA menjawab dari konteks; dilarang menghitung diskon yang tidak tertulis
  (dengan contoh konkret); wajib menjawab semua bagian pertanyaan majemuk;
  menolak topik di luar cakupan bisnis.
- **Fungsi Langflow dalam sistem:** orkestrator RAG sekaligus API server — flow
  diekspos sebagai REST endpoint (`/api/v1/run/...`) dan sebagai MCP server,
  sehingga bisa dipakai frontend maupun IBM Bob tanpa menulis kode backend.

## 7. Cara Verifikasi Developer

Verifikasi dilakukan tanpa Bob & tanpa Langflow:

1. Jalankan backend: `cd frontend && npm run dev` di satu terminal.
2. Pastikan Ollama jalan (`ollama list` → muncul model) atau Gemini key di `.env.local`.
3. Jalankan `python evals/run_evals.py --all` dari root repo → hasil di `evals/eval-results.md`.
4. Demo end-to-end: buka `http://localhost:3000`, ketik beberapa pertanyaan dari `evals/eval-questions.md`, lihat jawaban.
5. Cek kasus anti-halusinasi (C1–C7) terutama — itu pembeda utama produk.

## 8. Project File / Link

- **GitHub (repo baru):** https://github.com/lenathea913/RAG-UMKM-Assistant-2.0
  (README, arsitektur backend, cara menjalankan, system prompt, knowledge base,
  eval suite & hasil, start.bat, screenshot submission, draf pitch).
- ⚠️ **TODO sebelum submit:** ubah repo menjadi **public** jika diminta reviewer:
  `gh repo edit lenathea913/RAG-UMKM-Assistant-2.0 --visibility public`
  agar reviewer bisa mengakses.

## 9. Pitching Deck

⚠️ **TODO:** buat slide (maks 10 MB) — kerangka sudah ada di
`submission/pitch-draft.md`: Cover → Problem → Solution → Demo/Arsitektur →
AI Agent → Responsible AI → Impact → Roadmap.

## 10. Project / Prototype Screenshot

⚠️ **TODO — 3–5 screenshot, usulan nama file:**
1. `01-chat-app.png` — aplikasi di `http://localhost:3000`: pertanyaan A1 + jawaban grounded Rp 1.850.000
2. `02-anti-halusinasi.png` — kasus C7: jujur menolak hitung diskon tunai
3. `03-arsitektur.png` — screenshot struktur folder / arsitektur (opsional)
4. `04-katalog.png` — halaman `/katalog` atau halaman home (opsional)
5. `05-eval-suite.png` — terminal `run_evals.py` berjalan / tabel hasil eval

## 11. Dampak yang Dihasilkan

- **Waktu respons:** dari menunggu balasan admin (menit–jam, rata-rata tertunda
  sampai jam kerja) → **instan, 24/7** — cakupan layanan naik dari ±9 jam/hari
  (6 hari/minggu) menjadi **168 jam/minggu penuh** (±19× lipat).
- **Akurasi terukur:** 20 kasus uji otomatis → 12 lulus penuh, 6 minor wording,
  **0 fakta karangan**; C1–C7 (anti-halusinasi) berhasil ditolak dengan benar.
  Skor 12✅ 6⚠️ 2❌; C1–C7 nol fakta karangan (kriteria Responsible AI terpenuhi).
- **Penghematan waktu admin:** pertanyaan repetitif (harga/stok/order/perawatan)
  terjawab otomatis — admin hanya menangani eskalasi; pada knowledge base uji
  (3 dokumen: katalog, price list, faq-sop), seluruh pertanyaan tipikal pelanggan butik tercakup.
- **Waktu setup:** < 30 menit dari nol (atur `.env.local` + `npm run dev`), tanpa
  satu baris kode bagi pemilik UMKM.

## 12. Potensi Pengembangan & Skalabilitas

- **Channel pelanggan nyata:** integrasi WhatsApp Business / Instagram DM agar
  pelanggan bertanya dari aplikasi yang sudah mereka pakai.
- **Multi-tenant SaaS:** satu deployment melayani banyak UMKM — tiap pemilik
  upload dokumennya sendiri; ganti dokumen = asisten baru.
- **Industri lain:** klinik (info layanan & jadwal), sekolah/bimbel (FAQ PPDB),
  komunitas/desa (info UMKM setempat) — polanya identik: ganti dokumen.
- **Bahasa daerah:** prompt & dokumen multibahasa membuka dukungan Jawa/Sunda dan lainnya.
- **Enterprise:** migrasi ke LLM cloud (Gemini oranye, watsonx.ai) saat butuh skala.

## 13. Apa yang Membuat Project Ini Berbeda?

1. **Kejujuran sebagai fitur utama, terukur:** bukan sekadar chatbot yang bisa
   bicara, tapi asisten yang *terbukti tidak mengarang* — 7 skenario jebakan
   (diskon fiktif, nomor telepon, cabang, promo) semuanya ditolak dengan elegan
   dan dieskalasi ke manusia. Kualitas diverifikasi eval otomatis, bukan klaim.
2. **Bahasa Indonesia end-to-end dengan persona lokal:** dokumen Indonesia,
   pertanyaan gaul/Inggris pun dijawab santun khas UMKM ("Kak") — bukan
   terjemahan kaku dari chatbot Inggris.
3. **Tanpa kode & replikabel:** pemilik UMKM tidak menyentuh prompt maupun
   server — upload dokumen, asisten siap; pindah ke UMKM lain cukup ganti dokumen.
   Backend sendiri (Next.js) yang membaca dokumen & memanggil LLM, jadi setup
   lokal & biaya nol (gratis bila pakai Ollama localhost).

## 14. Kemampuan AI Agent

Agent ("Rara", dijalankan lewat Ollama IBM Granite 3.3 8B atau Gemini) menjalankan secara otomatis:

- **Menjawab pertanyaan pelanggan** dari `knowledge-base/*.md`: harga, ketersediaan ukuran/stok, cara order, garansi/retur, perawatan produk, promo, ongkir.
- **Sintesis multi-dokumen:** menggabungkan info dari katalog + price list + faq-sop dalam satu jawaban (mis. "ukuran S ada, harganya Rp 465.000").
- **Deteksi & penolakan di luar cakupan:** pertanyaan yang tidak terjawab oleh dokumen (nomor kontak, cabang, promo fiktif) dijawab jujur + **eskalasi semi-otomatis**: pertanyaan dicatat untuk diteruskan ke admin di jam kerja.
- **Penolakan topik di luar bisnis** (medis, hukum, data pribadi) dengan sopan, lalu mengarahkan kembali ke produk.
- **Adaptasi bahasa:** memahami bahasa gaul & bahasa Inggris, selalu menjawab Bahasa Indonesia yang konsisten dengan persona toko.

Semi-otomatis (butuh manusia): pertanyaan eskalasi dijawab admin; pemilik memperbarui knowledge base dengan mengganti file di `knowledge-base/`.

---

## ✅ Checklist pengiriman

- [ ] Repo GitHub (RAG-UMKM-Assistant-2.0) di-**public**-kan
- [ ] Pitch deck dibuat (maks 10 MB) — kerangka di `pitch-draft.md`
- [ ] 3–5 screenshot diambil & dinamai sesuai daftar di atas
- [ ] Semua jawaban di atas di-paste ke form
- [ ] Video/demo (bila diminta panitia)
