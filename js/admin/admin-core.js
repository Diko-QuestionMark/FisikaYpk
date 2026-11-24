/* Core State, UI Helpers, Auth, & Routing Admin */
const ICON_PLUS = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-1px;margin-right:4px"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
const ICON_EDIT = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>`;
const ICON_TRASH = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
const ICON_SEARCH = `<svg class="crud-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;

let D = Store.get(),
  tab = "materi",
  edit = null,
  isDirty = false;

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
  isDirty = false;
  toast("Tersimpan");
};

const TABS = [
  ["materi", "📚", "Materi"],
  ["quiz", "✏️", "Quiz"],
  ["nilai", "🏆", "Nilai"],
  ["absen", "📋", "Absensi"],
  ["siswa", "👥", "Data Siswa"],
  ["site", "⚙️", "Pengaturan"],
];

function isEditingForm() {
  return Boolean(
    edit ||
      (typeof curMasterKls !== "undefined" && curMasterKls) ||
      tab === "site",
  );
}

function confirmLeaveUnsaved() {
  if (!isDirty) return true;
  return confirm(
    "Ada perubahan yang belum disimpan. Yakin ingin meninggalkan halaman ini? Perubahan akan hilang.",
  );
}

function switchTab(nextTab) {
  if (nextTab === tab && !edit && !(typeof curMasterKls !== "undefined" && curMasterKls)) {
    closeSidebar();
    return;
  }
  if (!confirmLeaveUnsaved()) return;

  isDirty = false;
  tab = nextTab;
  edit = null;
  if (typeof curMasterKls !== "undefined") curMasterKls = null;
  if (typeof editMaster !== "undefined") editMaster = false;
  if (typeof curAbsenKls !== "undefined") curAbsenKls = null;
  if (typeof curPertemuanNo !== "undefined") curPertemuanNo = null;
  if (typeof A !== "undefined") A = null;
  if (typeof previewQuizState !== "undefined") previewQuizState = null;
  if (typeof showQuizSettings !== "undefined") showQuizSettings = false;
  if (typeof curNilaiQuizId !== "undefined") curNilaiQuizId = null;
  if (nextTab === "nilai" && typeof nilaiLoaded !== "undefined") nilaiLoaded = false;

  draw();
  closeSidebar();
}

function confirmBackToSite(e) {
  if (!confirmLeaveUnsaved()) {
    e.preventDefault();
    return false;
  }
  isDirty = false;
  return true;
}

function setupUnsavedGuard() {
  if (window._unsavedGuardReady) return;
  window._unsavedGuardReady = true;

  const markDirtyIfEditing = (target) => {
    if (!target || !target.closest("#app")) return;
    if (!isEditingForm()) return;
    if (target.closest(".crud-search-input, #qe_preview_modal")) return;
    isDirty = true;
  };

  document.addEventListener("input", (e) => markDirtyIfEditing(e.target));
  document.addEventListener("change", (e) => markDirtyIfEditing(e.target));

  // Cegah keluar tanpa konfirmasi pada semua tombol Batal & breadcrumb di seluruh modul
  document.addEventListener(
    "click",
    (e) => {
      if (!isDirty || !isEditingForm()) return;
      const t = e.target;
      if (!t || !t.closest("#app") || t.closest("#qe_preview_modal")) return;
      const btn = t.closest("button");
      if (!btn) return;
      const isBreadcrumb = btn.classList.contains("breadcrumb-link");
      const isBatalBtn = btn.textContent.trim().toLowerCase() === "batal";
      if (!isBreadcrumb && !isBatalBtn) return;

      if (!confirmLeaveUnsaved()) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return;
      }
      isDirty = false;
    },
    true,
  );

  document.addEventListener("click", (e) => {
    if (!isEditingForm()) return;
    const t = e.target;
    if (
      t.closest(
        ".status-btn, .ql-toolbar, .qe-btn-add-opt, .qe-btn-del-opt, .qe-btn-del-soal, .qe-btn-add-sidebar, [onclick*='tambahSoalBaru'], [onclick*='setAllSiswaHadir']",
      )
    ) {
      isDirty = true;
    }
  });

  window.addEventListener("beforeunload", (e) => {
    if (!isDirty) return;
    e.preventDefault();
    e.returnValue = "";
  });
}

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
  const msg = isDirty
    ? "Ada perubahan yang belum disimpan. Tetap keluar dari Panel Guru?"
    : "Keluar dari Panel Guru?";
  if (confirm(msg)) {
    isDirty = false;
    sessionStorage.removeItem("guru_auth");
    location.reload();
  }
}

function closeSidebar() {
  const sb = $("#sidebar");
  const bd = $("#sidebar_backdrop");
  if (sb) sb.classList.remove("open");
  if (bd) bd.style.display = "none";
}

function toggleSidebar() {
  const sb = $("#sidebar");
  const bd = $("#sidebar_backdrop");
  if (!sb) return;
  const willOpen = !sb.classList.contains("open");
  sb.classList.toggle("open", willOpen);
  if (bd) bd.style.display = willOpen ? "block" : "none";
}

let sidebarOutsideBound = false;
function setupSidebarOutsideClose() {
  if (sidebarOutsideBound) return;
  sidebarOutsideBound = true;
  document.addEventListener("click", (e) => {
    const sb = $("#sidebar");
    if (!sb || !sb.classList.contains("open")) return;
    if (e.target.closest("#sidebar") || e.target.closest(".mobile-toggle")) return;
    closeSidebar();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSidebar();
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) closeSidebar();
  });
}

function renderAdmin() {
  setupUnsavedGuard();
  setupSidebarOutsideClose();
  $("#root").innerHTML = `
    <div class="admin-layout">
      <div id="sidebar_backdrop" onclick="closeSidebar()" style="display:none;position:fixed;inset:0;background:rgba(15,23,42,0.45);z-index:99"></div>
      <aside class="sidebar" id="sidebar" style="z-index:100">
        <div class="sidebar-header">
          <img class="sidebar-logo" src="aset/YPKLOGO.png" alt="Logo">
          <span class="sidebar-title">Panel Guru</span>
        </div>
        <nav class="sidebar-nav" id="sidenav"></nav>
        <div style="padding:14px 20px 0;border-top:1px solid rgba(255,255,255,0.1);margin-top:12px;display:flex;flex-direction:column;gap:8px">
          <span class="neon-cloud-badge" style="display:none;font-size:11.5px;padding:4px 8px"></span>
          <a class="sidebar-back" href="index.html" onclick="return confirmBackToSite(event)" style="padding:0;border:none;margin:0">← Kembali ke website</a>
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
  if (!isEditingForm()) isDirty = false;

  $("#sidenav").innerHTML = TABS.map(
    (t) =>
      `<button class="sidebar-item${tab === t[0] ? " active" : ""}" onclick="switchTab('${t[0]}')"><span class="sidebar-icon">${t[1]}</span>${t[2]}</button>`,
  ).join("");
  const curTab = TABS.find((t) => t[0] === tab);
  $("#topbar").innerHTML = `<div style="display:flex;align-items:center;gap:12px">
    <button type="button" class="btn sm ghost mobile-toggle" onclick="toggleSidebar()" style="padding:4px 10px;font-size:18px">☰</button>
    <h2 style="margin:0">${curTab ? curTab[2] : "Admin"}</h2>
  </div>`;
  $("#app").innerHTML = {
    materi: pMateri,
    quiz: pQuiz,
    nilai: pNilai,
    absen: pAbsen,
    siswa: pSiswa,
    site: pSite,
    data: pData,
  }[tab]();
  if (typeof afterDraw === "function") afterDraw();
}

/* Helper Komponen UI Bersama - Modern Clean Cards */
function renderBreadcrumb(items = []) {
  if (!items || !items.length) return "";
  const listHtml = items
    .map((item, idx) => {
      const isLast = idx === items.length - 1;
      const label = esc(item.label || "");
      if (isLast) {
        return `<span class="breadcrumb-item breadcrumb-current" aria-current="page">${label}</span>`;
      }
      const clickAttr = item.onClick
        ? typeof item.onClick === "function"
          ? `onclick="(${item.onClick.toString()})()"`
          : `onclick="${item.onClick}"`
        : "";
      if (!clickAttr) {
        return `<span class="breadcrumb-item"><span class="breadcrumb-text">${label}</span><span class="breadcrumb-separator" aria-hidden="true">›</span></span>`;
      }
      return `<span class="breadcrumb-item"><button type="button" class="breadcrumb-link" ${clickAttr}>${label}</button><span class="breadcrumb-separator" aria-hidden="true">›</span></span>`;
    })
    .join("");
  return `<nav class="breadcrumb" aria-label="Breadcrumb">${listHtml}</nav>`;
}

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

  // Sinkronkan data dari Neon Cloud (tunda render ulang jika sedang ada edit yang belum disimpan)
  Store.sync((cloud) => {
    D = cloud;
    if (isAuth() && !isDirty) draw();
    NeonDB.updateBadge();
  });
}