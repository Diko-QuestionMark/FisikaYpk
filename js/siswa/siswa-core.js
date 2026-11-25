/* ==========================================================
   siswa-core.js — Router & Render Halaman Siswa
   Bergantung pada: app.js (Store, NeonDB, esc, fmt, cuplikan, yt, TIPE, TOPIK, TOPIK_LIST, TOPIK_MAP, normalizeTopik, getMateriArt, shell, footer)
   ========================================================== */

const ICON_SEARCH_SISWA = `<svg class="crud-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;

/* -------------------------
   STATE GLOBAL
------------------------- */
let D;        // data aplikasi (dari Store / Neon)
let isCloudSyncing = true;
let run;      // state kuis yang sedang berjalan
let navStack = []; // riwayat halaman untuk tombol ← Kembali yang akurat
let qMateri = '', fTopikMateri = 'Semua';
let qQuiz = '', fTopikQuiz = 'Semua';
let fKelasSiswa = (typeof normalizeKelasLevel === 'function' ? normalizeKelasLevel(localStorage.getItem('fisika_siswa_tingkat')) : 'semua');

function setKelasSiswaFilter(val, target) {
    fKelasSiswa = typeof normalizeKelasLevel === 'function' ? normalizeKelasLevel(val) : 'semua';
    localStorage.setItem('fisika_siswa_tingkat', fKelasSiswa);
    if (target === 'materi') updateMateriList();
    else updateQuizList();
}

/* -------------------------
   NAVIGASI & ROUTER HASH
------------------------- */
function setNav(k) {
    document.querySelectorAll('nav a').forEach(a => {
        const isMatch = a.getAttribute('href') === '#' + k;
        a.classList.toggle('on', isMatch);
        a.classList.toggle('active', isMatch);
    });
}

function route() {
    clearQuizTimer();
    run = null;
    D = Store.get();
    const currentHash = location.hash || '#home';
    const [k = 'home', id] = currentHash.slice(1).split('/');
    const page = k || 'home';

    if (!id) {
        navStack = [currentHash];
    } else if (navStack.length >= 2 && navStack[navStack.length - 2] === currentHash) {
        navStack.pop();
    } else if (navStack[navStack.length - 1] !== currentHash) {
        navStack.push(currentHash);
    }

    setNav(page);
    scrollTo(0, 0);
    ({ home, materi, quiz }[page] || home)(id);
}

function goBack() {
    if (navStack.length >= 2) {
        navStack.pop();
        location.hash = navStack[navStack.length - 1];
        return;
    }
    const [k = 'home'] = (location.hash || '#home').slice(1).split('/');
    location.hash = k === 'materi' ? '#materi' : (k === 'quiz' ? '#quiz' : '#home');
}

/* -------------------------
   UTILITAS RENDER
------------------------- */
function wrapMain() {
    const m = document.querySelector('main');
    m.style.padding = '';
    m.style.background = '';
    m.innerHTML = '<div class="wrap" id="app"></div>';
    return document.getElementById('app');
}

function getExternalQuizVisual(link) {
    const u = String(link || "").toLowerCase();
    if (u.includes("docs.google.com/forms") || u.includes("forms.gle")) {
        return {
            label: "Google Forms",
            bg: "#f3e8ff",
            color: "#7c3aed",
            svg: `<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="8.5" cy="12.5" r="0.8" fill="currentColor"/><line x1="11" y1="12.5" x2="16" y2="12.5"/><circle cx="8.5" cy="16" r="0.8" fill="currentColor"/><line x1="11" y1="16" x2="16" y2="16"/></svg>`
        };
    }
    if (u.includes("quizizz.com") || u.includes("wayground.com")) {
        return {
            label: "Quizizz",
            bg: "#fae8ff",
            color: "#8854c0",
            svg: `<svg width="21" height="21" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor" opacity="0.14"/><text x="12" y="16.5" text-anchor="middle" font-size="14" font-weight="800" fill="currentColor" font-family="Plus Jakarta Sans, system-ui, sans-serif">Q</text></svg>`
        };
    }
    if (u.includes("kahoot.it") || u.includes("kahoot.com")) {
        return {
            label: "Kahoot!",
            bg: "#ede9fe",
            color: "#46178f",
            svg: `<svg width="21" height="21" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor" opacity="0.14"/><text x="12" y="16.5" text-anchor="middle" font-size="13.5" font-weight="800" fill="currentColor" font-family="Plus Jakarta Sans, system-ui, sans-serif">K!</text></svg>`
        };
    }
    return {
        label: "Eksternal",
        bg: "#f1f5f9",
        color: "#475569",
        svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`
    };
}

function getQuizTopicIcon(topik) {
    const raw = String(topik || '').toLowerCase().trim();
    let key = typeof normalizeTopik === 'function' ? normalizeTopik(raw) : 'umum';
    if (key === 'umum' && raw.includes('energi')) key = 'energi';

    const map = {
        pengukuran: {
            bg: '#e4f1ff',
            color: '#0284c7',
            svg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/></svg>`
        },
        energi: {
            bg: '#e1f6ea',
            color: '#16a34a',
            svg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`
        },
        pemanasan: {
            bg: '#fff1e1',
            color: '#ea580c',
            svg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/><path d="M12 14v-4"/></svg>`
        },
        umum: {
            bg: 'var(--primary-soft)',
            color: 'var(--primary)',
            svg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1.5" fill="currentColor"/><ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(30 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(-30 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(90 12 12)"/></svg>`
        }
    };
    return map[key] || map.umum;
}

function skeletonCards(count = 3) {
    return `<div class="grid">${Array.from({ length: count }, () => `
        <div class="card sk-card" aria-hidden="true">
            <div class="sk-box sk-img"></div>
            <div class="sk-body">
                <div class="sk-box sk-title"></div>
                <div class="sk-box sk-line"></div>
                <div class="sk-box sk-line short"></div>
                <div class="sk-box sk-cta"></div>
            </div>
        </div>
    `).join('')}</div>`;
}

function cards(l, t, emptyMsg) {
    if (!l.length)
        return `<div class="empty">${emptyMsg || (t === 'm' ? 'Tidak ada materi' : 'Tidak ada kuis')}</div>`;

    return `<div class="grid">${l.map(x => {
        if (t === 'm') {
            const preview = x.ringkasan || cuplikan(x.isi) || 'Klik untuk membaca materi selengkapnya.';
            const art = getMateriArt(x);
            return `<div class="card card-materi clickable" onclick="location.hash='#materi/${x.id}'">
                <div class="art art-${art.topik}${art.isDefault ? ' default' : ''}">
                    <img src="${esc(art.src)}" alt="${esc(x.judul)}" class="${art.isDefault ? 'is-default' : 'is-custom'}" loading="lazy" />
                </div>
                <div class="card-materi-body">
                    <h3>${esc(x.judul)}</h3>
                    <p>${esc(preview)}</p>
                    <span class="card-action">Buka materi →</span>
                </div>
            </div>`;
        }
        const handler = x.tipe === 'native'
            ? `location.hash='#quiz/${x.id}'`
            : `window.open('${esc(x.link)}','_blank')`;
        const isNative = x.tipe === 'native';
        const soalCount = isNative && Array.isArray(x.soal) ? x.soal.length : 0;
        const estMenit = x.durasi !== undefined ? (x.durasi || 'Bebas') : Math.max(5, Math.round(soalCount * 1.5));
        const extVis = !isNative ? getExternalQuizVisual(x.link) : null;
        const icon = isNative ? getQuizTopicIcon(x.topik) : extVis;
        const linkedMateri = (D.materi || []).find(m => m.quizId === x.id && m.gambar && String(m.gambar).trim());
        const bannerInner = linkedMateri
            ? `<img src="${esc(String(linkedMateri.gambar).trim())}" alt="${esc(x.judul)}" loading="lazy" />
               <div class="quiz-banner-shade"></div>`
            : `<div class="quiz-banner-icon" style="color:${icon.color}">${icon.svg}</div>`;

        const chipsHtml = isNative
            ? `<span class="quiz-chip">📝 ${soalCount} soal</span>
               <span class="quiz-chip">⏱ ${estMenit === 'Bebas' ? 'Tanpa batas' : estMenit + ' menit'}</span>`
            : `<span class="quiz-chip">🌐 ${esc(extVis.label)}</span>
               <span class="quiz-chip">Online</span>`;

        const startLabel = isNative ? 'Kerjakan →' : 'Buka ↗';

        return `<div class="card card-quiz clickable" onclick="${handler}">
            <div class="quiz-banner${linkedMateri ? ' has-img' : ''}" style="--qb-bg:${icon.bg};--qb-color:${icon.color}">
                ${bannerInner}
                
            </div>
            <div class="card-materi-body">
                <h3 class="quiz-card-title">${esc(x.judul)}</h3>
                <div class="quiz-chips">${chipsHtml}</div>
                <span class="quiz-start-btn">${startLabel}</span>
            </div>
        </div>`;
    }).join('')}</div>`;
}

/* -------------------------
   FILTER & PENCARIAN SISWA
------------------------- */
const isPublishedItem = x => !!(x && x.published !== false);

function getFilteredMateri() {
    const q = qMateri.toLowerCase().trim();
    return (D.materi || []).filter(x => {
        if (!isPublishedItem(x)) return false;
        if (typeof matchKelasFilter === 'function' && !matchKelasFilter(x.kelas, fKelasSiswa)) return false;
        const topikId = normalizeTopik(x.topik);
        if (fTopikMateri !== 'Semua' && topikId !== fTopikMateri) return false;
        if (!q) return true;
        const hay = `${x.judul || ''} ${x.ringkasan || ''} ${TOPIK_MAP[topikId] || ''}`.toLowerCase();
        return hay.includes(q);
    });
}

function updateMateriList() {
    const el = document.getElementById('materi_list');
    if (!el) return;
    const list = getFilteredMateri();
    const emptyMsg = qMateri.trim() || fTopikMateri !== 'Semua'
        ? 'Tidak ditemukan materi yang sesuai dengan pencarian atau filter.'
        : 'Belum ada materi.';
    el.innerHTML = isCloudSyncing ? skeletonCards(3) : cards(list, 'm', emptyMsg);
}

function getFilteredQuiz() {
    const q = qQuiz.toLowerCase().trim();
    return (D.quiz || []).filter(x => {
        if (!isPublishedItem(x)) return false;
        if (typeof matchKelasFilter === 'function' && !matchKelasFilter(x.kelas, fKelasSiswa)) return false;
        const topik = x.topik || 'Umum';
        if (fTopikQuiz !== 'Semua' && topik !== fTopikQuiz) return false;
        if (!q) return true;
        const hay = `${x.judul || ''} ${x.deskripsi || ''} ${topik}`.toLowerCase();
        return hay.includes(q);
    });
}

function updateQuizList() {
    const el = document.getElementById('quiz_list');
    if (!el) return;
    const list = getFilteredQuiz();
    const emptyMsg = qQuiz.trim() || fTopikQuiz !== 'Semua'
        ? 'Tidak ditemukan kuis yang sesuai dengan pencarian atau filter.'
        : 'Belum ada kuis.';
    el.innerHTML = isCloudSyncing ? skeletonCards(3) : cards(list, 'q', emptyMsg);
}

/* -------------------------
   HALAMAN HOME
------------------------- */
function home() {
    const m = document.querySelector('main');
    m.style.padding = '0';
    m.style.background = '';

    const materiWithCover = [...(D.materi || [])]
        .reverse()
        .filter(x => isPublishedItem(x) && x.gambar && String(x.gambar).trim())
        .slice(0, 3);

    const quizWithCover = [...(D.quiz || [])]
        .reverse()
        .filter(q =>
            isPublishedItem(q) && (
                (q.gambar && String(q.gambar).trim()) ||
                (D.materi || []).some(x => isPublishedItem(x) && x.quizId === q.id && x.gambar && String(x.gambar).trim())
            )
        )
        .slice(0, 3);

    m.innerHTML = `
        <section class="hero">
            <div class="wrap">
                ${isCloudSyncing
                    ? `<div class="sk-hero-title"></div>
                       <div class="sk-hero-sub"></div>
                       <div class="sk-hero-sub short"></div>
                       <div class="sk-hero-btn"></div>`
                    : `<h1>${esc(D.site.tagline)}</h1>
                       <p>${esc(D.site.deskripsi)}</p>
                       <a class="btn" href="#materi">Mulai belajar</a>`
                }
            </div>
        </section>
        <div class="wrap" style="padding:28px 16px 16px">
            <h2 style="margin:0 0 14px">Materi terbaru</h2>
            ${isCloudSyncing ? skeletonCards(3) : cards(materiWithCover, 'm')}
        </div>
        <div class="wrap" style="padding:16px 16px 48px">
            <h2 style="margin:0 0 14px">Quiz terbaru</h2>
            ${isCloudSyncing ? skeletonCards(3) : cards(quizWithCover, 'q')}
        </div>`;
}

/* -------------------------
   HALAMAN MATERI (LIST & DETAIL)
------------------------- */
function materi(id) {
    const a = wrapMain();
    const m = (D.materi || []).find(x => x.id === id && isPublishedItem(x));

    if (!m) {
        const topikOpts = (typeof TOPIK_LIST !== 'undefined' ? TOPIK_LIST : [])
            .map(t => `<option value="${esc(t.id)}" ${fTopikMateri === t.id ? 'selected' : ''}>${esc(t.label)}</option>`)
            .join('');
        const kelasOpts = (typeof KELAS_LEVEL_LIST !== 'undefined' ? KELAS_LEVEL_LIST : [])
            .map(k => `<option value="${esc(k.id)}" ${fKelasSiswa === k.id ? 'selected' : ''}>${esc(k.label)}</option>`)
            .join('');

        a.innerHTML = `
            <div class="crud-header" style="margin-bottom:18px;gap:10px">
                <div class="crud-search-wrap">
                    ${ICON_SEARCH_SISWA}
                    <input type="text" class="crud-search-input" value="${esc(qMateri)}" placeholder="Cari materi fisika..." oninput="qMateri=this.value;updateMateriList()" />
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap">
                    <select onchange="setKelasSiswaFilter(this.value,'materi')" style="width:auto;padding:10px 14px;border-radius:12px;font-size:13.5px;font-weight:600;background:var(--surface);border:1.5px solid var(--border);cursor:pointer">
                        ${kelasOpts}
                    </select>
                    <select onchange="fTopikMateri=this.value;updateMateriList()" style="width:auto;padding:10px 14px;border-radius:12px;font-size:13.5px;font-weight:600;background:var(--surface);border:1.5px solid var(--border);cursor:pointer">
                        <option value="Semua" ${fTopikMateri === 'Semua' ? 'selected' : ''}>Semua Topik</option>
                        ${topikOpts}
                    </select>
                </div>
            </div>
            <div id="materi_list"></div>`;
        updateMateriList();
        return;
    }

    document.querySelector('main').style.background = 'var(--surface)';
    const waktuBacaText = typeof hitungWaktuBaca === 'function' ? hitungWaktuBaca(m.isi) : '1 menit baca';
    const legacyVid = m.video && !(m.isi || '').includes(m.video) ? yt(m.video) : '';
    const coverUrl = m.gambar ? String(m.gambar).trim() : '';
    const coverHtml = coverUrl
        ? `<img src="${esc(coverUrl)}" alt="${esc(m.judul)}" style="width:100%;max-height:340px;object-fit:cover;border-radius:12px;margin:0 0 22px;display:block">`
        : '';

    const linkedQuiz = m.quizId ? (D.quiz || []).find(q => q.id === m.quizId && isPublishedItem(q)) : null;
    let quizEmbedHtml = '';
    if (linkedQuiz) {
        const isNative = linkedQuiz.tipe === 'native';
        const extVis = !isNative ? getExternalQuizVisual(linkedQuiz.link) : null;
        const qIcon = isNative ? getQuizTopicIcon(linkedQuiz.topik) : extVis;
        const soalCount = isNative && Array.isArray(linkedQuiz.soal) ? linkedQuiz.soal.length : 0;
        const durasiMnt = isNative ? getQuizDurasiMenit(linkedQuiz) : 0;
        const qMeta = isNative
            ? `${soalCount} soal · ${durasiMnt === 0 ? 'Tanpa batas' : durasiMnt + ' menit'}`
            : `${extVis.label} · Online`;
        const qAction = isNative
            ? `<a class="btn" href="#quiz/${esc(linkedQuiz.id)}" style="white-space:nowrap">Kerjakan kuis →</a>`
            : `<a class="btn" href="${esc(linkedQuiz.link)}" target="_blank" rel="noopener" style="white-space:nowrap">Buka kuis ↗</a>`;

        quizEmbedHtml = `
            <div class="read-footer">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;padding:18px 20px;background:var(--bg);border:1.5px solid var(--border);border-radius:14px">
                    <div style="display:flex;align-items:center;gap:14px;min-width:0;flex:1">
                        <div class="quiz-icon-box" style="background:${qIcon.bg};color:${qIcon.color}">${qIcon.svg}</div>
                        <div style="min-width:0">
                            <div style="font-size:12px;font-weight:700;color:var(--primary);margin-bottom:2px">Sudah selesai baca? Uji pemahamanmu</div>
                            <div style="font-size:16px;font-weight:700;color:var(--text);line-height:1.3">${esc(linkedQuiz.judul)}</div>
                            <div style="font-size:13px;color:var(--text-muted);margin-top:2px">${esc(qMeta)}</div>
                        </div>
                    </div>
                    ${qAction}
                </div>
            </div>`;
    }

    a.innerHTML = `
        <div class="content-wrapper">
            <div class="read-topbar">
                <a class="back" href="javascript:void(0)" onclick="goBack()">← Kembali</a>
            </div>
            <article class="read">
                <div class="read-header">
                    <h1>${esc(m.judul)}</h1>
                    <div class="read-meta">
                        <span>⏱ ${waktuBacaText}</span>
                    </div>
                </div>
                ${coverHtml}
                ${legacyVid}
                <div class="read-body">${fmt(m.isi)}</div>
                ${quizEmbedHtml}
            </article>
        </div>`;
}

/* -------------------------
   HALAMAN KUIS (LIST, INTRO & SOAL)
------------------------- */
function quiz(id) {
    const a = wrapMain();
    const q = (D.quiz || []).find(x => x.id === id && x.tipe === 'native' && isPublishedItem(x));

    if (!q) {
        const topikOpts = (typeof TOPIK !== 'undefined' ? TOPIK : [])
            .map(t => `<option value="${esc(t)}" ${fTopikQuiz === t ? 'selected' : ''}>${esc(t)}</option>`)
            .join('');
        const kelasOpts = (typeof KELAS_LEVEL_LIST !== 'undefined' ? KELAS_LEVEL_LIST : [])
            .map(k => `<option value="${esc(k.id)}" ${fKelasSiswa === k.id ? 'selected' : ''}>${esc(k.label)}</option>`)
            .join('');

        a.innerHTML = `
            <div class="crud-header" style="margin-bottom:18px;gap:10px">
                <div class="crud-search-wrap">
                    ${ICON_SEARCH_SISWA}
                    <input type="text" class="crud-search-input" value="${esc(qQuiz)}" placeholder="Cari kuis..." oninput="qQuiz=this.value;updateQuizList()" />
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap">
                    <select onchange="setKelasSiswaFilter(this.value,'quiz')" style="width:auto;padding:10px 14px;border-radius:12px;font-size:13.5px;font-weight:600;background:var(--surface);border:1.5px solid var(--border);cursor:pointer">
                        ${kelasOpts}
                    </select>
                    <select onchange="fTopikQuiz=this.value;updateQuizList()" style="width:auto;padding:10px 14px;border-radius:12px;font-size:13.5px;font-weight:600;background:var(--surface);border:1.5px solid var(--border);cursor:pointer">
                        <option value="Semua" ${fTopikQuiz === 'Semua' ? 'selected' : ''}>Semua Topik</option>
                        ${topikOpts}
                    </select>
                </div>
            </div>
            <div id="quiz_list"></div>`;
        updateQuizList();
        return;
    }

    quizIntro(q);
}

function getQuizDurasiMenit(q) {
    if (q.durasi === 0 || q.durasi === '0') return 0;
    const n = Number(q.durasi);
    return n > 0 ? n : Math.max(1, Math.round((q.soal?.length || 1) * 1.5));
}

function formatTimer(sec) {
    const s = Math.max(0, Math.ceil(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

function clearQuizTimer() {
    if (run && run.timerId) {
        clearInterval(run.timerId);
        run.timerId = null;
    }
}

function updateTimerUI() {
    const el = document.getElementById('q_timer');
    if (!el || !run || !run.endAt) return;
    const left = Math.max(0, Math.ceil((run.endAt - Date.now()) / 1000));
    el.textContent = `⏱ ${formatTimer(left)}`;
    if (left <= 60) {
        el.style.background = '#fef2f2';
        el.style.borderColor = '#fecaca';
        el.style.color = '#dc2626';
    } else {
        el.style.background = 'var(--bg)';
        el.style.borderColor = 'var(--border)';
        el.style.color = 'var(--text)';
    }
}

function startQuizTimer() {
    clearQuizTimer();
    if (!run || !run.endAt) return;
    run.timerId = setInterval(() => {
        if (!isQuizInProgress()) {
            clearQuizTimer();
            return;
        }
        const left = Math.ceil((run.endAt - Date.now()) / 1000);
        updateTimerUI();
        if (left <= 0) {
            clearQuizTimer();
            run.timedOut = true;
            run.lock = true;
            run.i = run.q.soal.length;
            step();
        }
    }, 500);
}

function quizIntro(q) {
    const a = document.getElementById('app');
    const durasiMenit = getQuizDurasiMenit(q);
    const durasiText = durasiMenit === 0
        ? 'Tanpa batas waktu'
        : `Batas waktu ${durasiMenit} menit`;
    const klsList = Array.isArray(D.daftar_kelas) ? D.daftar_kelas : [];
    const savedKls = sessionStorage.getItem('siswa_kelas') || '';
    const savedNama = sessionStorage.getItem('siswa_nama') || '';

    const kelasField = klsList.length
        ? `<select id="q_kelas">
              <option value="">-- Pilih Kelas --</option>
              ${klsList.map(k => `<option value="${esc(k)}" ${savedKls === k ? 'selected' : ''}>${esc(/^kelas\b/i.test(k) ? k : 'Kelas ' + k)}</option>`).join('')}
           </select>`
        : `<input id="q_kelas" value="${esc(savedKls)}" placeholder="Contoh: X A">`;

    a.innerHTML = `
        <div class="content-wrapper">
            <div class="read-topbar">
                <a class="back" href="javascript:void(0)" onclick="goBack()">← Kembali</a>
            </div>
            <div class="qbox">
                <h2 style="margin:0 0 8px;font-size:26px">${esc(q.judul)}</h2>
                <p class="sub" style="margin-bottom:20px">${esc(q.deskripsi || 'Uji pemahaman fisikamu pada topik ini.')}</p>

                <div class="quiz-intro-meta">
                    <span class="quiz-intro-badge">📝 ${q.soal.length} Butir Soal</span>
                    <span class="quiz-intro-badge">⏱️ ${durasiText}</span>
                    <span class="quiz-intro-badge">🎯 Pilihan Ganda</span>
                </div>

                <div class="quiz-rules-box">
                    <h4>📋 Petunjuk & Peraturan Kuis</h4>
                    <ol class="quiz-rules-list">
                        <li>Pilih kelas dan ketik nama lengkapmu terlebih dahulu sebelum memulai.</li>
                        <li>Baca setiap soal dan pilih <strong>satu jawaban</strong> yang paling tepat.</li>
                        <li>Setelah memilih opsi, kunci jawaban dan pembahasan akan langsung muncul.</li>
                        ${durasiMenit > 0 ? `<li>Batas waktu pengerjaan <strong>${durasiMenit} menit</strong>; jika waktu habis, jawaban otomatis dikumpulkan.</li>` : ''}
                        <li>Skor akhir (0–100) otomatis tercatat untuk penilaian guru.</li>
                    </ol>
                </div>

                <div class="form-grid-2" style="margin-bottom:14px">
                    <div>
                        <label style="margin-top:0">Kelas</label>
                        ${kelasField}
                    </div>
                    <div>
                        <label style="margin-top:0">Nama Lengkap</label>
                        <input id="q_nama" value="${esc(savedNama)}" placeholder="Ketik nama lengkapmu...">
                    </div>
                </div>
                <div id="q_ident_err" style="display:none;color:var(--danger);font-size:13px;font-weight:600;margin-bottom:12px"></div>

                <button class="btn" style="width:100%;padding:14px;font-size:16px;text-align:center" onclick="startQuiz('${q.id}')">
                    Mulai Kuis Sekarang →
                </button>
            </div>
        </div>`;
}

function shuffleList(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function startQuiz(id, retryIdent) {
    const q = D.quiz.find(x => x.id === id && x.tipe === 'native');
    if (!q) return;

    let kelas = retryIdent ? retryIdent.kelas : (document.getElementById('q_kelas')?.value || '').trim();
    let nama = retryIdent ? retryIdent.nama : (document.getElementById('q_nama')?.value || '').trim();
    const errEl = document.getElementById('q_ident_err');

    if (!kelas || !nama) {
        if (errEl) {
            errEl.textContent = !kelas ? 'Silakan pilih kelas terlebih dahulu.' : 'Silakan ketik nama lengkapmu terlebih dahulu.';
            errEl.style.display = 'block';
        }
        return;
    }
    sessionStorage.setItem('siswa_kelas', kelas);
    sessionStorage.setItem('siswa_nama', nama);

    let soalList = (q.soal || []).map(s => {
        let opts = s.o.map((text, k) => ({ text, ok: k === s.a }));
        if (q.acakOpsi) opts = shuffleList(opts);
        return { q: s.q, e: s.e || '', o: opts.map(x => x.text), a: opts.findIndex(x => x.ok) };
    });
    if (q.acakSoal) soalList = shuffleList(soalList);
    clearQuizTimer();
    const durasiMenit = getQuizDurasiMenit(q);
    const endAt = durasiMenit > 0 ? Date.now() + durasiMenit * 60 * 1000 : null;
    run = { q: { ...q, soal: soalList }, i: 0, ans: [], lock: false, kelas, nama, saved: false, streak: 0, maxStreak: 0, endAt, timerId: null, timedOut: false };
    startQuizTimer();
    step();
}

let quizSoundOn = localStorage.getItem('fisika_quiz_sound') !== '0';

function toggleQuizSound() {
    quizSoundOn = !quizSoundOn;
    localStorage.setItem('fisika_quiz_sound', quizSoundOn ? '1' : '0');
    const btn = document.getElementById('q_sound_btn');
    if (btn) btn.textContent = quizSoundOn ? '🔊 Suara' : '🔇 Bisukan';
}

function quizSfx(type) {
    if (!quizSoundOn) return;
    try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        const ctx = new AC();
        const now = ctx.currentTime;
        const playTone = (freq, start, dur, wave = 'sine', gainVal = 0.12) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = wave;
            osc.frequency.setValueAtTime(freq, start);
            g.gain.setValueAtTime(gainVal, start);
            g.gain.exponentialRampToValueAtTime(0.001, start + dur);
            osc.connect(g);
            g.connect(ctx.destination);
            osc.start(start);
            osc.stop(start + dur);
        };
        if (type === 'ok') {
            playTone(523.25, now, 0.12, 'triangle', 0.14);
            playTone(659.25, now + 0.08, 0.18, 'triangle', 0.14);
        } else if (type === 'bad') {
            playTone(220, now, 0.14, 'sawtooth', 0.07);
            playTone(175, now + 0.1, 0.2, 'sawtooth', 0.07);
        } else if (type === 'win') {
            [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => playTone(f, now + idx * 0.09, 0.25, 'triangle', 0.13));
        }
        setTimeout(() => ctx.close().catch(() => {}), 900);
    } catch {}
}

function launchConfetti() {
    const wrap = document.createElement('div');
    wrap.className = 'quiz-confetti';
    const colors = ['#0891b2', '#22c55e', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6'];
    for (let c = 0; c < 36; c++) {
        const p = document.createElement('span');
        p.style.left = `${Math.random() * 100}%`;
        p.style.background = colors[c % colors.length];
        p.style.animationDelay = `${Math.random() * 0.45}s`;
        p.style.animationDuration = `${1.3 + Math.random() * 0.9}s`;
        wrap.appendChild(p);
    }
    document.body.appendChild(wrap);
    setTimeout(() => wrap.remove(), 2600);
}

function step() {
    const a = document.getElementById('app');
    const { q, i } = run;

    if (i >= q.soal.length) {
        clearQuizTimer();
        const benar = run.ans.filter((v, k) => v === q.soal[k].a).length;
        const pct = Math.round((benar / q.soal.length) * 100);
        const showScore = q.tampilkanHasil !== false;
        const klsLabel = /^kelas\b/i.test(run.kelas) ? run.kelas : `Kelas ${run.kelas}`;
        const badge = run.timedOut
            ? '⏰ Waktu Habis'
            : (pct === 100 ? '🏆 Sempurna!' : pct >= 80 ? '🔥 Keren Banget!' : pct >= 60 ? '👍 Mantap!' : '💪 Ayo Coba Lagi!');

        a.innerHTML = `
            <div class="content-wrapper">
                <div class="qbox qbox-enter" style="text-align:center">
                    ${showScore || run.timedOut ? `<div class="quiz-result-badge">${badge}</div>` : ''}
                    <h2 style="margin-bottom:6px">${esc(q.judul)} ${run.timedOut ? 'berakhir' : 'selesai'}</h2>
                    <p class="sub" style="margin-bottom:16px">${esc(run.nama)} · ${esc(klsLabel)}</p>
                    ${showScore
                        ? `<div class="score" id="q_score_num">0</div>
                           <div class="quiz-result-stats">
                               <span class="quiz-stat-pill">✅ Benar ${benar}/${q.soal.length}</span>
                               ${run.maxStreak >= 2 ? `<span class="quiz-stat-pill streak">🔥 Streak Terbaik ${run.maxStreak}x</span>` : ''}
                           </div>`
                        : `<p class="sub">Jawabanmu sudah diterima dan tercatat oleh guru.</p>`
                    }
                    <div class="row" style="justify-content:center;margin-top:22px">
                        <button class="btn" id="q_retry_btn">Ulangi Kuis</button>
                        <a class="btn ghost" href="#quiz">Selesai</a>
                    </div>
                </div>
            </div>`;

        const retryBtn = document.getElementById('q_retry_btn');
        if (retryBtn) retryBtn.onclick = () => startQuiz(q.id, { kelas: run.kelas, nama: run.nama });

        if (showScore) {
            const numEl = document.getElementById('q_score_num');
            let cur = 0;
            const inc = Math.max(1, Math.ceil(pct / 22));
            const timer = setInterval(() => {
                cur = Math.min(pct, cur + inc);
                if (numEl) numEl.textContent = cur;
                if (cur >= pct) clearInterval(timer);
            }, 22);
            if (pct >= 70) {
                quizSfx('win');
                launchConfetti();
            }
        }

        saveQuizAttempt();
        return;
    }

    const s = q.soal[i];
    const segs = q.soal.map((item, idx) => {
        if (idx < i) return `<span class="q-seg ${run.ans[idx] === item.a ? 'ok' : 'bad'}"></span>`;
        if (idx === i) return `<span class="q-seg now"></span>`;
        return `<span class="q-seg"></span>`;
    }).join('');

    window.scrollTo({ top: 0, behavior: 'smooth' });
    a.innerHTML = `
        <div class="content-wrapper">
            <div class="qbox qbox-enter">
                <div class="quiz-head" style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:nowrap">
                    <span class="quiz-step-pill" style="white-space:nowrap">Soal ${i + 1} / ${q.soal.length}</span>
                    <div class="quiz-live-stats" style="display:flex;align-items:center;gap:8px;margin-left:auto">
                        ${run.streak >= 2 ? `<span class="quiz-streak-pill" id="q_streak">🔥 ${run.streak}x Streak</span>` : `<span class="quiz-streak-pill" id="q_streak" style="display:none"></span>`}
                        ${run.endAt ? `<span id="q_timer" style="display:inline-flex;align-items:center;padding:4px 10px;border-radius:999px;background:var(--bg);border:1px solid var(--border);font-size:12.5px;font-weight:700;font-variant-numeric:tabular-nums;color:var(--text);white-space:nowrap">⏱ ${formatTimer((run.endAt - Date.now()) / 1000)}</span>` : ''}
                        <button type="button" class="quiz-sound-btn" id="q_sound_btn" style="white-space:nowrap" onclick="toggleQuizSound()">${quizSoundOn ? '🔊 Suara' : '🔇 Bisukan'}</button>
                    </div>
                </div>
                <div class="q-segs">${segs}</div>
                <div class="quiz-question">${esc(s.q)}</div>
                <div class="quiz-opts">
                    ${s.o.map((o, k) => `<button class="opt" data-k="${k}"><span class="opt-text">${esc(o)}</span><span class="opt-mark"></span></button>`).join('')}
                </div>
                <div id="fb"></div>
            </div>
        </div>`;

    updateTimerUI();
    a.querySelectorAll('.opt').forEach(b => {
        b.onclick = () => {
            if (run.lock) return;
            run.lock = true;
            const k = +b.dataset.k;
            const isOk = k === s.a;
            run.ans[i] = k;

            if (isOk) {
                run.streak++;
                run.maxStreak = Math.max(run.maxStreak, run.streak);
                quizSfx('ok');
            } else {
                run.streak = 0;
                quizSfx('bad');
            }

            const curSeg = a.querySelector('.q-seg.now');
            if (curSeg) curSeg.className = `q-seg ${isOk ? 'ok' : 'bad'}`;
            const streakEl = document.getElementById('q_streak');
            if (streakEl) {
                if (run.streak >= 2) {
                    streakEl.textContent = `🔥 ${run.streak}x Streak`;
                    streakEl.style.display = 'inline-flex';
                    streakEl.classList.remove('pop');
                    void streakEl.offsetWidth;
                    streakEl.classList.add('pop');
                } else {
                    streakEl.style.display = 'none';
                }
            }

            a.querySelectorAll('.opt').forEach((x, j) => {
                x.disabled = true;
                const mark = x.querySelector('.opt-mark');
                if (j === s.a) {
                    x.classList.add('ok');
                    if (mark) mark.textContent = '✓';
                } else if (j === k) {
                    x.classList.add('bad');
                    if (mark) mark.textContent = '✕';
                } else {
                    x.classList.add('dim');
                }
            });

            const praise = isOk
                ? (run.streak >= 3 ? `🔥 Streak ${run.streak}x! Benar!` : 'Benar!')
                : 'Kurang tepat.';
            const expHtml = s.e
                ? `<div class="exp ${isOk ? 'ok' : 'bad'}"><b>${praise}</b> ${esc(s.e)}</div>`
                : `<div class="exp ${isOk ? 'ok' : 'bad'}"><b>${praise}</b></div>`;
            const nxLabel = i + 1 < q.soal.length ? 'Soal berikutnya →' : 'Lihat hasil →';
            document.getElementById('fb').innerHTML = `${expHtml}<div class="quiz-fb-actions"><button class="btn" id="nx">${nxLabel}</button></div>`;

            document.getElementById('nx').onclick = () => {
                run.i++;
                run.lock = false;
                step();
            };
        };
    });
}

document.addEventListener('keydown', e => {
    if (!run || !document.querySelector('.quiz-opts')) return;
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (run.lock) {
        if (e.key === 'Enter' || e.key === ' ') {
            const nx = document.getElementById('nx');
            if (nx) { e.preventDefault(); nx.click(); }
        }
        return;
    }
    const key = e.key.toUpperCase();
    const idx = key >= 'A' && key <= 'Z' ? key.charCodeAt(0) - 65 : (key >= '1' && key <= '9' ? +key - 1 : -1);
    if (idx >= 0) {
        const btn = document.querySelector(`.quiz-opts .opt[data-k="${idx}"]`);
        if (btn) btn.click();
    }
});

/* -------------------------
   BOOT
------------------------- */
shell(null, [
    ['Home',   '#home',   'home'],
    ['Materi', '#materi', 'materi'],
    ['Quiz',   '#quiz',   'quiz'],
]);

footer();

let ignoreNextHash = false;
const QUIZ_LEAVE_MSG = 'Kuis masih berlangsung. Jika kamu keluar sekarang, jawabanmu akan langsung disimpan dan dihitung sebagai 1 percobaan. Yakin ingin keluar?';

function isQuizInProgress() {
    return !!(run && run.q && run.i < run.q.soal.length);
}

function saveQuizAttempt() {
    if (!run || !run.q || run.saved || typeof NilaiDB === 'undefined') return;
    run.saved = true;
    const total = run.q.soal.length || 1;
    const benar = run.ans.filter((v, k) => v === run.q.soal[k].a).length;
    const skor = Math.round((benar / total) * 100);
    NilaiDB.submit({
        quiz_id: run.q.id,
        quiz_judul: run.q.judul,
        kelas: run.kelas,
        nama: run.nama,
        benar,
        total,
        skor
    });
}

document.addEventListener('click', e => {
    if (!isQuizInProgress()) return;
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    if (!href || href.startsWith('javascript:')) return;
    if (!confirm(QUIZ_LEAVE_MSG)) {
        e.preventDefault();
        e.stopPropagation();
    } else {
        clearQuizTimer();
        saveQuizAttempt();
        run = null;
    }
}, true);

addEventListener('hashchange', () => {
    if (ignoreNextHash) {
        ignoreNextHash = false;
        return;
    }
    if (isQuizInProgress() && location.hash !== `#quiz/${run.q.id}`) {
        if (!confirm(QUIZ_LEAVE_MSG)) {
            ignoreNextHash = true;
            location.hash = `#quiz/${run.q.id}`;
            return;
        }
        saveQuizAttempt();
    }
    route();
});

addEventListener('beforeunload', e => {
    if (!isQuizInProgress()) return;
    e.preventDefault();
    e.returnValue = '';
});

addEventListener('pagehide', () => {
    if (isQuizInProgress()) saveQuizAttempt();
});

route();

Store.sync(cloud => {
    isCloudSyncing = false;
    if (cloud) D = cloud;
    if (!run) route();
});