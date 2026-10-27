# Pitch Draft — UMKM Assistant

## Elevator pitch (±60 detik)

"Di Indonesia ada lebih dari 64 juta UMKM, tapi hampir semuanya tidak punya tim customer service. Pertanyaan pelanggan yang sama — harga, stok, cara order — dijawab manual berulang kali, dan di luar jam kerja pertanyaan dibiarkan menganggur. Padahal jawabannya sudah ada, di dokumen bisnis mereka sendiri.

UMKM Assistant mengubah dokumen itu menjadi asisten AI yang aktif 24/7: pemilik cukup menyiapkan katalog, price list, dan FAQ, lalu asisten menjawab pertanyaan pelanggan dalam Bahasa Indonesia — hanya berdasarkan dokumen resmi. Kalau informasinya tidak ada, asisten jujur dan meneruskan pertanyaan ke pemilik, bukan mengarang jawaban.

Asistennya dibangun sendiri di Next.js: backend Rara membaca dokumen tiap request dan memanggil LLM (IBM Granite via Ollama, atau Google Gemini) dengan instruksi grounding ketat. Hasilnya: jawaban instan yang bisa diukur kualitas & kejujurannya lewat 20 kasus uji otomatis, termasuk 7 kasus yang wajib ditolak."

## Narasi per kriteria rubrik

### Problem Clarity
- Persona: pemilik butik UMKM (contoh nyata: butik batik Pekalongan di knowledge
  base kami).
- Pain point konkret: pertanyaan berulang, waktu respons lambat, pelanggan hilang
  di luar jam operasional, admin kewalahan.
- Kesenjangan: informasi sudah ada dalam dokumen, tapi tidak bisa "bicara"
  kepada pelanggan.

### Innovation
- RAG berbahasa Indonesia dengan grounding ketat: asisten menolak mengarang dan
  menawarkan eskalasi manusia — kebalikan dari chatbot generik yang membludak.
- Setup tanpa kode: cukup upload dokumen (bukan training, bukan konfigurasi
  rumit) — cocok untuk pemilik UMKM non-teknis.
- Human-in-the-loop sebagai fitur, bukan kelemahan: pertanyaan abu-abu
  diteruskan ke pemilik pada jam kerja.

### User Impact
- UMKM tanpa tim CS menjadi responsif 24/7.
- Hemat waktu admin dari pertanyaan berulang ke pertanyaan bernilai tinggi.
- Pelanggan mendapat jawaban akurat dari dokumen resmi, bukan janji kosong.
- Replikabel ke UMKM lain: ganti dokumen, asisten baru jalan.

### Technical Execution
- Backend RAG sendiri di Next.js: endpoint `POST /api/chat` + `frontend/lib/rag.ts` membaca dokumen, prompt, dan memanggil LLM.
- Dua pilihan LLM: Ollama (IBM Granite 3.3 8B lokal) atau Google Gemini; diset di `.env.local`.
- Evaluasi otomatis lewat `python evals/run_evals.py --all` (tanpa API key eksternal), termasuk kasus anti-halusinasi yang wajib lulus.
- System prompt Rara ada di `langflow/agent-system-prompt.md` (sumber kebenaran gaya & aturan grounding).
- Arsitektur terbuka & sederhana: satu backend, satu entrypoint, nggak perlu vector store / Langflow / MCP.

### Responsible AI
- Grounding wajib: jawaban hanya dari dokumen bisnis (dibuktikan di demo).
- Anti-halusinasi teruji: 7 kasus negatif di eval suite harus menolak/mengeskalasi.
- Transparansi: asisten menyatakan dirinya asisten AI dan batas pengetahuannya.
- Privasi: tidak meminta/menyimpan data pribadi pelanggan; dokumen contoh tidak
  memuat data nyata.

## Rencana demo (±3 menit)

1. Tunjukkan dokumen bisnis (katalog, price list, FAQ) di `knowledge-base/`.
2. Chat: "Berapa harga Mega Mendung Premium?" → jawaban akurat + grounded Rp 1.850.000.
3. Kasus negatif: "Nomor WhatsApp admin berapa?" → asisten jujur tidak tahu + eskalasi. (Momen pembeda — tekankan.)
4. Tunjukkan halaman `/katalog` (harga reseller), `/admin` (dashboard), dan hasil `run_evals.py`.

## Angka/klaim yang perlu diverifikasi sebelum submit

- [ ] Statistik jumlah UMKM (sumber terbaru, cantumkan sumbernya).
- [ ] Backend & model yang dipakai (Ollama IBM Granite 3.3 8B, atau Gemini) — samakan di semua dokumen.
- [ ] Hasil eval suite dijalankan penuh + dicatat di `evals/eval-results.md`.
- [ ] Repo publik (jika diminta reviewer).
