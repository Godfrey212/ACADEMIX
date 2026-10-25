/* ACADEMIX — courses.js */
/* ---------- Courses ---------- */
const CF = () => ({ q: "", s: "", m: "", g: "", ...Store.get("cfilter:" + me(), {}) });
function courseList() {
  const l = Data.all();
  if (!l.length) return `<div class="card ph" style="margin-top:18px"><div class="ficon">${ic("book-open")}</div><h2>No courses yet</h2><p class="muted">Add your first course, or load sample data to explore.</p><div class="btnrow" style="justify-content:center"><button class="btn btn--primary" data-act="add-course">${ic("plus")} Add Course</button><button class="btn" data-act="sample">${ic("database")} Load sample data</button></div></div>`;
  const f = CF(), q = f.q.toLowerCase();
  const m = l.filter((c) => (!q || (c.code + " " + c.title).toLowerCase().includes(q)) && (!f.s || c.session === f.s) && (!f.m || c.semester === f.m) && (!f.g || c.grade === f.g));
  if (!m.length) return `<div class="card ph" style="margin-top:18px"><h2>No courses match</h2><p class="muted">Try a different search or clear the filters.</p><button class="btn" data-act="clear-filters" style="margin-top:16px">Clear filters</button></div>`;
  return Data.sems(m).reverse().map((k) => {
    const cs = m.filter((c) => semKey(c) === k).sort((a, b) => a.code.localeCompare(b.code)), r = G.gpa(l.filter((c) => semKey(c) === k));
    return `<div class="card sem"><div class="sem__h"><h3>${esc(semLabel(k))} <span class="tag">${esc(cs[0].level)}</span></h3><span class="muted">${r.u} units · GPA <b class="num">${G.f2(r.g)}</b></span></div><div class="tw"><table class="tbl"><thead><tr><th>Code</th><th>Title</th><th>Units</th><th>Grade</th><th>Points</th><th><span class="sr">Actions</span></th></tr></thead><tbody>${cs.map((c) => `<tr><td><b>${esc(c.code)}</b></td><td class="t">${esc(c.title)}${c.score != null ? ` <small class="muted">· ${c.score}%</small>` : ""}</td><td>${c.units}</td><td>${gb(c.grade)}</td><td>${c.units * G.pt(c.grade)}</td><td><div class="acts2"><button class="icon-btn" data-act="edit-course" data-id="${c.id}" aria-label="Edit ${esc(c.code)}">${ic("pencil")}</button><button class="icon-btn" data-act="del-course" data-id="${c.id}" aria-label="Delete ${esc(c.code)}">${ic("trash-2")}</button></div></td></tr>`).join("")}</tbody></table></div></div>`;
  }).join("");
}
Views.courses = () => {
  const f = CF(), l = Data.all(), ss = [...new Set(l.map((c) => c.session))].sort();
  return `<section class="greet between"><div><h1>My Courses</h1><p>Add, edit and organise every course you've taken.</p></div><div class="acts2" style="align-items:center"><span class="saved" id="saved">${ic("cloud")} Changes save automatically</span><button class="btn btn--primary" data-act="add-course">${ic("plus")} Add Course</button></div></section>
  ${l.length ? `<div class="card filters" role="search"><input class="input" id="fq" type="search" placeholder="Search code or title" aria-label="Search courses" value="${esc(f.q)}"><select class="input" id="fs" aria-label="Filter by session">${opt("", "All sessions", f.s)}${ss.map((s) => opt(s, s, f.s)).join("")}</select><select class="input" id="fm" aria-label="Filter by semester">${opt("", "All semesters", f.m)}${SEMS.map((s) => opt(s, s + " Semester", f.m)).join("")}</select><select class="input" id="fg" aria-label="Filter by grade">${opt("", "All grades", f.g)}${G.scale.map((s) => opt(s[0], "Grade " + s[0], f.g)).join("")}</select><button class="btn" data-act="clear-filters">Clear</button></div>` : ""}
  <div id="clist">${courseList()}</div>`;
};
const selF = (id, label, opts, ph) => `<div class="field" id="f-${id}"><label for="${id}">${label}</label><select class="input" id="${id}">${ph ? `<option value="">${ph}</option>` : ""}${opts.map((o) => { const [v, t] = Array.isArray(o) ? o : [o, o]; return `<option value="${v}">${t}</option>`; }).join("")}</select><p class="ferr" id="e-${id}"></p></div>`;
const FM = { ccode: "code", ctitle: "title", cunits: "units", cscore: "score", cgrade: "grade", csess: "session", csem: "semester", clevel: "level" };
const readCourse = () => Object.fromEntries(Object.entries(FM).map(([i, k]) => [k, ($("#" + i)?.value || "").trim()]));
let modalRet = null;
function closeModal() { const m = $(".modal"); if (m) { m.remove(); modalRet?.focus?.(); modalRet = null; } }
function openCourse(id) {
  const ed = id && Data.all().find((c) => c.id === id), draft = !ed && Store.get("cdraft:" + me());
  const d = ed || draft || { units: 3, level: Auth.current()?.level || "", ...Store.get("clast:" + me(), {}) };
  $(".modal")?.remove(); modalRet = document.activeElement;
  const m = document.createElement("div");
  m.className = "modal"; m.dataset.id = ed ? ed.id : "";
  m.innerHTML = `<div class="card fade" role="dialog" aria-modal="true" aria-labelledby="mt"><div class="between"><h2 id="mt">${ed ? "Edit course" : "Add course"}</h2><button class="icon-btn" data-act="close-modal" aria-label="Close">${ic("x")}</button></div>${draft ? `<p class="mlabel">Your unsaved draft was restored. <button type="button" class="link" data-act="discard-draft">Discard</button></p>` : ""}
  <form class="form" id="course-form" novalidate style="margin-top:16px">
    <div class="row2">${field("ccode", "Course Code", "text", 'placeholder="e.g. CSC 301" autocomplete="off"')}${selF("cunits", "Credit Units", [1, 2, 3, 4, 5, 6])}</div>
    ${field("ctitle", "Course Title", "text", 'placeholder="e.g. Data Structures" autocomplete="off"')}
    <div class="row2">${field("cscore", "Score (optional)", "number", 'min="0" max="100" placeholder="0–100"')}${selF("cgrade", "Grade", G.scale.map((s) => [s[0], `${s[0]} · ${s[2]} points`]), "Select grade")}</div>
    <div class="row2">${field("csess", "Session", "text", 'placeholder="e.g. 2023/2024" list="sesslist" autocomplete="off"')}${selF("csem", "Semester", SEMS.map((s) => [s, s + " Semester"]), "Select semester")}</div>
    ${selF("clevel", "Level", LEVELS, "Select level")}
    <datalist id="sesslist">${[...new Set(Data.all().map((c) => c.session))].map((s) => `<option value="${esc(s)}">`).join("")}</datalist>
    <div class="between"><button type="button" class="btn" data-act="close-modal">Cancel</button><button class="btn btn--primary" type="submit">${ed ? "Save changes" : "Add course"}</button></div>
  </form></div>`;
  document.body.appendChild(m);
  for (const [i, k] of Object.entries(FM)) if (d[k] != null) m.querySelector("#" + i).value = d[k];
  icons(); $("#ccode").focus();
}
function saveCourse() {
  const c = readCourse(), id = $(".modal").dataset.id, l = Data.all();
  c.code = c.code.toUpperCase().replace(/^([A-Z]{2,4})\s*(\d{3}[A-Z]?)$/, "$1 $2");
  const sm = c.session.match(/^(\d{4})\s*\/\s*(\d{4})$/);
  if (sm) c.session = sm[1] + "/" + sm[2];
  let ok = setErr("ccode", /^[A-Z]{2,4} \d{3}[A-Z]?$/.test(c.code) ? "" : "Use a code like CSC 301.");
  ok &= setErr("ctitle", c.title.length >= 2 ? "" : "Enter the course title.");
  ok &= setErr("cunits", +c.units >= 1 && +c.units <= 6 ? "" : "Choose 1 to 6 units.");
  const sc = c.score === "" ? null : +c.score;
  ok &= setErr("cscore", sc === null || (sc >= 0 && sc <= 100) ? "" : "Score must be between 0 and 100.");
  ok &= setErr("cgrade", !c.grade ? "Select a grade." : sc !== null && sc >= 0 && sc <= 100 && G.fromScore(sc) !== c.grade ? `A score of ${sc} is grade ${G.fromScore(sc)}.` : "");
  ok &= setErr("csess", sm && +sm[2] === +sm[1] + 1 ? "" : "Use a session like 2023/2024.");
  ok &= setErr("csem", c.semester ? "" : "Select a semester.");
  ok &= setErr("clevel", c.level ? "" : "Select a level.");
  if (ok && l.some((x) => x.id !== id && x.code === c.code && x.session === c.session && x.semester === c.semester)) ok = setErr("ccode", `${c.code} is already recorded for ${c.session}, ${c.semester} Semester.`);
  if (!ok) { $(".modal .field.err .input")?.focus(); return; }
  Object.assign(c, { units: +c.units, score: sc });
  if (id) { const i = l.findIndex((x) => x.id === id); l[i] = { ...l[i], ...c, updated: Date.now() }; }
  else { l.push({ ...c, id: uid(), created: Date.now(), updated: Date.now() }); Store.del("cdraft:" + me()); }
  Store.set("clast:" + me(), { session: c.session, semester: c.semester, level: c.level });
  Data.save(l); closeModal(); render(); toast(id ? `${c.code} updated.` : `${c.code} added.`, "check-circle");
}

