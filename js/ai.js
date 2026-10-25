/* ACADEMIX — ai.js */
/* ---------- Offline engine: TF-IDF summariser + quiz generator (no network, no DOM) ---------- */
const Offline = (() => {
  const STOP = new Set(("a about above after again against all also am an and any are aren't as at be because been before being below between both but by can can't cannot could couldn't did didn't do does doesn't doing don't down during each either else etc even ever every few for from further get gets got had hadn't has hasn't have haven't having he her here hers herself him himself his how however i if in into is isn't it it's its itself just least less let's like made make makes many may me might more most much must mustn't my myself neither no nor not now of off often on once one only or other others otherwise our ours ourselves out over own per perhaps rather really said same say says see seen several shall she should shouldn't since so some such than that that's the their theirs them themselves then there there's therefore these they they're this those though through thus to too toward towards under until up upon us use used uses using very via was wasn't we well were weren't what when where whether which while who whom whose why will with within without won't would wouldn't yet you your yours yourself yourselves " +
    "able across actually almost already although always among another anyone anything around away back become becomes became called came come comes certain clearly consider considered different does done either enough especially example examples first following found four general given gives give good great hence here's important include includes included including instead known large later likely long main mainly makes means mostly near need needs new next number numbers often old order part particular placed possible present provide provides put quite rather real refer refers related second seems set show shown shows similar simply small specific still take taken takes thing things think three thus today true two type types usually various way ways whole within words work works year years chapter section figure fig table page pages lecture note notes unit").split(" "));
  const VERB = new Set("place convert carry occur occurs reduce reduces affect affects broken split release fix fixed produce produced absorb absorbs store stored catalyse catalyses dominate dominates mean become allow allows contain contains describe describes explain explains happen happens involve involves lead leads form forms help helps keep known called".split(" "));
  const ABBR = /\b(?:e\.g|i\.e|etc|vs|cf|al|fig|eq|no|vol|dr|mr|mrs|ms|prof|st|jr|sr|inc|ltd|approx|dept|univ)\.$/i;

  const clean = (t) => String(t || "").replace(/\r/g, "").replace(/(\w)-\n(\w)/g, "$1$2").replace(/[ \t\f\v]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  const words = (t) => String(t).match(/[A-Za-z][A-Za-z'’-]*[A-Za-z]|[A-Za-z]|\d+(?:\.\d+)?/g) || [];
  const wordCount = (t) => words(t).length;
  const stem = (w) => { w = w.toLowerCase().replace(/[’']s$/, "").replace(/[’']/g, ""); if (w.length > 4) { if (/ies$/.test(w)) return w.slice(0, -3) + "y"; if (/(ss|us|is)$/.test(w)) return w; if (/s$/.test(w)) return w.slice(0, -1); } return w; };
  const isContent = (w) => /^[a-z][a-z'’-]*$/i.test(w) && w.length >= 4 && !STOP.has(w.toLowerCase());

  function sentences(text) {
    const out = [];
    clean(text).split(/\n{2,}/).forEach((para) => {
      const lines = para.split("\n");
      // Treat short heading-like lines and bullet lines as their own units
      let buf = "";
      const flush = () => { if (buf.trim()) out.push(...splitSent(buf.trim())); buf = ""; };
      lines.forEach((ln) => {
        const l = ln.trim(); if (!l) return;
        if (/^([-•*▪◦]|\d+[.)])\s+/.test(l)) { flush(); buf = l.replace(/^([-•*▪◦]|\d+[.)])\s+/, ""); flush(); return; }
        buf += (buf ? " " : "") + l;
      });
      flush();
    });
    return out.map((s) => s.replace(/\s+/g, " ").trim()).filter((s) => wordCount(s) >= 4);
  }
  function splitSent(p) {
    const res = []; let start = 0;
    const re = /[.!?]+["')\]]*\s+(?=["'(\[]?[A-Z0-9])/g; let m;
    while ((m = re.exec(p))) {
      const piece = p.slice(start, m.index + m[0].length).trim();
      if (ABBR.test(p.slice(start, m.index + 1).trim()) || /\b[A-Z]\.$/.test(p.slice(0, m.index + 1))) continue;
      res.push(piece); start = m.index + m[0].length;
    }
    if (start < p.length) res.push(p.slice(start).trim());
    return res;
  }

  /* Tokenise each sentence with positions; build TF-IDF over sentences as "documents". */
  function analyse(text) {
    const S = sentences(text);
    const sents = S.map((s, i) => {
      const toks = []; const re = /[A-Za-z][A-Za-z'’-]*[A-Za-z]|[A-Za-z]/g; let m;
      while ((m = re.exec(s))) toks.push({ w: m[0], k: stem(m[0]), s: m.index, e: m.index + m[0].length, c: isContent(m[0]) });
      return { i, text: s, toks, n: toks.length };
    });
    const N = sents.length || 1, tf = new Map(), df = new Map(), surf = new Map(), capMid = new Map();
    const bump = (m, k, v = 1) => m.set(k, (m.get(k) || 0) + v);
    sents.forEach((st) => {
      const seen = new Set();
      st.toks.forEach((t, j) => {
        if (!t.c) return;
        bump(tf, t.k); if (!seen.has(t.k)) { seen.add(t.k); bump(df, t.k); }
        const sm = surf.get(t.k) || new Map(); bump(sm, t.w); surf.set(t.k, sm);
        if (j > 0 && /^[A-Z]/.test(t.w)) bump(capMid, t.k);
      });
      // bigrams of adjacent content words with no punctuation between them
      for (let j = 0; j < st.toks.length - 1; j++) {
        const a = st.toks[j], b = st.toks[j + 1];
        if (a.c && b.c && /^[ -]$/.test(st.text.slice(a.e, b.s))) {
          const k = a.k + " " + b.k; bump(tf, k); if (!seen.has(k)) { seen.add(k); bump(df, k); }
          const sm = surf.get(k) || new Map(); bump(sm, st.text.slice(a.s, b.e)); surf.set(k, sm);
        }
      }
    });
    const idf = (k) => Math.log((N + 1) / ((df.get(k) || 0) + 0.5)) + 1;
    const display = (k) => { const sm = surf.get(k); if (!sm) return k; let best = k, bc = -1; sm.forEach((c, w) => { if (c > bc) { bc = c; best = w; } }); return best; };
    // Key terms
    const cand = [];
    tf.forEach((c, k) => {
      const bi = k.includes(" ");
      if (bi && c < 2) return;
      let sc = c * idf(k) * (bi ? 1.6 : 1);
      if (!bi && (capMid.get(k) || 0) >= Math.max(1, c / 2)) sc *= 1.25;
      if (!bi && k.length >= 7) sc *= 1.1;
      cand.push({ k, sc, c, bi });
    });
    cand.sort((a, b) => b.sc - a.sc || b.c - a.c);
    // a unigram that (almost) only ever appears inside a repeated phrase is absorbed by that phrase ("dioxide" -> "carbon dioxide")
    const inBi = new Map();
    cand.forEach((t) => { if (t.bi) t.k.split(" ").forEach((u) => bump(inBi, u, t.c)); });
    const verbish = (w) => /(?:ed|ing|ly|ize|ise|ates?)$/.test(w) || VERB.has(w);
    const terms = [];
    for (const t of cand) {
      if (!t.bi && (tf.get(t.k) || 0) - (inBi.get(t.k) || 0) < 1) continue;
      const nounish = t.bi || (!verbish(t.k) && (t.c >= 2 || (capMid.get(t.k) || 0) > 0 || t.k.length >= 8));
      if (!nounish) continue;
      terms.push({ k: t.k, term: display(t.k), score: t.sc, bi: t.bi, count: t.c });
      if (terms.length >= 40) break;
    }
    const rank = new Map(terms.map((t, i) => [t.k, i]));
    // Sentence scores
    sents.forEach((st) => {
      const ks = st.toks.filter((t) => t.c).map((t) => t.k);
      const uniq = [...new Set(ks)];
      let sc = uniq.reduce((a, k) => a + ((tf.get(k) || 0) / Math.max(1, ks.length)) * idf(k), 0);
      sc += uniq.filter((k) => rank.has(k) && rank.get(k) < 15).length * 0.6;
      sc /= Math.sqrt(Math.max(1, uniq.length)) / 1.5;
      if (st.i < Math.max(2, N * 0.1)) sc *= 1.15;
      if (st.n < 6) sc *= 0.55; else if (st.n > 55) sc *= 0.65;
      if (/[?:]$/.test(st.text)) sc *= 0.7;
      st.score = sc; st.keys = uniq;
    });
    return { sents, terms, rank, N, words: wordCount(text) };
  }
  const jacc = (a, b) => { const A = new Set(a), B = new Set(b); let x = 0; A.forEach((k) => B.has(k) && x++); return x / Math.max(1, A.size + B.size - x); };
  const LEN = { short: [0.15, 4, 6, 8], medium: [0.25, 6, 10, 12], detailed: [0.4, 9, 18, 18] };

  function summarize(text, len = "medium") {
    const A = analyse(text);
    if (A.sents.length < 3 || A.words < 60) throw new Error("This document is too short to summarise. It needs at least a few paragraphs of text.");
    const [r, mn, mx, nt] = LEN[len] || LEN.medium;
    const want = Math.max(mn, Math.min(mx, Math.round(A.sents.length * r)));
    const pick = [];
    A.sents.slice().sort((a, b) => b.score - a.score).forEach((s) => { if (pick.length < want && !pick.some((p) => jacc(p.keys, s.keys) > 0.6)) pick.push(s); });
    const byRank = pick.slice(), ord = pick.slice().sort((a, b) => a.i - b.i);
    const ov = new Set(byRank.slice(0, 2).map((s) => s.i));
    const overview = ord.filter((s) => ov.has(s.i)).map((s) => s.text).join(" ");
    const points = ord.filter((s) => !ov.has(s.i)).map((s) => s.text);
    const terms = A.terms.slice(0, nt).map((t) => t.term);
    const after = wordCount(overview + " " + points.join(" "));
    return { overview, points, terms, exam: [], before: A.words, after };
  }

  const shuffle = (a, rnd = Math.random) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  const matchCase = (src, w) => (/^[A-Z][a-z]/.test(src) && /^[a-z]/.test(w) ? w[0].toUpperCase() + w.slice(1) : /^[a-z]/.test(src) && /^[A-Z][a-z]+$/.test(w) && !/[A-Z]/.test(w.slice(1)) ? w.toLowerCase() : w);

  /* Find the span of term k (unigram stem or "a b" bigram stem) inside a tokenised sentence */
  function span(st, t) {
    if (t.bi) { const [x, y] = t.k.split(" "); for (let j = 0; j < st.toks.length - 1; j++) if (st.toks[j].k === x && st.toks[j + 1].k === y) return [st.toks[j].s, st.toks[j + 1].e]; return null; }
    const tk = st.toks.find((q) => q.k === t.k); return tk ? [tk.s, tk.e] : null;
  }
  function distractors(ans, termObj, pool, n, diff, sentText) {
    const an = norm(ans), lowS = sentText.toLowerCase();
    let c = pool.filter((p) => p.k !== termObj.k && norm(p.term) !== an && !lowS.includes(p.term.toLowerCase()) && !an.includes(norm(p.term)) && !norm(p.term).includes(an));
    if (diff === "hard") c.sort((a, b) => (Math.abs(a.term.length - ans.length) - Math.abs(b.term.length - ans.length)) + ((a.bi === termObj.bi ? 0 : 3) - (b.bi === termObj.bi ? 0 : 3)));
    else if (diff === "medium") { c = shuffle(c); c.sort((a, b) => (a.bi === termObj.bi ? 0 : 1) - (b.bi === termObj.bi ? 0 : 1)); }
    else c = shuffle(c);
    const out = [], seen = new Set([an]);
    for (const p of c) { const v = matchCase(ans, p.term), nv = norm(v); if (!seen.has(nv)) { seen.add(nv); out.push(v); } if (out.length >= n) break; }
    return out;
  }
  const BL = "_____";
  function quiz(text, { count = 10, types = ["mcq", "tf", "short"], difficulty = "medium" } = {}) {
    const A = analyse(text);
    if (A.sents.length < 4 || A.words < 80 || A.terms.length < 4) throw new Error("This document is too short to build a quiz. Try a longer document with more detail.");
    types = types.filter((t) => ["mcq", "tf", "short"].includes(t)); if (!types.length) types = ["mcq"];
    const keyTerms = A.terms.slice(0, 30);
    // candidate sentences: 7–45 words and containing at least one key term
    let cands = A.sents.filter((s) => s.n >= 7 && s.n <= 45 && keyTerms.some((t) => span(s, t)));
    cands.sort((a, b) => b.score - a.score);
    if (difficulty === "easy") cands = cands.filter((s) => s.n <= 30).concat(cands.filter((s) => s.n > 30));
    if (difficulty === "hard") cands = cands.slice().sort((a, b) => b.n - a.n + (b.score - a.score));
    const plan = []; for (let i = 0; i < count; i++) plan.push(types[i % types.length]);
    const qs = [], usedS = new Set(), usedQ = new Set(), usedAns = new Map();
    const termFor = (st) => {
      let inS = keyTerms.filter((t) => span(st, t));
      const bis = inS.filter((t) => t.bi).map((t) => span(st, t));
      inS = inS.filter((t) => t.bi || !bis.some((b) => { const sp = span(st, t); return sp[0] >= b[0] && sp[1] <= b[1]; }));
      if (!inS.length) return null;
      inS.sort((a, b) => (usedAns.get(a.k) || 0) - (usedAns.get(b.k) || 0) || (difficulty === "hard" ? A.rank.get(b.k) - A.rank.get(a.k) : A.rank.get(a.k) - A.rank.get(b.k)));
      return inS[0];
    };
    const add = (q, st, t) => { const nq = norm(q.question); if (usedQ.has(nq)) return false; usedQ.add(nq); usedS.add(st.i); usedAns.set(t.k, (usedAns.get(t.k) || 0) + 1); q.id = "q" + (qs.length + 1); qs.push(q); return true; };
    for (const type of plan) {
      let made = false;
      for (const st of cands) {
        if (usedS.has(st.i)) continue;
        const t = termFor(st); if (!t) continue;
        const sp = span(st, t), ans = st.text.slice(sp[0], sp[1]);
        if ((usedAns.get(t.k) || 0) >= 2) continue;
        const blanked = st.text.slice(0, sp[0]) + BL + st.text.slice(sp[1]);
        if (type === "mcq") {
          const ds = distractors(ans, t, keyTerms, 3, difficulty, st.text);
          if (ds.length < 3) continue;
          made = add({ type, question: blanked, options: shuffle([ans, ...ds]), answer: ans, explanation: `From your document: “${st.text}”` }, st, t);
        } else if (type === "tf") {
          const makeFalse = Math.random() < 0.5;
          if (makeFalse) {
            const d = distractors(ans, t, keyTerms, 1, difficulty, st.text)[0];
            if (!d) continue;
            made = add({ type, question: st.text.slice(0, sp[0]) + d + st.text.slice(sp[1]), options: ["True", "False"], answer: "False", explanation: `False. The document says “${ans}”, not “${d}”: “${st.text}”` }, st, t);
          } else made = add({ type, question: st.text, options: ["True", "False"], answer: "True", explanation: `True. This is stated in your document.` }, st, t);
        } else {
          const hint = difficulty === "easy" ? ` (starts with “${ans[0].toUpperCase()}”, ${ans.replace(/\s/g, "").length} letters)` : difficulty === "medium" ? ` (${ans.split(/\s+/).length > 1 ? ans.split(/\s+/).length + " words" : ans.length + " letters"})` : "";
          made = add({ type, question: `Fill in the blank${hint}: ${blanked}`, options: [], answer: ans, explanation: `From your document: “${st.text}”` }, st, t);
        }
        if (made) break;
      }
    }
    return shuffle(qs).map((q, i) => ({ ...q, id: "q" + (i + 1) }));
  }

  /* Answer checking: case-insensitive; Levenshtein ≤ 1 allowed when the answer is over 4 letters */
  function lev(a, b) {
    if (a === b) return 0; if (!a.length) return b.length; if (!b.length) return a.length;
    let p = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) { const c = [i]; for (let j = 1; j <= b.length; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; }
    return p[b.length];
  }
  function check(q, given) {
    if (given == null || String(given).trim() === "") return false;
    if (q.type === "short") { const a = norm(q.answer), g = norm(given); if (!g) return false; return a === g || (a.replace(/ /g, "").length > 4 && lev(a, g) <= 1); }
    return norm(given) === norm(q.answer);
  }
  return { clean, sentences, analyse, summarize, quiz, check, lev, wordCount, norm };
})();

/* ---------- Gemini client (optional; key stays in this browser) ---------- */
const AI = {
  URL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=",
  MAX: 30000,
  key() { return typeof Store !== "undefined" ? Store.get("gkey:" + me(), "") || "" : ""; },
  on() { return !!this.key(); },
  async call(prompt, json, key = this.key(), ms = 60000) {
    const ctl = typeof AbortController !== "undefined" ? new AbortController() : null, tm = ctl && setTimeout(() => ctl.abort(), ms);
    let res;
    try {
      res = await fetch(this.URL + encodeURIComponent(key), { method: "POST", headers: { "Content-Type": "application/json" }, signal: ctl?.signal,
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: json ? 0.4 : 0.3, ...(json ? { responseMimeType: "application/json" } : {}) } }) });
    } catch (e) { throw new Error(e.name === "AbortError" ? "Gemini took too long to respond." : "Couldn't reach Gemini. Check your internet connection."); }
    finally { tm && clearTimeout(tm); }
    let data = null; try { data = await res.json(); } catch (e) {}
    if (!res.ok) {
      const m = data?.error?.message || "";
      if (res.status === 400 && /api key/i.test(m)) throw new Error("Gemini rejected the API key.");
      if (res.status === 403) throw new Error("This API key doesn't have access to Gemini.");
      if (res.status === 429) throw new Error("Gemini's free limit was reached. Try again in a minute.");
      throw new Error("Gemini error " + res.status + (m ? ": " + m.slice(0, 120) : "."));
    }
    const out = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
    if (!out.trim()) throw new Error(data?.promptFeedback?.blockReason ? "Gemini declined this document." : "Gemini returned an empty answer.");
    return out;
  },
  cap(t) { t = Offline.clean(t); return t.length > this.MAX ? t.slice(0, this.MAX) : t; },
  parseJSON(s) {
    s = String(s).replace(/^\s*```(?:json)?/i, "").replace(/```\s*$/, "").trim();
    try { return JSON.parse(s); } catch (e) {}
    const a = s.indexOf("["), b = s.lastIndexOf("]");
    if (a >= 0 && b > a) { try { return JSON.parse(s.slice(a, b + 1)); } catch (e) {} }
    return null;
  },
  normQ(q, types) {
    if (!q || typeof q !== "object") return null;
    const type = String(q.type || "").toLowerCase(), question = String(q.question || "").trim();
    if (!["mcq", "tf", "short"].includes(type) || !types.includes(type) || question.length < 8) return null;
    let options = Array.isArray(q.options) ? q.options.map((o) => String(o).trim()).filter(Boolean) : [], answer = q.answer;
    if (type === "tf") {
      const a = String(answer).trim().toLowerCase();
      answer = a === "true" || answer === true ? "True" : a === "false" || answer === false ? "False" : null;
      if (!answer) return null; options = ["True", "False"];
    } else if (type === "mcq") {
      options = [...new Set(options)];
      if (options.length < 3) return null;
      answer = String(answer ?? "").trim();
      if (!options.includes(answer)) {
        const L = answer.match(/^([A-Da-d])[).:]?$/), n = /^\d$/.test(answer) ? +answer : -1;
        const hit = options.find((o) => o.toLowerCase() === answer.toLowerCase()) || (L ? options["abcd".indexOf(L[1].toLowerCase())] : null) || (n >= 0 ? options[n] || options[n - 1] : null) || options.find((o) => o.replace(/^[A-D][).:]\s*/i, "") === answer.replace(/^[A-D][).:]\s*/i, ""));
        if (!hit) return null; answer = hit;
      }
    } else { answer = String(answer ?? "").trim(); if (!answer || answer.length > 80) return null; options = []; }
    return { type, question, options, answer, explanation: String(q.explanation || "").trim() || "Based on your document." };
  },
  async quiz(text, o) {
    const N = { mcq: "multiple choice (mcq)", tf: "true/false (tf)", short: "short fill-in answer (short)" };
    const prompt = `You are an exam question writer for Nigerian university students. Using ONLY the study material below, write exactly ${o.count} quiz questions at ${o.difficulty} difficulty.
Use only these question types, mixed roughly evenly: ${o.types.map((t) => N[t]).join(", ")}.
Return ONLY a JSON array (no markdown, no commentary). Each item must be:
{"type":"mcq"|"tf"|"short","question":string,"options":string[],"answer":string,"explanation":string}
Rules: mcq has exactly 4 distinct options and "answer" is copied exactly from "options". tf has options ["True","False"] and answer "True" or "False". short has options [] and answer is a 1-3 word term from the material. Each explanation is one sentence based on the material. No duplicate questions.

STUDY MATERIAL:
"""
${this.cap(text)}
"""`;
    const raw = await this.call(prompt, true), arr = this.parseJSON(raw);
    const list = (Array.isArray(arr) ? arr : Array.isArray(arr?.questions) ? arr.questions : []).map((q) => this.normQ(q, o.types)).filter(Boolean);
    const seen = new Set(), qs = list.filter((q) => { const k = Offline.norm(q.question); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, o.count);
    if (qs.length < Math.max(1, Math.ceil(o.count / 2))) throw new Error("Gemini's answer couldn't be read as a quiz.");
    return qs.map((q, i) => ({ ...q, id: "q" + (i + 1) }));
  },
  async summary(text, len) {
    const L = { short: "Keep it brief: a 2-3 sentence overview, 4-6 key points, 6-8 key terms, 3 likely exam questions.", medium: "A 3-4 sentence overview, 6-10 key points, 8-12 key terms, 5 likely exam questions.", detailed: "A full paragraph overview, 10-16 detailed key points, 12-18 key terms, 8 likely exam questions." };
    const prompt = `Summarise this study material for a university student revising for exams. ${L[len] || L.medium}
Reply in Markdown using exactly these four headings and nothing before the first heading:
## Overview
## Key Points
(bullet list)
## Key Terms
(bullet list, each "- **Term**: short definition")
## Likely Exam Questions
(numbered list)

STUDY MATERIAL:
"""
${this.cap(text)}
"""`;
    const md = await this.call(prompt, false), sec = {};
    let cur = null;
    md.split(/\r?\n/).forEach((ln) => {
      const h = ln.match(/^\s*#{1,4}\s*(.+?)\s*:?\s*$/) || ln.match(/^\s*\*\*(overview|key points|key terms|likely exam questions)\*\*:?\s*$/i);
      if (h) { const t = h[1].toLowerCase(); cur = /overview|summary/.test(t) ? "ov" : /point/.test(t) ? "pt" : /term|glossary/.test(t) ? "tm" : /exam|question/.test(t) ? "ex" : null; return; }
      if (cur && ln.trim()) (sec[cur] = sec[cur] || []).push(ln.trim());
    });
    const items = (a) => (a || []).filter((l) => /^([-*•]|\d+[.)])\s+/.test(l)).map((l) => l.replace(/^([-*•]|\d+[.)])\s+/, "").trim()).filter(Boolean);
    const overview = (sec.ov || []).filter((l) => !/^([-*•]|\d+[.)])\s+/.test(l)).join(" ").trim() || items(sec.ov).join(" ");
    const points = items(sec.pt), exam = items(sec.ex);
    const terms = items(sec.tm).map((l) => { const m = l.match(/^\*\*(.+?)\*\*\s*[:—–-]?\s*(.*)$/) || l.match(/^(.+?)\s*[:—–-]\s+(.*)$/); return m ? { t: m[1].replace(/\*/g, "").trim(), d: m[2].trim() } : { t: l.replace(/\*/g, ""), d: "" }; });
    if (!overview || !points.length) throw new Error("Gemini's summary couldn't be read.");
    return { overview, points, terms, exam };
  },
  async test(key) { const r = await this.call('Reply with the single word "OK".', false, key, 20000); return /ok/i.test(r); }
};

/* ---------- Engine: Gemini when a key is saved, otherwise (or on error) offline ---------- */
const Engine = {
  async quiz(text, o) {
    if (AI.on()) { try { return { questions: await AI.quiz(text, o), mode: "ai" }; } catch (e) { toast(e.message + " Using the offline engine instead.", "wifi-off"); return { questions: Offline.quiz(text, o), mode: "fallback" }; } }
    return { questions: Offline.quiz(text, o), mode: "offline" };
  },
  async summary(text, len) {
    const before = Offline.wordCount(text);
    if (AI.on()) {
      try { const r = await AI.summary(text, len); return { ...r, before, after: Offline.wordCount([r.overview, ...r.points, ...r.terms.map((t) => t.t + " " + t.d), ...r.exam].join(" ")), mode: "ai" }; }
      catch (e) { toast(e.message + " Using the offline engine instead.", "wifi-off"); const r = Offline.summarize(text, len); return { ...r, terms: r.terms.map((t) => ({ t, d: "" })), mode: "fallback" }; }
    }
    const r = Offline.summarize(text, len); return { ...r, terms: r.terms.map((t) => ({ t, d: "" })), mode: "offline" };
  }
};
const modeBadge = (m) => m === "ai" ? `<span class="x-mode ai">${ic("sparkles")} Gemini AI</span>` : m === "fallback" ? `<span class="x-mode">${ic("wifi-off")} Offline engine (AI unavailable)</span>` : `<span class="x-mode">${ic("cpu")} Offline engine</span>`;
const inlineMd = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/`([^`]+)`/g, "<code>$1</code>").replace(/(^|[^*])\*([^*]+)\*/g, "$1<i>$2</i>");

/* ---------- Settings card: AI Study Assistant ---------- */
const aiCard = () => {
  const k = AI.key(), masked = k ? k.slice(0, 4) + "••••••••" + k.slice(-4) : "";
  return `<div class="card" id="ai-card"><h3>${ic("sparkles")} AI Study Assistant</h3>
    <p class="muted" style="font-size:14px">Quiz and Study work offline. Add a free Google Gemini API key for smarter questions and summaries. Get a free key at <a class="link" href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">aistudio.google.com</a>.</p>
    <div class="x-aistat">${k ? `<span class="feas ok">${ic("check")} Key saved · ${esc(masked)}</span>` : `<span class="feas">${ic("cpu")} Offline mode</span>`}</div>
    <div class="field" style="margin-top:12px"><label for="ai-key">Gemini API key</label><div class="pw"><input class="input" id="ai-key" type="password" autocomplete="off" spellcheck="false" placeholder="${k ? "Paste a new key to replace it" : "AIza…"}"><button type="button" data-act="pw" data-for="ai-key" aria-label="Show password">${ic("eye")}</button></div></div>
    <p class="x-err" id="ai-err" role="alert"></p>
    <div class="btnrow"><button class="btn btn--primary" data-act="ai-save">${ic("save")} Save key</button><button class="btn" data-act="ai-test">${ic("plug-zap")} Test${k ? "" : " key"}</button>${k ? `<button class="btn btn--ghost" data-act="ai-del" style="color:var(--danger)">${ic("trash-2")} Remove key</button>` : ""}</div>
    <p class="mlabel" style="margin-top:12px">The key is kept only in this browser's local storage. When a key is saved, document text (up to about 30,000 characters) is sent to Google to generate results.</p></div>`;
};
if (typeof document !== "undefined") document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  const a = b.dataset.act, inp = $("#ai-key"), err = $("#ai-err");
  if (!["ai-save", "ai-test", "ai-del"].includes(a)) return;
  if (err) err.textContent = "";
  if (a === "ai-save") {
    const v = (inp?.value || "").trim();
    if (!v) { err.textContent = "Paste your Gemini API key first."; inp?.focus(); return; }
    if (!/^[\w-]{20,}$/.test(v)) { err.textContent = "That doesn't look like a Gemini API key. Keys are a long string of letters, numbers and dashes, usually starting with AIza."; return; }
    Store.set("gkey:" + me(), v); render(); toast("Gemini key saved. Quiz and Study will use AI.", "sparkles");
  }
  if (a === "ai-del" && confirm("Remove your Gemini API key? Quiz and Study will switch to the offline engine.")) { Store.del("gkey:" + me()); render(); toast("Gemini key removed.", "trash-2"); }
  if (a === "ai-test") {
    const v = (inp?.value || "").trim() || AI.key();
    if (!v) { err.textContent = "Paste a key to test, or save one first."; inp?.focus(); return; }
    const old = b.innerHTML; b.disabled = true; b.innerHTML = `${ic("loader-circle")} Testing…`; icons(); b.querySelector("svg")?.classList.add("x-spin");
    try { await AI.test(v); toast("Gemini key works.", "check-circle"); } catch (x) { if ($("#ai-err")) $("#ai-err").textContent = x.message; toast(x.message, "alert-circle"); }
    if (b.isConnected) { b.disabled = false; b.innerHTML = old; icons(); }
  }
});
if (typeof module !== "undefined" && module.exports) module.exports = { Offline };
