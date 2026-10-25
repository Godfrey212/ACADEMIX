/* ACADEMIX — calculator.js */
/* ---------- GPA calculator ---------- */
const blankRow = () => ({ code: "", units: 3, grade: "" });
const gpaState = () => Store.get("gpa:" + me(), { rows: [blankRow(), blankRow(), blankRow()] });
const gpaRead = () => [...$("#gpa-rows").rows].map((tr) => ({ code: tr.querySelector("[name=code]").value, units: +tr.querySelector("[name=units]").value, grade: tr.querySelector("[name=grade]").value }));
const gpaRow = (r, i) => `<tr><td><input class="input" name="code" value="${esc(r.code)}" placeholder="e.g. CSC 301" aria-label="Course, row ${i + 1}"></td><td><select class="input" name="units" aria-label="Units, row ${i + 1}">${[1, 2, 3, 4, 5, 6].map((n) => opt(n, n, r.units)).join("")}</select></td><td><select class="input" name="grade" aria-label="Grade, row ${i + 1}">${opt("", "—", r.grade)}${G.scale.map((s) => opt(s[0], `${s[0]} · ${s[2]}`, r.grade)).join("")}</select></td><td><button class="icon-btn" data-act="gpa-del" data-i="${i}" aria-label="Remove row ${i + 1}">${ic("x")}</button></td></tr>`;
function gpaOut(rows) {
  const v = rows.filter((r) => r.grade && r.units > 0), r = G.gpa(v);
  return `<h3>Semester GPA</h3><div class="gpabig num">${G.f2(r.g)}<small> / 5.00</small></div><p class="muted">${v.length ? G.cls(r.g) : "Pick a grade for at least one row."}</p>
  <div class="gpaout"><div><small>Courses</small><b>${v.length}</b></div><div><small>Total units</small><b>${r.u}</b></div><div><small>Grade points</small><b>${r.p}</b></div></div>
  <div class="tw"><table class="tbl"><thead><tr><th>Grade</th><th>Score</th><th>Points</th></tr></thead><tbody>${G.scale.map((s, i) => `<tr><td>${gb(s[0])}</td><td>${s[1]}–${i ? G.scale[i - 1][1] - 1 : 100}</td><td>${s[2]}</td></tr>`).join("")}</tbody></table></div>
  <p class="mlabel" style="margin-top:12px">${G.classes.slice(0, 5).map((c, i) => `${c[1]} ${c[0].toFixed(2)}–${i ? (G.classes[i - 1][0] - 0.01).toFixed(2) : "5.00"}`).join(" · ")} · Fail below 1.00</p>`;
}
Views.gpa = () => {
  const st = gpaState(), ks = Data.sems().reverse();
  return `<section class="greet"><h1>GPA Calculator</h1><p>Load a saved semester or enter courses by hand. Rows without a grade are left out.</p></section>
  <div class="dgrid"><div class="card"><div class="between"><h3 style="margin:0">Courses</h3><select class="input" id="gpa-load" aria-label="Load a saved semester" style="width:auto"${ks.length ? "" : " disabled"}>${opt("", ks.length ? "Load a saved semester…" : "No saved semesters yet", "")}${ks.map((k) => opt(k, semLabel(k), "")).join("")}</select></div>
  <div class="tw" style="margin-top:12px"><table class="tbl"><thead><tr><th>Course</th><th>Units</th><th>Grade</th><th><span class="sr">Remove</span></th></tr></thead><tbody id="gpa-rows">${st.rows.map(gpaRow).join("")}</tbody></table></div>
  <div class="btnrow"><button class="btn" data-act="gpa-add">${ic("plus")} Add row</button><button class="btn btn--ghost" data-act="gpa-clear">Clear all</button></div></div>
  <div class="card" id="gpa-out" aria-live="polite">${gpaOut(st.rows)}</div></div>`;
};

/* ---------- Shared: CGPA maths, feasibility, ring ---------- */
const num = (v, d = 0) => { const n = parseFloat(v); return isFinite(n) ? n : d; };
const sgn = (d) => (Math.abs(d) < 0.005 ? "0.00" : (d > 0 ? "+" : "") + G.f2(d));
const box = (k, v) => `<div><small>${k}</small><b>${v}</b></div>`;
const rec = () => { const r = G.gpa(Data.all()); return { cur: r.g, done: r.u, qp: r.p }; };
const reqGPA = (cur, done, tgt, fut) => (fut > 0 ? (tgt * (done + fut) - cur * done) / fut : NaN);
const feas = (q) => (isNaN(q) ? ["Enter future units", ""] : q <= 0 ? ["Already secured", "ok"] : q <= 4.5 ? ["Achievable", "ok"] : q <= 5 ? ["Challenging", "warn"] : ["Impossible", "bad"]);
const fb = (q) => { const f = feas(q); return `<span class="feas ${f[1]}">${f[0]}</span>`; };
function feasMsg(q, cur, done, fut) {
  if (isNaN(q)) return "";
  if (q <= 0) return `Already secured: even a 0.00 GPA over the next ${fut} units keeps you at target.`;
  if (q <= 4.5) return `Average ${G.f2(q)} or better across the next ${fut} units.`;
  if (q <= 5) return `You need ${G.f2(q)}: almost all As across the next ${fut} units.`;
  return `Even straight As would only reach ${G.f2((cur * done + 5 * fut) / (done + fut))}.`;
}
const ringSm = (frac, mid, sub, lbl) => { const r = 46, C = 2 * Math.PI * r, f = Math.max(0, Math.min(1, frac || 0)); return `<svg class="ringsm" viewBox="0 0 112 112" role="img" aria-label="${esc(lbl)}"><circle cx="56" cy="56" r="${r}" fill="none" stroke="var(--bg2)" stroke-width="10"/><circle cx="56" cy="56" r="${r}" fill="none" stroke="var(--accent)" stroke-width="10" stroke-linecap="round" stroke-dasharray="${C * f} ${C}" transform="rotate(-90 56 56)"/><text x="56" y="60" text-anchor="middle" font-size="22" font-weight="700">${mid}</text><text x="56" y="78" text-anchor="middle" font-size="11" style="fill:var(--text2)">${sub}</text></svg>`; };
const nfield = (id, lb, val, a = "", hint = "") => `<div class="field"><label for="${id}">${lb}</label><input class="input" id="${id}" type="number" inputmode="decimal" ${a} value="${esc(val)}">${hint ? `<p class="mlabel">${hint}</p>` : ""}</div>`;

/* ---------- CGPA calculator ---------- */
const cgMan = () => Store.get("cgman:" + me(), { rows: [{ label: "100L First", units: 18, gpa: 4.2 }, { label: "100L Second", units: 18, gpa: 3.9 }] });
const cgmRow = (r, i) => `<tr><td><input class="input" name="label" value="${esc(r.label)}" placeholder="e.g. 200L First" aria-label="Semester, row ${i + 1}"></td><td><input class="input" name="units" type="number" min="1" max="60" value="${esc(r.units)}" aria-label="Units, row ${i + 1}" style="width:90px"></td><td><input class="input" name="gpa" type="number" min="0" max="5" step="0.01" value="${esc(r.gpa)}" aria-label="GPA, row ${i + 1}" style="width:100px"></td><td><button class="icon-btn" data-act="cgm-del" data-i="${i}" aria-label="Remove row ${i + 1}">${ic("x")}</button></td></tr>`;
const cgmRead = () => [...$("#cgm-rows").rows].map((tr) => ({ label: tr.querySelector("[name=label]").value, units: tr.querySelector("[name=units]").value, gpa: tr.querySelector("[name=gpa]").value }));
function cgmOut(rows) {
  const v = rows.map((r) => ({ u: num(r.units), g: num(r.gpa, -1) })).filter((r) => r.u > 0 && r.g >= 0 && r.g <= 5), u = v.reduce((a, r) => a + r.u, 0), p = v.reduce((a, r) => a + r.u * r.g, 0), g = u ? p / u : 0;
  return `<h3>Cumulative GPA</h3><div class="gpabig num">${G.f2(g)}<small> / 5.00</small></div><p class="muted">${u ? G.cls(g) : "Enter units and a GPA for at least one semester."}</p>
  <div class="gpaout">${box("Semesters", v.length)}${box("Total units", u)}${box("Total QP", G.f2(p))}</div><p class="mlabel">CGPA = total quality points ÷ total units. Rows with a GPA outside 0–5 are left out.</p>`;
}
function cgRecords() {
  const l = Data.all();
  if (!l.length) return `<div class="card ph" style="margin-top:24px"><div class="ficon">${ic("layers")}</div><h2>No courses yet</h2><p class="muted">Add courses to build your CGPA, or enter semester GPAs by hand.</p><div class="btnrow" style="justify-content:center"><button class="btn btn--primary" data-act="add-course">${ic("plus")} Add a course</button><button class="btn" data-act="sample">${ic("database")} Load sample data</button><button class="btn" data-act="cg-mode" data-mode="manual">Manual entry</button></div></div>`;
  let cu = 0, cp = 0;
  const S = Data.sems(l).map((k) => { const cs = l.filter((c) => semKey(c) === k), r = G.gpa(cs); cu += r.u; cp += r.p; return { k, lv: cs[0].level, n: cs.length, ...r, cg: cp / cu }; });
  const t = G.gpa(l), lv = [...new Set(S.map((s) => s.lv))];
  return `<div class="dgrid"><div class="card"><h3>Your CGPA</h3><div class="gpabig num">${G.f2(t.g)}<small> / 5.00</small></div><p class="muted">${G.cls(t.g)}</p>
  <div class="gpaout">${box("Total units", t.u)}${box("Total QP", t.p)}${box("Courses", l.length)}</div><p class="mlabel">${t.p} QP ÷ ${t.u} units = ${G.f2(t.g)}</p></div>
  <div class="card"><h3>Timeline</h3><ol class="tl">${S.map((s) => `<li><span>${esc(s.k.replace("|", " · "))}<small>${esc(s.lv)} · ${s.u} units</small></span><span class="bar" aria-hidden="true"><i style="width:${(s.g / 5) * 100}%"></i></span><span><b class="num">${G.f2(s.g)}</b><small>CGPA ${G.f2(s.cg)}</small></span></li>`).join("")}</ol></div></div>
  ${lv.map((v) => { const ss = S.filter((s) => s.lv === v), r = G.gpa(l.filter((c) => c.level === v)); return `<div class="card sem"><div class="sem__h"><h3>${esc(v)}</h3><span class="muted">${r.u} units · GPA <b class="num">${G.f2(r.g)}</b></span></div><div class="tw"><table class="tbl"><thead><tr><th>Session</th><th>Semester</th><th>Courses</th><th>Units</th><th>QP</th><th>GPA</th><th>CGPA after</th></tr></thead><tbody>${ss.map((s) => { const [se, sm] = s.k.split("|"); return `<tr><td>${esc(se)}</td><td>${esc(sm)}</td><td>${s.n}</td><td>${s.u}</td><td>${s.p}</td><td><b class="num">${G.f2(s.g)}</b></td><td><b class="num">${G.f2(s.cg)}</b></td></tr>`; }).join("")}</tbody></table></div></div>`; }).join("")}`;
}
Views.cgpa = () => {
  const m = Store.get("cgmode:" + me(), "records"), st = cgMan(), b = (k, t) => `<button class="btn${m === k ? " btn--primary" : ""}" data-act="cg-mode" data-mode="${k}" aria-pressed="${m === k}">${t}</button>`;
  return `<section class="greet between"><div><h1>CGPA Calculator</h1><p>Weighted by credit units: total quality points ÷ total units.</p></div><div class="seg" role="group" aria-label="Calculation mode">${b("records", "From my courses")}${b("manual", "Manual entry")}</div></section>
  ${m === "manual" ? `<div class="dgrid" style="margin-top:24px"><div class="card"><h3>Semesters</h3><p class="muted" style="font-size:14px">Enter the units and GPA of each semester.</p><div class="tw" style="margin-top:12px"><table class="tbl"><thead><tr><th>Semester</th><th>Units</th><th>GPA</th><th><span class="sr">Remove</span></th></tr></thead><tbody id="cgm-rows">${st.rows.map(cgmRow).join("")}</tbody></table></div><div class="btnrow"><button class="btn" data-act="cgm-add">${ic("plus")} Add semester</button><button class="btn btn--ghost" data-act="cgm-clear">Clear all</button></div></div><div class="card" id="cgm-out" aria-live="polite">${cgmOut(st.rows)}</div></div>` : cgRecords()}`;
};

/* ---------- GPA predictor ---------- */
const goalGet = () => Store.get("goal:" + me());
function predVals() {
  const r = rec(), g = goalGet(), nx = G.classes.slice().reverse().find((c) => c[0] > r.cur);
  return { cur: +G.f2(r.cur), done: r.done, tgt: g ? g.target : nx ? nx[0] : 4.5, fut: g ? g.remaining : 48, next: 24, ...Store.get("pred:" + me(), {}) };
}
const predRead = () => ({ cur: num($("#p-cur").value), done: num($("#p-done").value), tgt: num($("#p-tgt").value), fut: num($("#p-fut").value), next: num($("#p-next").value) });
const simRead = () => [...$("#sim-rows").rows].map((tr) => ({ code: tr.querySelector("[name=code]").value, units: +tr.querySelector("[name=units]").value, grade: tr.querySelector("[name=grade]").value }));
function predOut(v) {
  const err = v.cur < 0 || v.cur > 5 ? "Current CGPA must be between 0 and 5." : v.tgt <= 0 || v.tgt > 5 ? "Target CGPA must be between 0.01 and 5." : v.done < 0 ? "Completed units can't be negative." : !(v.fut > 0) ? "Future units must be more than 0." : "";
  if (err) return `<h3>Required GPA</h3><div class="gpabig num">—</div><p class="ferr" style="display:block">${err}</p>`;
  const q = reqGPA(v.cur, v.done, v.tgt, v.fut);
  return `<div class="between"><h3 style="margin:0">Required GPA</h3>${fb(q)}</div><div class="gpabig num">${G.f2(Math.max(q, 0))}<small> / 5.00</small></div><p class="muted">${feasMsg(q, v.cur, v.done, v.fut)}</p>
  <div class="gpaout">${box("Target class", G.cls(v.tgt))}${box("Total units", v.done + v.fut)}${box("QP needed", G.f2(Math.max(0, v.tgt * (v.done + v.fut) - v.cur * v.done)))}</div>`;
}
function simOut(v, rows) {
  const vr = rows.filter((r) => r.grade && r.units > 0), s = G.gpa(vr), tu = v.done + s.u, proj = tu ? (v.cur * v.done + s.p) / tu : 0, d = proj - v.cur;
  return `<div class="gpaout">${box("Projected CGPA", G.f2(proj))}${box("Change from now", `<span class="${d < -0.004 ? "neg" : ""}">${sgn(d)}</span>`)}${box("New total units", tu)}</div><p class="mlabel">${vr.length ? `${vr.length} course${vr.length > 1 ? "s" : ""}, ${s.u} units at GPA ${G.f2(s.g)} · ${G.cls(proj)}` : "Give a course a grade to see its effect."}</p>`;
}
function impact(v) {
  if (!(v.next > 0) || v.done < 0) return `<p class="ferr" style="display:block">Enter next-semester units.</p>`;
  return `<div class="tw" style="margin-top:12px"><table class="tbl"><thead><tr><th>Next GPA</th><th>New CGPA</th><th>Change</th><th>Class</th></tr></thead><tbody>${[5, 4, 3, 2, 1].map((g) => { const n = (v.cur * v.done + g * v.next) / (v.done + v.next), d = n - v.cur; return `<tr><td><b class="num">${g.toFixed(2)}</b></td><td><b class="num">${G.f2(n)}</b></td><td class="${d < -0.004 ? "neg" : ""}">${sgn(d)}</td><td>${G.cls(n)}</td></tr>`; }).join("")}</tbody></table></div><p class="mlabel">From ${v.done} completed units at ${G.f2(v.cur)}.</p>`;
}
function predUpd() { const v = predRead(), s = simRead(); Store.set("pred:" + me(), v); Store.set("sim:" + me(), s); $("#p-out").innerHTML = predOut(v); $("#sim-out").innerHTML = simOut(v, s); $("#imp").innerHTML = impact(v); }
Views.predictor = () => {
  const v = predVals(), sim = Store.get("sim:" + me(), [blankRow()]);
  return `<section class="greet between"><div><h1>Plan Your Next Academic Win.</h1><p>Find the GPA you need, test hypothetical courses, and see what each result does to your CGPA.</p></div><button class="btn" data-act="pred-reset">${ic("rotate-ccw")} Reset from records</button></section>
  <div class="dgrid" style="margin-top:24px"><div class="card"><h3>Your numbers</h3><p class="mlabel">Prefilled from your saved courses${goalGet() ? " and goal" : ""}.</p><div class="pf"><div class="row2">${nfield("p-cur", "Current CGPA", v.cur, 'min="0" max="5" step="0.01"')}${nfield("p-done", "Completed Units", v.done, 'min="0" step="1"')}</div><div class="row2">${nfield("p-tgt", "Target CGPA", v.tgt, 'min="0" max="5" step="0.01"')}${nfield("p-fut", "Future Units", v.fut, 'min="1" step="1"')}</div></div><p class="mlabel" style="margin-top:12px">Required GPA = (target × (completed + future) − current × completed) ÷ future</p></div>
  <div class="card" id="p-out" aria-live="polite">${predOut(v)}</div></div>
  <div class="dgrid"><div class="card"><h3>Hypothetical course simulator</h3><p class="muted" style="font-size:14px">Add courses you might take and the grade you expect.</p><div class="tw" style="margin-top:12px"><table class="tbl"><thead><tr><th>Course</th><th>Units</th><th>Grade</th><th><span class="sr">Remove</span></th></tr></thead><tbody id="sim-rows">${sim.map((r, i) => gpaRow(r, i).replace('data-act="gpa-del"', 'data-act="sim-del"')).join("")}</tbody></table></div><div class="btnrow"><button class="btn" data-act="sim-add">${ic("plus")} Add course</button><button class="btn btn--ghost" data-act="sim-clear">Clear all</button></div><div id="sim-out" aria-live="polite">${simOut(v, sim)}</div></div>
  <div class="card"><h3>Next-semester impact</h3><p class="muted" style="font-size:14px">What a GPA of 5 down to 1 next semester does to your CGPA.</p><div class="pf">${nfield("p-next", "Next semester units", v.next, 'min="1" step="1"')}</div><div id="imp">${impact(v)}</div></div></div>`;
};

/* ---------- Academic goals ---------- */
const goalRead = () => { const t = $("#g-type").value; return { type: t, target: num(t === "class" ? $("#g-class").value : $("#g-cgpa").value), remaining: Math.round(num($("#g-rem").value)) }; };
function goalCard(g, mini) {
  const r = rec(), bad = !(g.target > 0 && g.target <= 5) ? "Target CGPA must be between 0.01 and 5.00." : !(g.remaining > 0) ? "Remaining units must be more than 0." : "";
  if (bad) return mini ? "" : `<h3>Your goal</h3><p class="ferr" style="display:block">${bad}</p>`;
  const q = reqGPA(r.cur, r.done, g.target, g.remaining), pr = Math.min(100, (r.cur / g.target) * 100), name = g.type === "class" ? G.cls(g.target) : "CGPA " + G.f2(g.target);
  const ring = ringSm(pr / 100, Math.round(pr) + "%", "of target", `Progress ${Math.round(pr)}% toward ${name}`);
  if (mini) return `<div class="card"><div class="between"><h3 style="margin:0">Your goal</h3><a class="link" href="#/goals">Edit</a></div><div class="goalmini">${ring}<div><b>${esc(name)}</b><p class="muted">${G.f2(r.cur)} → ${G.f2(g.target)} · need ${G.f2(Math.max(q, 0))} over ${g.remaining} units</p>${fb(q)}</div></div></div>`;
  return `<div class="between"><h3 style="margin:0">${esc(name)}</h3>${fb(q)}</div><div class="goalmini">${ring}<p class="muted">${feasMsg(q, r.cur, r.done, g.remaining)}${r.done ? "" : " Add courses to track real progress."}</p></div>
  <div class="gpaout">${box("Current CGPA", G.f2(r.cur))}${box("Target CGPA", G.f2(g.target))}${box("Required GPA", G.f2(Math.max(q, 0)))}${box("Remaining units", g.remaining)}${box("Progress", Math.round(pr) + "%")}${box("Feasibility", feas(q)[0])}</div>`;
}
Views.goals = () => {
  const s = goalGet(), g = s || { type: "class", target: 4.5, remaining: 48 }, C = G.classes.slice(0, 5);
  return `<section class="greet"><h1>Your Goals. Your Journey. Your Success.</h1><p>Set a target, see what it takes, and track it from your Overview.</p></section>
  <div class="dgrid" style="margin-top:24px"><div class="card" id="goalf"><h3>Set your goal</h3><div class="pf">
    <div class="field"><label for="g-type">Goal type</label><select class="input" id="g-type">${opt("class", "Class of degree", g.type)}${opt("cgpa", "Target CGPA", g.type)}</select></div>
    <div class="field" id="f-gclass"${g.type === "class" ? "" : " hidden"}><label for="g-class">Target class</label><select class="input" id="g-class">${C.map((c) => opt(c[0], `${c[1]} (${c[0].toFixed(2)}+)`, g.target)).join("")}</select></div>
    <div class="field" id="f-gcgpa"${g.type === "cgpa" ? "" : " hidden"}><label for="g-cgpa">Target CGPA</label><input class="input" id="g-cgpa" type="number" min="0" max="5" step="0.01" value="${esc(g.target)}"></div>
    ${nfield("g-rem", "Remaining units", g.remaining, 'min="1" step="1"', "Credit units left until you graduate.")}
    <div class="between"><button class="btn btn--ghost" data-act="goal-clear"${s ? "" : " disabled"}>Remove goal</button><button class="btn btn--primary" data-act="goal-save">${ic("save")} Save goal</button></div>
  </div></div><div class="card" id="g-out" aria-live="polite">${goalCard(g)}</div></div>`;
};

/* ---------- Shared: per-semester summary ---------- */
function semStats(l = Data.all()) {
  let cu = 0, cp = 0;
  return Data.sems(l).map((k) => { const cs = l.filter((c) => semKey(c) === k).sort((a, b) => a.code.localeCompare(b.code)), r = G.gpa(cs), [session, semester] = k.split("|"); cu += r.u; cp += r.p; return { k, session, semester, lv: cs[0].level, cs, n: cs.length, ...r, cg: cu ? cp / cu : 0, upd: Math.max(0, ...cs.map((c) => c.updated || c.created || 0)) }; });
}
const shortSem = (s) => `${s.lv} ${s.semester === "First" ? "1st" : "2nd"}`;
const fmtD = (t) => (t ? new Date(t).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—");
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

