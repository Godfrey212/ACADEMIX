/* ACADEMIX — grading.js */
/* ---------- Grading: Nigerian 5.0 scale ---------- */
const G = {
  DEF: [["A", 70, 5], ["B", 60, 4], ["C", 50, 3], ["D", 45, 2], ["E", 40, 1], ["F", 0, 0]],
  get scale() { const s = Store.get("scale:" + me()); return Array.isArray(s) && s.length ? s : this.DEF; },
  classes: [[4.5, "First Class"], [3.5, "Second Class Upper"], [2.4, "Second Class Lower"], [1.5, "Third Class"], [1, "Pass"], [0, "Fail"]],
  pt(g) { const s = this.scale.find((x) => x[0] === g); return s ? s[2] : 0; },
  fromScore(n) { const sc = this.scale; return (sc.find((x) => n >= x[1]) || sc[sc.length - 1])[0]; },
  gpa(l) { const u = l.reduce((a, c) => a + +c.units, 0), p = l.reduce((a, c) => a + c.units * this.pt(c.grade), 0); return { u, p, g: u ? p / u : 0 }; },
  cls(g) { return (this.classes.find((c) => g >= c[0]) || this.classes[5])[1]; },
  f2: (n) => (Math.round((n + Number.EPSILON) * 100) / 100).toFixed(2)
};
const SEMS = ["First", "Second"], LEVELS = ["100L", "200L", "300L", "400L", "500L"];
const semKey = (c) => c.session + "|" + c.semester;
const semLabel = (k) => k.replace("|", " · ") + " Semester";
const semOrd = (k) => parseInt(k) * 2 + (k.endsWith("Second") ? 1 : 0);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const me = () => Auth.current()?.email || "guest";
const opt = (v, t, s) => `<option value="${esc(v)}"${String(v) === String(s) ? " selected" : ""}>${esc(t)}</option>`;
const gb = (g) => `<span class="gb ${g}">${g}</span>`;
const Data = {
  all() { return Store.get("courses:" + me(), []); },
  save(l) { Store.set("courses:" + me(), l); const s = $("#saved"); if (s) { s.innerHTML = ic("check") + " Saved " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); icons(); } },
  sems(l = this.all()) { return [...new Set(l.map(semKey))].sort((a, b) => semOrd(a) - semOrd(b)); }
};
const SAMPLE = [
  ["2022/2023", "First", "100L", [["MTH 101", "Elementary Mathematics I", 3, "A"], ["PHY 101", "General Physics I", 3, "B"], ["CHM 101", "General Chemistry I", 3, "A"], ["GST 101", "Use of English I", 2, "B"], ["CSC 101", "Introduction to Computing", 3, "A"]]],
  ["2022/2023", "Second", "100L", [["MTH 102", "Elementary Mathematics II", 3, "B"], ["PHY 102", "General Physics II", 3, "C"], ["CSC 102", "Introduction to Programming", 3, "A"], ["GST 102", "Use of English II", 2, "A"], ["STA 112", "Probability I", 3, "B"]]],
  ["2023/2024", "First", "200L", [["CSC 201", "Computer Programming I", 3, "A"], ["CSC 205", "Operating Systems I", 3, "B"], ["MTH 201", "Mathematical Methods I", 3, "C"], ["GST 201", "Philosophy and Logic", 2, "A"]]],
  ["2023/2024", "Second", "200L", [["CSC 202", "Computer Programming II", 3, "A"], ["CSC 208", "Discrete Structures", 3, "A"], ["MTH 202", "Linear Algebra", 3, "B"], ["ENT 202", "Entrepreneurship", 2, "B"]]]
];
function loadSample() {
  if (Data.all().length && !confirm("Replace your saved courses with sample data?")) return;
  let t = Date.now() - 1e6;
  Data.save(SAMPLE.flatMap(([session, semester, level, cs]) => cs.map(([code, title, units, grade]) => ({ id: uid() + (t % 1000), code, title, units, grade, score: null, session, semester, level, created: t++ }))));
  toast("Sample data loaded: 18 courses across 4 semesters.", "database"); render();
}

