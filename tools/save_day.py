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
FIELDS = "cm,cs,ci,ua,ka,ia,ub,kb,ib,uc,kc,ic,cp,kp,ip,cu,mb,sa,sn,sp,si,fc".split(",")


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
    # 2つ目以降の引数：スニダン（SNKDUMP）・フリマBOX相場（FLEADUMP）の結果（任意）
    snk = None
    flea = {}
    fcard = {}
    for path in sys.argv[2:]:
        txt = open(path, encoding="utf-8").read()
        if "FCARDDUMP" in txt:
            try:
                arr = json.loads(txt)
                if isinstance(arr, list):
                    txt = "".join(x.get("text", "") for x in arr if isinstance(x, dict))
            except Exception:
                pass
            body = re.search(r"FCARDDUMP(.*?)ENDDUMP", txt, re.S).group(1)
            try:
                f = json.loads(body)
            except Exception:
                f = json.loads(json.loads('"' + body + '"'))
            if f.get("state") == "done" and f.get("date") == day.get("date"):
                fcard[f.get("site")] = f.get("res", {})
            else:
                print("カードのフリマ(" + str(f.get("site")) + ")の結果は日付不一致または未完了のため使いません", file=sys.stderr)
            continue
        if "FLEADUMP" in txt:
            try:
                arr = json.loads(txt)
                if isinstance(arr, list):
                    txt = "".join(x.get("text", "") for x in arr if isinstance(x, dict))
            except Exception:
                pass
            body = re.search(r"FLEADUMP(.*?)ENDDUMP", txt, re.S).group(1)
            try:
                f = json.loads(body)
            except Exception:
                f = json.loads(json.loads('"' + body + '"'))
            if f.get("state") == "done" and f.get("date") == day.get("date"):
                flea[f.get("site")] = f.get("res", {})
            else:
                print("フリマ(" + str(f.get("site")) + ")の結果は日付不一致または未完了のため使いません", file=sys.stderr)
        else:
            snk = load_snk(path)
    if flea:
        bxf = {}
        for k in set(list(flea.get("y", {})) + list(flea.get("m", {}))):
            # [Yテープ付き, 件数, Mテープ付き, 件数, Yテープカット, 件数, Mテープカット, 件数]
            y = (flea.get("y", {}).get(k) or []) + [None, 0, None, 0]
            m = (flea.get("m", {}).get(k) or []) + [None, 0, None, 0]
            bxf[k] = [y[0], y[1], m[0], m[1], y[2], y[3], m[2], m[3]]
        day["bxf"] = json.dumps(bxf, ensure_ascii=False, separators=(",", ":"))
        # 相場に使ったフリマの出品（最新日分だけを別ファイルに保存）
        items = {"date": day.get("date"), "y": {}, "m": {}}
        for site in ("y", "m"):
            for k, v in flea.get(site, {}).items():
                if isinstance(v, list) and len(v) > 4 and v[4]:
                    items[site][k] = v[4]
        ip_ = os.path.join(ROOT, "data", "flea_items.json")
        json.dump(items, open(ip_, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    if fcard:
        # 高額カードのフリマ相場：その日の合算中央値をCSV(fc)に、詳細は data/flea_cards.json に上書き保存
        n = len(json.load(open(os.path.join(ROOT, "tools", "masterkeys.json"))))
        KL = json.load(open(os.path.join(ROOT, "tools", "masterkeys.json")))
        pos = {k: i for i, k in enumerate(KL)}
        fp = os.path.join(ROOT, "data", "flea_cards.json")
        store = json.load(open(fp)) if os.path.exists(fp) else {}
        fc = [""] * n
        for k in set(list(fcard.get("y", {})) + list(fcard.get("m", {}))):
            y = fcard.get("y", {}).get(k) or [None, 0, []]
            m = fcard.get("m", {}).get(k) or [None, 0, []]
            store[k] = {"d": day.get("date"), "y": y, "m": m}
            tot = (y[1] or 0) + (m[1] or 0)
            if tot and k in pos:
                v = ((y[0] or 0) * (y[1] or 0) + (m[0] or 0) * (m[1] or 0)) / tot
                fc[pos[k]] = str(int(round(v)))
        day["fc"] = ",".join(fc)
        json.dump(store, open(fp, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    if snk is not None:
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
