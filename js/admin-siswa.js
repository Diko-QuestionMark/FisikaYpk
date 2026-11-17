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
          `<button class="btn sm ghost" onclick="curMasterKls='${esc(k)}';draw()" title="Edit Siswa">${ICON_EDIT}</button>
           <button class="btn sm del" onclick="hapusKelas('${esc(k)}')" title="Hapus Kelas">${ICON_TRASH}</button>`,
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

  return `<div class="panel">
    <div class="row" style="justify-content:space-between;align-items:center;margin-bottom:16px">
      <h3 style="margin:0">Edit Siswa: Kelas ${esc(curMasterKls)}</h3>
      <span class="hint">(${list.length} Siswa)</span>
    </div>
    <textarea id="master_text" style="min-height:300px;font-family:inherit;line-height:1.6" placeholder="Ketik atau tempel nama siswa (satu nama per baris)...">${esc(list.join("\n"))}</textarea>
    <div class="row" style="margin-top:20px;gap:8px">
      <button class="btn" onclick="saveMasterSiswa()">Simpan</button>
      <button class="btn ghost" onclick="curMasterKls=null;draw()">Batal</button>
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
  curMasterKls = null;
  save();
  toast("Tersimpan");
  draw();
}

