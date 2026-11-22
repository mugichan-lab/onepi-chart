# 過去の指数（スニダン取引相場から算出）を作る
# 使い方: python3 tools/index_hist.py <snkchart.json>
#   snkchart.json: {key: [[YYYY-MM-DD, price], ...]}（スニダンの状態A取引チャート）
# 出力: data/index_hist.json {dates:[...], vals:[...], ratio, src}
#   各日について「その時点で価格がわかるカード」の高額上位100枚の平均を取り、
#   毎日記録している指数（カードラッシュ販売価格）と重なる期間の比率で換算する。
import json, sys, os, datetime as dt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOP = 100
STALE = 120  # 最後の取引からこの日数を過ぎたら対象外

chart = json.load(open(sys.argv[1]))
keys = json.load(open(os.path.join(ROOT, "tools", "masterkeys.json")))
KI = {k: i for i, k in enumerate(keys)}

D = lambda s: dt.date.fromisoformat(s)
# 日ごとの価格（同じ日に複数あれば中央値）
cards = {}
for k, pts in chart.items():
    if not pts: continue
    by = {}
    for d, p in pts:
        if p and p > 0: by.setdefault(d, []).append(p)
    if not by: continue
    cards[k] = {d: sorted(v)[len(v) // 2] for d, v in by.items()}

start = min(min(v) for v in cards.values())
end = dt.date.today().isoformat()

def snk_index(days):
    out = []
    state = {}  # key -> (price, last_date)
    evs = {}
    for k, m in cards.items():
        for d, p in m.items(): evs.setdefault(d, []).append((k, p))
    cur = D(start)
    allv = {}
    while cur.isoformat() <= max(days):
        ds = cur.isoformat()
        for k, p in evs.get(ds, []): state[k] = (p, cur)
        live = [p for k, (p, ld) in state.items() if (cur - ld).days <= STALE]
        live.sort(reverse=True)
        top = live[:TOP]
        allv[ds] = (sum(top) / len(top), len(top)) if len(top) >= 20 else None
        cur += dt.timedelta(days=1)
    return allv

# 毎日の記録（カードラッシュ）の指数を再計算して重なり期間の比率を出す
idx = json.load(open(os.path.join(ROOT, "data", "index.json")))
real = {}
docs = {}
for d in idx:
    try: docs[d] = json.load(open(os.path.join(ROOT, "data", d + ".json")))
    except Exception: pass
cm = {d: [(float(x) if x else None) for x in doc.get("cm", "").split(",")] for d, doc in docs.items() if doc.get("cm")}
ds = sorted(cm)
if ds:
    last = cm[ds[-1]]
    members = sorted([i for i, v in enumerate(last) if v is not None], key=lambda i: -last[i])[:TOP]
    for d in ds:
        a = cm[d]
        vals = []
        for i in members:
            v = a[i] if i < len(a) else None
            if v is None:  # 直前の値で補う
                for d2 in reversed([x for x in ds if x < d]):
                    w = cm[d2][i] if i < len(cm[d2]) else None
                    if w is not None: v = w; break
            if v is None:
                for d2 in [x for x in ds if x > d]:
                    w = cm[d2][i] if i < len(cm[d2]) else None
                    if w is not None: v = w; break
            vals.append(v or 0)
        real[d] = sum(vals) / len(members)

sv = snk_index(ds or [end])
first_real = ds[0] if ds else end
dates, raw = [], []
for d in sorted(sv):
    if not sv[d]: continue
    dates.append(d); raw.append(sv[d][0])
# 取引のばらつきをならすため7日移動平均
vals = [round(sum(raw[max(0, i - 6):i + 1]) / len(raw[max(0, i - 6):i + 1])) for i in range(len(raw))]
# 換算はページ側で行う（毎日の記録と重なる日の比率の中央値）。overlap には重なる日の値も含める
json.dump({"dates": dates, "vals": vals, "first_real": first_real, "src": "snkrdunk_A", "built": end},
          open(os.path.join(ROOT, "data", "index_hist.json"), "w"), separators=(",", ":"))
print("days", len(dates), dates[:1], dates[-1:], "cards", len(cards))
