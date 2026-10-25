/* ACADEMIX — storage.js */
/* ---------- Store: localStorage with in-memory fallback ---------- */
const Store = (() => {
  const mem = {}, P = "academix:";
  let ok = true;
  try { localStorage.setItem(P + "t", "1"); localStorage.removeItem(P + "t"); } catch (e) { ok = false; }
  return {
    get(k, d = null) { try { const v = ok ? localStorage.getItem(P + k) : mem[k]; return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { const s = JSON.stringify(v); try { ok ? localStorage.setItem(P + k, s) : (mem[k] = s); } catch (e) { mem[k] = s; } },
    put(k, v) { const s = JSON.stringify(v); try { ok ? localStorage.setItem(P + k, s) : (mem[k] = s); return true; } catch (e) { return false; } },
    del(k) { try { ok && localStorage.removeItem(P + k); } catch (e) {} delete mem[k]; },
    clear() { try { if (ok) Object.keys(localStorage).filter((k) => k.startsWith(P)).forEach((k) => localStorage.removeItem(k)); } catch (e) {} Object.keys(mem).forEach((k) => delete mem[k]); }
  };
})();

/* ---------- Helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ic = (n) => `<i data-lucide="${n}"></i>`;
const icons = () => window.lucide && lucide.createIcons();
const hash = (s) => { let h = 5381; for (const c of s) h = ((h << 5) + h + c.charCodeAt(0)) | 0; return "h" + (h >>> 0).toString(36); };
function toast(msg, icon = "info") {
  document.querySelectorAll(".toast").forEach((t) => t.remove());
  const t = document.createElement("div");
  t.className = "toast glass"; t.setAttribute("role", "status");
  t.innerHTML = ic(icon) + `<span>${esc(msg)}</span>`;
  document.body.appendChild(t); icons();
  setTimeout(() => t.remove(), 3200);
}

