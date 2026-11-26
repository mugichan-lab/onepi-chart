# 有料会員向けの詳細データを暗号化して公開リポジトリに置き、無料向けの中央値データを作る
#
#   python3 tools/secure.py pack     # data/ の詳細ファイル → secure/*.bin（暗号化）＋ data/pub/（中央値のみ）
#   python3 tools/secure.py unpack   # secure/*.bin → data/ に復元（毎日の取得の最初に実行）
#
# 鍵は環境変数 MUGI_KEY（base64の32バイト）か、ファイル ~/.mugikey から読む。
# 鍵はサーバー（Supabase の app_secrets）にも置いてあり、有料会員にだけ復号して返す。
import base64, glob, gzip, json, os, statistics, sys
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
SEC = os.path.join(ROOT, "secure")
PUB = os.path.join(DATA, "pub")
EXTRA = ["flea_items.json", "flea_cards.json", "snk_hist.json"]

def key():
    k = os.environ.get("MUGI_KEY")
    if not k:
        p = os.path.expanduser("~/.mugikey")
        if os.path.exists(p): k = open(p).read().strip()
    if not k: sys.exit("MUGI_KEY がありません")
    return base64.b64decode(k)

def enc(raw: bytes) -> bytes:
    n = os.urandom(12)
    return base64.b64encode(n + AESGCM(key()).encrypt(n, gzip.compress(raw, 9), None))

def dec(b64: bytes) -> bytes:
    b = base64.b64decode(b64)
    return gzip.decompress(AESGCM(key()).decrypt(b[:12], b[12:], None))

def csv(s):
    return [(float(x) if x not in ("", None) else None) for x in (s or "").split(",")] if s else []

def med(vals):
    v = [x for x in vals if x is not None and x > 0]
    return round(statistics.median(v)) if v else None

def flea_mix(a, o=0):
    if not a: return None
    y, yn, m, mn = a[o], a[o + 1] or 0, a[o + 2], a[o + 3] or 0
    if y is None and m is None: return None
    if y is None: return m
    if m is None: return y
    return round((y * yn + m * mn) / (yn + mn)) if (yn + mn) else round((y + m) / 2)

def pub_doc(d):
    cm, mb, sa, fc = csv(d.get("cm")), csv(d.get("mb")), csv(d.get("sa")), csv(d.get("fc"))
    n = max(len(cm), len(mb), len(sa), len(fc))
    g = lambda a, i: a[i] if i < len(a) else None
    md = [med([g(cm, i), g(mb, i), g(sa, i), g(fc, i)]) for i in range(n)]
    try: bx = json.loads(d["bx"]) if d.get("bx") else {}
    except Exception: bx = {}
    try: bxf = json.loads(d["bxf"]) if d.get("bxf") else {}
    except Exception: bxf = {}
    bmd = {}
    for k in set(bx) | set(bxf):
        a = bx.get(k) or []
        v = med([a[0] if len(a) > 0 else None, a[6] if len(a) > 6 else None, flea_mix(bxf.get(k))])
        if v: bmd[k] = v
    return {"v": "pub1", "date": d.get("date"), "md": ",".join("" if x is None else str(x) for x in md), "bmd": bmd}

def pack():
    os.makedirs(SEC, exist_ok=True); os.makedirs(PUB, exist_ok=True)
    idx = json.load(open(os.path.join(DATA, "index.json")))
    done = []
    for d in idx:
        p = os.path.join(DATA, d + ".json")
        if not os.path.exists(p): continue
        raw = open(p, "rb").read()
        open(os.path.join(SEC, d + ".bin"), "wb").write(enc(raw))
        json.dump(pub_doc(json.loads(raw)), open(os.path.join(PUB, d + ".json"), "w"), separators=(",", ":"))
        done.append(d)
    for f in EXTRA:
        p = os.path.join(DATA, f)
        if os.path.exists(p): open(os.path.join(SEC, f.replace(".json", ".bin")), "wb").write(enc(open(p, "rb").read()))
    json.dump(done, open(os.path.join(SEC, "index.json"), "w"))
    json.dump(done, open(os.path.join(PUB, "index.json"), "w"))
    print("packed", len(done), "days +", [f for f in EXTRA if os.path.exists(os.path.join(DATA, f))])

def unpack():
    os.makedirs(DATA, exist_ok=True)
    n = 0
    for p in glob.glob(os.path.join(SEC, "*.bin")):
        name = os.path.basename(p)[:-4] + ".json"
        open(os.path.join(DATA, name), "wb").write(dec(open(p, "rb").read())); n += 1
    if os.path.exists(os.path.join(SEC, "index.json")):
        json.dump(json.load(open(os.path.join(SEC, "index.json"))), open(os.path.join(DATA, "index.json"), "w"))
    print("unpacked", n)

if __name__ == "__main__":
    {"pack": pack, "unpack": unpack}[sys.argv[1]]()
