/* ACADEMIX — main.js */
/* ---------- Router ---------- */
function route() { return (location.hash.match(/^#\/([\w-]+)/) || [])[1] || "home"; }
function render() {
  const r = route(), u = Auth.current(), app = $("#app");
  $(".modal")?.remove();
  const isApp = NAV.some((n) => n[0] === r);
  if (isApp && !u) { location.hash = "#/login"; return; }
  if ((r === "login" || r === "signup") && u) { location.hash = "#/dashboard"; return; }
  if (!isApp && !Views[r]) { location.hash = "#/home"; return; }
  if (isApp) { const n = NAV.find((x) => x[0] === r); app.innerHTML = shell(r, u, Views[r](u)); document.title = `${n[1]} · ACADEMIX`; }
  else { app.innerHTML = Views[r](); document.title = r === "home" ? "ACADEMIX — Your Grades. Your Growth. Your Future." : `${r === "login" ? "Sign In" : "Create Account"} · ACADEMIX`; }
  icons(); Charts.draw();
}
let lastRoute = null;
addEventListener("hashchange", () => { const r = route(); if (r !== lastRoute) { lastRoute = r; render(); scrollTo(0, 0); } });

/* ---------- Forms ---------- */
function setErr(id, msg) { const f = $("#f-" + id), e = $("#e-" + id); if (f) f.classList.toggle("err", !!msg); if (e) e.textContent = msg || ""; return !msg; }
function strength(p) { let s = 0; if (p.length >= 8) s++; if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++; if (/\d/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++; if (p.length >= 12) s++; return Math.min(s, 4); }
const SL = [["Too weak", "var(--danger)"], ["Weak", "var(--danger)"], ["Fair", "var(--warn)"], ["Good", "var(--accent2)"], ["Strong", "var(--accent)"]];

document.addEventListener("input", (e) => {
  if (e.target.id === "pw" && $("#meter")) { const p = e.target.value, s = p ? strength(p) : -1; $("#meter").style.width = p ? (s + 1) * 20 + "%" : "0"; $("#meter").style.background = s >= 0 ? SL[s][1] : ""; $("#mlabel").textContent = p ? "Strength: " + SL[s][0] : "Use 8+ characters with numbers, capitals and symbols."; }
  if (e.target.closest(".field.err")) setErr(e.target.id, "");
  const id = e.target.id;
  if (["fq", "fs", "fm", "fg"].includes(id)) { Store.set("cfilter:" + me(), { q: $("#fq").value, s: $("#fs").value, m: $("#fm").value, g: $("#fg").value }); $("#clist").innerHTML = courseList(); icons(); }
  if (e.target.closest("#course-form")) {
    const v = e.target.value;
    if (id === "cscore" && v !== "" && +v >= 0 && +v <= 100) { $("#cgrade").value = G.fromScore(+v); setErr("cgrade", ""); }
    if (!$(".modal").dataset.id) Store.set("cdraft:" + me(), readCourse());
  }
  if (e.target.closest("#gpa-rows")) { const rows = gpaRead(); Store.set("gpa:" + me(), { rows }); $("#gpa-out").innerHTML = gpaOut(rows); }
  if (e.target.closest("#cgm-rows")) { const rows = cgmRead(); Store.set("cgman:" + me(), { rows }); $("#cgm-out").innerHTML = cgmOut(rows); }
  if ((/^p-/.test(id) || e.target.closest("#sim-rows")) && $("#p-out")) predUpd();
  if (e.target.closest("#bands")) { const c = bandCheck(bandRead()); $("#band-err").textContent = ""; $("#band-prev").textContent = c.sc ? bandPrev(c.sc) : ""; }
  if (e.target.closest("#goalf")) { if (id === "g-type") { const c = e.target.value === "class"; $("#f-gclass").hidden = !c; $("#f-gcgpa").hidden = c; } $("#g-out").innerHTML = goalCard(goalRead()); }
});
document.addEventListener("change", (e) => {
  if (e.target.id === "pic") { setPhoto(e.target.files[0]); e.target.value = ""; }
  if (e.target.id === "imp") { importData(e.target.files[0]); e.target.value = ""; }
  if (e.target.id === "s-sess") { saveUser({ session: e.target.value }); render(); toast(e.target.value ? `Current session set to ${e.target.value}.` : "Current session cleared.", "check-circle"); }
  if (e.target.id === "dsem") { Store.set("dsem:" + me(), e.target.value); render(); }
  if (e.target.id === "gpa-load" && e.target.value) { const k = e.target.value, rows = Data.all().filter((c) => semKey(c) === k).map((c) => ({ code: c.code, units: c.units, grade: c.grade })); Store.set("gpa:" + me(), { rows }); render(); toast(`Loaded ${rows.length} courses from ${semLabel(k)}.`, "check-circle"); }
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && $(".modal")) closeModal(); if (e.key === "Escape" && $("#bmore") && !$("#bmore").hidden) { $("#bmore").hidden = true; $('[data-act="bmore"]')?.setAttribute("aria-expanded", "false"); } });

document.addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target, v = (id) => (f.querySelector("#" + id)?.value || "").trim(), em = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (f.id === "course-form") return saveCourse();
  if (f.id === "profile-form") {
    const ne = v("pemail").toLowerCase(), cur = Auth.current();
    let ok = true;
    ok &= setErr("pname", v("pname").length < 3 || !/\s/.test(v("pname")) ? "Enter your first and last name." : "");
    ok &= setErr("pemail", !em.test(ne) ? "Enter a valid email address." : ne !== cur.email && Auth.users()[ne] ? "Another account already uses this email." : "");
    ok &= setErr("preg", v("preg") ? "" : "Enter your registration number.");
    ok &= setErr("pinst", v("pinst") ? "" : "Enter your institution.");
    ok &= setErr("pdept", v("pdept") ? "" : "Enter your department.");
    ok &= setErr("plevel", v("plevel") ? "" : "Select your level.");
    if (!ok) { f.querySelector(".field.err .input")?.focus(); return; }
    saveUser({ name: v("pname"), email: ne, reg: v("preg"), inst: v("pinst"), dept: v("pdept"), level: v("plevel") });
    render(); toast("Profile saved.", "check-circle"); return;
  }
  if (f.id === "signup") {
    let ok = true;
    ok &= setErr("name", v("name").length < 3 || !/\s/.test(v("name")) ? "Enter your first and last name." : "");
    ok &= setErr("email", em.test(v("email")) ? "" : "Enter a valid email address.");
    ok &= setErr("inst", v("inst") ? "" : "Enter your institution.");
    ok &= setErr("dept", v("dept") ? "" : "Enter your department.");
    ok &= setErr("reg", v("reg") ? "" : "Enter your registration number.");
    ok &= setErr("level", v("level") ? "" : "Select your level.");
    const pw = f.querySelector("#pw").value;
    ok &= setErr("pw", pw.length < 8 ? "Password must be at least 8 characters." : strength(pw) < 2 ? "Add numbers, capitals or symbols." : "");
    ok &= setErr("pw2", f.querySelector("#pw2").value === pw && pw ? "" : "Passwords do not match.");
    ok &= setErr("terms", $("#terms").checked ? "" : "You must accept the terms to continue.");
    if (!ok) { f.querySelector(".field.err .input, .field.err input")?.focus(); return; }
    const err = Auth.signup({ name: v("name"), email: v("email"), inst: v("inst"), dept: v("dept"), reg: v("reg"), level: v("level"), password: pw });
    if (err) { setErr("email", err); return; }
    toast("Account created. Welcome to ACADEMIX!", "check-circle"); location.hash = "#/dashboard";
  }
  if (f.id === "login") {
    let ok = setErr("email", em.test(v("email")) ? "" : "Enter a valid email address.");
    ok &= setErr("pw", f.querySelector("#pw").value ? "" : "Enter your password.");
    $("#e-form").textContent = "";
    if (!ok) return;
    const err = Auth.login(v("email"), f.querySelector("#pw").value, $("#remember").checked);
    if (err) { $("#e-form").textContent = err; return; }
    location.hash = "#/dashboard";
  }
});

/* ---------- Actions ---------- */
document.addEventListener("click", (e) => {
  const sc = e.target.closest("[data-scroll]");
  if (sc) { e.preventDefault(); $("#mm")?.classList.remove("open"); const t = $(sc.getAttribute("href")); t && t.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); return; }
  if (e.target.classList?.contains("modal")) { closeModal(); return; }
  const bm = $("#bmore"); if (bm && !bm.hidden && (!e.target.closest("#bmore,[data-act=bmore]") || e.target.closest("#bmore a"))) { bm.hidden = true; $('[data-act="bmore"]')?.setAttribute("aria-expanded", "false"); }
  const b = e.target.closest("[data-act]"); if (!b) return;
  const a = b.dataset.act;
  if (a === "add-course") openCourse();
  if (a === "edit-course") openCourse(b.dataset.id);
  if (a === "close-modal") closeModal();
  if (a === "discard-draft") { Store.del("cdraft:" + me()); openCourse(); }
  if (a === "del-course") { const l = Data.all(), c = l.find((x) => x.id === b.dataset.id); if (c && confirm(`Delete ${c.code} (${c.session}, ${c.semester} Semester)?`)) { Data.save(l.filter((x) => x !== c)); render(); toast(`${c.code} deleted.`, "trash-2"); } }
  if (a === "clear-filters") { Store.del("cfilter:" + me()); render(); }
  if (a === "sample") loadSample();
  if (a === "gpa-add" || a === "gpa-del" || a === "gpa-clear") {
    let rows = gpaRead();
    if (a === "gpa-add") rows.push(blankRow());
    if (a === "gpa-del") rows.splice(+b.dataset.i, 1);
    if (a === "gpa-clear") rows = [];
    if (!rows.length) rows.push(blankRow());
    Store.set("gpa:" + me(), { rows }); render();
    if (a === "gpa-add") { const ins = document.querySelectorAll('#gpa-rows [name="code"]'); ins[ins.length - 1].focus(); }
  }
  if (a === "cg-mode") { Store.set("cgmode:" + me(), b.dataset.mode); render(); }
  if (a === "cgm-add" || a === "cgm-del" || a === "cgm-clear") {
    let rows = cgmRead();
    if (a === "cgm-add") rows.push({ label: "", units: 18, gpa: "" });
    if (a === "cgm-del") rows.splice(+b.dataset.i, 1);
    if (a === "cgm-clear") rows = [];
    if (!rows.length) rows.push({ label: "", units: 18, gpa: "" });
    Store.set("cgman:" + me(), { rows }); render();
    if (a === "cgm-add") { const ins = document.querySelectorAll('#cgm-rows [name="label"]'); ins[ins.length - 1].focus(); }
  }
  if (a === "sim-add" || a === "sim-del" || a === "sim-clear") {
    let rows = simRead();
    if (a === "sim-add") rows.push(blankRow());
    if (a === "sim-del") rows.splice(+b.dataset.i, 1);
    if (a === "sim-clear") rows = [];
    if (!rows.length) rows.push(blankRow());
    Store.set("pred:" + me(), predRead()); Store.set("sim:" + me(), rows); render();
    if (a === "sim-add") { const ins = document.querySelectorAll('#sim-rows [name="code"]'); ins[ins.length - 1].focus(); }
  }
  if (a === "pred-reset") { Store.del("pred:" + me()); render(); toast("Numbers reset from your records.", "rotate-ccw"); }
  if (a === "goal-save") {
    const g = goalRead();
    if (!(g.target > 0 && g.target <= 5) || !(g.remaining > 0)) { toast("Check the target and remaining units.", "alert-circle"); return; }
    Store.set("goal:" + me(), { ...g, saved: Date.now() }); Store.del("pred:" + me()); render(); toast("Goal saved. It now shows on your Overview.", "target");
  }
  if (a === "hist-print") window.print();
  if (a === "hist-export") exportHistory();
  if (a === "goal-clear") { Store.del("goal:" + me()); render(); toast("Goal removed.", "trash-2"); }
  if (a === "theme") { Theme.toggle(); if (route() === "settings") render(); }
  if (a === "theme-set") { Theme.set(b.dataset.mode); render(); toast(`Appearance: ${b.dataset.mode[0].toUpperCase() + b.dataset.mode.slice(1)}.`, "check-circle"); }
  if (a === "pic-pick") $("#pic").click();
  if (a === "pic-del" && confirm("Remove your profile picture?")) { saveUser({ photo: null }); render(); toast("Profile picture removed.", "trash-2"); }
  if (a === "band-add" || a === "band-del") {
    const rows = bandRead();
    if (a === "band-add") rows.push(["", "", ""]); else rows.splice(+b.dataset.i, 1);
    $("#bands").innerHTML = rows.map(bandRow).join(""); icons();
    if (a === "band-add") { const ins = document.querySelectorAll('#bands [name="min"]'); ins[ins.length - 1].focus(); }
  }
  if (a === "band-save") { const c = bandCheck(bandRead()); if (c.err) { $("#band-err").textContent = c.err; return; } applyScale(c.sc); }
  if (a === "band-reset" && confirm("Reset grading bands to the Nigerian 5.0 default?")) applyScale(null);
  if (a === "data-export") exportData();
  if (a === "data-import") $("#imp").click();
  if (a === "data-reset" && confirm("Delete all your courses and goals? This can't be undone. Export first if you want a copy.")) {
    ["courses", "goal", "pred", "sim", "gpa", "cgman", "cdraft", "cfilter", "dsem", "clast"].forEach((k) => Store.del(k + ":" + me()));
    hOpen = null; render(); toast("Academic records reset.", "rotate-ccw");
  }
  if (a === "data-clear" && confirm("Clear all ACADEMIX data in this browser, including every account, and sign out? This can't be undone.")) {
    Store.clear(); Auth.logout(); hOpen = null; Theme.init(); toast("All data cleared.", "trash-2"); location.hash = "#/home";
  }
  if (a === "bmore") { const m = $("#bmore"), open = m.hidden; m.hidden = !open; b.setAttribute("aria-expanded", open); if (open) m.querySelector("a,button")?.focus(); }
  if (a === "menu") { const m = $("#mm"); m.classList.toggle("open"); b.setAttribute("aria-expanded", m.classList.contains("open")); }
  if (a === "pw") { const i = $("#" + b.dataset.for), show = i.type === "password"; i.type = show ? "text" : "password"; b.setAttribute("aria-label", show ? "Hide password" : "Show password"); b.innerHTML = ic(show ? "eye-off" : "eye"); icons(); }
  if (a === "forgot") toast("Demo mode: password reset isn't available. Create a new account instead.", "info");
  if (a === "collapse") { Store.set("sidebar", Store.get("sidebar") === "collapsed" ? "open" : "collapsed"); render(); }
  if (a === "logout") { Auth.logout(); hOpen = null; toast("You've been signed out.", "log-out"); location.hash = "#/home"; }
});

Theme.init();
try { matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => { if (Theme.mode() === "system") { Theme.set("system"); if (route() === "settings") render(); } }); } catch (e) {}
if (!location.hash) history.replaceState(null, "", "#/home");
lastRoute = route();
render();
