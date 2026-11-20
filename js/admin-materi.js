/* Modul Materi Pembelajaran dengan Quill.js Rich Text Editor */
let quillMateri = null;
let livePreviewMode = "mobile";
let filterTopikMateri = "Semua";

function setLivePreviewMode(mode) {
  livePreviewMode = mode;
  const stage = document.getElementById("live_preview_stage");
  if (stage) {
    stage.className = `live-preview-stage ${mode}`;
  }
  const btnM = document.getElementById("btn_live_mobile");
  const btnD = document.getElementById("btn_live_desktop");
  if (btnM) btnM.classList.toggle("active", mode === "mobile");
  if (btnD) btnD.classList.toggle("active", mode === "desktop");
}

function updateLivePreview() {
  const judulInput = document.getElementById("j");
  const prevJudul = document.getElementById("prev_judul");
  const prevWaktu = document.getElementById("prev_waktu");
  const prevBody = document.getElementById("prev_body");
  if (!prevJudul || !prevBody) return;

  const judul = (judulInput?.value || "").trim() || "Judul Materi Belum Diisi";
  prevJudul.textContent = judul;

  let html = "";
  if (quillMateri) {
    html = quillMateri.root.innerHTML;
  }
  const textOnly = (new DOMParser().parseFromString(html || "", "text/html").body.textContent || "").trim();
  const words = textOnly ? textOnly.split(/\s+/).filter(Boolean).length : 0;
  const menit = Math.max(1, Math.ceil(words / 180));
  if (prevWaktu) {
    prevWaktu.textContent = `⏱ ${menit} menit baca`;
  }

  const hasMedia = quillMateri?.root.querySelector("img, iframe");
  if (!textOnly && !hasMedia) {
    prevBody.innerHTML = '<p style="color:#94a3b8;font-style:italic">Mulai mengetik di editor sebelah kiri untuk melihat tampilan langsung...</p>';
  } else {
    prevBody.innerHTML = fmt(html);
  }
}

function pMateri() {
  if (!edit) {
    quillMateri = null;
    const allList = [...(D.materi || [])].reverse();
    const list = allList.filter(
      (x) => filterTopikMateri === "Semua" || (x.topik || "Umum") === filterTopikMateri,
    );
    const items = list
      .map(
        (x) => `
      <div class="crud-card">
        <div class="crud-card-left">
          <h3 class="crud-card-title">${esc(x.judul || "Tanpa Judul")}</h3>
          <div class="crud-card-sub">${esc(x.topik || "Umum")} · ${hitungWaktuBaca(x.isi)}</div>
        </div>
        <div class="crud-actions">
          <button class="crud-btn-icon" onclick="edit='${x.id}';draw()" title="Ubah">${ICON_EDIT}</button>
          <button class="crud-btn-icon del" onclick="del('materi','${x.id}')" title="Hapus">${ICON_TRASH}</button>
        </div>
      </div>`,
      )
      .join("");

    return `
      <div class="crud-header">
        <div style="display:flex;align-items:center;gap:12px;flex:1;flex-wrap:wrap">
          <div class="crud-search-wrap">
            ${ICON_SEARCH}
            <input type="text" class="crud-search-input" placeholder="Cari materi fisika..." oninput="onCrudSearch(this.value)" />
          </div>
          <select onchange="filterTopikMateri=this.value;draw()" style="width:auto;padding:10px 14px;border-radius:12px;font-size:13.5px;font-weight:600;background:#fff;border:1.5px solid #e2e8f0;cursor:pointer">
            <option value="Semua" ${filterTopikMateri === "Semua" ? "selected" : ""}>Semua Topik</option>
            ${TOPIK.map((t) => `<option value="${esc(t)}" ${filterTopikMateri === t ? "selected" : ""}>${esc(t)}</option>`).join("")}
          </select>
        </div>
        <button class="crud-btn-add" onclick="edit='new';draw()">${ICON_PLUS} Tambah</button>
      </div>
      <div class="crud-card-list">
        ${items || `<div class="crud-empty">Belum ada materi ${filterTopikMateri !== "Semua" ? `pada topik <b>${esc(filterTopikMateri)}</b>` : ""}. Klik tombol <b>+ Tambah</b> untuk membuat baru.</div>`}
      </div>
    `;
  }

  const m = edit === "new"
    ? { judul: "", topik: filterTopikMateri !== "Semua" ? filterTopikMateri : "Umum", isi: "" }
    : (D.materi.find((x) => x.id === edit) || {
        judul: "",
        topik: "Umum",
        isi: "",
      });

  return `
    <div class="materi-editor-layout">
      <!-- Kolom Kiri: Editor Form -->
      <div class="materi-editor-pane">
        <div class="panel" style="margin-bottom:0">
          <div class="row" style="justify-content:space-between;align-items:center;margin-bottom:14px">
            <h3 style="margin:0">${m.id ? "Ubah" : "Tambah"} Materi</h3>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:12px;margin-bottom:14px">
            <div>
              <label>Judul Materi</label>
              <input id="j" value="${esc(m.judul)}" placeholder="Contoh: Hakikat Fisika dan Pengukuran" oninput="updateLivePreview()">
            </div>
            <div>
              <label>Topik Pembelajaran</label>
              <select id="topik">
                ${TOPIK.map((t) => `<option value="${esc(t)}" ${(m.topik || "Umum") === t ? "selected" : ""}>${esc(t)}</option>`).join("")}
              </select>
            </div>
          </div>
          <label style="margin-top:14px">Isi Materi</label>
          <div class="quill-wrapper" style="margin-bottom:16px">
            <div id="quill_editor"></div>
          </div>
          <div class="row" style="margin-top:20px;gap:10px">
            <button class="btn" onclick="sM('${m.id || ""}')">Simpan Materi</button>
            <button class="btn ghost" onclick="edit=null;quillMateri=null;draw()">Batal</button>
          </div>
        </div>
      </div>

      <!-- Kolom Kanan: Live Preview Frame Siswa -->
      <div class="materi-preview-pane">
        <div class="preview-card-sticky">
          <div class="preview-header-bar" style="justify-content:flex-end">
            <div class="preview-toggle-group">
              <button type="button" class="preview-toggle ${livePreviewMode === "mobile" ? "active" : ""}" id="btn_live_mobile" onclick="setLivePreviewMode('mobile')">📱 Mode HP</button>
              <button type="button" class="preview-toggle ${livePreviewMode === "desktop" ? "active" : ""}" id="btn_live_desktop" onclick="setLivePreviewMode('desktop')">💻 Mode Laptop</button>
            </div>
          </div>
          <div class="live-preview-stage ${livePreviewMode}" id="live_preview_stage">
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
                  <div class="read-body" id="prev_body">
                    ${m.isi ? fmt(m.isi) : '<p style="color:#94a3b8;font-style:italic">Mulai mengetik di editor sebelah kiri untuk melihat tampilan langsung...</p>'}
                  </div>
                </article>
              </div>
              <div class="device-home-bar"></div>
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

function sM(id) {
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
  const o = {
    id: id || Store.uid("m"),
    judul: $("#j").value.trim(),
    topik: $("#topik")?.value || existing?.topik || "Umum",
    kategori: existing?.kategori || "Umum",
    ringkasan: cuplikan(isiContent),
    video: existing?.video || "",
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

/* ===================================================
   MODAL PRATINJAU SISWA (PREVIEW HP & LAPTOP)
=================================================== */
let previewDevice = "mobile";

function openPreviewMateri() {
  const judul = ($("#j")?.value || "").trim() || "Judul Materi Belum Diisi";
  let isi = "";
  if (quillMateri) {
    isi = fmt(quillMateri.root.innerHTML);
  } else {
    isi = fmt($("#i")?.value || "");
  }

  const textOnly = (new DOMParser().parseFromString(isi || "", "text/html").body.textContent || "").trim();
  const wordCount = textOnly ? textOnly.split(/\s+/).length : 0;
  const menitBaca = Math.max(1, Math.ceil(wordCount / 180));

  let modal = document.getElementById("preview_modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "preview_modal";
    modal.className = "preview-overlay";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="preview-backdrop" onclick="closePreviewMateri()"></div>
    <div class="preview-dialog">
      <div class="preview-topbar">
        <div class="preview-toggle-group">
          <button type="button" class="preview-toggle ${previewDevice === "mobile" ? "active" : ""}" onclick="setPreviewDevice('mobile')">
            📱 Mode HP
          </button>
          <button type="button" class="preview-toggle ${previewDevice === "desktop" ? "active" : ""}" onclick="setPreviewDevice('desktop')">
            💻 Mode Laptop
          </button>
        </div>
        <button type="button" class="preview-close-btn" onclick="closePreviewMateri()" title="Tutup Pratinjau">✕</button>
      </div>
      <div class="preview-viewport ${previewDevice}">
        <div class="preview-frame">
          <article class="read" style="box-shadow:none;border:none">
            <div class="read-header">
              <h1>${esc(judul)}</h1>
              <div class="read-meta">
                <span>⏱ ${menitBaca} menit baca</span>
              </div>
            </div>
            <div class="read-body">
              ${isi || '<p style="color:#94a3b8;font-style:italic">Belum ada isi materi yang ditulis...</p>'}
            </div>
          </article>
        </div>
      </div>
    </div>
  `;
  modal.classList.add("open");
  document.body.style.overflow = "hidden";
}

function setPreviewDevice(dev) {
  previewDevice = dev;
  const viewport = document.querySelector(".preview-viewport");
  if (viewport) {
    viewport.className = `preview-viewport ${dev}`;
  }
  document.querySelectorAll(".preview-toggle").forEach((btn) => {
    btn.classList.toggle("active", btn.textContent.includes(dev === "mobile" ? "HP" : "Laptop"));
  });
}

function closePreviewMateri() {
  const modal = document.getElementById("preview_modal");
  if (modal) {
    modal.classList.remove("open");
  }
  document.body.style.overflow = "";
}

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closePreviewMateri();
});
