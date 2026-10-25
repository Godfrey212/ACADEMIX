/* ACADEMIX — settings.js */
/* ---------- Profile ---------- */
const UKEYS = ["courses", "goal", "pred", "sim", "gpa", "cgman", "cgmode", "cdraft", "cfilter", "dsem", "clast", "scale", "docs", "docsel", "qhist", "qopts", "slen", "sums", "gkey"];
function saveUser(patch) {
  const us = Auth.users(), cur = Auth.current(), old = cur.email, nu = { ...cur, ...patch }, ne = nu.email;
  if (ne !== old) {
    delete us[old];
    UKEYS.forEach((k) => { const v = Store.get(k + ":" + old); if (v != null) { Store.set(k + ":" + ne, v); Store.del(k + ":" + old); } });
  }
  us[ne] = nu; Store.set("users", us);
  if (ne !== old) Auth.start(ne, Store.get("session") === old);
}
Views.profile = (u) => `<section class="greet"><h1>Profile</h1><p>Your details show in the header and on exported records.</p></section>
  <div class="x-pgrid">
    <div class="card x-pic"><h3>Profile picture</h3>${avatar(u)}<p class="mlabel">JPG or PNG, resized to 200 px.</p>
      <div class="btnrow"><button class="btn" data-act="pic-pick">${ic("upload")} ${u.photo ? "Change" : "Upload"} photo</button>${u.photo ? `<button class="btn btn--ghost" data-act="pic-del">${ic("trash-2")} Remove photo</button>` : ""}</div>
      <input type="file" id="pic" accept="image/*" hidden>
      <div class="btnrow" style="margin-top:28px"><button class="btn" data-act="logout">${ic("log-out")} Sign Out</button></div></div>
    <div class="card"><h3>Your details</h3>
      <form class="form pf" id="profile-form" novalidate>
        <div class="row2">${field("pname", "Full Name", "text", `autocomplete="name" value="${esc(u.name)}"`)}${field("pemail", "Email", "email", `autocomplete="email" value="${esc(u.email)}"`)}</div>
        <div class="row2">${field("preg", "Reg Number", "text", `value="${esc(u.reg)}"`)}
          <div class="field" id="f-plevel"><label for="plevel">Level</label><select class="input" id="plevel">${opt("", "Select level", u.level)}${LEVELS.map((l) => opt(l, l, u.level)).join("")}</select><p class="ferr" id="e-plevel"></p></div></div>
        <div class="row2">${field("pinst", "Institution", "text", `value="${esc(u.inst)}"`)}${field("pdept", "Department", "text", `value="${esc(u.dept)}"`)}</div>
        <div><button class="btn btn--primary" type="submit">${ic("save")} Save changes</button></div>
      </form></div>
  </div>`;
function setPhoto(file) {
  if (!file) return;
  if (!/^image\//.test(file.type)) { toast("Choose an image file.", "alert-circle"); return; }
  const r = new FileReader();
  r.onload = () => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"), s = Math.min(img.width, img.height); c.width = c.height = 200;
      c.getContext("2d").drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 200, 200);
      try { saveUser({ photo: c.toDataURL("image/jpeg", 0.85) }); render(); toast("Profile picture updated.", "check-circle"); } catch (e) { toast("Couldn't save that picture.", "alert-circle"); }
    };
    img.onerror = () => toast("Couldn't read that image.", "alert-circle");
    img.src = r.result;
  };
  r.readAsDataURL(file);
}

/* ---------- Settings ---------- */
const sessOpts = () => { const y = new Date().getFullYear(), s = new Set(Data.all().map((c) => c.session)); for (let i = y - 6; i <= y + 1; i++) s.add(`${i}/${i + 1}`); return [...s].sort(); };
const bandRow = (b, i) => `<tr><td><input class="input" name="min" type="number" min="0" max="100" step="1" value="${esc(b[1])}" aria-label="Minimum score, band ${i + 1}" style="width:96px"></td><td><input class="input" name="g" maxlength="2" value="${esc(b[0])}" aria-label="Grade letter, band ${i + 1}" style="width:72px"></td><td><input class="input" name="p" type="number" min="0" max="10" step="0.5" value="${esc(b[2])}" aria-label="Grade point, band ${i + 1}" style="width:90px"></td><td><button class="icon-btn" data-act="band-del" data-i="${i}" aria-label="Remove band ${i + 1}">${ic("x")}</button></td></tr>`;
const bandRead = () => [...$("#bands").rows].map((tr) => [tr.querySelector("[name=g]").value, tr.querySelector("[name=min]").value, tr.querySelector("[name=p]").value]);
function bandCheck(rows) {
  if (!rows.length) return { err: "Add at least one band." };
  const sc = [];
  for (let i = 0; i < rows.length; i++) {
    const g = String(rows[i][0] ?? "").trim().toUpperCase(), m = String(rows[i][1] ?? "").trim(), p = String(rows[i][2] ?? "").trim();
    if (!/^\d+$/.test(m) || +m > 100) return { err: `Band ${i + 1}: min score must be a whole number from 0 to 100.` };
    if (!/^[A-Z][+-]?$/.test(g)) return { err: `Band ${i + 1}: grade must be a letter, such as A or B+.` };
    if (p === "" || isNaN(+p) || +p < 0 || +p > 10) return { err: `Band ${i + 1}: point must be between 0 and 10.` };
    sc.push([g, +m, +p]);
  }
  sc.sort((a, b) => b[1] - a[1]);
  for (let i = 1; i < sc.length; i++) {
    if (sc[i][1] === sc[i - 1][1]) return { err: `Bands overlap: ${sc[i - 1][0]} and ${sc[i][0]} both start at ${sc[i][1]}.` };
    if (sc[i][2] > sc[i - 1][2]) return { err: `${sc[i][0]} can't be worth more points than ${sc[i - 1][0]}.` };
  }
  if (new Set(sc.map((s) => s[0])).size < sc.length) return { err: "Each grade letter can only be used once." };
  if (sc[sc.length - 1][1] !== 0) return { err: "Bands must cover 0–100: the lowest band has to start at 0." };
  return { sc };
}
const bandPrev = (sc) => sc.map((b, i) => `${b[0]} ${b[1]}–${i ? sc[i - 1][1] - 1 : 100} (${b[2]})`).join(" · ");
function applyScale(sc) {
  sc ? Store.set("scale:" + me(), sc) : Store.del("scale:" + me());
  const l = Data.all().map((c) => (c.score != null ? { ...c, grade: G.fromScore(+c.score) } : c));
  Data.save(l); render();
  const lost = l.filter((c) => !G.scale.some((s) => s[0] === c.grade)).length;
  toast(lost ? `Bands saved. ${plural(lost, "course")} use a grade that's no longer in the bands and count as 0.` : `${sc ? "Grading bands saved" : "Reset to Nigerian 5.0"}. GPAs recalculated.`, "check-circle");
}
Views.settings = (u) => {
  const m = Theme.mode(), sb = (k, t, i) => `<button class="btn${m === k ? " btn--primary" : ""}" data-act="theme-set" data-mode="${k}" aria-pressed="${m === k}">${ic(i)} ${t}</button>`;
  return `<section class="greet"><h1>Settings</h1><p>Appearance, grading, AI and your data.</p></section>
  <div class="dgrid"><div style="display:grid;gap:18px">
    <div class="card"><h3>Appearance</h3><div class="seg" role="group" aria-label="Theme">${sb("dark", "Dark", "moon")}${sb("light", "Light", "sun")}${sb("system", "System", "monitor")}</div></div>
    <div class="card"><h3>Academic</h3>
      <div class="field"><label for="s-sess">Current session</label><select class="input" id="s-sess">${opt("", "Not set", u.session || "")}${sessOpts().map((s) => opt(s, s, u.session || "")).join("")}</select></div>
      <h3 style="margin-top:22px">Grading bands</h3><p class="muted" style="font-size:14px">Each band runs from its min score up to the next band. Saving regrades scored courses and recalculates every GPA.</p>
      <div class="tw" style="margin-top:12px"><table class="tbl"><thead><tr><th>Min score</th><th>Grade</th><th>Point</th><th><span class="sr">Remove</span></th></tr></thead><tbody id="bands">${G.scale.map(bandRow).join("")}</tbody></table></div>
      <p class="mlabel" id="band-prev">${bandPrev(G.scale)}</p><p class="x-err" id="band-err" role="alert"></p>
      <div class="btnrow"><button class="btn" data-act="band-add">${ic("plus")} Add band</button><button class="btn btn--primary" data-act="band-save">Save bands</button><button class="btn btn--ghost" data-act="band-reset">${ic("rotate-ccw")} Reset to Nigerian 5.0</button></div></div>
  </div>
  <div style="display:grid;gap:18px">${aiCard()}
  <div class="card"><h3>Data</h3>
    <div class="banner x-note" role="note">${ic("shield-alert")}<span>Data is stored only in this browser. It isn't secure authentication and doesn't sync across devices.</span></div>
    <div class="qa"><button class="btn" data-act="data-export">${ic("download")} Export JSON</button><button class="btn" data-act="data-import">${ic("upload")} Import JSON</button><button class="btn" data-act="data-reset" style="color:var(--danger)">${ic("rotate-ccw")} Reset Academic Records</button><button class="btn" data-act="data-clear" style="color:var(--danger)">${ic("trash-2")} Clear All Data</button></div>
    <p class="mlabel" style="margin-top:12px">Reset removes your courses and goals. Clear removes everything ACADEMIX saved in this browser, including accounts, and signs you out.</p>
    <input type="file" id="imp" accept="application/json,.json" hidden></div>
  </div></div>`;
};
function exportData() {
  const { password, ...profile } = Auth.current() || {};
  const out = { app: "ACADEMIX", type: "backup", version: 1, exported: new Date().toISOString(), profile, scale: Store.get("scale:" + me()), courses: Data.all(), goal: goalGet() };
  try {
    const url = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: "application/json" })), a = document.createElement("a");
    a.href = url; a.download = `academix-backup-${new Date().toISOString().slice(0, 10)}.json`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500);
    toast("Data exported as JSON.", "download");
  } catch (e) { toast("Export isn't available in this browser.", "alert-circle"); }
}
const isStr = (v) => typeof v === "string";
function validBackup(d) {
  if (!d || typeof d !== "object" || d.app !== "ACADEMIX" || !Array.isArray(d.courses)) return false;
  if (!d.courses.every((c) => c && isStr(c.code) && isStr(c.title) && +c.units > 0 && +c.units <= 30 && isStr(c.grade) && isStr(c.session) && SEMS.includes(c.semester) && (c.score == null || (+c.score >= 0 && +c.score <= 100)))) return false;
  if (d.goal != null && (typeof d.goal !== "object" || Array.isArray(d.goal))) return false;
  if (d.profile != null && typeof d.profile !== "object") return false;
  if (d.scale != null && (!Array.isArray(d.scale) || !d.scale.every(Array.isArray) || bandCheck(d.scale).err)) return false;
  return true;
}
function importData(file) {
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    let d; try { d = JSON.parse(r.result); } catch (e) { d = null; }
    if (!validBackup(d)) { toast("That file isn't a valid ACADEMIX backup.", "alert-circle"); return; }
    if (!confirm(`Import ${plural(d.courses.length, "course")}${d.goal ? " and a goal" : ""}? This replaces your current courses, goal, grading bands and profile details.`)) return;
    const t = Date.now();
    Store.set("courses:" + me(), d.courses.map((c, i) => ({ id: isStr(c.id) ? c.id : uid() + i, code: c.code, title: c.title, units: +c.units, grade: c.grade.toUpperCase(), score: c.score == null || c.score === "" ? null : +c.score, session: c.session, semester: c.semester, level: isStr(c.level) ? c.level : "", created: +c.created || t + i })));
    d.goal ? Store.set("goal:" + me(), d.goal) : Store.del("goal:" + me());
    d.scale ? Store.set("scale:" + me(), bandCheck(d.scale).sc) : Store.del("scale:" + me());
    ["pred", "sim", "gpa", "cdraft", "cfilter", "dsem", "clast"].forEach((k) => Store.del(k + ":" + me()));
    const p = d.profile || {}, patch = {};
    ["name", "reg", "inst", "dept", "level", "session"].forEach((k) => { if (isStr(p[k]) && p[k].trim()) patch[k] = p[k].trim(); });
    if (isStr(p.photo) && /^data:image\//.test(p.photo)) patch.photo = p.photo;
    saveUser(patch); hOpen = null; render(); toast(`Imported ${plural(d.courses.length, "course")}.`, "check-circle");
  };
  r.onerror = () => toast("Couldn't read that file.", "alert-circle");
  r.readAsText(file);
}

