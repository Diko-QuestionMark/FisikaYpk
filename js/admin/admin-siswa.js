/* Modul Data Siswa & Pengelolaan Kelas — Konsisten dengan Kartu Absensi */
let curMasterKls = null;
let siswaViewMode = "list"; // 'list' | 'edit'
let qSiswaCari = "";
let showIkonPicker = false;

const KELAS_MASCOTS = [
  "🦊", "🐬", "🦉", "🦁", "🦅", "🐺", "🐼", "🐯", "🐙", "🦋",
  "🪐", "🌍", "🌙", "☄️", "🚀", "⭐",
  "🍎", "🍊", "🍋", "🍉", "🍇", "🍓", "🍑", "🍍", "🥝", "🍒"
];

function getKelasList() {
  if (!D.daftar_kelas || !Array.isArray(D.daftar_kelas)) {
    D.daftar_kelas = [];
  }
  return D.daftar_kelas;
}

function getKelasMeta(k) {
  const s = String(k || "").trim();
  const clean = s.replace(/^kelas\s+/i, "").trim();
  let grade = "Lainnya";
  let order = 4;
  if (/^XII\b/i.test(clean)) { grade = "Kelas XII"; order = 3; }
  else if (/^XI\b/i.test(clean)) { grade = "Kelas XI"; order = 2; }
  else if (/^X\b/i.test(clean)) { grade = "Kelas X"; order = 1; }

  let code = clean.toUpperCase();
  const mPaket = clean.match(/^(XII|XI|X)[\s\-]*paket[\s\-]*(\d+)/i);
  const mHuruf = clean.match(/^(XII|XI|X)[\s\-]+([A-Z0-9]+)/i);
  if (mPaket) code = `${mPaket[1].toUpperCase()}-${mPaket[2]}`;
  else if (mHuruf) code = `${mHuruf[1].toUpperCase()}-${mHuruf[2].toUpperCase()}`;
  else code = clean.slice(0, 5).toUpperCase();

  let palette = { bg: "#f1f5f9", color: "#475569" };
  if (order === 1) {
    palette = { bg: "#e0f2fe", color: "#0369a1" }; // Semua Kelas X: biru langit
  } else if (order === 2) {
    palette = { bg: "#dcfce7", color: "#15803d" }; // Semua Kelas XI: hijau mint
  } else if (order === 3) {
    palette = { bg: "#f3e8ff", color: "#7e22ce" }; // Semua Kelas XII: ungu lavender
  }
  return { grade, order, code, clean, ...palette };
}

function getKelasIcon(k, idx = 0) {
  D.kelas_ikon = D.kelas_ikon || {};
  if (D.kelas_ikon[k]) return D.kelas_ikon[k];
  const meta = getKelasMeta(k);
  if (meta.order === 2) return "🪐";
  if (meta.order === 3) return "🌍";
  const defaultsX = ["🦊", "🐬", "🦉", "🦁", "🦅", "🐺"];
  const mHuruf = meta.clean.match(/^X[\s\-]+([A-Z])/i);
  const sub = mHuruf ? Math.max(0, mHuruf[1].toUpperCase().charCodeAt(0) - 65) : idx;
  return defaultsX[sub % defaultsX.length];
}

function setKelasIcon(kls, icon) {
  D.kelas_ikon = D.kelas_ikon || {};
  D.kelas_ikon[kls] = icon;
  showIkonPicker = false;
  save();
  draw();
  toast(`Ikon kelas diperbarui ${icon}`);
}

function bukaKelasSiswa(kls, mode = "list") {
  curMasterKls = kls;
  siswaViewMode = mode;
  qSiswaCari = "";
  showIkonPicker = false;
  draw();
}

function tambahKelas() {
  const raw = prompt("Masukkan nama kelas baru (contoh: X E atau XII D):");
  if (raw === null) return;
  const kls = raw.trim();
  if (!kls) return toast("Nama kelas tidak boleh kosong");
  const list = getKelasList();
  if (list.some((k) => k.toLowerCase() === kls.toLowerCase())) {
    return toast(`Kelas ${kls} sudah ada!`);
  }
  list.push(kls);
  D.daftar_kelas = list;
  D.kelas_siswa = D.kelas_siswa || {};
  if (!D.kelas_siswa[kls]) D.kelas_siswa[kls] = [];
  save();
  draw();
  toast(`Kelas ${kls} berhasil ditambahkan`);
}

function hapusKelas(kls) {
  const siswa = (D.kelas_siswa || {})[kls] || [];
  const msg = siswa.length
    ? `Hapus kelas ${kls} beserta ${siswa.length} siswa di dalamnya?`
    : `Hapus kelas ${kls}?`;
  if (confirm(msg)) {
    D.daftar_kelas = getKelasList().filter((k) => k !== kls);
    if (D.kelas_siswa && D.kelas_siswa[kls]) delete D.kelas_siswa[kls];
    if (D.kelas_ikon && D.kelas_ikon[kls]) delete D.kelas_ikon[kls];
    if (curMasterKls === kls) curMasterKls = null;
    save();
    draw();
    toast(`Kelas ${kls} dihapus`);
  }
}

function filterDaftarSiswa(val) {
  qSiswaCari = val || "";
  const box = document.getElementById("siswa_grid_list");
  if (!box || !curMasterKls) return;
  box.innerHTML = renderSiswaGrid(D.kelas_siswa[curMasterKls] || [], qSiswaCari);
}

function renderSiswaGrid(list, q) {
  const kw = String(q || "").toLowerCase().trim();
  const indexed = list.map((nama, idx) => ({ no: idx + 1, nama }));
  const filtered = kw ? indexed.filter((x) => x.nama.toLowerCase().includes(kw)) : indexed;
  if (!list.length) {
    return `<div style="padding:36px 20px;text-align:center;color:var(--text-muted);background:var(--bg);border:1.5px dashed var(--border);border-radius:12px">
      <div style="font-weight:700;color:var(--text);margin-bottom:6px">Belum ada siswa di kelas ini</div>
      <div style="font-size:13.5px;margin-bottom:14px">Klik tombol di bawah untuk menempel atau mengetik daftar nama siswa.</div>
      <button type="button" class="btn sm" onclick="siswaViewMode='edit';draw()">+ Isi Daftar Siswa</button>
    </div>`;
  }
  if (!filtered.length) {
    return `<div style="padding:24px;text-align:center;color:var(--text-muted);font-size:13.5px">Tidak ada nama siswa yang cocok dengan "${esc(q)}".</div>`;
  }
  return `<div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(210px, 1fr));gap:8px">
    ${filtered.map((x) => `
      <div style="display:flex;align-items:center;gap:10px;padding:9px 12px;background:var(--bg);border:1px solid var(--border);border-radius:10px;font-size:13.5px">
        <span style="min-width:24px;height:24px;border-radius:7px;background:var(--surface);border:1px solid var(--border);color:var(--text-muted);font-size:11.5px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">${x.no}</span>
        <span style="font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${esc(x.nama)}">${esc(x.nama)}</span>
      </div>
    `).join("")}
  </div>`;
}

function pSiswa() {
  D.kelas_siswa = D.kelas_siswa || {};
  const klsList = [...getKelasList()].sort((a, b) => {
    const ma = getKelasMeta(a);
    const mb = getKelasMeta(b);
    if (ma.order !== mb.order) return ma.order - mb.order;
    return ma.clean.localeCompare(mb.clean, "id", { numeric: true });
  });

  /* LEVEL 1: Daftar Kelas (Kartu konsisten dengan Absensi) */
  if (!curMasterKls) {
    const cards = klsList
      .map((k, idx) => {
        const count = (D.kelas_siswa[k] || []).length;
        const safeK = esc(k).replace(/'/g, "\\'");
        const labelK = /^kelas\b/i.test(k) ? k : `Kelas ${k}`;
        const meta = getKelasMeta(k);
        return `
          <div class="crud-card" style="cursor:pointer" onclick="bukaKelasSiswa('${safeK}','list')">
            <div style="display:flex;align-items:center;gap:14px;min-width:0;flex:1">
              <div style="width:44px;height:44px;border-radius:12px;background:${meta.bg};display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">${getKelasIcon(k, idx)}</div>
              <div class="crud-card-left">
                <h3 class="crud-card-title">${esc(labelK)}</h3>
                <div class="crud-card-sub">${count ? `${count} siswa terdaftar` : "Belum ada data siswa"}</div>
              </div>
            </div>
            <div class="crud-actions" onclick="event.stopPropagation()">
              <button type="button" class="crud-btn-icon" onclick="bukaKelasSiswa('${safeK}','edit')" title="Edit Siswa">${ICON_EDIT}</button>
              <button type="button" class="crud-btn-icon del" onclick="hapusKelas('${safeK}')" title="Hapus Kelas">${ICON_TRASH}</button>
            </div>
          </div>`;
      })
      .join("");

    return `
      ${renderBreadcrumb([{ label: "Data Siswa" }])}
      <div class="crud-header">
        <div class="crud-search-wrap">
          ${ICON_SEARCH}
          <input type="text" class="crud-search-input" placeholder="Cari nama kelas..." oninput="onCrudSearch(this.value)" />
        </div>
        <button class="crud-btn-add" onclick="tambahKelas()">${ICON_PLUS} Tambah Kelas</button>
      </div>
      <div class="crud-card-list">
        ${cards || `<div class="crud-empty">Belum ada kelas. Klik tombol <b>+ Tambah Kelas</b> untuk menambahkan.</div>`}
      </div>
    `;
  }

  /* LEVEL 2: Detail & Editor Siswa per Kelas */
  const meta = getKelasMeta(curMasterKls);
  const list = D.kelas_siswa[curMasterKls] || [];
  const klsLabel = /^kelas\b/i.test(curMasterKls) ? curMasterKls : `Kelas ${curMasterKls}`;
  const safeCur = esc(curMasterKls).replace(/'/g, "\\'");

  const bodyHtml = siswaViewMode === "edit"
    ? `
      <p class="sub" style="margin:0 0 10px;font-size:13.5px">Ketik atau tempel daftar nama siswa (satu nama per baris).</p>
      <textarea id="master_text" style="min-height:320px;font-family:inherit;line-height:1.65" placeholder="Contoh:&#10;Angel Natalia&#10;Anggun Aulia">${esc(list.join("\n"))}</textarea>
      <div class="row" style="margin-top:14px;gap:8px">
        <button type="button" class="btn" onclick="saveMasterSiswa()">Simpan Daftar Siswa</button>
        <button type="button" class="btn ghost" onclick="siswaViewMode='list';draw()">Batal</button>
      </div>`
    : `
      ${list.length ? `
        <div style="margin-bottom:12px">
          <div class="crud-search-wrap" style="max-width:100%">
            ${ICON_SEARCH}
            <input type="text" class="crud-search-input" value="${esc(qSiswaCari)}" placeholder="Cari nama siswa di ${esc(klsLabel)}..." oninput="filterDaftarSiswa(this.value)" />
          </div>
        </div>` : ""}
      <div id="siswa_grid_list">${renderSiswaGrid(list, qSiswaCari)}</div>`;

  return `
    ${renderBreadcrumb([
      { label: "Data Siswa", onClick: "curMasterKls=null;showIkonPicker=false;draw()" },
      { label: klsLabel },
    ])}
    <div class="panel">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding-bottom:14px;margin-bottom:16px;border-bottom:1px solid var(--border)">
        <div style="display:flex;align-items:center;gap:12px;min-width:0">
          <button type="button" onclick="showIkonPicker=!showIkonPicker;draw()" title="Klik untuk ganti ikon maskot kelas" style="width:46px;height:46px;border-radius:12px;background:${meta.bg};border:1.5px solid ${showIkonPicker ? "var(--primary)" : "transparent"};display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;cursor:pointer">${getKelasIcon(curMasterKls)}</button>
          <div>
            <h3 style="margin:0;font-size:18px;line-height:1.25">${esc(klsLabel)}</h3>
            <div style="font-size:13px;color:var(--text-muted);font-weight:600;margin-top:2px">${list.length} siswa terdaftar · <a href="javascript:void(0)" onclick="showIkonPicker=!showIkonPicker;draw()" style="color:var(--primary);text-decoration:none">Ganti ikon</a></div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <div style="display:inline-flex;background:var(--bg);padding:3px;border-radius:10px;border:1px solid var(--border)">
            <button type="button" onclick="siswaViewMode='list';draw()" style="border:0;border-radius:7px;padding:6px 12px;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer;background:${siswaViewMode === "list" ? "var(--surface)" : "transparent"};color:${siswaViewMode === "list" ? "var(--text)" : "var(--text-muted)"};box-shadow:${siswaViewMode === "list" ? "0 1px 3px rgba(0,0,0,0.08)" : "none"}">Daftar</button>
            <button type="button" onclick="siswaViewMode='edit';draw()" style="border:0;border-radius:7px;padding:6px 12px;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer;background:${siswaViewMode === "edit" ? "var(--surface)" : "transparent"};color:${siswaViewMode === "edit" ? "var(--text)" : "var(--text-muted)"};box-shadow:${siswaViewMode === "edit" ? "0 1px 3px rgba(0,0,0,0.08)" : "none"}">Edit Massal</button>
          </div>
          <button type="button" class="crud-btn-icon del" onclick="hapusKelas('${safeCur}')" title="Hapus Kelas">${ICON_TRASH}</button>
        </div>
      </div>
      ${showIkonPicker ? `
        <div style="margin-bottom:16px;padding:12px 14px;background:var(--bg);border:1px solid var(--border);border-radius:12px">
          <div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:8px">Pilih Maskot Kelas (Hewan, Planet &amp; Buah):</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            ${KELAS_MASCOTS.map((ic) => {
              const isSel = getKelasIcon(curMasterKls) === ic;
              return `<button type="button" onclick="setKelasIcon('${safeCur}','${ic}')" style="width:38px;height:38px;border-radius:10px;border:1.5px solid ${isSel ? "var(--primary)" : "var(--border)"};background:${isSel ? "var(--primary-soft)" : "var(--surface)"};font-size:20px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer">${ic}</button>`;
            }).join("")}
          </div>
        </div>` : ""}
      ${bodyHtml}
    </div>`;
}

function saveMasterSiswa() {
  const raw = $("#master_text").value;
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  D.kelas_siswa = D.kelas_siswa || {};
  D.kelas_siswa[curMasterKls] = lines;
  siswaViewMode = "list";
  save();
  toast("Daftar siswa tersimpan");
  draw();
}