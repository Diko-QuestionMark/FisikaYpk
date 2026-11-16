/* Modul Materi Pembelajaran dengan Quill.js Rich Text Editor */
let quillMateri = null;

function pMateri() {
  if (!edit) {
    quillMateri = null;
    return uiCrudList(D.materi, "materi", (x) => cuplikan(x.isi, 60));
  }

  const m = edit === "new"
    ? { judul: "", isi: "" }
    : (D.materi.find((x) => x.id === edit) || {
        judul: "",
        isi: "",
      });

  return `<div class="panel">
    <b>${m.id ? "Ubah" : "Tambah"} materi</b>
    <div style="margin-top:14px">
      <label>Judul Materi</label>
      <input id="j" value="${esc(m.judul)}" placeholder="Contoh: Hukum Newton tentang Gerak">
    </div>
    <label style="margin-top:14px">Isi materi</label>
    <div class="quill-wrapper" style="margin-bottom:16px">
      <div id="quill_editor"></div>
    </div>
    <div class="row" style="margin-top:20px;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
      <div class="row" style="gap:8px">
        <button class="btn" onclick="sM('${m.id || ""}')">Simpan</button>
        <button class="btn ghost" onclick="edit=null;quillMateri=null;draw()">Batal</button>
      </div>
      <button type="button" class="btn ghost" onclick="openPreviewMateri()">Pratinjau</button>
    </div>
  </div>`;
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

  // Muat konten materi (rapikan format video dan HTML)
  let raw = m.isi || "";
  if (raw) {
    raw = fmt(raw);
  }
  quillMateri.root.innerHTML = raw;

  // Pasang petunjuk (tooltip) bahasa Indonesia di setiap tombol toolbar saat di-hover
  setupQuillTooltips(quillMateri.getModule("toolbar")?.container || container.previousElementSibling);
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
  const o = {
    id: id || Store.uid("m"),
    judul: $("#j").value.trim(),
    kategori: existing?.kategori || "Umum",
    ringkasan: cuplikan(isiContent),
    video: existing?.video || "",
    isi: isiContent,
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
