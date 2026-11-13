/* Penyimpanan & utilitas bersama (dipakai index.html dan admin.html) */
const KEY = 'fisika_media_v3';
const SEED = {
    site: { nama: 'FisikaKu', tagline: 'Belajar fisika jadi lebih mudah, runtut, dan menyenangkan.', deskripsi: 'Media pembelajaran fisika interaktif: baca materi, lalu uji pemahamanmu lewat kuis.', footer: 'Media Pembelajaran Fisika' },
    daftar_kelas: [],
    materi: [],
    quiz: [],
    absen: [],
    kelas_siswa: {}
};
const Store = {
    get() {
        try {
            const d = JSON.parse(localStorage.getItem(KEY)) || structuredClone(SEED);
            d.materi = d.materi || [];
            d.quiz = d.quiz || [];
            d.absen = d.absen || [];
            d.daftar_kelas = Array.isArray(d.daftar_kelas) ? d.daftar_kelas : [];
            d.kelas_siswa = d.kelas_siswa || {};
            return d;
        } catch (e) {
            return structuredClone(SEED);
        }
    },
    save(d) { localStorage.setItem(KEY, JSON.stringify(d)) },
    reset() { localStorage.removeItem(KEY) },
    uid(p) { return p + Date.now().toString(36) }
};
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function fmtTanggal(str) {
    if (!str) return '';
    try {
        const parts = String(str).split('-');
        if (parts.length === 3) {
            const d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
            if (!isNaN(d.getTime())) {
                return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            }
        }
        const d = new Date(str);
        if (!isNaN(d.getTime())) {
            return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        }
    } catch (e) { }
    return str;
}
/* Format materi: "## Judul", blok ``` rumus ```, paragraf dipisah baris kosong */
function fmt(t) { return String(t || '').split(/```/).map((b, i) => i % 2 ? `<pre>${esc(b.trim())}</pre>` : b.split(/\n\s*\n/).map(p => { p = p.trim(); if (!p) return ''; return p.split('\n').map(l => l.startsWith('## ') ? `<h3>${esc(l.slice(3))}</h3>` : `<p>${esc(l)}</p>`).join('') }).join('')).join('') }
function yt(u) { const m = String(u || '').match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/); return m ? `<iframe class="video" src="https://www.youtube.com/embed/${m[1]}" allowfullscreen></iframe>` : '' }
const TIPE = { native: 'Kuis di website', link: 'Link eksternal' };
/* Header & footer sama di semua halaman agar tampilan konsisten */
function shell(active, nav = []) {
    const d = Store.get().site;
    const homeHref = (nav[0] && nav[0][1]) || 'index.html';
    document.body.insertAdjacentHTML('afterbegin', `<header class="top"><div class="wrap"><a class="brand" href="${homeHref}"><img class="logo" src="YPKLOGO.png" alt="Logo ${esc(d.nama)}"><span>${esc(d.nama)}</span></a>${nav.length ? `<nav>${nav.map(n => `<a href="${n[1]}" class="${n[2] === active ? 'on' : ''}">${n[0]}</a>`).join('')}</nav>` : ''}</div></header>`);
    document.title = d.nama;
}
function footer() { const d = Store.get().site; document.body.insertAdjacentHTML('beforeend', `<footer><div class="wrap">© ${new Date().getFullYear()} ${esc(d.footer)}</div></footer>`) }
