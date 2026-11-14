#!/usr/bin/env python3
"""1日分の相場データを data/<日付>.json に保存し、data/index.json を更新する。

使い方:
  python3 tools/save_day.py <ファイル>
ファイルは、ブラウザで window.__opDump() を実行した結果が保存されたもの
（ツール出力の保存ファイル＝JSON配列でも、DAYDUMP...ENDDUMP を含むテキストでもよい）、
または 1日分のJSONそのもの。
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIELDS = "cm,cs,ci,ua,ka,ia,ub,kb,ib,uc,kc,ic,cp,kp,ip,cu,mb,sa,sn,sp,si".split(",")


def load(path):
    raw = open(path, encoding="utf-8").read()
    text = raw
    try:  # ツール出力の保存形式 [{type,text}]
        arr = json.loads(raw)
        if isinstance(arr, list):
            text = "".join(x.get("text", "") for x in arr if isinstance(x, dict))
        elif isinstance(arr, dict) and arr.get("v") == "m1":
            return arr
        elif isinstance(arr, str):
            text = arr
    except Exception:
        pass
    m = re.search(r"DAYDUMP(.*?)ENDDUMP", text, re.S)
    if not m:
        sys.exit("DAYDUMP ... ENDDUMP が見つかりません")
    body = m.group(1)
    try:
        return json.loads(body)
    except Exception:
        return json.loads(json.loads('"' + body + '"'))  # 二重にエスケープされている場合


def load_snk(path):
    text = open(path, encoding="utf-8").read()
    try:
        arr = json.loads(text)
        if isinstance(arr, list):
            text = "".join(x.get("text", "") for x in arr if isinstance(x, dict))
        elif isinstance(arr, dict):
            return arr
    except Exception:
        pass
    m = re.search(r"SNKDUMP(.*?)ENDDUMP", text, re.S)
    if not m:
        sys.exit("SNKDUMP ... ENDDUMP が見つかりません")
    body = m.group(1)
    try:
        return json.loads(body)
    except Exception:
        return json.loads(json.loads('"' + body + '"'))


def main():
    day = load(sys.argv[1])
    # 2つ目の引数：スニダンの結果（任意）
    if len(sys.argv) > 2:
        snk = load_snk(sys.argv[2])
        if snk.get("state") == "done" and snk.get("date") == day.get("date"):
            for f in ("sa", "sn", "sp", "si"):
                if snk.get(f):
                    day[f] = snk[f]
            day["snItems"] = snk.get("snItems")
        else:
            print("スニダンの結果は日付不一致または未完了のため使いません", file=sys.stderr)
    day["v"] = "m1"
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", day.get("date", "")):
        sys.exit("データ形式が不正です")
    n = json.load(open(os.path.join(ROOT, "tools", "nkeys.json")))
    for f in FIELDS:
        if f in day and len(day[f].split(",")) > n:
            sys.exit(f"{f} の件数が {len(day[f].split(','))}（期待値 {n}）")
    if "bx" in day:
        json.loads(day["bx"])
    d = os.path.join(ROOT, "data")
    os.makedirs(d, exist_ok=True)
    json.dump(day, open(os.path.join(d, day["date"] + ".json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    ip = os.path.join(d, "index.json")
    idx = json.load(open(ip)) if os.path.exists(ip) else []
    if day["date"] not in idx:
        idx.append(day["date"])
    idx.sort()
    json.dump(idx, open(ip, "w"))
    print(json.dumps({"date": day["date"], "fields": [f for f in FIELDS if f in day], "box": "bx" in day,
                      "crItems": day.get("crItems"), "mcItems": day.get("mcItems"), "days": len(idx)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
