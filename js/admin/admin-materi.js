/* Modul Materi Pembelajaran dengan Quill.js Rich Text Editor */
let quillMateri = null;
let filterTopikMateri = "Semua";
let filterKelasMateri = "semua";

function updateLivePreview() {
  const judulInput = document.getElementById("j");
  const prevJudul = document.getElementById("prev_judul");
  const prevWaktu = document.getElementById("prev_waktu");
  const prevCover = document.getElementById("prev_cover");
  const prevBody = document.getElementById("prev_body");
  if (!prevJudul || !prevBody) return;

  const judul = (judulInput?.value || "").trim() || "Judul Materi Belum Diisi";
  prevJudul.textContent = judul;

  if (prevCover) {
    const coverUrl = (document.getElementById("gambar_sampul")?.value || "").trim();
    prevCover.innerHTML = coverUrl
      ? `<img src="${esc(coverUrl)}" alt="${esc(judul)}" style="width:100%;max-height:220px;object-fit:cover;border-radius:10px;margin:0 0 14px;display:block">`
      : "";
  }

  let html = "";
  if (quillMateri) {
    html = quillMateri.root.innerHTML;
  }
  const textOnly = (new DOMParser().parseFromString(html || "", "text/html").body.textContent || "").trim();
  if (prevWaktu) {
    prevWaktu.textContent = `⏱ ${hitungWaktuBaca(html)}`;
  }

  const hasMedia = quillMateri?.root.querySelector("img, iframe");
  if (!textOnly && !hasMedia) {
    prevBody.innerHTML = '<p style="color:#94a3b8;font-style:italic">Mulai mengetik di editor sebelah kiri untuk melihat tampilan langsung...</p>';
  } else {
    prevBody.innerHTML = fmt(html);
  }

  const prevQuiz = document.getElementById("prev_quiz");
  if (prevQuiz) {
    const qid = (document.getElementById("quiz_terkait")?.value || "").trim();
    const lq = qid ? (D.quiz || []).find((x) => x.id === qid) : null;
    if (lq) {
      const isNative = lq.tipe === "native";
      const info = isNative
        ? `${(lq.soal || []).length} soal · ${lq.durasi === 0 ? "Tanpa batas" : (lq.durasi || Math.max(1, Math.round((lq.soal || []).length * 1.5))) + " menit"}`
        : "Kuis Eksternal";
      prevQuiz.innerHTML = `
        <div style="margin-top:24px;padding:14px 16px;background:var(--bg);border:1px solid var(--border);border-radius:12px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
          <div style="min-width:0">
            <div style="font-size:11.5px;font-weight:700;color:var(--primary);margin-bottom:2px">Uji Pemahaman</div>
            <div style="font-size:14.5px;font-weight:700;color:var(--text)">${esc(lq.judul)}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${esc(info)}</div>
          </div>
          <span class="btn sm" style="pointer-events:none">${isNative ? "Kerjakan kuis →" : "Buka kuis ↗"}</span>
        </div>`;
    } else {
      prevQuiz.innerHTML = "";
    }
  }
}

function handleGambarUpload(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  if (file.size > 500 * 1024) {
    if (typeof toast === "function") toast("Ukuran gambar melebihi batas 500 KB");
    alert("Ukuran gambar melebihi batas 500 KB. Silakan pilih gambar yang lebih kecil (maksimal 500 KB).");
    input.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const inp = document.getElementById("gambar_sampul");
    if (inp) {
      inp.value = e.target.result;
      if (typeof refreshSampulUI === "function") refreshSampulUI();
      if (typeof updateLivePreview === "function") updateLivePreview();
      if (typeof toast === "function") toast("Gambar berhasil dimuat");
    }
  };
  reader.readAsDataURL(file);
}

function refreshSampulUI() {
  const inp = document.getElementById("gambar_sampul");
  const chip = document.getElementById("sampul_chip");
  const chipImg = document.getElementById("sampul_chip_img");
  const btnDel = document.getElementById("btn_hapus_sampul");
  if (!inp) return;
  const val = (inp.value || "").trim();
  const isData = val.startsWith("data:");
  if (chip) chip.style.display = isData ? "inline-flex" : "none";
  if (chipImg && isData) chipImg.src = val;
  inp.style.display = isData ? "none" : "block";
  if (btnDel) btnDel.style.display = val ? "inline-flex" : "none";
}

function hapusGambarSampul() {
  const inp = document.getElementById("gambar_sampul");
  const f = document.getElementById("file_gambar_sampul");
  if (inp) inp.value = "";
  if (f) f.value = "";
  refreshSampulUI();
  updateLivePreview();
}

function getTopikVisual(topik) {
  const raw = String(topik || "").toLowerCase().trim();
  let key = typeof normalizeTopik === "function" ? normalizeTopik(raw) : "umum";
  if (key === "umum" && raw.includes("energi")) key = "energi";
  const map = {
    pengukuran: {
      bg: "#e4f1ff",
      color: "#0284c7",
      svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/></svg>`,
    },
    energi: {
      bg: "#e1f6ea",
      color: "#16a34a",
      svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    },
    pemanasan: {
      bg: "#fff1e1",
      color: "#ea580c",
      svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/><path d="M12 14v-4"/></svg>`,
    },
    umum: {
      bg: "var(--primary-soft)",
      color: "var(--primary)",
      svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1.5" fill="currentColor"/><ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(30 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(-30 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(90 12 12)"/></svg>`,
    },
  };
  return map[key] || map.umum;
}

function pMateri() {
  if (!edit) {
    quillMateri = null;
    const allList = [...(D.materi || [])].reverse();
    const list = allList.filter(
      (x) =>
        (filterTopikMateri === "Semua" || normalizeTopik(x.topik) === filterTopikMateri) &&
        (filterKelasMateri === "semua" || normalizeKelasLevel(x.kelas) === filterKelasMateri),
    );
    const items = list
      .map((x) => {
        const topikKey = normalizeTopik(x.topik);
        const topikLabel = TOPIK_MAP[topikKey] || "Umum";
        const vis = getTopikVisual(topikKey);
        const isPub = x.published !== false;
        const thumb = x.gambar
          ? `<img src="${esc(x.gambar)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block">`
          : vis.svg;
        return `
      <div class="crud-card" style="${isPub ? "" : "opacity:0.82"}">
        <div style="display:flex;align-items:center;gap:14px;min-width:0;flex:1">
          <div style="width:44px;height:44px;border-radius:12px;background:${vis.bg};color:${vis.color};display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0" title="${esc(topikLabel)}">${thumb}</div>
          <div class="crud-card-left">
            <h3 class="crud-card-title">${esc(x.judul || "Tanpa Judul")}</h3>
            <div class="crud-card-sub" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:4px;font-size:12.5px">
              <button type="button" onclick="toggleMateriPublish('${x.id}')" title="Klik untuk ubah status tampil" style="border:1px solid ${isPub ? "#bbf7d0" : "#fde68a"};cursor:pointer;display:inline-flex;align-items:center;gap:4px;padding:1px 8px;border-radius:999px;font:inherit;font-size:11.5px;font-weight:700;background:${isPub ? "#f0fdf4" : "#fffbeb"};color:${isPub ? "#15803d" : "#b45309"}">${isPub ? "● Tampil" : "○ Disembunyikan"}</button>
              <span style="color:var(--text-muted);font-weight:600">· ${esc(topikLabel)}</span>
              ${normalizeKelasLevel(x.kelas) !== "semua" ? `<span style="color:var(--text-muted)">· ${esc(formatKelasLevelLabel(x.kelas))}</span>` : ""}
              <span style="color:var(--text-muted)">· ${hitungWaktuBaca(x.isi)}</span>
              ${x.quizId && (D.quiz || []).some((q) => q.id === x.quizId) ? `<span style="color:var(--text-muted)">· Ada kuis</span>` : ""}
            </div>
          </div>
        </div>
        <div class="crud-actions">
          <button class="crud-btn-icon" onclick="edit='${x.id}';draw()" title="Ubah">${ICON_EDIT}</button>
          <button class="crud-btn-icon del" onclick="del('materi','${x.id}')" title="Hapus">${ICON_TRASH}</button>
        </div>
      </div>`;
      })
      .join("");

    return `
      ${filterTopikMateri === "Semua"
        ? renderBreadcrumb([{ label: "Materi" }])
        : renderBreadcrumb([
            { label: "Materi", onClick: "filterTopikMateri='Semua';draw()" },
            { label: TOPIK_MAP[filterTopikMateri] || filterTopikMateri }
          ])
      }
      <div class="crud-header">
        <div style="display:flex;align-items:center;gap:12px;flex:1;flex-wrap:wrap">
          <div class="crud-search-wrap">
            ${ICON_SEARCH}
            <input type="text" class="crud-search-input" placeholder="Cari materi fisika..." oninput="onCrudSearch(this.value)" />
          </div>
          <select onchange="filterTopikMateri=this.value;draw()" style="width:auto;padding:10px 14px;border-radius:12px;font-size:13.5px;font-weight:600;background:#fff;border:1.5px solid #e2e8f0;cursor:pointer">
            <option value="Semua" ${filterTopikMateri === "Semua" ? "selected" : ""}>Semua Topik</option>
            ${TOPIK_LIST.map((t) => `<option value="${esc(t.id)}" ${filterTopikMateri === t.id ? "selected" : ""}>${esc(t.label)}</option>`).join("")}
          </select>
          <select onchange="filterKelasMateri=this.value;draw()" style="width:auto;padding:10px 14px;border-radius:12px;font-size:13.5px;font-weight:600;background:#fff;border:1.5px solid #e2e8f0;cursor:pointer">
            ${KELAS_LEVEL_LIST.map((k) => `<option value="${esc(k.id)}" ${filterKelasMateri === k.id ? "selected" : ""}>${esc(k.label)}</option>`).join("")}
          </select>
        </div>
        <button class="crud-btn-add" onclick="edit='new';draw()">${ICON_PLUS} Tambah</button>
      </div>
      <div class="crud-card-list">
        ${items || `<div class="crud-empty">Belum ada materi ${filterTopikMateri !== "Semua" ? `pada topik <b>${esc(TOPIK_MAP[filterTopikMateri] || filterTopikMateri)}</b>` : ""}. Klik tombol <b>+ Tambah</b> untuk membuat baru.</div>`}
      </div>
    `;
  }

  const m = edit === "new"
    ? { judul: "", topik: filterTopikMateri !== "Semua" ? filterTopikMateri : "umum", kelas: filterKelasMateri !== "semua" ? filterKelasMateri : "semua", gambar: "", quizId: "", isi: "" }
    : (D.materi.find((x) => x.id === edit) || {
        judul: "",
        topik: "umum",
        gambar: "",
        quizId: "",
        isi: "",
      });

  const quizOpts = (D.quiz || [])
    .map((q) => {
      const tag = q.tipe === "native" ? `${(q.soal || []).length} soal` : "Eksternal";
      return `<option value="${esc(q.id)}" ${m.quizId === q.id ? "selected" : ""}>${esc(q.judul || "Tanpa Judul")} (${tag})</option>`;
    })
    .join("");

  const curTopik = normalizeTopik(m.topik);
  const curKelas = normalizeKelasLevel(m.kelas);

  const crumbs = [
    { label: "Materi", onClick: "edit=null;quillMateri=null;draw()" },
  ];
  if (filterTopikMateri !== "Semua") {
    crumbs.push({
      label: TOPIK_MAP[filterTopikMateri] || filterTopikMateri,
      onClick: "edit=null;quillMateri=null;draw()",
    });
  }
  crumbs.push({ label: m.id ? "Edit materi" : "Tambah materi" });

  return `
    ${renderBreadcrumb(crumbs)}
    <div class="materi-editor-layout">
      <!-- Kolom Kiri: Editor Form -->
      <div class="materi-editor-pane">
        <div class="panel" style="margin-bottom:0">
          <div class="row" style="justify-content:space-between;align-items:center;margin-bottom:14px">
            <h3 style="margin:0">${m.id ? "Ubah" : "Tambah"} Materi</h3>
          </div>

          <div style="margin-bottom:12px">
            <label style="margin-top:0">Judul Materi</label>
            <input id="j" value="${esc(m.judul)}" placeholder="Contoh: Hakikat Fisika" oninput="updateLivePreview()">
          </div>

          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(150px, 1fr));gap:10px;margin-bottom:12px">
            <div>
              <label style="margin-top:0">Topik</label>
              <select id="topik" onchange="updateLivePreview()">
                ${TOPIK_LIST.map((t) => `<option value="${esc(t.id)}" ${curTopik === t.id ? "selected" : ""}>${esc(t.label)}</option>`).join("")}
              </select>
            </div>
            <div>
              <label style="margin-top:0">Untuk Kelas</label>
              <select id="kelas_materi">
                ${KELAS_LEVEL_LIST.map((k) => `<option value="${esc(k.id)}" ${curKelas === k.id ? "selected" : ""}>${esc(k.label)}</option>`).join("")}
              </select>
            </div>
            <div>
              <label style="margin-top:0">Kuis Terkait</label>
              <select id="quiz_terkait" onchange="updateLivePreview()">
                <option value="">Tidak ada</option>
                ${quizOpts}
              </select>
            </div>
          </div>

          <div style="margin-bottom:14px">
            <label style="margin-top:0">Gambar Sampul</label>
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
              <div id="sampul_chip" style="display:${String(m.gambar || "").startsWith("data:") ? "inline-flex" : "none"};align-items:center;gap:8px;flex:1;min-width:180px;padding:6px 10px;background:var(--bg);border:1px solid var(--border);border-radius:10px;font-size:13px;font-weight:600;color:var(--text)">
                <img id="sampul_chip_img" src="${String(m.gambar || "").startsWith("data:") ? esc(m.gambar) : ""}" alt="" style="width:28px;height:28px;border-radius:6px;object-fit:cover">
                <span>✓ Sampul terpasang</span>
              </div>
              <input id="gambar_sampul" value="${esc(m.gambar || "")}" placeholder="Path (aset/...) atau URL gambar sampul..." style="flex:1;min-width:180px;display:${String(m.gambar || "").startsWith("data:") ? "none" : "block"}" oninput="refreshSampulUI();updateLivePreview()">
              <label class="btn sm ghost" style="margin:0;cursor:pointer;display:inline-flex;align-items:center;gap:6px;padding:9px 12px">
                📁 Unggah
                <input type="file" id="file_gambar_sampul" accept="image/*" hidden onchange="handleGambarUpload(this)">
              </label>
              <button type="button" id="btn_hapus_sampul" class="btn sm ghost" onclick="hapusGambarSampul()" title="Hapus gambar sampul" style="color:var(--danger);display:${m.gambar ? "inline-flex" : "none"}">Hapus</button>
            </div>
          </div>

          <label style="margin-top:4px">Isi Materi</label>
          <div class="quill-wrapper" style="margin-bottom:0">
            <div id="quill_editor"></div>
          </div>
        </div>
      </div>

      <!-- Kolom Kanan: Live Preview Frame Siswa -->
      <div class="materi-preview-pane">
        <div class="preview-card-sticky">
          <div class="live-preview-stage mobile" id="live_preview_stage">
            <div class="live-preview-screen">
              <div class="device-notch"></div>
              <div class="device-screen-scroll">
                <article class="read">
                  <div class="read-header">
                    <h1 id="prev_judul">${esc(m.judul || "Judul Materi")}</h1>
                    <div class="read-meta">
                      <span id="prev_waktu">⏱ ${hitungWaktuBaca(m.isi)}</span>
                    </div>
                  </div>
                  <div id="prev_cover">${m.gambar ? `<img src="${esc(m.gambar)}" alt="${esc(m.judul || "")}" style="width:100%;max-height:220px;object-fit:cover;border-radius:10px;margin:0 0 14px;display:block">` : ""}</div>
                  <div class="read-body" id="prev_body">
                    ${m.isi ? fmt(m.isi) : '<p style="color:#94a3b8;font-style:italic">Mulai mengetik di editor sebelah kiri untuk melihat tampilan langsung...</p>'}
                  </div>
                  <div id="prev_quiz"></div>
                </article>
              </div>
              <div class="device-home-bar"></div>
            </div>
          </div>
          <div class="panel" style="margin:14px 0 0;padding:14px 16px">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 12px;background:var(--bg);border:1px solid var(--border);border-radius:10px;margin-bottom:10px">
              <span style="font-size:13px;font-weight:700;color:var(--text)">Tampilkan ke Siswa</span>
              <label class="qe-switch">
                <input type="checkbox" id="materi_published" ${m.published !== false ? "checked" : ""}>
                <span class="qe-slider"></span>
              </label>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px">
              <button type="button" class="qe-btn-save" style="width:100%;text-align:center" onclick="sM('${m.id || ""}')">Simpan Materi</button>
              <button type="button" class="btn ghost" style="width:100%;text-align:center" onclick="edit=null;quillMateri=null;draw()">Batal</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function initQuillMateri() {
  const container = document.getElementById("quill_editor");
  if (!container || !window.Quill) return;

  if (window.QuillResizeImage) {
    try {
      Quill.register("modules/resize", window.QuillResizeImage);
    } catch (e) {}
  }

  // Kustomisasi Video Blot agar otomatis mengubah link YouTube apapun (watch?v=, youtu.be/) menjadi embed resmi dan aman
  try {
    const BaseVideo = Quill.import("formats/video");
    class CustomVideo extends BaseVideo {
      static create(value) {
        let url = String(value || "").trim();
        const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
        if (ytMatch) {
          url = `https://www.youtube.com/embed/${ytMatch[1]}`;
        }
        const node = super.create(url);
        node.setAttribute("frameborder", "0");
        node.setAttribute("allowfullscreen", "true");
        node.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
        node.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
        node.setAttribute("src", url);
        return node;
      }
      static sanitize(url) {
        let clean = super.sanitize(url);
        const ytMatch = String(clean || "").match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
        if (ytMatch) {
          return `https://www.youtube.com/embed/${ytMatch[1]}`;
        }
        return clean;
      }
    }
    Quill.register(CustomVideo, true);
  } catch (e) {}

  const m = edit === "new"
    ? { isi: "" }
    : (D.materi.find((x) => x.id === edit) || { isi: "" });

  quillMateri = new Quill("#quill_editor", {
    theme: "snow",
    placeholder: "Tuliskan isi materi pembelajaran di sini... Anda bisa mengatur format tulisan, rumus fisika, menyisipkan foto diagram, atau menyematkan video YouTube pendukung.",
    modules: {
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: [] }],
        ["blockquote", "code-block"],
        ["link", "image", "video"],
        ["clean"],
      ],
      ...(window.QuillResizeImage
        ? {
            resize: {
              disableMediaTypes: {
                disableVideos: true,
                disableIframes: true,
              },
              locale: {
                floatLeft: "Kiri",
                floatRight: "Kanan",
                center: "Tengah",
                restore: "Asli",
                altTip: "Tahan Alt untuk mengunci rasio aspek",
                inputTip: "Tekan Enter untuk menerapkan",
              },
            },
          }
        : {}),
    },
  });

  // Muat konten materi (gunakan dangerouslyPasteHTML agar tag <pre> rumus dan HTML standar diproses rapi oleh Quill)
  let raw = m.isi || "";
  if (raw) {
    raw = fmt(raw);
    quillMateri.clipboard.dangerouslyPasteHTML(raw);
  } else {
    quillMateri.setContents([]);
  }

  // Pasang petunjuk (tooltip) bahasa Indonesia di setiap tombol toolbar saat di-hover
  setupQuillTooltips(quillMateri.getModule("toolbar")?.container || container.previousElementSibling);

  // Pasang live update untuk kolom pratinjau di samping
  quillMateri.on("text-change", () => {
    updateLivePreview();
  });
  setTimeout(updateLivePreview, 60);
}

function setupQuillTooltips(toolbar) {
  if (!toolbar) return;
  const tooltips = [
    { sel: ".ql-header", tip: "Ukuran Judul (Heading / Normal)" },
    { sel: ".ql-bold", tip: "Tebal / Bold (Ctrl+B)" },
    { sel: ".ql-italic", tip: "Miring / Italic (Ctrl+I)" },
    { sel: ".ql-underline", tip: "Garis Bawah / Underline (Ctrl+U)" },
    { sel: ".ql-strike", tip: "Coretan Teks / Strikethrough" },
    { sel: ".ql-color", tip: "Warna Teks" },
    { sel: ".ql-background", tip: "Warna Latar Teks (Stabilo)" },
    { sel: '.ql-list[value="ordered"]', tip: "Daftar Nomor (1, 2, 3)" },
    { sel: '.ql-list[value="bullet"]', tip: "Daftar Poin (Bullet)" },
    { sel: ".ql-align", tip: "Perataan Teks (Kiri / Tengah / Kanan)" },
    { sel: ".ql-blockquote", tip: "Kutipan / Catatan Penting" },
    { sel: ".ql-code-block", tip: "Kotak Rumus / Blok Kode" },
    { sel: ".ql-link", tip: "Sisipkan Tautan Web (Link)" },
    { sel: ".ql-image", tip: "Sisipkan Gambar / Diagram" },
    { sel: ".ql-video", tip: "Sematkan Video YouTube" },
    { sel: ".ql-clean", tip: "Hapus Semua Format Teks" },
  ];

  tooltips.forEach(({ sel, tip }) => {
    const el = toolbar.querySelector(sel);
    if (el) {
      el.setAttribute("title", tip);
      el.setAttribute("aria-label", tip);
      const label = el.querySelector(".ql-picker-label");
      if (label) label.setAttribute("title", tip);
    }
  });
}

function afterDraw() {
  if (tab === "materi" && edit) {
    initQuillMateri();
  }
}

function toggleMateriPublish(id) {
  const m = (D.materi || []).find((x) => x.id === id);
  if (!m) return;
  m.published = m.published === false;
  m.updatedAt = Date.now();
  save();
  draw();
  toast(m.published ? "Materi ditampilkan" : "Materi disembunyikan");
}

function sM(id, publishState) {
  let isiContent = "";
  if (quillMateri) {
    const textLen = quillMateri.getText().trim().length;
    const hasImg = quillMateri.root.querySelector("img") !== null;
    const hasVid = quillMateri.root.querySelector("iframe") !== null;
    isiContent = (textLen > 0 || hasImg || hasVid) ? fmt(quillMateri.root.innerHTML) : "";
  } else {
    const fallbackTextarea = $("#i");
    isiContent = fallbackTextarea ? fallbackTextarea.value : "";
  }

  const existing = D.materi.find((x) => x.id === id);
  const now = Date.now();
  const rawTopik = $("#topik")?.value || existing?.topik || "umum";
  const topikNormalized = normalizeTopik(rawTopik);
  const gambarInput = $("#gambar_sampul");
  const gambarVal = gambarInput ? gambarInput.value.trim() : (existing?.gambar || "");

  const o = {
    id: id || Store.uid("m"),
    judul: $("#j").value.trim(),
    topik: topikNormalized,
    kelas: normalizeKelasLevel($("#kelas_materi")?.value || existing?.kelas || "semua"),
    gambar: gambarVal,
    quizId: ($("#quiz_terkait")?.value || "").trim(),
    kategori: existing?.kategori || "Umum",
    ringkasan: cuplikan(isiContent),
    video: existing?.video || "",
    published: $("#materi_published") ? $("#materi_published").checked : (typeof publishState === "boolean" ? publishState : (existing ? existing.published !== false : true)),
    isi: isiContent,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  if (!o.judul) return toast("Judul wajib diisi");
  up(D.materi, o);
  edit = null;
  quillMateri = null;
  save();
  draw();
}