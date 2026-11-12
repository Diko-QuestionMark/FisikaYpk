/* Penyimpanan & utilitas bersama (dipakai index.html dan admin.html) */
const KEY = 'fisika_media_v1';
const SEED = {
    site: { nama: 'FisikaKu', tagline: 'Belajar fisika jadi lebih mudah, runtut, dan menyenangkan.', deskripsi: 'Media pembelajaran fisika interaktif: baca materi, lalu uji pemahamanmu lewat kuis.', footer: 'Media Pembelajaran Fisika' },
    materi: [{ id: 'm1', judul: 'Gerak Lurus Beraturan (GLB)', kategori: 'Kinematika', ringkasan: 'Gerak benda pada lintasan lurus dengan kecepatan tetap.', video: '', isi: '## Pengertian\nGLB adalah gerak benda pada lintasan lurus dengan kecepatan konstan, sehingga percepatannya nol.\n\n## Rumus\n```\ns = v × t\n```\nDengan s = jarak (m), v = kecepatan (m/s), t = waktu (s).\n\n## Contoh\nMobil melaju 20 m/s selama 10 s. Jarak tempuhnya 20 × 10 = 200 m.' },
    { id: 'm2', judul: 'Hukum Newton', kategori: 'Dinamika', ringkasan: 'Tiga hukum dasar yang menjelaskan hubungan gaya dan gerak.', video: '', isi: '## Hukum I\nBenda diam atau bergerak lurus beraturan akan mempertahankan keadaannya bila resultan gaya nol.\n\n## Hukum II\n```\nΣF = m × a\n```\n\n## Hukum III\nSetiap aksi menimbulkan reaksi yang sama besar dan berlawanan arah.' }],
    quiz: [{
        id: 'q1', judul: 'Kuis GLB', tipe: 'native', link: '', deskripsi: 'Uji pemahaman tentang gerak lurus beraturan.', soal: [
            { q: 'Pada GLB, percepatan benda adalah…', o: ['Konstan tidak nol', 'Nol', 'Bertambah', 'Berkurang'], a: 1, e: 'Kecepatan tetap berarti percepatan nol.' },
            { q: 'Mobil melaju 20 m/s selama 5 s. Jarak tempuhnya…', o: ['4 m', '25 m', '100 m', '200 m'], a: 2, e: 's = v × t = 20 × 5 = 100 m.' }]
    },
    { id: 'q2', judul: 'Latihan Hukum Newton (Quizizz)', tipe: 'quizizz', link: 'https://quizizz.com', deskripsi: 'Kerjakan di Quizizz.', soal: [] }]
};
const Store = {
    get() { try { return JSON.parse(localStorage.getItem(KEY)) || structuredClone(SEED) } catch (e) { return structuredClone(SEED) } },
    save(d) { localStorage.setItem(KEY, JSON.stringify(d)) },
    reset() { localStorage.removeItem(KEY) },
    uid(p) { return p + Date.now().toString(36) }
};
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/* Format materi: "## Judul", blok ``` rumus ```, paragraf dipisah baris kosong */
function fmt(t) { return String(t || '').split(/```/).map((b, i) => i % 2 ? `<pre>${esc(b.trim())}</pre>` : b.split(/\n\s*\n/).map(p => { p = p.trim(); if (!p) return ''; return p.split('\n').map(l => l.startsWith('## ') ? `<h3>${esc(l.slice(3))}</h3>` : `<p>${esc(l)}</p>`).join('') }).join('')).join('') }
function yt(u) { const m = String(u || '').match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/); return m ? `<iframe class="video" src="https://www.youtube.com/embed/${m[1]}" allowfullscreen></iframe>` : '' }
const TIPE = { native: 'Kuis di website', quizizz: 'Quizizz', gform: 'Google Form' };
/* Header & footer sama di semua halaman agar tampilan konsisten */
function shell(active, nav = []) {
    const d = Store.get().site;
    const homeHref = (nav[0] && nav[0][1]) || 'index.html';
    document.body.insertAdjacentHTML('afterbegin', `<header class="top"><div class="wrap"><a class="brand" href="${homeHref}"><img class="logo" src="YPKLOGO.png" alt="Logo ${esc(d.nama)}"><span>${esc(d.nama)}</span></a>${nav.length ? `<nav>${nav.map(n => `<a href="${n[1]}" class="${n[2] === active ? 'on' : ''}">${n[0]}</a>`).join('')}</nav>` : ''}</div></header>`);
    document.title = d.nama;
}
function footer() { const d = Store.get().site; document.body.insertAdjacentHTML('beforeend', `<footer><div class="wrap">© ${new Date().getFullYear()} ${esc(d.footer)}</div></footer>`) }
