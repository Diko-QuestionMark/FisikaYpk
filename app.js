/* Penyimpanan & utilitas bersama (dipakai index.html dan admin.html) */
const KEY = 'fisika_media_v3';

/* Konfigurasi Database Cloud Neon PostgreSQL */
const NEON_CONFIG = {
    endpoint: 'https://ep-weathered-breeze-aoj861as-pooler.c-2.ap-southeast-1.aws.neon.tech/sql',
    conn: 'postgresql://neondb_owner:npg_G6a3XClrKDce@ep-weathered-breeze-aoj861as-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
};

const NeonDB = {
    status: 'connecting', // 'synced' | 'syncing' | 'offline'
    listeners: [],

    onStatusChange(fn) {
        if (typeof fn === 'function') this.listeners.push(fn);
    },

    notify(s) {
        this.status = s;
        this.listeners.forEach(fn => fn(s));
        this.updateBadge();
    },

    updateBadge() {
        const badges = document.querySelectorAll('.neon-cloud-badge');
        badges.forEach(b => {
            if (this.status === 'offline') {
                b.innerHTML = '<span class="neon-dot red"></span> Mode Offline';
                b.className = 'neon-cloud-badge offline';
                b.style.display = 'inline-flex';
                b.title = 'Offline (data tetap tersimpan di perangkat ini)';
            } else {
                b.innerHTML = '';
                b.className = 'neon-cloud-badge ' + this.status;
                b.style.display = 'none';
            }
        });
    },

    async query(sql, params = []) {
        const res = await fetch(NEON_CONFIG.endpoint, {
            method: 'POST',
            headers: {
                'Neon-Connection-String': NEON_CONFIG.conn
            },
            body: JSON.stringify({ query: sql, params })
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const json = await res.json();
        return json.rows || [];
    },

    async pull() {
        this.notify('syncing');
        try {
            const rows = await this.query("SELECT data FROM app_state WHERE id = 'main' LIMIT 1;");
            if (rows && rows.length && rows[0].data) {
                const rawData = rows[0].data;
                const cloudData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
                localStorage.setItem(KEY, JSON.stringify(cloudData));
                this.notify('synced');
                return cloudData;
            }
            this.notify('synced');
            return null;
        } catch (e) {
            console.warn('[Neon Cloud] Pull failed, fallback to local storage:', e);
            this.notify('offline');
            return null;
        }
    },

    async push(d) {
        this.notify('syncing');
        try {
            await this.query(`
                INSERT INTO app_state (id, data)
                VALUES ('main', $1::jsonb)
                ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
            `, [JSON.stringify(d)]);
            this.notify('synced');
        } catch (e) {
            console.warn('[Neon Cloud] Push failed, data kept in local storage:', e);
            this.notify('offline');
        }
    }
};

/* Konfigurasi & Helper Topik Materi */
const TOPIK_LIST = [
    { id: 'pengukuran', label: 'Hakikat Fisika & Pengukuran' },
    { id: 'energi', label: 'Sumber Energi' },
    { id: 'pemanasan', label: 'Pemanasan Global' },
    { id: 'umum', label: 'Umum' }
];

const TOPIK_MAP = {
    pengukuran: 'Hakikat Fisika & Pengukuran',
    energi: 'Sumber Energi',
    pemanasan: 'Pemanasan Global',
    umum: 'Umum'
};

const DEFAULT_IMAGES = {
    pengukuran: 'img/default-pengukuran.svg',
    energi: 'img/default-energi.svg',
    pemanasan: 'img/default-pemanasan.svg',
    umum: 'img/default-umum.svg'
};

function normalizeTopik(t) {
    if (!t) return 'umum';
    const s = String(t).toLowerCase().trim();
    if (s === 'pengukuran' || s.includes('pengukuran') || s.includes('hakikat')) return 'pengukuran';
    if (s === 'energi') return 'energi';
    if (s === 'pemanasan' || s.includes('global') || s.includes('pemanasan')) return 'pemanasan';
    return 'umum';
}

function getMateriArt(m) {
    const topik = normalizeTopik(m && m.topik);
    const hasCustom = Boolean(m && m.gambar && String(m.gambar).trim());
    return {
        topik,
        src: hasCustom ? String(m.gambar).trim() : (DEFAULT_IMAGES[topik] || DEFAULT_IMAGES.umum),
        isDefault: !hasCustom
    };
}

const Store = {
    get() {
        try {
            const raw = localStorage.getItem(KEY);
            const fallback = (typeof SEED_DATA !== 'undefined') ? structuredClone(SEED_DATA) : { site: { nama: 'FisikaKu', pin: 'FahrulPolman' }, materi: [], quiz: [], absen: [], daftar_kelas: [], kelas_siswa: {} };
            const d = JSON.parse(raw) || fallback;
            d.site = d.site || {};
            d.site.pin = d.site.pin || 'FahrulPolman';
            d.materi = (d.materi || []).map(m => ({ ...m, topik: normalizeTopik(m.topik), gambar: m.gambar || '' }));
            d.quiz = (d.quiz || []).map(q => ({ ...q, topik: q.topik || 'Umum' }));
            d.absen = d.absen || [];
            d.daftar_kelas = Array.isArray(d.daftar_kelas) ? d.daftar_kelas : [];
            d.kelas_siswa = d.kelas_siswa || {};
            return d;
        } catch (e) {
            const fallback = (typeof SEED_DATA !== 'undefined') ? structuredClone(SEED_DATA) : { site: { nama: 'FisikaKu', pin: 'FahrulPolman' }, materi: [], quiz: [], absen: [], daftar_kelas: [], kelas_siswa: {} };
            fallback.materi = (fallback.materi || []).map(m => ({ ...m, topik: normalizeTopik(m.topik), gambar: m.gambar || '' }));
            fallback.quiz = (fallback.quiz || []).map(q => ({ ...q, topik: q.topik || 'Umum' }));
            return fallback;
        }
    },
    save(d) {
        localStorage.setItem(KEY, JSON.stringify(d));
        NeonDB.push(d); // Otomatis kirim ke cloud database Neon PostgreSQL
    },
    reset() {
        localStorage.removeItem(KEY);
    },
    async sync(callback) {
        const cloudData = await NeonDB.pull();
        if (cloudData && typeof callback === 'function') {
            callback(cloudData);
        }
    },
    uid(p) { return p + Date.now().toString(36); }
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
/* Format materi: mendukung HTML langsung (Quill editor) dan fallback format lama ("## Judul", ``` rumus ```) */
function fmt(t) {
    if (!t) return '';
    let str = String(t).trim();
    // Otomatis normalisasi URL YouTube di dalam iframe (misal watch?v= diubah jadi embed/ resmi)
    str = str.replace(/<iframe\b([^>]*?)src=["'](?:https?:)?\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([\w-]{11})[^"']*["']([^>]*?)>/gi, (match, before, vid, after) => {
        let attrs = `${before} ${after}`;
        if (!/allowfullscreen/i.test(attrs)) attrs += ' allowfullscreen';
        if (!/referrerpolicy/i.test(attrs)) attrs += ' referrerpolicy="strict-origin-when-cross-origin"';
        if (!/allow=/i.test(attrs)) attrs += ' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"';
        return `<iframe src="https://www.youtube.com/embed/${vid}" ${attrs.replace(/\s+/g, ' ').trim()}>`;
    });
    if (/<[a-z][\s\S]*>/i.test(str)) {
        return str;
    }
    return str.split(/```/).map((b, i) => i % 2 ? `<pre>${esc(b.trim())}</pre>` : b.split(/\n\s*\n/).map(p => { p = p.trim(); if (!p) return ''; return p.split('\n').map(l => l.startsWith('## ') ? `<h3>${esc(l.slice(3))}</h3>` : `<p>${esc(l)}</p>`).join('') }).join('')).join('');
}
/* Cuplikan/ringkasan otomatis dari teks isi materi */
function cuplikan(html, len = 120) {
    if (!html) return '';
    try {
        const doc = new DOMParser().parseFromString(String(html), 'text/html');
        // Utamakan paragraf pertama agar ringkasan langsung berisi penjelasan materi (tanpa menabrak judul sub-bab)
        const pElements = Array.from(doc.body.querySelectorAll('p'));
        let chosenText = '';
        for (const p of pElements) {
            const t = (p.textContent || '').trim();
            if (t.length > 10) {
                chosenText = t;
                break;
            }
        }
        let text = (chosenText || doc.body.textContent || '').trim().replace(/\s+/g, ' ');
        // Bersihkan angka urutan atau nomor di awal ringkasan (misal "1. ", "1) ", "2. ")
        text = text.replace(/^\s*\d+[\.\)]\s*/, '');
        if (!text) return 'Pelajari materi selengkapnya →';
        return text.length > len ? text.slice(0, len) + '…' : text;
    } catch (e) {
        let clean = String(html).replace(/<[^>]*>/g, '').trim().replace(/\s+/g, ' ');
        clean = clean.replace(/^\s*\d+[\.\)]\s*/, '');
        return clean.length > len ? clean.slice(0, len) + '…' : (clean || 'Pelajari materi selengkapnya →');
    }
}
function yt(u) {
    const m = String(u || '').match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/i);
    return m ? `<iframe class="video" src="https://www.youtube.com/embed/${m[1]}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>` : '';
}
const TIPE = { native: 'Kuis di website', link: 'Link eksternal' };
const TOPIK = [
    'Hakikat Fisika & Pengukuran',
    'Sumber Energi',
    'Pemanasan Global',
    'Umum'
];
/* Header & footer sama di semua halaman agar tampilan konsisten */
function shell(active, nav = []) {
    const d = Store.get().site;
    const homeHref = (nav[0] && nav[0][1]) || 'index.html';
    document.body.insertAdjacentHTML('afterbegin', `<header class="top"><div class="wrap"><a class="brand" href="${homeHref}"><img class="logo" src="aset/YPKLOGO.png" alt="Logo ${esc(d.nama)}"><span>${esc(d.nama)}</span></a>${nav.length ? `<nav>${nav.map(n => `<a href="${n[1]}" class="${n[2] === active ? 'on active' : ''}">${n[0]}</a>`).join('')}</nav>` : ''}</div></header>`);
    document.title = d.nama;
}
function footer() {
    const d = Store.get().site;
    document.body.insertAdjacentHTML('beforeend', `<footer><div class="wrap" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px"><span>© ${new Date().getFullYear()} ${esc(d.footer)}</span><span class="neon-cloud-badge" style="display:none"></span></div></footer>`);
    NeonDB.updateBadge();
}
/* Akses rahasia ke panel admin via triple-click logo sekolah */
let _lc = 0, _lt;
document.addEventListener('click', (e) => {
    const t = e.target;
    if (t && (t.classList.contains('logo') || (t.closest && t.closest('.brand .logo')))) {
        _lc++;
        clearTimeout(_lt);
        if (_lc >= 5) {
            _lc = 0;
            location.href = 'admin.html';
        } else {
            _lt = setTimeout(() => { _lc = 0; }, 500);
        }
    }
});
