/* Modul Pengaturan Website & Cadangan Data */
function pSite() {
  const s = D.site;
  return `<div class="panel"><b>Pengaturan website</b>${[
    ["nama", "Nama website"],
    ["tagline", "Judul besar halaman Home"],
    ["deskripsi", "Deskripsi Home"],
    ["footer", "Teks footer"],
    ["pin", "Kata sandi masuk guru"],
  ]
    .map(
      ([k, l]) =>
        `<label>${l}</label><input id="s_${k}" value="${esc(s[k] || "")}">`,
    )
    .join("")}
    <div class="row" style="margin-top:18px"><button class="btn" onclick="['nama','tagline','deskripsi','footer','pin'].forEach(k=>D.site[k]=$('#s_'+k).value.trim());save()">Simpan</button></div>
  </div>`;
}

function pData() {
  return `<div class="panel"><b>Cadangan data</b><p class="sub">Penyimpanan lokal hanya ada di browser ini. Unduh cadangan untuk memindahkan data ke komputer lain.</p>
    <div class="row"><button class="btn" onclick="exp()">Unduh cadangan (.json)</button><label class="btn ghost" style="margin:0;cursor:pointer">Pulihkan dari file<input type="file" accept=".json" hidden onchange="imp(this.files[0])"></label><button class="btn del" onclick="if(confirm('Kosongkan semua data? Semua data yang tersimpan akan dihapus.')){Store.reset();D=Store.get();draw()}">Kosongkan data</button></div>
  </div>`;
}

function exp() {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob([JSON.stringify(D, null, 1)], { type: "application/json" }),
  );
  a.download = "fisika-data.json";
  a.click();
}

function imp(f) {
  if (!f) return;
  f.text().then((t) => {
    try {
      const j = JSON.parse(t);
      if (!j.site || !j.materi || !j.quiz) throw 0;
      j.absen = j.absen || [];
      j.daftar_kelas = Array.isArray(j.daftar_kelas) ? j.daftar_kelas : [];
      j.kelas_siswa = j.kelas_siswa || {};
      D = j;
      save();
      draw();
    } catch (e) {
      toast("File tidak valid");
    }
  });
}

