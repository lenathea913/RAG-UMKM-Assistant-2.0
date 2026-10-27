# Deskripsi Singkat Project (untuk form submission)

> 248 kata — memenuhi syarat 150–300 kata. Sudah mencakup: apa projectnya,
> masalahnya, siapa yang terdampak, cara kerja solusi, manfaat utama.

---

**UMKM Assistant — Asisten Layanan Pelanggan AI Berbasis RAG untuk UMKM Indonesia**

UMKM Assistant mengubah dokumen bisnis — katalog produk, price list, FAQ, SOP — menjadi asisten layanan pelanggan otomatis yang aktif 24/7 dan berbahasa Indonesia.

**Masalahnya:** pemilik UMKM Indonesia (jumlahnya puluhan juta) umumnya melayani pelanggan sendiri, tanpa tim customer service. Pertanyaan yang berulang setiap hari — harga, stok, cara order, garansi — dijawab manual satu per satu, dan di luar jam operasional pertanyaan dibiarkan menganggur sampai calon pembeli pergi. Ironisnya, semua jawabannya sudah ada: tersimpan rapi di dokumen bisnis mereka sendiri, hanya saja tidak bisa "berbicara".

**Cara kerja solusi:** pemilik cukup mengunggah dokumen bisnisnya. Backend Rara membaca seluruh dokumen (katalog, price list, FAQ) setiap request, mencari bagian yang relevan, lalu LLM (IBM Granite via Ollama, atau Google Gemini) menyusun jawaban Indonesia *hanya dari konteks tersebut* (Retrieval-Augmented Generation). Jika informasi tidak ditemukan di dokumen, asisten jujur menolak mengarang dan meneruskan pertanyaan ke pemilik bisnis (*human-in-the-loop*).

**Manfaat utama:** ...

**Manfaat utama:** (1) UMKM tanpa tim CS menjadi responsif 24/7; (2) jawaban terjamin akurat karena terikat dokumen resmi — halusinasi dicegah secara terukur; (3) setup tanpa kode, cukup upload dokumen; (4) waktu admin bebas untuk pertanyaan bernilai tinggi; (5) mudah direplikasi ke UMKM lain hanya dengan mengganti dokumen.

Akurasi dan kejujuran asisten diverifikasi melalui 20 kasus uji otomatis ("run_evals.py", tanpa API key eksternal), termasuk 7 kasus jebakan anti-halusinasi — kasus C1–C7 semuanya berhasil ditolak tanpa satu pun fakta karangan.
