/* Modul Kuis / Latihan Soal */
let Q;

function pQuiz() {
  if (!edit)
    return uiCrudList(
      D.quiz,
      "quiz",
      (x) =>
        (TIPE[x.tipe] || "Link eksternal") +
        (x.tipe === "native" ? ` · ${x.soal.length} soal` : ""),
    );

  if (!Q || Q._for !== edit) {
    Q = structuredClone(
      D.quiz.find((x) => x.id === edit) || {
        judul: "",
        tipe: "native",
        link: "",
        deskripsi: "",
        soal: [],
      },
    );
    Q._for = edit;
  }

  return `<div class="panel"><b>${Q.id ? "Ubah" : "Tambah"} quiz</b>
    <label>Judul</label><input id="j" value="${esc(Q.judul)}"><label>Deskripsi</label><input id="d" value="${esc(Q.deskripsi)}">
    <label>Jenis quiz</label><select id="t" onchange="sync();draw()">${Object.entries(
      TIPE,
    )
      .map(
        ([k, v]) =>
          `<option value="${k}" ${Q.tipe === k ? "selected" : ""}>${v}</option>`,
      )
      .join("")}</select>
    ${
      Q.tipe === "native"
        ? `<label>Soal pilihan ganda</label>${Q.soal
            .map(
              (s, n) => `<div class="soal"><div class="row" style="justify-content:space-between"><b>Soal ${n + 1}</b><button class="btn sm del" onclick="sync();Q.soal.splice(${n},1);draw()">Hapus</button></div>
      <label>Pertanyaan</label><input data-n="${n}" data-f="q" value="${esc(s.q)}">${s.o.map((o, k) => `<label>Pilihan ${"ABCD"[k]}</label><input data-n="${n}" data-f="o${k}" value="${esc(o)}">`).join("")}
      <label>Jawaban benar</label><select data-n="${n}" data-f="a">${"ABCD"
        .split("")
        .map(
          (c, k) =>
            `<option value="${k}" ${s.a === k ? "selected" : ""}>${c}</option>`,
        )
        .join("")}</select>
      <label>Pembahasan (opsional)</label><input data-n="${n}" data-f="e" value="${esc(s.e || "")}"></div>`,
            )
            .join("")}
      <button class="btn sm ghost" style="margin-top:14px" onclick="sync();Q.soal.push({q:'',o:['','','',''],a:0,e:''});draw()">Tambah soal</button>`
        : `<label>Link kuis</label><input id="l" value="${esc(Q.link)}" placeholder="https://"><div class="hint">Siswa akan membuka link ini di tab baru (bisa berupa Google Form, Quizizz, dll).</div>`
    }
    ${uiFormActions("sQ()", "edit=null;Q=null;draw()")}
  </div>`;
}

function sync() {
  Q.judul = $("#j").value;
  Q.deskripsi = $("#d").value;
  Q.tipe = $("#t").value;
  if ($("#l")) Q.link = $("#l").value;
  document.querySelectorAll("[data-n]").forEach((e) => {
    const s = Q.soal[+e.dataset.n],
      f = e.dataset.f;
    f[0] === "o"
      ? (s.o[+f[1]] = e.value)
      : f === "a"
        ? (s.a = +e.value)
        : (s[f] = e.value);
  });
}

function sQ() {
  sync();
  if (!Q.judul.trim()) return toast("Judul wajib diisi");
  if (Q.tipe !== "native" && !/^https?:\/\//.test(Q.link))
    return toast("Link harus diawali https://");
  if (
    Q.tipe === "native" &&
    (!Q.soal.length ||
      Q.soal.some((s) => !s.q.trim() || s.o.some((o) => !o.trim())))
  )
    return toast("Lengkapi semua soal dan pilihan");
  const o = { ...Q, id: Q.id || Store.uid("q") };
  delete o._for;
  if (o.tipe !== "native") o.soal = [];
  up(D.quiz, o);
  Q = null;
  edit = null;
  save();
  draw();
}

