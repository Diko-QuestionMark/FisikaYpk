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
    </div>

    <div class="panel" style="margin-top:18px">
      <div class="row" style="justify-content:space-between;align-items:center;margin-bottom:8px">
        <h3 style="margin:0">Kelola Topik Materi &amp; Kuis</h3>
      </div>
      <p class="sub" style="margin-bottom:14px">Topik yang ditambahkan di sini otomatis muncul di dropdown Materi, Kuis, dan halaman Siswa.</p>
      <div class="row" style="gap:8px;margin-bottom:14px">
        <input id="topik_baru" placeholder="Contoh: Kinematika, Dinamika Gerak, Gelombang..." style="flex:1;min-width:200px" onkeydown="if(event.key==='Enter'){event.preventDefault();tambahTopikBaru();}">
        <button type="button" class="btn" onclick="tambahTopikBaru()">+ Tambah Topik</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${TOPIK_LIST.map((t) => `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 14px;background:var(--bg);border:1px solid var(--border);border-radius:10px">
            <span style="font-weight:600;color:var(--text)">${esc(t.label)}</span>
            ${t.id === "umum"
              ? `<span style="font-size:12px;color:var(--text-muted);font-weight:600">Bawaan</span>`
              : `<button type="button" class="btn sm ghost" style="color:var(--danger)" onclick="hapusTopik('${esc(t.id)}')">Hapus</button>`
            }
          </div>
        `).join("")}
      </div>
    </div>`;
}

function tambahTopikBaru() {
  const inp = $("#topik_baru");
  const label = (inp?.value || "").trim();
  if (!label) return toast("Nama topik belum diisi");
  const list = Array.isArray(D.topik_list) && D.topik_list.length ? [...D.topik_list] : TOPIK_LIST.map((x) => ({ ...x }));
  const id = slugifyTopik(label);
  if (list.some((x) => x.id === id || x.label.toLowerCase() === label.toLowerCase())) {
    return toast("Topik tersebut sudah ada");
  }
  const umumIdx = list.findIndex((x) => x.id === "umum");
  if (umumIdx >= 0) list.splice(umumIdx, 0, { id, label });
  else list.push({ id, label });
  D.topik_list = syncTopikGlobals(list);
  save();
  draw();
  toast(`Topik "${label}" ditambahkan`);
}

function hapusTopik(id) {
  if (id === "umum") return;
  const target = TOPIK_LIST.find((x) => x.id === id);
  if (!target) return;
  if (!confirm(`Hapus topik "${target.label}"? Materi/kuis dengan topik ini akan otomatis dialihkan ke "Umum".`)) return;
  const list = (Array.isArray(D.topik_list) ? D.topik_list : TOPIK_LIST).filter((x) => x.id !== id);
  D.topik_list = syncTopikGlobals(list);
  (D.materi || []).forEach((m) => { if (m.topik === id) m.topik = "umum"; });
  (D.quiz || []).forEach((q) => { if (q.topik === target.label) q.topik = "Umum"; });
  save();
  draw();
  toast(`Topik "${target.label}" dihapus`);
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