/* Modul Kuis / Latihan Soal - Two Column Quiz Editor */
let Q;
let filterTopikQuiz = "Semua";
let showQuizSettings = false;
let activeSoalIdx = 0;

function pQuiz() {
  if (!edit) {
    Q = null;
    showQuizSettings = false;
    activeSoalIdx = 0;
    const allList = [...(D.quiz || [])].reverse();
    const list = allList.filter(
      (x) => filterTopikQuiz === "Semua" || (x.topik || "Semua") === filterTopikQuiz,
    );
    const items = list
      .map(
        (x) => `
      <div class="crud-card">
        <div class="crud-card-left">
          <h3 class="crud-card-title">${esc(x.judul || "Tanpa Judul")}</h3>
          <div class="crud-card-sub">${esc(x.topik || "Umum")} · ${TIPE[x.tipe] || "Link eksternal"}${x.tipe === "native" ? ` · ${x.soal.length} soal` : ""}</div>
        </div>
        <div class="crud-actions">
          <button class="crud-btn-icon" onclick="edit='${x.id}';draw()" title="Ubah">${ICON_EDIT}</button>
          <button class="crud-btn-icon del" onclick="del('quiz','${x.id}')" title="Hapus">${ICON_TRASH}</button>
        </div>
      </div>`,
      )
      .join("");

    return `
      <div class="crud-header">
        <div style="display:flex;align-items:center;gap:12px;flex:1;flex-wrap:wrap">
          <div class="crud-search-wrap">
            ${ICON_SEARCH}
            <input type="text" class="crud-search-input" placeholder="Cari kuis..." oninput="onCrudSearch(this.value)" />
          </div>
          <select onchange="filterTopikQuiz=this.value;draw()" style="width:auto;padding:10px 14px;border-radius:12px;font-size:13.5px;font-weight:600;background:#fff;border:1.5px solid #e2e8f0;cursor:pointer">
            <option value="Semua" ${filterTopikQuiz === "Semua" ? "selected" : ""}>Semua Topik</option>
            ${TOPIK.map((t) => `<option value="${esc(t)}" ${filterTopikQuiz === t ? "selected" : ""}>${esc(t)}</option>`).join("")}
          </select>
        </div>
        <button class="crud-btn-add" onclick="edit='new';draw()">${ICON_PLUS} Tambah</button>
      </div>
      <div class="crud-card-list">
        ${items || `<div class="crud-empty">Belum ada kuis ${filterTopikQuiz !== "Semua" ? `pada topik <b>${esc(filterTopikQuiz)}</b>` : ""}. Klik tombol <b>+ Tambah</b> untuk membuat baru.</div>`}
      </div>
    `;
  }

  if (!Q || Q._for !== edit) {
    const existing = D.quiz.find((x) => x.id === edit);
    Q = structuredClone(
      existing || {
        judul: "",
        deskripsi: "",
        topik: filterTopikQuiz !== "Semua" ? filterTopikQuiz : "Umum",
        tipe: "native",
        link: "",
        soal: [
          {
            q: "",
            o: ["", "", "", ""],
            a: -1,
            e: "",
          },
        ],
      },
    );
    Q._for = edit;
    Q.topik = Q.topik || (filterTopikQuiz !== "Semua" ? filterTopikQuiz : "Umum");
    Q.deskripsi = Q.deskripsi || "";
    if (Q.durasi === undefined) Q.durasi = 20;
    if (Q.acakSoal === undefined) Q.acakSoal = false;
    if (Q.acakOpsi === undefined) Q.acakOpsi = false;
    if (Q.tampilkanHasil === undefined) Q.tampilkanHasil = true;
    if (Q.tipe === "native" && (!Q.soal || Q.soal.length === 0)) {
      Q.soal = [{ q: "", o: ["", "", "", ""], a: -1, e: "" }];
    }
  }

  /* Count complete questions */
  const totalSoal = Q.soal.length;
  const lengkapCount = Q.soal.filter(
    (s) =>
      s.q.trim() &&
      s.o.length >= 2 &&
      s.o.every((o) => o.trim()) &&
      typeof s.a === "number" &&
      s.a >= 0 &&
      s.a < s.o.length,
  ).length;

  /* Navigasi soal sidebar */
  const navButtons = Q.soal
    .map((s, i) => {
      const isComplete =
        s.q.trim() &&
        s.o.length >= 2 &&
        s.o.every((o) => o.trim()) &&
        typeof s.a === "number" &&
        s.a >= 0 &&
        s.a < s.o.length;
      const isActive = i === activeSoalIdx;
      return `<button type="button" class="qnav-btn ${isActive ? "active" : ""} ${isComplete ? "complete" : ""}" onclick="scrollToSoal(${i})" title="Soal ${i + 1}">${i + 1}</button>`;
    })
    .join("");

  /* Soal cards */
  const soalCards =
    Q.tipe === "native"
      ? Q.soal.length === 0
        ? `<div class="qe-empty-soal">Belum ada butir soal. Klik <b>+ Tambah soal</b> untuk membuat soal baru.</div>`
        : Q.soal.map((s, n) => renderSoalCard(s, n)).join("")
      : "";

  return `<div class="qe-layout">
    <div class="qe-main">
      <!-- Judul, Topik & Deskripsi Card -->
      <div class="qe-card qe-card-header">
        <div class="form-grid-2" style="margin-bottom:14px">
          <div>
            <label style="margin-top:0">Judul kuis</label>
            <input id="j" value="${esc(Q.judul)}" placeholder="Judul kuis">
          </div>
          <div>
            <label style="margin-top:0">Topik</label>
            <div style="display:flex;gap:10px;align-items:center">
              <select id="topik" onchange="Q.topik=this.value" style="flex:1">
                ${TOPIK.map(
                  (t) =>
                    `<option value="${esc(t)}" ${(Q.topik || "Umum") === t ? "selected" : ""}>${esc(t)}</option>`,
                ).join("")}
              </select>
              <button type="button" class="qe-btn-settings" onclick="sync();showQuizSettings=true;draw()">Setelan kuis</button>
            </div>
          </div>
        </div>
        <label>Deskripsi</label>
        <textarea id="desc" rows="3" placeholder="Deskripsi kuis" style="min-height:80px">${esc(Q.deskripsi)}</textarea>
      </div>

      <!-- Soal Cards -->
      ${soalCards}
    </div>

    <!-- Sidebar Navigasi Soal -->
    ${
      Q.tipe === "native"
        ? `
    <div class="qe-sidebar">
      <div class="qe-nav-card">
        <h4 class="qe-nav-title">Navigasi soal</h4>
        <div class="qe-nav-count">${lengkapCount} dari ${totalSoal} soal lengkap</div>
        <div class="qe-nav-grid">
          ${navButtons || '<span style="color:#94a3b8;font-size:13px">Belum ada soal</span>'}
        </div>
        <div class="qe-nav-legend">
          <span><span class="qe-dot complete"></span> Lengkap</span>
          <span><span class="qe-dot"></span> Belum</span>
        </div>
        <button type="button" class="qe-btn-add-sidebar" onclick="tambahSoalBaru()">+ Tambah soal</button>
      </div>
    </div>
    `
        : ""
    }
  </div>

  <!-- Bottom Bar -->
  <div class="qe-bottom-bar">
    <div class="qe-bottom-left">
      ${Q.tipe === "native" ? `<button type="button" class="qe-btn-outline" onclick="tambahSoalBaru()">+ Tambah soal</button>` : ""}
    </div>
    <div class="qe-bottom-right">
      <button type="button" class="qe-btn-outline" onclick="pratinjauKuis()">Pratinjau</button>
      <button type="button" class="qe-btn-save" onclick="sQ()">Simpan kuis</button>
    </div>
  </div>

  ${renderQuizSettingsModal()}
  `;
}

function renderQuizSettingsModal() {
  if (!showQuizSettings) return "";

  const durasiOptions = [
    { v: 0, l: "Tanpa batas waktu" },
    { v: 5, l: "5 menit" },
    { v: 10, l: "10 menit" },
    { v: 15, l: "15 menit" },
    { v: 20, l: "20 menit" },
    { v: 30, l: "30 menit" },
    { v: 45, l: "45 menit" },
    { v: 60, l: "60 menit" },
    { v: 90, l: "90 menit" },
  ];

  return `
    <div class="qe-modal-backdrop" onclick="if(event.target === this){showQuizSettings=false;sync();draw();}">
      <div class="qe-modal-box">
        <div class="qe-modal-header">
          <h3 class="qe-modal-title">Setelan kuis</h3>
          <button type="button" class="qe-modal-close" onclick="showQuizSettings=false;sync();draw()" title="Tutup">✕</button>
        </div>

        <div class="qe-modal-body">
          <div style="margin-bottom:14px">
            <label style="margin-top:0">Topik</label>
            <select id="set_topik">
              ${TOPIK.map(
                (t) =>
                  `<option value="${esc(t)}" ${(Q.topik || "Umum") === t ? "selected" : ""}>${esc(t)}</option>`,
              ).join("")}
            </select>
          </div>

          <div style="margin-bottom:14px">
            <label style="margin-top:0">Jenis kuis</label>
            <select id="set_tipe" onchange="sync();draw()">
              ${Object.entries(TIPE)
                .map(
                  ([k, v]) =>
                    `<option value="${k}" ${Q.tipe === k ? "selected" : ""}>${v}</option>`,
                )
                .join("")}
            </select>
          </div>

          ${
            Q.tipe !== "native"
              ? `<div style="margin-bottom:14px">
                  <label style="margin-top:0">Link kuis</label>
                  <input id="set_link" value="${esc(Q.link)}" placeholder="https://">
                </div>`
              : ""
          }

          <div style="margin-bottom:16px">
            <label style="margin-top:0">Durasi</label>
            <select id="set_durasi">
              ${durasiOptions
                .map(
                  (d) =>
                    `<option value="${d.v}" ${(Q.durasi ?? 20) === d.v ? "selected" : ""}>${d.l}</option>`,
                )
                .join("")}
            </select>
          </div>

          <div class="qe-toggle-row">
            <span class="qe-toggle-label">Acak soal</span>
            <label class="qe-switch">
              <input type="checkbox" id="set_acak_soal" ${Q.acakSoal ? "checked" : ""}>
              <span class="qe-slider"></span>
            </label>
          </div>

          <div class="qe-toggle-row">
            <span class="qe-toggle-label">Acak pilihan jawaban</span>
            <label class="qe-switch">
              <input type="checkbox" id="set_acak_opsi" ${Q.acakOpsi ? "checked" : ""}>
              <span class="qe-slider"></span>
            </label>
          </div>

          <div class="qe-toggle-row">
            <span class="qe-toggle-label">Tampilkan hasil</span>
            <label class="qe-switch">
              <input type="checkbox" id="set_tampilkan_hasil" ${(Q.tampilkanHasil ?? true) ? "checked" : ""}>
              <span class="qe-slider"></span>
            </label>
          </div>
        </div>

        <button type="button" class="qe-modal-btn-submit" onclick="showQuizSettings=false;sync();draw()">Selesai</button>
      </div>
    </div>
  `;
}

function renderSoalCard(s, n) {
  const opsiRows = s.o
    .map(
      (optVal, k) => `
    <div class="qe-opt-row ${s.a === k ? "active-key" : ""}">
      <input type="radio" name="kunci_${n}" class="quiz-radio" ${s.a === k ? "checked" : ""} onchange="setKunciJawaban(${n}, ${k})">
      <input type="text" data-n="${n}" data-f="o${k}" value="${esc(optVal)}" placeholder="Pilihan ${String.fromCharCode(65 + k)}">
      <button type="button" class="qe-btn-del-opt" onclick="hapusOpsi(${n}, ${k})" title="Hapus opsi">×</button>
    </div>`,
    )
    .join("");

  return `
    <div class="qe-card qe-soal-card" id="soal-${n}">
      <div class="qe-soal-header">
        <span class="qe-soal-title">Pertanyaan ${n + 1}</span>
        <button type="button" class="qe-btn-del-soal" onclick="hapusSoal(${n})" title="Hapus soal ini">
          ${ICON_TRASH}
        </button>
      </div>

      <textarea data-n="${n}" data-f="q" rows="3" placeholder="Tuliskan pertanyaan soal..." style="min-height:80px">${esc(s.q)}</textarea>

      <div class="qe-opt-list">
        ${opsiRows}
      </div>
      <button type="button" class="qe-btn-add-opt" onclick="tambahOpsi(${n})">+ Tambah opsi</button>

      <div style="margin-top:12px">
        <label>Pembahasan (opsional)</label>
        <input data-n="${n}" data-f="e" value="${esc(s.e || "")}" placeholder="Penjelasan jawaban atau rumus...">
      </div>
    </div>
  `;
}

function tambahSoalBaru() {
  sync();
  Q.soal.push({
    q: "",
    o: ["", "", "", ""],
    a: -1,
    e: "",
  });
  draw();
  /* Scroll to new soal after render */
  setTimeout(() => {
    const el = document.getElementById("soal-" + (Q.soal.length - 1));
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 50);
}

function hapusSoal(n) {
  if (confirm(`Hapus Soal ${n + 1}?`)) {
    sync();
    Q.soal.splice(n, 1);
    draw();
  }
}

function tambahOpsi(n) {
  sync();
  if (Q.soal[n]) {
    Q.soal[n].o.push("");
  }
  draw();
}

function hapusOpsi(n, k) {
  sync();
  if (Q.soal[n] && Q.soal[n].o.length > 2) {
    Q.soal[n].o.splice(k, 1);
    /* Fix answer index */
    if (Q.soal[n].a === k) {
      Q.soal[n].a = -1;
    } else if (Q.soal[n].a > k) {
      Q.soal[n].a--;
    }
    draw();
  } else {
    toast("Minimal harus ada 2 pilihan jawaban");
  }
}

function scrollToSoal(n) {
  activeSoalIdx = n;
  sync();
  draw();
  setTimeout(() => {
    const el = document.getElementById("soal-" + n);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 30);
}

function pratinjauKuis() {
  sync();
  toast("Fitur pratinjau akan segera hadir!");
}

function setKunciJawaban(soalIdx, kunciIdx) {
  sync();
  if (Q.soal[soalIdx]) {
    Q.soal[soalIdx].a = kunciIdx;
  }
  draw();
}

function sync() {
  if (!Q) return;
  if ($("#j")) Q.judul = $("#j").value;
  if ($("#topik")) Q.topik = $("#topik").value;
  if ($("#desc")) Q.deskripsi = $("#desc").value;
  if ($("#set_topik")) Q.topik = $("#set_topik").value;
  if ($("#set_tipe")) Q.tipe = $("#set_tipe").value;
  if ($("#set_link")) Q.link = $("#set_link").value;
  if ($("#set_durasi")) Q.durasi = +$("#set_durasi").value;
  if ($("#set_acak_soal")) Q.acakSoal = $("#set_acak_soal").checked;
  if ($("#set_acak_opsi")) Q.acakOpsi = $("#set_acak_opsi").checked;
  if ($("#set_tampilkan_hasil")) Q.tampilkanHasil = $("#set_tampilkan_hasil").checked;

  document.querySelectorAll("[data-n]").forEach((e) => {
    const s = Q.soal[+e.dataset.n];
    if (!s) return;
    const f = e.dataset.f;
    if (f[0] === "o") {
      const idx = +f.slice(1);
      if (idx < s.o.length) s.o[idx] = e.value;
    } else if (f === "a") {
      s.a = +e.value;
    } else {
      s[f] = e.value;
    }
  });
}

function sQ() {
  sync();
  if (!Q.judul.trim()) return toast("Judul kuis wajib diisi");
  if (Q.tipe !== "native" && !/^https?:\/\//.test(Q.link))
    return toast("Link kuis eksternal harus diawali https://");
  if (
    Q.tipe === "native" &&
    (!Q.soal.length ||
      Q.soal.some((s) => !s.q.trim() || s.o.some((o) => !o.trim())))
  )
    return toast("Lengkapi semua teks pertanyaan dan pilihan jawaban");

  if (
    Q.tipe === "native" &&
    Q.soal.some((s) => typeof s.a !== "number" || s.a < 0 || s.a >= s.o.length)
  ) {
    const idxTanpaKunci = Q.soal.findIndex(
      (s) => typeof s.a !== "number" || s.a < 0 || s.a >= s.o.length,
    );
    return toast(`Tandai kunci jawaban benar untuk Soal ${idxTanpaKunci + 1}`);
  }

  const existing = (D.quiz || []).find((x) => x.id === Q.id);
  const now = Date.now();
  const o = { ...Q, id: Q.id || Store.uid("q") };
  delete o._for;
  o.topik = Q.topik || "Umum";
  o.durasi = Q.durasi !== undefined ? Q.durasi : 20;
  o.acakSoal = !!Q.acakSoal;
  o.acakOpsi = !!Q.acakOpsi;
  o.tampilkanHasil = Q.tampilkanHasil !== undefined ? Q.tampilkanHasil : true;
  o.createdAt = Q.createdAt || existing?.createdAt || now;
  o.updatedAt = now;
  if (o.tipe !== "native") o.soal = [];

  up(D.quiz, o);
  Q = null;
  edit = null;
  showQuizSettings = false;
  save();
  draw();
  toast("Kuis berhasil disimpan!");
}
