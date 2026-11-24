/* Modul Presensi & Rekap Excel — Alur: Pilih Kelas → Pilih Pertemuan (1–16+) → Isi Absensi */
const DEFAULT_PERTEMUAN = 16;
let A = null;
let curAbsenKls = null;
let curPertemuanNo = null;

function getKelasBadge(kls) {
  const clean = String(kls || "").replace(/^kelas\s+/i, "").trim();
  const up = clean.toUpperCase();
  if (/^(XII|12)\b/.test(up)) return { label: "XII", bg: "#f3e8ff", color: "#7e22ce", bar: "#9333ea" };
  if (/^(XI|11)\b/.test(up)) return { label: "XI", bg: "#dcfce7", color: "#15803d", bar: "#16a34a" };
  if (/^(X|10)\b/.test(up)) return { label: "X", bg: "#e0f2fe", color: "#0369a1", bar: "#0284c7" };
  const short = (clean.split(/\s+/)[0] || "K").slice(0, 3).toUpperCase();
  return { label: short, bg: "var(--primary-soft)", color: "var(--primary)", bar: "var(--primary)" };
}

function formatKelasLabel(kls) {
  if (!kls) return "";
  return /^kelas\b/i.test(kls) ? kls : `Kelas ${kls}`;
}

function getPertemuanByKelas(kls) {
  const chronological = (D.absen || [])
    .filter((x) => x.kelas === kls)
    .sort((a, b) => {
      const cmp = String(a.tanggal || "").localeCompare(String(b.tanggal || ""));
      return cmp !== 0 ? cmp : (a.createdAt || 0) - (b.createdAt || 0);
    });

  return chronological
    .map((x, i) => {
      const num = parseInt(x.pertemuan, 10);
      return { ...x, _no: Number.isFinite(num) && num >= 1 ? num : i + 1 };
    })
    .sort((a, b) => {
      if (a._no !== b._no) return a._no - b._no;
      const cmp = String(a.tanggal || "").localeCompare(String(b.tanggal || ""));
      return cmp !== 0 ? cmp : (a.createdAt || 0) - (b.createdAt || 0);
    });
}

function getJumlahSlotPertemuan(kls) {
  const saved = (D.kelas_pertemuan && parseInt(D.kelas_pertemuan[kls], 10)) || DEFAULT_PERTEMUAN;
  const list = getPertemuanByKelas(kls);
  const maxExisting = list.length ? Math.max(...list.map((x) => x._no)) : 0;
  return Math.max(DEFAULT_PERTEMUAN, saved, maxExisting);
}

function openAbsenKelas(kls) {
  curAbsenKls = kls;
  curPertemuanNo = null;
  edit = null;
  A = null;
  draw();
}

function openPertemuan(no) {
  if (!curAbsenKls) return;
  const existing = getPertemuanByKelas(curAbsenKls).find((x) => x._no === no);
  curPertemuanNo = no;
  edit = existing ? existing.id : "new";
  A = null;
  draw();
}

function tambahSlotPertemuan() {
  if (!curAbsenKls) return;
  D.kelas_pertemuan = D.kelas_pertemuan || {};
  const nextNo = getJumlahSlotPertemuan(curAbsenKls) + 1;
  D.kelas_pertemuan[curAbsenKls] = nextNo;
  save();
  openPertemuan(nextNo);
}

function pAbsen() {
  D.kelas_siswa = D.kelas_siswa || {};
  D.absen = D.absen || [];

  /* LEVEL 1: Daftar Kelas */
  if (!curAbsenKls && !edit) {
    const klsList = [...getKelasList()].sort((a, b) => {
      if (typeof getKelasMeta === "function") {
        const ma = getKelasMeta(a);
        const mb = getKelasMeta(b);
        if (ma.order !== mb.order) return ma.order - mb.order;
        return ma.clean.localeCompare(mb.clean, "id", { numeric: true });
      }
      return String(a).localeCompare(String(b), "id", { numeric: true });
    });
    const cards = klsList
      .map((k, idx) => {
        const pertemuanList = getPertemuanByKelas(k);
        const totalSlot = getJumlahSlotPertemuan(k);
        const jumlahSiswa = (D.kelas_siswa[k] || []).length;
        const safeK = esc(k).replace(/'/g, "\\'");
        const badge = getKelasBadge(k);
        const meta = typeof getKelasMeta === "function" ? getKelasMeta(k) : null;
        const iconBg = meta ? meta.bg : badge.bg;
        const iconHtml = typeof getKelasIcon === "function"
          ? `<div style="width:44px;height:44px;border-radius:12px;background:${iconBg};display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">${getKelasIcon(k, idx)}</div>`
          : `<div style="width:44px;height:44px;border-radius:12px;background:${badge.bg};color:${badge.color};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;flex-shrink:0;letter-spacing:-0.02em">${esc(badge.label)}</div>`;
        const pct = totalSlot ? Math.min(100, Math.round((pertemuanList.length / totalSlot) * 100)) : 0;

        return `
          <div class="crud-card" style="cursor:pointer" onclick="openAbsenKelas('${safeK}')">
            <div style="display:flex;align-items:center;gap:14px;min-width:0;flex:1">
              ${iconHtml}
              <div class="crud-card-left">
                <h3 class="crud-card-title">${esc(formatKelasLabel(k))}</h3>
                <div class="crud-card-sub">
                  ${pertemuanList.length} / ${totalSlot} pertemuan diisi · ${jumlahSiswa} siswa
                </div>
                <div style="margin-top:6px;height:5px;max-width:190px;background:var(--border);border-radius:999px;overflow:hidden">
                  <div style="height:100%;width:${pct}%;background:${badge.bar};border-radius:999px;transition:width 0.3s ease"></div>
                </div>
              </div>
            </div>
            <div class="crud-actions">
              <button type="button" class="btn sm ghost" onclick="event.stopPropagation();openAbsenKelas('${safeK}')">Pilih Pertemuan →</button>
            </div>
          </div>`;
      })
      .join("");

    return `
      ${renderBreadcrumb([{ label: "Absensi" }])}
      <div class="crud-header">
        <div class="crud-search-wrap">
          ${ICON_SEARCH}
          <input type="text" class="crud-search-input" placeholder="Cari nama kelas..." oninput="onCrudSearch(this.value)" />
        </div>
      </div>
      <div class="crud-card-list">
        ${
          cards ||
          `<div class="crud-empty">Belum ada kelas terdaftar. Tambahkan kelas terlebih dahulu di menu <b>Data Siswa</b>.</div>`
        }
      </div>
    `;
  }

  /* LEVEL 2: Daftar Pertemuan (1 sampai N, default 16) */
  if (curAbsenKls && !edit) {
    const klsLabel = formatKelasLabel(curAbsenKls);
    const totalSlot = getJumlahSlotPertemuan(curAbsenKls);
    const byNo = new Map(getPertemuanByKelas(curAbsenKls).map((x) => [x._no, x]));
    const safeKls = esc(curAbsenKls).replace(/'/g, "\\'");

    const items = Array.from({ length: totalSlot }, (_, idx) => {
      const no = idx + 1;
      const x = byNo.get(no);

      if (!x) {
        return `
          <div class="crud-card" style="cursor:pointer;border-style:dashed" onclick="openPertemuan(${no})">
            <div class="crud-card-left">
              <h3 class="crud-card-title">Pertemuan ${no}</h3>
              <div class="crud-card-sub">Belum diisi · Klik untuk mulai absensi</div>
            </div>
            <div class="crud-actions" onclick="event.stopPropagation()">
              <button type="button" class="btn sm ghost" onclick="openPertemuan(${no})">Isi Absen →</button>
            </div>
          </div>`;
      }

      const h = x.siswa.filter((s) => s.status === "Hadir").length;
      const s = x.siswa.filter((s) => s.status === "Sakit").length;
      const i = x.siswa.filter((s) => s.status === "Izin").length;
      const a = x.siswa.filter((s) => s.status === "Alpa").length;
      const b = x.siswa.filter((s) => !s.status).length;

      return `
        <div class="crud-card" style="cursor:pointer" onclick="openPertemuan(${no})">
          <div class="crud-card-left">
            <h3 class="crud-card-title">Pertemuan ${no} · ${esc(fmtTanggal(x.tanggal))}</h3>
            <div class="crud-card-sub">Topik: ${esc(x.topik || "Umum")}</div>
            <div class="row" style="margin-top:6px;gap:6px">
              <span class="badge h">Hadir: ${h}</span>
              <span class="badge s">Sakit: ${s}</span>
              <span class="badge i">Izin: ${i}</span>
              <span class="badge a">Alpa: ${a}</span>
              ${b ? `<span class="badge" style="background:#f1f5f9;color:#64748b">Belum: ${b}</span>` : ""}
            </div>
          </div>
          <div class="crud-actions" onclick="event.stopPropagation()">
            <button type="button" class="btn sm ghost" onclick="expExcel('${x.id}')" style="display:inline-flex;align-items:center;gap:6px;font-weight:600;padding:8px 14px;border-radius:10px;font-size:13px" title="Unduh Rekap Excel">📥 Unduh Excel</button>
            <button type="button" class="crud-btn-icon" onclick="openPertemuan(${no})" title="Buka / Ubah">${ICON_EDIT}</button>
            <button type="button" class="crud-btn-icon del" onclick="del('absen','${x.id}')" title="Hapus">${ICON_TRASH}</button>
          </div>
        </div>`;
    }).join("");

    return `
      ${renderBreadcrumb([
        { label: "Absensi", onClick: "curAbsenKls=null;curPertemuanNo=null;edit=null;A=null;draw()" },
        { label: klsLabel },
      ])}
      <div class="crud-header">
        <div class="crud-search-wrap">
          ${ICON_SEARCH}
          <input type="text" class="crud-search-input" placeholder="Cari pertemuan, topik, atau tanggal..." oninput="onCrudSearch(this.value)" />
        </div>
        <div class="row" style="gap:10px">
          <button type="button" class="btn ghost" style="padding:10px 16px;font-size:14px;border-radius:12px" onclick="expExcelSemester('${safeKls}')">📊 Rekap 1 Semester</button>
          <button type="button" class="crud-btn-add" onclick="tambahSlotPertemuan()">${ICON_PLUS} Tambah Pertemuan</button>
        </div>
      </div>
      <div class="crud-card-list">
        ${items}
      </div>
    `;
  }

  /* LEVEL 3: Form Isi / Ubah Absensi Pertemuan */
  const cacheKey = `${edit}:${curPertemuanNo || ""}`;
  if (!A || A._for !== cacheKey) {
    const existing = D.absen.find((x) => x.id === edit);
    const defaultKls = existing ? existing.kelas : (curAbsenKls || "");
    const master = defaultKls ? (D.kelas_siswa[defaultKls] || []) : [];
    const existingResolved = existing
      ? getPertemuanByKelas(existing.kelas).find((x) => x.id === existing.id)
      : null;
    const pNo = curPertemuanNo || (existingResolved ? existingResolved._no : 1);

    A = structuredClone(
      existing || {
        pertemuan: pNo,
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
    A.pertemuan = parseInt(A.pertemuan, 10) >= 1 ? parseInt(A.pertemuan, 10) : pNo;
    A._for = cacheKey;
    if (A.kelas && !curAbsenKls) curAbsenKls = A.kelas;
  }

  const masterSiswa = A.kelas ? (D.kelas_siswa[A.kelas] || []) : [];
  const existingNames = new Set(A.siswa.map((s) => String(s.nama || "").trim().toLowerCase()));
  const siswaBaruCount = masterSiswa.filter(
    (n) => !existingNames.has(String(n || "").trim().toLowerCase()),
  ).length;

  const totalSiswa = A.siswa.length;
  const countH = A.siswa.filter((s) => s.status === "Hadir").length;
  const countS = A.siswa.filter((s) => s.status === "Sakit").length;
  const countI = A.siswa.filter((s) => s.status === "Izin").length;
  const countA = A.siswa.filter((s) => s.status === "Alpa").length;
  const countBelum = A.siswa.filter((s) => !s.status).length;
  const persenHadir = totalSiswa ? Math.round((countH / totalSiswa) * 100) : 0;

  const klsLabel = formatKelasLabel(A.kelas);
  const pertemuanLabel = `Pertemuan ${A.pertemuan}`;

  const crumbs = [
    { label: "Absensi", onClick: "curAbsenKls=null;curPertemuanNo=null;edit=null;A=null;draw()" },
  ];
  if (klsLabel) {
    crumbs.push({
      label: klsLabel,
      onClick: "curPertemuanNo=null;edit=null;A=null;draw()",
    });
  }
  crumbs.push({ label: pertemuanLabel });

  return `
    ${renderBreadcrumb(crumbs)}
    <div class="absen-layout">
      <!-- Kolom Kiri Bagian 1: Info Tanggal & Topik -->
      <div class="absen-form-section">
        <div class="panel" style="margin-bottom:0">
          <div class="row" style="justify-content:space-between;align-items:center;margin-bottom:16px">
            <h3 style="margin:0">${esc(pertemuanLabel)}${klsLabel ? ` · ${esc(klsLabel)}` : ""}</h3>
          </div>
          <div class="form-grid-2">
            <div>
              <label style="margin-top:0">Tanggal</label>
              <input type="date" id="a_tgl" value="${esc(A.tanggal)}" onchange="syncA();draw()">
            </div>
            <div>
              <label style="margin-top:0">Topik Pembelajaran</label>
              <input id="a_topik" value="${esc(A.topik)}" placeholder="Topik bahasan materi...">
            </div>
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
            <button type="button" class="btn ghost" style="width:100%;text-align:center" onclick="curPertemuanNo=null;edit=null;A=null;draw()">Batal</button>
          </div>
        </div>
      </div>

      <!-- Kolom Kiri Bagian 2: Daftar Siswa -->
      <div class="absen-list-section">
        <div class="panel" style="margin-bottom:0">
          <div class="row" style="justify-content:space-between;align-items:center;margin-bottom:14px">
            <div style="font-weight:700;font-size:15px;color:var(--text)">
              Kehadiran Siswa ${A.kelas ? `${esc(klsLabel)} (${totalSiswa} siswa)` : ""}
            </div>
            <div class="row" style="gap:8px">
              ${
                siswaBaruCount > 0
                  ? `<button type="button" class="btn sm ghost" onclick="sinkronkanSiswaAbsen()" title="Tambahkan siswa baru dari Data Siswa">↻ Sinkronkan (+${siswaBaruCount} baru)</button>`
                  : ""
              }
              ${
                totalSiswa
                  ? `<button type="button" class="btn sm ghost" onclick="setAllSiswaHadir()">✓ Hadir Semua</button>`
                  : ""
              }
            </div>
          </div>

          <div style="display:flex;flex-direction:column;gap:8px" id="siswa_list">
            ${
              totalSiswa
                ? A.siswa
                    .map(
                      (s, idx) => `
              <div class="item" style="padding:10px 12px;gap:12px;background:var(--bg);border-radius:var(--radius-sm);border-bottom:none">
                <div style="flex:1;min-width:180px;display:flex;align-items:center;gap:10px">
                  <span style="font-size:13px;color:var(--text-muted);font-weight:700;width:24px;text-align:right">${idx + 1}.</span>
                  <span style="font-weight:700;font-size:14px;color:var(--text)">${esc(s.nama)}</span>
                </div>
                <div class="status-btn-group" data-idx="${idx}">
                  <button type="button" class="status-btn h ${s.status === "Hadir" ? "active" : ""}" onclick="setSiswaStatus(${idx}, 'Hadir')">H</button>
                  <button type="button" class="status-btn s ${s.status === "Sakit" ? "active" : ""}" onclick="setSiswaStatus(${idx}, 'Sakit')">S</button>
                  <button type="button" class="status-btn i ${s.status === "Izin" ? "active" : ""}" onclick="setSiswaStatus(${idx}, 'Izin')">I</button>
                  <button type="button" class="status-btn a ${s.status === "Alpa" ? "active" : ""}" onclick="setSiswaStatus(${idx}, 'Alpa')">A</button>
                </div>
                <div style="width:200px">
                  <input data-idx="${idx}" data-field="catatan" value="${esc(s.catatan || "")}" placeholder="Catatan" style="padding:6px 10px;font-size:13px;background:var(--surface)">
                </div>
              </div>`,
                    )
                    .join("")
                : `<div class="empty" style="padding:24px"><b>${esc(klsLabel || "Kelas ini")}</b> belum memiliki data siswa.</div>`
            }
          </div>
        </div>
      </div>
    </div>
  `;
}

function syncA() {
  if (!A) return;
  if ($("#a_tgl")) A.tanggal = $("#a_tgl").value;
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

function sinkronkanSiswaAbsen() {
  syncA();
  if (!A || !A.kelas) return;
  const master = (D.kelas_siswa || {})[A.kelas] || [];
  const existingNames = new Set(A.siswa.map((s) => String(s.nama || "").trim().toLowerCase()));
  let added = 0;
  master.forEach((nama) => {
    const key = String(nama || "").trim().toLowerCase();
    if (key && !existingNames.has(key)) {
      A.siswa.push({ nama, status: "", catatan: "" });
      existingNames.add(key);
      added++;
    }
  });
  if (!added) return toast("Daftar siswa sudah sinkron");
  if (typeof isDirty !== "undefined") isDirty = true;
  draw();
  toast(`${added} siswa baru ditambahkan`);
}

function setAllSiswaHadir() {
  syncA();
  if (!A || !A.siswa.length) return;
  A.siswa.forEach((s) => {
    s.status = "Hadir";
  });
  draw();
  toast("Semua siswa ditandai Hadir");
}

function sA() {
  syncA();
  const pNum = parseInt(A.pertemuan, 10) || curPertemuanNo || 1;
  if (!A.tanggal) return toast("Tanggal wajib diisi");
  if (!A.kelas.trim()) return toast("Kelas wajib diisi");
  if (!A.siswa.length)
    return toast("Belum ada data siswa di kelas ini. Masukkan di menu Data Siswa.");

  const existing = (D.absen || []).find((x) => x.id === A.id);
  const now = Date.now();
  const o = {
    ...A,
    pertemuan: pNum,
    id: A.id || Store.uid("a"),
    createdAt: A.createdAt || existing?.createdAt || now,
    updatedAt: now,
  };
  delete o._for;
  D.absen = D.absen || [];
  up(D.absen, o);
  curAbsenKls = o.kelas;
  curPertemuanNo = null;
  A = null;
  edit = null;
  save();
  draw();
}

function expExcel(id) {
  const s = (D.absen || []).find((x) => x.id === id);
  if (!s) return;
  const resolved = getPertemuanByKelas(s.kelas).find((x) => x.id === s.id);
  const pNo = resolved ? resolved._no : (parseInt(s.pertemuan, 10) || 1);
  const total = s.siswa.length;
  const h = s.siswa.filter((x) => x.status === "Hadir").length;
  const sk = s.siswa.filter((x) => x.status === "Sakit").length;
  const i = s.siswa.filter((x) => x.status === "Izin").length;
  const a = s.siswa.filter((x) => x.status === "Alpa").length;
  const b = s.siswa.filter((x) => !x.status).length;
  const persen = total ? Math.round((h / total) * 100) : 0;

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Pertemuan ${pNo}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
      <style>
        table { border-collapse: collapse; font-family: Calibri, Arial, sans-serif; }
        th, td { border: 1px solid #cbd5e1; padding: 7px 12px; font-size: 11pt; vertical-align: middle; }
        th { background-color: #0891b2; color: #ffffff; font-weight: bold; text-align: center; }
        .title { border: none; font-size: 14pt; font-weight: bold; color: #083344; padding: 8px 4px 10px; text-align: left; }
        .spacer { border: none; height: 10px; padding: 0; }
        .meta { background-color: #f1f5f9; font-weight: bold; color: #0f172a; }
        .center { text-align: center; }
        .hadir { background-color: #dcfce7; color: #15803d; font-weight: bold; text-align: center; }
        .sakit { background-color: #e0f2fe; color: #0369a1; font-weight: bold; text-align: center; }
        .izin { background-color: #fef3c7; color: #92400e; font-weight: bold; text-align: center; }
        .alpa { background-color: #fee2e2; color: #b91c1c; font-weight: bold; text-align: center; }
      </style>
    </head>
    <body>
      <table>
        <colgroup>
          <col style="width:48px">
          <col style="width:260px">
          <col style="width:150px">
          <col style="width:240px">
        </colgroup>
        <tr><td colspan="4" class="title">REKAPITULASI PRESENSI - ${esc(formatKelasLabel(s.kelas).toUpperCase())} (PERTEMUAN ${pNo})</td></tr>
        <tr><td colspan="2" class="meta">Pertemuan</td><td colspan="2">Pertemuan ${pNo}</td></tr>
        <tr><td colspan="2" class="meta">Tanggal</td><td colspan="2">${esc(fmtTanggal(s.tanggal))}</td></tr>
        <tr><td colspan="2" class="meta">Materi / Topik</td><td colspan="2">${esc(s.topik || "-")}</td></tr>
        <tr><td colspan="2" class="meta">Ringkasan Kehadiran</td><td colspan="2">Hadir: ${h} (${persen}%) | Sakit: ${sk} | Izin: ${i} | Alpa: ${a}${b ? " | Belum: " + b : ""}</td></tr>
        <tr><td colspan="4" class="spacer"></td></tr>
        <tr>
          <th>No</th>
          <th>Nama Siswa</th>
          <th>Status Kehadiran</th>
          <th>Keterangan / Catatan</th>
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
            <td>${esc(item.catatan || "-")}</td>
          </tr>`;
          })
          .join("")}
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(["\uFEFF" + html], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  const elem = document.createElement("a");
  elem.href = URL.createObjectURL(blob);
  const cleanKls = (s.kelas || "Kelas").replace(/\s+/g, "_");
  elem.download = `Presensi_${cleanKls}_P${pNo}_${s.tanggal}.xls`;
  elem.click();
  setTimeout(() => URL.revokeObjectURL(elem.href), 1000);
}

function expExcelSemester(kls) {
  if (!kls) return;
  const totalSlot = getJumlahSlotPertemuan(kls);
  const pertemuanList = getPertemuanByKelas(kls);
  const byNo = new Map(pertemuanList.map((x) => [x._no, x]));

  const namaSet = new Set((D.kelas_siswa || {})[kls] || []);
  pertemuanList.forEach((p) => {
    (p.siswa || []).forEach((s) => {
      if (s.nama) namaSet.add(s.nama);
    });
  });
  const siswaList = [...namaSet];

  if (!siswaList.length) {
    return toast("Belum ada data siswa di kelas ini");
  }

  const totalCols = 2 + totalSlot + 5;
  const pCols = Array.from({ length: totalSlot }, (_, i) => i + 1);
  const kodeMap = { Hadir: "H", Sakit: "S", Izin: "I", Alpa: "A" };
  const clsMap = { Hadir: "hadir", Sakit: "sakit", Izin: "izin", Alpa: "alpa" };
  const terisiCount = pertemuanList.length;

  const rowsHtml = siswaList
    .map((nama, idx) => {
      let cH = 0, cS = 0, cI = 0, cA = 0;
      const cells = pCols
        .map((no) => {
          const p = byNo.get(no);
          const rec = p ? (p.siswa || []).find((s) => s.nama === nama) : null;
          const st = rec ? rec.status : "";
          if (st === "Hadir") cH++;
          else if (st === "Sakit") cS++;
          else if (st === "Izin") cI++;
          else if (st === "Alpa") cA++;
          const kode = kodeMap[st] || "-";
          const cls = clsMap[st] || "center";
          return `<td class="${cls}">${kode}</td>`;
        })
        .join("");
      const persen = terisiCount ? Math.round((cH / terisiCount) * 100) : 0;
      return `<tr>
        <td class="center">${idx + 1}</td>
        <td>${esc(nama)}</td>
        ${cells}
        <td class="hadir">${cH}</td>
        <td class="sakit">${cS}</td>
        <td class="izin">${cI}</td>
        <td class="alpa">${cA}</td>
        <td class="center"><b>${persen}%</b></td>
      </tr>`;
    })
    .join("");

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Rekap Semester</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
    <style>
      table { border-collapse: collapse; font-family: Calibri, sans-serif; }
      th, td { border: 1px solid #b0b0b0; padding: 5px 8px; font-size: 10.5pt; }
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
        <tr><td colspan="${totalCols}" class="title">REKAPITULASI PRESENSI 1 SEMESTER - ${esc(formatKelasLabel(kls).toUpperCase())}</td></tr>
        <tr><td class="meta" colspan="2">Pertemuan Terisi</td><td colspan="${totalCols - 2}">${terisiCount} dari ${totalSlot} pertemuan</td></tr>
        <tr><td class="meta" colspan="2">Total Siswa</td><td colspan="${totalCols - 2}">${siswaList.length} siswa</td></tr>
        <tr><td class="meta" colspan="2">Keterangan</td><td colspan="${totalCols - 2}">H = Hadir | S = Sakit | I = Izin | A = Alpa | - = Belum diisi</td></tr>
        <tr><td colspan="${totalCols}"></td></tr>
        <tr>
          <th style="width:42px">No</th>
          <th style="width:240px">Nama Siswa</th>
          ${pCols.map((no) => `<th style="width:36px">P${no}</th>`).join("")}
          <th style="width:42px">H</th>
          <th style="width:42px">S</th>
          <th style="width:42px">I</th>
          <th style="width:42px">A</th>
          <th style="width:72px">% Hadir</th>
        </tr>
        ${rowsHtml}
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([html], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  const elem = document.createElement("a");
  elem.href = URL.createObjectURL(blob);
  const cleanKls = (kls || "Kelas").replace(/\s+/g, "_");
  elem.download = `Rekap_Semester_${cleanKls}.xls`;
  elem.click();
}