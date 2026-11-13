/* Modul Materi Pembelajaran dengan Quill.js Rich Text Editor */
let quillMateri = null;

function pMateri() {
  if (!edit) {
    quillMateri = null;
    return uiCrudList(D.materi, "materi", (x) => x.kategori);
  }

  const m = edit === "new"
    ? { judul: "", kategori: "", ringkasan: "", video: "", isi: "" }
    : (D.materi.find((x) => x.id === edit) || {
        judul: "",
        kategori: "",
        ringkasan: "",
        video: "",
        isi: "",
      });

  return `<div class="panel">
    <b>${m.id ? "Ubah" : "Tambah"} materi</b>
    <div class="form-grid-2" style="margin-top:14px">
      <div>
        <label>Judul</label>
        <input id="j" value="${esc(m.judul)}" placeholder="Tuliskan judul pokok bahasan materi">
      </div>
      <div>
        <label>Bab</label>
        <input id="k" value="${esc(m.kategori)}" placeholder="Tuliskan nama bab materi">
      </div>
    </div>
    <div class="form-grid-2">
      <div>
        <label>Ringkasan singkat</label>
        <input id="r" value="${esc(m.ringkasan)}" placeholder="Tuliskan gambaran ringkas materi sebagai pengantar awal siswa">
      </div>
      <div>
        <label>Link video YouTube (opsional)</label>
        <input id="v" value="${esc(m.video)}" placeholder="Tempelkan tautan video YouTube pendukung pembelajaran jika ada">
      </div>
    </div>
    <label style="margin-top:12px">Isi materi</label>
    <div class="quill-wrapper" style="margin-bottom:8px">
      <div id="quill_editor"></div>
    </div>
    <div class="hint" style="margin-bottom:16px">Gunakan toolbar di atas untuk mengatur format teks (Tebal, Miring, Warna, Heading, Daftar Poin) atau menyisipkan gambar langsung.</div>
    ${uiFormActions(`sM('${m.id || ""}')`, "edit=null;quillMateri=null;draw()")}
  </div>`;
}

function initQuillMateri() {
  const container = document.getElementById("quill_editor");
  if (!container || !window.Quill) return;

  const m = edit === "new"
    ? { isi: "" }
    : (D.materi.find((x) => x.id === edit) || { isi: "" });

  quillMateri = new Quill("#quill_editor", {
    theme: "snow",
    placeholder: "Tuliskan isi materi pembelajaran di sini... Anda bisa mengubah gaya tulisan, membuat daftar poin, atau menyisipkan foto diagram materi.",
    modules: {
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: [] }],
        ["blockquote", "code-block"],
        ["link", "image"],
        ["clean"],
      ],
    },
  });

  // Muat konten materi (jika format markdown lama, ubah otomatis menjadi HTML)
  let raw = m.isi || "";
  if (raw && !/<[a-z][\s\S]*>/i.test(raw)) {
    raw = fmt(raw);
  }
  quillMateri.root.innerHTML = raw;
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
    isiContent = (textLen > 0 || hasImg) ? quillMateri.root.innerHTML : "";
  } else {
    const fallbackTextarea = $("#i");
    isiContent = fallbackTextarea ? fallbackTextarea.value : "";
  }

  const o = {
    id: id || Store.uid("m"),
    judul: $("#j").value.trim(),
    kategori: $("#k").value.trim() || "Umum",
    ringkasan: $("#r").value.trim(),
    video: $("#v").value.trim(),
    isi: isiContent,
  };
  if (!o.judul) return toast("Judul wajib diisi");
  up(D.materi, o);
  edit = null;
  quillMateri = null;
  save();
  draw();
}
