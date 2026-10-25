/* ACADEMIX — analytics.js */
/* ---------- Analytics ---------- */
const Charts = {
  list: [],
  clear() { this.list.forEach((c) => { try { c.destroy(); } catch (e) {} }); this.list = []; },
  draw() {
    this.clear();
    if (typeof quizChart === "function") quizChart();
    if (route() !== "analytics" || !$("#ch-gpa")) return;
    if (!window.Chart) { document.querySelectorAll(".x-cbox").forEach((b) => (b.innerHTML = `<p class="x-cerr">Charts couldn't load. Refresh to try again; the figures above are still accurate.</p>`)); return; }
    const cs = getComputedStyle(document.documentElement), v = (n) => cs.getPropertyValue(n).trim();
    const C = { a: v("--accent"), b: v("--accent2"), t: v("--text"), t2: v("--text2"), bd: v("--border"), w: v("--warn"), d: v("--danger"), card: v("--card") };
    const al = (c, x) => (/^#[0-9a-f]{6}$/i.test(c) ? c + x : c);
    const S = semStats(), labels = S.map(shortSem), l = Data.all(), still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    Chart.defaults.color = C.t2; Chart.defaults.borderColor = C.bd; Chart.defaults.font.family = '"Plus Jakarta Sans", system-ui, sans-serif'; Chart.defaults.font.size = 12;
    const tip = { backgroundColor: C.card, titleColor: C.t, bodyColor: C.t, borderColor: C.bd, borderWidth: 1, padding: 10 };
    const base = (y) => ({ responsive: true, maintainAspectRatio: false, animation: still ? false : {}, plugins: { legend: { display: false }, tooltip: tip }, scales: { x: { grid: { display: false } }, y: { grid: { color: C.bd }, ...y } } });
    const gpaY = { min: 0, max: 5, ticks: { stepSize: 1 } };
    const line = (data, col, label) => ({ type: "line", data: { labels, datasets: [{ label, data, borderColor: col, backgroundColor: al(col, "22"), fill: true, tension: 0.35, borderWidth: 2, pointRadius: 4, pointBackgroundColor: col }] }, options: base(gpaY) });
    const mk = (id, cfg) => { const el = $("#" + id); if (!el) return; try { this.list.push(new Chart(el, cfg)); } catch (e) { el.parentNode.innerHTML = `<p class="x-cerr">This chart couldn't be drawn.</p>`; } };
    mk("ch-gpa", line(S.map((s) => +G.f2(s.g)), C.a, "GPA"));
    mk("ch-cgpa", line(S.map((s) => +G.f2(s.cg)), C.b, "CGPA"));
    mk("ch-units", { type: "bar", data: { labels, datasets: [{ label: "Credit units", data: S.map((s) => s.u), backgroundColor: C.a, borderRadius: 6, maxBarThickness: 48 }] }, options: base({ beginAtZero: true, ticks: { precision: 0 } }) });
    mk("ch-grades", { type: "doughnut", data: { labels: G.scale.map((s) => "Grade " + s[0]), datasets: [{ data: G.scale.map((s) => l.filter((c) => c.grade === s[0]).length), backgroundColor: [C.a, C.b, C.w, C.t2, al(C.d, "88"), C.d], borderColor: C.card, borderWidth: 2 }] }, options: { responsive: true, maintainAspectRatio: false, animation: still ? false : {}, cutout: "62%", plugins: { legend: { position: innerWidth < 520 ? "bottom" : "right", labels: { usePointStyle: true, boxWidth: 8, padding: 12 } }, tooltip: tip } } });
  }
};
Views.analytics = () => {
  const S = semStats(), head = `<section class="greet"><h1>Analytics</h1><p>Trends across your semesters, grades and credit load.</p></section>`;
  if (!S.length) return head + `<div class="card ph" style="margin-top:24px"><div class="ficon">${ic("bar-chart-3")}</div><h2>Nothing to analyse yet</h2><p class="muted">Add courses and your GPA trend, grade mix and insights appear here.</p><div class="btnrow" style="justify-content:center"><button class="btn btn--primary" data-act="add-course">${ic("plus")} Add Course</button><button class="btn" data-act="sample">${ic("database")} Load sample data</button></div></div>`;
  const best = S.reduce((a, s) => (s.g > a.g ? s : a)), low = S.reduce((a, s) => (s.g < a.g ? s : a)), avg = S.reduce((a, s) => a + s.g, 0) / S.length, n = S.reduce((a, s) => a + s.n, 0);
  const last = S[S.length - 1], prev = S[S.length - 2], d = prev ? last.g - prev.g : null, cnt = G.scale.map((s) => [s[0], S.reduce((a, x) => a + x.cs.filter((c) => c.grade === s[0]).length, 0)]);
  const tile = (lbl, icon, val, sub, cls = "") => `<div class="card stat"><div class="top">${lbl}<span class="ficon" style="margin:0;width:36px;height:36px">${ic(icon)}</span></div><div class="val num ${cls}">${val}</div><p>${sub}</p></div>`;
  const card = (id, t, sub, lbl) => `<div class="card"><h3 style="margin:0">${t}</h3><p class="mlabel">${sub}</p><div class="x-cbox"><canvas id="${id}" role="img" aria-label="${esc(lbl)}"></canvas></div></div>`;
  return head + `<section class="stats" style="grid-template-columns:repeat(auto-fit,minmax(190px,1fr))">
    ${tile("Best semester", "trophy", G.f2(best.g), esc(semLabel(best.k)))}
    ${tile("Lowest semester", "arrow-down-circle", G.f2(low.g), esc(semLabel(low.k)))}
    ${tile("Average GPA", "activity", G.f2(avg), `Mean of ${plural(S.length, "semester")}`)}
    ${tile("Total courses", "book-open", n, `${S.reduce((a, s) => a + s.u, 0)} credit units`)}
    ${tile("Change vs previous", d === null ? "minus" : d >= 0 ? "trending-up" : "trending-down", d === null ? "—" : sgn(d), prev ? `${esc(shortSem(last))} vs ${esc(shortSem(prev))}` : "Needs two semesters", d === null ? "" : d > 0.004 ? "x-up" : d < -0.004 ? "x-down" : "")}
  </section>
  <div class="x-charts">
    ${card("ch-gpa", "GPA progression", "Semester GPA, 5.0 scale", `Semester GPA from ${G.f2(S[0].g)} to ${G.f2(last.g)} across ${plural(S.length, "semester")}`)}
    ${card("ch-cgpa", "CGPA progression", "Cumulative GPA after each semester", `CGPA from ${G.f2(S[0].cg)} to ${G.f2(last.cg)}`)}
    ${card("ch-units", "Credit load by semester", "Credit units registered", `Credit units per semester: ${S.map((s) => shortSem(s) + " " + s.u).join(", ")}`)}
    ${card("ch-grades", "Grade distribution", `All ${plural(n, "course")}`, `Grades: ${cnt.filter((c) => c[1]).map((c) => c[0] + " " + c[1]).join(", ")}`)}
  </div>`;
};

/* ---------- Academic history ---------- */
let hOpen = null;
document.addEventListener("toggle", (e) => { const k = e.target.dataset?.hk; if (k && hOpen) e.target.open ? hOpen.add(k) : hOpen.delete(k); }, true);
const CHEV = `<span class="x-chev">${ic("chevron-down")}</span>`;
const histRow = (c) => `<tr><td><b>${esc(c.code)}</b></td><td class="t">${esc(c.title)}${c.score != null ? ` <small class="muted">· ${c.score}%</small>` : ""}</td><td>${c.units}</td><td>${gb(c.grade)}</td><td>${c.units * G.pt(c.grade)}</td><td><div class="acts2"><button class="icon-btn" data-act="edit-course" data-id="${c.id}" aria-label="Edit ${esc(c.code)}">${ic("pencil")}</button><button class="icon-btn" data-act="del-course" data-id="${c.id}" aria-label="Delete ${esc(c.code)}">${ic("trash-2")}</button></div></td></tr>`;
const histSem = (s) => `<details class="x-semd" data-hk="m:${esc(s.k)}"${hOpen.has("m:" + s.k) ? " open" : ""}><summary><b>${esc(s.semester)} Semester</b><span class="x-meta">GPA <b class="num">${G.f2(s.g)}</b><span>${s.u} units</span><span>${s.p} QP</span><span>${plural(s.n, "course")}</span><span>Updated ${fmtD(s.upd)}</span>${CHEV}</span></summary><div class="tw"><table class="tbl"><thead><tr><th>Code</th><th>Title</th><th>Units</th><th>Grade</th><th>QP</th><th><span class="sr">Actions</span></th></tr></thead><tbody>${s.cs.map(histRow).join("")}</tbody></table></div></details>`;
function histPrint(u, S) {
  const t = G.gpa(Data.all());
  return `<div class="x-print" aria-hidden="true"><h1>ACADEMIX · Academic Summary</h1><p><b>${esc(u.name)}</b>${u.reg ? ` · Reg. no. ${esc(u.reg)}` : ""}</p><p>${[u.inst, u.dept, u.level].filter(Boolean).map(esc).join(" · ")}</p><p>Printed ${fmtD(Date.now())} · Nigerian 5.0 grading scale</p>
  ${S.map((s) => `<section><h2>${esc(s.session)} · ${esc(s.semester)} Semester · ${esc(s.lv)}</h2><table><thead><tr><th>Code</th><th>Title</th><th>Units</th><th>Grade</th><th>Points</th><th>QP</th></tr></thead><tbody>${s.cs.map((c) => `<tr><td>${esc(c.code)}</td><td>${esc(c.title)}</td><td>${c.units}</td><td>${c.grade}</td><td>${G.pt(c.grade)}</td><td>${c.units * G.pt(c.grade)}</td></tr>`).join("")}</tbody><tfoot><tr><th colspan="2">Semester totals</th><th>${s.u}</th><th colspan="2">GPA ${G.f2(s.g)}</th><th>${s.p}</th></tr></tfoot></table><p>CGPA after this semester: ${G.f2(s.cg)}</p></section>`).join("")}
  <div class="x-tot"><p><b>Cumulative: ${t.u} units · ${t.p} QP · CGPA ${G.f2(t.g)} · ${G.cls(t.g)}</b></p></div></div>`;
}
function exportHistory() {
  const { password, ...student } = Auth.current() || {}, S = semStats(), l = Data.all(), t = G.gpa(l);
  const out = { app: "ACADEMIX", exported: new Date().toISOString(), scale: "Nigerian 5.0", student, summary: { cgpa: +G.f2(t.g), class: G.cls(t.g), units: t.u, qualityPoints: t.p, courses: l.length, semesters: S.length },
    sessions: [...new Set(S.map((s) => s.session))].map((se) => { const ss = S.filter((s) => s.session === se); return { session: se, levels: [...new Set(ss.map((s) => s.lv))].map((lv) => ({ level: lv, semesters: ss.filter((s) => s.lv === lv).map((s) => ({ semester: s.semester, gpa: +G.f2(s.g), cgpaAfter: +G.f2(s.cg), units: s.u, qualityPoints: s.p, courseCount: s.n, lastUpdated: s.upd ? new Date(s.upd).toISOString() : null, courses: s.cs.map(({ id, code, title, units, grade, score }) => ({ id, code, title, units, grade, score, points: G.pt(grade) })) })) })) }; }) };
  try {
    const url = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: "application/json" })), link = document.createElement("a");
    link.href = url; link.download = `academix-history-${new Date().toISOString().slice(0, 10)}.json`; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500);
    toast("History exported as JSON.", "download");
  } catch (e) { toast("Export isn't available in this browser.", "alert-circle"); }
}
Views.history = (u) => {
  const S = semStats(), has = S.length > 0;
  const head = `<section class="greet between"><div><h1>Academic History</h1><p>Every semester, grouped by session and level.</p></div><div class="acts2"><button class="btn" data-act="hist-print"${has ? "" : " disabled"}>${ic("printer")} Print summary</button><button class="btn" data-act="hist-export"${has ? "" : " disabled"}>${ic("download")} Export JSON</button></div></section>`;
  if (!has) return head + `<div class="card ph" style="margin-top:24px"><div class="ficon">${ic("history")}</div><h2>No history yet</h2><p class="muted">Each semester you record appears here as an expandable card.</p><div class="btnrow" style="justify-content:center"><button class="btn btn--primary" data-act="add-course">${ic("plus")} Add Course</button><button class="btn" data-act="sample">${ic("database")} Load sample data</button></div></div>`;
  if (!hOpen) { const ls = S[S.length - 1]; hOpen = new Set(["s:" + ls.session, "m:" + ls.k]); }
  const sessions = [...new Set(S.map((s) => s.session))];
  return head + `<div class="x-hist">${sessions.map((se) => {
    const ss = S.filter((s) => s.session === se), r = G.gpa(ss.flatMap((s) => s.cs));
    return `<details class="card x-sess" data-hk="s:${esc(se)}"${hOpen.has("s:" + se) ? " open" : ""}><summary><h3>${ic("calendar")} ${esc(se)} Session</h3><span class="x-meta">GPA <b class="num">${G.f2(r.g)}</b><span>${r.u} units</span><span>${plural(ss.reduce((a, s) => a + s.n, 0), "course")}</span>${CHEV}</span></summary>
    ${[...new Set(ss.map((s) => s.lv))].map((lv) => `<div class="x-lvl"><h4>${esc(lv)}</h4>${ss.filter((s) => s.lv === lv).map(histSem).join("")}</div>`).join("")}</details>`;
  }).join("")}</div>${histPrint(u, S)}`;
};

