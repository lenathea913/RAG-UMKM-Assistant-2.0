# Frontend UMKM Assistant

Chat pelanggan "Rara" + dashboard pemilik UMKM, terhubung ke flow RAG
Langflow di `localhost:7860`.

## Menjalankan

```bash
cd frontend
npm install
npm run dev
```

Buka `http://localhost:3000` (chat) dan `http://localhost:3000/admin`.

> Node.js di mesin ini portable, ada di `D:\Project\node-portable`.
> Tambahkan ke PATH atau jalankan lewat terminal yang sudah tahu lokasinya.

## Koneksi ke Langflow

1. Pastikan Langflow jalan: `.venv/Scripts/langflow.exe run` di root repo.
2. Buat flow RAG (lihat `../langflow/BUILD-GUIDE.md`), lalu salin
   `.env.example` → `.env.local` dan isi `LANGFLOW_FLOW_ID` dengan ID flow-mu
   (lihat URL browser di Langflow, atau klik ikon **API** di flow).
3. Tanpa flow, chat akan menampilkan pesan gagal yang ramah — UI tetap bisa
   dikembangkan.

## Struktur

```
app/
├── page.tsx          ← Chat pelanggan (Rara)
├── admin/page.tsx    ← Dashboard pemilik (upload + panel eskalasi)
└── api/chat/route.ts ← Proxy ke Langflow (sekaligus pemecah CORS)
lib/langflow.ts       ← Integrasi + ekstraksi jawaban + deteksi eskalasi
```

## Catatan desain

- `session_id` per-tab disimpan di localStorage → memory percakapan.
- Jawaban "tidak ditemukan" otomatis memunculkan tombol **Hubungi Admin**
  (deteksi frasa, bukan AI klasifikasi — sengaja sederhana).
- Disclaimer AI tampil permanen di bawah input (aturan produk wajib).
- Halaman `/admin` v0: upload & panel eskalasi masih demo lokal (localStorage);
  integrasi penuh ke Knowledge Base & penyimpanan server menyusul.
