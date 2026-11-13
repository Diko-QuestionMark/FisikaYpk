/* Modul Data Siswa & Pengelolaan Kelas */
let curMasterKls = null,
  editMaster = false;

function getKelasList() {
  if (!D.daftar_kelas || !Array.isArray(D.daftar_kelas)) {
    D.daftar_kelas = [];
  }
  return D.daftar_kelas;
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
    if (D.kelas_siswa && D.kelas_siswa[kls]) {
      delete D.kelas_siswa[kls];
    }
    if (curMasterKls === kls) {
      curMasterKls = null;
    }
    save();
    draw();
    toast(`Kelas ${kls} dihapus`);
  }
}

function pSiswa() {
  D.kelas_siswa = D.kelas_siswa || {};
  const klsList = getKelasList();

  if (!curMasterKls) {
    const items = klsList
      .map((k, idx) => {
        const count = (D.kelas_siswa[k] || []).length;
        return uiItem(
          idx,
          `<b>Kelas ${esc(k)}</b><div class="hint">${count ? `${count} siswa terdaftar` : "Belum ada data siswa"}</div>`,
          `<button class="btn sm ghost" onclick="curMasterKls='${esc(k)}';editMaster=false;draw()">Buka</button>
           <button class="btn sm del" onclick="hapusKelas('${esc(k)}')">Hapus</button>`,
        );
      })
      .join("");

    return uiPanel({
      headerLeft: `<b>Daftar (${klsList.length})</b>`,
      headerRight: `<button class="btn sm" onclick="tambahKelas()">${ICON_PLUS}Tambah</button>`,
      content: items,
      emptyText: "Belum ada kelas. Klik tombol <b>Tambah</b> untuk menambahkan.",
    });
  }

  const list = D.kelas_siswa[curMasterKls] || [];

  if (editMaster) {
    return `<div class="panel">
      <div class="row" style="justify-content:space-between;align-items:center;margin-bottom:12px">
        <div class="row" style="gap:10px;align-items:center">
          <button class="btn sm ghost" onclick="editMaster=false;draw()">← Kembali</button>
          <b>Edit Daftar Siswa: Kelas ${esc(curMasterKls)}</b>
        </div>
        <span class="hint">Copy-paste dari Excel atau ketik satu nama per baris</span>
      </div>
      <textarea id="master_text" style="min-height:280px;font-family:inherit;line-height:1.6" placeholder="Budi Santoso&#10;Citra Dewi&#10;Dedi Pratama">${esc(list.join("\n"))}</textarea>
      ${uiFormActions("saveMasterSiswa()", "editMaster=false;draw()", "Simpan Daftar Siswa")}
    </div>`;
  }

  return `<div class="panel">
    <div class="row" style="justify-content:space-between;align-items:center;margin-bottom:16px">
      <div class="row" style="gap:10px;align-items:center">
        <button class="btn sm ghost" onclick="curMasterKls=null;draw()">← Kembali ke Daftar Kelas</button>
        <b>Kelas ${esc(curMasterKls)}</b>
        <span class="hint">(${list.length} Siswa)</span>
      </div>
      <div class="row">
        <button class="btn sm" onclick="editMaster=true;draw()">Edit</button>
        <button class="btn sm del" onclick="hapusKelas('${esc(curMasterKls)}')">Hapus Kelas</button>
      </div>
    </div>

    <div style="background:var(--bg);border-radius:10px;padding:16px">
      ${
        list.length
          ? `<div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(220px, 1fr));gap:8px">
          ${list
            .map(
              (nama, idx) => `
            <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:8px 12px;display:flex;align-items:center;gap:8px">
              <span style="font-size:12px;color:var(--text-muted);font-weight:700;width:24px">${idx + 1}.</span>
              <span style="font-weight:600;font-size:14px">${esc(nama)}</span>
            </div>
          `,
            )
            .join("")}
        </div>`
          : `<div class="empty" style="background:var(--surface);padding:30px">
        Belum ada data siswa untuk kelas <b>${curMasterKls}</b>.<br>
        Klik tombol <b>Edit</b> di atas untuk memasukkan nama-nama siswa sekaligus.
      </div>`
      }
    </div>
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
  editMaster = false;
  save();
  toast(`Data siswa kelas ${curMasterKls} tersimpan (${lines.length} siswa)`);
  draw();
}

