/* Core State, UI Helpers, Auth, & Routing Admin */
const ICON_PLUS = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-1px;margin-right:4px"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
const ICON_EDIT = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>`;
const ICON_TRASH = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
const ICON_SEARCH = `<svg class="crud-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;

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
      <img src="aset/YPKLOGO.png" alt="Logo" style="width:68px;height:68px;border-radius:50%;margin-bottom:16px;object-fit:contain">
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
          <img class="sidebar-logo" src="aset/YPKLOGO.png" alt="Logo">
          <span class="sidebar-title">Panel Guru</span>
        </div>
        <nav class="sidebar-nav" id="sidenav"></nav>
        <div style="padding:14px 20px 0;border-top:1px solid rgba(255,255,255,0.1);margin-top:12px;display:flex;flex-direction:column;gap:8px">
          <span class="neon-cloud-badge" style="display:none;font-size:11.5px;padding:4px 8px"></span>
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
  if (typeof afterDraw === "function") afterDraw();
}

/* Helper Komponen UI Bersama - Modern Clean Cards (Gambar 2 Reference) */
function hitungWaktuBaca(htmlOrText) {
  if (!htmlOrText) return "1 menit baca";
  const div = document.createElement("div");
  div.innerHTML = htmlOrText;
  const text = (div.textContent || div.innerText || "").trim();
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const menit = Math.max(1, Math.ceil(words / 180));
  return `${menit} menit baca`;
}

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
  return `<div class="crud-card">
    <div class="crud-card-left">${contentHtml}</div>
    <div class="crud-actions">${actionsHtml}</div>
  </div>`;
}

function onCrudSearch(keyword) {
  const q = (keyword || "").toLowerCase().trim();
  const listEl = document.querySelector(".crud-card-list");
  if (!listEl) return;
  const cards = listEl.querySelectorAll(".crud-card");
  let visible = 0;
  cards.forEach((c) => {
    const text = c.textContent.toLowerCase();
    const match = !q || text.includes(q);
    c.style.display = match ? "flex" : "none";
    if (match) visible++;
  });
  let emptyEl = document.getElementById("crud_search_empty");
  if (!emptyEl && listEl) {
    emptyEl = document.createElement("div");
    emptyEl.id = "crud_search_empty";
    emptyEl.className = "crud-empty";
    listEl.appendChild(emptyEl);
  }
  if (emptyEl) {
    emptyEl.textContent = `Tidak ditemukan hasil pencarian "${keyword}"`;
    emptyEl.style.display = visible === 0 && cards.length > 0 ? "block" : "none";
  }
}

function uiCrudList(arr, type, sub) {
  const placeholders = {
    materi: "Cari materi fisika...",
    quiz: "Cari kuis...",
    absen: "Cari presensi...",
    siswa: "Cari kelas atau siswa...",
  };
  const ph = placeholders[type] || "Cari data...";

  const cards = [...(arr || [])]
    .reverse()
    .map(
      (x) => `
    <div class="crud-card">
      <div class="crud-card-left">
        <h3 class="crud-card-title">${esc(x.judul || "Tanpa Judul")}</h3>
        <div class="crud-card-sub">${esc(sub ? sub(x) : "")}</div>
      </div>
      <div class="crud-actions">
        <button class="crud-btn-icon" onclick="edit='${x.id}';draw()" title="Ubah">${ICON_EDIT}</button>
        <button class="crud-btn-icon del" onclick="del('${type}','${x.id}')" title="Hapus">${ICON_TRASH}</button>
      </div>
    </div>`,
    )
    .join("");

  return `
    <div class="crud-header">
      <div class="crud-search-wrap">
        ${ICON_SEARCH}
        <input type="text" class="crud-search-input" placeholder="${ph}" oninput="onCrudSearch(this.value)" autofocus />
      </div>
      <button class="crud-btn-add" onclick="edit='new';draw()">${ICON_PLUS} Tambah</button>
    </div>
    <div class="crud-card-list">
      ${cards || `<div class="crud-empty">Belum ada data. Silakan klik tombol <b>+ Tambah</b> untuk membuat baru.</div>`}
    </div>
  `;
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

  // Sinkronkan data dari Neon Cloud
  Store.sync((cloud) => {
    D = cloud;
    if (isAuth()) draw();
    NeonDB.updateBadge();
  });
}

