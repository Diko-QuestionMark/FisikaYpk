/* Modul Materi Pembelajaran dengan Quill.js Rich Text Editor */
let quillMateri = null;

function pMateri() {
  if (!edit) {
    quillMateri = null;
    return uiCrudList(D.materi, "materi", (x) => x.kategori);
  }

  const m = edit === "new"
    ? { judul: "", kategori: "", isi: "" }
    : (D.materi.find((x) => x.id === edit) || {
        judul: "",
        kategori: "",
        isi: "",
      });

  return `<div class="panel">
    <b>${m.id ? "Ubah" : "Tambah"} materi</b>
    <div class="form-grid-2" style="margin-top:14px">
      <div>
        <label>Judul Materi</label>
        <input id="j" value="${esc(m.judul)}" placeholder="Contoh: Hukum Newton tentang Gerak">
      </div>
      <div>
        <label>Bab / Kategori</label>
        <input id="k" value="${esc(m.kategori)}" placeholder="Contoh: Dinamika Gerak, Listrik Dinamis">
      </div>
    </div>
    <label style="margin-top:14px">Isi materi</label>
    <div class="quill-wrapper" style="margin-bottom:16px">
      <div id="quill_editor"></div>
    </div>
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
    const hasVid = quillMateri.root.querySelector("iframe") !== null;
    isiContent = (textLen > 0 || hasImg || hasVid) ? quillMateri.root.innerHTML : "";
  } else {
    const fallbackTextarea = $("#i");
    isiContent = fallbackTextarea ? fallbackTextarea.value : "";
  }

  const existing = D.materi.find((x) => x.id === id);
  const o = {
    id: id || Store.uid("m"),
    judul: $("#j").value.trim(),
    kategori: $("#k").value.trim() || "Umum",
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
