# Pitch Deck — UMKM Assistant (Isi Teks Per Slide)

> Tinggal salin ke Canva/PowerPoint. 10 slide, urut sesuai alur presentasi.
> Pedoman desain: 1 slide = 1 pesan; teks slide tetap pendek, bagian
> "Narasi" untuk kamu bicarakan (jangan ditulis di slide).
> Estimasi durasi presentasi: 5–6 menit.

---

## SLIDE 1 — Cover

**Judul besar:**
UMKM Assistant

**Subjudul:**
Asisten Layanan Pelanggan AI untuk UMKM Indonesia — Aktif 24/7, Berbahasa Indonesia, Tanpa Halusinasi

**Footer:**
Hacktiv8 National Hackathon 2026 × IBM SkillsBuild
Tema: Productivity & Smart Business
[Nama kamu & tim]

**Narasi:** "Kami mengubah dokumen bisnis menjadi pegawai customer service yang bekerja 24 jam."

---

## SLIDE 2 — Masalah

**Judul:** Jutaan UMKM, Nol Tim Customer Service

**3 poin:**
- 🕐 Pertanyaan sama dijawab manual, berulang setiap hari: harga, stok, cara order
- 🌙 Di luar jam kerja, chat pelanggan menganggur — calon pembeli pergi
- 📄 Ironi: semua jawabannya SUDAH ada di dokumen bisnis (katalog, price list, FAQ) — tapi "tidak bisa bicara"

**Angka kunci (di banner):** Puluhan juta UMKM Indonesia • 1 orang melayani semuanya sendirian

**Narasi:** Ceritakan tokoh: pemilik butik batik yang melayani chat sambil mencuci batik, balasan telat 6 jam, pembeli batal.

---

## SLIDE 3 — Solusi

**Judul:** Ubah Dokumen Jadi Asisten yang Bicara

**Diagram teks sederhana (kiri → kanan):**
Dokumen Bisnis (katalog, price list, FAQ) → [ UPLOAD ] → Asisten AI "Rara" → Jawab pelanggan 24/7, Bahasa Indonesia

**3 keunggulan ringkas:**
- Setup < 30 menit, tanpa kode — cukup upload dokumen
- Jawaban HANYA dari dokumen resmi (RAG) — tidak mengarang
- Info yang tidak ada → jujur diakui & diteruskan ke pemilik

**Narasi:** Tekankan: pemilik tidak belajar apa pun baru; dia sudah punya dokumennya.

---

## SLIDE 4 — Demo / Cara Kerja Singkat

**Judul:** Lihat Dia Bekerja

**2 kotak dialog (tiruan chat):**
> Pelanggan: "Berapa harga Batik Tulis Mega Mendung Premium?"
> Rara: "Rp 1.850.000, Kak — batik tulis penuh, kain primissima, pewarna alami indigo."

> Pelanggan: "Diskon 50% bisa, Kak?"
> Rara: "Mohon maaf Kak, ketentuan itu belum ada di dokumen kami. Pertanyaan Kakak saya teruskan ke admin ya."

**Caption bawah:** Akurat saat datanya ada. Jujur saat datanya tidak ada.

**Narasi:** Kalau ada video demo, ini slide pembanding statisnya; kalau live demo, lewati cepat.

---

## SLIDE 5 — Arsitektur & AI Agent

**Judul:** Dibangun Penuh di Stack IBM

**Alur (teks berpanah):**
Dokumen (katalog, price list, FAQ) → Backend Next.js (`POST /api/chat`) → read knowledge + system prompt → panggil LLM (Ollama / Gemini) → Jawaban Grounded / Penolakan + Eskalasi
                                                          ↘ diuji via eval otomatis (`run_evals.py`)

**3 poin teknis:**
- Backend sendiri: Next.js route handler + `lib/rag.ts`, membaca dokumen & prompt tiap request
- LLM: Ollama (IBM Granite 3.3 8B lokal) atau Google Gemini
- Evaluasi: 20 kasus otomatis (tanpa API key eksternal), termasuk 7 kasus anti-halusinasi

**Narasi:** Satu kalimat per teknologi — jangan masuki detail chunking di sini.

---

## SLIDE 6 — Responsible AI (bukan slide pelengkap!)

**Judul:** Asisten yang Boleh Dipercaya Pelanggan

**3 poin:**
- 🚫 Anti-halusinasi terukur: 7 skenario jebakan (diskon fiktif, nomor telepon, cabang, promo) — 7/7 ditolak dengan benar, nol fakta karangan
- 👤 Human-in-the-loop: pertanyaan di luar cakupan diteruskan ke manusia, bukan diimprovisasi
- 🔒 Privasi: tidak meminta/menyimpan data pribadi pelanggan; jawaban hanya dari dokumen resmi pemilik

**Banner:** Diverifikasi 20 kasus uji otomatis: 12 lulus, 6 minor, 0 fakta karangan; C1–C7 (anti-halusinasi) berhasil ditolak

**Narasi:** Ini pembeda terbesar vs chatbot generik — sampaikan dengan percaya diri.

---

## SLIDE 7 — Dampak

**Judul:** Dampak yang Terukur

**4 kartu angka:**
- **19×** — cakupan layanan: dari ±9 jam/hari → 168 jam/minggu penuh
- **<1 mnt** — respons instan vs menunggu balasan admin
- **20 kasus** — eval otomatis: 0 fakta karangan, 7/7 jebakan ditolak
- **<30 mnt** — setup dari nol, tanpa satu baris kode untuk pemilik

**Narasi:** Dampak pertama (jam layanan) adalah yang paling mudah dipahami juri — mulai dari situ.

---

## SLIDE 8 — Pembeda

**Judul:** Kenapa Berbeda dari Chatbot Lain?

**Tabel 3 kolom:**
| | Chatbot Generik | Chatbot Komersial | **UMKM Assistant** |
|---|---|---|---|
| Sumber jawaban | Pengetahuan model (bisa ngarang) | Terkonfigurasi | **Dokumen resmi pemilik (RAG)** |
| Biaya/ kompleksitas | — | Mahal, setup rumit | **Gratis, upload dokumen** |
| Kejujuran terukur | Tidak | Tidak | **20 kasus eval otomatis** |

**Narasi:** Posisikan bukan sebagai "chatbot lebih pintar", tapi "chatbot yang bisa dipercaya".

---

## SLIDE 9 — Roadmap & Skalabilitas

**Judul:** Dari Satu Butik ke Jutaan UMKM

**Timeline 3 langkah:**
1. **Sekarang** — RAG chat + eval suite otomatis (selesai & teruji)
2. **Berikutnya** — Channel nyata: WhatsApp Business / Instagram DM; panel eskalasi untuk admin
3. **Skala** — Multi-tenant SaaS: 1 platform, ribuan UMKM, tiap toko punya knowledge base sendiri; migrasi ke LLM cloud bila perlu; dukungan bahasa daerah

**Narasi:** Pola "ganti dokumen = asisten baru" membuat replikasi hampir tanpa biaya.

---

## SLIDE 10 — Penutup

**Judul besar:**
Dokumen Bisnis Anda, Kini Bisa Menjawab.

**Subjudul:**
UMKM Assistant — layanan pelanggan 24/7 yang akurat, jujur, dan berbahasa Indonesia.

**Footer:**
GitHub: github.com/lenathea913/RAG-UMKM-Assistant-2.0
Stack: Next.js • Ollama (IBM Granite) / Gemini • backend RAG sendiri
Terima kasih!

**Narasi:** Tutup dengan ajakan: "Setiap UMKM yang punya dokumen, hari ini bisa punya CS."

---

## Checklist desain

- [ ] Konsisten 1 font judul + 1 font isi
- [ ] Warna: pakai palet batik/indigo (nyambung dengan contoh bisnis)
- [ ] Setiap slide ada visual: ikon, diagram, atau mockup chat (jangan teks polos)
- [ ] Export PDF (jaga < 10 MB) — nama file: `UMKM-Assistant-PitchDeck.pdf`
- [ ] Simpan juga `.pptx`-nya ke folder `submission/` lalu commit
