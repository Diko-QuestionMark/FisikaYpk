/* Modul Pengaturan Website & Cadangan Data */
function bukaCadanganData() {
  if (typeof confirmLeaveUnsaved === "function" && !confirmLeaveUnsaved()) return;
  if (typeof isDirty !== "undefined") isDirty = false;
  tab = "data";
  draw();
}

function pSite() {
  const s = D.site;
  return `
    ${renderBreadcrumb([{ label: "Pengaturan" }])}
    <div class="panel">
      <div class="row" style="justify-content:space-between;align-items:center;margin-bottom:16px">
        <h3 style="margin:0">Pengaturan Website</h3>
        <button type="button" class="btn sm ghost" onclick="bukaCadanganData()">💾 Cadangan Data →</button>
      </div>
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
        <button class="btn" onclick="['nama','tagline','deskripsi','footer','pin'].forEach(k=>D.site[k]=$('#s_'+k).value.trim());save()">Simpan</button>
        <button class="btn ghost" onclick="draw()">Batal</button>
      </div>
    </div>`;
}

function pData() {
  return `
    ${renderBreadcrumb([
      { label: "Pengaturan", onClick: "tab='site';draw()" },
      { label: "Cadangan Data" },
    ])}
    <div class="panel">
      <div class="row" style="justify-content:space-between;align-items:center;margin-bottom:16px">
        <h3 style="margin:0">Cadangan Data</h3>
        <button type="button" class="btn sm ghost" onclick="tab='site';draw()">← Kembali ke Pengaturan</button>
      </div>
      <p class="sub" style="margin-bottom:16px">Data tersimpan otomatis di database cloud. Unduh cadangan (.json) secara berkala sebagai salinan arsip di perangkat Anda, atau pulihkan dari file cadangan jika diperlukan.</p>
      <div class="row" style="gap:10px;flex-wrap:wrap">
        <button class="btn" onclick="exp()">Unduh Cadangan (.json)</button>
        <label class="btn ghost" style="margin:0;cursor:pointer">Pulihkan dari File<input type="file" accept=".json" hidden onchange="imp(this.files[0]);this.value=''"></label>
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
      D = j;
      save();
      draw();
      toast("Cadangan data berhasil dipulihkan");
    } catch (e) {
      toast("File tidak valid");
    }
  });
}