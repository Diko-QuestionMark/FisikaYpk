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
    document.querySelectorAll('nav a').forEach(a =>
        a.classList.toggle('on', a.getAttribute('href') === '#' + k)
    );
}

function route() {
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
            return `<div class="card clickable" onclick="location.hash='#materi/${x.id}'">
                <h3>${esc(x.judul)}</h3>
                <p>${esc(preview)}</p>
            </div>`;
        }
        const handler = x.tipe === 'native'
            ? `location.hash='#quiz/${x.id}'`
            : `window.open('${esc(x.link)}','_blank')`;
        const btnLabel = x.tipe === 'native'
            ? `Kerjakan (${x.soal.length} soal) →`
            : `Buka kuis ↗`;
        return `<div class="card clickable" onclick="${handler}">
            <span class="tag q">${TIPE[x.tipe] || 'Link eksternal'}</span>
            <h3>${esc(x.judul)}</h3>
            <p>${esc(x.deskripsi)}</p>
            <span class="btn sm" style="align-self:flex-start;pointer-events:none">${btnLabel}</span>
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
        <div class="wrap" style="padding:40px 20px">
            <h2 style="margin-bottom:20px">Materi terbaru</h2>
            ${cards(D.materi.slice(-3).reverse(), 'm')}
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
                ${quizCTA}
            </article>
        </div>`;
}

/* -------------------------
   HALAMAN KUIS (LIST & SOAL)
------------------------- */
function quiz(id) {
    const a = wrapMain();
    const q = D.quiz.find(x => x.id === id && x.tipe === 'native');

    if (!q) {
        a.innerHTML = `<h2>Quiz</h2><p class="sub">Uji pemahaman dan asah kemampuan fisikamu lewat latihan kuis interaktif.</p>${cards(D.quiz, 'q')}`;
        return;
    }

    run = { q, i: 0, ans: [], lock: false };
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
                        <button class="btn" onclick="quiz('${q.id}')">Ulangi</button>
                        <a class="btn ghost" href="#quiz">Kuis lain</a>
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
                ${s.o.map((o, k) => `<button class="opt" data-k="${k}">${'ABCD'[k]}. ${esc(o)}</button>`).join('')}
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
    route();
});
