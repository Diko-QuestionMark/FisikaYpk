/* Seed Data Awal Pembelajaran Fisika SMA
   Berisi data materi lengkap (HTML format), kuis latihan interaktif,
   daftar kelas, siswa per kelas, dan riwayat presensi awal.
*/

const SEED_DATA = {
  site: {
    nama: "FisikaKu",
    tagline: "Belajar fisika jadi lebih mudah, runtut, dan menyenangkan.",
    deskripsi: "Media pembelajaran fisika interaktif SMA: pelajari konsep & rumus esensial, lalu uji pemahamanmu lewat kuis latihan.",
    footer: "Media Pembelajaran Fisika SMA · YPK",
    pin: "FahrulPolman",
  },

  daftar_kelas: ["X MIPA 1", "X MIPA 2", "XI MIPA 1"],

  kelas_siswa: {
    "X MIPA 1": [
      "Ahmad Fauzi",
      "Bella Safitri",
      "Citra Kirana",
      "Dimas Prasetyo",
      "Eka Rahmawati",
      "Fajar Hidayat",
      "Gita Gutawa",
      "Hadi Permana",
      "Indah Permatasari",
      "Joko Widodo",
      "Kartika Putri",
      "Lukman Hakim",
    ],
    "X MIPA 2": [
      "Aditya Pratama",
      "Bunga Lestari",
      "Chairul Tanjung",
      "Dewi Sandra",
      "Erik Setiawan",
      "Farah Quinn",
      "Gilang Ramadhan",
      "Hesti Purwadinata",
      "Irfan Bachdim",
      "Jessica Mila",
    ],
    "XI MIPA 1": [
      "Aldi Taher",
      "Baim Wong",
      "Chelsea Islan",
      "Desta Mahendra",
      "Enzy Storia",
      "Gading Marten",
      "Hamish Daud",
      "Isyana Sarasvati",
    ],
  },

  materi: [
    {
      id: "mat-kinematika-glbb",
      judul: "Kinematika Gerak Lurus Beraturan (GLB & GLBB)",
      isi: `
        <h2>1. Gerak Lurus Beraturan (GLB)</h2>
        <p>Gerak Lurus Beraturan (GLB) adalah gerak suatu benda pada lintasan yang lurus dengan kecepatan yang konstan atau tetap setiap saat. Karena kecepatannya tetap, maka percepatan benda bernilai <b>nol (a = 0)</b>.</p>
        
        <p>Rumus dasar GLB sangat sederhana:</p>
        <pre class="ql-syntax">s = v . t

Keterangan:
s = Jarak tempuh (meter / m)
v = Kecepatan (m/s)
t = Waktu tempuh (sekon / s)</pre>

        <h2>2. Gerak Lurus Berubah Beraturan (GLBB)</h2>
        <p>Gerak Lurus Berubah Beraturan (GLBB) adalah gerak benda pada lintasan lurus dengan <b>percepatan yang konstan (a = tetap)</b>. Artinya, kecepatan benda bertambah (dipercepat) atau berkurang (diperlambat) secara teratur tiap detiknya.</p>

        <p>Tiga rumus emas dalam GLBB:</p>
        <pre class="ql-syntax">1) vt = v0 + (a . t)
2) s  = (v0 . t) + (1/2 . a . t²)
3) vt² = v0² + (2 . a . s)

Keterangan:
v0 = Kecepatan awal (m/s)
vt = Kecepatan akhir pada waktu t (m/s)
a  = Percepatan (m/s²), bernilai negatif (-) jika mengalami perlambatan
s  = Jarak perpindahan (m)</pre>

        <h2>3. Contoh Soal Pembahasan</h2>
        <p>Sebuah mobil mula-mula diam di lampu merah (v0 = 0). Saat lampu hijau menyala, mobil bergerak dengan percepatan tetap 2 m/s² selama 5 detik. Berapakah kecepatan mobil tersebut sekarang dan berapa jarak yang telah ditempuh?</p>
        <p><b>Penyelesaian:</b></p>
        <ul>
          <li><b>Kecepatan akhir:</b> vt = v0 + a.t = 0 + (2 . 5) = <b>10 m/s</b></li>
          <li><b>Jarak tempuh:</b> s = (v0.t) + (1/2 . a . t²) = 0 + (1/2 . 2 . 5²) = <b>25 meter</b></li>
        </ul>
      `,
    },
    {
      id: "mat-hukum-newton",
      judul: "Dinamika Gerak: Hukum Newton I, II, dan III",
      isi: `
        <h2>Pengantar Dinamika Gerak</h2>
        <p>Jika pada kinematika kita hanya mempelajari bagaimana benda bergerak tanpa peduli penyebabnya, pada <b>dinamika</b> kita mempelajari penyebab gerak benda, yaitu <b>Gaya (F)</b> dengan satuan Newton (N) atau kg·m/s².</p>

        <h2>1. Hukum I Newton (Kelembaman / Inersia)</h2>
        <p><i>"Jika resultan gaya yang bekerja pada benda bernilai nol, maka benda yang awalnya diam akan tetap diam, dan benda yang awalnya bergerak lurus beraturan akan tetap bergerak dengan kecepatan konstan."</i></p>
        <pre class="ql-syntax">ΣF = 0</pre>
        <p><b>Contoh sehari-hari:</b> Saat kita naik mobil dan mobil mendadak direm, tubuh kita otomatis terdorong ke depan karena sifat kelembaman (mempertahankan keadaan gerak semula).</p>

        <h2>2. Hukum II Newton (Percepatan)</h2>
        <p><i>"Percepatan yang dialami oleh sebuah benda sebanding dengan resultan gaya yang bekerja padanya dan berbanding terbalik dengan massa benda tersebut."</i></p>
        <pre class="ql-syntax">ΣF = m . a  atau  a = ΣF / m

Keterangan:
ΣF = Resultan gaya (Newton / N)
m  = Massa benda (kg)
a  = Percepatan (m/s²)</pre>

        <h2>3. Hukum III Newton (Aksi - Reaksi)</h2>
        <p><i>"Untuk setiap gaya aksi yang diberikan pada suatu benda, akan selalu timbul gaya reaksi yang besarnya sama namun arahnya berlawanan dan bekerja pada dua benda yang berbeda."</i></p>
        <pre class="ql-syntax">F_aksi = - F_reaksi</pre>
        <p><b>Ciri-ciri pasangan gaya aksi-reaksi:</b></p>
        <ul>
          <li>Besarnya selalu sama</li>
          <li>Arahnya berlawanan</li>
          <li>Bekerja pada <b>dua benda yang berlainan</b> (tidak saling meniadakan)</li>
        </ul>
      `,
    },
    {
      id: "mat-usaha-energi",
      judul: "Usaha, Energi Kinetik, dan Energi Potensial",
      isi: `
        <h2>1. Konsep Usaha (Work)</h2>
        <p>Dalam fisika, usaha didefinisikan sebagai hasil kali antara komponen gaya searah perpindahan dengan besar perpindahan benda itu sendiri.</p>
        <pre class="ql-syntax">W = F . s . cos(θ)

Keterangan:
W = Usaha (Joule / J)
F = Gaya (N)
s = Perpindahan (m)
θ = Sudut antara arah gaya dan arah perpindahan</pre>

        <h2>2. Energi Kinetik (Ek)</h2>
        <p>Energi yang dimiliki oleh benda karena geraknya (kecepatannya):</p>
        <pre class="ql-syntax">Ek = 1/2 . m . v²</pre>

        <h2>3. Energi Potensial Gravitasi (Ep)</h2>
        <p>Energi yang dimiliki oleh benda karena kedudukan atau ketinggiannya terhadap acuan tertentu:</p>
        <pre class="ql-syntax">Ep = m . g . h

Keterangan:
m = Massa (kg)
g = Percepatan gravitasi (sekitar 9.8 atau 10 m/s²)
h = Ketinggian benda dari tanah (m)</pre>

        <h2>4. Hukum Kekekalan Energi Mekanik</h2>
        <p>Jika tidak ada gaya luar non-konservatif (seperti gaya gesek udara), energi mekanik total benda selalu kekal di setiap titik lintasan:</p>
        <pre class="ql-syntax">Em1 = Em2
(Ep1 + Ek1) = (Ep2 + Ek2)</pre>
      `,
    },
  ],

  quiz: [
    {
      id: "quiz-kinematika",
      judul: "Kuis Kinematika: GLB dan GLBB",
      tipe: "native",
      link: "",
      soal: [
        {
          q: "Sebuah mobil bergerak lurus dengan kecepatan konstan 20 m/s selama 15 detik. Jarak yang ditempuh mobil tersebut adalah...",
          o: ["150 meter", "300 meter", "450 meter", "600 meter"],
          a: 1,
          e: "Gunakan rumus GLB: s = v . t = 20 m/s . 15 s = 300 meter.",
        },
        {
          q: "Suatu benda yang awalnya diam dipercepat beraturan dengan percepatan 4 m/s². Kecepatan benda setelah 3 detik adalah...",
          o: ["6 m/s", "12 m/s", "16 m/s", "24 m/s"],
          a: 1,
          e: "vt = v0 + a.t = 0 + (4 . 3) = 12 m/s.",
        },
        {
          q: "Ciri utama dari Gerak Lurus Beraturan (GLB) adalah...",
          o: [
            "Percepatannya selalu berubah",
            "Kecepatannya konstan dan percepatan bernilai nol",
            "Kecepatannya bertambah secara konstan",
            "Lintasannya berupa kurva parabola",
          ],
          a: 1,
          e: "Pada GLB, kecepatan selalu tetap (v = konstan), sehingga percepatan a = 0.",
        },
        {
          q: "Sebuah motor mula-mula berkecepatan 10 m/s direm hingga berhenti dalam waktu 5 detik. Besar perlambatan motor tersebut adalah...",
          o: ["1 m/s²", "2 m/s²", "3 m/s²", "4 m/s²"],
          a: 1,
          e: "vt = v0 - a.t => 0 = 10 - a(5) => 5a = 10 => a = 2 m/s².",
        },
      ],
    },
    {
      id: "quiz-newton",
      judul: "Kuis Dinamika Gerak: Hukum Newton",
      tipe: "native",
      link: "",
      soal: [
        {
          q: "Balok bermassa 5 kg ditarik dengan gaya mendatar sebesar 25 Newton pada lantai licin tanpa gesekan. Berapakah percepatan balok tersebut?",
          o: ["3 m/s²", "4 m/s²", "5 m/s²", "6 m/s²"],
          a: 2,
          e: "Gunakan Hukum II Newton: a = F / m = 25 / 5 = 5 m/s².",
        },
        {
          q: "Kecenderungan suatu benda untuk mempertahankan keadaan diam atau gerak lurusnya disebut sebagai...",
          o: ["Gaya normal", "Kelembaman (Inersia)", "Percepatan sentripetal", "Gaya gesek statis"],
          a: 1,
          e: "Sifat kelembaman atau inersia sesuai dengan pernyataan Hukum I Newton.",
        },
        {
          q: "Berikut ini yang merupakan ciri dari pasangan gaya aksi-reaksi adalah...",
          o: [
            "Bekerja pada benda yang sama",
            "Besarnya berbeda tergantung massa benda",
            "Bekerja pada dua benda yang berbeda dengan arah berlawanan",
            "Selalu menghasilkan resultan gaya nol pada satu benda",
          ],
          a: 2,
          e: "Gaya aksi dan reaksi besarnya sama, arahnya berlawanan, namun bekerja pada DUA benda yang berbeda.",
        },
      ],
    },
  ],

  absen: [
    {
      id: "abs-001",
      tanggal: "2026-11-10",
      kelas: "X MIPA 1",
      topik: "Pengenalan GLB dan GLBB",
      siswa: [
        { nama: "Ahmad Fauzi", status: "Hadir", catatan: "" },
        { nama: "Bella Safitri", status: "Hadir", catatan: "" },
        { nama: "Citra Kirana", status: "Sakit", catatan: "Surat dokter" },
        { nama: "Dimas Prasetyo", status: "Hadir", catatan: "" },
        { nama: "Eka Rahmawati", status: "Izin", catatan: "Lomba OSN" },
        { nama: "Fajar Hidayat", status: "Hadir", catatan: "" },
        { nama: "Gita Gutawa", status: "Hadir", catatan: "" },
        { nama: "Hadi Permana", status: "Hadir", catatan: "" },
        { nama: "Indah Permatasari", status: "Hadir", catatan: "" },
        { nama: "Joko Widodo", status: "Hadir", catatan: "" },
        { nama: "Kartika Putri", status: "Alpa", catatan: "Tanpa keterangan" },
        { nama: "Lukman Hakim", status: "Hadir", catatan: "" },
      ],
    },
  ],
};

/* Fungsi helper untuk memuat seed data ke localStorage jika data masih kosong */
function initSeedData(force = false) {
  const current = localStorage.getItem("fisika_media_v3");
  if (!current || force) {
    localStorage.setItem("fisika_media_v3", JSON.stringify(SEED_DATA));
    console.log("Seed data fisika berhasil dimuat ke localStorage!");
    return true;
  }
  return false;
}
