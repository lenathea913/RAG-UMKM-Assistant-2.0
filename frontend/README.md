# Frontend UMKM Assistant

Chat pelanggan "Rara" + dashboard pemilik UMKM. RAG-nya berjalan **di dalam
Next.js** — dokumen dibaca dari `../knowledge-base/`, jawaban dihasilkan **IBM
Granite via Ollama** di `localhost:11434`. Tidak ada Langflow maupun IBM Bob.

## Menjalankan

```bash
cd frontend
npm install
npm run dev
```

Buka `http://localhost:3000` (chat) dan `http://localhost:3000/admin`.

> Node.js di mesin ini portable, ada di `D:\Project\node-portable`.
> Tambahkan ke PATH atau jalankan lewat terminal yang sudah tahu lokasinya.

## Koneksi ke Ollama (IBM Granite)

1. Pastikan Ollama jalan (`ollama serve`, atau aplikasi Ollama di system tray)
   dan model sudah di-pull: `ollama pull granite3.3:8b`.
2. Salin `.env.example` → `.env.local` lalu sesuaikan bila perlu
   (`OLLAMA_MODEL=granite3.3:2b` untuk demo yang jauh lebih cepat).
3. System prompt diambil dari `../langflow/agent-system-prompt.md` (sumber
   kebenaran) dan korpus dari `../knowledge-base/` — keduanya dibaca ulang tiap
   request, jadi edit dokumen/prompt langsung terpakai tanpa restart.
4. Tanpa Ollama/model, chat menampilkan pesan gagal yang ramah — cek
   `GET /api/chat` untuk preflight (status Ollama, model, daftar dokumen).

## Struktur

```
app/
├── page.tsx          ← Chat pelanggan (Rara)
├── admin/page.tsx    ← Dashboard pemilik (upload + panel eskalasi)
└── api/chat/route.ts ← Proxy ke Langflow (sekaligus pemecah CORS)
lib/rag.ts            ← RAG lokal: korpus + prompt grounding + Ollama + memory sesi
```

## Catatan desain

- `session_id` per-tab disimpan di localStorage → memory percakapan.
- Jawaban "tidak ditemukan" otomatis memunculkan tombol **Hubungi Admin**
  (deteksi frasa, bukan AI klasifikasi — sengaja sederhana).
- Disclaimer AI tampil permanen di bawah input (aturan produk wajib).
- Halaman `/admin` v0: upload & panel eskalasi masih demo lokal (localStorage);
  integrasi penuh ke Knowledge Base & penyimpanan server menyusul.
