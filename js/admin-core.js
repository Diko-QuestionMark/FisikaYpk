/* Core State, UI Helpers, Auth, & Routing Admin */
const ICON_PLUS = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-1px;margin-right:5px"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;

let D = Store.get(),
  tab = "materi",
  edit = null;

const $ = (s) => document.querySelector(s);

const toast = (m) => {
  const t = $("#toast");
  if (!t) return;
  t.textContent = m;
  t.classList.add("on");
  setTimeout(() => t.classList.remove("on"), 1800);
};

const save = () => {
  Store.save(D);
  toast("Tersimpan");
};

const TABS = [
  ["materi", "📚", "Materi"],
  ["quiz", "✏️", "Quiz"],
  ["absen", "📋", "Presensi"],
  ["siswa", "👥", "Data Siswa"],
  ["site", "⚙️", "Pengaturan"],
];

function isAuth() {
  return sessionStorage.getItem("guru_auth") === "1";
}

function renderLogin() {
  return `<div style="min-height:100vh;min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:20px;background:var(--bg)">
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:36px;max-width:380px;width:100%;text-align:center;box-shadow:0 10px 25px rgba(0,0,0,0.05)">
      <img src="YPKLOGO.png" alt="Logo" style="width:68px;height:68px;border-radius:50%;margin-bottom:16px;object-fit:contain">
      <h2 style="font-size:22px;margin-bottom:4px">Panel Guru</h2>
      <p class="sub" style="font-size:13px;margin-bottom:20px">Masukkan kata sandi guru untuk melanjutkan</p>
      <form onsubmit="event.preventDefault();checkPass();" style="display:flex;flex-direction:column;gap:12px">
        <input type="password" id="pass_input" placeholder="Kata sandi guru" autofocus style="text-align:center;font-size:16px;padding:12px">
        <button type="submit" class="btn" style="width:100%;padding:12px">Masuk</button>
      </form>
      <a class="sidebar-back" href="index.html" style="margin-top:20px;display:inline-block;padding:0;border:none">← Kembali ke website</a>
    </div>
  </div>`;
}

function checkPass() {
  const inp = $("#pass_input");
  const val = inp ? inp.value.trim() : "";
  const expected = (D.site && D.site.pin) || "FahrulPolman";
  if (val === expected) {
    sessionStorage.setItem("guru_auth", "1");
    toast("Berhasil masuk");
    renderAdmin();
  } else {
    toast("Kata sandi salah!");
    if (inp) {
      inp.value = "";
      inp.focus();
      inp.style.borderColor = "var(--danger)";
      setTimeout(() => {
        inp.style.borderColor = "";
      }, 1000);
    }
  }
}

function logoutGuru() {
  if (confirm("Keluar dari Panel Guru?")) {
    sessionStorage.removeItem("guru_auth");
    location.reload();
  }
}

function renderAdmin() {
  $("#root").innerHTML = `
    <div class="admin-layout">
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <img class="sidebar-logo" src="YPKLOGO.png" alt="Logo">
          <span class="sidebar-title">Panel Guru</span>
        </div>
        <nav class="sidebar-nav" id="sidenav"></nav>
        <div style="padding:14px 20px 0;border-top:1px solid rgba(255,255,255,0.1);margin-top:12px;display:flex;flex-direction:column;gap:8px">
          <a class="sidebar-back" href="index.html" style="padding:0;border:none;margin:0">← Kembali ke website</a>
          <button onclick="logoutGuru()" style="background:none;border:none;color:rgba(255,255,255,0.5);font:inherit;font-size:13px;font-weight:600;cursor:pointer;text-align:left;padding:0" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='rgba(255,255,255,0.5)'">🚪 Keluar</button>
        </div>
      </aside>
      <div class="admin-main">
        <div class="admin-topbar" id="topbar"></div>
        <div class="admin-content" id="app"></div>
      </div>
    </div>
  `;
  draw();
}

function draw() {
  if (!isAuth()) return;
  $("#sidenav").innerHTML = TABS.map(
    (t) =>
      `<button class="sidebar-item${tab === t[0] ? " active" : ""}" onclick="tab='${t[0]}';edit=null;curMasterKls=null;editMaster=false;draw();if(window.innerWidth<=768)$('#sidebar').classList.remove('open')"><span class="sidebar-icon">${t[1]}</span>${t[2]}</button>`,
  ).join("");
  const curTab = TABS.find((t) => t[0] === tab);
  $("#topbar").innerHTML = `<div style="display:flex;align-items:center;gap:12px">
    <button class="btn sm ghost mobile-toggle" onclick="$('#sidebar').classList.toggle('open')" style="padding:4px 10px;font-size:18px">☰</button>
    <h2 style="margin:0">${curTab ? curTab[2] : "Admin"}</h2>
  </div>`;
  $("#app").innerHTML = {
    materi: pMateri,
    quiz: pQuiz,
    absen: pAbsen,
    siswa: pSiswa,
    site: pSite,
    data: pData,
  }[tab]();
}

/* Helper Komponen UI Bersama */
function uiPanel({ headerLeft, headerRight = "", content = "", emptyText = "Belum ada data." }) {
  return `<div class="panel">
    <div class="row" style="justify-content:space-between;align-items:center;margin-bottom:14px">
      ${headerLeft}
      ${headerRight ? `<div>${headerRight}</div>` : ""}
    </div>
    ${content || `<div class="empty">${emptyText}</div>`}
  </div>`;
}

function uiItem(idx, contentHtml, actionsHtml) {
  return `<div class="item">
    <div style="display:flex;align-items:flex-start;gap:12px">
      <span style="font-size:15px;color:var(--text-muted);font-weight:700;min-width:24px;line-height:1.4">${idx + 1}.</span>
      <div>${contentHtml}</div>
    </div>
    <div class="row">${actionsHtml}</div>
  </div>`;
}

function uiFormActions(onSave, onCancel, saveLabel = "Simpan") {
  return `<div class="row" style="margin-top:18px">
    <button class="btn" onclick="${onSave}">${saveLabel}</button>
    <button class="btn ghost" onclick="${onCancel}">Batal</button>
  </div>`;
}

function uiCrudList(arr, type, sub) {
  const items = arr
    .map((x, idx) =>
      uiItem(
        idx,
        `<b>${esc(x.judul)}</b><div class="hint">${esc(sub(x))}</div>`,
        `<button class="btn sm ghost" onclick="edit='${x.id}';draw()">Ubah</button>
         <button class="btn sm del" onclick="del('${type}','${x.id}')">Hapus</button>`,
      ),
    )
    .join("");
  return uiPanel({
    headerLeft: `<b>Daftar (${arr.length})</b>`,
    headerRight: `<button class="btn sm" onclick="edit='new';draw()">${ICON_PLUS}Tambah</button>`,
    content: items,
  });
}

function del(t, id) {
  if (confirm("Hapus item ini?")) {
    D[t] = D[t].filter((x) => x.id !== id);
    save();
    draw();
  }
}

function up(a, o) {
  const i = a.findIndex((x) => x.id === o.id);
  i < 0 ? a.push(o) : (a[i] = o);
}

function initAdmin() {
  if (!isAuth()) {
    $("#root").innerHTML = renderLogin();
    setTimeout(() => {
      const inp = $("#pass_input");
      if (inp) inp.focus();
    }, 80);
  } else {
    renderAdmin();
  }
}

