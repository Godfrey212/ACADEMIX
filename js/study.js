/* ACADEMIX — study.js */
/* ---------- Study: summaries, key terms, exam questions ---------- */
let SD = null;
const SLEN = [["short", "Short"], ["medium", "Medium"], ["detailed", "Detailed"]];
const sdState = () => { if (!SD || SD.u !== me()) SD = { u: me(), res: null }; return SD; };
const sdLen = () => Store.get("slen:" + me(), "medium");
const sdSaved = () => Store.get("sums:" + me(), []);
const readMins = (w) => w / 200;
const fmtMins = (m) => (m < 1 ? "< 1 min" : `≈ ${Math.round(m)} min`);

Views.study = () => {
  const s = sdState(), len = sdLen(), d = Docs.get(Docs.sel("study"));
  return `<section class="greet between"><div><h1>Study Smarter, <span class="grad">Not Longer.</span></h1><p>Turn long notes into a clear summary with the key points and terms to revise.</p></div>${modeBadge(AI.on() ? "ai" : "offline")}</section>
  <div class="x-sgrid">${docPanel("study")}
    <div class="card x-opts-card"><h3>2. Summary length</h3>
      <div class="seg" role="group" aria-label="Summary length">${SLEN.map(([v, t]) => `<button class="btn${len === v ? " btn--primary" : ""}" data-act="sd-len" data-v="${v}" aria-pressed="${len === v}">${t}</button>`).join("")}</div>
      <p class="mlabel" style="margin-top:8px">${len === "short" ? "The essentials in a quick read." : len === "medium" ? "A balanced summary for revision." : "A fuller summary that keeps more detail."}</p>
      <div class="x-ready">${d ? `${ic("file-text")}<span><b>${esc(d.name)}</b><small>${d.words.toLocaleString()} words · ${fmtMins(readMins(d.words))} to read</small></span>` : `${ic("info")}<span>Choose or upload a document to summarise.</span>`}</div>
      <button class="btn btn--primary btn--block" data-act="sd-run">${ic("sparkles")} Summarize</button>
      <p class="mlabel" style="margin-top:10px">${AI.on() ? "Gemini writes the summary and likely exam questions. If it fails, the offline engine takes over." : `The offline engine picks the most important sentences. <a class="link" href="#/settings">Add a Gemini key</a> for AI summaries with likely exam questions.`}</p>
    </div></div>
  ${s.res ? sdResult(s.res) : ""}
  ${sdSavedCard()}`;
};

function sdResult(r) {
  const saved = sdSaved().some((x) => x.id === r.savedId), hasDoc = !!Docs.get(r.docId), cut = Math.max(0, r.before - r.after);
  const P = (h, body) => `<section class="x-ssec"><h3>${h}</h3>${body}</section>`;
  return `<div class="card x-sum" id="sum-out">
    <div class="between"><div><p class="eyebrow">Summary · ${esc((SLEN.find((x) => x[0] === r.len) || [0, ""])[1])}</p><h2 class="x-stitle">${esc(r.docName)}</h2></div>${modeBadge(r.mode)}</div>
    <div class="x-sstats"><div><small>Words before</small><b class="num">${r.before.toLocaleString()}</b></div><div><small>Words after</small><b class="num">${r.after.toLocaleString()}</b></div><div><small>Shorter by</small><b class="num">${r.before ? Math.round((cut / r.before) * 100) : 0}%</b></div><div><small>Reading time saved</small><b class="num">${fmtMins(readMins(cut))}</b></div></div>
    ${P(`${ic("align-left")} Overview`, `<p class="x-ov">${inlineMd(r.overview)}</p>`)}
    ${r.points.length ? P(`${ic("list")} Key points`, `<ul class="x-pts">${r.points.map((p) => `<li>${inlineMd(p)}</li>`).join("")}</ul>`) : ""}
    ${r.terms.length ? P(`${ic("tags")} Key terms`, `<div class="x-chips">${r.terms.map((t) => `<span class="x-chip"${t.d ? ` title="${esc(t.d)}"` : ""}>${esc(t.t)}</span>`).join("")}</div>${r.terms.some((t) => t.d) ? `<dl class="x-defs">${r.terms.filter((t) => t.d).map((t) => `<div><dt>${esc(t.t)}</dt><dd>${inlineMd(t.d)}</dd></div>`).join("")}</dl>` : ""}`) : ""}
    ${r.exam.length ? P(`${ic("circle-help")} Likely exam questions`, `<ol class="x-pts">${r.exam.map((q) => `<li>${inlineMd(q)}</li>`).join("")}</ol>`) : ""}
    <div class="btnrow x-sacts"><button class="btn" data-act="sd-copy">${ic("copy")} Copy</button><button class="btn" data-act="sd-dl">${ic("download")} Download .txt</button><button class="btn" data-act="sd-print">${ic("printer")} Print</button>${hasDoc ? `<button class="btn" data-act="sd-quiz">${ic("list-checks")} Make a quiz from this</button>` : ""}${saved ? `<span class="feas ok">${ic("check")} Saved</span>` : `<button class="btn btn--primary" data-act="sd-save">${ic("save")} Save</button>`}</div>
  </div>`;
}
function sdSavedCard() {
  const l = sdSaved().slice().reverse();
  return `<div class="card x-hcard"><h3>Saved summaries</h3>${l.length ? `<ul class="x-doclist">${l.map((x) => `<li class="${SD?.res?.savedId === x.id ? "on" : ""}"><button class="x-docpick" data-act="sd-open" data-id="${x.id}"><span class="x-dic">${ic("notebook-text")}</span><span class="x-dmeta"><b>${esc(x.docName)}</b><small>${esc((SLEN.find((s) => s[0] === x.len) || [0, ""])[1])} · ${x.mode === "ai" ? "Gemini AI" : "Offline"} · ${dateShort(x.at)}</small></span></button><button class="icon-btn" data-act="sd-del" data-id="${x.id}" aria-label="Delete summary of ${esc(x.docName)}">${ic("trash-2")}</button></li>`).join("")}</ul>` : `<p class="muted x-empty">Summaries you save appear here so you can revise them later.</p>`}</div>`;
}
function sdText(r) {
  const strip = (s) => String(s).replace(/\*\*(.+?)\*\*/g, "$1").replace(/`([^`]+)`/g, "$1");
  const out = [`ACADEMIX Summary — ${r.docName}`, `Length: ${(SLEN.find((x) => x[0] === r.len) || [0, r.len])[1]} · ${r.mode === "ai" ? "Gemini AI" : "Offline engine"} · ${new Date(r.at).toLocaleString()}`, `Words: ${r.before} → ${r.after}`, "", "OVERVIEW", strip(r.overview)];
  if (r.points.length) out.push("", "KEY POINTS", ...r.points.map((p) => "• " + strip(p)));
  if (r.terms.length) out.push("", "KEY TERMS", ...r.terms.map((t) => "• " + t.t + (t.d ? ": " + strip(t.d) : "")));
  if (r.exam.length) out.push("", "LIKELY EXAM QUESTIONS", ...r.exam.map((q, i) => `${i + 1}. ${strip(q)}`));
  return out.join("\n");
}
async function sdRun(btn) {
  const d = Docs.get(Docs.sel("study")), len = sdLen();
  if (!d) { toast("Choose or upload a document first.", "alert-circle"); $("#dz")?.scrollIntoView({ block: "center" }); return; }
  const old = btn.innerHTML; btn.disabled = true; btn.innerHTML = `${ic("loader-circle")} ${AI.on() ? "Asking Gemini…" : "Summarising…"}`; icons(); btn.querySelector("svg")?.classList.add("x-spin");
  try {
    await new Promise((r) => setTimeout(r, 30));
    const r = await Engine.summary(d.text, len);
    sdState().res = { ...r, docId: d.id, docName: d.name, len, at: Date.now(), savedId: null };
    if (route() === "study") { render(); $("#sum-out")?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }); }
  } catch (e) {
    toast(e.message || "Couldn't summarise that document.", "alert-circle");
    if (btn.isConnected) { btn.disabled = false; btn.innerHTML = old; icons(); }
  }
}
function copyText(t) {
  const fb = () => { const ta = document.createElement("textarea"); ta.value = t; ta.style.cssText = "position:fixed;opacity:0"; document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand("copy"); } catch (e) {} ta.remove(); return ok; };
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(t).then(() => true, fb);
  return Promise.resolve(fb());
}

document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-act]"); if (!b || !b.dataset.act.startsWith("sd-")) return;
  const a = b.dataset.act, s = sdState(), r = s.res;
  if (a === "sd-len") { Store.set("slen:" + me(), b.dataset.v); render(); }
  if (a === "sd-run") sdRun(b);
  if (a === "sd-open") { const x = sdSaved().find((y) => y.id === b.dataset.id); if (x) { s.res = { ...x.r, docId: x.docId, docName: x.docName, len: x.len, mode: x.mode, at: x.at, savedId: x.id }; render(); $("#sum-out")?.scrollIntoView({ block: "start" }); } }
  if (a === "sd-del") { const l = sdSaved(), x = l.find((y) => y.id === b.dataset.id); if (x && confirm(`Delete the saved summary of “${x.docName}”?`)) { Store.set("sums:" + me(), l.filter((y) => y !== x)); if (r?.savedId === x.id) r.savedId = null; render(); toast("Summary deleted.", "trash-2"); } }
  if (!r) return;
  if (a === "sd-copy") { const ok = await copyText(sdText(r)); toast(ok ? "Summary copied to clipboard." : "Copy isn't available in this browser.", ok ? "copy" : "alert-circle"); }
  if (a === "sd-dl") {
    try {
      const url = URL.createObjectURL(new Blob([sdText(r)], { type: "text/plain;charset=utf-8" })), l = document.createElement("a");
      l.href = url; l.download = `summary-${r.docName.replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-").slice(0, 40) || "document"}.txt`; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500);
      toast("Summary downloaded.", "download");
    } catch (x) { toast("Download isn't available in this browser.", "alert-circle"); }
  }
  if (a === "sd-print") { document.body.classList.add("x-printsum"); const done = () => { document.body.classList.remove("x-printsum"); removeEventListener("afterprint", done); }; addEventListener("afterprint", done); window.print(); setTimeout(done, 1000); }
  if (a === "sd-save") {
    const l = sdSaved(), id = uid(), { docId, docName, len, mode, at, savedId, ...rest } = r;
    l.push({ id, docId, docName, len, mode, at, r: rest });
    while (l.length > 30) l.shift();
    if (!Store.put("sums:" + me(), l)) { toast("Your browser storage is full. Delete a saved document or summary and try again.", "alert-circle"); return; }
    r.savedId = id; render(); toast("Summary saved.", "check-circle");
  }
  if (a === "sd-quiz") {
    if (!Docs.get(r.docId)) { toast("The original document was deleted, so a quiz can't be made from it.", "alert-circle"); return; }
    const q = qzState();
    if (q.phase === "run" && !confirm("You have a quiz in progress. Start a new one from this document instead?")) return;
    stopQzTimer(); q.phase = "setup"; Docs.setSel("quiz", r.docId); location.hash = "#/quiz"; toast(`“${r.docName}” is ready for a quiz.`, "list-checks");
  }
});
