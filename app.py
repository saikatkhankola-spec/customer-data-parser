import re

import pandas as pd
from flask import Flask, jsonify, render_template, request
from collections import Counter

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024  # 5 MB upload limit

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def squash(text):
    """Trim the ends and collapse repeated spaces."""
    return " ".join(text.split())


def clean_value(column, raw):
    """Clean one value. Returns the dict the page expects."""
    raw = "" if raw is None else str(raw)
    col = column.lower()

    if raw.strip() == "":
        return {"raw": "", "clean": "", "status": "missing", "note": f"No {col} given"}

    if "email" in col:
        clean = raw.strip().lower()
        if not EMAIL_RE.match(clean):
            return {"raw": raw, "clean": raw, "status": "invalid",
                    "note": "Not a valid email address"}

    elif "phone" in col or "mobile" in col:
        digits = re.sub(r"\D", "", raw)
        if len(digits) == 12 and digits.startswith("91"):
            digits = digits[2:]
        elif len(digits) == 11 and digits.startswith("0"):
            digits = digits[1:]
        if len(digits) != 10:
            return {"raw": raw, "clean": raw, "status": "invalid",
                    "note": "Needs 10 digits"}
        clean = digits

    elif "name" in col or "city" in col:
        clean = squash(raw).title()

    else:
        clean = squash(raw)

    status = "ok" if clean == raw else "fixed"
    return {"raw": raw, "clean": clean, "status": status, "note": ""}


def read_table(file):
    """Read an uploaded CSV or Excel file with every value kept as text."""
    name = (file.filename or "").lower()
    if name.endswith(".csv"):
        return pd.read_csv(file, dtype=str, keep_default_na=False)
    if name.endswith((".xlsx", ".xls")):
        return pd.read_excel(file, dtype=str, keep_default_na=False)
    raise ValueError("Please upload a .csv or .xlsx file.")


def build_report(columns, rows):
    """Count how clean the data was before and after cleaning."""
    per_column = {c: {"ok": 0, "fixed": 0, "problem": 0} for c in columns}
    issues = Counter()
    clean_rows = fixed_rows = problem_rows = 0

    for row in rows:
        statuses = []
        for c in columns:
            field = row["fields"][c]
            status = field["status"]
            statuses.append(status)
            if status in ("invalid", "missing"):
                per_column[c]["problem"] += 1
                issues[f"{c.title()}: {field['note']}"] += 1
            else:
                per_column[c][status] += 1

        if any(s in ("invalid", "missing") for s in statuses):
            problem_rows += 1
        elif "fixed" in statuses:
            fixed_rows += 1
        else:
            clean_rows += 1

    total = len(rows) * len(columns)
    ok = sum(v["ok"] for v in per_column.values())
    fixed = sum(v["fixed"] for v in per_column.values())

    return {
        "before_pct": round(100 * ok / total),
        "after_pct": round(100 * (ok + fixed) / total),
        "per_column": per_column,
        "rows": {
            "clean": clean_rows,
            "fixed": fixed_rows,
            "problem": problem_rows,
            "duplicates": sum(1 for r in rows if r["duplicate_of"]),
        },
        "top_issues": [{"label": k, "count": v} for k, v in issues.most_common(5)],
    }

@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/parse", methods=["POST"])
def parse():
    file = request.files.get("file")
    if file is None or file.filename == "":
        return jsonify(error="No file was uploaded."), 400

    try:
        df = read_table(file)
    except ValueError as e:
        return jsonify(error=str(e)), 400
    except Exception:
        return jsonify(error="This file could not be read. Check that it is a valid CSV or Excel file."), 400

    if df.empty:
        return jsonify(error="The file has no rows."), 400

    columns = [str(c).strip().lower() for c in df.columns]
    df.columns = columns

    rows, seen = [], {}
    for i, record in enumerate(df.to_dict(orient="records"), start=1):
        fields = {c: clean_value(c, record[c]) for c in columns}

        # a repeated email (or an identical row) counts as a duplicate
        email_col = next((c for c in columns if "email" in c), None)
        key = fields[email_col]["clean"] if email_col else None
        if not key:
            key = "|".join(f["clean"] for f in fields.values())
        duplicate_of = None
        if key.strip("|"):
            duplicate_of = seen.get(key)
            seen.setdefault(key, i)

        rows.append({"n": i, "duplicate_of": duplicate_of, "fields": fields})

    return jsonify(columns=columns, rows=rows, report=build_report(columns, rows))


if __name__ == "__main__":
    app.run(debug=True)
