/* ACADEMIX — theme.js */
/* ---------- Theme ---------- */
const Theme = {
  mode() { const s = Store.get("theme"); return s === "light" || s === "dark" ? s : "system"; },
  init() { const s = this.mode(); this.apply(s !== "system" ? s : matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"); },
  set(m) { Store.set("theme", m); this.init(); document.querySelectorAll('[data-act="theme"]').forEach((b) => (b.outerHTML = this.btn())); icons(); if (typeof Charts !== "undefined") Charts.draw(); },
  apply(t) { document.documentElement.dataset.theme = t; },
  toggle() { const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark"; this.apply(t); Store.set("theme", t); document.querySelectorAll('[data-act="theme"]').forEach((b) => (b.outerHTML = this.btn())); icons(); if (typeof Charts !== "undefined") Charts.draw(); },
  btn() { const d = document.documentElement.dataset.theme === "dark"; return `<button class="icon-btn" data-act="theme" aria-label="Switch to ${d ? "light" : "dark"} mode">${ic(d ? "sun" : "moon")}</button>`; }
};

/* ---------- Auth (demo only) ---------- */
const Auth = {
  users() { return Store.get("users", {}); },
  current() {
    let e = Store.get("session");
    if (!e) try { e = JSON.parse(sessionStorage.getItem("academix:session")); } catch (x) {}
    if (!e) e = Auth._mem;
    return e ? this.users()[e] || null : null;
  },
  signup(u) { const us = this.users(); const e = u.email.toLowerCase(); if (us[e]) return "An account with this email already exists."; us[e] = { ...u, email: e, password: hash(u.password), created: Date.now() }; Store.set("users", us); this.start(e, true); return null; },
  login(email, pw, remember) { const u = this.users()[email.toLowerCase()]; if (!u || u.password !== hash(pw)) return "Incorrect email or password."; this.start(u.email, remember); return null; },
  start(e, remember) { Auth._mem = e; if (remember) Store.set("session", e); else { Store.del("session"); try { sessionStorage.setItem("academix:session", JSON.stringify(e)); } catch (x) {} } },
  logout() { Auth._mem = null; Store.del("session"); try { sessionStorage.removeItem("academix:session"); } catch (x) {} }
};

/* ---------- Logo ---------- */
const LOGO = `<span class="logo"><svg viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--accent)"/><stop offset="1" stop-color="var(--accent2)"/></linearGradient></defs><rect width="32" height="32" rx="9" fill="url(#lg)"/><path d="M9 23 16 8l7 15M11.8 17.5h8.4" fill="none" stroke="var(--on-accent)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="23.5" cy="9" r="2.2" fill="var(--on-accent)"/></svg>ACADEMIX</span>`;

