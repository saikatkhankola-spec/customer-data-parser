
const $ = (id) => document.getElementById(id);
let data = null;
let filter = "all";
 
/* ---------- sample data (works without the backend) ---------- */
const ok = (v) => ({ raw: v, clean: v, status: "ok", note: "" });
const fx = (r, c) => ({ raw: r, clean: c, status: "fixed", note: "" });
const bad = (v, note) => ({ raw: v, clean: v, status: "invalid", note });
const none = (note) => ({ raw: "", clean: "", status: "missing", note });
 
const SAMPLE = {
  columns: ["name", "email", "phone", "city"],
  rows: [
    { n: 1, duplicate_of: null, fields: {
      name: fx("rahul sharma ", "Rahul Sharma"), email: fx("RAHUL@GMAIL.COM", "rahul@gmail.com"),
      phone: fx("98300-12345", "9830012345"), city: fx("kolkata", "Kolkata") } },
    { n: 2, duplicate_of: null, fields: {
      name: ok("Priya Das"), email: bad("priya.das@outlook", "Ends without a domain like .com"),
      phone: fx("+91 98765 43210", "9876543210"), city: ok("Howrah") } },
    { n: 3, duplicate_of: null, fields: {
      name: fx("amit  roy", "Amit Roy"), email: ok("amit@yahoo.com"),
      phone: bad("12345", "Needs 10 digits"), city: none("No city given") } },
    { n: 4, duplicate_of: 1, fields: {
      name: ok("Rahul Sharma"), email: ok("rahul@gmail.com"),
      phone: ok("9830012345"), city: ok("Kolkata") } },
    { n: 5, duplicate_of: null, fields: {
      name: ok("Sneha Paul"), email: ok("sneha.paul@gmail.com"),
      phone: ok("9123456780"), city: ok("Durgapur") } },
  ],
};
 
/* ---------- helpers ---------- */
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}
 
function showNotice(msg) {
  $("notice").textContent = msg;
  $("notice").hidden = !msg;
}
 
const isBad = (f) => f.status === "invalid" || f.status === "missing";
const needsAttention = (r) => r.duplicate_of || Object.values(r.fields).some(isBad);
const hasFixed = (r) => Object.values(r.fields).some((f) => f.status === "fixed");
 
/* ---------- upload ---------- */
async function upload(file) {
  if (!file) return;
  showNotice("");
  $("tray-title").textContent = "Reading " + file.name + "…";
  try {
    const body = new FormData();
    body.append("file", file);
    let res;
    try {
      res = await fetch("/api/parse", { method: "POST", body });
    } catch {
      throw new Error("Could not reach the server. Check that app.py is running, then try again.");
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "The server could not read this file.");
    }
    data = await res.json();
    show();
  } catch (e) {
    showNotice(e.message);
  } finally {
    $("tray-title").textContent = "Drop a CSV or Excel file here";
  }
}
 
/* ---------- render ---------- */
function show() {
  filter = "all";
  document.querySelectorAll(".filters button").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.f === "all"))
  );
  $("proof").hidden = false;
  render();
  renderReport(data.report);
  $("proof").scrollIntoView({ behavior: "smooth" });
}
 
function render() {
  const { columns, rows } = data;
  let fixed = 0, attention = 0, dupes = 0;
  rows.forEach((r) => {
    if (r.duplicate_of) dupes++;
    columns.forEach((c) => {
      const s = r.fields[c].status;
      if (s === "fixed") fixed++;
      else if (s === "invalid" || s === "missing") attention++;
    });
  });
  $("summary").textContent =
    `${rows.length} rows read. ${fixed} values fixed, ${attention} need your attention, ` +
    `${dupes} duplicate${dupes === 1 ? "" : "s"}.`;
 
  const table = $("table");
  table.replaceChildren();
 
  const head = el("tr");
  head.append(el("th", "", "Row"));
  columns.forEach((c) => head.append(el("th", "", c.charAt(0).toUpperCase() + c.slice(1))));
  const thead = el("thead");
  thead.append(head);
  table.append(thead);
 
  const body = el("tbody");
  rows
    .filter((r) => filter === "all" || (filter === "attention" ? needsAttention(r) : hasFixed(r)))
    .forEach((r, i) => {
      const tr = el("tr", r.duplicate_of ? "dupe" : "");
      tr.style.setProperty("--i", Math.min(i, 20));
      const n = el("td", "n", "#" + r.n);
      if (r.duplicate_of) n.append(el("span", "dupe-tag", "Same as #" + r.duplicate_of));
      tr.append(n);
      columns.forEach((c) => tr.append(makeCell(r.fields[c])));
      body.append(tr);
    });
  table.append(body);
}
 
function makeCell(f) {
  const td = el("td");
  if (f.status === "fixed") {
    td.append(el("span", "raw", f.raw), el("span", "clean", f.clean));
  } else if (f.status === "invalid") {
    td.append(el("span", "bad", f.raw), el("span", "note", f.note));
  } else if (f.status === "missing") {
    td.append(el("span", "empty", "Empty"), el("span", "note", f.note));
  } else {
    td.textContent = f.clean;
  }
  return td;
}
 
/* ---------- download ---------- */
function downloadCsv() {
  const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const skip = $("skipdupes").checked;
  const lines = [data.columns.map(q).join(",")];
  data.rows
    .filter((r) => !(skip && r.duplicate_of))
    .forEach((r) => lines.push(data.columns.map((c) => q(r.fields[c].clean ?? r.fields[c].raw)).join(",")));
  const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const a = el("a");
  a.href = URL.createObjectURL(blob);
  a.download = "clean-customers.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}
 
/* ---------- events ---------- */
$("pick").addEventListener("click", () => $("file").click());
$("file").addEventListener("change", (e) => upload(e.target.files[0]));
$("sample").addEventListener("click", () => { showNotice(""); data = SAMPLE; show(); });
$("download").addEventListener("click", downloadCsv);
 
document.querySelectorAll(".filters button").forEach((b) =>
  b.addEventListener("click", () => {
    filter = b.dataset.f;
    document.querySelectorAll(".filters button").forEach((x) =>
      x.setAttribute("aria-pressed", String(x === b))
    );
    render();
  })
);
 
const tray = $("tray");
["dragenter", "dragover"].forEach((t) =>
  tray.addEventListener(t, (e) => { e.preventDefault(); tray.classList.add("over"); })
);
["dragleave", "drop"].forEach((t) =>
  tray.addEventListener(t, (e) => { e.preventDefault(); tray.classList.remove("over"); })
);
tray.addEventListener("drop", (e) => upload(e.dataTransfer.files[0]));

/* ---------- quality report ---------- */
function renderReport(r) {
  const box = $("report");
  box.replaceChildren();
  if (!r) return;

  // card 1: before/after score and row counts
  const score = el("div", "rep-card score");
  score.append(
    el("div", "score-num", `${r.before_pct}% → ${r.after_pct}%`),
    el("p", "rep-note", "of values were correct before → after cleaning")
  );
  const stats = el("ul", "stats");
  [["Clean rows", r.rows.clean], ["Fixed rows", r.rows.fixed],
   ["Need attention", r.rows.problem], ["Duplicates", r.rows.duplicates]].forEach(([label, n]) => {
    const li = el("li");
    li.append(el("b", "", String(n)), " " + label);
    stats.append(li);
  });
  score.append(stats);

  // card 2: one bar per column (fine / fixed / needs attention)
  const cols = el("div", "rep-card");
  cols.append(el("h3", "", "Quality by column"));
  Object.entries(r.per_column).forEach(([name, c]) => {
    const total = c.ok + c.fixed + c.problem || 1;
    const track = el("div", "track");
    [["ok", c.ok], ["fixed", c.fixed], ["problem", c.problem]].forEach(([k, n]) => {
      const seg = el("span", "seg " + k);
      seg.style.width = (100 * n) / total + "%";
      seg.title = `${k}: ${n}`;
      track.append(seg);
    });
    const row = el("div", "col-row");
    row.append(el("span", "col-name", name), track);
    cols.append(row);
  });
  const legend = el("p", "legend");
  [["ok", "Already fine"], ["fixed", "Fixed"], ["problem", "Needs attention"]].forEach(([k, t]) => {
    const item = el("span");
    item.append(el("span", "sw " + k), t);
    legend.append(item);
  });
  cols.append(legend);

  // card 3: most common problems
  const issues = el("div", "rep-card");
  issues.append(el("h3", "", "Top problems"));
  if (!r.top_issues.length) {
    issues.append(el("p", "rep-note", "No problems found."));
  } else {
    const list = el("ol", "issues");
    r.top_issues.forEach((i) => {
      const li = el("li");
      li.append(el("span", "", i.label), el("b", "", String(i.count)));
      list.append(li);
    });
    issues.append(list);
  }

  box.append(score, cols, issues);
}