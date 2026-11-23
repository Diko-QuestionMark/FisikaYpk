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
      .map((x) => {
        const topikLabel = x.topik || "Umum";
        const vis = typeof getTopikVisual === "function"
          ? getTopikVisual(topikLabel)
          : { bg: "var(--primary-soft)", color: "var(--primary)", svg: "✏️" };
        return `
      <div class="crud-card">
        <div style="display:flex;align-items:center;gap:14px;min-width:0;flex:1">
          <div style="width:44px;height:44px;border-radius:12px;background:${vis.bg};color:${vis.color};display:flex;align-items:center;justify-content:center;flex-shrink:0" title="${esc(topikLabel)}">${vis.svg}</div>
          <div class="crud-card-left">
            <h3 class="crud-card-title">${esc(x.judul || "Tanpa Judul")}</h3>
            <div class="crud-card-sub" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:2px">
              <span style="display:inline-flex;align-items:center;padding:2px 9px;border-radius:999px;font-size:11.5px;font-weight:700;background:${vis.bg};color:${vis.color}">${esc(topikLabel)}</span>
              <span>${TIPE[x.tipe] || "Link eksternal"}${x.tipe === "native" ? ` · ${x.soal.length} soal` : ""}</span>
            </div>
          </div>
        </div>
        <div class="crud-actions">
          <button class="crud-btn-icon" onclick="edit='${x.id}';draw()" title="Ubah">${ICON_EDIT}</button>
          <button class="crud-btn-icon del" onclick="del('quiz','${x.id}')" title="Hapus">${ICON_TRASH}</button>
        </div>
      </div>`;
      })
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

/* ===================================================
   MODUL REKAP NILAI KUIS (TAB NILAI DI PANEL GURU)
=================================================== */
let nilaiRows = [];
let nilaiLoading = false;
let nilaiLoaded = false;
let curNilaiQuizId = null;
let filterNilaiKelas = "Semua";
let nilaiViewMode = "best"; // "best" | "all"
let nilaiSort = "recent";   // "recent" | "score" | "name"
let nilaiSearch = "";
let nilaiFocusStudent = null;

function fmtWaktuNilai(ts) {
  if (!ts) return "-";
  try {
    const d = new Date(Number(ts));
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return "-";
  }
}

function openNilaiQuiz(qid) {
  curNilaiQuizId = qid;
  filterNilaiKelas = "Semua";
  nilaiSearch = "";
  nilaiFocusStudent = null;
  nilaiViewMode = "best";
  draw();
}

function lihatPercobaanSiswa(nama) {
  nilaiFocusStudent = nama || null;
  nilaiViewMode = "all";
  nilaiSearch = nama || "";
  draw();
}

function tutupPercobaanSiswa() {
  nilaiFocusStudent = null;
  nilaiViewMode = "best";
  nilaiSearch = "";
  draw();
}

function onNilaiTableSearch(val) {
  nilaiSearch = val || "";
  const q = nilaiSearch.toLowerCase().trim();
  const tbody = document.getElementById("nilai_tbody");
  if (!tbody) return;
  let visible = 0;
  tbody.querySelectorAll("tr[data-search]").forEach((tr) => {
    const match = !q || tr.dataset.search.includes(q);
    tr.style.display = match ? "" : "none";
    if (match) visible++;
  });
  const emptyRow = document.getElementById("nilai_search_empty");
  if (emptyRow) emptyRow.style.display = visible === 0 ? "" : "none";
}

async function loadNilai(force = false) {
  if (nilaiLoading) return;
  if (nilaiLoaded && !force) return;
  nilaiLoading = true;
  if (tab === "nilai") draw();
  try {
    nilaiRows = typeof NilaiDB !== "undefined" ? await NilaiDB.list() : [];
    nilaiLoaded = true;
  } finally {
    nilaiLoading = false;
    if (tab === "nilai") draw();
  }
}

async function hapusNilai(id) {
  if (!confirm("Hapus catatan nilai ini?")) return;
  if (typeof NilaiDB !== "undefined") await NilaiDB.remove(id);
  nilaiRows = nilaiRows.filter((x) => x.id !== id);
  toast("Catatan nilai dihapus");
  draw();
}

function getProcessedNilai() {
  let rows = (nilaiRows || []).filter((r) => {
    if (curNilaiQuizId && r.quiz_id !== curNilaiQuizId) return false;
    if (filterNilaiKelas !== "Semua" && r.kelas !== filterNilaiKelas) return false;
    return true;
  });

  if (nilaiViewMode === "best") {
    const byStudent = new Map();
    rows.forEach((r) => {
      const key = `${String(r.kelas || "").trim().toLowerCase()}::${String(r.nama || "").trim().toLowerCase()}`;
      const cur = byStudent.get(key);
      if (!cur) {
        byStudent.set(key, { ...r, _attempts: 1 });
      } else {
        const attempts = cur._attempts + 1;
        const isBetter =
          r.skor > cur.skor ||
          (r.skor === cur.skor && (r.created_at || 0) > (cur.created_at || 0));
        byStudent.set(key, isBetter ? { ...r, _attempts: attempts } : { ...cur, _attempts: attempts });
      }
    });
    rows = [...byStudent.values()];
  } else {
    rows = rows.map((r) => ({ ...r, _attempts: 1 }));
  }

  if (nilaiSort === "score") {
    rows.sort((a, b) => b.skor - a.skor || String(a.nama).localeCompare(String(b.nama)));
  } else if (nilaiSort === "name") {
    rows.sort((a, b) => String(a.nama).localeCompare(String(b.nama)) || b.skor - a.skor);
  } else {
    rows.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
  }

  return rows;
}

function pNilai() {
  if (!nilaiLoaded && !nilaiLoading) {
    setTimeout(() => loadNilai(false), 0);
  }

  const quizMeta = new Map();
  [...(D.quiz || [])]
    .reverse()
    .filter((q) => q.tipe === "native")
    .forEach((q) => {
      quizMeta.set(q.id, { id: q.id, judul: q.judul || "Tanpa Judul", topik: q.topik || "Umum" });
    });
  (nilaiRows || []).forEach((r) => {
    if (r.quiz_id && !quizMeta.has(r.quiz_id)) {
      quizMeta.set(r.quiz_id, { id: r.quiz_id, judul: r.quiz_judul || r.quiz_id, topik: "Umum" });
    }
  });

  /* LEVEL 1: Pilih Kuis */
  if (!curNilaiQuizId) {
    const quizCards = [...quizMeta.values()]
      .map((q) => {
        const rows = (nilaiRows || []).filter((r) => r.quiz_id === q.id);
        const uniqueStudents = new Set(
          rows.map((r) => `${String(r.kelas || "").toLowerCase()}::${String(r.nama || "").toLowerCase()}`),
        ).size;
        const vis = typeof getTopikVisual === "function"
          ? getTopikVisual(q.topik)
          : { bg: "var(--primary-soft)", color: "var(--primary)", svg: "🏆" };
        const safeId = esc(q.id).replace(/'/g, "\\'");

        return `
          <div class="crud-card" style="cursor:pointer" onclick="openNilaiQuiz('${safeId}')">
            <div style="display:flex;align-items:center;gap:14px;min-width:0;flex:1">
              <div style="width:44px;height:44px;border-radius:12px;background:${vis.bg};color:${vis.color};display:flex;align-items:center;justify-content:center;flex-shrink:0">${vis.svg}</div>
              <div class="crud-card-left">
                <h3 class="crud-card-title">${esc(q.judul)}</h3>
                <div class="crud-card-sub" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:2px">
                  <span style="display:inline-flex;align-items:center;padding:2px 9px;border-radius:999px;font-size:11.5px;font-weight:700;background:${vis.bg};color:${vis.color}">${esc(q.topik)}</span>
                  <span>${rows.length ? `${uniqueStudents} siswa · ${rows.length} percobaan` : "Belum ada nilai masuk"}</span>
                </div>
              </div>
            </div>
            <div class="crud-actions">
              <button type="button" class="btn sm ghost" onclick="event.stopPropagation();openNilaiQuiz('${safeId}')">Lihat Nilai →</button>
            </div>
          </div>`;
      })
      .join("");

    return `
      ${renderBreadcrumb([{ label: "Nilai" }])}
      <div class="crud-header">
        <div class="crud-search-wrap">
          ${ICON_SEARCH}
          <input type="text" class="crud-search-input" placeholder="Cari judul kuis..." oninput="onCrudSearch(this.value)" />
        </div>
        <button type="button" class="btn ghost" style="padding:10px 14px;font-size:13.5px;border-radius:12px" onclick="loadNilai(true)">${nilaiLoading ? "Memuat..." : "↻ Muat Ulang"}</button>
      </div>
      <div class="crud-card-list">
        ${
          nilaiLoading && !nilaiLoaded
            ? `<div class="crud-empty">Memuat data nilai dari database...</div>`
            : quizCards || `<div class="crud-empty">Belum ada kuis. Buat kuis terlebih dahulu di menu <b>Quiz</b>.</div>`
        }
      </div>
    `;
  }

  /* LEVEL 2: Tabel Nilai per Kuis */
  const curQuiz = quizMeta.get(curNilaiQuizId) || { id: curNilaiQuizId, judul: "Kuis" };
  const kelasSet = new Set(typeof getKelasList === "function" ? getKelasList() : []);
  (nilaiRows || [])
    .filter((r) => r.quiz_id === curNilaiQuizId)
    .forEach((r) => { if (r.kelas) kelasSet.add(r.kelas); });

  const processed = getProcessedNilai();
  const qLower = nilaiSearch.toLowerCase().trim();
  const totalCount = processed.length;
  const rataSkor = totalCount ? Math.round(processed.reduce((a, b) => a + b.skor, 0) / totalCount) : 0;
  const maxSkor = totalCount ? Math.max(...processed.map((x) => x.skor)) : 0;
  const minSkor = totalCount ? Math.min(...processed.map((x) => x.skor)) : 0;

  const selStyle = "width:auto;padding:9px 12px;border-radius:10px;font-size:13.5px;font-weight:600;background:var(--surface);border:1.5px solid var(--border);cursor:pointer";
  const thStyle = "padding:11px 14px;text-align:left;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.03em;color:var(--text-muted);background:var(--bg);border-bottom:1.5px solid var(--border);white-space:nowrap";
  const tdStyle = "padding:11px 14px;font-size:14px;border-bottom:1px solid var(--border);vertical-align:middle";

  const rowsHtml = processed
    .map((r, idx) => {
      const klsLabel = /^kelas\b/i.test(r.kelas) ? r.kelas : `Kelas ${r.kelas}`;
      const skorBg = r.skor >= 75 ? "#dcfce7" : r.skor >= 50 ? "#fef3c7" : "#fee2e2";
      const skorColor = r.skor >= 75 ? "#15803d" : r.skor >= 50 ? "#92400e" : "#b91c1c";
      const searchStr = esc(`${r.nama} ${klsLabel}`).toLowerCase();
      const hiddenStyle = qLower && !searchStr.includes(qLower) ? "display:none" : "";
      const safeNama = esc(r.nama).replace(/'/g, "\\'");

      const aksiCell =
        nilaiViewMode === "best" && r._attempts > 1
          ? `<button type="button" class="btn sm ghost" style="padding:4px 10px;font-size:12px" onclick="lihatPercobaanSiswa('${safeNama}')" title="Lihat semua percobaan siswa ini">${r._attempts}x coba</button>`
          : `<button type="button" class="crud-btn-icon del" style="width:32px;height:32px" onclick="hapusNilai('${r.id}')" title="Hapus catatan nilai">${ICON_TRASH}</button>`;

      return `
        <tr data-search="${searchStr}" style="${hiddenStyle}">
          <td style="${tdStyle};color:var(--text-muted);font-weight:600;width:44px">${idx + 1}</td>
          <td style="${tdStyle};font-weight:700;color:var(--text)">${esc(r.nama)}</td>
          <td style="${tdStyle};color:var(--text-muted);white-space:nowrap">${esc(klsLabel)}</td>
          <td style="${tdStyle};text-align:center;color:var(--text-muted);white-space:nowrap">${r.benar}/${r.total}</td>
          <td style="${tdStyle};text-align:center">
            <span style="display:inline-block;min-width:40px;padding:3px 10px;border-radius:999px;font-weight:800;font-size:13px;background:${skorBg};color:${skorColor}">${r.skor}</span>
          </td>
          <td style="${tdStyle};color:var(--text-muted);font-size:13px;white-space:nowrap">${esc(fmtWaktuNilai(r.created_at))}</td>
          <td style="${tdStyle};text-align:right;white-space:nowrap">${aksiCell}</td>
        </tr>`;
    })
    .join("");

  return `
    ${renderBreadcrumb(
      nilaiFocusStudent
        ? [
            { label: "Nilai", onClick: "curNilaiQuizId=null;filterNilaiKelas='Semua';nilaiSearch='';nilaiFocusStudent=null;nilaiViewMode='best';draw()" },
            { label: curQuiz.judul, onClick: "tutupPercobaanSiswa()" },
            { label: `Percobaan: ${nilaiFocusStudent}` },
          ]
        : [
            { label: "Nilai", onClick: "curNilaiQuizId=null;filterNilaiKelas='Semua';nilaiSearch='';nilaiFocusStudent=null;draw()" },
            { label: curQuiz.judul },
          ],
    )}
    ${
      nilaiFocusStudent
        ? `<div class="panel" style="padding:12px 16px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
            <span style="font-size:13.5px;color:var(--text-muted)">Menampilkan semua percobaan milik <b style="color:var(--text)">${esc(nilaiFocusStudent)}</b></span>
            <button type="button" class="btn sm ghost" onclick="tutupPercobaanSiswa()">← Kembali ke Ringkasan</button>
          </div>`
        : ""
    }
    <div class="crud-header" style="margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:8px;flex:1;flex-wrap:wrap">
        <div class="crud-search-wrap" style="min-width:200px;max-width:300px">
          ${ICON_SEARCH}
          <input type="text" class="crud-search-input" value="${esc(nilaiSearch)}" placeholder="Cari nama siswa..." oninput="onNilaiTableSearch(this.value)" />
        </div>
        <select onchange="filterNilaiKelas=this.value;draw()" style="${selStyle}">
          <option value="Semua" ${filterNilaiKelas === "Semua" ? "selected" : ""}>Semua Kelas</option>
          ${[...kelasSet].map((k) => `<option value="${esc(k)}" ${filterNilaiKelas === k ? "selected" : ""}>${esc(/^kelas\b/i.test(k) ? k : "Kelas " + k)}</option>`).join("")}
        </select>
        <select onchange="nilaiViewMode=this.value;draw()" style="${selStyle}">
          <option value="best" ${nilaiViewMode === "best" ? "selected" : ""}>Nilai Tertinggi / Siswa</option>
          <option value="all" ${nilaiViewMode === "all" ? "selected" : ""}>Semua Percobaan</option>
        </select>
        <select onchange="nilaiSort=this.value;draw()" style="${selStyle}">
          <option value="recent" ${nilaiSort === "recent" ? "selected" : ""}>Urut: Terbaru</option>
          <option value="score" ${nilaiSort === "score" ? "selected" : ""}>Urut: Skor Tertinggi</option>
          <option value="name" ${nilaiSort === "name" ? "selected" : ""}>Urut: Nama A–Z</option>
        </select>
      </div>
      <div class="row" style="gap:8px">
        <button type="button" class="btn ghost" style="padding:9px 14px;font-size:13.5px;border-radius:10px" onclick="loadNilai(true)">${nilaiLoading ? "Memuat..." : "↻ Muat Ulang"}</button>
        <button type="button" class="crud-btn-add" style="padding:9px 16px;font-size:13.5px" onclick="expExcelNilai()">📥 Unduh Excel</button>
      </div>
    </div>

    ${
      totalCount
        ? `<div class="panel" style="padding:12px 18px;margin-bottom:16px">
            <div class="row" style="gap:20px;font-size:13.5px;color:var(--text-muted)">
              <span>${nilaiViewMode === "best" ? "Jumlah Siswa" : "Total Percobaan"}: <b style="color:var(--text)">${totalCount}</b></span>
              <span>Rata-rata: <b style="color:var(--primary)">${rataSkor}</b></span>
              <span>Tertinggi: <b style="color:var(--success)">${maxSkor}</b></span>
              <span>Terendah: <b style="color:var(--danger)">${minSkor}</b></span>
            </div>
          </div>`
        : ""
    }

    ${
      totalCount
        ? `<div class="panel" style="padding:0;overflow:hidden">
            <div style="overflow-x:auto">
              <table style="width:100%;border-collapse:collapse">
                <thead>
                  <tr>
                    <th style="${thStyle}">No</th>
                    <th style="${thStyle}">Nama Siswa</th>
                    <th style="${thStyle}">Kelas</th>
                    <th style="${thStyle};text-align:center">Benar</th>
                    <th style="${thStyle};text-align:center">Skor</th>
                    <th style="${thStyle}">Waktu</th>
                    <th style="${thStyle};text-align:right">Aksi</th>
                  </tr>
                </thead>
                <tbody id="nilai_tbody">
                  ${rowsHtml}
                  <tr id="nilai_search_empty" style="display:none">
                    <td colspan="7" style="padding:28px;text-align:center;color:var(--text-soft)">Tidak ada nama siswa yang cocok.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>`
        : `<div class="crud-empty">Belum ada siswa yang menyelesaikan kuis ini${filterNilaiKelas !== "Semua" ? ` di ${esc(/^kelas\b/i.test(filterNilaiKelas) ? filterNilaiKelas : "Kelas " + filterNilaiKelas)}` : ""}.</div>`
    }
  `;
}

function expExcelNilai() {
  const rows = getProcessedNilai();
  if (!rows.length) return toast("Belum ada data nilai untuk diunduh");
  const rata = Math.round(rows.reduce((a, b) => a + b.skor, 0) / rows.length);
  const quizJudul = rows[0].quiz_judul || "Kuis";
  const isBest = nilaiViewMode === "best";
  const colCount = isBest ? 7 : 6;

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Rekap Nilai</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
      <style>
        table { border-collapse: collapse; font-family: Calibri, Arial, sans-serif; }
        th, td { border: 1px solid #cbd5e1; padding: 7px 12px; font-size: 11pt; vertical-align: middle; }
        th { background-color: #0891b2; color: #ffffff; font-weight: bold; text-align: center; }
        .title { border: none; font-size: 14pt; font-weight: bold; color: #083344; padding: 8px 4px 10px; }
        .spacer { border: none; height: 10px; padding: 0; }
        .meta { background-color: #f1f5f9; font-weight: bold; }
        .center { text-align: center; }
        .ok { background-color: #dcfce7; color: #15803d; font-weight: bold; text-align: center; }
        .mid { background-color: #fef3c7; color: #92400e; font-weight: bold; text-align: center; }
        .low { background-color: #fee2e2; color: #b91c1c; font-weight: bold; text-align: center; }
      </style>
    </head>
    <body>
      <table>
        <colgroup>
          <col style="width:45px"><col style="width:230px"><col style="width:110px">
          <col style="width:90px"><col style="width:75px">${isBest ? `<col style="width:95px">` : ""}<col style="width:165px">
        </colgroup>
        <tr><td colspan="${colCount}" class="title">REKAPITULASI NILAI - ${esc(quizJudul.toUpperCase())}</td></tr>
        <tr><td colspan="2" class="meta">Mode Rekap</td><td colspan="${colCount - 2}">${isBest ? "Nilai Tertinggi per Siswa" : "Semua Percobaan"}</td></tr>
        <tr><td colspan="2" class="meta">Jumlah Data</td><td colspan="${colCount - 2}">${rows.length} ${isBest ? "siswa" : "percobaan"}</td></tr>
        <tr><td colspan="2" class="meta">Rata-rata Nilai</td><td colspan="${colCount - 2}">${rata}</td></tr>
        <tr><td colspan="${colCount}" class="spacer"></td></tr>
        <tr>
          <th>No</th><th>Nama Siswa</th><th>Kelas</th><th>Benar</th><th>Skor</th>${isBest ? "<th>Percobaan</th>" : ""}<th>Waktu</th>
        </tr>
        ${rows
          .map((r, idx) => {
            const cls = r.skor >= 75 ? "ok" : r.skor >= 50 ? "mid" : "low";
            const klsLabel = /^kelas\b/i.test(r.kelas) ? r.kelas : `Kelas ${r.kelas}`;
            return `<tr>
              <td class="center">${idx + 1}</td>
              <td>${esc(r.nama)}</td>
              <td class="center">${esc(klsLabel)}</td>
              <td class="center">${r.benar} / ${r.total}</td>
              <td class="${cls}">${r.skor}</td>
              ${isBest ? `<td class="center">${r._attempts}x</td>` : ""}
              <td class="center">${esc(fmtWaktuNilai(r.created_at))}</td>
            </tr>`;
          })
          .join("")}
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(["\uFEFF" + html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  const cleanTitle = quizJudul.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40) || "Kuis";
  a.download = `Rekap_Nilai_${cleanTitle}_${new Date().toISOString().slice(0, 10)}.xls`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}