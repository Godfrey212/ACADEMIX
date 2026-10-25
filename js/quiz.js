/* ACADEMIX — quiz.js */
/* ---------- Quiz: generate, take, score, review ---------- */
let QZ = null, qzTimer = null;
const QTYPES = [["mcq", "Multiple choice", "list"], ["tf", "True / False", "toggle-left"], ["short", "Fill-in", "pencil"]];
const QDIFF = [["easy", "Easy"], ["medium", "Medium"], ["hard", "Hard"]];
const qzState = () => { if (!QZ || QZ.u !== me()) { stopQzTimer(); QZ = { u: me(), phase: "setup" }; } return QZ; };
const qzOpts = () => ({ count: 10, types: ["mcq", "tf", "short"], difficulty: "medium", timer: 0, ...Store.get("qopts:" + me(), {}) });
const qzSetOpts = (p) => Store.set("qopts:" + me(), { ...qzOpts(), ...p });
const qzHist = () => Store.get("qhist:" + me(), []);
const quizLast = () => { const h = qzHist(); return h.length ? h[h.length - 1] : null; };
const scoreLabel = (p) => (p >= 70 ? ["Excellent", "ok"] : p >= 50 ? ["Good", "ok"] : p >= 40 ? ["Fair", "warn"] : ["Needs work", "bad"]);
const fmtDur = (s) => { s = Math.max(0, Math.round(s)); const m = Math.floor(s / 60), r = s % 60; return m ? `${m}m ${String(r).padStart(2, "0")}s` : `${r}s`; };
const clock = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; };
const typeName = (t) => (QTYPES.find((x) => x[0] === t) || [0, t])[1];
const blankify = (q) => esc(q).replace(/_{3,}/g, '<span class="x-blank">&nbsp;</span>');

function stopQzTimer() { if (qzTimer) clearInterval(qzTimer); qzTimer = null; }
function startQzTimer() {
  stopQzTimer();
  if (!QZ?.deadline) return;
  qzTimer = setInterval(() => {
    if (!QZ || QZ.phase !== "run" || QZ.u !== me()) return stopQzTimer();
    const left = QZ.deadline - Date.now(), el = $("#qz-time");
    if (el) { el.textContent = clock(left); el.parentNode.classList.toggle("warn", left < 60000); }
    if (left <= 0) { qzFinish(true); }
  }, 1000);
}

/* Ring used on results and dashboard */
const pctRing = (p, size = 132, label = "") => {
  const r = size / 2 - 10, C = 2 * Math.PI * r, h = size / 2, [, cls] = scoreLabel(p), col = cls === "ok" ? "var(--accent)" : cls === "warn" ? "var(--warn)" : "var(--danger)";
  return `<svg class="x-pring" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="Score ${p}%${label ? ", " + label : ""}"><circle cx="${h}" cy="${h}" r="${r}" fill="none" stroke="var(--bg2)" stroke-width="10"/><circle cx="${h}" cy="${h}" r="${r}" fill="none" stroke="${col}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${(C * p) / 100} ${C}" transform="rotate(-90 ${h} ${h})"/><text x="${h}" y="${h + 8}" text-anchor="middle" font-size="${size / 4.6}" font-weight="700">${p}%</text></svg>`;
};

/* ---------- Views ---------- */
Views.quiz = () => {
  const s = qzState();
  const head = `<section class="greet between"><div><h1>Test Yourself. <span class="grad">Know Your Readiness.</span></h1><p>Turn your notes into a practice quiz and see how ready you are.</p></div>${s.phase === "run" ? "" : modeBadge(AI.on() ? "ai" : "offline")}</section>`;
  if (s.phase === "run") return head + `<div id="qz-stage">${qzStage()}</div>`;
  if (s.phase === "result") return head + qzResult() + qzHistCard();
  return head + qzSetup() + qzHistCard();
};

function qzSetup() {
  const o = qzOpts(), d = Docs.get(Docs.sel("quiz"));
  const seg = (act, items, cur) => `<div class="seg" role="group">${items.map(([v, t]) => `<button class="btn${String(cur) === String(v) ? " btn--primary" : ""}" data-act="${act}" data-v="${v}" aria-pressed="${String(cur) === String(v)}">${t}</button>`).join("")}</div>`;
  return `<div class="x-sgrid">${docPanel("quiz")}
  <div class="card x-opts-card"><h3>2. Quiz settings</h3>
    <div class="x-optrow"><label>Number of questions</label>${seg("qz-count", [5, 10, 15, 20].map((n) => [n, n]), o.count)}</div>
    <div class="x-optrow"><label>Question types</label><div class="seg" role="group">${QTYPES.map(([v, t, i]) => { const on = o.types.includes(v); return `<button class="btn${on ? " btn--primary" : ""}" data-act="qz-type" data-v="${v}" aria-pressed="${on}">${ic(on ? "check" : i)} ${t}</button>`; }).join("")}</div></div>
    <div class="x-optrow"><label>Difficulty</label>${seg("qz-diff", QDIFF, o.difficulty)}</div>
    <div class="x-optrow"><label for="qz-timer">Timer</label><select class="input" id="qz-timer" style="max-width:220px">${[[0, "No timer"], [5, "5 minutes"], [10, "10 minutes"], [15, "15 minutes"], [20, "20 minutes"], [30, "30 minutes"]].map(([v, t]) => opt(v, t, o.timer)).join("")}</select></div>
    <div class="x-ready">${d ? `${ic("file-text")}<span><b>${esc(d.name)}</b><small>${d.words.toLocaleString()} words</small></span>` : `${ic("info")}<span>Choose or upload a document to start.</span>`}</div>
    <button class="btn btn--primary btn--block" data-act="qz-start" id="qz-start">${ic("zap")} Generate quiz</button>
    <p class="mlabel" style="margin-top:10px">${AI.on() ? "Gemini writes the questions. If it fails, the offline engine takes over." : `Questions are built offline from your document. <a class="link" href="#/settings">Add a Gemini key</a> for AI questions.`}</p>
  </div></div>`;
}

function qzStage() {
  const s = QZ, q = s.qs[s.i], n = s.qs.length, a = s.ans[s.i], done = s.ans.filter((x) => x != null && String(x).trim() !== "").length;
  const opts = q.type === "short"
    ? `<div class="field"><label for="qz-short">Your answer</label><input class="input" id="qz-short" autocomplete="off" spellcheck="false" placeholder="Type your answer, then press Enter" value="${esc(a || "")}"></div>`
    : `<div class="x-qopts" role="radiogroup" aria-label="Answer options">${q.options.map((o, i) => `<button class="x-qopt${a === o ? " on" : ""}" role="radio" aria-checked="${a === o}" data-act="qz-ans" data-i="${i}"><span class="x-ql">${q.type === "tf" ? (o === "True" ? ic("check") : ic("x")) : "ABCDEFG"[i]}</span><span>${esc(o)}</span></button>`).join("")}</div>`;
  return `<div class="card x-run">
    <div class="between x-runtop"><span class="x-meta"><b>Question ${s.i + 1} of ${n}</b><span class="tag">${typeName(q.type)}</span><span>${done}/${n} answered</span></span>
      <span class="x-meta">${modeBadge(s.mode)}${s.deadline ? `<span class="x-time${s.deadline - Date.now() < 60000 ? " warn" : ""}">${ic("timer")}<b id="qz-time" class="num">${clock(s.deadline - Date.now())}</b></span>` : ""}</span></div>
    <div class="bar x-qbar" role="progressbar" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${s.i + 1}"><i style="width:${((s.i + 1) / n) * 100}%"></i></div>
    <h2 class="x-qtext">${q.type === "tf" ? '<span class="x-tfl">True or false?</span>' : ""}${blankify(q.question)}</h2>
    ${opts}
    <div class="between x-qnav"><button class="btn" data-act="qz-prev"${s.i ? "" : " disabled"}>${ic("chevron-left")} Previous</button>
      ${s.i < n - 1 ? `<button class="btn btn--primary" data-act="qz-next">Next ${ic("chevron-right")}</button>` : `<button class="btn btn--primary" data-act="qz-submit">${ic("flag")} Submit quiz</button>`}</div>
    <div class="x-dots" aria-label="Question navigator">${s.qs.map((_, i) => { const has = s.ans[i] != null && String(s.ans[i]).trim() !== ""; return `<button class="x-dot${i === s.i ? " cur" : ""}${has ? " ans" : ""}" data-act="qz-go" data-i="${i}" aria-label="Question ${i + 1}${has ? ", answered" : ""}"${i === s.i ? ' aria-current="step"' : ""}>${i + 1}</button>`; }).join("")}</div>
    <div class="x-qfoot"><button class="btn btn--ghost" data-act="qz-submit">${ic("flag")} Submit now</button><button class="btn btn--ghost" data-act="qz-quit">${ic("x")} Quit quiz</button></div>
  </div>`;
}
function qzPaint(focus) { const st = $("#qz-stage"); if (!st) return render(); st.innerHTML = qzStage(); icons(); if (focus) ($("#qz-short") || $(".x-qopt.on") || $(".x-qopt"))?.focus(); }

function qzResult() {
  const s = QZ, r = s.result, [lbl, cls] = scoreLabel(r.pct), wrong = r.marks.filter((m) => !m).length;
  return `<div class="x-rgrid"><div class="card x-score">${pctRing(r.pct, 150, lbl)}<span class="feas ${cls}">${lbl}</span>
      <p class="x-big num">${r.score} / ${r.total} correct</p>
      <div class="x-meta" style="justify-content:center"><span>${ic("clock")} ${fmtDur(r.secs)}</span>${r.timedOut ? `<span class="neg">Time ran out</span>` : ""}<span>${esc(s.docName)}</span></div>
      <div style="margin-top:10px">${modeBadge(s.mode)}</div>
      <div class="btnrow" style="justify-content:center"><button class="btn btn--primary" data-act="qz-retake">${ic("rotate-ccw")} Retake</button>${wrong ? `<button class="btn" data-act="qz-wrong">${ic("refresh-cw")} Retry wrong only (${wrong})</button>` : ""}<button class="btn" data-act="qz-new">${ic("plus")} New quiz</button></div></div>
    <div class="card"><h3>Review</h3><ol class="x-review">${s.qs.map((q, i) => { const ok = r.marks[i], g = s.ans[i]; return `<li class="${ok ? "ok" : "bad"}"><span class="x-rmark">${ic(ok ? "check" : "x")}</span><div><p class="x-rq"><span class="tag">${typeName(q.type)}</span> ${blankify(q.question)}</p>
      <p><span class="muted">Your answer:</span> <b class="${ok ? "" : "neg"}">${g != null && String(g).trim() !== "" ? esc(g) : "No answer"}</b></p>${ok ? "" : `<p><span class="muted">Correct answer:</span> <b class="grad">${esc(q.answer)}</b></p>`}${q.explanation ? `<p class="x-expl">${ic("lightbulb")}<span>${esc(q.explanation)}</span></p>` : ""}</div></li>`; }).join("")}</ol></div></div>`;
}

function qzHistCard() {
  const h = qzHist();
  if (!h.length) return `<div class="card x-hcard"><h3>Quiz history</h3><p class="muted x-empty">Your scores appear here after your first quiz, with a chart of your progress.</p></div>`;
  const rec = h.slice(-6).reverse();
  return `<div class="card x-hcard"><div class="between"><h3 style="margin:0">Quiz history</h3><button class="btn btn--ghost" data-act="qz-hclear">${ic("trash-2")} Clear history</button></div>
    <div class="x-hgrid"><div class="x-cbox"><canvas id="ch-quiz" role="img" aria-label="Quiz scores over time: ${h.slice(-20).map((x) => x.pct + "%").join(", ")}"></canvas></div>
    <ul class="rlist">${rec.map((x) => { const [l, c] = scoreLabel(x.pct); return `<li><span class="feas ${c}" style="min-width:58px;justify-content:center">${x.pct}%</span><span><b>${esc(x.doc)}</b><small>${x.score}/${x.total} · ${l} · ${fmtDur(x.secs)} · ${dateShort(x.at)}${x.retry ? " · retry" : ""}</small></span></li>`; }).join("")}</ul></div></div>`;
}
function quizChart() {
  const el = $("#ch-quiz"); if (route() !== "quiz" || !el) return;
  if (!window.Chart) { el.parentNode.innerHTML = `<p class="x-cerr">The chart couldn't load. Your scores are listed alongside.</p>`; return; }
  const h = qzHist().slice(-20), cs = getComputedStyle(document.documentElement), v = (n) => cs.getPropertyValue(n).trim(), a = v("--accent");
  try {
    Charts.list.push(new Chart(el, { type: "line", data: { labels: h.map((x) => new Date(x.at).toLocaleDateString([], { day: "numeric", month: "short" })), datasets: [{ label: "Score %", data: h.map((x) => x.pct), borderColor: a, backgroundColor: /^#[0-9a-f]{6}$/i.test(a) ? a + "22" : a, fill: true, tension: 0.35, borderWidth: 2, pointRadius: 4, pointBackgroundColor: a }] },
      options: { responsive: true, maintainAspectRatio: false, animation: matchMedia("(prefers-reduced-motion: reduce)").matches ? false : {}, plugins: { legend: { display: false }, tooltip: { backgroundColor: v("--card"), titleColor: v("--text"), bodyColor: v("--text"), borderColor: v("--border"), borderWidth: 1, callbacks: { title: (i) => h[i[0].dataIndex].doc, label: (i) => ` ${i.raw}%` } } }, scales: { x: { grid: { display: false }, ticks: { color: v("--text2") } }, y: { min: 0, max: 100, ticks: { stepSize: 25, color: v("--text2") }, grid: { color: v("--border") } } } } }));
  } catch (e) { el.parentNode.innerHTML = `<p class="x-cerr">This chart couldn't be drawn.</p>`; }
}

/* ---------- Flow ---------- */
function qzBegin(qs, extra = {}) {
  const o = qzOpts();
  QZ = { ...QZ, ...extra, u: me(), phase: "run", qs, ans: qs.map(() => null), i: 0, t0: Date.now(), deadline: o.timer ? Date.now() + o.timer * 60000 : 0, result: null };
  render(); startQzTimer(); scrollTo(0, 0);
}
function qzFinish(timedOut = false) {
  const s = QZ; if (!s || s.phase !== "run") return;
  stopQzTimer();
  const marks = s.qs.map((q, i) => Offline.check(q, s.ans[i])), score = marks.filter(Boolean).length, total = s.qs.length, pct = Math.round((score / total) * 100), secs = (Date.now() - s.t0) / 1000;
  s.result = { marks, score, total, pct, secs, timedOut }; s.phase = "result";
  const h = qzHist(); h.push({ id: uid(), at: Date.now(), doc: s.docName, docId: s.docId, score, total, pct, secs: Math.round(secs), mode: s.mode, retry: !!s.retry });
  Store.set("qhist:" + me(), h.slice(-60));
  if (route() === "quiz") { render(); scrollTo(0, 0); }
  toast(timedOut ? `Time's up! You scored ${pct}%.` : `You scored ${pct}% (${scoreLabel(pct)[0]}).`, timedOut ? "timer" : "trophy");
}
async function qzStart(btn) {
  const d = Docs.get(Docs.sel("quiz")), o = qzOpts();
  if (!d) { toast("Choose or upload a document first.", "alert-circle"); $("#dz")?.scrollIntoView({ block: "center" }); return; }
  if (!o.types.length) { toast("Pick at least one question type.", "alert-circle"); return; }
  const old = btn.innerHTML; btn.disabled = true; btn.innerHTML = `${ic("loader-circle")} ${AI.on() ? "Asking Gemini…" : "Building your quiz…"}`; icons(); btn.querySelector("svg")?.classList.add("x-spin");
  try {
    await new Promise((r) => setTimeout(r, 30));
    const r = await Engine.quiz(d.text, { count: o.count, types: o.types, difficulty: o.difficulty });
    if (!r.questions.length) throw new Error("No questions could be made from this document. Try a longer one.");
    if (r.questions.length < o.count) toast(`Only ${plural(r.questions.length, "question")} could be made from this document.`, "info");
    if (route() !== "quiz") return;
    qzBegin(r.questions, { mode: r.mode, docId: d.id, docName: d.name, retry: false, orig: r.questions });
  } catch (e) {
    toast(e.message || "Couldn't build a quiz from that document.", "alert-circle");
    if (btn.isConnected) { btn.disabled = false; btn.innerHTML = old; icons(); }
  }
}
const shuf = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-act]"); if (!b || !b.dataset.act.startsWith("qz-")) return;
  const a = b.dataset.act, s = qzState();
  if (a === "qz-count") { qzSetOpts({ count: +b.dataset.v }); render(); }
  if (a === "qz-diff") { qzSetOpts({ difficulty: b.dataset.v }); render(); }
  if (a === "qz-type") { const t = qzOpts().types, v = b.dataset.v; if (t.includes(v) && t.length === 1) { toast("Keep at least one question type.", "info"); return; } qzSetOpts({ types: t.includes(v) ? t.filter((x) => x !== v) : QTYPES.map((x) => x[0]).filter((x) => x === v || t.includes(x)) }); render(); }
  if (a === "qz-start") qzStart(b);
  if (s.phase === "run") {
    if (a === "qz-ans") { s.ans[s.i] = s.qs[s.i].options[+b.dataset.i]; qzPaint(true); }
    if (a === "qz-prev" && s.i > 0) { s.i--; qzPaint(true); }
    if (a === "qz-next" && s.i < s.qs.length - 1) { s.i++; qzPaint(true); }
    if (a === "qz-go") { s.i = +b.dataset.i; qzPaint(true); }
    if (a === "qz-submit") { const left = s.ans.filter((x) => x == null || String(x).trim() === "").length; if (!left || confirm(`You have ${plural(left, "unanswered question")}. Submit anyway?`)) qzFinish(); }
    if (a === "qz-quit" && confirm("Quit this quiz? Your answers won't be saved.")) { stopQzTimer(); s.phase = "setup"; render(); }
  }
  if (s.phase === "result") {
    if (a === "qz-retake") qzBegin(s.qs, { retry: s.retry });
    if (a === "qz-wrong") { const w = s.qs.filter((_, i) => !s.result.marks[i]); if (w.length) qzBegin(shuf(w), { retry: true }); }
    if (a === "qz-new") { s.phase = "setup"; render(); scrollTo(0, 0); }
  }
  if (a === "qz-hclear" && confirm("Clear your quiz history? This can't be undone.")) { Store.del("qhist:" + me()); render(); toast("Quiz history cleared.", "trash-2"); }
});
document.addEventListener("input", (e) => {
  if (e.target.id !== "qz-short" || !QZ || QZ.phase !== "run") return;
  QZ.ans[QZ.i] = e.target.value;
  const dot = document.querySelectorAll(".x-dot")[QZ.i]; if (dot) dot.classList.toggle("ans", e.target.value.trim() !== "");
});
document.addEventListener("change", (e) => { if (e.target.id === "qz-timer") { qzSetOpts({ timer: +e.target.value }); toast(+e.target.value ? `Timer set to ${e.target.value} minutes.` : "Timer off.", "timer"); } });
document.addEventListener("keydown", (e) => {
  if (route() !== "quiz" || !QZ || QZ.phase !== "run" || e.altKey || e.ctrlKey || e.metaKey) return;
  const s = QZ, inInput = e.target.id === "qz-short";
  if (inInput && e.key === "Enter") { e.preventDefault(); if (s.i < s.qs.length - 1) { s.i++; qzPaint(true); } else $('[data-act="qz-submit"]')?.focus(); return; }
  if (inInput || /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
  if (e.key === "ArrowRight" && s.i < s.qs.length - 1) { s.i++; qzPaint(true); }
  if (e.key === "ArrowLeft" && s.i > 0) { s.i--; qzPaint(true); }
  const n = "1234".indexOf(e.key); if (n >= 0 && s.qs[s.i].options[n]) { s.ans[s.i] = s.qs[s.i].options[n]; qzPaint(true); }
});
