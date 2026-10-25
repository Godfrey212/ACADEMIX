/* ACADEMIX — views.js */
/* ---------- Views ---------- */
const Views = {};

Views.home = () => {
  const F = [["calculator", "GPA Calculator", "Enter courses, units and grades to get your semester GPA on the 5-point scale."], ["layers", "CGPA Tracker", "Combine every semester into one cumulative figure that updates as you go."], ["trending-up", "GPA Predictor", "See the grades you need next semester to hit the CGPA you want."], ["target", "Academic Goals", "Set a target class of degree and track how close you are."], ["bar-chart-3", "Analytics", "Spot trends across semesters, levels and course units at a glance."], ["history", "Academic History", "Keep a clean record of every semester from 100L to final year."]];
  const S = [["Create your account", "Add your institution, department and level. It takes under a minute."], ["Add your courses", "Enter course codes, credit units and grades for each semester."], ["Track and plan", "Watch your CGPA, set goals and predict what's next."]];
  const Q = [["Which grading scale does ACADEMIX use?", "The standard Nigerian 5-point scale: A = 5, B = 4, C = 3, D = 2, E = 1, F = 0, weighted by credit units."], ["Where is my data stored?", "Only on this device, in your browser's local storage. Nothing is sent to a server (unless you add a Gemini key for the AI Study Assistant, which sends document text to Google), so clearing your browser data will remove it."], ["Is ACADEMIX free?", "Yes. Every feature is free to use."]];
  const r = 70, c = 2 * Math.PI * r, frac = 4.32 / 5;
  return `
  <header class="topnav"><div class="topnav__in glass">
    <a href="#/home" aria-label="ACADEMIX home">${LOGO}</a>
    <nav class="topnav__links" aria-label="Main"><a href="#/home">Home</a><a href="#features" data-scroll>Features</a><a href="#how" data-scroll>How It Works</a><a href="#about" data-scroll>About</a></nav>
    <div class="topnav__cta"><a class="btn btn--ghost hide-m" href="#/login">Sign In</a><a class="btn btn--primary hide-m" href="#/signup">Get Started</a>${Theme.btn()}<button class="icon-btn menu-btn" data-act="menu" aria-label="Open menu" aria-expanded="false">${ic("menu")}</button></div>
  </div>
  <div class="mobile-menu glass" id="mm"><a href="#/home">Home</a><a href="#features" data-scroll>Features</a><a href="#how" data-scroll>How It Works</a><a href="#about" data-scroll>About</a><a href="#/login">Sign In</a><a class="btn btn--primary" href="#/signup">Get Started</a></div></header>
  <main class="wrap">
    <section class="hero fade">
      <div>
        <span class="badge">${ic("sparkles")} Your Grades. Your Growth. Your Future.</span>
        <h1>Know Your Numbers. <span class="grad">Own Your Future.</span></h1>
        <p class="lead">Track your grades, calculate your CGPA, predict your academic future, and make smarter decisions about your education.</p>
        <div class="hero__btns"><a class="btn btn--primary" href="#/signup">Get Started Free →</a><a class="btn" href="#features" data-scroll>Explore Features</a></div>
      </div>
      <div class="hero__vis">
        <div class="card glass ring-card">
          <span class="tag">Sample</span>
          <svg class="ring" viewBox="0 0 180 180" role="img" aria-label="Sample CGPA of 4.32 out of 5.00">
            <defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--accent)"/><stop offset="1" stop-color="var(--accent2)"/></linearGradient></defs>
            <circle cx="90" cy="90" r="${r}" fill="none" stroke="var(--bg2)" stroke-width="14"/>
            <circle cx="90" cy="90" r="${r}" fill="none" stroke="url(#rg)" stroke-width="14" stroke-linecap="round" stroke-dasharray="${c * frac} ${c}" transform="rotate(-90 90 90)"/>
            <text x="90" y="92" text-anchor="middle" font-size="40" font-weight="700">4.32</text>
            <text x="90" y="118" text-anchor="middle" font-size="13" style="fill:var(--text2)">CGPA / 5.00</text>
          </svg>
          <p class="muted" style="font-size:14px">Second Class Upper → First Class</p>
        </div>
        <div class="chip glass chip--a"><b>A</b><span>CSC 301 · 3 units<br><span class="muted">Sample</span></span></div>
        <div class="chip glass chip--b"><b>B</b><span>MTH 205 · 2 units<br><span class="muted">Sample</span></span></div>
      </div>
    </section>
    <section class="sec" id="features">
      <div class="sec__head"><p class="eyebrow">Features</p><h2>Everything you need to stay on top</h2><p class="muted">Built around the Nigerian 5-point grading system.</p></div>
      <div class="grid3">${F.map((f, i) => `<div class="card lift"><div class="ficon${i % 2 ? " alt" : ""}">${ic(f[0])}</div><h3>${f[1]}</h3><p class="muted">${f[2]}</p></div>`).join("")}</div>
    </section>
    <section class="sec" id="how">
      <div class="sec__head"><p class="eyebrow">How It Works</p><h2>Three steps to clarity</h2></div>
      <div class="grid3">${S.map((s, i) => `<div class="card lift"><div class="stepn grad">0${i + 1}</div><h3>${s[0]}</h3><p class="muted">${s[1]}</p></div>`).join("")}</div>
    </section>
    <section class="sec" id="about">
      <div class="sec__head"><p class="eyebrow">About & FAQ</p><h2>Made for Nigerian students</h2><p class="muted">ACADEMIX helps you understand your grades and plan your path to the class of degree you want.</p></div>
      <div class="faq">${Q.map((q) => `<details class="card"><summary>${q[0]}${ic("plus")}</summary><p>${q[1]}</p></details>`).join("")}</div>
    </section>
  </main>
  <footer class="foot"><div class="wrap">${LOGO}<span class="muted" style="font-size:14px">© ${new Date().getFullYear()} ACADEMIX · Your Grades. Your Growth. Your Future.</span><span style="display:flex;gap:16px;font-size:14px"><a href="#/login">Sign In</a><a href="#/signup">Get Started</a></span></div></footer>`;
};

const BANNER = "";
const field = (id, label, type = "text", extra = "") => `<div class="field" id="f-${id}"><label for="${id}">${label}</label>${type === "password" ? `<div class="pw"><input class="input" id="${id}" name="${id}" type="password" ${extra}><button type="button" data-act="pw" data-for="${id}" aria-label="Show password">${ic("eye")}</button></div>` : `<input class="input" id="${id}" name="${id}" type="${type}" ${extra}>`}<p class="ferr" id="e-${id}"></p></div>`;
const authFrame = (title, sub, body) => `<main class="auth"><div class="card glass fade"><div class="between"><a href="#/home">${LOGO}</a>${Theme.btn()}</div><h1>${title}</h1><p class="muted">${sub}</p>${BANNER}${body}</div></main>`;

Views.signup = () => authFrame("Create your account", "Start tracking your academic journey.", `
  <form class="form" id="signup" novalidate>
    ${field("name", "Full Name", "text", 'autocomplete="name"')}
    ${field("email", "Email", "email", 'autocomplete="email"')}
    <div class="row2">${field("inst", "Institution", "text", 'placeholder="e.g. University of Lagos"')}${field("dept", "Department", "text", 'placeholder="e.g. Computer Science"')}</div>
    <div class="row2">${field("reg", "Reg Number", "text", 'placeholder="e.g. 190805001"')}
      <div class="field" id="f-level"><label for="level">Level</label><select class="input" id="level" name="level"><option value="">Select level</option>${["100L", "200L", "300L", "400L", "500L"].map((l) => `<option>${l}</option>`).join("")}</select><p class="ferr" id="e-level"></p></div></div>
    <div>${field("pw", "Password", "password", 'autocomplete="new-password"')}<div class="meter"><i id="meter"></i></div><p class="mlabel" id="mlabel">Use 8+ characters with numbers, capitals and symbols.</p></div>
    ${field("pw2", "Confirm Password", "password", 'autocomplete="new-password"')}
    <div class="field" id="f-terms"><label class="check"><input type="checkbox" id="terms"> I agree to the Terms and Privacy Policy</label><p class="ferr" id="e-terms"></p></div>
    <button class="btn btn--primary btn--block" type="submit">Create Account</button>
    <p class="muted" style="text-align:center;font-size:14px">Already have an account? <a class="link" href="#/login">Sign In</a></p>
  </form>`);

Views.login = () => authFrame("Welcome back", "Sign in to continue to your dashboard.", `
  <form class="form" id="login" novalidate>
    ${field("email", "Email", "email", 'autocomplete="email"')}
    ${field("pw", "Password", "password", 'autocomplete="current-password"')}
    <div class="between"><label class="check"><input type="checkbox" id="remember" checked> Remember Me</label><button type="button" class="link" data-act="forgot">Forgot Password?</button></div>
    <p class="ferr" id="e-form" style="display:block"></p>
    <button class="btn btn--primary btn--block" type="submit">Sign In</button>
    <p class="muted" style="text-align:center;font-size:14px">New to ACADEMIX? <a class="link" href="#/signup">Create Account</a></p>
  </form>`);

/* ---------- App shell ---------- */
const NAV = [["dashboard", "Overview", "layout-dashboard"], ["courses", "My Courses", "library"], ["gpa", "GPA Calculator", "calculator"], ["cgpa", "CGPA Calculator", "layers"], ["predictor", "GPA Predictor", "trending-up"], ["goals", "Academic Goals", "target"], ["analytics", "Analytics", "bar-chart-3"], ["history", "Academic History", "history"], ["quiz", "Quiz", "list-checks"], ["study", "Study", "book-open"], ["profile", "Profile", "user"], ["settings", "Settings", "settings"]];
const BNAV = [["dashboard", "Home", "home"], ["courses", "Courses", "library"], ["gpa", "GPA", "calculator"], ["quiz", "Quiz", "list-checks"], ["study", "Study", "book-open"]];
const moreNav = () => NAV.filter((n) => !BNAV.some((b) => b[0] === n[0]));
const initials = (n) => String(n || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase();
const avatar = (u) => `<div class="avatar" aria-hidden="true">${u.photo ? `<img src="${esc(u.photo)}" alt="">` : esc(initials(u.name))}</div>`;

function shell(route, u, inner) {
  const col = Store.get("sidebar") === "collapsed";
  return `<div class="shell">
  <aside class="side${col ? " collapsed" : ""}" aria-label="App navigation">
    <div class="side__top"><a href="#/dashboard" aria-label="ACADEMIX overview">${col ? LOGO.replace("ACADEMIX</span>", "</span>") : LOGO}</a><button class="icon-btn" data-act="collapse" aria-label="${col ? "Expand" : "Collapse"} sidebar">${ic(col ? "panel-left-open" : "panel-left-close")}</button></div>
    <nav>${NAV.map((n) => `<a href="#/${n[0]}" class="${route === n[0] ? "on" : ""}" title="${n[1]}"${route === n[0] ? ' aria-current="page"' : ""}>${ic(n[2])}<span class="lbl">${n[1]}</span></a>`).join("")}</nav>
  </aside>
  <div class="main">
    <header class="apphead glass">
      ${avatar(u)}
      <div class="who"><b>${esc(u.name)}</b><small>${esc(u.inst)} · ${esc(u.dept)} · ${esc(u.level)}${u.session ? " · " + esc(u.session) : ""}</small></div>
      <div class="acts">${Theme.btn()}<button class="btn" data-act="logout" aria-label="Sign out">${ic("log-out")}<span class="hide-m">Sign Out</span></button></div>
    </header>
    <main class="content fade">${inner}</main>
  </div>
  <div class="bmore glass" id="bmore" hidden><nav aria-label="More pages">${moreNav().map((n) => `<a href="#/${n[0]}" class="${route === n[0] ? "on" : ""}"${route === n[0] ? ' aria-current="page"' : ""}>${ic(n[2])}<span>${n[1]}</span></a>`).join("")}<button data-act="logout">${ic("log-out")}<span>Sign Out</span></button></nav></div>
  <nav class="bnav glass" aria-label="Mobile navigation">${BNAV.map((n) => `<a href="#/${n[0]}" class="${route === n[0] ? "on" : ""}"${route === n[0] ? ' aria-current="page"' : ""}>${ic(n[2])}${n[1]}</a>`).join("")}<button class="${moreNav().some((n) => n[0] === route) ? "on" : ""}" data-act="bmore" aria-expanded="false" aria-controls="bmore">${ic("ellipsis")}More</button></nav>
  </div>`;
}

Views.dashboard = (u) => {
  const h = new Date().getHours(), first = esc(u.name.trim().split(/\s+/)[0]);
  const g = h < 12 ? `Good Morning, ${first} ☀️` : h < 17 ? `Good Afternoon, ${first} 👋` : `Good Evening, ${first} 🌙`;
  const S = [["Current CGPA", "award", "/5.00"], ["Semester GPA", "activity", ""], ["Total Credit Units", "book-marked", ""], ["Academic Standing", "graduation-cap", ""]];
  const top = (i) => `<div class="top">${S[i][0]}<span class="ficon${i % 2 ? " alt" : ""}" style="margin:0;width:36px;height:36px">${ic(S[i][1])}</span></div>`;
  const QA = `<div class="card"><h3>Quick actions</h3><div class="qa"><button class="btn" data-act="add-course">${ic("plus")} Add a course</button><a class="btn" href="#/gpa">${ic("calculator")} Open GPA Calculator</a><a class="btn" href="#/courses">${ic("book-open")} Manage courses</a><button class="btn" data-act="sample">${ic("database")} Load sample data</button><a class="btn" href="#/quiz">${ic("list-checks")} Take a Quiz</a><a class="btn" href="#/study">${ic("book-open")} Summarize a PDF</a></div></div>`;
  const lq = quizLast(), LQ = lq ? (() => { const [lbl, cls] = scoreLabel(lq.pct); return `<div class="card"><div class="between"><h3 style="margin:0">Last quiz score</h3><a class="link" href="#/quiz">Quiz history</a></div><div class="goalmini">${pctRing(lq.pct, 96, lbl)}<div><span class="feas ${cls}">${lbl}</span><p><b>${lq.score}/${lq.total}</b> correct · ${esc(lq.doc)}</p><p class="mlabel" style="margin:0">${dateShort(lq.at)} · ${fmtDur(lq.secs)}</p></div></div></div>`; })()
    : `<div class="card"><h3>Last quiz score</h3><p class="muted" style="font-size:14px">No quizzes yet. Upload your notes and test yourself before the exam.</p><a class="btn" href="#/quiz" style="margin-top:12px">${ic("list-checks")} Take a Quiz</a></div>`;
  const l = Data.all();
  if (!l.length) return `<section class="greet"><h1>${g}</h1><p>Add your courses to see your CGPA, or load sample data to explore.</p></section>
  <section class="stats">${S.map((s, i) => `<div class="card stat lift">${top(i)}<div class="val num">—${s[2] ? ` <small>${s[2]}</small>` : ""}</div><a href="#/courses">${ic("plus")} Add your first course</a></div>`).join("")}</section>
  <div class="dgrid"><div class="card ph" style="margin:0"><div class="ficon">${ic("book-open")}</div><h2>No courses yet</h2><p class="muted">Your weighted CGPA appears here once you add a course.</p><div class="btnrow" style="justify-content:center"><button class="btn btn--primary" data-act="add-course">${ic("plus")} Add a course</button><button class="btn" data-act="sample">${ic("database")} Load sample data</button></div></div><div style="display:grid;gap:18px">${LQ}${QA}</div></div>`;
  const cg = G.gpa(l), ks = Data.sems(l), saved = Store.get("dsem:" + me()), sel = ks.includes(saved) ? saved : ks[ks.length - 1];
  const sg = G.gpa(l.filter((c) => semKey(c) === sel)), r = 46, C = 2 * Math.PI * r, nx = G.classes.slice().reverse().find((c) => c[0] > cg.g);
  const recent = l.slice().sort((a, b) => b.created - a.created).slice(0, 5);
  return `<section class="greet"><h1>${g}</h1><p>You're making progress. Here's your academic overview.</p></section>
  <section class="stats">
    <div class="card stat">${top(0)}<svg class="ringsm" viewBox="0 0 112 112" role="img" aria-label="CGPA ${G.f2(cg.g)} out of 5.00"><defs><linearGradient id="rg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--accent)"/><stop offset="1" stop-color="var(--accent2)"/></linearGradient></defs><circle cx="56" cy="56" r="${r}" fill="none" stroke="var(--bg2)" stroke-width="10"/><circle cx="56" cy="56" r="${r}" fill="none" stroke="url(#rg2)" stroke-width="10" stroke-linecap="round" stroke-dasharray="${(C * cg.g) / 5} ${C}" transform="rotate(-90 56 56)"/><text x="56" y="60" text-anchor="middle" font-size="24" font-weight="700">${G.f2(cg.g)}</text><text x="56" y="78" text-anchor="middle" font-size="11" style="fill:var(--text2)">/ 5.00</text></svg><p>Weighted by credit units</p></div>
    <div class="card stat">${top(1)}<div class="val num">${G.f2(sg.g)}</div><select class="input" id="dsem" aria-label="Choose semester">${ks.slice().reverse().map((k) => opt(k, semLabel(k), sel)).join("")}</select></div>
    <div class="card stat">${top(2)}<div class="val num">${cg.u}</div><p>${l.length} courses · ${ks.length} semester${ks.length > 1 ? "s" : ""}</p></div>
    <div class="card stat">${top(3)}<div class="val txt">${G.cls(cg.g)}</div><p>${nx ? `${G.f2(nx[0] - cg.g)} to ${nx[1]} (${nx[0].toFixed(2)})` : "Top class of degree"}</p></div>
  </section>
  <div class="dgrid"><div class="card"><div class="between"><h3 style="margin:0">Recent courses</h3><a class="link" href="#/courses">View all</a></div><ul class="rlist" style="margin-top:8px">${recent.map((c) => `<li>${gb(c.grade)}<span><b>${esc(c.code)}</b> ${esc(c.title)}<small>${c.units} units · ${esc(c.session)} ${esc(c.semester)} Semester</small></span></li>`).join("")}</ul></div><div style="display:grid;gap:18px">${goalGet() ? goalCard(goalGet(), true) : `<div class="card"><h3>No goal yet</h3><p class="muted" style="font-size:14px">Set a target CGPA or class to track it here.</p><a class="btn" href="#/goals" style="margin-top:12px">${ic("target")} Set a goal</a></div>`}${LQ}${QA}</div></div>`;
};

