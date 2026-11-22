/* Modul Kuis / Latihan Soal - Two Column Quiz Editor */
let Q;
let filterTopikQuiz = "Semua";
let showQuizSettings = false;
let activeSoalIdx = 0;
let previewQuizState = null;

function pQuiz() {
  if (!edit) {
    Q = null;
    showQuizSettings = false;
    previewQuizState = null;
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
      ${filterTopikQuiz === "Semua"
        ? renderBreadcrumb([{ label: "Quiz" }])
        : renderBreadcrumb([
            { label: "Quiz", onClick: "filterTopikQuiz='Semua';draw()" },
            { label: filterTopikQuiz }
          ])
      }
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

  const crumbs = [
    { label: "Quiz", onClick: "edit=null;draw()" },
  ];
  if (filterTopikQuiz !== "Semua") {
    crumbs.push({
      label: filterTopikQuiz,
      onClick: "edit=null;draw()",
    });
  }
  crumbs.push({ label: edit === "new" ? "Tambah kuis" : "Edit kuis" });

  return `
    ${renderBreadcrumb(crumbs)}
    <div class="qe-layout">
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

      <!-- Action tambah soal di bawah kolom pertanyaan -->
      ${
        Q.tipe === "native"
          ? `<div class="qe-main-actions">
              <button type="button" class="qe-btn-outline" onclick="tambahSoalBaru()">+ Tambah soal</button>
            </div>`
          : ""
      }
    </div>

    <!-- Sidebar Navigasi Soal & Aksi Kuis -->
    <div class="qe-sidebar">
      <div class="qe-nav-card">
        ${
          Q.tipe === "native"
            ? `
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
        `
            : `<h4 class="qe-nav-title" style="margin-bottom:4px">Aksi kuis</h4>`
        }
        <div class="absen-sidebar-actions">
          <button type="button" class="qe-btn-save" style="width:100%;text-align:center" onclick="sQ()">Simpan kuis</button>
          <button type="button" class="qe-btn-outline" style="width:100%;text-align:center" onclick="pratinjauKuis()">Pratinjau</button>
          <button type="button" class="btn ghost" style="width:100%;text-align:center" onclick="batalEditKuis()">Batal</button>
        </div>
      </div>
    </div>
  </div>

  ${renderQuizSettingsModal()}
  ${renderQuizPreviewModal()}
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
        <label>Pembahasan</label>
        <input data-n="${n}" data-f="e" value="${esc(s.e || "")}" placeholder="Opsional">
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

/* ===================================================
   PRATINJAU KUIS INTERAKTIF (TES SOAL & KUNCI)
=================================================== */
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pratinjauKuis() {
  sync();
  if (!Q) return;
  if (Q.tipe === "native" && (!Q.soal || !Q.soal.length)) {
    return toast("Tambahkan minimal 1 soal untuk pratinjau");
  }

  const warnings = [];
  if (Q.tipe === "native") {
    Q.soal.forEach((s, i) => {
      const issues = [];
      if (!s.q.trim()) issues.push("pertanyaan kosong");
      if (s.o.some((o) => !o.trim())) issues.push("ada opsi kosong");
      if (typeof s.a !== "number" || s.a < 0 || s.a >= s.o.length) issues.push("belum ada kunci");
      if (issues.length) warnings.push(`Soal ${i + 1} (${issues.join(", ")})`);
    });
  }

  previewQuizState = {
    step: "intro",
    warnings,
    items: [],
    idx: 0,
    picked: null,
    benar: 0,
  };
  draw();
}

function mulaiPratinjauKuis() {
  if (!Q || !previewQuizState) return;
  let items = (Q.soal || []).map((s, i) => {
    const hasKey = typeof s.a === "number" && s.a >= 0 && s.a < s.o.length;
    let opts = s.o.map((text, k) => ({ text, isCorrect: hasKey && k === s.a }));
    if (Q.acakOpsi) opts = shuffleArray(opts);
    return {
      origNo: i + 1,
      q: s.q,
      e: s.e || "",
      hasKey,
      opts,
    };
  });
  if (Q.acakSoal) items = shuffleArray(items);

  previewQuizState = {
    ...previewQuizState,
    step: "play",
    items,
    idx: 0,
    picked: null,
    benar: 0,
  };
  updateQuizPreviewBody();
}

function pilihOpsiPratinjau(optIdx) {
  if (!previewQuizState || previewQuizState.picked !== null) return;
  const cur = previewQuizState.items[previewQuizState.idx];
  if (!cur) return;
  previewQuizState.picked = optIdx;
  if (cur.opts[optIdx]?.isCorrect) previewQuizState.benar++;
  updateQuizPreviewBody();
}

function lanjutPratinjauKuis() {
  if (!previewQuizState) return;
  if (previewQuizState.idx + 1 < previewQuizState.items.length) {
    previewQuizState.idx++;
    previewQuizState.picked = null;
  } else {
    previewQuizState.step = "done";
  }
  updateQuizPreviewBody();
}

function tutupPratinjauKuis() {
  previewQuizState = null;
  const el = document.getElementById("qe_preview_modal");
  if (el) el.remove();
  else draw();
}

function updateQuizPreviewBody() {
  const bodyEl = document.getElementById("qe_preview_body");
  if (bodyEl) {
    bodyEl.innerHTML = buildQuizPreviewBody();
  } else {
    draw();
  }
}

function buildQuizPreviewBody() {
  if (!previewQuizState || !Q) return "";
  const st = previewQuizState;
  let bodyHtml = "";

  if (Q.tipe !== "native") {
    const validLink = /^https?:\/\//.test(Q.link || "");
    bodyHtml = `
      <div style="margin-bottom:14px">
        <h3 style="font-size:20px;margin-bottom:6px">${esc(Q.judul || "Judul Kuis Belum Diisi")}</h3>
        <p class="sub" style="margin-bottom:14px">${esc(Q.deskripsi || "Tidak ada deskripsi.")}</p>
        <div class="quiz-intro-meta">
          <span class="quiz-intro-badge">🔗 ${esc(TIPE[Q.tipe] || "Link Eksternal")}</span>
          <span class="quiz-intro-badge">🏷 ${esc(Q.topik || "Umum")}</span>
        </div>
        ${
          validLink
            ? `<a href="${esc(Q.link)}" target="_blank" rel="noopener" class="btn" style="width:100%;text-align:center">Buka Link Kuis ↗</a>`
            : `<div class="exp" style="color:var(--danger)">Link kuis belum diisi atau tidak diawali <b>https://</b>.</div>`
        }
      </div>`;
  } else if (st.step === "intro") {
    const durasiText = Q.durasi ? `${Q.durasi} menit` : "Tanpa batas waktu";
    bodyHtml = `
      <h3 style="font-size:20px;margin-bottom:6px">${esc(Q.judul || "Judul Kuis Belum Diisi")}</h3>
      <p class="sub" style="margin-bottom:14px">${esc(Q.deskripsi || "Mode pratinjau guru untuk menguji soal dan kunci jawaban.")}</p>
      <div class="quiz-intro-meta">
        <span class="quiz-intro-badge">📝 ${Q.soal.length} Soal</span>
        <span class="quiz-intro-badge">⏱ ${durasiText}</span>
        ${Q.acakSoal ? `<span class="quiz-intro-badge">🔀 Acak Soal</span>` : ""}
        ${Q.acakOpsi ? `<span class="quiz-intro-badge">🔀 Acak Opsi</span>` : ""}
      </div>
      ${
        st.warnings.length
          ? `<div style="background:#fef3c7;border:1px solid #fcd34d;color:#92400e;border-radius:10px;padding:12px 14px;font-size:13.5px;margin-bottom:18px">
              <b>Perhatian — ada soal belum lengkap:</b>
              <ul style="margin:6px 0 0;padding-left:18px">
                ${st.warnings.map((w) => `<li>${esc(w)}</li>`).join("")}
              </ul>
            </div>`
          : `<div style="background:#dcfce7;border:1px solid #86efac;color:#15803d;border-radius:10px;padding:10px 14px;font-size:13.5px;margin-bottom:18px">
              ✓ Semua soal, opsi, dan kunci jawaban sudah lengkap.
            </div>`
      }
      <div class="row" style="justify-content:flex-end;gap:10px">
        <button type="button" class="btn ghost" onclick="tutupPratinjauKuis()">Tutup</button>
        <button type="button" class="btn" onclick="mulaiPratinjauKuis()">Mulai Tes Pratinjau →</button>
      </div>`;
  } else if (st.step === "play") {
    const cur = st.items[st.idx];
    const pct = Math.round(((st.idx + 1) / st.items.length) * 100);
    const isAnswered = st.picked !== null;
    const isLast = st.idx + 1 === st.items.length;

    const optsHtml = cur.opts
      .map((opt, k) => {
        let cls = "opt";
        if (isAnswered) {
          if (opt.isCorrect) cls += " ok";
          else if (st.picked === k) cls += " bad";
        }
        return `<button type="button" class="${cls}" ${isAnswered ? "disabled" : ""} onclick="pilihOpsiPratinjau(${k})">
          <b>${String.fromCharCode(65 + k)}.</b> ${esc(opt.text || "(Opsi kosong)")}
        </button>`;
      })
      .join("");

    bodyHtml = `
      <div class="row" style="justify-content:space-between;margin-bottom:8px;font-size:13px;color:var(--text-muted);font-weight:600">
        <span>Soal ${st.idx + 1} dari ${st.items.length}${Q.acakSoal ? ` (Asli: #${cur.origNo})` : ""}</span>
        <span>Benar: ${st.benar}</span>
      </div>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <div style="font-size:16px;font-weight:700;line-height:1.5;margin-bottom:14px;white-space:pre-line">${esc(cur.q || "(Pertanyaan masih kosong)")}</div>
      <div>${optsHtml}</div>
      ${
        isAnswered && !cur.hasKey
          ? `<div class="exp" style="background:#fef3c7;color:#92400e">⚠️ Soal #${cur.origNo} belum memiliki kunci jawaban.</div>`
          : ""
      }
      ${
        isAnswered && cur.e
          ? `<div class="exp"><b>Pembahasan:</b> ${esc(cur.e)}</div>`
          : ""
      }
      <div class="row" style="justify-content:space-between;margin-top:20px">
        <button type="button" class="btn sm ghost" onclick="tutupPratinjauKuis();scrollToSoal(${cur.origNo - 1})">✎ Edit Soal #${cur.origNo}</button>
        ${
          isAnswered
            ? `<button type="button" class="btn" onclick="lanjutPratinjauKuis()">${isLast ? "Lihat Hasil →" : "Soal Berikutnya →"}</button>`
            : `<button type="button" class="btn sm ghost" onclick="lanjutPratinjauKuis()">Lewati →</button>`
        }
      </div>`;
  } else if (st.step === "done") {
    const total = st.items.length || 1;
    const skor = Math.round((st.benar / total) * 100);
    bodyHtml = `
      <div style="text-align:center;padding:8px 0">
        <div style="font-size:14px;font-weight:700;color:var(--text-muted);margin-bottom:4px">Hasil Pratinjau</div>
        <div class="score">${skor}</div>
        <p class="sub" style="margin:6px 0 22px">Benar <b>${st.benar}</b> dari <b>${st.items.length}</b> soal (tidak disimpan ke data)</p>
        <div class="row" style="justify-content:center;gap:10px">
          <button type="button" class="btn ghost" onclick="mulaiPratinjauKuis()">Ulangi Tes</button>
          <button type="button" class="btn" onclick="tutupPratinjauKuis()">Selesai</button>
        </div>
      </div>`;
  }

  return bodyHtml;
}

function renderQuizPreviewModal() {
  if (!previewQuizState || !Q) return "";
  return `
    <div id="qe_preview_modal" class="qe-modal-backdrop" onclick="if(event.target === this) tutupPratinjauKuis()">
      <div class="qe-modal-box" style="max-width:640px">
        <div class="qe-modal-header">
          <h3 class="qe-modal-title">Pratinjau Kuis</h3>
          <button type="button" class="qe-modal-close" onclick="tutupPratinjauKuis()" title="Tutup">✕</button>
        </div>
        <div id="qe_preview_body">${buildQuizPreviewBody()}</div>
      </div>
    </div>
  `;
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

function batalEditKuis() {
  if (typeof confirmLeaveUnsaved === "function" && !confirmLeaveUnsaved()) return;
  if (typeof isDirty !== "undefined") isDirty = false;
  Q = null;
  edit = null;
  showQuizSettings = false;
  previewQuizState = null;
  draw();
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
  previewQuizState = null;
  save();
  draw();
  toast("Kuis berhasil disimpan!");
}