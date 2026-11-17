/* Modul Kuis / Latihan Soal - Clean Professional Layout */
let Q;

function pQuiz() {
  if (!edit) {
    Q = null;
    return uiCrudList(
      D.quiz,
      "quiz",
      (x) =>
        (TIPE[x.tipe] || "Link eksternal") +
        (x.tipe === "native" ? ` · ${x.soal.length} soal` : ""),
    );
  }

  if (!Q || Q._for !== edit) {
    Q = structuredClone(
      D.quiz.find((x) => x.id === edit) || {
        judul: "",
        tipe: "native",
        link: "",
        soal: [],
      },
    );
    Q._for = edit;
  }

  return `<div class="panel">
    <div class="row" style="justify-content:space-between;align-items:center;margin-bottom:20px">
      <h3 style="margin:0">${Q.id ? "Ubah" : "Tambah"} Kuis</h3>
    </div>

    <!-- Informasi Utama Kuis -->
    <div style="margin-bottom:28px">
      <div class="form-grid-2">
        <div>
          <label>Judul Kuis</label>
          <input id="j" value="${esc(Q.judul)}" placeholder="Contoh: Kuis Kinematika Gerak Lurus">
        </div>
        <div>
          <label>Jenis Kuis</label>
          <select id="t" onchange="sync();draw()">
            ${Object.entries(TIPE)
              .map(
                ([k, v]) =>
                  `<option value="${k}" ${Q.tipe === k ? "selected" : ""}>${v}</option>`,
              )
              .join("")}
          </select>
        </div>
      </div>

      ${
        Q.tipe !== "native"
          ? `<div style="margin-top:14px">
              <label>Link Kuis</label>
              <input id="l" value="${esc(Q.link)}" placeholder="https://">
            </div>`
          : ""
      }
    </div>

    <!-- Butir Soal -->
    ${
      Q.tipe === "native"
        ? `
        <div style="margin-bottom:20px">
          ${
            Q.soal.length === 0
              ? `<div class="empty" style="margin-bottom:20px">Belum ada butir soal. Klik tombol di bawah untuk membuat soal baru.</div>`
              : Q.soal.map((s, n) => renderSoalCard(s, n)).join("")
          }
        </div>

        <button type="button" class="btn-add-soal" onclick="tambahSoalBaru()">
          ${ICON_PLUS} Tambah Butir Soal
        </button>
        `
        : ""
    }

    <div class="row" style="margin-top:24px;padding-top:20px;border-top:1px solid var(--border);gap:8px">
      <button class="btn" onclick="sQ()">Simpan</button>
      <button class="btn ghost" onclick="edit=null;Q=null;draw()">Batal</button>
    </div>
  </div>`;
}

function renderSoalCard(s, n) {
  return `
    <div class="quiz-soal-block">
      <div class="quiz-soal-top">
        <span class="quiz-soal-title">Soal ${n + 1}</span>
        <button type="button" class="btn sm del" onclick="hapusSoal(${n})" title="Hapus soal ini">
          ${ICON_TRASH}
        </button>
      </div>

      <div>
        <label>Pertanyaan</label>
        <textarea data-n="${n}" data-f="q" rows="2" placeholder="Tuliskan pertanyaan soal...">${esc(s.q)}</textarea>
      </div>

      <div style="margin-top:14px">
        <label>Pilihan Jawaban</label>
        <div class="quiz-opt-grid">
          ${s.o
            .map(
              (optVal, k) => `
            <div class="quiz-opt-item ${s.a === k ? "active-key" : ""}">
              <input type="radio" name="kunci_${n}" class="quiz-radio" ${s.a === k ? "checked" : ""} onchange="setKunciJawaban(${n}, ${k})">
              <input type="text" data-n="${n}" data-f="o${k}" value="${esc(optVal)}" placeholder="Pilihan jawaban...">
              ${s.a === k ? `<span class="quiz-key-indicator">✓</span>` : ""}
            </div>
          `,
            )
            .join("")}
        </div>
      </div>

      <div>
        <label>Pembahasan (Opsional)</label>
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
}

function hapusSoal(n) {
  if (confirm(`Hapus Soal ${n + 1}?`)) {
    sync();
    Q.soal.splice(n, 1);
    draw();
  }
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
  if ($("#t")) Q.tipe = $("#t").value;
  if ($("#l")) Q.link = $("#l").value;

  document.querySelectorAll("[data-n]").forEach((e) => {
    const s = Q.soal[+e.dataset.n];
    if (!s) return;
    const f = e.dataset.f;
    if (f[0] === "o") {
      s.o[+f[1]] = e.value;
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

  const o = { ...Q, id: Q.id || Store.uid("q") };
  delete o._for;
  if (o.tipe !== "native") o.soal = [];

  up(D.quiz, o);
  Q = null;
  edit = null;
  save();
  draw();
  toast("Kuis berhasil disimpan!");
}



