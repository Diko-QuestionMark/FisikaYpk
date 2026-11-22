/* ==========================================================
   siswa-core.js — Router & Render Halaman Siswa
   Bergantung pada: app.js (Store, NeonDB, esc, fmt, cuplikan, yt, TIPE, shell, footer)
   ========================================================== */

/* -------------------------
   STATE GLOBAL
------------------------- */
let D;        // data aplikasi (dari Store / Neon)
let run;      // state kuis yang sedang berjalan
let lastListPage = '#home'; // halaman list terakhir, untuk tombol ← Kembali

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
    run = null;
    D = Store.get();
    const currentHash = location.hash || '#home';
    const [k = 'home', id] = currentHash.slice(1).split('/');
    const page = k || 'home';
    if (!id) lastListPage = currentHash;
    setNav(page);
    scrollTo(0, 0);
    ({ home, materi, quiz }[page] || home)(id);
}

function goBack() {
    location.hash = lastListPage || '#home';
}

/* -------------------------
   UTILITAS RENDER
------------------------- */
function wrapMain() {
    const m = document.querySelector('main');
    m.style.padding = '';
    m.innerHTML = '<div class="wrap" id="app"></div>';
    return document.getElementById('app');
}

function cards(l, t) {
    if (!l.length)
        return `<div class="empty">${t === 'm' ? 'Tidak ada materi' : 'Tidak ada kuis'}</div>`;

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
        const diffLevel = x.level || (soalCount <= 5 ? 'Mudah' : (soalCount <= 10 ? 'Sedang' : 'Tantangan'));
        const btnLabel = isNative ? 'Mulai kuis' : 'Buka kuis ↗';

        const metaPills = isNative ? `
            <span class="quiz-meta-pill">✓ ${soalCount} soal</span>
            <span class="quiz-meta-pill">⏱ ${estMenit === 'Bebas' ? 'Tanpa batas' : estMenit + ' menit'}</span>
            <span class="quiz-meta-pill">${diffLevel}</span>
        ` : `
            <span class="quiz-meta-pill">🌐 Eksternal</span>
            <span class="quiz-meta-pill">⏱ Fleksibel</span>
            <span class="quiz-meta-pill">Online</span>
        `;

        return `<div class="card card-quiz">
            <div class="quiz-card-top">
                <div class="quiz-icon-box">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 3v16a2 2 0 0 0 2 2h16"/>
                        <path d="m7 14 4-4 4 3 6-7"/>
                    </svg>
                </div>
                <h3 class="quiz-card-title">${esc(x.judul)}</h3>
            </div>
            <div class="quiz-card-meta">
                ${metaPills}
            </div>
            <button class="quiz-card-btn" onclick="${handler}">${btnLabel}</button>
        </div>`;
    }).join('')}</div>`;
}

/* -------------------------
   HALAMAN HOME
------------------------- */
function home() {
    const m = document.querySelector('main');
    m.style.padding = '0';
    m.innerHTML = `
        <section class="hero">
            <div class="wrap">
                <h1>${esc(D.site.tagline)}</h1>
                <p>${esc(D.site.deskripsi)}</p>
                <a class="btn" href="#materi">Mulai belajar</a>
            </div>
        </section>
        <div class="wrap" style="padding:40px 20px 20px">
            <h2 style="margin:0 0 20px">Materi terbaru</h2>
            ${cards(D.materi.slice(-3).reverse(), 'm')}
        </div>
        <div class="wrap" style="padding:20px 20px 60px">
            <h2 style="margin:0 0 20px">Quiz terbaru</h2>
            ${cards(D.quiz.slice(-3).reverse(), 'q')}
        </div>`;
}

/* -------------------------
   HALAMAN MATERI (LIST & DETAIL)
------------------------- */
function materi(id) {
    const a = wrapMain();
    const m = D.materi.find(x => x.id === id);

    if (!m) {
        // Tampilkan daftar materi
        a.innerHTML = `<h2>Materi</h2><p class="sub">Pilih topik yang ingin kamu pelajari.</p>${cards(D.materi, 'm')}`;
        return;
    }

    // Hitung estimasi waktu baca
    const textOnly = (new DOMParser().parseFromString(m.isi || '', 'text/html').body.textContent || '').trim();
    const wordCount = textOnly ? textOnly.split(/\s+/).length : 0;
    const menitBaca = Math.max(1, Math.ceil(wordCount / 180));

    const relatedQuiz = D.quiz.find(q => q.tipe === 'native');
    const legacyVid = m.video && !(m.isi || '').includes(m.video) ? yt(m.video) : '';

    // Bagian Uji Pemahaman Materi disembunyikan sementara sesuai permintaan
    const quizCTA = '';
    /*
    const quizCTA = relatedQuiz ? `
        <div class="read-footer">
            <div class="quiz-cta">
                <div class="quiz-cta-text">
                    <b>Uji Pemahaman Materi</b>
                    <p>Selesaikan kuis latihan untuk mengasah pemahamanmu terkait topik ini.</p>
                </div>
                <a class="btn" href="#quiz/${relatedQuiz.id}">Mulai Kuis →</a>
            </div>
        </div>` : '';
    */

    a.innerHTML = `
        <div class="content-wrapper">
            <div class="read-topbar">
                <a class="back" href="javascript:void(0)" onclick="goBack()">← Kembali</a>
            </div>
            <article class="read">
                <div class="read-header">
                    <h1>${esc(m.judul)}</h1>
                    <div class="read-meta">
                        <span>⏱ ${menitBaca} menit baca</span>
                    </div>
                </div>
                ${legacyVid}
                <div class="read-body">${fmt(m.isi)}</div>
                
            </article>
        </div>`;
}

/* -------------------------
   HALAMAN KUIS (LIST, INTRO & SOAL)
------------------------- */
function quiz(id) {
    const a = wrapMain();
    const q = D.quiz.find(x => x.id === id && x.tipe === 'native');

    if (!q) {
        a.innerHTML = `<h2>Quiz</h2><p class="sub">Uji pemahaman fisikamu lewat latihan kuis.</p>${cards(D.quiz, 'q')}`;
        return;
    }

    quizIntro(q);
}

function quizIntro(q) {
    const a = document.getElementById('app');
    const durasiText = q.durasi === 0 ? 'Tanpa batas waktu' : `Estimasi ~${q.durasi || Math.max(1, Math.round(q.soal.length * 1.5))} Menit`;

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
                        <li>Baca setiap soal dan seluruh opsi jawaban dengan cermat.</li>
                        <li>Pilih <strong>satu jawaban</strong> yang menurutmu paling tepat.</li>
                        <li>Setelah memilih opsi, kunci jawaban dan pembahasan konsep akan langsung muncul.</li>
                        <li>Jawaban yang sudah dipilih terkunci dan tidak dapat diubah kembali.</li>
                        <li>Skor akhir (0–100) akan dihitung otomatis setelah seluruh soal selesai dikerjakan.</li>
                    </ol>
                </div>

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

function startQuiz(id) {
    const q = D.quiz.find(x => x.id === id && x.tipe === 'native');
    if (!q) return;
    let soalList = (q.soal || []).map(s => {
        let opts = s.o.map((text, k) => ({ text, ok: k === s.a }));
        if (q.acakOpsi) opts = shuffleList(opts);
        return { q: s.q, e: s.e || '', o: opts.map(x => x.text), a: opts.findIndex(x => x.ok) };
    });
    if (q.acakSoal) soalList = shuffleList(soalList);
    run = { q: { ...q, soal: soalList }, i: 0, ans: [], lock: false };
    step();
}

function step() {
    const a = document.getElementById('app');
    const { q, i } = run;

    // Layar hasil akhir
    if (i >= q.soal.length) {
        const benar = run.ans.filter((v, k) => v === q.soal[k].a).length;
        const pct = Math.round((benar / q.soal.length) * 100);
        a.innerHTML = `
            <div class="content-wrapper">
                <div class="qbox">
                    <h2>${esc(q.judul)} selesai</h2>
                    <div class="score">${pct}</div>
                    <p class="sub">Benar ${benar} dari ${q.soal.length} soal.</p>
                    <div class="row">
                        <button class="btn" onclick="startQuiz('${q.id}')">Ulangi Kuis</button>
                        <a class="btn ghost" href="#quiz">Selesai</a>
                    </div>
                </div>
            </div>`;
        return;
    }

    // Layar soal
    const s = q.soal[i];
    const progress = (i / q.soal.length) * 100;
    a.innerHTML = `
        <div class="content-wrapper">
            <a class="back" href="#quiz">← Semua kuis</a>
            <div class="qbox">
                <div class="bar"><i style="width:${progress}%"></i></div>
                <p class="sub">Soal ${i + 1} dari ${q.soal.length}</p>
                <h3>${esc(s.q)}</h3>
                ${s.o.map((o, k) => `<button class="opt" data-k="${k}">${String.fromCharCode(65 + k)}. ${esc(o)}</button>`).join('')}
                <div id="fb"></div>
            </div>
        </div>`;

    a.querySelectorAll('.opt').forEach(b => {
        b.onclick = () => {
            if (run.lock) return;
            run.lock = true;
            const k = +b.dataset.k;
            run.ans[i] = k;

            a.querySelectorAll('.opt').forEach((x, j) => {
                x.disabled = true;
                if (j === s.a) x.classList.add('ok');
            });
            if (k !== s.a) b.classList.add('bad');

            const expHtml = s.e
                ? `<div class="exp"><b>${k === s.a ? 'Benar.' : 'Kurang tepat.'}</b> ${esc(s.e)}</div>`
                : '';
            const nxLabel = i + 1 < q.soal.length ? 'Soal berikutnya' : 'Lihat hasil';
            document.getElementById('fb').innerHTML = `${expHtml}<button class="btn" style="margin-top:16px" id="nx">${nxLabel}</button>`;

            document.getElementById('nx').onclick = () => {
                run.i++;
                run.lock = false;
                step();
            };
        };
    });
}

/* -------------------------
   BOOT
------------------------- */
shell(null, [
    ['Home',   '#home',   'home'],
    ['Materi', '#materi', 'materi'],
    ['Quiz',   '#quiz',   'quiz'],
]);

footer();

addEventListener('hashchange', route);
route();

Store.sync(cloud => {
    D = cloud;
    if (!run) route();
});
