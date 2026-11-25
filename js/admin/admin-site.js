/* Modul Pengaturan Website, Topik & Cadangan Data */
let curSiteView = null; // null (menu kartu) | 'website' | 'topik' | 'data'
let draftTopikList = null;

function openSiteView(view) {
  if (typeof confirmLeaveUnsaved === "function" && !confirmLeaveUnsaved()) return;
  if (typeof isDirty !== "undefined") isDirty = false;
  tab = "site";
  curSiteView = view || null;
  draftTopikList = curSiteView === "topik" ? TOPIK_LIST.map((x) => ({ ...x })) : null;
  draw();
}

function bukaCadanganData() {
  openSiteView("data");
}

function pSite() {
  const s = D.site || {};

  /* LEVEL 1: Menu Kartu Pengaturan */
  if (!curSiteView) {
    const topikCount = Array.isArray(TOPIK_LIST) ? TOPIK_LIST.length : 0;
    return `
      ${renderBreadcrumb([{ label: "Pengaturan" }])}
      <div class="crud-card-list">
        <div class="crud-card" style="cursor:pointer" onclick="openSiteView('website')">
          <div style="display:flex;align-items:center;gap:14px;min-width:0;flex:1">
            <div style="width:44px;height:44px;border-radius:12px;background:#e0f2fe;color:#0284c7;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">🌐</div>
            <div class="crud-card-left">
              <h3 class="crud-card-title">Pengaturan Website</h3>
              <div class="crud-card-sub" style="margin-top:2px">${esc(s.nama || "Fahsika")} · Judul beranda, footer, dan kata sandi guru</div>
            </div>
          </div>
          <div class="crud-actions">
            <button type="button" class="btn sm ghost" onclick="event.stopPropagation();openSiteView('website')">Atur →</button>
          </div>
        </div>

        <div class="crud-card" style="cursor:pointer" onclick="openSiteView('topik')">
          <div style="display:flex;align-items:center;gap:14px;min-width:0;flex:1">
            <div style="width:44px;height:44px;border-radius:12px;background:#dcfce7;color:#16a34a;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">🏷️</div>
            <div class="crud-card-left">
              <h3 class="crud-card-title">Kelola Topik</h3>
              <div class="crud-card-sub" style="margin-top:2px">${topikCount} topik terdaftar untuk Materi &amp; Kuis</div>
            </div>
          </div>
          <div class="crud-actions">
            <button type="button" class="btn sm ghost" onclick="event.stopPropagation();openSiteView('topik')">Atur →</button>
          </div>
        </div>

        <div class="crud-card" style="cursor:pointer" onclick="openSiteView('data')">
          <div style="display:flex;align-items:center;gap:14px;min-width:0;flex:1">
            <div style="width:44px;height:44px;border-radius:12px;background:#f3e8ff;color:#7c3aed;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">💾</div>
            <div class="crud-card-left">
              <h3 class="crud-card-title">Cadangan Data</h3>
              <div class="crud-card-sub" style="margin-top:2px">Unduh arsip cadangan (.json) atau pulihkan dari file</div>
            </div>
          </div>
          <div class="crud-actions">
            <button type="button" class="btn sm ghost" onclick="event.stopPropagation();openSiteView('data')">Atur →</button>
          </div>
        </div>
      </div>
    `;
  }

  /* LEVEL 2A: Pengaturan Website */
  if (curSiteView === "website") {
    return `
      ${renderBreadcrumb([
        { label: "Pengaturan", onClick: "openSiteView(null)" },
        { label: "Pengaturan Website" },
      ])}
      <div class="panel">
        <h3 style="margin:0 0 16px">Pengaturan Website</h3>
        ${[
          ["nama", "Nama Website"],
          ["tagline", "Judul Besar Halaman Beranda"],
          ["deskripsi", "Deskripsi Beranda"],
          ["footer", "Teks Footer"],
          ["pin", "Kata Sandi Masuk Guru"],
        ]
          .map(
            ([k, l]) =>
              `<label>${l}</label><input id="s_${k}" value="${esc(s[k] || "")}">`,
          )
          .join("")}
        <div class="row" style="margin-top:20px;gap:8px">
          <button class="btn" onclick="['nama','tagline','deskripsi','footer','pin'].forEach(k=>D.site[k]=$('#s_'+k).value.trim());save();curSiteView=null;draw()">Simpan</button>
          <button class="btn ghost" onclick="openSiteView(null)">Batal</button>
        </div>
      </div>`;
  }

  /* LEVEL 2B: Kelola Topik */
  if (curSiteView === "topik") {
    const listTopik = Array.isArray(draftTopikList) ? draftTopikList : TOPIK_LIST;
    return `
      ${renderBreadcrumb([
        { label: "Pengaturan", onClick: "openSiteView(null)" },
        { label: "Kelola Topik" },
      ])}
      <div class="panel">
        <h3 style="margin:0 0 8px">Kelola Topik Materi &amp; Kuis</h3>
        <p class="sub" style="margin-bottom:14px">Topik yang ditambahkan di sini otomatis muncul di dropdown Materi, Kuis, dan halaman Siswa.</p>
        <div class="row" style="gap:8px;margin-bottom:14px">
          <input id="topik_baru" placeholder="Contoh: Kinematika, Dinamika Gerak, Gelombang..." style="flex:1;min-width:200px" onkeydown="if(event.key==='Enter'){event.preventDefault();tambahTopikBaru();}">
          <button type="button" class="btn" onclick="tambahTopikBaru()">+ Tambah Topik</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${listTopik.map((t) => `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 14px;background:var(--bg);border:1px solid var(--border);border-radius:10px">
              <span style="font-weight:600;color:var(--text)">${esc(t.label)}</span>
              ${t.id === "umum"
                ? `<span style="font-size:12px;color:var(--text-muted);font-weight:600">Bawaan</span>`
                : `<button type="button" class="btn sm ghost" style="color:var(--danger)" onclick="hapusTopik('${esc(t.id)}')">Hapus</button>`
              }
            </div>
          `).join("")}
        </div>
        <div class="row" style="margin-top:20px;gap:8px">
          <button type="button" class="btn" onclick="simpanTopik()">Simpan</button>
          <button type="button" class="btn ghost" onclick="openSiteView(null)">Batal</button>
        </div>
      </div>`;
  }

  /* LEVEL 2C: Cadangan Data */
  return pData();
}

function tambahTopikBaru() {
  const inp = $("#topik_baru");
  const label = (inp?.value || "").trim();
  if (!label) return toast("Nama topik belum diisi");
  if (!Array.isArray(draftTopikList)) draftTopikList = TOPIK_LIST.map((x) => ({ ...x }));
  const id = slugifyTopik(label);
  if (draftTopikList.some((x) => x.id === id || x.label.toLowerCase() === label.toLowerCase())) {
    return toast("Topik tersebut sudah ada");
  }
  const umumIdx = draftTopikList.findIndex((x) => x.id === "umum");
  if (umumIdx >= 0) draftTopikList.splice(umumIdx, 0, { id, label });
  else draftTopikList.push({ id, label });
  if (typeof isDirty !== "undefined") isDirty = true;
  draw();
}

function hapusTopik(id) {
  if (id === "umum") return;
  if (!Array.isArray(draftTopikList)) draftTopikList = TOPIK_LIST.map((x) => ({ ...x }));
  const target = draftTopikList.find((x) => x.id === id);
  if (!target) return;
  draftTopikList = draftTopikList.filter((x) => x.id !== id);
  if (typeof isDirty !== "undefined") isDirty = true;
  draw();
}

function simpanTopik() {
  const oldList = TOPIK_LIST.map((x) => ({ ...x }));
  const nextList = syncTopikGlobals(Array.isArray(draftTopikList) ? draftTopikList : oldList);
  const nextIds = new Set(nextList.map((x) => x.id));
  const removed = oldList.filter((x) => !nextIds.has(x.id));
  if (removed.length) {
    const removedIds = new Set(removed.map((x) => x.id));
    const removedLabels = new Set(removed.map((x) => x.label));
    (D.materi || []).forEach((m) => { if (removedIds.has(m.topik)) m.topik = "umum"; });
    (D.quiz || []).forEach((q) => { if (removedLabels.has(q.topik)) q.topik = "Umum"; });
  }
  D.topik_list = nextList;
  if (typeof isDirty !== "undefined") isDirty = false;
  draftTopikList = null;
  curSiteView = null;
  save();
  draw();
}

function pData() {
  return `
    ${renderBreadcrumb([
      { label: "Pengaturan", onClick: "openSiteView(null)" },
      { label: "Cadangan Data" },
    ])}
    <div class="panel">
      <h3 style="margin:0 0 8px">Cadangan Data</h3>
      <p class="sub" style="margin-bottom:16px">Data tersimpan otomatis di database cloud. Unduh cadangan (.json) secara berkala sebagai salinan arsip di perangkat Anda, atau pulihkan dari file cadangan jika diperlukan.</p>
      <div class="row" style="gap:10px;flex-wrap:wrap">
        <button class="btn" onclick="exp()">Unduh Cadangan (.json)</button>
        <label class="btn ghost" style="margin:0;cursor:pointer">Pulihkan dari File<input type="file" accept=".json" hidden onchange="imp(this.files[0]);this.value=''"></label>
      </div>
      <div class="row" style="margin-top:20px;gap:8px">
        <button type="button" class="btn ghost" onclick="openSiteView(null)">Kembali</button>
      </div>
    </div>`;
}

function exp() {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob([JSON.stringify(D, null, 1)], { type: "application/json" }),
  );
  a.download = "fisika-data.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function imp(f) {
  if (!f) return;
  f.text().then((t) => {
    try {
      const j = JSON.parse(t);
      if (!j.site || !j.materi || !j.quiz) throw 0;
      if (!confirm("Pulihkan data dari file ini? Data saat ini akan diganti dengan isi file cadangan.")) {
        return;
      }
      j.absen = j.absen || [];
      j.daftar_kelas = Array.isArray(j.daftar_kelas) ? j.daftar_kelas : [];
      j.kelas_siswa = j.kelas_siswa || {};
      j.kelas_pertemuan = j.kelas_pertemuan || {};
      j.topik_list = syncTopikGlobals(j.topik_list);
      D = j;
      save();
      draw();
      toast("Cadangan data berhasil dipulihkan");
    } catch (e) {
      toast("File tidak valid");
    }
  });
}