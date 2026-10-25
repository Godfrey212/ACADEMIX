/* ACADEMIX — documents.js */
/* ---------- Document upload, text extraction and "My Documents" library ---------- */
const DOC = {
  MAX_CHARS: 60000, MAX_FILES: 15, MAX_MB: 25,
  PDFJS: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
  PDFW: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js",
  MAMMOTH: "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js"
};
const _scripts = {};
function loadScript(src, globalName) {
  if (globalName && window[globalName]) return Promise.resolve();
  if (!_scripts[src]) _scripts[src] = new Promise((ok, no) => {
    const s = document.createElement("script"); s.src = src; s.async = true;
    s.onload = () => (globalName && !window[globalName] ? no(new Error("cdn")) : ok());
    s.onerror = () => { delete _scripts[src]; s.remove(); no(new Error("cdn")); };
    document.head.appendChild(s);
  });
  return _scripts[src];
}

const Docs = {
  busy: false,
  all() { return Store.get("docs:" + me(), []).slice().sort((a, b) => b.at - a.at); },
  get(id) { return id ? Store.get("docs:" + me(), []).find((d) => d.id === id) || null : null; },
  add(d) {
    const l = Store.get("docs:" + me(), []), doc = { id: uid(), at: Date.now(), ...d };
    l.push(doc);
    while (l.length > DOC.MAX_FILES) l.splice(l.reduce((m, x, i) => (x.at < l[m].at ? i : m), 0), 1);
    if (!Store.put("docs:" + me(), l)) throw new Error("Your browser storage is full. Delete a saved document or summary and try again.");
    return doc;
  },
  del(id) { Store.set("docs:" + me(), Store.get("docs:" + me(), []).filter((d) => d.id !== id)); const s = Store.get("docsel:" + me(), {}); Object.keys(s).forEach((k) => s[k] === id && delete s[k]); Store.set("docsel:" + me(), s); },
  sel(ctx) { const id = Store.get("docsel:" + me(), {})[ctx]; return this.get(id) ? id : null; },
  setSel(ctx, id) { const s = Store.get("docsel:" + me(), {}); s[ctx] = id; Store.set("docsel:" + me(), s); }
};

const extOf = (n) => (String(n).toLowerCase().match(/\.([a-z0-9]+)$/) || [])[1] || "";
const fmtSize = (b) => (b > 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB");
const dateShort = (t) => new Date(t).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });

const readFile = (f, how) => (how === "text" && f.text ? f.text() : how === "buf" && f.arrayBuffer ? f.arrayBuffer() : new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => no(new Error("Couldn't read that file.")); how === "text" ? r.readAsText(f) : r.readAsArrayBuffer(f); }));
async function extractText(file, prog) {
  const ext = extOf(file.name);
  if (ext === "doc") throw new Error("Old Word .doc files aren't supported. Save it as .docx or PDF and upload again.");
  if (!["pdf", "docx", "txt", "md", "markdown"].includes(ext)) throw new Error(`“${file.name}” isn't supported. Upload a PDF, Word (.docx), .txt or .md file.`);
  if (file.size > DOC.MAX_MB * 1048576) throw new Error(`That file is ${fmtSize(file.size)}. The limit is ${DOC.MAX_MB} MB.`);
  if (!file.size) throw new Error("That file is empty.");
  if (ext === "pdf") {
    prog(0.03, "Loading the PDF reader…");
    try { await loadScript(DOC.PDFJS, "pdfjsLib"); } catch (e) { throw new Error("Couldn't load the PDF reader. Check your internet connection and try again."); }
    pdfjsLib.GlobalWorkerOptions.workerSrc = DOC.PDFW;
    prog(0.08, "Opening PDF…");
    let pdf;
    try { pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await readFile(file, "buf")) }).promise; }
    catch (e) { throw new Error(e?.name === "PasswordException" ? "This PDF is password-protected. Remove the password and upload it again." : "This PDF couldn't be opened. It may be damaged."); }
    let out = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i), tc = await page.getTextContent();
      out += tc.items.map((it) => (it.str || "") + (it.hasEOL ? "\n" : " ")).join("") + "\n\n";
      prog(0.08 + (0.9 * i) / pdf.numPages, `Reading page ${i} of ${pdf.numPages}…`);
      if (out.length > DOC.MAX_CHARS * 1.5) break;
    }
    if (out.replace(/\s+/g, "").length < 40 * Math.min(pdf.numPages, 3)) throw new Error("This PDF looks scanned: its pages are images, so there's no text to read. Try a text-based PDF, or copy the text into a .txt file.");
    return { text: out, pages: pdf.numPages };
  }
  if (ext === "docx") {
    prog(0.1, "Loading the Word reader…");
    try { await loadScript(DOC.MAMMOTH, "mammoth"); } catch (e) { throw new Error("Couldn't load the Word reader. Check your internet connection and try again."); }
    prog(0.4, "Reading document…");
    let r; try { r = await mammoth.extractRawText({ arrayBuffer: await readFile(file, "buf") }); } catch (e) { throw new Error("This Word file couldn't be read. Make sure it's a real .docx file."); }
    return { text: r.value || "" };
  }
  prog(0.4, "Reading text…");
  let t = await readFile(file, "text");
  if (ext !== "txt") t = t.replace(/```[\s\S]*?```/g, " ").replace(/^#{1,6}\s*/gm, "").replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[*_`>]+/g, "");
  return { text: t };
}

async function handleUpload(file, ctx) {
  if (!file || Docs.busy) return;
  const prog = $("#dprog"), bar = $("#dprog i"), lbl = $("#dprog-l"), err = $("#derr");
  const set = (p, msg) => { if (bar) bar.style.width = Math.round(p * 100) + "%"; if (lbl) lbl.textContent = msg; };
  if (err) err.textContent = "";
  if (prog) prog.hidden = false;
  Docs.busy = true; $("#dz")?.classList.add("busy");
  try {
    const r = await extractText(file, set);
    let text = Offline.clean(r.text);
    if (Offline.wordCount(text) < 30) throw new Error(extOf(file.name) === "pdf" ? "This PDF has almost no readable text. If it's scanned, try a text-based version." : "This file has almost no text in it.");
    const cut = text.length > DOC.MAX_CHARS; if (cut) text = text.slice(0, DOC.MAX_CHARS);
    set(1, "Saving…");
    const d = Docs.add({ name: file.name, type: extOf(file.name), size: file.size, pages: r.pages || null, words: Offline.wordCount(text), chars: text.length, cut, text });
    Docs.setSel(ctx, d.id); Docs.busy = false;
    if (route() === ctx) render();
    toast(cut ? `“${d.name}” added. It's long, so only the first ${(DOC.MAX_CHARS / 1000) | 0}k characters were kept.` : `“${d.name}” added to My Documents.`, "check-circle");
  } catch (e) {
    Docs.busy = false; $("#dz")?.classList.remove("busy");
    if ($("#dprog")) $("#dprog").hidden = true;
    const m = e?.message || "Something went wrong reading that file.";
    if ($("#derr")) $("#derr").textContent = m; toast(m, "alert-circle");
  }
}

/* Shared panel: dropzone + picker + library. ctx = "quiz" | "study" */
function docPanel(ctx, title = "1. Choose a document") {
  const l = Docs.all(), sel = Docs.sel(ctx);
  return `<div class="card x-docs" data-ctx="${ctx}"><div class="between"><h3 style="margin:0">${title}</h3>${l.length ? `<span class="mlabel" style="margin:0">${plural(l.length, "saved document")}</span>` : ""}</div>
    <div class="x-dz" id="dz" data-ctx="${ctx}" role="group" aria-label="Upload a document">
      <div class="ficon" style="margin:0 auto 10px">${ic("cloud-upload")}</div>
      <p><b>Drag &amp; drop</b> a PDF, Word or text file here</p>
      <p class="mlabel">PDF · DOCX · TXT · MD, up to ${DOC.MAX_MB} MB</p>
      <button class="btn" type="button" data-act="doc-browse" style="margin-top:12px">${ic("folder-open")} Browse files</button>
      <input type="file" id="docfile" data-ctx="${ctx}" accept=".pdf,.docx,.txt,.md,.markdown,application/pdf,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hidden>
    </div>
    <div class="x-prog" id="dprog" hidden aria-live="polite"><div class="bar"><i style="width:0"></i></div><p class="mlabel" id="dprog-l">Starting…</p></div>
    <p class="x-err" id="derr" role="alert"></p>
    <h4 class="x-h4">My Documents</h4>
    ${l.length ? `<ul class="x-doclist">${l.map((d) => `<li class="${d.id === sel ? "on" : ""}"><button class="x-docpick" data-act="doc-pick" data-id="${d.id}" aria-pressed="${d.id === sel}"><span class="x-dic">${ic(d.id === sel ? "check-circle" : "file-text")}</span><span class="x-dmeta"><b>${esc(d.name)}</b><small>${d.words.toLocaleString()} words${d.pages ? ` · ${plural(d.pages, "page")}` : ""} · ${dateShort(d.at)}${d.cut ? " · trimmed" : ""}</small></span></button><button class="icon-btn" data-act="doc-del" data-id="${d.id}" aria-label="Delete ${esc(d.name)}">${ic("trash-2")}</button></li>`).join("")}</ul>`
      : `<p class="muted x-empty">No documents yet. Upload lecture notes, a handout or past questions to get started.</p>`}
  </div>`;
}

document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-act]");
  if (!b) { const dz = e.target.closest(".x-dz"); if (dz && e.target.id !== "docfile" && !Docs.busy) $("#docfile")?.click(); return; }
  const a = b.dataset.act;
  if (a === "doc-browse") { if (!Docs.busy) $("#docfile")?.click(); }
  if (a === "doc-pick") { const ctx = b.closest(".x-docs")?.dataset.ctx || route(); Docs.setSel(ctx, b.dataset.id); render(); }
  if (a === "doc-del") { const d = Docs.get(b.dataset.id); if (d && confirm(`Delete “${d.name}” from My Documents? Saved summaries and quiz history are kept.`)) { Docs.del(d.id); render(); toast(`“${d.name}” deleted.`, "trash-2"); } }
});
document.addEventListener("change", (e) => { if (e.target.id === "docfile") { const f = e.target.files[0]; e.target.value = ""; handleUpload(f, e.target.dataset.ctx); } });
document.addEventListener("dragover", (e) => {
  if (!["quiz", "study"].includes(route())) return;
  e.preventDefault();
  const dz = e.target.closest?.(".x-dz"); document.querySelectorAll(".x-dz.over").forEach((x) => x !== dz && x.classList.remove("over"));
  if (dz) { dz.classList.add("over"); e.dataTransfer.dropEffect = "copy"; } else e.dataTransfer.dropEffect = "none";
});
document.addEventListener("dragleave", (e) => { const dz = e.target.closest?.(".x-dz"); if (dz && !dz.contains(e.relatedTarget)) dz.classList.remove("over"); });
document.addEventListener("drop", (e) => {
  if (!["quiz", "study"].includes(route())) return;
  e.preventDefault();
  const dz = e.target.closest?.(".x-dz"); document.querySelectorAll(".x-dz.over").forEach((x) => x.classList.remove("over"));
  if (!dz) return;
  const fs = e.dataTransfer?.files; if (!fs || !fs.length) return;
  if (fs.length > 1) toast("One file at a time: uploading the first one.", "info");
  handleUpload(fs[0], dz.dataset.ctx);
});
