/* Modul Presensi & Rekap Excel */
let A, filterKelas = "Semua";

function getAbsenPertemuanLabel(aObj) {
  if (!aObj || !aObj.kelas) return aObj && aObj.id ? "Ubah Presensi" : "Tambah Presensi";
  const classList = (D.absen || [])
    .filter((x) => x.kelas === aObj.kelas)
    .sort((a, b) => String(a.tanggal || "").localeCompare(String(b.tanggal || "")));
  const idx = classList.findIndex((x) => x.id === aObj.id);
  const num = idx !== -1 ? idx + 1 : classList.length + 1;
  return `Pertemuan ${num}`;
}

function pAbsen() {
  if (!edit) {
    const allList = [...(D.absen || [])].reverse().sort((a, b) => {
      return String(b.tanggal || "").localeCompare(String(a.tanggal || ""));
    });
    const list = allList.filter(
      (x) => filterKelas === "Semua" || x.kelas === filterKelas,
    );
    const items = list
      .map((x) => {
        const h = x.siswa.filter((s) => s.status === "Hadir").length;
        const s = x.siswa.filter((s) => s.status === "Sakit").length;
        const i = x.siswa.filter((s) => s.status === "Izin").length;
        const a = x.siswa.filter((s) => s.status === "Alpa").length;
        const b = x.siswa.filter((s) => !s.status).length;
        return `
          <div class="crud-card">
            <div class="crud-card-left">
              <h3 class="crud-card-title">Kelas ${esc(x.kelas)} · ${esc(fmtTanggal(x.tanggal))}</h3>
              <div class="crud-card-sub">Topik: ${esc(x.topik || "Umum")} · Total ${x.siswa.length} siswa</div>
              <div class="row" style="margin-top:6px;gap:6px">
                <span class="badge h">Hadir: ${h}</span>
                <span class="badge s">Sakit: ${s}</span>
                <span class="badge i">Izin: ${i}</span>
                <span class="badge a">Alpa: ${a}</span>
                ${b ? `<span class="badge" style="background:#f1f5f9;color:#64748b">Belum: ${b}</span>` : ""}
              </div>
            </div>
            <div class="crud-actions">
              <button class="btn sm ghost" onclick="expExcel('${x.id}')" style="display:inline-flex;align-items:center;gap:6px;font-weight:600;padding:8px 14px;border-radius:10px;font-size:13px" title="Unduh Rekap Excel">📥 Unduh Excel</button>
              <button class="crud-btn-icon" onclick="edit='${x.id}';draw()" title="Buka / Ubah">${ICON_EDIT}</button>
              <button class="crud-btn-icon del" onclick="del('absen','${x.id}')" title="Hapus">${ICON_TRASH}</button>
            </div>
          </div>`;
      })
      .join("");

    return `
      ${filterKelas === "Semua"
        ? renderBreadcrumb([{ label: "Absensi" }])
        : renderBreadcrumb([
            { label: "Absensi", onClick: "filterKelas='Semua';draw()" },
            { label: filterKelas.startsWith("Kelas") ? filterKelas : "Kelas " + filterKelas }
          ])
      }
      <div class="crud-header">
        <div style="display:flex;align-items:center;gap:12px;flex:1;flex-wrap:wrap">
          <div class="crud-search-wrap">
            ${ICON_SEARCH}
            <input type="text" class="crud-search-input" placeholder="Cari presensi (kelas/topik)..." oninput="onCrudSearch(this.value)" />
          </div>
          <select onchange="filterKelas=this.value;draw()" style="width:auto;padding:10px 14px;border-radius:12px;font-size:13.5px;font-weight:600;background:#fff;border:1.5px solid #e2e8f0;cursor:pointer">
            <option value="Semua" ${filterKelas === "Semua" ? "selected" : ""}>Semua Kelas</option>
            ${getKelasList().map((k) => `<option value="${k}" ${filterKelas === k ? "selected" : ""}>Kelas ${k}</option>`).join("")}
          </select>
        </div>
        <button class="crud-btn-add" onclick="edit='new';draw()">${ICON_PLUS} Tambah</button>
      </div>
      <div class="crud-card-list">
        ${items || `<div class="crud-empty">Belum ada catatan presensi. Klik tombol <b>+ Tambah</b> untuk membuat baru.</div>`}
      </div>
    `;
  }

  if (!A || A._for !== edit) {
    const defaultKls = filterKelas !== "Semua" ? filterKelas : "";
    const master = defaultKls ? (D.kelas_siswa || {})[defaultKls] || [] : [];
    A = structuredClone(
      (D.absen || []).find((x) => x.id === edit) || {
        tanggal: new Date().toISOString().slice(0, 10),
        kelas: defaultKls,
        topik: "",
        siswa: master.map((nama) => ({
          nama,
          status: "",
          catatan: "",
        })),
      },
    );
    A._for = edit;
  }

  /* Perhitungan ringkasan otomatis */
  const totalSiswa = A.siswa.length;
  const countH = A.siswa.filter((s) => s.status === "Hadir").length;
  const countS = A.siswa.filter((s) => s.status === "Sakit").length;
  const countI = A.siswa.filter((s) => s.status === "Izin").length;
  const countA = A.siswa.filter((s) => s.status === "Alpa").length;
  const countBelum = A.siswa.filter((s) => !s.status).length;
  const persenHadir = totalSiswa ? Math.round((countH / totalSiswa) * 100) : 0;

  const klsLabel = A.kelas ? (A.kelas.startsWith("Kelas") ? A.kelas : `Kelas ${A.kelas}`) : "";
  const pertemuanLabel = getAbsenPertemuanLabel(A);

  const crumbs = [
    { label: "Absensi", onClick: "edit=null;A=null;filterKelas='Semua';draw()" },
  ];
  if (klsLabel) {
    crumbs.push({
      label: klsLabel,
      onClick: `edit=null;A=null;filterKelas='${esc(A.kelas)}';draw()`,
    });
  }
  crumbs.push({ label: pertemuanLabel });

  return `
    ${renderBreadcrumb(crumbs)}
    <div class="absen-layout">
      <!-- Kolom Kiri Bagian 1: Form Tanggal, Pilih Kelas, Topik -->
      <div class="absen-form-section">
        <div class="panel" style="margin-bottom:0">
          <div class="row" style="justify-content:space-between;align-items:center;margin-bottom:16px">
            <h3 style="margin:0">${A.id ? "Ubah" : "Tambah"} Presensi</h3>
          </div>
          <div class="form-grid-2">
            <div>
              <label style="margin-top:0">Tanggal</label>
              <input type="date" id="a_tgl" value="${esc(A.tanggal)}" onchange="syncA();draw()">
            </div>
            <div>
              <label style="margin-top:0">Pilih Kelas</label>
              <select id="a_kls" onchange="onAbsenKelasChange(this.value)">
                <option value="" ${!A.kelas ? "selected" : ""}>-- Pilih Kelas --</option>
                ${getKelasList().map((k) => `<option value="${k}" ${A.kelas === k ? "selected" : ""}>Kelas ${k}</option>`).join("")}
              </select>
            </div>
          </div>
          <div style="margin-top:14px">
            <label style="margin-top:0">Topik Pembelajaran</label>
            <input id="a_topik" value="${esc(A.topik)}" placeholder="Topik bahasan materi...">
          </div>
        </div>
      </div>

      <!-- Kolom Kanan: Kartu Ringkasan (Sticky 280px) -->
      <div class="absen-sidebar">
        <div class="absen-summary-card">
          <h4 class="absen-summary-title">Ringkasan Kehadiran</h4>

          <div class="absen-percent-box">
            <span class="absen-percent-num">${persenHadir}%</span>
            <span class="absen-percent-label">Persentase Hadir</span>
            <div class="absen-progress-wrap">
              <div class="absen-progress-bar" style="width:${persenHadir}%"></div>
            </div>
          </div>

          <div class="absen-stat-grid">
            <div class="absen-stat-item h">
              <span class="absen-stat-label">Hadir (H)</span>
              <span class="absen-stat-count">${countH}</span>
            </div>
            <div class="absen-stat-item s">
              <span class="absen-stat-label">Sakit (S)</span>
              <span class="absen-stat-count">${countS}</span>
            </div>
            <div class="absen-stat-item i">
              <span class="absen-stat-label">Izin (I)</span>
              <span class="absen-stat-count">${countI}</span>
            </div>
            <div class="absen-stat-item a">
              <span class="absen-stat-label">Alpa (A)</span>
              <span class="absen-stat-count">${countA}</span>
            </div>
          </div>

          ${countBelum > 0 ? `<div class="absen-stat-pending">Belum ditandai: <b>${countBelum}</b> dari ${totalSiswa} siswa</div>` : ""}

          <div class="absen-sidebar-actions">
            <button type="button" class="btn" style="width:100%;text-align:center" onclick="sA()">Simpan Absensi</button>
            <button type="button" class="btn ghost" style="width:100%;text-align:center" onclick="edit=null;A=null;draw()">Batal</button>
          </div>
        </div>
      </div>

      <!-- Kolom Kiri Bagian 2: Daftar Siswa -->
      <div class="absen-list-section">
        <div class="panel" style="margin-bottom:0">
          <div style="margin-bottom:14px;font-weight:700;font-size:15px;color:var(--text)">
            Kehadiran Siswa ${A.kelas ? "Kelas " + esc(A.kelas) + " (" + totalSiswa + " siswa)" : ""}
          </div>

          <div style="display:flex;flex-direction:column;gap:8px" id="siswa_list">
            ${totalSiswa
              ? A.siswa
                .map(
                  (s, idx) => `
              <div class="item" style="padding:10px 12px;gap:12px;background:var(--bg);border-radius:var(--radius-sm);border-bottom:none">
                <div style="flex:1;min-width:180px;display:flex;align-items:center;gap:10px">
                  <span style="font-size:13px;color:var(--text-muted);font-weight:700;width:24px;text-align:right">${idx + 1}.</span>
                  <span style="font-weight:700;font-size:14px;color:var(--text)">${esc(s.nama)}</span>
                </div>
                <div class="status-btn-group" data-idx="${idx}">
                  <button type="button" class="status-btn h ${s.status === 'Hadir' ? 'active' : ''}" onclick="setSiswaStatus(${idx}, 'Hadir')">H</button>
                  <button type="button" class="status-btn s ${s.status === 'Sakit' ? 'active' : ''}" onclick="setSiswaStatus(${idx}, 'Sakit')">S</button>
                  <button type="button" class="status-btn i ${s.status === 'Izin' ? 'active' : ''}" onclick="setSiswaStatus(${idx}, 'Izin')">I</button>
                  <button type="button" class="status-btn a ${s.status === 'Alpa' ? 'active' : ''}" onclick="setSiswaStatus(${idx}, 'Alpa')">A</button>
                </div>
                <div style="width:200px">
                  <input data-idx="${idx}" data-field="catatan" value="${esc(s.catatan || '')}" placeholder="Catatan" style="padding:6px 10px;font-size:13px;background:var(--surface)">
                </div>
              </div>
            `,
                )
                .join("")
              : !A.kelas
                ? `<div class="empty" style="padding:24px">Pilih kelas terlebih dahulu.</div>`
                : `<div class="empty" style="padding:24px">Kelas <b>${esc(A.kelas)}</b> belum memiliki data siswa.</div>`
            }
          </div>
        </div>
      </div>
    </div>
  `;
}

function onAbsenKelasChange(val) {
  syncA();
  A.kelas = val;
  if (!val) {
    A.siswa = [];
  } else {
    const master = (D.kelas_siswa || {})[val] || [];
    A.siswa = master.map((nama) => ({
      nama,
      status: "",
      catatan: "",
    }));
  }
  draw();
}

function syncA() {
  if (!A) return;
  if ($("#a_tgl")) A.tanggal = $("#a_tgl").value;
  if ($("#a_kls")) A.kelas = $("#a_kls").value;
  if ($("#a_topik")) A.topik = $("#a_topik").value;
  document.querySelectorAll("#siswa_list input[data-field='catatan']").forEach((inp) => {
    const idx = +inp.dataset.idx;
    if (A.siswa[idx]) A.siswa[idx].catatan = inp.value;
  });
}

function setSiswaStatus(idx, status) {
  syncA();
  if (A.siswa[idx]) {
    A.siswa[idx].status = A.siswa[idx].status === status ? "" : status;
    draw();
  }
}

function sA() {
  syncA();
  if (!A.tanggal) return toast("Tanggal wajib diisi");
  if (!A.kelas.trim()) return toast("Kelas wajib diisi");
  if (!A.siswa.length)
    return toast("Belum ada data siswa di kelas ini. Masukkan di menu Data Siswa.");
  const existing = (D.absen || []).find((x) => x.id === A.id);
  const now = Date.now();
  const o = {
    ...A,
    id: A.id || Store.uid("a"),
    createdAt: A.createdAt || existing?.createdAt || now,
    updatedAt: now,
  };
  delete o._for;
  D.absen = D.absen || [];
  up(D.absen, o);
  A = null;
  edit = null;
  save();
  draw();
}

function expExcel(id) {
  const s = (D.absen || []).find((x) => x.id === id);
  if (!s) return;
  const h = s.siswa.filter((x) => x.status === "Hadir").length;
  const sk = s.siswa.filter((x) => x.status === "Sakit").length;
  const i = s.siswa.filter((x) => x.status === "Izin").length;
  const a = s.siswa.filter((x) => x.status === "Alpa").length;
  const b = s.siswa.filter((x) => !x.status).length;

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Presensi</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
    <style>
      table { border-collapse: collapse; font-family: Calibri, sans-serif; }
      th, td { border: 1px solid #b0b0b0; padding: 6px 12px; font-size: 11pt; }
      th { background-color: #0891b2; color: #ffffff; font-weight: bold; text-align: center; }
      .center { text-align: center; }
      .hadir { background-color: #dcfce7; color: #15803d; font-weight: bold; text-align: center; }
      .sakit { background-color: #e0f2fe; color: #0369a1; font-weight: bold; text-align: center; }
      .izin { background-color: #fef3c7; color: #92400e; font-weight: bold; text-align: center; }
      .alpa { background-color: #fee2e2; color: #b91c1c; font-weight: bold; text-align: center; }
      .title { font-size: 14pt; font-weight: bold; color: #083344; }
      .meta { background-color: #f8fafc; font-weight: bold; }
    </style>
    </head>
    <body>
      <table>
        <tr><td colspan="4" class="title">REKAPITULASI PRESENSI - KELAS ${esc(s.kelas)}</td></tr>
        <tr><td class="meta">Tanggal</td><td colspan="3">${esc(fmtTanggal(s.tanggal))}</td></tr>
        <tr><td class="meta">Materi / Topik</td><td colspan="3">${esc(s.topik || "-")}</td></tr>
        <tr><td class="meta">Ringkasan Kehadiran</td><td colspan="3">Total Siswa: ${s.siswa.length} | Hadir: ${h} | Sakit: ${sk} | Izin: ${i} | Alpa: ${a}${b ? " | Belum Dipilih: " + b : ""}</td></tr>
        <tr><td colspan="4"></td></tr>
        <tr>
          <th style="width:50px">No</th>
          <th style="width:260px">Nama Siswa</th>
          <th style="width:140px">Status Kehadiran</th>
          <th style="width:220px">Keterangan / Catatan</th>
        </tr>
        ${s.siswa
      .map((item, idx) => {
        const stClass =
          item.status === "Hadir"
            ? "hadir"
            : item.status === "Sakit"
              ? "sakit"
              : item.status === "Izin"
                ? "izin"
                : item.status === "Alpa"
                  ? "alpa"
                  : "center";
        return `<tr>
            <td class="center">${idx + 1}</td>
            <td>${esc(item.nama)}</td>
            <td class="${stClass}">${esc(item.status || "-")}</td>
            <td>${esc(item.catatan || "")}</td>
          </tr>`;
      })
      .join("")}
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([html], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  const elem = document.createElement("a");
  elem.href = URL.createObjectURL(blob);
  const cleanKls = (s.kelas || "Kelas").replace(/\s+/g, "_");
  elem.download = `Presensi_${cleanKls}_${s.tanggal}.xls`;
  elem.click();
}

