/* Modul Materi Pembelajaran */
function pMateri() {
  if (!edit) return uiCrudList(D.materi, "materi", (x) => x.kategori);
  const m = D.materi.find((x) => x.id === edit) || {
    judul: "",
    kategori: "",
    ringkasan: "",
    video: "",
    isi: "",
  };
  return `<div class="panel">
    <b>${m.id ? "Ubah" : "Tambah"} materi</b>
    <label>Judul</label><input id="j" value="${esc(m.judul)}">
    <label>Kategori / bab</label><input id="k" value="${esc(m.kategori)}" placeholder="Contoh: Kinematika">
    <label>Ringkasan singkat</label><input id="r" value="${esc(m.ringkasan)}">
    <label>Link video YouTube (opsional)</label><input id="v" value="${esc(m.video)}">
    <label>Isi materi</label><textarea id="i" style="min-height:260px">${esc(m.isi)}</textarea>
    <div class="hint">Format: awali baris dengan <code>## </code> untuk subjudul. Apit rumus dengan tiga tanda kutip terbalik (\`\`\`). Pisahkan paragraf dengan baris kosong.</div>
    ${uiFormActions(`sM('${m.id || ""}')`, "edit=null;draw()")}
  </div>`;
}

function sM(id) {
  const o = {
    id: id || Store.uid("m"),
    judul: $("#j").value.trim(),
    kategori: $("#k").value.trim() || "Umum",
    ringkasan: $("#r").value.trim(),
    video: $("#v").value.trim(),
    isi: $("#i").value,
  };
  if (!o.judul) return toast("Judul wajib diisi");
  up(D.materi, o);
  edit = null;
  save();
  draw();
}

