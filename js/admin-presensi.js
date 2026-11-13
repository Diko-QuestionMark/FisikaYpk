/* Modul Presensi & Rekap Excel */
let A, filterKelas = "Semua";

function pAbsen() {
  if (!edit) {
    const allList = D.absen || [];
    const list = allList.filter(
      (x) => filterKelas === "Semua" || x.kelas === filterKelas,
    );
    const items = list
      .map((x, idx) => {
        const h = x.siswa.filter((s) => s.status === "Hadir").length;
        const s = x.siswa.filter((s) => s.status === "Sakit").length;
        const i = x.siswa.filter((s) => s.status === "Izin").length;
        const a = x.siswa.filter((s) => s.status === "Alpa").length;
        const b = x.siswa.filter((s) => !s.status).length;
        const content = `<b>${esc(x.kelas)} · ${esc(fmtTanggal(x.tanggal))}</b>
          <div class="hint">Topik: ${esc(x.topik || "Umum")} · Total: ${x.siswa.length} siswa</div>
          <div class="row" style="margin-top:6px;gap:6px">
            <span class="badge h">Hadir: ${h}</span>
            <span class="badge s">Sakit: ${s}</span>
            <span class="badge i">Izin: ${i}</span>
            <span class="badge a">Alpa: ${a}</span>
            ${b ? `<span class="badge" style="background:var(--border);color:var(--text-muted)">Belum: ${b}</span>` : ""}
          </div>`;
        const actions = `<button class="btn sm ghost" onclick="edit='${x.id}';draw()">Buka</button>
          <button class="btn sm" onclick="expExcel('${x.id}')">Unduh Excel</button>
          <button class="btn sm del" onclick="del('absen','${x.id}')">Hapus</button>`;
        return uiItem(idx, content, actions);
      })
      .join("");

    const filterHeader = `<div class="row" style="gap:10px;align-items:center">
      <b>Daftar (${list.length})</b>
      <select onchange="filterKelas=this.value;draw()" style="width:auto;padding:5px 10px;font-size:13px">
        <option value="Semua" ${filterKelas === "Semua" ? "selected" : ""}>Semua Kelas</option>
        ${getKelasList().map((k) => `<option value="${k}" ${filterKelas === k ? "selected" : ""}>${k}</option>`).join("")}
      </select>
    </div>`;

    return uiPanel({
      headerLeft: filterHeader,
      headerRight: `<button class="btn sm" onclick="edit='new';draw()">${ICON_PLUS}Tambah</button>`,
      content: items,
    });
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

  return `<div class="panel">
    <b>${A.id ? "Ubah" : "Tambah"} Presensi</b>
    <div class="row" style="gap:14px;margin-top:10px">
      <div style="flex:1;min-width:200px">
        <label>Tanggal</label>
        <input type="date" id="a_tgl" value="${esc(A.tanggal)}" onchange="syncA();draw()">
        <div class="hint">${fmtTanggal(A.tanggal)}</div>
      </div>
      <div style="flex:1;min-width:200px">
        <label>Pilih Kelas</label>
        <select id="a_kls" onchange="onAbsenKelasChange(this.value)">
          <option value="" ${!A.kelas ? "selected" : ""}>-- Pilih Kelas --</option>
          ${getKelasList().map((k) => `<option value="${k}" ${A.kelas === k ? "selected" : ""}>${k}</option>`).join("")}
        </select>
      </div>
    </div>
    <label>Materi / Topik Pembelajaran</label>
    <input id="a_topik" value="${esc(A.topik)}" placeholder="Tuliskan topik bahasan atau aktivitas pertemuan ini">

    <div style="margin-top:24px;border-top:1px solid var(--border);padding-top:18px">
      <div style="margin-bottom:12px">
        <b>Daftar Kehadiran Siswa ${A.kelas ? "Kelas " + esc(A.kelas) + " (" + A.siswa.length + " siswa)" : ""}</b>
        <div class="hint">Pilih status kehadiran: H (Hadir), S (Sakit), I (Izin), atau A (Alpa)</div>
      </div>

      <div style="display:flex;flex-direction:column;gap:8px" id="siswa_list">
        ${
          A.siswa.length
            ? A.siswa
                .map(
                  (s, idx) => `
          <div class="item" style="padding:10px 12px;gap:12px;background:var(--bg);border-radius:8px;border-bottom:none">
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
              <input data-idx="${idx}" data-field="catatan" value="${esc(s.catatan || '')}" placeholder="Keterangan / Catatan" style="padding:6px 10px;font-size:13px;background:var(--surface)">
            </div>
          </div>
        `,
                )
                .join("")
            : !A.kelas
              ? `<div class="empty" style="padding:24px">Silakan pilih kelas terlebih dahulu untuk memuat daftar siswa.</div>`
              : `<div class="empty" style="padding:24px">Kelas <b>${esc(A.kelas)}</b> belum memiliki data siswa.<br><span class="hint">Silakan masukkan daftar nama siswa di menu <b>👥 Data Siswa</b> terlebih dahulu.</span></div>`
        }
      </div>
    </div>

    <div style="margin-top:24px;border-top:1px solid var(--border)">
      ${uiFormActions("sA()", "edit=null;A=null;draw()", "Simpan Presensi")}
    </div>
  </div>`;
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
  const o = { ...A, id: A.id || Store.uid("a") };
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

