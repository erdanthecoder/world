/* ============================================================
   ReadWorld — app logic
   Library → Book detail → Kindle-style reader → chapter quizzes
   Progress: localStorage + optional server sync via sync code
   ============================================================ */
(function () {
  "use strict";

  const LIBRARY = window.LIBRARY || [];
  const $ = (id) => document.getElementById(id);

  /* ---------------- State ---------------- */
  const STORE_KEY = "readworld.v1";
  let state = loadState();
  let currentBook = null;      // book object
  let currentChapter = 0;      // chapter index
  let currentPage = 0;         // page within chapter
  let pageCount = 1;
  let quizCtx = null;          // active quiz context
  let filters = { cat: "all", year: "all", search: "" };

  function defaultState() {
    return {
      profile: null,               // { name, syncCode }
      settings: { fontSize: 19, lineHeight: 1.75, font: "serif", theme: "sepia" },
      books: {},                   // bookId -> { chapter, page, quizzes: {chIdx: {score,total}}, finished, lastRead }
      stats: { quizzesTaken: 0, correct: 0, answered: 0, chaptersRead: 0 },
    };
  }
  function loadState() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) return Object.assign(defaultState(), JSON.parse(raw));
    } catch (e) { /* corrupted -> fresh */ }
    return defaultState();
  }
  function saveState() {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    scheduleSyncPush();
  }
  function bookState(id) {
    if (!state.books[id]) state.books[id] = { chapter: 0, page: 0, quizzes: {}, finished: false, lastRead: 0, highlights: [], writings: {} };
    if (!state.books[id].highlights) state.books[id].highlights = [];
    if (!state.books[id].writings) state.books[id].writings = {};
    return state.books[id];
  }

  /* ---------------- Server sync ---------------- */
  let syncTimer = null;
  function scheduleSyncPush() {
    if (!state.profile || !state.profile.syncCode) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(pushSync, 1500);
  }
  async function pushSync() {
    if (!state.profile || !state.profile.syncCode) return;
    try {
      await fetch("/api/sync/" + state.profile.syncCode, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });
    } catch (e) { /* offline is fine — localStorage is the source of truth */ }
  }
  async function pullSync(code) {
    const res = await fetch("/api/sync/" + encodeURIComponent(code));
    if (!res.ok) throw new Error("not found");
    const data = await res.json();
    return data.data;
  }
  function makeSyncCode() {
    const abc = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    let s = "";
    for (let i = 0; i < 6; i++) s += abc[Math.floor(Math.random() * abc.length)];
    return s;
  }

  /* ---------------- Helpers ---------------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.remove("hidden");
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.add("hidden"), 2400);
  }
  function show(screenId) {
    ["welcome-screen", "library-screen", "detail-screen", "reader-screen"].forEach((s) =>
      $(s).classList.toggle("hidden", s !== screenId)
    );
    window.scrollTo(0, 0);
  }
  function bookById(id) { return LIBRARY.find((b) => b.id === id); }
  function bookWords(b) { return b.chapters.reduce((n, c) => n + c.paragraphs.join(" ").split(/\s+/).length, 0); }
  function bookProgressPct(b) {
    const st = state.books[b.id];
    if (!st) return 0;
    if (st.finished) return 100;
    return Math.round(((st.chapter + (st.page + 1) / Math.max(st.pages || 20, 1)) / b.chapters.length) * 100);
  }
  const CAT_LABEL = { science: "Science", maths: "Maths", fiction: "Story" };
  const CAT_LABEL_RU = { science: "Наука", maths: "Математика", fiction: "Классика" };
  const LANG_LABEL = { en: "English", ru: "Русский" };

  // Small monoline SVG icons (currentColor). Kept inline to stay dependency-free.
  const ICON = {
    play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.52.85l10.5-6.5a1 1 0 0 0 0-1.7L9.52 4.65A1 1 0 0 0 8 5.5Z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 6.5"/></svg>',
    award: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="9" r="6"/><path d="M8.4 14.3 7 22l5-2.8L17 22l-1.4-7.7"/></svg>',
  };
  function starRow(filled, total) {
    let s = "";
    for (let i = 0; i < total; i++) {
      const on = i < filled;
      s += `<svg class="star ${on ? "on" : "off"}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.6 9.3l5.8-.8L12 3.2Z"/></svg>`;
    }
    return `<div class="quiz-stars" role="img" aria-label="${filled} of ${total} stars">${s}</div>`;
  }

  /* ============================================================
     WELCOME
     ============================================================ */
  function initWelcome() {
    $("btn-start").addEventListener("click", () => {
      const name = $("profile-name").value.trim();
      if (!name) { $("profile-name").focus(); return; }
      state.profile = { name, syncCode: makeSyncCode() };
      saveState();
      renderLibrary();
      show("library-screen");
      toast("Welcome, " + name);
    });
    $("profile-name").addEventListener("keydown", (e) => { if (e.key === "Enter") $("btn-start").click(); });
    $("btn-restore").addEventListener("click", () => openRestoreModal());
  }

  /* ============================================================
     LIBRARY
     ============================================================ */
  function shelfDefs() {
    // Each book appears in exactly one subject shelf (no duplication); the
    // per-card length chip carries the Quick/Short/Long signal instead.
    return [
      { key: "continue", home: true, title: "Continue reading", match: (b) => { const s = state.books[b.id]; return s && s.lastRead && !s.finished; } },
      { key: "en-fiction", title: "Stories — English", sub: "adventures & classics", match: (b) => b.lang === "en" && b.category === "fiction" },
      { key: "ru-fiction", title: "Русская классика", sub: "4–9 класс", match: (b) => b.lang === "ru" && b.category === "fiction" },
      { key: "en-science", title: "Science — English", sub: "Year 9", match: (b) => b.lang === "en" && b.category === "science" },
      { key: "en-maths", title: "Maths — English", sub: "Year 9", match: (b) => b.lang === "en" && b.category === "maths" },
      { key: "ru-edu", title: "Наука и математика", sub: "9 класс", match: (b) => b.lang === "ru" && b.category !== "fiction" },
    ];
  }
  function passesFilters(b) {
    if (filters.cat === "en" && b.lang !== "en") return false;
    if (filters.cat === "ru" && b.lang !== "ru") return false;
    if (["science", "maths", "fiction"].includes(filters.cat) && b.category !== filters.cat) return false;
    if (filters.cat === "continue") { const s = state.books[b.id]; if (!(s && s.lastRead)) return false; }
    if (filters.year !== "all" && String(b.year) !== String(filters.year)) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!(b.title + " " + b.author + " " + (b.description || "")).toLowerCase().includes(q)) return false;
    }
    return true;
  }
  const COVER_STYLES = ["classic", "bold", "band", "framed"];
  function coverStyle(b) {
    if (b.cover.style) return b.cover.style;
    let h = 0; for (const c of b.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return COVER_STYLES[h % COVER_STYLES.length];
  }
  function coverHTML(b, extraStyle) {
    const ru = b.lang === "ru";
    const K = esc((ru ? CAT_LABEL_RU[b.category] : CAT_LABEL[b.category]) + " · " + (ru ? b.year + " кл." : "Year " + b.year));
    const T = esc(b.title), A = esc(b.author);
    const initial = esc((b.title.match(/[A-Za-zА-Яа-яЁё]/) || ["R"])[0].toUpperCase());
    const style = coverStyle(b);
    let inner;
    if (style === "bold") {
      inner = `<div class="cover-watermark big" aria-hidden="true">${initial}</div>
        <div class="cover-body bold">
          <div class="cover-kicker">${K}</div>
          <div class="cover-boldwrap"><div class="cover-title">${T}</div><div class="cover-author">${A}</div></div>
          <div class="cover-imprint">ReadWorld</div>
        </div>`;
    } else if (style === "band") {
      inner = `<div class="cover-band">
          <div class="cover-band-top"><span class="cover-kicker">${K}</span></div>
          <div class="cover-band-mid"><div class="cover-title">${T}</div><div class="cover-author">${A}</div></div>
          <div class="cover-band-bot"><span class="cover-imprint">ReadWorld</span></div>
        </div>`;
    } else if (style === "framed") {
      inner = `<div class="cover-frame" aria-hidden="true"></div>
        <div class="cover-body framed">
          <div class="cover-kicker">${K}</div>
          <div class="cover-heading">
            <span class="cover-orn"></span>
            <span class="cover-title">${T}</span>
            <span class="cover-author">${A}</span>
            <span class="cover-orn"></span>
          </div>
          <div class="cover-imprint">ReadWorld</div>
        </div>`;
    } else {
      inner = `<div class="cover-watermark" aria-hidden="true">${initial}</div>
        <div class="cover-body">
          <div class="cover-kicker">${K}</div>
          <div class="cover-heading">
            <span class="cover-rule"></span>
            <span class="cover-title">${T}</span>
            <span class="cover-author">${A}</span>
            <span class="cover-rule"></span>
          </div>
          <div class="cover-imprint">ReadWorld</div>
        </div>`;
    }
    return `<div class="book-cover cs-${style} cat-${b.category}" style="--c1:${b.cover.c1};--c2:${b.cover.c2};${extraStyle || ""}">
      <div class="cover-texture" aria-hidden="true"></div>
      <div class="cover-sheen" aria-hidden="true"></div>
      <div class="cover-spine"></div>
      ${inner}
    </div>`;
  }
  function bookPages(b) { return Math.max(2, Math.round(bookWords(b) / 160)); }
  function bookMinutes(b) { return Math.max(1, Math.round(bookWords(b) / 200)); }
  function lengthTag(b) { const p = bookPages(b); return p < 10 ? "Quick read" : p < 22 ? "Short read" : "Long read"; }
  function levelFromXp(xp) { return Math.floor((xp || 0) / 200) + 1; }
  function todayKey() { const d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function touchStreak() {
    const s = state.stats;
    const t = todayKey();
    if (s.lastDay === t) return;
    const y = new Date(); y.setDate(y.getDate() - 1);
    const yKey = y.getFullYear() + "-" + (y.getMonth() + 1) + "-" + y.getDate();
    s.streak = s.lastDay === yKey ? (s.streak || 0) + 1 : 1;
    s.lastDay = t;
    saveState();
  }
  function statsStripHTML() {
    const s = state.stats;
    const finished = Object.values(state.books).filter((b) => b.finished).length;
    const acc = s.answered ? Math.round((s.correct / s.answered) * 100) : 0;
    const lvl = levelFromXp(s.xp);
    const ru = false;
    const pill = (icon, val, label, cls) => `<div class="stat-pill ${cls}"><span class="stat-ic">${icon}</span><span class="stat-txt"><span class="stat-val">${val}</span><span class="stat-lbl">${label}</span></span></div>`;
    const flame = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2s5 3.6 5 8.5a5 5 0 0 1-10 0c0-1.8.8-3 1.7-3.9C8.7 8 9 9.4 10 9.9 10 7 10.4 4.6 12 2Z"/></svg>';
    const bolt = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/></svg>';
    const bookI = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h11a1 1 0 0 1 1 1v15H6a1 1 0 0 1-1-1V4Z"/><path d="M17 4h1a1 1 0 0 1 1 1v14"/><path d="M9 8h5"/></svg>';
    const target = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.4"/></svg>';
    return `<div class="stats-row">
      ${pill(flame, (s.streak || 0), "day streak", "sp-streak")}
      ${pill(bolt, "Lv " + lvl, (s.xp || 0) + " XP", "sp-level")}
      ${pill(bookI, finished, "finished", "sp-books")}
      ${pill(target, acc + "%", "quiz score", "sp-acc")}
    </div>`;
  }
  function heroHTML(b) {
    const pct = bookProgressPct(b);
    const st = state.books[b.id];
    return `<section class="home-hero">
      <div class="hero-cover">${coverHTML(b)}</div>
      <div class="hero-body">
        <div class="hero-eyebrow">Continue reading</div>
        <h2 class="hero-title">${esc(b.title)}</h2>
        <div class="hero-author">${esc(b.author)}</div>
        <div class="hero-progress">
          <div class="hero-bar"><div class="hero-bar-fill" style="width:${pct}%"></div></div>
          <div class="hero-meta">Chapter ${Math.min((st.chapter || 0) + 1, b.chapters.length)} of ${b.chapters.length} · ${pct}%</div>
        </div>
        <button class="btn btn-primary btn-icon hero-resume" data-id="${b.id}"><i class="ic-play">${ICON.play}</i>Resume</button>
      </div>
    </section>`;
  }
  function renderLibrary() {
    $("lib-greeting").textContent = state.profile ? `Hi ${state.profile.name} · Привет!` : "";
    const shelves = $("lib-shelves");
    shelves.innerHTML = "";
    const defaultView = filters.cat === "all" && filters.year === "all" && !filters.search;

    // Home hero + stats on the default view
    if (state.profile && defaultView) {
      const inProgress = LIBRARY
        .filter((b) => { const s = state.books[b.id]; return s && s.lastRead && !s.finished; })
        .sort((a, b2) => (state.books[b2.id].lastRead || 0) - (state.books[a.id].lastRead || 0));
      const head = document.createElement("div");
      head.className = "home-head";
      head.innerHTML = (inProgress.length ? heroHTML(inProgress[0]) : "") + statsStripHTML();
      shelves.appendChild(head);
      const resume = head.querySelector(".hero-resume");
      if (resume) resume.addEventListener("click", () => openReader(resume.dataset.id));
    }

    let shown = 0, shelfIdx = 0;
    shelfDefs().forEach((def) => {
      if (def.home && !defaultView) return;   // length/continue rows only on the home view
      const books = LIBRARY.filter((b) => def.match(b) && passesFilters(b));
      if (!books.length) return;
      if (def.key === "continue") books.sort((a, b2) => (state.books[b2.id].lastRead || 0) - (state.books[a.id].lastRead || 0));
      else if (def.key === "long") books.sort((a, b2) => bookPages(b2) - bookPages(a));
      shown += books.length;
      const shelf = document.createElement("section");
      shelf.className = "shelf";
      shelf.style.animationDelay = (shelfIdx++ * 60) + "ms";
      shelf.innerHTML = `<div class="shelf-title"><span class="shelf-accent"></span>${def.title}${def.sub ? ` <span class="shelf-sub">${def.sub}</span>` : ""} <span class="shelf-count">${books.length} book${books.length > 1 ? "s" : ""}</span></div><div class="shelf-grid"></div>`;
      const grid = shelf.querySelector(".shelf-grid");
      books.forEach((b) => {
        const pct = bookProgressPct(b);
        const card = document.createElement("button");
        card.className = "book-card";
        card.innerHTML = `${coverHTML(b)}
          <div class="book-meta-line"><span class="book-name">${esc(b.title)}</span></div>
          ${pct > 0 ? `<div class="book-bar"><div class="book-bar-fill" style="width:${pct}%"></div></div><span class="book-progress-txt">${pct >= 100 ? "Finished" : pct + "% read"}</span>` : `<span class="book-progress-txt"><span class="len-chip len-${lengthTag(b).split(" ")[0].toLowerCase()}">${lengthTag(b)}</span>${bookPages(b)} pp · ${b.chapters.length} ch</span>`}`;
        card.addEventListener("click", () => openDetail(b.id));
        grid.appendChild(card);
      });
      shelves.appendChild(shelf);
    });
    if (!shown) shelves.innerHTML = `<div class="lib-empty">No books match — try another filter.<br>Книги не найдены — попробуй другой фильтр.</div>`;
  }
  function initLibrary() {
    $("lib-filters").addEventListener("click", (e) => {
      const chip = e.target.closest(".chip"); if (!chip) return;
      $("lib-filters").querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      filters.cat = chip.dataset.filter;
      renderLibrary();
    });
    $("lib-years").addEventListener("click", (e) => {
      const chip = e.target.closest(".chip"); if (!chip) return;
      $("lib-years").querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      filters.year = chip.dataset.year;
      renderLibrary();
    });
    $("lib-search").addEventListener("input", (e) => { filters.search = e.target.value.trim(); renderLibrary(); });
    $("btn-sync").addEventListener("click", openSyncModal);
    $("btn-stats").addEventListener("click", openStatsModal);
    $("btn-profile").addEventListener("click", openProfileModal);
  }

  /* ============================================================
     DETAIL
     ============================================================ */
  function openDetail(id) {
    const b = bookById(id);
    const st = state.books[id];
    const started = st && st.lastRead;
    const card = $("detail-card");
    card.innerHTML = `
      <div class="detail-cover">${coverHTML(b)}</div>
      <div class="detail-info">
        <h2>${esc(b.title)}</h2>
        <div class="detail-author">${esc(b.author)}</div>
        <div class="detail-tags">
          <span class="tag">${LANG_LABEL[b.lang]}</span>
          <span class="tag">${b.lang === "ru" ? CAT_LABEL_RU[b.category] : CAT_LABEL[b.category]}</span>
          <span class="tag">${b.lang === "ru" ? b.year + " класс" : "Year " + b.year}</span>
          <span class="tag">${b.chapters.length} chapters</span>
          <span class="tag">~${bookPages(b)} pages</span>
          <span class="tag">~${bookMinutes(b)} min</span>
          <span class="tag tag-len">${lengthTag(b)}</span>
        </div>
        <p class="detail-desc">${esc(b.description)}</p>
        <div class="detail-actions">
          <button class="btn btn-primary btn-icon" id="btn-read"><i class="ic-play">${ICON.play}</i>${started ? "Continue reading" : "Start reading"}</button>
          ${started ? '<button class="btn btn-ghost" id="btn-restart">Start over</button>' : ""}
        </div>
      </div>
      <div class="detail-chapters"><h3>Chapters · Главы <span class="dch-count">${b.chapters.length}</span></h3>
        ${b.chapters.map((c, i) => {
          const q = st && st.quizzes && st.quizzes[i];
          const hasQ = chapterHasQuiz(c);
          const state2 = q ? "Quiz " + q.score + "/" + q.total : (hasQ ? c.quiz.length + " questions" : (c.writing ? "writing" : "read"));
          return `<button class="dchap" data-ch="${i}"><span>${i + 1}. ${esc(c.title)}</span>
            <span class="dchap-state ${q ? "done" : ""}">${state2}</span></button>`;
        }).join("")}
      </div>`;
    card.querySelector("#btn-read").addEventListener("click", () => openReader(b.id));
    const restart = card.querySelector("#btn-restart");
    if (restart) restart.addEventListener("click", () => {
      state.books[b.id] = { chapter: 0, page: 0, quizzes: {}, finished: false, lastRead: Date.now() };
      saveState(); openReader(b.id);
    });
    card.querySelectorAll(".dchap").forEach((el) =>
      el.addEventListener("click", () => openReader(b.id, parseInt(el.dataset.ch, 10)))
    );
    show("detail-screen");
  }

  /* ============================================================
     READER — Kindle-style pagination via CSS columns
     ============================================================ */
  function openReader(id, chapterIdx) {
    currentBook = bookById(id);
    const st = bookState(id);
    currentChapter = typeof chapterIdx === "number" ? chapterIdx : Math.min(st.chapter, currentBook.chapters.length - 1);
    currentPage = typeof chapterIdx === "number" ? 0 : st.page || 0;
    st.lastRead = Date.now();
    touchStreak();
    applyReaderSettings();
    renderChapter();
    show("reader-screen");
    saveState();
  }

  function chapterHasQuiz(ch) { return !!(ch.quiz && ch.quiz.length); }
  function renderChapter() {
    const b = currentBook;
    const ch = b.chapters[currentChapter];
    const st = bookState(b.id);
    const hasQuiz = chapterHasQuiz(ch);
    const quizDone = st.quizzes[currentChapter];
    const needsQuiz = hasQuiz && !quizDone;
    const pendingWriting = !needsQuiz && ch.writing && !st.writings[currentChapter];
    const isLast = currentChapter === b.chapters.length - 1;
    const ru = b.lang === "ru";
    let btnLabel;
    if (needsQuiz) btnLabel = ru ? "Ответить на вопросы" : "Answer the questions";
    else if (pendingWriting) btnLabel = ru ? "Письменное задание" : "Writing task";
    else btnLabel = isLast ? (ru ? "Закончить книгу" : "Finish book") : (ru ? "Следующая глава" : "Next chapter");
    // Note under the button varies with the chapter (not always "answer the questions").
    let note;
    if (quizDone) note = `${ru ? "Результат" : "Quiz"}: ${quizDone.score}/${quizDone.total}${ch.writing ? " &nbsp;·&nbsp; " + (st.writings[currentChapter] ? (ru ? "письмо ✓" : "writing done") : (ru ? "письмо ждёт" : "writing to do")) : ""} &nbsp;·&nbsp; <a href="#" id="retake-quiz">${ru ? "пройти заново" : "retake"}</a>`;
    else if (needsQuiz) note = ru ? "Ответь на вопросы, чтобы продолжить" : "Answer the questions to continue";
    else if (pendingWriting) note = ru ? "Небольшое письменное задание" : "A short writing task";
    else note = isLast ? (ru ? "Конец книги" : "The end") : (ru ? "Конец главы" : "End of chapter");
    const content = $("reader-content");
    content.innerHTML =
      `<div class="chap-book">${esc(b.title)}</div>` +
      `<h2 class="chap-heading">${esc(ch.title)}</h2>` +
      ch.paragraphs.map((p, pi) => `<p data-pi="${pi}">${renderParagraph(p, pi, st)}</p>`).join("") +
      `<div class="chap-end"><div class="fleuron" aria-hidden="true"><span></span><span class="dot"></span><span></span></div>
        <button class="btn-chap-quiz" id="btn-chap-quiz">${btnLabel}</button>
        <div class="quiz-done-note">${note}</div>
      </div>`;
    $("reader-book-title").textContent = b.title;
    content.querySelector("#btn-chap-quiz").addEventListener("click", () => {
      if (needsQuiz) startQuiz();
      else proceedAfterQuiz();
    });
    const retake = content.querySelector("#retake-quiz");
    if (retake) retake.addEventListener("click", (e) => { e.preventDefault(); startQuiz(); });
    updateNoteCount();
    requestAnimationFrame(() => { paginate(); goToPage(Math.min(currentPage, pageCount - 1), false); });
  }

  /* ---- Highlights & notes ---- */
  // Rebuild a paragraph's HTML, wrapping any saved highlights in <mark>.
  function renderParagraph(raw, pi, st) {
    let hls = (st.highlights || [])
      .filter((h) => h.ch === currentChapter && h.pi === pi && h.start >= 0 && h.start + h.len <= raw.length)
      .sort((a, b) => a.start - b.start);
    if (!hls.length) return esc(raw);
    let out = "", cursor = 0, lastEnd = 0;
    hls.forEach((h) => {
      if (h.start < lastEnd) return;           // skip overlapping highlight
      out += esc(raw.slice(cursor, h.start));
      out += `<mark class="hl${h.note ? " has-note" : ""}" data-hid="${h.id}">${esc(raw.slice(h.start, h.start + h.len))}</mark>`;
      cursor = h.start + h.len; lastEnd = cursor;
    });
    out += esc(raw.slice(cursor));
    return out;
  }
  function totalHighlights(id) { const st = state.books[id]; return st && st.highlights ? st.highlights.length : 0; }
  function updateNoteCount() {
    const n = totalHighlights(currentBook.id);
    const el = $("note-count");
    el.textContent = n;
    el.classList.toggle("hidden", n === 0);
  }

  function paginate() {
    const vp = $("reader-viewport");
    const content = $("reader-content");
    const cs = getComputedStyle(vp);
    const pl = parseFloat(cs.paddingLeft);
    const pr = parseFloat(cs.paddingRight);
    const w = vp.clientWidth - pl - pr;          // width of one page column
    const gap = pl + pr;                          // gap = both side margins, so the
                                                 // next column sits fully offscreen
    content.style.columnWidth = w + "px";
    content.style.columnGap = gap + "px";
    content.style.width = w + "px";
    pageCount = Math.max(1, Math.round((content.scrollWidth + gap) / (w + gap)));
    content._pw = w + gap;                        // per-page translate stride (= viewport width)
  }

  function goToPage(p, animate) {
    const content = $("reader-content");
    currentPage = Math.max(0, Math.min(p, pageCount - 1));
    content.style.transition = animate === false ? "none" : "";
    content.style.transform = `translateX(${-currentPage * content._pw}px)`;
    if (animate === false) requestAnimationFrame(() => (content.style.transition = ""));
    updateReaderMeta();
    const st = bookState(currentBook.id);
    st.chapter = currentChapter;
    st.page = currentPage;
    st.pages = pageCount;
    st.lastRead = Date.now();
    saveState();
  }

  function updateReaderMeta() {
    const b = currentBook;
    $("reader-chapter-label").textContent = `Ch. ${currentChapter + 1}/${b.chapters.length}`;
    $("reader-page-label").textContent = `Page ${currentPage + 1} of ${pageCount}`;
    const pct = Math.round(((currentChapter + (currentPage + 1) / pageCount) / b.chapters.length) * 100);
    $("reader-percent-label").textContent = pct + "%";
    $("reader-progress-fill").style.width = pct + "%";
  }

  function nextPage() {
    if (currentPage < pageCount - 1) { goToPage(currentPage + 1); return; }
    // end of chapter — only gate when this chapter has an unfinished quiz
    const ch = currentBook.chapters[currentChapter];
    const st = bookState(currentBook.id);
    if (chapterHasQuiz(ch) && !st.quizzes[currentChapter]) startQuiz();
    else proceedAfterQuiz();
  }
  function prevPage() {
    if (currentPage > 0) { goToPage(currentPage - 1); return; }
    if (currentChapter > 0) {
      currentChapter -= 1;
      currentPage = 9999; // clamp to last page after pagination
      renderChapter();
    }
  }
  function advanceChapter() {
    const b = currentBook;
    if (currentChapter < b.chapters.length - 1) {
      currentChapter += 1; currentPage = 0;
      renderChapter();
    } else {
      const st = bookState(b.id);
      st.finished = true;
      state.stats.xp = (state.stats.xp || 0) + 100;   // book completion bonus
      saveState();
      openBookFinished();
    }
  }

  function applyReaderSettings() {
    const s = state.settings;
    const content = $("reader-content");
    content.style.fontSize = s.fontSize + "px";
    content.style.lineHeight = s.lineHeight;
    content.classList.toggle("sans", s.font === "sans");
    const scr = $("reader-screen");
    scr.classList.remove("th-light", "th-sepia", "th-dark");
    scr.classList.add("th-" + s.theme);
  }

  function initReader() {
    $("btn-reader-back").addEventListener("click", () => { renderLibrary(); show("library-screen"); });
    // Page turns: tap the left / right third of the page (unless selecting text
    // or tapping a highlight). The middle third is a quiet reading zone.
    const stage = $("reader-stage");
    stage.addEventListener("click", (e) => {
      if (e.target.closest("#sel-toolbar") || e.target.closest("mark.hl")) return;
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed) return;   // user is selecting text
      const rect = stage.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      if (x < 0.32) prevPage(); else if (x > 0.68) nextPage();
    });
    // open a highlight's note when its mark is tapped
    $("reader-content").addEventListener("click", (e) => {
      const mk = e.target.closest("mark.hl"); if (!mk) return;
      e.stopPropagation();
      openHighlightModal(mk.dataset.hid);
    });
    // selection toolbar
    document.addEventListener("selectionchange", onSelectionChange);
    $("sel-toolbar").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-sel]"); if (!btn) return;
      if (btn.dataset.sel === "highlight") commitHighlight("");
      else openNoteEditor(null);
    });
    document.addEventListener("keydown", (e) => {
      if ($("reader-screen").classList.contains("hidden")) return;
      if (!$("quiz-overlay").classList.contains("hidden") || !$("modal-overlay").classList.contains("hidden")) return;
      if (e.key === "ArrowRight") { e.preventDefault(); nextPage(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prevPage(); }
    });
    // swipe
    let sx = null, sy = null;
    stage.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    stage.addEventListener("touchend", (e) => {
      if (sx === null) return;
      const sel = window.getSelection();
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      sx = null;
      if (sel && !sel.isCollapsed) return;          // selecting — don't turn page
      if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx)) return;
      if (dx < 0) nextPage(); else prevPage();
    }, { passive: true });
    window.addEventListener("resize", () => {
      if ($("reader-screen").classList.contains("hidden")) return;
      hideSelToolbar();
      paginate(); goToPage(currentPage, false);
    });
    // TOC
    $("btn-toc").addEventListener("click", openTOC);
    $("toc-backdrop").addEventListener("click", closeTOC);
    // Notes
    $("btn-notes").addEventListener("click", openNotes);
    $("notes-backdrop").addEventListener("click", closeNotes);
    // settings popover
    $("btn-settings").addEventListener("click", () => $("settings-pop").classList.toggle("hidden"));
    document.addEventListener("click", (e) => {
      if (!e.target.closest("#settings-pop") && !e.target.closest("#btn-settings")) $("settings-pop").classList.add("hidden");
    });
    $("settings-pop").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-act]"); if (!btn) return;
      const s = state.settings;
      const act = btn.dataset.act;
      if (act === "font+") s.fontSize = Math.min(28, s.fontSize + 1);
      if (act === "font-") s.fontSize = Math.max(14, s.fontSize - 1);
      if (act === "line+") s.lineHeight = Math.min(2.3, +(s.lineHeight + 0.1).toFixed(2));
      if (act === "line-") s.lineHeight = Math.max(1.3, +(s.lineHeight - 0.1).toFixed(2));
      if (act === "serif") s.font = "serif";
      if (act === "sans") s.font = "sans";
      if (act.startsWith("th-")) s.theme = act.slice(3);
      saveState(); applyReaderSettings();
      paginate(); goToPage(currentPage, false);
    });
  }

  function openTOC() {
    const b = currentBook;
    const st = bookState(b.id);
    $("toc-list").innerHTML = b.chapters.map((c, i) => {
      const q = st.quizzes[i];
      return `<button class="toc-item ${i === currentChapter ? "current" : ""}" data-ch="${i}">
        <span>${i + 1}. ${esc(c.title)}</span>
        <span class="toc-state ${q ? "done" : ""}">${q ? q.score + "/" + q.total : ""}</span></button>`;
    }).join("");
    $("toc-list").querySelectorAll(".toc-item").forEach((el) =>
      el.addEventListener("click", () => { closeTOC(); currentChapter = +el.dataset.ch; currentPage = 0; renderChapter(); })
    );
    closeNotes();
    $("toc-drawer").classList.remove("hidden");
    $("toc-backdrop").classList.remove("hidden");
  }
  function closeTOC() { $("toc-drawer").classList.add("hidden"); $("toc-backdrop").classList.add("hidden"); }

  /* ============================================================
     SELECTION → HIGHLIGHTS & NOTES
     ============================================================ */
  let pendingSel = null;   // { ch, pi, start, len, text }

  function paragraphOf(node) {
    const el = node.nodeType === 3 ? node.parentElement : node;
    return el ? el.closest("p[data-pi]") : null;
  }
  function onSelectionChange() {
    if ($("reader-screen").classList.contains("hidden")) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) { hideSelToolbar(); return; }
    const range = sel.getRangeAt(0);
    const content = $("reader-content");
    if (!content.contains(range.commonAncestorContainer)) { hideSelToolbar(); return; }
    const p = paragraphOf(range.startContainer);
    const p2 = paragraphOf(range.endContainer);
    if (!p || p !== p2) { hideSelToolbar(); return; }   // keep it to one paragraph
    let s = range.toString();
    const lead = s.length - s.trimStart().length;
    const trail = s.length - s.trimEnd().length;
    const text = s.trim();
    if (text.length < 2) { hideSelToolbar(); return; }
    const pre = range.cloneRange();
    pre.selectNodeContents(p);
    pre.setEnd(range.startContainer, range.startOffset);
    const start = pre.toString().length + lead;
    pendingSel = { ch: currentChapter, pi: +p.dataset.pi, start, len: s.length - lead - trail, text };
    showSelToolbar(range.getBoundingClientRect());
  }
  function showSelToolbar(rect) {
    const stage = $("reader-stage");
    const sr = stage.getBoundingClientRect();
    const tb = $("sel-toolbar");
    tb.classList.remove("hidden");
    const tw = tb.offsetWidth, th = tb.offsetHeight;
    let left = rect.left - sr.left + rect.width / 2 - tw / 2;
    left = Math.max(8, Math.min(left, sr.width - tw - 8));
    let top = rect.top - sr.top - th - 10;
    if (top < 6) top = rect.bottom - sr.top + 10;   // flip below if no room above
    tb.style.left = left + "px";
    tb.style.top = top + "px";
  }
  function hideSelToolbar() { $("sel-toolbar").classList.add("hidden"); }

  function commitHighlight(note) {
    if (!pendingSel) return;
    const st = bookState(currentBook.id);
    st.highlights.push({
      id: "h" + Date.now().toString(36) + Math.floor(Math.random() * 1000),
      ch: pendingSel.ch, pi: pendingSel.pi, start: pendingSel.start, len: pendingSel.len,
      text: pendingSel.text, note: note || "", ts: Date.now(),
    });
    saveState();
    pendingSel = null;
    hideSelToolbar();
    window.getSelection().removeAllRanges();
    const keep = currentPage;
    renderChapter();
    requestAnimationFrame(() => goToPage(keep, false));
  }

  function openNoteEditor(existing) {
    const ru = currentBook.lang === "ru";
    const quote = existing ? existing.text : (pendingSel ? pendingSel.text : "");
    openModal(`
      <h3>${existing ? (ru ? "Заметка" : "Edit note") : (ru ? "Новая заметка" : "Add a note")}</h3>
      <blockquote class="note-quote">${esc(quote)}</blockquote>
      <textarea id="note-text" rows="4" placeholder="${ru ? "Запиши свою мысль…" : "Write your thought…"}">${existing ? esc(existing.note) : ""}</textarea>
      <div class="modal-actions">
        ${existing ? `<button class="btn btn-ghost" id="note-del" style="margin-right:auto">${ru ? "Удалить" : "Delete"}</button>` : ""}
        <button class="btn btn-ghost" id="note-cancel">${ru ? "Отмена" : "Cancel"}</button>
        <button class="btn btn-primary" id="note-save">${ru ? "Сохранить" : "Save"}</button>
      </div>`);
    const ta = $("modal-card").querySelector("#note-text");
    ta.focus();
    $("modal-card").querySelector("#note-cancel").addEventListener("click", closeModal);
    $("modal-card").querySelector("#note-save").addEventListener("click", () => {
      const val = ta.value.trim();
      if (existing) {
        existing.note = val; saveState(); closeModal();
        const keep = currentPage; renderChapter(); requestAnimationFrame(() => goToPage(keep, false));
      } else {
        closeModal(); commitHighlight(val);
      }
    });
    const del = $("modal-card").querySelector("#note-del");
    if (del) del.addEventListener("click", () => { closeModal(); removeHighlight(existing.id); });
  }

  function openHighlightModal(hid) {
    const st = bookState(currentBook.id);
    const h = st.highlights.find((x) => x.id === hid);
    if (!h) return;
    const ru = currentBook.lang === "ru";
    openModal(`
      <h3>${ru ? "Выделение" : "Highlight"}</h3>
      <blockquote class="note-quote">${esc(h.text)}</blockquote>
      ${h.note ? `<p class="note-body">${esc(h.note)}</p>` : `<p class="note-empty">${ru ? "Без заметки." : "No note yet."}</p>`}
      <div class="modal-actions">
        <button class="btn btn-ghost" id="hl-del" style="margin-right:auto">${ru ? "Удалить" : "Remove"}</button>
        <button class="btn btn-ghost" id="hl-close">${ru ? "Закрыть" : "Close"}</button>
        <button class="btn btn-primary" id="hl-note">${h.note ? (ru ? "Изменить заметку" : "Edit note") : (ru ? "Добавить заметку" : "Add note")}</button>
      </div>`);
    $("modal-card").querySelector("#hl-close").addEventListener("click", closeModal);
    $("modal-card").querySelector("#hl-del").addEventListener("click", () => { closeModal(); removeHighlight(hid); });
    $("modal-card").querySelector("#hl-note").addEventListener("click", () => { closeModal(); openNoteEditor(h); });
  }

  function removeHighlight(hid) {
    const st = bookState(currentBook.id);
    st.highlights = st.highlights.filter((x) => x.id !== hid);
    saveState();
    if (!$("notes-drawer").classList.contains("hidden")) renderNotesList();
    const keep = currentPage; renderChapter(); requestAnimationFrame(() => goToPage(keep, false));
  }

  function openNotes() { closeTOC(); renderNotesList(); $("notes-drawer").classList.remove("hidden"); $("notes-backdrop").classList.remove("hidden"); }
  function closeNotes() { $("notes-drawer").classList.add("hidden"); $("notes-backdrop").classList.add("hidden"); }
  function renderNotesList() {
    const b = currentBook;
    const st = bookState(b.id);
    const ru = b.lang === "ru";
    const list = $("notes-list");
    const items = st.highlights.slice().sort((a, c) => a.ch - c.ch || a.pi - c.pi || a.start - c.start);
    if (!items.length) {
      list.innerHTML = `<div class="notes-empty">${ru ? "Пока нет выделений. Выдели текст во время чтения, чтобы отметить его или добавить заметку." : "No highlights yet. Select text while reading to highlight it or add a note."}</div>`;
      return;
    }
    list.innerHTML = items.map((h) => `
      <div class="note-item" data-hid="${h.id}" data-ch="${h.ch}">
        <div class="note-item-ch">${ru ? "Глава" : "Chapter"} ${h.ch + 1}</div>
        <blockquote class="note-quote sm">${esc(h.text)}</blockquote>
        ${h.note ? `<div class="note-item-note">${esc(h.note)}</div>` : ""}
        <button class="note-item-del" data-del="${h.id}" aria-label="${ru ? "Удалить" : "Delete"}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>
        </button>
      </div>`).join("");
    list.querySelectorAll(".note-item").forEach((el) => {
      el.addEventListener("click", (e) => {
        if (e.target.closest("[data-del]")) return;
        closeNotes();
        currentChapter = +el.dataset.ch; currentPage = 0; renderChapter();
      });
    });
    list.querySelectorAll("[data-del]").forEach((btn) =>
      btn.addEventListener("click", (e) => { e.stopPropagation(); removeHighlight(btn.dataset.del); })
    );
  }

  /* ============================================================
     QUIZ
     ============================================================ */
  function startQuiz() {
    const b = currentBook;
    const ch = b.chapters[currentChapter];
    quizCtx = { qIdx: 0, score: 0, questions: ch.quiz, answered: false };
    $("quiz-overlay").classList.remove("hidden");
    renderQuizQuestion();
  }
  function renderQuizQuestion() {
    const b = currentBook;
    const ru = b.lang === "ru";
    const ctx = quizCtx;
    const q = ctx.questions[ctx.qIdx];
    const card = $("quiz-card");
    card.innerHTML = `
      <div class="quiz-eyebrow">${ru ? "Проверь себя" : "Check your understanding"}</div>
      <div class="quiz-title">${esc(b.chapters[currentChapter].title)}</div>
      <div class="quiz-progress">${ru ? "Вопрос" : "Question"} ${ctx.qIdx + 1} ${ru ? "из" : "of"} ${ctx.questions.length}</div>
      <div class="quiz-q">${esc(q.q)}</div>
      <div id="quiz-opts">${q.options.map((o, i) => `<button class="quiz-opt" data-i="${i}">${esc(o)}</button>`).join("")}</div>
      <div id="quiz-feedback"></div>
      <div class="quiz-actions"><button class="btn btn-ghost" id="quiz-quit">${ru ? "Вернуться к чтению" : "Back to reading"}</button>
      <button class="btn btn-primary hidden" id="quiz-next">${ctx.qIdx + 1 < ctx.questions.length ? (ru ? "Дальше" : "Next") : (ru ? "Результат" : "See result")}</button></div>`;
    card.querySelectorAll(".quiz-opt").forEach((btn) =>
      btn.addEventListener("click", () => answerQuiz(parseInt(btn.dataset.i, 10)))
    );
    card.querySelector("#quiz-quit").addEventListener("click", closeQuiz);
    card.querySelector("#quiz-next").addEventListener("click", () => {
      ctx.qIdx += 1;
      if (ctx.qIdx < ctx.questions.length) renderQuizQuestion();
      else finishQuiz();
    });
  }
  function answerQuiz(i) {
    const ctx = quizCtx;
    if (ctx.answered) return;
    ctx.answered = true;
    const q = ctx.questions[ctx.qIdx];
    const ru = currentBook.lang === "ru";
    const opts = $("quiz-card").querySelectorAll(".quiz-opt");
    opts.forEach((o) => (o.disabled = true));
    opts[q.a].classList.add("correct");
    const right = i === q.a;
    if (right) ctx.score += 1; else opts[i].classList.add("wrong");
    state.stats.answered += 1;
    if (right) state.stats.correct += 1;
    $("quiz-card").querySelector("#quiz-feedback").innerHTML =
      `<div class="quiz-explain ${right ? "ok" : "no"}"><strong>${right ? (ru ? "Верно." : "Correct.") : (ru ? "Не совсем." : "Not quite.")}</strong> ${esc(q.explain || "")}</div>`;
    $("quiz-card").querySelector("#quiz-next").classList.remove("hidden");
    ctx.answered = false;
    // lock re-answer by disabling buttons (already disabled)
    saveState();
  }
  function finishQuiz() {
    const ctx = quizCtx;
    const b = currentBook;
    const ru = b.lang === "ru";
    const st = bookState(b.id);
    const prev = st.quizzes[currentChapter];
    if (!prev || ctx.score > prev.score) st.quizzes[currentChapter] = { score: ctx.score, total: ctx.questions.length };
    if (!prev) state.stats.chaptersRead += 1;
    state.stats.quizzesTaken += 1;
    state.stats.xp = (state.stats.xp || 0) + ctx.score * 10 + 15;   // reward accuracy + effort
    touchStreak();
    saveState();
    const frac = ctx.score / ctx.questions.length;
    const starCount = frac === 1 ? 3 : frac >= 0.66 ? 2 : frac >= 0.34 ? 1 : 0;
    const tier = frac === 1 ? "gold" : frac >= 0.66 ? "good" : frac >= 0.34 ? "ok" : "low";
    const isLast = currentChapter === b.chapters.length - 1;
    const msg = frac === 1
      ? (ru ? "Идеально! Ты всё понял." : "Perfect! You understood everything.")
      : frac >= 0.66
        ? (ru ? "Отлично! Почти всё верно." : "Great job! Nearly everything right.")
        : (ru ? "Неплохо! Можешь перечитать главу и попробовать ещё раз." : "Good try! You can re-read the chapter and try again.");
    $("quiz-card").innerHTML = `
      <div class="quiz-result">
        <div class="score-ring tier-${tier}" style="--pct:${Math.round(frac * 100)}%"><span class="score-frac">${ctx.score}<small>/${ctx.questions.length}</small></span></div>
        ${starRow(starCount, 3)}
        <p>${msg}</p>
        <div class="quiz-actions" style="justify-content:center">
          <button class="btn btn-ghost" id="qr-reread">${ru ? "Перечитать главу" : "Re-read chapter"}</button>
          <button class="btn btn-ghost" id="qr-retry">${ru ? "Ещё раз" : "Try again"}</button>
          <button class="btn btn-primary" id="qr-continue">${isLast ? (ru ? "Закончить книгу" : "Finish book") : (ru ? "Дальше" : "Continue")}</button>
        </div>
      </div>`;
    $("quiz-card").querySelector("#qr-reread").addEventListener("click", () => { closeQuiz(); goToPage(0); });
    $("quiz-card").querySelector("#qr-retry").addEventListener("click", startQuiz);
    $("quiz-card").querySelector("#qr-continue").addEventListener("click", () => {
      const ch = b.chapters[currentChapter];
      if (ch.writing && !st.writings[currentChapter]) { quizCtx = null; openWriting(); }
      else { closeQuiz(); advanceChapter(); }
    });
  }
  function closeQuiz() { $("quiz-overlay").classList.add("hidden"); quizCtx = null; if (currentBook && !$("reader-screen").classList.contains("hidden")) renderChapter(); }

  /* ============================================================
     WRITING TASK (AI-marked when online)
     ============================================================ */
  function proceedAfterQuiz() {
    const ch = currentBook.chapters[currentChapter];
    const st = bookState(currentBook.id);
    if (ch.writing && !st.writings[currentChapter]) openWriting();
    else advanceChapter();
  }
  function countWords(s) { return (s.trim().match(/\S+/g) || []).length; }
  function openWriting() {
    const b = currentBook;
    const ru = b.lang === "ru";
    const ch = b.chapters[currentChapter];
    const w = ch.writing;
    $("quiz-overlay").classList.remove("hidden");
    const card = $("quiz-card");
    card.innerHTML = `
      <div class="quiz-eyebrow">${ru ? "Письменное задание" : "Writing task"}</div>
      <div class="quiz-title">${esc(ch.title)}</div>
      <p class="writing-prompt">${esc(w.prompt)}</p>
      <textarea id="writing-input" rows="7" placeholder="${ru ? "Напиши свой ответ здесь…" : "Write your answer here…"}"></textarea>
      <div class="writing-meta">
        <span id="writing-count">0 ${ru ? "слов" : "words"}</span>
        <span class="writing-hint">${ru ? "Ответ проверит ИИ-учитель" : "An AI teacher will check your answer"}</span>
      </div>
      <div id="writing-feedback"></div>
      <div class="quiz-actions">
        <button class="btn btn-ghost" id="writing-skip">${ru ? "Пропустить" : "Skip"}</button>
        <button class="btn btn-primary" id="writing-check">${ru ? "Проверить" : "Check my writing"}</button>
      </div>`;
    const ta = card.querySelector("#writing-input");
    ta.focus();
    ta.addEventListener("input", () => {
      card.querySelector("#writing-count").textContent = countWords(ta.value) + " " + (ru ? "слов" : "words");
    });
    card.querySelector("#writing-skip").addEventListener("click", () => { closeQuiz(); advanceChapter(); });
    card.querySelector("#writing-check").addEventListener("click", submitWriting);
  }
  async function submitWriting() {
    const b = currentBook;
    const ru = b.lang === "ru";
    const ch = b.chapters[currentChapter];
    const w = ch.writing;
    const card = $("quiz-card");
    const ta = card.querySelector("#writing-input");
    const answer = ta.value.trim();
    const fb = card.querySelector("#writing-feedback");
    if (countWords(answer) < (w.minWords ? Math.min(w.minWords, 15) : 12)) {
      fb.innerHTML = `<div class="quiz-explain no">${ru ? "Напиши, пожалуйста, чуть больше — хотя бы несколько полных предложений." : "Please write a little more — at least a few full sentences."}</div>`;
      return;
    }
    const checkBtn = card.querySelector("#writing-check");
    checkBtn.disabled = true;
    checkBtn.textContent = ru ? "Проверяю…" : "Checking…";
    fb.innerHTML = `<div class="writing-checking">${ru ? "ИИ-учитель читает твой ответ…" : "The AI teacher is reading your answer…"}</div>`;
    let result = null, offline = false;
    try {
      const res = await fetch("api/check-writing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: w.prompt, guidance: w.guidance || "", response: answer, lang: b.lang }),
      });
      if (res.ok) { result = (await res.json()).result; }
      else { offline = true; }
    } catch (e) { offline = true; }

    const st = bookState(b.id);
    if (result) {
      st.writings[currentChapter] = { response: answer, score: result.score, feedback: result.feedback, ts: Date.now() };
      state.stats.writingsChecked = (state.stats.writingsChecked || 0) + 1;
      saveState();
      const frac = result.score / 5;
      const tier = frac >= 0.9 ? "gold" : frac >= 0.6 ? "good" : frac >= 0.4 ? "ok" : "low";
      fb.innerHTML = `
        <div class="writing-result">
          <div class="score-ring tier-${tier}" style="--pct:${Math.round(frac * 100)}%"><span class="score-frac">${result.score}<small>/5</small></span></div>
          <p class="writing-fb">${esc(result.feedback)}</p>
          ${result.strength ? `<div class="wf-line wf-good"><strong>${ru ? "Хорошо:" : "Strength:"}</strong> ${esc(result.strength)}</div>` : ""}
          ${result.improve ? `<div class="wf-line wf-improve"><strong>${ru ? "Улучшить:" : "To improve:"}</strong> ${esc(result.improve)}</div>` : ""}
        </div>`;
    } else {
      // No AI marker available (static hosting / offline). Save the answer and
      // let the reader self-check against the guidance.
      st.writings[currentChapter] = { response: answer, selfChecked: true, ts: Date.now() };
      saveState();
      fb.innerHTML = `
        <div class="quiz-explain">
          <strong>${ru ? "Твой ответ сохранён." : "Your answer is saved."}</strong>
          ${ru ? "Живую проверку ИИ можно включить в онлайн-версии. А пока сравни свой ответ с подсказкой:" : "Live AI marking runs in the online version. For now, compare your answer with this checklist:"}
          ${w.guidance ? `<div class="wf-line" style="margin-top:8px">${esc(w.guidance)}</div>` : ""}
        </div>`;
    }
    const actions = card.querySelector(".quiz-actions");
    actions.innerHTML = `<button class="btn btn-primary" id="writing-continue">${ru ? "Дальше" : "Continue"}</button>`;
    actions.querySelector("#writing-continue").addEventListener("click", () => { closeQuiz(); advanceChapter(); });
  }

  function openBookFinished() {
    const b = currentBook;
    const st = bookState(b.id);
    const totalQ = Object.values(st.quizzes).reduce((n, q) => n + q.total, 0);
    const totalS = Object.values(st.quizzes).reduce((n, q) => n + q.score, 0);
    openModal(`
      <div class="quiz-result">
        <div class="finish-badge">${ICON.award}</div>
        <h3>${b.lang === "ru" ? "Книга прочитана" : "Book finished"}</h3>
        <p><strong>${esc(b.title)}</strong><br>${b.lang === "ru" ? "Вопросы" : "Quiz score"}: ${totalS}/${totalQ} · ~${Math.round(bookWords(b) / 200)} min of reading</p>
        <div class="quiz-actions" style="justify-content:center">
          <button class="btn btn-primary" id="fin-lib">${b.lang === "ru" ? "В библиотеку" : "Back to library"}</button>
        </div>
      </div>`);
    $("modal-card").querySelector("#fin-lib").addEventListener("click", () => { closeModal(); renderLibrary(); show("library-screen"); });
  }

  /* ============================================================
     MODALS: sync / stats / profile / restore
     ============================================================ */
  function openModal(html) { $("modal-card").innerHTML = html; $("modal-overlay").classList.remove("hidden"); }
  function closeModal() { $("modal-overlay").classList.add("hidden"); }

  function openSyncModal() {
    openModal(`
      <h3>Sync across devices</h3>
      <p>Your reading progress is saved on this device automatically. To continue on another device (tablet, phone, laptop), enter this code there via <em>“Restore my progress”</em>:</p>
      <div class="sync-code-display">${state.profile.syncCode}</div>
      <p>Progress syncs to the server whenever you read, answer questions or change settings.</p>
      <div class="modal-actions">
        <button class="btn btn-ghost" id="m-close">Close</button>
        <button class="btn btn-primary" id="m-push">Sync now</button>
      </div>`);
    $("modal-card").querySelector("#m-close").addEventListener("click", closeModal);
    $("modal-card").querySelector("#m-push").addEventListener("click", async () => {
      await pushSync(); toast("Progress synced"); closeModal();
    });
  }

  function openRestoreModal() {
    openModal(`
      <h3>Restore progress</h3>
      <p>Enter the sync code shown on your other device (Library → Sync):</p>
      <input id="m-code" maxlength="6" placeholder="e.g. K7M2RP" style="text-transform:uppercase;letter-spacing:4px;text-align:center;font-weight:700">
      <div class="modal-actions">
        <button class="btn btn-ghost" id="m-close">Cancel</button>
        <button class="btn btn-primary" id="m-restore">Restore</button>
      </div>`);
    $("modal-card").querySelector("#m-close").addEventListener("click", closeModal);
    $("modal-card").querySelector("#m-restore").addEventListener("click", async () => {
      const code = $("modal-card").querySelector("#m-code").value.trim().toUpperCase();
      if (code.length < 4) return;
      try {
        const data = await pullSync(code);
        state = Object.assign(defaultState(), data);
        if (!state.profile) throw new Error("empty");
        state.profile.syncCode = code;
        localStorage.setItem(STORE_KEY, JSON.stringify(state));
        closeModal(); renderLibrary(); show("library-screen");
        toast("Welcome back, " + state.profile.name + " — progress restored");
      } catch (e) {
        toast("Code not found — check it and try again");
      }
    });
  }

  function openStatsModal() {
    const s = state.stats;
    const finished = Object.values(state.books).filter((b) => b.finished).length;
    const started = Object.values(state.books).filter((b) => b.lastRead).length;
    const acc = s.answered ? Math.round((s.correct / s.answered) * 100) : 0;
    openModal(`
      <h3>${esc(state.profile.name)}'s progress</h3>
      <div class="stat-grid">
        <div class="stat-box"><div class="v">${started}</div><div class="l">Books started</div></div>
        <div class="stat-box"><div class="v">${finished}</div><div class="l">Books finished</div></div>
        <div class="stat-box"><div class="v">${s.chaptersRead}</div><div class="l">Chapters + quizzes</div></div>
        <div class="stat-box"><div class="v">${acc}%</div><div class="l">Quiz accuracy (${s.correct}/${s.answered})</div></div>
      </div>
      <div class="modal-actions"><button class="btn btn-primary" id="m-close">Keep reading</button></div>`);
    $("modal-card").querySelector("#m-close").addEventListener("click", closeModal);
  }

  function openProfileModal() {
    openModal(`
      <h3>Profile</h3>
      <p>Reading as <strong>${esc(state.profile.name)}</strong> · sync code <strong>${state.profile.syncCode}</strong></p>
      <div class="modal-actions">
        <button class="btn btn-ghost" id="m-reset">Switch reader / reset</button>
        <button class="btn btn-primary" id="m-close">Close</button>
      </div>`);
    $("modal-card").querySelector("#m-close").addEventListener("click", closeModal);
    $("modal-card").querySelector("#m-reset").addEventListener("click", () => {
      if (!confirm("Start fresh on this device? (Progress stays on the server under your sync code.)")) return;
      localStorage.removeItem(STORE_KEY);
      location.reload();
    });
  }

  $("modal-overlay").addEventListener("click", (e) => { if (e.target === $("modal-overlay")) closeModal(); });

  /* ============================================================
     BOOT
     ============================================================ */
  initWelcome();
  initLibrary();
  initReader();
  if (state.profile) { renderLibrary(); show("library-screen"); }
  else show("welcome-screen");
})();
