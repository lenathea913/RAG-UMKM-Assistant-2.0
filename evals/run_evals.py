#!/usr/bin/env python3
"""
run_evals.py — jalankan eval UMKM Assistant lewat API chat lokal
(tanpa Playground, tanpa Langflow, tanpa API key).

Prasyarat: frontend jalan (`npm run dev` di frontend/) dan Ollama aktif
dengan model yang dipilih di .env.local (OLLAMA_MODEL).

Cara pakai:
  python run_evals.py --inspect      # preflight: Ollama, model, dokumen KB
  python run_evals.py --ids A1 A3    # jalankan soal tertentu
  python run_evals.py --all          # jalankan semua 20 soal (lambat! 8B di CPU bisa >1 jam)

Hasil: dicetak ke layar + disimpan (merge per ID) ke evals/eval-run-latest.json.
Env opsional: APP_BASE_URL (default http://localhost:3000).
"""
import argparse
import gzip
import json
import os
import time
import urllib.error
import urllib.request

BASE = os.environ.get("APP_BASE_URL", "http://localhost:3000").rstrip("/")
RESULTS_PATH = os.path.join(os.path.dirname(__file__), "eval-run-latest.json")

# 20 soal eval (sumber kebenaran: eval-questions.md)
QUESTIONS = {
    "A1": ("grounding", "Berapa harga Batik Tulis Mega Mendung Premium?"),
    "A2": ("grounding", "Ada stok kemeja Parang Rusak ukuran XXL?"),
    "A3": ("grounding", "Cara ordernya gimana, Kak?"),
    "A4": ("grounding", "Batik tulis bisa langsung kirim hari ini?"),
    "A5": ("grounding", "Kalau beli 10 pcs campur buat dijual lagi, ada harga khusus?"),
    "A6": ("grounding", "Gimana cara ngerawat batik tulisnya?"),
    "A7": ("grounding", "Gratis ongkir nggak ke luar Jawa?"),
    "A8": ("grounding", "Motif buketan yang klasik warnanya gimana?"),
    "B1": ("multi-doc", "Dress Buketan ukuran S ada nggak, harganya berapa?"),
    "B2": ("multi-doc", "Mega Mendung cap sama tulis, beda harga berapa jauh?"),
    "B3": ("multi-doc", "Beli kemeja + dress dapat potongan nggak?"),
    "C1": ("anti-halusinasi", "Batik tulisnya bisa diskon 50% nggak?"),
    "C2": ("anti-halusinasi", "Toko ini buka cabang di Bandung nggak?"),
    "C3": ("anti-halusinasi", "Kode promo apa yang aktif bulan ini?"),
    "C4": ("anti-halusinasi", "Nomor WhatsApp adminnya berapa?"),
    "C5": ("anti-halusinasi", "Rekomendasi obat batuk apa yang bagus?"),
    "C6": ("anti-halusinasi", "Batik Parang Rusak boleh dicuci mesin?"),
    "C7": ("anti-halusinasi", "Harga Mega Mendung Premium kalau dibayar tunai diskon 10%?"),
    "D1": ("bahasa", "Gan, batiknya ready?"),
    "D2": ("bahasa", "Is the Mega Mendung Premium available?"),
}


def api(path, method="GET", payload=None, timeout=600):
    req = urllib.request.Request(
        BASE + path,
        method=method,
        data=json.dumps(payload).encode() if payload is not None else None,
        headers={
            "Content-Type": "application/json",
            "Accept-Encoding": "identity",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        raw = r.read()
        if raw[:2] == b"\x1f\x8b":  # respons ter-gzip
            raw = gzip.decompress(raw)
        return json.loads(raw.decode())


def inspect_app():
    """Preflight: cek backend, Ollama, model, dan dokumen knowledge base."""
    try:
        h = api("/api/chat")
    except Exception as e:
        raise SystemExit(
            f"Backend tidak bisa dihubungi di {BASE}: {e}\n"
            "Jalankan dulu: cd frontend && npm run dev"
        )

    print(f"Endpoint : {BASE}/api/chat")
    print(f"Ollama   : {h.get('ollamaUrl')} - {'OK' if h.get('ollamaOk') else 'TIDAK TERHUBUNG'}")
    print(f"Model    : {h.get('model')} - {'siap' if h.get('modelReady') else 'BELUM DI-PULL'}")
    if h.get("models"):
        print(f"  tersedia: {', '.join(h['models'])}")
    if h.get("kbError"):
        print(f"KB       : GAGAL - {h['kbError']}")
    else:
        print(f"KB       : {', '.join(h.get('kbFiles') or [])}")
    print()

    problems = []
    if not h.get("ollamaOk"):
        problems.append("Ollama tidak jalan (jalankan aplikasi Ollama / ollama serve)")
    if not h.get("modelReady"):
        problems.append(f"model {h.get('model')} belum di-pull (ollama pull {h.get('model')})")
    if h.get("kbError"):
        problems.append("knowledge base tidak terbaca")
    if problems:
        raise SystemExit("Preflight gagal:\n- " + "\n- ".join(problems))
    print("Preflight OK - siap menjalankan eval.\n")


def run_one(qid, timeout):
    cat, q = QUESTIONS[qid]
    payload = {"message": q, "sessionId": f"eval-{qid}-{int(time.time())}"}
    t0 = time.time()
    try:
        resp = api("/api/chat", "POST", payload, timeout=timeout)
        if resp.get("error"):
            answer, err = "", f"{resp['error']} {resp.get('detail', '')}".strip()
        else:
            answer, err = (resp.get("text") or "").strip(), None
    except urllib.error.HTTPError as e:
        answer, err = "", f"HTTP {e.code}: {e.read().decode()[:200]}"
    except Exception as e:
        answer, err = "", f"{type(e).__name__}: {e}"
    rec = {
        "id": qid,
        "kategori": cat,
        "soal": q,
        "jawaban": answer,
        "durasi_detik": round(time.time() - t0),
        "error": err,
        "model_catatan": "sesuai OLLAMA_MODEL saat dijalankan",
    }
    return rec


def save_results(new_records):
    allr = {}
    if os.path.exists(RESULTS_PATH):
        try:
            with open(RESULTS_PATH, encoding="utf-8") as f:
                for r in json.load(f):
                    allr[r["id"]] = r
        except Exception:
            pass
    for r in new_records:
        allr[r["id"]] = r
    with open(RESULTS_PATH, "w", encoding="utf-8") as f:
        json.dump(list(allr.values()), f, ensure_ascii=False, indent=2)
    print(f"\n>> {len(new_records)} hasil disimpan/merge ke {RESULTS_PATH}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--inspect", action="store_true", help="preflight: cek backend, Ollama, model, KB")
    ap.add_argument("--ids", nargs="+", help="ID soal, contoh: --ids A3 C1")
    ap.add_argument("--all", action="store_true", help="jalankan semua soal")
    ap.add_argument("--timeout", type=int, default=600, help="detik per soal")
    args = ap.parse_args()

    inspect_app()

    if args.inspect:
        return

    if args.all:
        ids = list(QUESTIONS)
    elif args.ids:
        ids = [i.upper() for i in args.ids]
        unknown = [i for i in ids if i not in QUESTIONS]
        if unknown:
            raise SystemExit(f"ID tidak dikenal: {unknown}. Pilihan: {', '.join(QUESTIONS)}")
    else:
        raise SystemExit("Pilih --ids ... atau --all (lihat --help)")

    records = []
    for qid in ids:
        cat, q = QUESTIONS[qid]
        print(f"[{qid}|{cat}] {q}")
        rec = run_one(qid, args.timeout)
        records.append(rec)
        save_results([rec])  # simpan inkremental — aman bila proses terputus
        jaw = (rec["jawaban"] or rec["error"] or "").replace("\n", " ")
        print(f"  ({rec['durasi_detik']}s) {jaw[:260]}{'...' if len(jaw) > 260 else ''}\n", flush=True)


if __name__ == "__main__":
    main()
