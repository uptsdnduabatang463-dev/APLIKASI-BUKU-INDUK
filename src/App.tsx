import { useState, useEffect, useRef } from "react";

// ─── KONSTANTA ───────────────────────────────────────────────────────────────
const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycby1j4l0PPY-IaEsF6UJ--rs8Bl2L3aTtxwA_sr-g2V5X9fAHB8l13ehcytjcf3Om3Js/exec";

// ─── TIPE USER ────────────────────────────────────────────────────────────────
type UserRole = "OPERATOR" | "GURU";
interface UserInfo {
  role: UserRole;
  kelas: string; // kosong jika OPERATOR
  rombel: string; // kosong jika OPERATOR
  password: string;
}

// ─── HALAMAN LOGIN ────────────────────────────────────────────────────────────
function PageLogin({ onLogin }: { onLogin: (u: UserInfo) => void }) {
  const [sebagai, setSebagai] = useState<"" | "OPERATOR" | "GURU">("");
  const [kelas, setKelas] = useState("");
  const [rombel, setRombel] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const handleLogin = async () => {
    if (!sebagai || !password) return;
    if (sebagai === "GURU" && (!kelas || !rombel)) return;
    setStatus("loading");
    try {
      const res = await fetch(`${SCRIPT_URL}?action=getAkunUser`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      const rows: string[][] = json.data || [];
      // rows[0] = header, rows[1..] = data
      const dataRows = rows.slice(1);
      let match = false;
      for (const row of dataRows) {
        const rowSebagai = String(row[0] || "")
          .trim()
          .toUpperCase();
        const rowKelas = String(row[1] || "").trim();
        const rowRombel = String(row[2] || "")
          .trim()
          .toUpperCase();
        const rowPass = String(row[3] || "").trim();
        if (sebagai === "OPERATOR") {
          if (rowSebagai === "OPERATOR" && rowPass === password.trim()) {
            match = true;
            break;
          }
        } else {
          // GURU: cocokkan kelas + rombel + password
          if (
            rowSebagai === "GURU" &&
            rowKelas === kelas.trim() &&
            rowRombel === rombel.trim().toUpperCase() &&
            rowPass === password.trim()
          ) {
            match = true;
            break;
          }
        }
      }
      if (match) {
        onLogin({ role: sebagai, kelas, rombel, password });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  const isReady =
    sebagai === "OPERATOR"
      ? password.trim() !== ""
      : sebagai === "GURU" && kelas && rombel && password.trim() !== "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏫</div>
          <h1 className="text-2xl font-bold text-blue-800">Buku Induk Siswa</h1>
          <p className="text-sm text-gray-400 mt-1">
            Silakan masuk untuk melanjutkan
          </p>
        </div>

        <div className="space-y-4">
          {/* Sebagai */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Masuk Sebagai
            </label>
            <div className="flex gap-2">
              {(["OPERATOR", "GURU"] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => {
                    setSebagai(role);
                    setKelas("");
                    setRombel("");
                    setPassword("");
                    setStatus("idle");
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition ${
                    sebagai === role
                      ? "bg-blue-600 text-white border-blue-600 shadow"
                      : "bg-white text-gray-500 border-gray-300 hover:border-blue-400 hover:text-blue-600"
                  }`}
                >
                  {role === "OPERATOR" ? "👨‍💼 Operator" : "👩‍🏫 Guru"}
                </button>
              ))}
            </div>
          </div>

          {/* Kelas & Rombel — hanya untuk GURU */}
          {sebagai === "GURU" && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Kelas
                </label>
                <select
                  value={kelas}
                  onChange={(e) => {
                    setKelas(e.target.value);
                    setStatus("idle");
                  }}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                >
                  <option value="">-- Pilih --</option>
                  {[1, 2, 3, 4, 5, 6].map((k) => (
                    <option key={k} value={String(k)}>
                      Kelas {k}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Rombel
                </label>
                <select
                  value={rombel}
                  onChange={(e) => {
                    setRombel(e.target.value);
                    setStatus("idle");
                  }}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                >
                  <option value="">-- Pilih --</option>
                  <option value="A">Rombel A</option>
                  <option value="B">Rombel B</option>
                </select>
              </div>
            </div>
          )}

          {/* Password */}
          {sebagai && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setStatus("idle");
                }}
                onKeyDown={(e) => e.key === "Enter" && isReady && handleLogin()}
                placeholder="Masukkan password"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          )}

          {/* Error */}
          {status === "error" && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">
              ⚠️ Password salah atau akun tidak ditemukan.
            </div>
          )}

          {/* Tombol masuk */}
          {sebagai && (
            <button
              type="button"
              onClick={handleLogin}
              disabled={!isReady || status === "loading"}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "loading" ? "Memeriksa..." : "Masuk →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const COLUMNS = [
  { key: "namaLengkap", label: "Nama Lengkap" },
  { key: "namaPanggilan", label: "Nama Panggilan" },
  { key: "jenisKelamin", label: "Jenis Kelamin" },
  { key: "nomorKK", label: "Nomor KK" },
  { key: "tempatLahir", label: "Tempat Lahir" },
  { key: "tanggalLahir", label: "Tanggal Lahir" },
  { key: "noRegAktaLahir", label: "No. Reg. Akta Lahir" },
  { key: "agama", label: "Agama" },
  { key: "kewarganegaraan", label: "Kewarganegaraan" },
  { key: "anakKeBerapa", label: "Anak ke Berapa" },
  { key: "anakKeDari", label: "Jumlah Saudara Kandung" },
  { key: "statusDalamKeluarga", label: "Status dalam Keluarga" },
  { key: "siswaTinggalBersama", label: "Siswa Tinggal Bersama" },
  { key: "tempatTinggal", label: "Tempat Tinggal" },
  { key: "transportasi", label: "Transportasi" },
  { key: "jalan", label: "Jalan/Dusun" },
  { key: "rt", label: "RT" },
  { key: "rw", label: "RW" },
  { key: "kelurahanDesa", label: "Kelurahan/Desa" },
  { key: "kecamatan", label: "Kecamatan" },
  { key: "kotaKabupaten", label: "Kota/Kabupaten" },
  { key: "propinsi", label: "Provinsi" },
  { key: "kodePos", label: "Kode Pos" },
  { key: "namaAyah", label: "Nama Ayah" },
  { key: "tempatLahirAyah", label: "Tempat Lahir Ayah" },
  { key: "agamaAyah", label: "Agama Ayah" },
  { key: "kewarganegaraanAyah", label: "Kewarganegaraan Ayah" },
  { key: "pendidikanAyah", label: "Pendidikan Ayah" },
  { key: "pekerjaanAyah", label: "Pekerjaan Ayah" },
  { key: "penghasilanAyah", label: "Penghasilan Ayah" },
  { key: "alamatKantorAyah", label: "Alamat Kantor Ayah" },
  { key: "alamatRumahAyah", label: "Alamat Rumah Ayah" },
  { key: "namaIbu", label: "Nama Ibu" },
  { key: "tempatLahirIbu", label: "Tempat Lahir Ibu" },
  { key: "agamaIbu", label: "Agama Ibu" },
  { key: "kewarganegaraanIbu", label: "Kewarganegaraan Ibu" },
  { key: "bahasaIbu", label: "Bahasa Ibu" },
  { key: "pendidikanIbu", label: "Pendidikan Ibu" },
  { key: "pekerjaanIbu", label: "Pekerjaan Ibu" },
  { key: "penghasilanIbu", label: "Penghasilan Ibu" },
  { key: "alamatRumahIbu", label: "Alamat Rumah Ibu" },
  { key: "namaWali", label: "Nama Wali" },
  { key: "tempatLahirWali", label: "Tempat Lahir Wali" },
  { key: "agamaWali", label: "Agama Wali" },
  { key: "kewarganegaraanWali", label: "Kewarganegaraan Wali" },
  { key: "bahasaWali", label: "Bahasa Wali" },
  { key: "pekerjaanWali", label: "Pekerjaan Wali" },
  { key: "alamatKantorWali", label: "Alamat Kantor Wali" },
  { key: "alamatRumahWali", label: "Alamat Rumah Wali" },
  { key: "tinggiBadan", label: "Tinggi Badan (cm)" },
  { key: "beratBadan", label: "Berat Badan (kg)" },
  { key: "lingkarKepala", label: "Lingkar Kepala (cm)" },
  { key: "jarakSekolahKm", label: "Jarak Sekolah (KM)" },
  { key: "jarakSekolahJam", label: "Jarak Sekolah (jam)" },
  { key: "jenisKesejahteraan", label: "Jenis Kesejahteraan" },
  { key: "nomorKartu", label: "Nomor Kartu" },
  { key: "namaDiKartu", label: "Nama di Kartu" },
  { key: "fotoSiswa", label: "Foto Siswa" },
  { key: "fotokopiAktaLahir", label: "Fotokopi Akta Kelahiran" },
  { key: "fotokopiKK", label: "Fotokopi KK" },
  { key: "fotokopiSktbTk", label: "Fotokopi SKTB TK" },
  { key: "kartuKesejahteraan", label: "Kartu Kesejahteraan" },
  { key: "fotoLulus", label: "Foto Lulus" },
  // ── KOLOM BARU ──
  { key: "kelas", label: "Kelas" },
  { key: "rombel", label: "Rombel" },
  { key: "nisn", label: "NISN" },
  { key: "nis", label: "NIS" },
  { key: "nik", label: "NIK" },
  { key: "tahunLulus", label: "Tahun Lulus" },
  // ── NILAI RAPOR — Semester 1 (Kelas 1–6) ──
  { key: "pai1s1", label: "PAI Kelas 1 Sem 1" },
  { key: "ppkn1s1", label: "PPKn Kelas 1 Sem 1" },
  { key: "bind1s1", label: "B. Indonesia Kelas 1 Sem 1" },
  { key: "mat1s1", label: "Matematika Kelas 1 Sem 1" },
  { key: "ipas1s1", label: "IPAS Kelas 1 Sem 1" },
  { key: "sbdp1s1", label: "SBdP Kelas 1 Sem 1" },
  { key: "pjok1s1", label: "PJOK Kelas 1 Sem 1" },
  { key: "bing1s1", label: "B. Inggris Kelas 1 Sem 1" },
  { key: "bdaerah1s1", label: "B. Daerah Kelas 1 Sem 1" },
  { key: "pai2s1", label: "PAI Kelas 2 Sem 1" },
  { key: "ppkn2s1", label: "PPKn Kelas 2 Sem 1" },
  { key: "bind2s1", label: "B. Indonesia Kelas 2 Sem 1" },
  { key: "mat2s1", label: "Matematika Kelas 2 Sem 1" },
  { key: "ipas2s1", label: "IPAS Kelas 2 Sem 1" },
  { key: "sbdp2s1", label: "SBdP Kelas 2 Sem 1" },
  { key: "pjok2s1", label: "PJOK Kelas 2 Sem 1" },
  { key: "bing2s1", label: "B. Inggris Kelas 2 Sem 1" },
  { key: "bdaerah2s1", label: "B. Daerah Kelas 2 Sem 1" },
  { key: "pai3s1", label: "PAI Kelas 3 Sem 1" },
  { key: "ppkn3s1", label: "PPKn Kelas 3 Sem 1" },
  { key: "bind3s1", label: "B. Indonesia Kelas 3 Sem 1" },
  { key: "mat3s1", label: "Matematika Kelas 3 Sem 1" },
  { key: "ipas3s1", label: "IPAS Kelas 3 Sem 1" },
  { key: "sbdp3s1", label: "SBdP Kelas 3 Sem 1" },
  { key: "pjok3s1", label: "PJOK Kelas 3 Sem 1" },
  { key: "bing3s1", label: "B. Inggris Kelas 3 Sem 1" },
  { key: "bdaerah3s1", label: "B. Daerah Kelas 3 Sem 1" },
  { key: "pai4s1", label: "PAI Kelas 4 Sem 1" },
  { key: "ppkn4s1", label: "PPKn Kelas 4 Sem 1" },
  { key: "bind4s1", label: "B. Indonesia Kelas 4 Sem 1" },
  { key: "mat4s1", label: "Matematika Kelas 4 Sem 1" },
  { key: "ipas4s1", label: "IPAS Kelas 4 Sem 1" },
  { key: "sbdp4s1", label: "SBdP Kelas 4 Sem 1" },
  { key: "pjok4s1", label: "PJOK Kelas 4 Sem 1" },
  { key: "bing4s1", label: "B. Inggris Kelas 4 Sem 1" },
  { key: "bdaerah4s1", label: "B. Daerah Kelas 4 Sem 1" },
  { key: "pai5s1", label: "PAI Kelas 5 Sem 1" },
  { key: "ppkn5s1", label: "PPKn Kelas 5 Sem 1" },
  { key: "bind5s1", label: "B. Indonesia Kelas 5 Sem 1" },
  { key: "mat5s1", label: "Matematika Kelas 5 Sem 1" },
  { key: "ipas5s1", label: "IPAS Kelas 5 Sem 1" },
  { key: "sbdp5s1", label: "SBdP Kelas 5 Sem 1" },
  { key: "pjok5s1", label: "PJOK Kelas 5 Sem 1" },
  { key: "bing5s1", label: "B. Inggris Kelas 5 Sem 1" },
  { key: "bdaerah5s1", label: "B. Daerah Kelas 5 Sem 1" },
  { key: "pai6s1", label: "PAI Kelas 6 Sem 1" },
  { key: "ppkn6s1", label: "PPKn Kelas 6 Sem 1" },
  { key: "bind6s1", label: "B. Indonesia Kelas 6 Sem 1" },
  { key: "mat6s1", label: "Matematika Kelas 6 Sem 1" },
  { key: "ipas6s1", label: "IPAS Kelas 6 Sem 1" },
  { key: "sbdp6s1", label: "SBdP Kelas 6 Sem 1" },
  { key: "pjok6s1", label: "PJOK Kelas 6 Sem 1" },
  { key: "bing6s1", label: "B. Inggris Kelas 6 Sem 1" },
  { key: "bdaerah6s1", label: "B. Daerah Kelas 6 Sem 1" },
  // ── NILAI RAPOR — Semester 2 (Kelas 1–6) ──
  { key: "pai1s2", label: "PAI Kelas 1 Sem 2" },
  { key: "ppkn1s2", label: "PPKn Kelas 1 Sem 2" },
  { key: "bind1s2", label: "B. Indonesia Kelas 1 Sem 2" },
  { key: "mat1s2", label: "Matematika Kelas 1 Sem 2" },
  { key: "ipas1s2", label: "IPAS Kelas 1 Sem 2" },
  { key: "sbdp1s2", label: "SBdP Kelas 1 Sem 2" },
  { key: "pjok1s2", label: "PJOK Kelas 1 Sem 2" },
  { key: "bing1s2", label: "B. Inggris Kelas 1 Sem 2" },
  { key: "bdaerah1s2", label: "B. Daerah Kelas 1 Sem 2" },
  { key: "pai2s2", label: "PAI Kelas 2 Sem 2" },
  { key: "ppkn2s2", label: "PPKn Kelas 2 Sem 2" },
  { key: "bind2s2", label: "B. Indonesia Kelas 2 Sem 2" },
  { key: "mat2s2", label: "Matematika Kelas 2 Sem 2" },
  { key: "ipas2s2", label: "IPAS Kelas 2 Sem 2" },
  { key: "sbdp2s2", label: "SBdP Kelas 2 Sem 2" },
  { key: "pjok2s2", label: "PJOK Kelas 2 Sem 2" },
  { key: "bing2s2", label: "B. Inggris Kelas 2 Sem 2" },
  { key: "bdaerah2s2", label: "B. Daerah Kelas 2 Sem 2" },
  { key: "pai3s2", label: "PAI Kelas 3 Sem 2" },
  { key: "ppkn3s2", label: "PPKn Kelas 3 Sem 2" },
  { key: "bind3s2", label: "B. Indonesia Kelas 3 Sem 2" },
  { key: "mat3s2", label: "Matematika Kelas 3 Sem 2" },
  { key: "ipas3s2", label: "IPAS Kelas 3 Sem 2" },
  { key: "sbdp3s2", label: "SBdP Kelas 3 Sem 2" },
  { key: "pjok3s2", label: "PJOK Kelas 3 Sem 2" },
  { key: "bing3s2", label: "B. Inggris Kelas 3 Sem 2" },
  { key: "bdaerah3s2", label: "B. Daerah Kelas 3 Sem 2" },
  { key: "pai4s2", label: "PAI Kelas 4 Sem 2" },
  { key: "ppkn4s2", label: "PPKn Kelas 4 Sem 2" },
  { key: "bind4s2", label: "B. Indonesia Kelas 4 Sem 2" },
  { key: "mat4s2", label: "Matematika Kelas 4 Sem 2" },
  { key: "ipas4s2", label: "IPAS Kelas 4 Sem 2" },
  { key: "sbdp4s2", label: "SBdP Kelas 4 Sem 2" },
  { key: "pjok4s2", label: "PJOK Kelas 4 Sem 2" },
  { key: "bing4s2", label: "B. Inggris Kelas 4 Sem 2" },
  { key: "bdaerah4s2", label: "B. Daerah Kelas 4 Sem 2" },
  { key: "pai5s2", label: "PAI Kelas 5 Sem 2" },
  { key: "ppkn5s2", label: "PPKn Kelas 5 Sem 2" },
  { key: "bind5s2", label: "B. Indonesia Kelas 5 Sem 2" },
  { key: "mat5s2", label: "Matematika Kelas 5 Sem 2" },
  { key: "ipas5s2", label: "IPAS Kelas 5 Sem 2" },
  { key: "sbdp5s2", label: "SBdP Kelas 5 Sem 2" },
  { key: "pjok5s2", label: "PJOK Kelas 5 Sem 2" },
  { key: "bing5s2", label: "B. Inggris Kelas 5 Sem 2" },
  { key: "bdaerah5s2", label: "B. Daerah Kelas 5 Sem 2" },
  { key: "pai6s2", label: "PAI Kelas 6 Sem 2" },
  { key: "ppkn6s2", label: "PPKn Kelas 6 Sem 2" },
  { key: "bind6s2", label: "B. Indonesia Kelas 6 Sem 2" },
  { key: "mat6s2", label: "Matematika Kelas 6 Sem 2" },
  { key: "ipas6s2", label: "IPAS Kelas 6 Sem 2" },
  { key: "sbdp6s2", label: "SBdP Kelas 6 Sem 2" },
  { key: "pjok6s2", label: "PJOK Kelas 6 Sem 2" },
  { key: "bing6s2", label: "B. Inggris Kelas 6 Sem 2" },
  { key: "bdaerah6s2", label: "B. Daerah Kelas 6 Sem 2" },
  // ── FILE RAPOR ──
  { key: "fileRapor1s1", label: "File Rapor Kelas 1 Sem 1" },
  { key: "fileRapor1s2", label: "File Rapor Kelas 1 Sem 2" },
  { key: "fileRapor2s1", label: "File Rapor Kelas 2 Sem 1" },
  { key: "fileRapor2s2", label: "File Rapor Kelas 2 Sem 2" },
  { key: "fileRapor3s1", label: "File Rapor Kelas 3 Sem 1" },
  { key: "fileRapor3s2", label: "File Rapor Kelas 3 Sem 2" },
  { key: "fileRapor4s1", label: "File Rapor Kelas 4 Sem 1" },
  { key: "fileRapor4s2", label: "File Rapor Kelas 4 Sem 2" },
  { key: "fileRapor5s1", label: "File Rapor Kelas 5 Sem 1" },
  { key: "fileRapor5s2", label: "File Rapor Kelas 5 Sem 2" },
  { key: "fileRapor6s1", label: "File Rapor Kelas 6 Sem 1" },
  { key: "fileRapor6s2", label: "File Rapor Kelas 6 Sem 2" },
];

const FILE_FIELDS = [
  { key: "fotokopiAktaLahir", label: "Fotokopi Akta Kelahiran" },
  { key: "fotokopiKK", label: "Fotokopi KK" },
  { key: "fotokopiSktbTk", label: "Fotokopi SKTB TK" },
  { key: "kartuKesejahteraan", label: "Kartu Kesejahteraan" },
  { key: "fotoSiswa", label: "Foto Siswa" },
  { key: "fotoLulus", label: "Foto Lulus" },
];

const FILE_RAPOR_FIELDS = [
  { key: "fileRapor1s1", label: "File Rapor Kelas 1 Sem 1" },
  { key: "fileRapor1s2", label: "File Rapor Kelas 1 Sem 2" },
  { key: "fileRapor2s1", label: "File Rapor Kelas 2 Sem 1" },
  { key: "fileRapor2s2", label: "File Rapor Kelas 2 Sem 2" },
  { key: "fileRapor3s1", label: "File Rapor Kelas 3 Sem 1" },
  { key: "fileRapor3s2", label: "File Rapor Kelas 3 Sem 2" },
  { key: "fileRapor4s1", label: "File Rapor Kelas 4 Sem 1" },
  { key: "fileRapor4s2", label: "File Rapor Kelas 4 Sem 2" },
  { key: "fileRapor5s1", label: "File Rapor Kelas 5 Sem 1" },
  { key: "fileRapor5s2", label: "File Rapor Kelas 5 Sem 2" },
  { key: "fileRapor6s1", label: "File Rapor Kelas 6 Sem 1" },
  { key: "fileRapor6s2", label: "File Rapor Kelas 6 Sem 2" },
];

const RAPOR_FOLDER_ID = "1eVKXOWxhcfOk0I6TEzZuMjOhZOaPBMZ2";

const EMPTY_FORM: Record<string, string> = COLUMNS.reduce((acc, col) => {
  acc[col.key] = "";
  return acc;
}, {} as Record<string, string>);

// ─── CSS CLASS CONSTANTS ──────────────────────────────────────────────────────
const INPUT_CLASS =
  "peer w-full px-4 pt-6 pb-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white";
const LABEL_CLASS =
  "absolute left-4 top-2 text-gray-500 text-sm transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-blue-600 pointer-events-none";
const INPUT_EDIT_CLASS =
  "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white";

// ─── MODAL STYLES ─────────────────────────────────────────────────────────────
const modalOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.55)",
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
};
const modalBox: React.CSSProperties = {
  backgroundColor: "white",
  borderRadius: 16,
  boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
  width: "100%",
  maxWidth: 680,
  height: "85vh",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};
const modalBody: React.CSSProperties = {
  overflowY: "scroll",
  flexGrow: 1,
  flexShrink: 1,
  flexBasis: 0,
  minHeight: 0,
  padding: 24,
};

// ─── FORMAT TANGGAL ───────────────────────────────────────────────────────────
function formatTanggal(val: string): string {
  if (!val) return "—";
  if (val.includes("T")) {
    const date = new Date(val);
    if (!isNaN(date.getTime())) {
      const d = ("0" + date.getDate()).slice(-2);
      const m = ("0" + (date.getMonth() + 1)).slice(-2);
      const y = date.getFullYear();
      return `${d}/${m}/${y}`;
    }
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
    const [y, m, d] = val.split("-");
    return `${d}/${m}/${y}`;
  }
  return val;
}

// ─── CONVERT GOOGLE DRIVE URL → EMBED/THUMBNAIL URL ─────────────────────────
function convertDriveUrl(url: string): string {
  if (!url) return "";
  // Format: https://drive.google.com/file/d/FILE_ID/view
  const matchFile = url.match(/\/file\/d\/([^/]+)/);
  if (matchFile)
    return `https://drive.google.com/thumbnail?id=${matchFile[1]}&sz=w400`;
  // Format: https://drive.google.com/open?id=FILE_ID
  const matchOpen = url.match(/[?&]id=([^&]+)/);
  if (matchOpen)
    return `https://drive.google.com/thumbnail?id=${matchOpen[1]}&sz=w400`;
  // Format: https://drive.google.com/uc?export=view&id=FILE_ID
  const matchUc = url.match(/id=([^&]+)/);
  if (matchUc)
    return `https://drive.google.com/thumbnail?id=${matchUc[1]}&sz=w400`;
  // Sudah dalam format lain, kembalikan apa adanya
  return url;
}

// ─── FILE TO BASE64 ───────────────────────────────────────────────────────────
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── UPLOAD FILE COMPONENT ────────────────────────────────────────────────────
const FileUploadField = ({
  fieldKey,
  label,
  file,
  existingUrl,
  onChange,
}: {
  fieldKey: string;
  label: string;
  file: File | null;
  existingUrl?: string;
  onChange: (key: string, file: File | null) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50 hover:border-blue-300 hover:bg-blue-50 transition-all">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 flex-shrink-0 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-lg">
          📄
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
          {file ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full truncate max-w-xs">
                ✓ {file.name}
              </span>
              <button
                type="button"
                onClick={() => onChange(fieldKey, null)}
                className="text-xs text-red-500 hover:text-red-700 transition flex-shrink-0"
              >
                Hapus
              </button>
            </div>
          ) : existingUrl ? (
            <div className="flex items-center gap-2">
              <a
                href={existingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 underline truncate max-w-xs"
              >
                File tersimpan (klik untuk lihat)
              </a>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-xs text-amber-600 hover:text-amber-800 transition flex-shrink-0"
              >
                Ganti
              </button>
            </div>
          ) : (
            <p className="text-xs text-gray-400">JPG / PNG · Maks 10 MB</p>
          )}
        </div>
        {!file && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex-shrink-0 px-3 py-1.5 bg-white border border-gray-300 text-gray-600 text-xs font-medium rounded-lg hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 transition shadow-sm"
          >
            Pilih File
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0] || null;
          if (f && f.size > 10 * 1024 * 1024) {
            alert("Ukuran file maksimal 10 MB");
            return;
          }
          onChange(fieldKey, f);
          e.target.value = "";
        }}
      />
    </div>
  );
};

// ─── SECTION HEADER ───────────────────────────────────────────────────────────
const SectionHeader = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) => (
  <div className="md:col-span-2 mt-4 mb-2">
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-gradient-to-r from-blue-300 to-transparent" />
      <h2 className="text-lg font-semibold text-blue-700 whitespace-nowrap">
        {title}
      </h2>
      <div className="flex-1 h-px bg-gradient-to-l from-blue-300 to-transparent" />
    </div>
    {subtitle && (
      <p className="text-center text-sm text-gray-400 mt-1">{subtitle}</p>
    )}
  </div>
);

// ─── FORM FIELD (F) ───────────────────────────────────────────────────────────
const F = ({
  name,
  label,
  required,
  full,
  type = "text",
  value,
  onChange,
  ...rest
}: {
  name: string;
  label: string;
  required?: boolean;
  full?: boolean;
  type?: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  [key: string]: any;
}) => (
  <div className={`relative${full ? " md:col-span-2" : ""}`}>
    <input
      type={type}
      name={name}
      id={name}
      value={value}
      onChange={onChange}
      className={INPUT_CLASS}
      placeholder=" "
      required={required}
      {...rest}
    />
    <label htmlFor={name} className={LABEL_CLASS}>
      {label}
      {required ? " *" : ""}
    </label>
  </div>
);

// ─── EDIT FIELD (EF) ──────────────────────────────────────────────────────────
const EF = ({
  name,
  label,
  type = "text",
  value,
  onChange,
}: {
  name: string;
  label: string;
  type?: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
}) => (
  <div>
    <label className="block text-xs text-gray-500 mb-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className={INPUT_EDIT_CLASS}
    />
  </div>
);

// ─── DETAIL ROW ───────────────────────────────────────────────────────────────
const DetailRow = ({ label, value }: { label: string; value: string }) => {
  if (!value) return null;
  const isUrl = String(value).startsWith("http");
  return (
    <div className="flex gap-2 py-1.5 border-b border-gray-100 last:border-0">
      <span className="w-48 flex-shrink-0 text-gray-500 text-sm">{label}</span>
      {isUrl ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 text-sm font-medium underline hover:text-blue-800"
        >
          Lihat File ↗
        </a>
      ) : (
        <span className="text-gray-800 text-sm font-medium">{value}</span>
      )}
    </div>
  );
};

// ─── HALAMAN FORM ─────────────────────────────────────────────────────────────
function PageForm() {
  const [formData, setFormData] = useState<Record<string, string>>(EMPTY_FORM);
  const [files, setFiles] = useState<Record<string, File | null>>({
    fotokopiAktaLahir: null,
    fotokopiKK: null,
    fotokopiSktbTk: null,
    kartuKesejahteraan: null,
    fotoSiswa: null,
  });
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [uploadProgress, setUploadProgress] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const numericOnlyFields = ["nomorKK", "nik"];
    const value = numericOnlyFields.includes(e.target.name)
      ? e.target.value.replace(/[^0-9]/g, "")
      : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleFileChange = (key: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");
    setUploadProgress("Menyiapkan data...");

    try {
      const fileData: Record<
        string,
        { base64: string; mimeType: string; fileName: string } | null
      > = {};
      for (const fk of FILE_FIELDS.filter((f) => f.key !== "fotoLulus")) {
        const f = files[fk.key];
        if (f) {
          setUploadProgress(`Mengupload ${fk.label}...`);

          // Kompres jika > 100 KB
          const compressedBase64 = await new Promise<string>(
            (resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                const result = reader.result as string;

                if (f.size <= 100 * 1024) {
                  resolve(result.split(",")[1]);
                  return;
                }

                const img = new Image();
                img.onload = () => {
                  const canvas = document.createElement("canvas");
                  let { width, height } = img;

                  const MAX_DIM = 1200;
                  if (width > MAX_DIM || height > MAX_DIM) {
                    if (width > height) {
                      height = Math.round((height * MAX_DIM) / width);
                      width = MAX_DIM;
                    } else {
                      width = Math.round((width * MAX_DIM) / height);
                      height = MAX_DIM;
                    }
                  }

                  canvas.width = width;
                  canvas.height = height;
                  const ctx = canvas.getContext("2d")!;
                  ctx.drawImage(img, 0, 0, width, height);

                  const TARGET = 100 * 1024;
                  let quality = 0.9;

                  const compress = () => {
                    const base64 = canvas.toDataURL("image/jpeg", quality);
                    const estimatedSize =
                      (base64.length - "data:image/jpeg;base64,".length) * 0.75;

                    if (estimatedSize <= TARGET || quality <= 0.05) {
                      resolve(base64.split(",")[1]);
                    } else {
                      quality = Math.max(quality - 0.08, 0.05);
                      compress();
                    }
                  };

                  compress();
                };
                img.onerror = reject;
                img.src = result;
              };
              reader.onerror = reject;
              reader.readAsDataURL(f);
            }
          );

          fileData[fk.key] = {
            base64: compressedBase64,
            mimeType: "image/jpeg", // hasil kompresi selalu JPEG
            fileName: f.name.replace(/\.(png|jpg|jpeg)$/i, ".jpg"),
          };
        } else {
          fileData[fk.key] = null;
        }
      }

      setUploadProgress("Mengirim data ke server...");

      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tanggalLahir: formData.tanggalLahir
            ? formData.tanggalLahir.split("-").reverse().join("/")
            : "",
          // Kelas otomatis "1", rombel kosong
          kelas: "1",
          rombel: "",
          files: fileData,
        }),
      });

      if (response.ok || response.type === "opaque") {
        setStatus("success");
        setUploadProgress("");
        setTimeout(() => {
          setFormData(EMPTY_FORM);
          setFiles({
            fotokopiAktaLahir: null,
            fotokopiKK: null,
            fotokopiSktbTk: null,
            kartuKesejahteraan: null,
            fotoSiswa: null,
          });
          setStatus("idle");
        }, 2500);
      } else {
        setStatus("error");
        setUploadProgress("");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
      setUploadProgress("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionHeader title="Data Pribadi Siswa" />
        <F
          name="namaLengkap"
          label="Nama Lengkap"
          required
          value={formData.namaLengkap}
          onChange={handleChange}
        />
        <F
          name="namaPanggilan"
          label="Nama Panggilan"
          value={formData.namaPanggilan}
          onChange={handleChange}
        />
        <div className="relative">
          <select
            name="jenisKelamin"
            id="jenisKelamin"
            value={formData.jenisKelamin}
            onChange={handleChange}
            className={INPUT_CLASS}
            required
          >
            <option value="" disabled hidden></option>
            <option value="Laki-laki">Laki-laki</option>
            <option value="Perempuan">Perempuan</option>
          </select>
          <label htmlFor="jenisKelamin" className={LABEL_CLASS}>
            Jenis Kelamin *
          </label>
        </div>
        <F
          name="nomorKK"
          label="Nomor KK"
          required
          inputMode="numeric"
          pattern="[0-9]*"
          onInput={(e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, "");
          }}
          value={formData.nomorKK}
          onChange={handleChange}
        />
        <F
          name="nik"
          label="NIK (Nomor Induk Kependudukan)"
          inputMode="numeric"
          pattern="[0-9]*"
          onInput={(e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, "");
          }}
          value={formData.nik}
          onChange={handleChange}
        />
        <F
          name="tempatLahir"
          label="Tempat Lahir"
          required
          value={formData.tempatLahir}
          onChange={handleChange}
        />
        <F
          name="tanggalLahir"
          label="Tanggal Lahir"
          required
          type="date"
          value={formData.tanggalLahir}
          onChange={handleChange}
        />
        <F
          name="noRegAktaLahir"
          label="No. Reg. Akta Lahir"
          value={formData.noRegAktaLahir}
          onChange={handleChange}
        />
        <div className="relative">
          <select
            name="agama"
            id="agama"
            value={formData.agama}
            onChange={handleChange}
            className={INPUT_CLASS}
          >
            <option value="" disabled hidden></option>
            <option value="Islam">Islam</option>
            <option value="Kristen Protestan">Kristen Protestan</option>
            <option value="Katolik">Katolik</option>
            <option value="Hindu">Hindu</option>
            <option value="Buddha">Buddha</option>
            <option value="Konghucu">Konghucu</option>
          </select>
          <label htmlFor="agama" className={LABEL_CLASS}>
            Agama
          </label>
        </div>
        <F
          name="kewarganegaraan"
          label="Kewarganegaraan"
          value={formData.kewarganegaraan}
          onChange={handleChange}
        />
        <F
          name="anakKeBerapa"
          label="Anak ke Berapa"
          value={formData.anakKeBerapa}
          onChange={handleChange}
        />
        <F
          name="anakKeDari"
          label="Jumlah Saudara Kandung"
          value={formData.anakKeDari}
          onChange={handleChange}
        />
        <F
          name="statusDalamKeluarga"
          label="Status dalam Keluarga"
          value={formData.statusDalamKeluarga}
          onChange={handleChange}
        />
        <F
          name="siswaTinggalBersama"
          label="Siswa Tinggal Bersama"
          value={formData.siswaTinggalBersama}
          onChange={handleChange}
        />
        <F
          name="tempatTinggal"
          label="Tempat Tinggal Saat Ini"
          value={formData.tempatTinggal}
          onChange={handleChange}
        />
        <F
          name="transportasi"
          label="Transportasi ke Sekolah"
          value={formData.transportasi}
          onChange={handleChange}
        />

        <SectionHeader title="Alamat Siswa" />
        <F
          name="jalan"
          label="Jalan / Dusun"
          full
          value={formData.jalan}
          onChange={handleChange}
        />
        <F name="rt" label="RT" value={formData.rt} onChange={handleChange} />
        <F name="rw" label="RW" value={formData.rw} onChange={handleChange} />
        <F
          name="kelurahanDesa"
          label="Kelurahan / Desa"
          value={formData.kelurahanDesa}
          onChange={handleChange}
        />
        <F
          name="kecamatan"
          label="Kecamatan"
          value={formData.kecamatan}
          onChange={handleChange}
        />
        <F
          name="kotaKabupaten"
          label="Kota / Kabupaten"
          value={formData.kotaKabupaten}
          onChange={handleChange}
        />
        <F
          name="propinsi"
          label="Provinsi"
          value={formData.propinsi}
          onChange={handleChange}
        />
        <F
          name="kodePos"
          label="Kode Pos"
          value={formData.kodePos}
          onChange={handleChange}
        />

        <SectionHeader title="Data Orang Tua — Ayah" />
        <F
          name="namaAyah"
          label="Nama Ayah"
          value={formData.namaAyah}
          onChange={handleChange}
        />
        <F
          name="tempatLahirAyah"
          label="Tempat Lahir Ayah"
          value={formData.tempatLahirAyah}
          onChange={handleChange}
        />
        <div className="relative">
          <select
            name="agamaAyah"
            id="agamaAyah"
            value={formData.agamaAyah}
            onChange={handleChange}
            className={INPUT_CLASS}
          >
            <option value="" disabled hidden></option>
            <option value="Islam">Islam</option>
            <option value="Kristen Protestan">Kristen Protestan</option>
            <option value="Katolik">Katolik</option>
            <option value="Hindu">Hindu</option>
            <option value="Buddha">Buddha</option>
            <option value="Konghucu">Konghucu</option>
          </select>
          <label htmlFor="agamaAyah" className={LABEL_CLASS}>
            Agama Ayah
          </label>
        </div>
        <F
          name="kewarganegaraanAyah"
          label="Kewarganegaraan Ayah"
          value={formData.kewarganegaraanAyah}
          onChange={handleChange}
        />
        <F
          name="pendidikanAyah"
          label="Pendidikan Ayah"
          value={formData.pendidikanAyah}
          onChange={handleChange}
        />
        <F
          name="pekerjaanAyah"
          label="Pekerjaan Ayah"
          value={formData.pekerjaanAyah}
          onChange={handleChange}
        />
        <F
          name="penghasilanAyah"
          label="Penghasilan Ayah per Bulan"
          value={formData.penghasilanAyah}
          onChange={handleChange}
        />
        <F
          name="alamatKantorAyah"
          label="Alamat Kantor Ayah"
          value={formData.alamatKantorAyah}
          onChange={handleChange}
        />
        <F
          name="alamatRumahAyah"
          label="Alamat Rumah Ayah"
          full
          value={formData.alamatRumahAyah}
          onChange={handleChange}
        />

        <SectionHeader title="Data Orang Tua — Ibu" />
        <F
          name="namaIbu"
          label="Nama Lengkap Ibu"
          value={formData.namaIbu}
          onChange={handleChange}
        />
        <F
          name="tempatLahirIbu"
          label="Tempat Lahir Ibu"
          value={formData.tempatLahirIbu}
          onChange={handleChange}
        />
        <div className="relative">
          <select
            name="agamaIbu"
            id="agamaIbu"
            value={formData.agamaIbu}
            onChange={handleChange}
            className={INPUT_CLASS}
          >
            <option value="" disabled hidden></option>
            <option value="Islam">Islam</option>
            <option value="Kristen Protestan">Kristen Protestan</option>
            <option value="Katolik">Katolik</option>
            <option value="Hindu">Hindu</option>
            <option value="Buddha">Buddha</option>
            <option value="Konghucu">Konghucu</option>
          </select>
          <label htmlFor="agamaIbu" className={LABEL_CLASS}>
            Agama Ibu
          </label>
        </div>
        <F
          name="kewarganegaraanIbu"
          label="Kewarganegaraan Ibu"
          value={formData.kewarganegaraanIbu}
          onChange={handleChange}
        />
        <F
          name="bahasaIbu"
          label="Bahasa Ibu Sehari-hari"
          value={formData.bahasaIbu}
          onChange={handleChange}
        />
        <F
          name="pendidikanIbu"
          label="Pendidikan Ibu"
          value={formData.pendidikanIbu}
          onChange={handleChange}
        />
        <F
          name="pekerjaanIbu"
          label="Pekerjaan Ibu"
          value={formData.pekerjaanIbu}
          onChange={handleChange}
        />
        <F
          name="penghasilanIbu"
          label="Penghasilan Ibu per Bulan"
          value={formData.penghasilanIbu}
          onChange={handleChange}
        />
        <F
          name="alamatRumahIbu"
          label="Alamat Rumah Ibu"
          full
          value={formData.alamatRumahIbu}
          onChange={handleChange}
        />

        <SectionHeader
          title="Data Wali"
          subtitle="Isi jika ada wali selain orang tua"
        />
        <F
          name="namaWali"
          label="Nama Lengkap Wali"
          value={formData.namaWali}
          onChange={handleChange}
        />
        <F
          name="tempatLahirWali"
          label="Tempat Lahir Wali"
          value={formData.tempatLahirWali}
          onChange={handleChange}
        />
        <div className="relative">
          <select
            name="agamaWali"
            id="agamaWali"
            value={formData.agamaWali}
            onChange={handleChange}
            className={INPUT_CLASS}
          >
            <option value="" disabled hidden></option>
            <option value="Islam">Islam</option>
            <option value="Kristen Protestan">Kristen Protestan</option>
            <option value="Katolik">Katolik</option>
            <option value="Hindu">Hindu</option>
            <option value="Buddha">Buddha</option>
            <option value="Konghucu">Konghucu</option>
          </select>
          <label htmlFor="agamaWali" className={LABEL_CLASS}>
            Agama Wali
          </label>
        </div>
        <F
          name="kewarganegaraanWali"
          label="Kewarganegaraan Wali"
          value={formData.kewarganegaraanWali}
          onChange={handleChange}
        />
        <F
          name="bahasaWali"
          label="Bahasa Wali Sehari-hari"
          value={formData.bahasaWali}
          onChange={handleChange}
        />
        <F
          name="pekerjaanWali"
          label="Pekerjaan Wali"
          value={formData.pekerjaanWali}
          onChange={handleChange}
        />
        <F
          name="alamatKantorWali"
          label="Alamat Kantor Wali"
          value={formData.alamatKantorWali}
          onChange={handleChange}
        />
        <F
          name="alamatRumahWali"
          label="Alamat Rumah Wali"
          value={formData.alamatRumahWali}
          onChange={handleChange}
        />

        <SectionHeader title="Data Fisik" />
        <F
          name="tinggiBadan"
          label="Tinggi Badan (cm)"
          value={formData.tinggiBadan}
          onChange={handleChange}
        />
        <F
          name="beratBadan"
          label="Berat Badan (kg)"
          value={formData.beratBadan}
          onChange={handleChange}
        />
        <F
          name="lingkarKepala"
          label="Lingkar Kepala (cm)"
          value={formData.lingkarKepala}
          onChange={handleChange}
        />
        <F
          name="jarakSekolahKm"
          label="Jarak ke Sekolah (KM)"
          value={formData.jarakSekolahKm}
          onChange={handleChange}
        />
        <F
          name="jarakSekolahJam"
          label="Jarak ke Sekolah (jam/menit)"
          value={formData.jarakSekolahJam}
          onChange={handleChange}
        />

        <SectionHeader title="Data Kesejahteraan" />
        <F
          name="jenisKesejahteraan"
          label="Jenis Kesejahteraan"
          value={formData.jenisKesejahteraan}
          onChange={handleChange}
        />
        <F
          name="nomorKartu"
          label="Nomor Kartu"
          value={formData.nomorKartu}
          onChange={handleChange}
        />
        <F
          name="namaDiKartu"
          label="Nama di Kartu"
          value={formData.namaDiKartu}
          onChange={handleChange}
        />

        {/* ── UPLOAD DOKUMEN ── */}
        <SectionHeader
          title="Upload Dokumen"
          subtitle="Format: PDF, JPG, atau PNG · Maks 10 MB per file"
        />
        <div className="md:col-span-2 grid grid-cols-1 gap-4">
          {FILE_FIELDS.filter((ff) => ff.key !== "fotoLulus").map((ff) => (
            <FileUploadField
              key={ff.key}
              fieldKey={ff.key}
              label={ff.label}
              file={files[ff.key]}
              onChange={handleFileChange}
            />
          ))}
        </div>
      </div>

      <div className="mt-8 text-center" style={{ minHeight: 28 }}>
        {status === "loading" && (
          <p className="text-blue-600 font-medium">
            {uploadProgress || "Sedang mengirim data..."}
          </p>
        )}
        {status === "success" && (
          <p className="text-green-600 font-medium text-lg">
            ✓ Data berhasil dikirim! Terima kasih.
          </p>
        )}
        {status === "error" && (
          <p className="text-red-600 font-medium">
            Gagal mengirim data. Silakan coba lagi.
          </p>
        )}
      </div>

      <div className="mt-8 text-center">
        <button
          type="submit"
          disabled={status === "loading"}
          style={{ background: "#2563eb" }}
          className="inline-flex px-12 py-4 text-white font-semibold text-lg rounded-xl shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === "loading" ? "Mengirim..." : "Kirim Data Pendaftaran"}
        </button>
      </div>
    </form>
  );
}

function RaporUploadCell({
  student,
  realIndex,
  initKelas,
  lockedKelas,
}: {
  student: Student;
  realIndex: number;
  initKelas?: string;
  lockedKelas?: boolean;
}) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedKelas, setSelectedKelas] = useState(
    initKelas || student.kelas || "1"
  );
  const [showLihatModal, setShowLihatModal] = useState(false);

  const [selectedSem, setSelectedSem] = useState<"s1" | "s2">("s1");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  const fieldKey = `fileRapor${selectedKelas}${selectedSem}`;
  const existingUrl = student[fieldKey] || "";

  // Hitung file rapor yang sudah ada
  const raporList = ["1", "2", "3", "4", "5", "6"]
    .flatMap((k) =>
      (["s1", "s2"] as const).map((sem) => ({
        kelas: k,
        sem,
        label: `Kelas ${k} Semester ${sem === "s1" ? "1" : "2"}`,
        url: student[`fileRapor${k}${sem}`] || "",
      }))
    )
    .filter((r) => r.url);

  const raporCount = raporList.length;

  const handleKirim = async () => {
    if (!selectedFile) {
      alert("Pilih file PDF terlebih dahulu.");
      return;
    }
    setUploading(true);
    setUploadStatus("idle");
    try {
      const base64 = await fileToBase64(selectedFile);
      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "uploadRapor",
          rowIndex: realIndex + 2,
          fieldKey,
          base64,
          mimeType: selectedFile.type || "application/pdf",
          fileName: selectedFile.name,
        }),
      });
      if (response.ok || response.type === "opaque") {
        setUploadStatus("success");
        student[fieldKey] = "uploaded";
        setTimeout(() => {
          setShowUploadModal(false);
          setSelectedFile(null);
          setUploadStatus("idle");
        }, 2000);
      } else {
        setUploadStatus("error");
      }
    } catch {
      setUploadStatus("error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {/* Tombol di tabel */}
      <div className="flex flex-col gap-1.5">
        <button
          onClick={() => {
            setShowUploadModal(true);
            setUploadStatus("idle");
            setSelectedFile(null);
          }}
          style={{ background: "#7c3aed" }}
          className="px-2.5 py-1.5 text-white text-xs font-semibold rounded-lg transition shadow-sm whitespace-nowrap"
        >
          📄{" "}
          {raporCount > 0
            ? lockedKelas
              ? `${Math.min(raporCount, 2)}/2`
              : `${raporCount}/12`
            : "Upload"}
        </button>
        {raporCount > 0 && (
          <button
            onClick={() => setShowLihatModal(true)}
            style={{ background: "#0369a1" }}
            className="px-2.5 py-1.5 text-white text-xs font-semibold rounded-lg transition shadow-sm whitespace-nowrap"
          >
            👁 Lihat Rapor
          </button>
        )}
      </div>

      {/* ══ MODAL LIHAT RAPOR ══ */}
      {showLihatModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.55)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setShowLihatModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
              width: "100%",
              maxWidth: 520,
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                background: "linear-gradient(to right,#0369a1,#0284c7)",
              }}
              className="px-6 py-4 text-white flex items-center justify-between flex-shrink-0"
            >
              <div>
                <p className="text-blue-200 text-xs uppercase tracking-widest mb-0.5">
                  File Rapor Tersedia
                </p>
                <h2 className="text-lg font-bold">
                  {student.namaLengkap || "—"}
                </h2>
                <p className="text-blue-100 text-xs mt-0.5">
                  {raporCount} file rapor tersimpan
                </p>
              </div>
              <button
                onClick={() => setShowLihatModal(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div style={{ overflowY: "auto", flexGrow: 1, padding: 24 }}>
              {/* Grid per kelas */}
              {(lockedKelas
                ? [selectedKelas]
                : ["1", "2", "3", "4", "5", "6"]
              ).map((k) => {
                const s1Url = student[`fileRapor${k}s1`] || "";
                const s2Url = student[`fileRapor${k}s2`] || "";
                if (!s1Url && !s2Url) return null;

                const kelasColors: Record<
                  string,
                  { bg: string; header: string }
                > = {
                  "1": { bg: "#eff6ff", header: "#2563eb" },
                  "2": { bg: "#f0fdf4", header: "#16a34a" },
                  "3": { bg: "#fefce8", header: "#ca8a04" },
                  "4": { bg: "#fff7ed", header: "#ea580c" },
                  "5": { bg: "#faf5ff", header: "#9333ea" },
                  "6": { bg: "#fef2f2", header: "#dc2626" },
                };
                const c = kelasColors[k];

                return (
                  <div
                    key={k}
                    style={{
                      background: c.bg,
                      border: `1px solid ${c.header}30`,
                      borderRadius: 12,
                    }}
                    className="mb-3 overflow-hidden"
                  >
                    <div style={{ background: c.header }} className="px-4 py-2">
                      <span className="text-white text-xs font-bold uppercase tracking-wide">
                        Kelas {k}
                      </span>
                    </div>
                    <div className="p-3 flex flex-col gap-2">
                      {[
                        { sem: "s1", label: "Semester 1", url: s1Url },
                        { sem: "s2", label: "Semester 2", url: s2Url },
                      ].map(({ sem, label, url }) =>
                        url ? (
                          <a
                            key={sem}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              background: "white",
                              border: `1px solid ${c.header}40`,
                            }}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:shadow-md transition group"
                          >
                            <div
                              style={{ background: c.header, flexShrink: 0 }}
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-base"
                            >
                              📄
                            </div>
                            <div className="flex-1">
                              <p
                                style={{ color: c.header }}
                                className="text-sm font-semibold"
                              >
                                Rapor {label}
                              </p>
                              <p className="text-xs text-gray-400 group-hover:underline">
                                Klik untuk membuka file ↗
                              </p>
                            </div>
                            <span
                              style={{
                                background: `${c.header}15`,
                                color: c.header,
                              }}
                              className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                            >
                              ✓ Ada
                            </span>
                          </a>
                        ) : (
                          <div
                            key={sem}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border border-dashed border-gray-200"
                          >
                            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-base flex-shrink-0">
                              📄
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-400">
                                Rapor {label}
                              </p>
                              <p className="text-xs text-gray-300">
                                Belum diupload
                              </p>
                            </div>
                            <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                              Kosong
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center flex-shrink-0">
              <button
                onClick={() => {
                  setShowLihatModal(false);
                  setShowUploadModal(true);
                }}
                style={{ background: "#7c3aed" }}
                className="px-4 py-2 text-white rounded-lg text-sm font-semibold shadow-sm"
              >
                📤 Upload File Baru
              </button>
              <button
                onClick={() => setShowLihatModal(false)}
                className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL UPLOAD RAPOR ══ */}
      {showUploadModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.55)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => !uploading && setShowUploadModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
              width: "100%",
              maxWidth: 480,
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                background: "linear-gradient(to right,#7c3aed,#4f46e5)",
              }}
              className="px-6 py-4 text-white flex items-center justify-between"
            >
              <div>
                <p className="text-purple-200 text-xs uppercase tracking-widest mb-0.5">
                  Upload File Rapor
                </p>
                <h2 className="text-lg font-bold">
                  {student.namaLengkap || "—"}
                </h2>
              </div>
              <button
                onClick={() => !uploading && setShowUploadModal(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Pilih Kelas */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pilih Kelas
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {lockedKelas ? (
                    // Jika guru: hanya tampilkan kelas yang di-lock
                    (() => {
                      const k = selectedKelas;
                      const warna: Record<
                        string,
                        { bg: string; active: string }
                      > = {
                        "1": { bg: "#dbeafe", active: "#2563eb" },
                        "2": { bg: "#dcfce7", active: "#16a34a" },
                        "3": { bg: "#fef9c3", active: "#ca8a04" },
                        "4": { bg: "#ffedd5", active: "#ea580c" },
                        "5": { bg: "#f3e8ff", active: "#9333ea" },
                        "6": { bg: "#fee2e2", active: "#dc2626" },
                      };
                      const c = warna[k];
                      const sudahAda = !!student[`fileRapor${k}${selectedSem}`];
                      return (
                        <div className="flex items-center gap-2">
                          <button
                            style={{
                              background: c.active,
                              color: "white",
                              border: `2px solid ${c.active}`,
                            }}
                            className="py-2 px-5 rounded-lg text-sm font-bold relative cursor-default"
                          >
                            {k}
                            {sudahAda && (
                              <span
                                style={{
                                  position: "absolute",
                                  top: -4,
                                  right: -4,
                                  background: "#16a34a",
                                  color: "white",
                                  borderRadius: "50%",
                                  width: 14,
                                  height: 14,
                                  fontSize: 8,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                ✓
                              </span>
                            )}
                          </button>
                          <span className="text-xs text-gray-400 italic">
                            (kelas dikunci sesuai login)
                          </span>
                        </div>
                      );
                    })()
                  ) : (
                    // Operator: tampilkan semua kelas
                    <>
                      {["1", "2", "3", "4", "5", "6"].map((k) => {
                        const warna: Record<
                          string,
                          { bg: string; active: string }
                        > = {
                          "1": { bg: "#dbeafe", active: "#2563eb" },
                          "2": { bg: "#dcfce7", active: "#16a34a" },
                          "3": { bg: "#fef9c3", active: "#ca8a04" },
                          "4": { bg: "#ffedd5", active: "#ea580c" },
                          "5": { bg: "#f3e8ff", active: "#9333ea" },
                          "6": { bg: "#fee2e2", active: "#dc2626" },
                        };
                        const c = warna[k];
                        const sudahAda =
                          !!student[`fileRapor${k}${selectedSem}`];
                        return (
                          <button
                            key={k}
                            onClick={() => {
                              setSelectedKelas(k);
                              setSelectedFile(null);
                              setUploadStatus("idle");
                            }}
                            style={
                              selectedKelas === k
                                ? {
                                    background: c.active,
                                    color: "white",
                                    border: `2px solid ${c.active}`,
                                  }
                                : {
                                    background: c.bg,
                                    color: "#374151",
                                    border: "2px solid transparent",
                                  }
                            }
                            className="py-2 rounded-lg text-sm font-bold transition relative"
                          >
                            {k}
                            {sudahAda && (
                              <span
                                style={{
                                  position: "absolute",
                                  top: -4,
                                  right: -4,
                                  background: "#16a34a",
                                  color: "white",
                                  borderRadius: "50%",
                                  width: 14,
                                  height: 14,
                                  fontSize: 8,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                ✓
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>

              {/* Pilih Semester */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pilih Semester
                </label>
                <div className="flex gap-2">
                  {(["s1", "s2"] as const).map((sem) => {
                    const sudahAda =
                      !!student[`fileRapor${selectedKelas}${sem}`];
                    return (
                      <button
                        key={sem}
                        onClick={() => {
                          setSelectedSem(sem);
                          setSelectedFile(null);
                          setUploadStatus("idle");
                        }}
                        style={
                          selectedSem === sem
                            ? { background: "#7c3aed", color: "white" }
                            : { background: "white", color: "#374151" }
                        }
                        className="flex-1 py-2.5 rounded-lg text-sm font-semibold border border-gray-300 transition"
                      >
                        {sem === "s1" ? "📘 Semester 1" : "📗 Semester 2"}
                        {sudahAda && <span className="ml-1 text-xs">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Info kolom target */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-2.5 text-sm text-purple-800">
                File →{" "}
                <span className="font-bold">
                  Kelas {selectedKelas} Semester{" "}
                  {selectedSem === "s1" ? "1" : "2"}
                </span>
                {existingUrl && existingUrl !== "uploaded" && (
                  <div className="mt-1.5">
                    <a
                      href={existingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 underline text-xs"
                    >
                      📄 File lama tersedia — klik untuk lihat
                    </a>
                  </div>
                )}
              </div>

              {/* Pilih File */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pilih File PDF
                </label>
                <div
                  onClick={() => inputRef.current?.click()}
                  className="border-2 border-dashed border-purple-300 rounded-xl p-5 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition"
                >
                  {selectedFile ? (
                    <div>
                      <p className="text-sm font-medium text-green-700">
                        ✓ {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB · Klik
                        untuk ganti
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-3xl mb-1">📋</div>
                      <p className="text-sm font-medium text-gray-600">
                        Klik untuk memilih file PDF
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Format: PDF · Maks 20 MB
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      if (f.size > 20 * 1024 * 1024) {
                        alert("Ukuran file maksimal 20 MB");
                        return;
                      }
                      setSelectedFile(f);
                      setUploadStatus("idle");
                    }
                    e.target.value = "";
                  }}
                />
              </div>

              {uploadStatus === "success" && (
                <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-2.5 text-sm font-medium">
                  ✓ File rapor berhasil diupload!
                </div>
              )}
              {uploadStatus === "error" && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm font-medium">
                  ⚠️ Gagal upload. Silakan coba lagi.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex gap-3 justify-end border-t pt-4 bg-gray-50">
              <button
                onClick={() => !uploading && setShowUploadModal(false)}
                className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
              >
                Tutup
              </button>
              <button
                onClick={handleKirim}
                disabled={uploading || !selectedFile}
                style={{
                  background:
                    uploading || !selectedFile ? "#9ca3af" : "#7c3aed",
                }}
                className="px-5 py-2 text-white rounded-lg text-sm font-semibold shadow-sm disabled:cursor-not-allowed transition"
              >
                {uploading ? "⏳ Mengupload..." : "📤 Kirim"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── HALAMAN DATA ─────────────────────────────────────────────────────────────
type Student = Record<string, string>;

function PageData({
  initKelas = "",
  initRombel = "",
  lockedFilter = false,
}: { initKelas?: string; initRombel?: string; lockedFilter?: boolean } = {}) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterKelas, setFilterKelas] = useState(initKelas);
  const [filterRombel, setFilterRombel] = useState(initRombel);
  const [filterTahunLulus, setFilterTahunLulus] = useState("");
  const [selected, setSelected] = useState<Student | null>(null);
  const [editing, setEditing] = useState<{
    data: Student;
    rowIndex: number;
  } | null>(null);
  const [editForm, setEditForm] = useState<Student>({});
  const [editFiles, setEditFiles] = useState<Record<string, File | null>>({
    fotokopiAktaLahir: null,
    fotokopiKK: null,
    fotokopiSktbTk: null,
    kartuKesejahteraan: null,
    fotoSiswa: null,
    fotoLulus: null,
  });
  const [editStatus, setEditStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [deleteTarget, setDeleteTarget] = useState<{
    data: Student;
    rowIndex: number;
  } | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${SCRIPT_URL}?action=getData`);
      if (!res.ok) throw new Error("Gagal mengambil data dari server.");
      const json = await res.json();
      if (json.data && json.data.length > 1) {
        const rows: Student[] = json.data.slice(1).map((row: string[]) => {
          const obj: Student = {};
          COLUMNS.forEach((col, i) => {
            obj[col.key] = row[i] ?? "";
          });
          return obj;
        });
        setStudents(rows);
      } else {
        setStudents([]);
      }
    } catch (e: any) {
      setError(e.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = students.filter((s) => {
    const matchSearch = [
      s.namaLengkap,
      s.namaPanggilan,
      s.nomorKK,
      s.tempatLahir,
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchKelas = filterKelas
      ? String(s.kelas || "")
          .trim()
          .toLowerCase() === filterKelas.toLowerCase()
      : true;
    const matchRombel = filterRombel
      ? String(s.rombel || "")
          .trim()
          .toUpperCase() === filterRombel.toUpperCase()
      : true;
    const matchTahunLulus =
      filterKelas.toLowerCase() === "lulus" && filterTahunLulus
        ? String(s.tahunLulus || "").trim() === filterTahunLulus
        : true;
    return matchSearch && matchKelas && matchRombel && matchTahunLulus;
  });

  // ── EDIT ──
  const openEdit = (s: Student, rowIndex: number) => {
    const normalized = { ...s };
    if (s.tanggalLahir) {
      if (s.tanggalLahir.includes("T")) {
        const date = new Date(s.tanggalLahir);
        if (!isNaN(date.getTime())) {
          const y = date.getFullYear();
          const m = ("0" + (date.getMonth() + 1)).slice(-2);
          const d = ("0" + date.getDate()).slice(-2);
          normalized.tanggalLahir = `${y}-${m}-${d}`;
        }
      } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(s.tanggalLahir)) {
        const [d, m, y] = s.tanggalLahir.split("/");
        normalized.tanggalLahir = `${y}-${m}-${d}`;
      }
    }
    setEditForm(normalized);
    setEditFiles({
      fotokopiAktaLahir: null,
      fotokopiKK: null,
      fotokopiSktbTk: null,
      kartuKesejahteraan: null,
      fotoSiswa: null,
      fotoLulus: null,
    });
    setEditing({ data: s, rowIndex });
    setEditStatus("idle");
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditFileChange = (key: string, file: File | null) => {
    setEditFiles((prev) => ({ ...prev, [key]: file }));
  };

  const handleEditSubmit = async () => {
    if (!editing) return;
    setEditStatus("loading");
    try {
      const fileData: Record<
        string,
        { base64: string; mimeType: string; fileName: string } | null
      > = {};
      for (const fk of FILE_FIELDS) {
        const f = editFiles[fk.key];
        if (f) {
          const base64 = await fileToBase64(f);
          fileData[fk.key] = { base64, mimeType: f.type, fileName: f.name };
        } else {
          fileData[fk.key] = null;
        }
      }

      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateRow",
          rowIndex: editing.rowIndex + 2,
          data: {
            ...editForm,
            tanggalLahir: editForm.tanggalLahir
              ? editForm.tanggalLahir.split("-").reverse().join("/")
              : "",
          },
          files: fileData,
        }),
      });

      if (response.ok || response.type === "opaque") {
        setEditStatus("success");
        const saved = {
          ...editForm,
          tanggalLahir: editForm.tanggalLahir
            ? editForm.tanggalLahir.split("-").reverse().join("/")
            : "",
        };
        setStudents((prev) =>
          prev.map((s, i) => (i === editing.rowIndex ? saved : s))
        );
        setTimeout(() => {
          setEditing(null);
          setEditStatus("idle");
        }, 1500);
      } else {
        setEditStatus("error");
      }
    } catch {
      setEditStatus("error");
    }
  };

  // ── HAPUS ──
  const openDelete = (s: Student, rowIndex: number) => {
    setDeleteTarget({ data: s, rowIndex });
    setDeleteStatus("idle");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteStatus("loading");
    try {
      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deleteRow",
          rowIndex: deleteTarget.rowIndex + 2,
        }),
      });
      if (response.ok || response.type === "opaque") {
        setDeleteStatus("success");
        setStudents((prev) =>
          prev.filter((_, i) => i !== deleteTarget.rowIndex)
        );
        setTimeout(() => {
          setDeleteTarget(null);
          setDeleteStatus("idle");
        }, 1500);
      } else {
        setDeleteStatus("error");
      }
    } catch {
      setDeleteStatus("error");
    }
  };

  const handleDownloadExcel = () => {
    // Load SheetJS jika belum ada
    const doExport = () => {
      const XLSX = (window as any).XLSX;
      if (!XLSX) {
        alert(
          "Library Excel belum siap, tunggu beberapa detik lalu coba lagi."
        );
        return;
      }

      // Bangun array data: header + rows
      const headers = COLUMNS.map((c) => c.label);
      const rows = filtered.map((s) =>
        COLUMNS.map((c) => {
          if (c.key === "tanggalLahir") return formatTanggal(s[c.key] || "");
          return s[c.key] || "";
        })
      );

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

      // Auto lebar kolom
      ws["!cols"] = headers.map((_, i) => {
        const maxLen = Math.max(
          headers[i].length,
          ...rows.map((r) => String(r[i] || "").length)
        );
        return { wch: Math.min(maxLen + 2, 40) };
      });

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data Peserta Didik");

      const fileName = `DataPesertaDidik${
        filterKelas ? "_Kelas" + filterKelas : ""
      }${filterRombel ? "_Rombel" + filterRombel : ""}.xlsx`;
      XLSX.writeFile(wb, fileName);
    };

    if (!(window as any).XLSX) {
      const s = document.createElement("script");
      s.src =
        "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      s.onload = doExport;
      document.head.appendChild(s);
    } else {
      doExport();
    }
  };

  return (
    <div className="p-6 md:p-8">
      {/* ── TOOLBAR ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative w-full sm:w-72">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Cari nama, nomor KK, tempat lahir..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <select
            value={filterKelas}
            onChange={(e) => {
              if (!lockedFilter) {
                setFilterKelas(e.target.value);
                setFilterTahunLulus("");
              }
            }}
            disabled={lockedFilter}
            className={`px-3 py-2.5 border rounded-lg text-sm focus:outline-none bg-white ${
              lockedFilter
                ? "border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50"
                : "border-gray-300 focus:ring-2 focus:ring-blue-400"
            }`}
          >
            <option value="">Semua Kelas</option>
            {["1", "2", "3", "4", "5", "6", "lulus"].map((k) => (
              <option key={k} value={k}>
                {k === "lulus" ? "Lulus" : "Kelas " + k}
              </option>
            ))}
          </select>
          {filterKelas.toLowerCase() === "lulus" && (
            <select
              value={filterTahunLulus}
              onChange={(e) => setFilterTahunLulus(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            >
              <option value="">Semua Tahun Lulus</option>
              {Array.from(
                new Set(
                  students
                    .filter(
                      (s) =>
                        String(s.kelas || "").toLowerCase() === "lulus" &&
                        s.tahunLulus
                    )
                    .map((s) => s.tahunLulus)
                )
              )
                .sort((a, b) => Number(b) - Number(a))
                .map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
            </select>
          )}
          <select
            value={filterRombel}
            onChange={(e) => !lockedFilter && setFilterRombel(e.target.value)}
            disabled={lockedFilter}
            className={`px-3 py-2.5 border rounded-lg text-sm focus:outline-none bg-white ${
              lockedFilter
                ? "border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50"
                : "border-gray-300 focus:ring-2 focus:ring-blue-400"
            }`}
          >
            <option value="">Semua Rombel</option>
            <option value="A">Rombel A</option>
            <option value="B">Rombel B</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadExcel}
            disabled={filtered.length === 0}
            style={{ background: "#16a34a" }}
            className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 whitespace-nowrap"
          >
            📥 Download Excel
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            style={{ background: "#2563eb" }}
            className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 whitespace-nowrap"
          >
            ↻ {loading ? "Memuat..." : "Refresh Data"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          ⚠️ {error}
        </div>
      )}

      {loading && students.length === 0 && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-12 bg-gray-100 rounded-lg animate-pulse"
            />
          ))}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📋</div>
          <p className="font-medium">
            {students.length === 0
              ? "Belum ada data peserta didik."
              : "Tidak ada hasil pencarian."}
          </p>
          {students.length === 0 && (
            <p className="text-sm mt-1">
              Pastikan Apps Script sudah dikonfigurasi dengan fungsi doGet.
            </p>
          )}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr
                style={{
                  background: "linear-gradient(to right,#2563eb,#4f46e5)",
                }}
                className="text-white"
              >
                <th className="px-4 py-3 text-left font-semibold">No</th>
                <th className="px-4 py-3 text-left font-semibold">
                  Nama Lengkap
                </th>
                <th className="px-4 py-3 text-left font-semibold">
                  Jenis Kelamin
                </th>
                <th className="px-4 py-3 text-left font-semibold">
                  Tempat Lahir
                </th>
                <th className="px-4 py-3 text-left font-semibold">
                  Tanggal Lahir
                </th>
                <th className="px-4 py-3 text-left font-semibold">Nomor KK</th>
                {/* ── KOLOM BARU DI TABEL ── */}
                <th className="px-4 py-3 text-left font-semibold">Kelas</th>
                <th className="px-4 py-3 text-left font-semibold">Rombel</th>
                <th className="px-4 py-3 text-left font-semibold">NISN</th>
                <th className="px-4 py-3 text-left font-semibold">NIS</th>
                <th className="px-4 py-3 text-left font-semibold">NIK</th>
                <th className="px-4 py-3 text-left font-semibold">
                  File Rapor
                </th>
                {filterKelas.toLowerCase() === "lulus" && (
                  <th className="px-4 py-3 text-left font-semibold">
                    Tahun Lulus
                  </th>
                )}
                <th className="px-4 py-3 text-left font-semibold">Dokumen</th>
                <th className="px-4 py-3 text-left font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const realIndex = students.indexOf(s);
                const docsCount = [
                  s.fotoSiswa,
                  s.fotokopiAktaLahir,
                  s.fotokopiKK,
                  s.fotokopiSktbTk,
                  s.kartuKesejahteraan,
                  s.fotoLulus,
                ].filter(Boolean).length;
                return (
                  <tr
                    key={i}
                    className={`${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-blue-50 transition`}
                  >
                    <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {s.namaLengkap || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          s.jenisKelamin === "Laki-laki"
                            ? "bg-blue-100 text-blue-700"
                            : s.jenisKelamin === "Perempuan"
                            ? "bg-pink-100 text-pink-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {s.jenisKelamin || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {s.tempatLahir || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatTanggal(s.tanggalLahir)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                      {s.nomorKK || "—"}
                    </td>
                    {/* ── KELAS & ROMBEL ── */}
                    <td className="px-4 py-3 text-center">
                      {s.kelas ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                          {s.kelas}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {s.rombel ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                          {s.rombel}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    {/* ── NISN, NIS, NIK ── */}
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs text-center">
                      {s.nisn || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs text-center">
                      {s.nis || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs text-center">
                      {s.nik || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <RaporUploadCell
                        student={s}
                        realIndex={realIndex}
                        initKelas={filterKelas || s.kelas || "1"}
                        lockedKelas={lockedFilter}
                      />
                    </td>
                    {filterKelas.toLowerCase() === "lulus" && (
                      <td className="px-4 py-3 text-center">
                        {s.tahunLulus ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                            {s.tahunLulus}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          docsCount === 6
                            ? "bg-green-100 text-green-700"
                            : docsCount > 0
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {docsCount}/6 file
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setSelected(s)}
                          style={{ background: "#2563eb" }}
                          className="px-2.5 py-1.5 text-white text-xs font-semibold rounded-lg transition shadow-sm"
                        >
                          Detail
                        </button>
                        <button
                          onClick={() => openEdit(s, realIndex)}
                          style={{ background: "#f59e0b" }}
                          className="px-2.5 py-1.5 text-white text-xs font-semibold rounded-lg transition shadow-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openDelete(s, realIndex)}
                          style={{ background: "#ef4444" }}
                          className="px-2.5 py-1.5 text-white text-xs font-semibold rounded-lg transition shadow-sm"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-gray-400 text-right">
        Menampilkan {filtered.length} dari {students.length} data peserta didik
      </p>

      {/* ══ MODAL DETAIL ══════════════════════════════════════════════════════ */}
      {selected && (
        <div style={modalOverlay} onClick={() => setSelected(null)}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                background: "linear-gradient(to right,#2563eb,#4f46e5)",
              }}
              className="px-6 py-5 text-white flex items-start justify-between flex-shrink-0"
            >
              <div>
                <p className="text-blue-200 text-xs uppercase tracking-widest mb-1">
                  Detail Peserta Didik
                </p>
                <h2 className="text-xl font-bold">
                  {selected.namaLengkap || "—"}
                </h2>
                <p className="text-blue-100 text-sm mt-0.5">
                  {selected.jenisKelamin && (
                    <span className="mr-3">{selected.jenisKelamin}</span>
                  )}
                  {selected.tempatLahir && selected.tanggalLahir && (
                    <span>
                      {selected.tempatLahir},{" "}
                      {formatTanggal(selected.tanggalLahir)}
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="ml-4 w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-xl font-bold transition"
              >
                ×
              </button>
            </div>
            <div style={modalBody}>
              {[
                {
                  title: "Data Pribadi Siswa",
                  keys: [
                    "namaLengkap",
                    "namaPanggilan",
                    "jenisKelamin",
                    "nomorKK",
                    "tempatLahir",
                    "tanggalLahir",
                    "noRegAktaLahir",
                    "agama",
                    "kewarganegaraan",
                    "anakKeBerapa",
                    "anakKeDari",
                    "statusDalamKeluarga",
                    "siswaTinggalBersama",
                    "tempatTinggal",
                    "transportasi",
                  ],
                },
                {
                  title: "Kelas & Rombel",
                  keys: ["kelas", "rombel"],
                },
                {
                  title: "Identitas Siswa",
                  keys: ["nisn", "nis", "nik", "tahunLulus"],
                },
                {
                  title: "Alamat Siswa",
                  keys: [
                    "jalan",
                    "rt",
                    "rw",
                    "kelurahanDesa",
                    "kecamatan",
                    "kotaKabupaten",
                    "propinsi",
                    "kodePos",
                  ],
                },
                {
                  title: "Data Ayah",
                  keys: [
                    "namaAyah",
                    "tempatLahirAyah",
                    "agamaAyah",
                    "kewarganegaraanAyah",
                    "pendidikanAyah",
                    "pekerjaanAyah",
                    "penghasilanAyah",
                    "alamatKantorAyah",
                    "alamatRumahAyah",
                  ],
                },
                {
                  title: "Data Ibu",
                  keys: [
                    "namaIbu",
                    "tempatLahirIbu",
                    "agamaIbu",
                    "kewarganegaraanIbu",
                    "bahasaIbu",
                    "pendidikanIbu",
                    "pekerjaanIbu",
                    "penghasilanIbu",
                    "alamatRumahIbu",
                  ],
                },
                {
                  title: "Data Wali",
                  keys: [
                    "namaWali",
                    "tempatLahirWali",
                    "agamaWali",
                    "kewarganegaraanWali",
                    "bahasaWali",
                    "pekerjaanWali",
                    "alamatKantorWali",
                    "alamatRumahWali",
                  ],
                },
                {
                  title: "Data Fisik",
                  keys: [
                    "tinggiBadan",
                    "beratBadan",
                    "lingkarKepala",
                    "jarakSekolahKm",
                    "jarakSekolahJam",
                  ],
                },
                {
                  title: "Data Kesejahteraan",
                  keys: ["jenisKesejahteraan", "nomorKartu", "namaDiKartu"],
                },
              ].map((sec) => {
                const rows = sec.keys
                  .map((k) => COLUMNS.find((c) => c.key === k)!)
                  .filter(Boolean);
                if (!rows.some((r) => selected[r.key])) return null;
                return (
                  <div key={sec.title} className="mb-5">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-2 pb-1 border-b border-blue-100">
                      {sec.title}
                    </h3>
                    {rows.map((r) => (
                      <DetailRow
                        key={r.key}
                        label={r.label}
                        value={
                          r.key === "tanggalLahir"
                            ? formatTanggal(selected[r.key])
                            : selected[r.key]
                        }
                      />
                    ))}
                  </div>
                );
              })}

              {/* Foto Siswa */}
              {selected.fotoSiswa && (
                <div className="mb-5 flex flex-col items-center">
                  <h3 className="w-full text-xs font-bold uppercase tracking-widest text-blue-500 mb-3 pb-1 border-b border-blue-100">
                    Foto Siswa
                  </h3>
                  <img
                    src={convertDriveUrl(selected.fotoSiswa)}
                    alt="Foto Siswa"
                    className="w-36 h-44 object-cover rounded-xl border-4 border-blue-100 shadow-md"
                  />
                </div>
              )}

              {/* Dokumen section */}
              <div className="mb-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-2 pb-1 border-b border-blue-100">
                  Dokumen Terlampir
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {FILE_FIELDS.map((ff) =>
                    selected[ff.key] ? (
                      <a
                        key={ff.key}
                        href={selected[ff.key]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition group"
                      >
                        <span className="text-2xl">📄</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-800">
                            {ff.label}
                          </p>
                          <p className="text-xs text-blue-500 group-hover:underline">
                            Klik untuk membuka file ↗
                          </p>
                        </div>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                          ✓ Ada
                        </span>
                      </a>
                    ) : (
                      <div
                        key={ff.key}
                        className="flex items-center gap-3 p-3 bg-gray-50 border border-dashed border-gray-300 rounded-lg"
                      >
                        <span className="text-2xl opacity-30">📄</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-400">
                            {ff.label}
                          </p>
                          <p className="text-xs text-gray-400">
                            Belum diupload
                          </p>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                          Kosong
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end flex-shrink-0">
              <button
                onClick={() => setSelected(null)}
                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium shadow-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL EDIT ════════════════════════════════════════════════════════ */}
      {editing && (
        <div
          style={modalOverlay}
          onClick={() => {
            if (editStatus !== "loading") setEditing(null);
          }}
        >
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                background: "linear-gradient(to right,#f59e0b,#f97316)",
              }}
              className="px-6 py-5 text-white flex items-start justify-between flex-shrink-0"
            >
              <div>
                <p className="text-amber-100 text-xs uppercase tracking-widest mb-1">
                  Edit Data
                </p>
                <h2 className="text-xl font-bold">
                  {editing.data.namaLengkap || "—"}
                </h2>
              </div>
              <button
                onClick={() => {
                  if (editStatus !== "loading") setEditing(null);
                }}
                className="ml-4 w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-xl font-bold transition"
              >
                ×
              </button>
            </div>
            <div style={modalBody}>
              {[
                {
                  title: "Data Pribadi Siswa",
                  keys: [
                    "namaLengkap",
                    "namaPanggilan",
                    "jenisKelamin",
                    "nomorKK",
                    "tempatLahir",
                    "tanggalLahir",
                    "noRegAktaLahir",
                    "agama",
                    "kewarganegaraan",
                    "anakKeBerapa",
                    "anakKeDari",
                    "statusDalamKeluarga",
                    "siswaTinggalBersama",
                    "tempatTinggal",
                    "transportasi",
                  ],
                },
                {
                  title: "Kelas & Rombel",
                  keys: ["kelas", "rombel"],
                },
                {
                  title: "Identitas Siswa",
                  keys: ["nisn", "nis", "nik", "tahunLulus"],
                },
                {
                  title: "Alamat Siswa",
                  keys: [
                    "jalan",
                    "rt",
                    "rw",
                    "kelurahanDesa",
                    "kecamatan",
                    "kotaKabupaten",
                    "propinsi",
                    "kodePos",
                  ],
                },
                {
                  title: "Data Ayah",
                  keys: [
                    "namaAyah",
                    "tempatLahirAyah",
                    "agamaAyah",
                    "kewarganegaraanAyah",
                    "pendidikanAyah",
                    "pekerjaanAyah",
                    "penghasilanAyah",
                    "alamatKantorAyah",
                    "alamatRumahAyah",
                  ],
                },
                {
                  title: "Data Ibu",
                  keys: [
                    "namaIbu",
                    "tempatLahirIbu",
                    "agamaIbu",
                    "kewarganegaraanIbu",
                    "bahasaIbu",
                    "pendidikanIbu",
                    "pekerjaanIbu",
                    "penghasilanIbu",
                    "alamatRumahIbu",
                  ],
                },
                {
                  title: "Data Wali",
                  keys: [
                    "namaWali",
                    "tempatLahirWali",
                    "agamaWali",
                    "kewarganegaraanWali",
                    "bahasaWali",
                    "pekerjaanWali",
                    "alamatKantorWali",
                    "alamatRumahWali",
                  ],
                },
                {
                  title: "Data Fisik",
                  keys: [
                    "tinggiBadan",
                    "beratBadan",
                    "lingkarKepala",
                    "jarakSekolahKm",
                    "jarakSekolahJam",
                  ],
                },
                {
                  title: "Data Kesejahteraan",
                  keys: ["jenisKesejahteraan", "nomorKartu", "namaDiKartu"],
                },
              ].map((sec) => (
                <div key={sec.title} className="mb-5">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-3 pb-1 border-b border-blue-100">
                    {sec.title}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {sec.keys.map((k) => {
                      const col = COLUMNS.find((c) => c.key === k);
                      if (!col) return null;
                      if (k === "kelas")
                        return (
                          <div key={k}>
                            <label className="block text-xs text-gray-500 mb-1">
                              Kelas
                              <span className="ml-1 text-orange-400 font-normal">
                                (otomatis — tidak dapat diubah)
                              </span>
                            </label>
                            <input
                              type="text"
                              value={editForm.kelas || ""}
                              disabled
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-100 text-gray-400 cursor-not-allowed"
                            />
                          </div>
                        );
                      if (k === "jenisKelamin")
                        return (
                          <div key={k}>
                            <label className="block text-xs text-gray-500 mb-1">
                              Jenis Kelamin
                            </label>
                            <select
                              name="jenisKelamin"
                              value={editForm.jenisKelamin || ""}
                              onChange={handleEditChange}
                              className={INPUT_EDIT_CLASS}
                            >
                              <option value="">-- Pilih --</option>
                              <option value="Laki-laki">Laki-laki</option>
                              <option value="Perempuan">Perempuan</option>
                            </select>
                          </div>
                        );
                      if (k === "tanggalLahir")
                        return (
                          <EF
                            key={k}
                            name={k}
                            label={col.label}
                            type="date"
                            value={editForm[k] || ""}
                            onChange={handleEditChange}
                          />
                        );
                      return (
                        <EF
                          key={k}
                          name={k}
                          label={col.label}
                          value={editForm[k] || ""}
                          onChange={handleEditChange}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Edit Dokumen */}
              <div className="mb-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-3 pb-1 border-b border-blue-100">
                  Dokumen Terlampir
                </h3>
                <p className="text-xs text-gray-400 mb-3">
                  Pilih file baru untuk mengganti dokumen yang sudah ada.
                  Biarkan kosong jika tidak ingin mengubah.
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {FILE_FIELDS.map((ff) => (
                    <FileUploadField
                      key={ff.key}
                      fieldKey={ff.key}
                      label={ff.label}
                      file={editFiles[ff.key]}
                      existingUrl={editing.data[ff.key]}
                      onChange={handleEditFileChange}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between flex-shrink-0">
              <div className="text-sm">
                {editStatus === "loading" && (
                  <span className="text-amber-600 font-medium">
                    Menyimpan...
                  </span>
                )}
                {editStatus === "success" && (
                  <span className="text-green-600 font-medium">
                    ✓ Data berhasil diperbarui!
                  </span>
                )}
                {editStatus === "error" && (
                  <span className="text-red-600 font-medium">
                    Gagal menyimpan. Coba lagi.
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (editStatus !== "loading") setEditing(null);
                  }}
                  className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                >
                  Batal
                </button>
                <button
                  onClick={handleEditSubmit}
                  disabled={editStatus === "loading"}
                  style={{ background: "#f59e0b" }}
                  className="px-5 py-2 text-white rounded-lg transition text-sm font-semibold shadow-sm disabled:opacity-60"
                >
                  {editStatus === "loading"
                    ? "Menyimpan..."
                    : "Simpan Perubahan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL HAPUS ═══════════════════════════════════════════════════════ */}
      {deleteTarget && (
        <div
          style={modalOverlay}
          onClick={() => {
            if (deleteStatus !== "loading") setDeleteTarget(null);
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
              width: "100%",
              maxWidth: 440,
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                background: "linear-gradient(to right,#ef4444,#e11d48)",
              }}
              className="px-6 py-5 text-white"
            >
              <h2 className="text-lg font-bold">Konfirmasi Hapus</h2>
              <p className="text-red-100 text-sm mt-0.5">
                Tindakan ini tidak dapat dibatalkan
              </p>
            </div>
            <div className="p-6">
              <p className="text-gray-700 text-sm mb-2">
                Anda yakin ingin menghapus data peserta didik:
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
                <p className="font-bold text-red-800">
                  {deleteTarget.data.namaLengkap || "—"}
                </p>
                <p className="text-red-600 text-sm">
                  {deleteTarget.data.tempatLahir} · {deleteTarget.data.nomorKK}
                </p>
              </div>
              {deleteStatus === "error" && (
                <p className="text-red-600 text-sm mb-3">
                  Gagal menghapus data. Coba lagi.
                </p>
              )}
              {deleteStatus === "success" && (
                <p className="text-green-600 text-sm mb-3">
                  ✓ Data berhasil dihapus.
                </p>
              )}
            </div>
            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button
                onClick={() => {
                  if (deleteStatus !== "loading") setDeleteTarget(null);
                }}
                className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={
                  deleteStatus === "loading" || deleteStatus === "success"
                }
                style={{ background: "#ef4444" }}
                className="px-5 py-2 text-white rounded-lg transition text-sm font-semibold shadow-sm disabled:opacity-60"
              >
                {deleteStatus === "loading" ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HALAMAN INPUT NILAI ──────────────────────────────────────────────────────
const MATA_PELAJARAN = [
  {
    kelas: 1,
    s1: [
      { key: "pai1s1", label: "PAI" },
      { key: "ppkn1s1", label: "PPKn" },
      { key: "bind1s1", label: "B. Indonesia" },
      { key: "mat1s1", label: "Matematika" },
      { key: "ipas1s1", label: "IPAS" },
      { key: "sbdp1s1", label: "SBdP" },
      { key: "pjok1s1", label: "PJOK" },
      { key: "bing1s1", label: "B. Inggris" },
      { key: "bdaerah1s1", label: "B. Daerah" },
    ],
    s2: [
      { key: "pai1s2", label: "PAI" },
      { key: "ppkn1s2", label: "PPKn" },
      { key: "bind1s2", label: "B. Indonesia" },
      { key: "mat1s2", label: "Matematika" },
      { key: "ipas1s2", label: "IPAS" },
      { key: "sbdp1s2", label: "SBdP" },
      { key: "pjok1s2", label: "PJOK" },
      { key: "bing1s2", label: "B. Inggris" },
      { key: "bdaerah1s2", label: "B. Daerah" },
    ],
  },
  {
    kelas: 2,
    s1: [
      { key: "pai2s1", label: "PAI" },
      { key: "ppkn2s1", label: "PPKn" },
      { key: "bind2s1", label: "B. Indonesia" },
      { key: "mat2s1", label: "Matematika" },
      { key: "ipas2s1", label: "IPAS" },
      { key: "sbdp2s1", label: "SBdP" },
      { key: "pjok2s1", label: "PJOK" },
      { key: "bing2s1", label: "B. Inggris" },
      { key: "bdaerah2s1", label: "B. Daerah" },
    ],
    s2: [
      { key: "pai2s2", label: "PAI" },
      { key: "ppkn2s2", label: "PPKn" },
      { key: "bind2s2", label: "B. Indonesia" },
      { key: "mat2s2", label: "Matematika" },
      { key: "ipas2s2", label: "IPAS" },
      { key: "sbdp2s2", label: "SBdP" },
      { key: "pjok2s2", label: "PJOK" },
      { key: "bing2s2", label: "B. Inggris" },
      { key: "bdaerah2s2", label: "B. Daerah" },
    ],
  },
  {
    kelas: 3,
    s1: [
      { key: "pai3s1", label: "PAI" },
      { key: "ppkn3s1", label: "PPKn" },
      { key: "bind3s1", label: "B. Indonesia" },
      { key: "mat3s1", label: "Matematika" },
      { key: "ipas3s1", label: "IPAS" },
      { key: "sbdp3s1", label: "SBdP" },
      { key: "pjok3s1", label: "PJOK" },
      { key: "bing3s1", label: "B. Inggris" },
      { key: "bdaerah3s1", label: "B. Daerah" },
    ],
    s2: [
      { key: "pai3s2", label: "PAI" },
      { key: "ppkn3s2", label: "PPKn" },
      { key: "bind3s2", label: "B. Indonesia" },
      { key: "mat3s2", label: "Matematika" },
      { key: "ipas3s2", label: "IPAS" },
      { key: "sbdp3s2", label: "SBdP" },
      { key: "pjok3s2", label: "PJOK" },
      { key: "bing3s2", label: "B. Inggris" },
      { key: "bdaerah3s2", label: "B. Daerah" },
    ],
  },
  {
    kelas: 4,
    s1: [
      { key: "pai4s1", label: "PAI" },
      { key: "ppkn4s1", label: "PPKn" },
      { key: "bind4s1", label: "B. Indonesia" },
      { key: "mat4s1", label: "Matematika" },
      { key: "ipas4s1", label: "IPAS" },
      { key: "sbdp4s1", label: "SBdP" },
      { key: "pjok4s1", label: "PJOK" },
      { key: "bing4s1", label: "B. Inggris" },
      { key: "bdaerah4s1", label: "B. Daerah" },
    ],
    s2: [
      { key: "pai4s2", label: "PAI" },
      { key: "ppkn4s2", label: "PPKn" },
      { key: "bind4s2", label: "B. Indonesia" },
      { key: "mat4s2", label: "Matematika" },
      { key: "ipas4s2", label: "IPAS" },
      { key: "sbdp4s2", label: "SBdP" },
      { key: "pjok4s2", label: "PJOK" },
      { key: "bing4s2", label: "B. Inggris" },
      { key: "bdaerah4s2", label: "B. Daerah" },
    ],
  },
  {
    kelas: 5,
    s1: [
      { key: "pai5s1", label: "PAI" },
      { key: "ppkn5s1", label: "PPKn" },
      { key: "bind5s1", label: "B. Indonesia" },
      { key: "mat5s1", label: "Matematika" },
      { key: "ipas5s1", label: "IPAS" },
      { key: "sbdp5s1", label: "SBdP" },
      { key: "pjok5s1", label: "PJOK" },
      { key: "bing5s1", label: "B. Inggris" },
      { key: "bdaerah5s1", label: "B. Daerah" },
    ],
    s2: [
      { key: "pai5s2", label: "PAI" },
      { key: "ppkn5s2", label: "PPKn" },
      { key: "bind5s2", label: "B. Indonesia" },
      { key: "mat5s2", label: "Matematika" },
      { key: "ipas5s2", label: "IPAS" },
      { key: "sbdp5s2", label: "SBdP" },
      { key: "pjok5s2", label: "PJOK" },
      { key: "bing5s2", label: "B. Inggris" },
      { key: "bdaerah5s2", label: "B. Daerah" },
    ],
  },
  {
    kelas: 6,
    s1: [
      { key: "pai6s1", label: "PAI" },
      { key: "ppkn6s1", label: "PPKn" },
      { key: "bind6s1", label: "B. Indonesia" },
      { key: "mat6s1", label: "Matematika" },
      { key: "ipas6s1", label: "IPAS" },
      { key: "sbdp6s1", label: "SBdP" },
      { key: "pjok6s1", label: "PJOK" },
      { key: "bing6s1", label: "B. Inggris" },
      { key: "bdaerah6s1", label: "B. Daerah" },
    ],
    s2: [
      { key: "pai6s2", label: "PAI" },
      { key: "ppkn6s2", label: "PPKn" },
      { key: "bind6s2", label: "B. Indonesia" },
      { key: "mat6s2", label: "Matematika" },
      { key: "ipas6s2", label: "IPAS" },
      { key: "sbdp6s2", label: "SBdP" },
      { key: "pjok6s2", label: "PJOK" },
      { key: "bing6s2", label: "B. Inggris" },
      { key: "bdaerah6s2", label: "B. Daerah" },
    ],
  },
];

// Semua key nilai untuk keperluan update
const ALL_NILAI_KEYS = [
  "pai1s1",
  "ppkn1s1",
  "bind1s1",
  "mat1s1",
  "ipas1s1",
  "sbdp1s1",
  "pjok1s1",
  "bing1s1",
  "bdaerah1s1",
  "pai2s1",
  "ppkn2s1",
  "bind2s1",
  "mat2s1",
  "ipas2s1",
  "sbdp2s1",
  "pjok2s1",
  "bing2s1",
  "bdaerah2s1",
  "pai3s1",
  "ppkn3s1",
  "bind3s1",
  "mat3s1",
  "ipas3s1",
  "sbdp3s1",
  "pjok3s1",
  "bing3s1",
  "bdaerah3s1",
  "pai4s1",
  "ppkn4s1",
  "bind4s1",
  "mat4s1",
  "ipas4s1",
  "sbdp4s1",
  "pjok4s1",
  "bing4s1",
  "bdaerah4s1",
  "pai5s1",
  "ppkn5s1",
  "bind5s1",
  "mat5s1",
  "ipas5s1",
  "sbdp5s1",
  "pjok5s1",
  "bing5s1",
  "bdaerah5s1",
  "pai6s1",
  "ppkn6s1",
  "bind6s1",
  "mat6s1",
  "ipas6s1",
  "sbdp6s1",
  "pjok6s1",
  "bing6s1",
  "bdaerah6s1",
  "pai1s2",
  "ppkn1s2",
  "bind1s2",
  "mat1s2",
  "ipas1s2",
  "sbdp1s2",
  "pjok1s2",
  "bing1s2",
  "bdaerah1s2",
  "pai2s2",
  "ppkn2s2",
  "bind2s2",
  "mat2s2",
  "ipas2s2",
  "sbdp2s2",
  "pjok2s2",
  "bing2s2",
  "bdaerah2s2",
  "pai3s2",
  "ppkn3s2",
  "bind3s2",
  "mat3s2",
  "ipas3s2",
  "sbdp3s2",
  "pjok3s2",
  "bing3s2",
  "bdaerah3s2",
  "pai4s2",
  "ppkn4s2",
  "bind4s2",
  "mat4s2",
  "ipas4s2",
  "sbdp4s2",
  "pjok4s2",
  "bing4s2",
  "bdaerah4s2",
  "pai5s2",
  "ppkn5s2",
  "bind5s2",
  "mat5s2",
  "ipas5s2",
  "sbdp5s2",
  "pjok5s2",
  "bing5s2",
  "bdaerah5s2",
  "pai6s2",
  "ppkn6s2",
  "bind6s2",
  "mat6s2",
  "ipas6s2",
  "sbdp6s2",
  "pjok6s2",
  "bing6s2",
  "bdaerah6s2",
];

function PageNilai({
  initKelas = "",
  initRombel = "",
  lockedFilter = false,
}: {
  initKelas?: string;
  initRombel?: string;
  lockedFilter?: boolean;
}) {
  const [students, setStudents] = useState<Record<string, string>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterKelas, setFilterKelas] = useState<string>(initKelas);
  const [filterRombel, setFilterRombel] = useState<string>(initRombel);
  const [selected, setSelected] = useState<Record<string, string> | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [nilaiForm, setNilaiForm] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [viewNilai, setViewNilai] = useState<Record<string, string> | null>(
    null
  );
  const [semester, setSemester] = useState<"s1" | "s2">("s1");
  const importFileRef = useRef<HTMLInputElement>(null);
  const [importModal, setImportModal] = useState(false);
  const [importStatus, setImportStatus] = useState<
    "idle" | "parsing" | "preview" | "saving" | "done" | "error"
  >("idle");
  const [importSemester, setImportSemester] = useState<"s1" | "s2">("s1");
  const [importKelas, setImportKelas] = useState("1"); // kelas siswa (untuk match nama)
  const [importRombel, setImportRombel] = useState(""); // rombel siswa (untuk match nama)
  const [importNilaiKelas, setImportNilaiKelas] = useState("1"); // kelas target kolom nilai
  const [importRows, setImportRows] = useState<
    {
      nama: string;
      nilai: Record<string, string>;
      matched: string;
      matchedIndex: number;
    }[]
  >([]);
  const [importMsg, setImportMsg] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${SCRIPT_URL}?action=getData`);
      if (!res.ok) throw new Error("Gagal mengambil data.");
      const json = await res.json();
      if (json.data && json.data.length > 1) {
        const rows = json.data.slice(1).map((row: string[]) => {
          const obj: Record<string, string> = {};
          COLUMNS.forEach((col, i) => {
            obj[col.key] = row[i] ?? "";
          });
          return obj;
        });
        setStudents(rows);
      } else {
        setStudents([]);
      }
    } catch (e: any) {
      setError(e.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Load SheetJS dari CDN
  useEffect(() => {
    if (!(window as any).XLSX) {
      const s = document.createElement("script");
      s.src =
        "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      document.head.appendChild(s);
    }
  }, []);

  const filtered = students.filter((s) => {
    const matchSearch = [s.namaLengkap, s.nisn, s.nis]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());
    const kelasNorm = String(s.kelas || "").trim();
    const matchKelas = filterKelas
      ? kelasNorm === String(filterKelas).trim()
      : true;
    const rombelNorm = String(s.rombel || "")
      .trim()
      .toUpperCase();
    const matchRombel = filterRombel
      ? rombelNorm === filterRombel.toUpperCase()
      : true;
    return matchSearch && matchKelas && matchRombel;
  });

  const openNilai = (s: Record<string, string>, idx: number) => {
    setSelected(s);
    setSelectedIndex(idx);
    // Ambil nilai yang sudah ada
    const initial: Record<string, string> = {};
    ALL_NILAI_KEYS.forEach((k) => {
      initial[k] = s[k] || "";
    });
    setNilaiForm(initial);
    setSaveStatus("idle");
    setSemester("s1");
  };

  const handleNilaiChange = (key: string, val: string) => {
    // Hanya angka 0-100
    const num = val.replace(/[^0-9]/g, "");
    const clamped = num === "" ? "" : String(Math.min(100, parseInt(num)));
    setNilaiForm((prev) => ({ ...prev, [key]: clamped }));
  };

  const handleSaveNilai = async () => {
    if (!selected) return;
    setSaveStatus("loading");
    try {
      // Gabungkan data siswa + nilai baru
      const updatedData = { ...selected, ...nilaiForm };
      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateRow",
          rowIndex: selectedIndex + 2,
          data: updatedData,
          files: {
            fotokopiAktaLahir: null,
            fotokopiKK: null,
            fotokopiSktbTk: null,
            fotoSiswa: null,
          },
        }),
      });
      if (response.ok || response.type === "opaque") {
        setSaveStatus("success");
        // Update local state
        setStudents((prev) =>
          prev.map((s, i) => (i === selectedIndex ? { ...s, ...nilaiForm } : s))
        );
        setTimeout(() => {
          setSelected(null);
          setSaveStatus("idle");
        }, 2000);
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    }
  };

  // ── IMPORT EXCEL ──
  const MAPEL_ORDER = [
    "pai",
    "ppkn",
    "bind",
    "mat",
    "ipas",
    "sbdp",
    "pjok",
    "bing",
    "bdaerah",
  ];
  const MAPEL_ALIASES: Record<string, string> = {
    "pendidikan agama islam": "pai",
    pai: "pai",
    "pendidikan pancasila": "ppkn",
    ppkn: "ppkn",
    pkn: "ppkn",
    "bahasa indonesia": "bind",
    "b. indonesia": "bind",
    "b.indonesia": "bind",
    matematika: "mat",
    math: "mat",
    "ilmu pengetahuan alam dan sosial": "ipas",
    ipas: "ipas",
    ipa: "ipas",
    "seni musik": "sbdp",
    "seni budaya": "sbdp",
    sbdp: "sbdp",
    seni: "sbdp",
    "pendidikan jasmani, olahraga dan kesehatan": "pjok",
    "pendidikan jasmani": "pjok",
    pjok: "pjok",
    penjas: "pjok",
    "bahasa inggris": "bing",
    "b. inggris": "bing",
    "b.inggris": "bing",
    inggris: "bing",
    "bahasa daerah makassar": "bdaerah",
    "bahasa daerah": "bdaerah",
    "b. daerah": "bdaerah",
    "b.daerah": "bdaerah",
    bdaerah: "bdaerah",
  };
  const normStr = (s: string) =>
    String(s || "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");

  const matchNamaSiswa = (
    excelNama: string,
    dbList: Record<string, string>[]
  ): { matched: string; idx: number } => {
    const norm = normStr(excelNama);
    // 1. Exact match (case-insensitive)
    for (let i = 0; i < dbList.length; i++) {
      if (normStr(dbList[i].namaLengkap) === norm)
        return { matched: dbList[i].namaLengkap, idx: i };
    }
    // 2. Nama Excel persis sama dengan nama di DB (hanya beda urutan karena Excel mungkin singkat)
    // Syarat minimal 5 karakter agar tidak false positive dari kata pendek seperti "NUR"
    if (norm.length >= 5) {
      for (let i = 0; i < dbList.length; i++) {
        const db = normStr(dbList[i].namaLengkap);
        // Nama Excel ada sebagai kata penuh di awal/akhir/tengah nama DB
        if (db.startsWith(norm + " ") || db.endsWith(" " + norm) || db === norm)
          return { matched: dbList[i].namaLengkap, idx: i };
        // Nama DB ada sebagai kata penuh di nama Excel (DB lebih pendek)
        if (
          db.length >= 5 &&
          (norm.startsWith(db + " ") || norm.endsWith(" " + db))
        )
          return { matched: dbList[i].namaLengkap, idx: i };
      }
    }
    return { matched: "", idx: -1 };
  };

  const handleImportFile = async (file: File) => {
    setImportStatus("parsing");
    setImportMsg("Membaca file Excel...");
    try {
      const XLSX = (window as any).XLSX;
      if (!XLSX)
        throw new Error(
          "Library SheetJS belum siap, tunggu beberapa detik lalu coba lagi."
        );
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: "array" });

      // Ambil sheet pertama saja
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json: any[][] = XLSX.utils.sheet_to_json(ws, {
        header: 1,
        defval: null,
      });
      if (json.length < 2) throw new Error("Sheet kosong atau tidak ada data.");

      // Cari baris header (mengandung "nama")
      let headerRowIdx = 0;
      for (let r = 0; r < Math.min(5, json.length); r++) {
        if (
          json[r].some((c: any) => normStr(String(c || "")).includes("nama"))
        ) {
          headerRowIdx = r;
          break;
        }
      }
      const headers = json[headerRowIdx].map((h: any) =>
        normStr(String(h || ""))
      );
      const namaColIdx = headers.findIndex((h: string) => h.includes("nama"));
      if (namaColIdx < 0)
        throw new Error("Kolom 'Nama Siswa' tidak ditemukan di header.");

      // Map kolom Excel → prefix mapel
      const colToPrefix: Record<number, string> = {};
      headers.forEach((h: string, ci: number) => {
        if (ci === namaColIdx) return;
        // Cari match terpanjang
        let found = "";
        let foundLen = 0;
        const aliasKeys = Object.keys(MAPEL_ALIASES) as string[];
        aliasKeys.forEach((alias: string) => {
          const prefix: string = MAPEL_ALIASES[alias];
          if (
            (h.includes(alias) || alias.includes(h)) &&
            alias.length > foundLen
          ) {
            found = prefix;
            foundLen = alias.length;
          }
        });
        if (found) colToPrefix[ci] = found;
      });

      if ((Object.keys(colToPrefix) as string[]).length === 0)
        throw new Error("Tidak ada kolom mapel yang dikenali.");

      // Filter students sesuai kelas yang dipilih di import
      const kelasFilter = importKelas;
      const rombelFilter = importRombel;
      const studentsForKelas = students.filter(
        (s) =>
          String(s.kelas || "").trim() === kelasFilter &&
          (rombelFilter === "" ||
            String(s.rombel || "")
              .trim()
              .toUpperCase() === rombelFilter.toUpperCase())
      );

      // Parse data rows
      const rows: typeof importRows = [];
      for (let r = headerRowIdx + 1; r < json.length; r++) {
        const row = json[r];
        const namaRaw = String(row[namaColIdx] || "").trim();
        if (!namaRaw) continue;

        const nilai: Record<string, string> = {};
        (Object.keys(colToPrefix) as string[]).forEach((ci: string) => {
          const prefix: string = colToPrefix[parseInt(ci)];
          const val = row[parseInt(ci)];
          if (val !== null && val !== undefined && val !== "") {
            const num = Math.round(parseFloat(String(val)));
            if (!isNaN(num) && num >= 0 && num <= 100)
              nilai[prefix] = String(num);
          }
        });
        if ((Object.keys(nilai) as string[]).length === 0) continue;

        // Match ke siswa di kelas yang dipilih
        const m = matchNamaSiswa(namaRaw, studentsForKelas);
        // Terjemahkan index kelas-lokal ke index global students
        const globalIdx =
          m.idx >= 0 ? students.indexOf(studentsForKelas[m.idx]) : -1;
        rows.push({
          nama: namaRaw,
          nilai,
          matched: m.matched,
          matchedIndex: globalIdx,
        });
      }

      if (rows.length === 0)
        throw new Error("Tidak ada baris data nilai yang berhasil dibaca.");
      setImportRows(rows);
      setImportStatus("preview");
      setImportMsg(
        `${rows.length} siswa terbaca dari Excel · Siswa Kelas ${kelasFilter}${
          rombelFilter ? " Rombel " + rombelFilter : ""
        } → Nilai disimpan ke Kelas ${importNilaiKelas} · ${
          importSemester === "s1" ? "Semester 1" : "Semester 2"
        }`
      );
    } catch (err: any) {
      setImportStatus("error");
      setImportMsg(err.message || "Gagal membaca file.");
    }
  };

  const handleImportSave = async () => {
    setImportStatus("saving");
    setImportMsg("Sedang menyiapkan data...");

    const sem = importSemester;
    const k = lockedFilter ? importKelas : importNilaiKelas;
    const updatedStudents = [...students];

    // Bangun array updates untuk semua siswa yang cocok
    const updates: { rowIndex: number; data: Record<string, string> }[] = [];

    for (const row of importRows) {
      if (row.matchedIndex < 0) continue;

      const s = updatedStudents[row.matchedIndex];
      const nilaiUpdate: Record<string, string> = {};
      (Object.keys(row.nilai) as string[]).forEach((prefix: string) => {
        nilaiUpdate[`${prefix}${k}${sem}`] = row.nilai[prefix];
      });
      const updatedData = { ...s, ...nilaiUpdate };
      updatedStudents[row.matchedIndex] = updatedData;
      updates.push({
        rowIndex: row.matchedIndex + 2,
        data: updatedData,
      });
    }

    const failed = importRows.filter((r) => r.matchedIndex < 0).length;
    const total = updates.length;

    if (total === 0) {
      setImportStatus("done");
      setImportMsg("Tidak ada data yang cocok untuk disimpan.");
      return;
    }

    setImportMsg(`Sedang mengimport data nilai siswa... (${total} siswa)`);

    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateBatchNilai",
          updates,
        }),
      });

      setStudents(updatedStudents);
      setImportStatus("done");
      setImportMsg(
        `✓ ${total} siswa berhasil diupdate${
          failed > 0 ? `, ${failed} tidak cocok` : ""
        }.`
      );
    } catch {
      setImportStatus("error");
      setImportMsg("Gagal mengirim data. Silakan coba lagi.");
    }
  };

  // activeKelas selalu mengikuti kelas asli siswa, tidak berubah saat navigasi
  const activeKelas = selected
    ? MATA_PELAJARAN.find(
        (m) => m.kelas === parseInt(String(selected.kelas || "1").trim())
      ) || MATA_PELAJARAN[0]
    : null;
  const activeMapel = activeKelas
    ? semester === "s1"
      ? activeKelas.s1
      : activeKelas.s2
    : [];

  const kelasColorStyle: Record<string, { background: string; color: string }> =
    {
      "1": { background: "#dbeafe", color: "#1d4ed8" },
      "2": { background: "#dcfce7", color: "#15803d" },
      "3": { background: "#fef9c3", color: "#a16207" },
      "4": { background: "#ffedd5", color: "#c2410c" },
      "5": { background: "#f3e8ff", color: "#7e22ce" },
      "6": { background: "#fee2e2", color: "#b91c1c" },
    };
  const defaultKelasStyle = { background: "#f3f4f6", color: "#6b7280" };

  const getNilaiColor = (val: string) => {
    const n = parseInt(val);
    if (!val || isNaN(n)) return "bg-gray-50 text-gray-400";
    if (n >= 85) return "bg-green-50 text-green-700 border-green-200";
    if (n >= 70) return "bg-blue-50 text-blue-700 border-blue-200";
    if (n >= 60) return "bg-yellow-50 text-yellow-700 border-yellow-200";
    return "bg-red-50 text-red-700 border-red-200";
  };

  return (
    <div className="p-6 md:p-8">
      {/* ── TOOLBAR ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative w-full sm:w-72">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Cari nama, NISN, NIS..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <select
            value={filterKelas}
            onChange={(e) => !lockedFilter && setFilterKelas(e.target.value)}
            disabled={lockedFilter}
            className={`px-3 py-2.5 border rounded-lg text-sm focus:outline-none bg-white ${
              lockedFilter
                ? "border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50"
                : "border-gray-300 focus:ring-2 focus:ring-blue-400"
            }`}
          >
            <option value="">Semua Kelas</option>
            {[1, 2, 3, 4, 5, 6].map((k) => (
              <option key={k} value={String(k)}>
                Kelas {k}
              </option>
            ))}
          </select>
          <select
            value={filterRombel}
            onChange={(e) => !lockedFilter && setFilterRombel(e.target.value)}
            disabled={lockedFilter}
            className={`px-3 py-2.5 border rounded-lg text-sm focus:outline-none bg-white ${
              lockedFilter
                ? "border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50"
                : "border-gray-300 focus:ring-2 focus:ring-blue-400"
            }`}
          >
            <option value="">Semua Rombel</option>
            <option value="A">Rombel A</option>
            <option value="B">Rombel B</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setImportKelas(filterKelas || "1");
              setImportRombel(filterRombel || "");
              setImportNilaiKelas(filterKelas || "1");
              setImportModal(true);
              setImportStatus("idle");
              setImportRows([]);
              setImportMsg("");
            }}
            style={{ background: "#7c3aed" }}
            className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-lg transition whitespace-nowrap"
          >
            📥 Import Excel
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            style={{ background: "#2563eb" }}
            className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 whitespace-nowrap"
          >
            ↻ {loading ? "Memuat..." : "Refresh Data"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          ⚠️ {error}
        </div>
      )}

      {loading && students.length === 0 && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-12 bg-gray-100 rounded-lg animate-pulse"
            />
          ))}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📊</div>
          <p className="font-medium">
            {students.length === 0
              ? "Belum ada data peserta didik."
              : "Tidak ada hasil pencarian."}
          </p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr
                style={{
                  background: "linear-gradient(to right,#059669,#0d9488)",
                }}
                className="text-white"
              >
                <th className="px-4 py-3 text-left font-semibold">No</th>
                <th className="px-4 py-3 text-left font-semibold">
                  Nama Lengkap
                </th>
                <th className="px-4 py-3 text-left font-semibold">NISN</th>
                <th className="px-4 py-3 text-left font-semibold">Kelas</th>
                <th className="px-4 py-3 text-left font-semibold">Rombel</th>
                <th className="px-4 py-3 text-left font-semibold">
                  Progress Nilai
                </th>
                <th className="px-4 py-3 text-left font-semibold">
                  Rekap Nilai
                </th>
                <th className="px-4 py-3 text-left font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const realIndex = students.indexOf(s);
                const kelasNum = parseInt(String(s.kelas || "1").trim());
                const mpKelas = MATA_PELAJARAN.find(
                  (m) => m.kelas === kelasNum
                );
                const allMapelForKelas = [
                  ...(mpKelas?.s1 || []),
                  ...(mpKelas?.s2 || []),
                ];
                const filledCount = allMapelForKelas.filter(
                  (m) => s[m.key]
                ).length;
                const totalMapel = allMapelForKelas.length;
                const pct =
                  totalMapel > 0
                    ? Math.round((filledCount / totalMapel) * 100)
                    : 0;
                return (
                  <tr
                    key={i}
                    className={`${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-emerald-50 transition`}
                  >
                    <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {s.namaLengkap || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                      {s.nisn || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        style={
                          kelasColorStyle[String(s.kelas).trim()] ||
                          defaultKelasStyle
                        }
                        className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      >
                        {s.kelas ? `Kelas ${s.kelas}` : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {s.rombel || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="flex-1 bg-gray-200 rounded-full h-2"
                          style={{ minWidth: 80 }}
                        >
                          <div
                            className={`h-2 rounded-full transition-all ${
                              pct === 100
                                ? "bg-green-500"
                                : pct > 0
                                ? "bg-blue-500"
                                : "bg-gray-300"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {filledCount}/{totalMapel} (S1+S2)
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setViewNilai(s)}
                        style={{ background: "#6366f1" }}
                        className="px-3 py-1.5 text-white text-xs font-semibold rounded-lg transition shadow-sm"
                      >
                        Lihat Nilai
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openNilai(s, realIndex)}
                        style={{ background: "#059669" }}
                        className="px-3 py-1.5 text-white text-xs font-semibold rounded-lg transition shadow-sm"
                      >
                        Input Nilai
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-gray-400 text-right">
        Menampilkan {filtered.length} dari {students.length} data peserta didik
      </p>

      {/* ══ MODAL REKAP NILAI KELAS 1–6 ══════════════════════════════════════ */}
      {viewNilai && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.55)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setViewNilai(null)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
              width: "100%",
              maxWidth: 760,
              height: "88vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                background: "linear-gradient(to right,#4f46e5,#2563eb)",
              }}
              className="px-6 py-5 text-white flex items-start justify-between flex-shrink-0"
            >
              <div>
                <p className="text-indigo-200 text-xs uppercase tracking-widest mb-1">
                  Rekap Nilai Rapor
                </p>
                <h2 className="text-xl font-bold">
                  {viewNilai.namaLengkap || "—"}
                </h2>
                <div className="flex flex-wrap gap-3 mt-1 text-sm text-indigo-100">
                  {viewNilai.nisn && <span>NISN: {viewNilai.nisn}</span>}
                  {viewNilai.nis && <span>NIS: {viewNilai.nis}</span>}
                  {viewNilai.kelas && (
                    <span className="bg-white bg-opacity-20 px-2 py-0.5 rounded-full text-xs font-semibold">
                      Kelas {viewNilai.kelas}
                    </span>
                  )}
                  {viewNilai.rombel && <span>Rombel {viewNilai.rombel}</span>}
                </div>
              </div>
              <button
                onClick={() => setViewNilai(null)}
                className="ml-4 w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-xl font-bold transition"
              >
                ×
              </button>
            </div>

            {/* Body — tabel rekap per kelas */}
            <div
              style={{
                overflowY: "scroll",
                flexGrow: 1,
                flexShrink: 1,
                flexBasis: 0,
                minHeight: 0,
                padding: 24,
              }}
            >
              {MATA_PELAJARAN.map((mp) => {
                const kelasKey = String(mp.kelas);
                const bgHeaderMap: Record<string, string> = {
                  "1": "linear-gradient(to right,#3b82f6,#2563eb)",
                  "2": "linear-gradient(to right,#22c55e,#16a34a)",
                  "3": "linear-gradient(to right,#eab308,#ca8a04)",
                  "4": "linear-gradient(to right,#f97316,#ea580c)",
                  "5": "linear-gradient(to right,#a855f7,#9333ea)",
                  "6": "linear-gradient(to right,#ef4444,#dc2626)",
                };
                const bgStyle =
                  bgHeaderMap[kelasKey] ||
                  "linear-gradient(to right,#6b7280,#4b5563)";
                const hasAnyNilai = [...mp.s1, ...mp.s2].some(
                  (m) => viewNilai[m.key]
                );
                const avg = (() => {
                  const vals = [...mp.s1, ...mp.s2]
                    .map((m) => parseInt(viewNilai[m.key] || ""))
                    .filter((n) => !isNaN(n));
                  return vals.length > 0
                    ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
                    : null;
                })();
                return (
                  <div key={mp.kelas} className="mb-5">
                    {/* Kelas header */}
                    <div
                      style={{ background: bgStyle }}
                      className="flex items-center justify-between text-white px-4 py-2.5 rounded-t-xl"
                    >
                      <span className="font-bold text-sm">
                        Kelas {mp.kelas}
                      </span>
                      {avg !== null ? (
                        <span className="text-xs bg-white bg-opacity-20 px-2.5 py-1 rounded-full font-semibold">
                          Rata-rata: {avg}
                        </span>
                      ) : (
                        <span className="text-xs opacity-60">
                          Belum ada nilai
                        </span>
                      )}
                    </div>
                    {/* Tabel mapel */}
                    <div className="border border-t-0 border-gray-200 rounded-b-xl overflow-hidden">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 w-8">
                              No
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                              Mata Pelajaran
                            </th>
                            <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 w-20">
                              Sem 1
                            </th>
                            <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 w-20">
                              Sem 2
                            </th>
                            <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 w-28">
                              Predikat
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {mp.s1.map((m, idx) => {
                            const v1 = viewNilai[m.key] || "";
                            const v2 = viewNilai[mp.s2[idx].key] || "";
                            const n1 = parseInt(v1);
                            const n2 = parseInt(v2);
                            const avg =
                              isNaN(n1) && isNaN(n2)
                                ? NaN
                                : Math.round(
                                    [n1, n2]
                                      .filter((n) => !isNaN(n))
                                      .reduce((a, b) => a + b, 0) /
                                      [n1, n2].filter((n) => !isNaN(n)).length
                                  );
                            const predikat = isNaN(avg)
                              ? "—"
                              : avg >= 85
                              ? "Sangat Baik"
                              : avg >= 70
                              ? "Baik"
                              : avg >= 60
                              ? "Cukup"
                              : "Perlu Bimbingan";
                            const pc = isNaN(avg)
                              ? "text-gray-300"
                              : avg >= 85
                              ? "text-green-600"
                              : avg >= 70
                              ? "text-blue-600"
                              : avg >= 60
                              ? "text-yellow-600"
                              : "text-red-600";
                            const nc = (v: string) => {
                              const n = parseInt(v);
                              return !v || isNaN(n)
                                ? "text-gray-300"
                                : n >= 85
                                ? "text-green-700 font-bold"
                                : n >= 70
                                ? "text-blue-700 font-bold"
                                : n >= 60
                                ? "text-yellow-700 font-bold"
                                : "text-red-700 font-bold";
                            };
                            return (
                              <tr
                                key={m.key}
                                className={
                                  idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                                }
                              >
                                <td className="px-4 py-2 text-gray-400 text-xs">
                                  {idx + 1}
                                </td>
                                <td className="px-4 py-2 text-gray-700">
                                  {m.label}
                                </td>
                                <td
                                  className={`px-4 py-2 text-center text-base ${nc(
                                    v1
                                  )}`}
                                >
                                  {v1 || "—"}
                                </td>
                                <td
                                  className={`px-4 py-2 text-center text-base ${nc(
                                    v2
                                  )}`}
                                >
                                  {v2 || "—"}
                                </td>
                                <td
                                  className={`px-4 py-2 text-center text-xs font-semibold ${pc}`}
                                >
                                  {predikat}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end flex-shrink-0">
              <button
                onClick={() => setViewNilai(null)}
                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium shadow-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL INPUT NILAI ═══════════════════════════════════════════════════ */}
      {selected && activeKelas && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.55)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => {
            if (saveStatus !== "loading") setSelected(null);
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
              width: "100%",
              maxWidth: 700,
              height: "88vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                background: "linear-gradient(to right,#059669,#0d9488)",
              }}
              className="px-6 py-5 text-white flex items-start justify-between flex-shrink-0"
            >
              <div>
                <p className="text-emerald-100 text-xs uppercase tracking-widest mb-1">
                  Input Nilai Rapor
                </p>
                <h2 className="text-xl font-bold">
                  {selected.namaLengkap || "—"}
                </h2>
                <div className="flex gap-3 mt-1 text-sm text-emerald-100">
                  {selected.nisn && <span>NISN: {selected.nisn}</span>}
                  {selected.kelas && (
                    <span className="bg-white bg-opacity-20 px-2 py-0.5 rounded-full text-xs font-semibold">
                      Kelas {selected.kelas}
                    </span>
                  )}
                  {selected.rombel && <span>Rombel: {selected.rombel}</span>}
                </div>
              </div>
              <button
                onClick={() => {
                  if (saveStatus !== "loading") setSelected(null);
                }}
                className="ml-4 w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-xl font-bold transition"
              >
                ×
              </button>
            </div>

            {/* Label mapel kelas aktif */}
            <div className="flex items-center gap-3 px-6 py-3 bg-gray-50 border-b flex-shrink-0">
              <span className="text-xs text-gray-500">
                Menampilkan nilai untuk:
              </span>
              <span
                style={
                  kelasColorStyle[String(selected.kelas).trim()] ||
                  defaultKelasStyle
                }
                className="px-3 py-1 rounded-full text-xs font-bold"
              >
                Kelas {selected.kelas || "—"}
              </span>
              <span className="text-xs text-gray-400">
                ({activeMapel.filter((m) => nilaiForm[m.key]).length}/
                {activeMapel.length} mata pelajaran terisi)
              </span>
            </div>

            {/* Tab Semester */}
            <div className="flex border-b bg-white flex-shrink-0">
              {(["s1", "s2"] as const).map((sem) => (
                <button
                  key={sem}
                  onClick={() => setSemester(sem)}
                  style={
                    semester === sem
                      ? { borderBottom: "3px solid #059669", color: "#059669" }
                      : {
                          borderBottom: "3px solid transparent",
                          color: "#6b7280",
                        }
                  }
                  className="flex-1 py-3 text-sm font-semibold transition"
                >
                  {sem === "s1" ? "📘 Semester 1" : "📗 Semester 2"}
                </button>
              ))}
            </div>
            {/* Body nilai */}
            <div
              style={{
                overflowY: "scroll",
                flexGrow: 1,
                flexShrink: 1,
                flexBasis: 0,
                minHeight: 0,
                padding: 24,
              }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {activeMapel.map((mp) => {
                  const val = nilaiForm[mp.key] || "";
                  const colorClass = getNilaiColor(val);
                  return (
                    <div
                      key={mp.key}
                      className={`border rounded-xl p-4 ${colorClass} transition`}
                    >
                      <label className="block text-xs font-semibold mb-2 uppercase tracking-wide">
                        {mp.label}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={val}
                        onChange={(e) =>
                          handleNilaiChange(mp.key, e.target.value)
                        }
                        placeholder="0–100"
                        className={`w-full text-center text-2xl font-bold bg-transparent border-b-2 focus:outline-none py-1 ${
                          val ? "border-current" : "border-gray-300"
                        }`}
                      />
                      {val && (
                        <p className="text-center text-xs mt-1 opacity-70">
                          {parseInt(val) >= 85
                            ? "Sangat Baik"
                            : parseInt(val) >= 70
                            ? "Baik"
                            : parseInt(val) >= 60
                            ? "Cukup"
                            : "Perlu Bimbingan"}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between flex-shrink-0">
              <div className="text-sm">
                {saveStatus === "loading" && (
                  <span className="text-emerald-600 font-medium">
                    Menyimpan...
                  </span>
                )}
                {saveStatus === "success" && (
                  <span className="text-green-600 font-medium">
                    ✓ Nilai berhasil disimpan!
                  </span>
                )}
                {saveStatus === "error" && (
                  <span className="text-red-600 font-medium">
                    Gagal menyimpan. Coba lagi.
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (saveStatus !== "loading") setSelected(null);
                  }}
                  className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                >
                  Tutup
                </button>
                <button
                  onClick={handleSaveNilai}
                  disabled={saveStatus === "loading"}
                  style={{ background: "#059669" }}
                  className="px-5 py-2 text-white rounded-lg transition text-sm font-semibold shadow-sm disabled:opacity-60"
                >
                  {saveStatus === "loading"
                    ? "Menyimpan..."
                    : "💾 Simpan Nilai"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ══ MODAL IMPORT EXCEL ══════════════════════════════════════════════════ */}
      {importModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(2px)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => importStatus !== "saving" && setImportModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
              width: "100%",
              maxWidth: 920,
              maxHeight: "88vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                background: "linear-gradient(to right,#7c3aed,#4f46e5)",
              }}
              className="px-6 py-4 text-white flex items-center justify-between flex-shrink-0"
            >
              <div>
                <p className="text-purple-200 text-xs uppercase tracking-widest mb-0.5">
                  Import Nilai Rapor
                </p>
                <h2 className="text-lg font-bold">📥 Import dari Excel</h2>
              </div>
              <button
                onClick={() =>
                  importStatus !== "saving" && setImportModal(false)
                }
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div
              style={{
                overflowY: "auto",
                flexGrow: 1,
                padding: 24,
                position: "relative",
              }}
            >
              {/* Step 1: pilih kelas, semester & upload file */}
              {(importStatus === "idle" || importStatus === "error") && (
                <div className="space-y-5">
                  {/* Info format */}
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm text-purple-800">
                    <p className="font-semibold mb-1">📋 Cara penggunaan:</p>
                    <ul className="list-disc ml-4 space-y-0.5 text-xs">
                      <li>
                        Pilih <b>Kelas</b> dan <b>Semester</b> target terlebih
                        dahulu
                      </li>
                      <li>
                        Kolom Excel:{" "}
                        <b>
                          Nama Siswa, PAI, PPKn, B.Indonesia, Matematika, IPAS,
                          SBdP, PJOK, B.Inggris, B.Daerah
                        </b>
                      </li>
                      <li>
                        Nilai akan disimpan ke kolom{" "}
                        <b>
                          pai{lockedFilter ? importKelas : importNilaiKelas}s
                          {importSemester === "s1" ? "1" : "2"}
                        </b>{" "}
                        dst di sheet
                      </li>
                      <li>
                        Nama siswa akan dicocokkan otomatis dengan data di
                        sistem
                      </li>
                    </ul>
                  </div>

                  {/* ── Kelas Siswa (untuk match nama) ── */}
                  <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">
                        👥 Kelas Siswa Sekarang
                      </p>
                      <p className="text-xs text-gray-400">
                        Digunakan untuk mencocokkan nama siswa di Excel
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Kelas{" "}
                        {lockedFilter && (
                          <span className="ml-1 text-orange-400 font-normal">
                            (otomatis dari login)
                          </span>
                        )}
                      </label>
                      <div className="grid grid-cols-6 gap-1.5">
                        {["1", "2", "3", "4", "5", "6"].map((k) => {
                          const kelasColors: Record<
                            string,
                            { bg: string; active: string }
                          > = {
                            "1": { bg: "#dbeafe", active: "#2563eb" },
                            "2": { bg: "#dcfce7", active: "#16a34a" },
                            "3": { bg: "#fef9c3", active: "#ca8a04" },
                            "4": { bg: "#ffedd5", active: "#ea580c" },
                            "5": { bg: "#f3e8ff", active: "#9333ea" },
                            "6": { bg: "#fee2e2", active: "#dc2626" },
                          };
                          const c = kelasColors[k];
                          return (
                            <button
                              key={k}
                              onClick={() => !lockedFilter && setImportKelas(k)}
                              disabled={lockedFilter}
                              style={
                                importKelas === k
                                  ? {
                                      background: c.active,
                                      color: "white",
                                      border: `2px solid ${c.active}`,
                                    }
                                  : {
                                      background: lockedFilter
                                        ? "#f3f4f6"
                                        : c.bg,
                                      color: lockedFilter
                                        ? "#9ca3af"
                                        : "#374151",
                                      border: "2px solid transparent",
                                    }
                              }
                              className={`py-2 rounded-lg text-sm font-bold transition ${
                                lockedFilter ? "cursor-not-allowed" : ""
                              }`}
                            >
                              {k}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Rombel{" "}
                        {lockedFilter ? (
                          <span className="ml-1 text-orange-400 font-normal">
                            (otomatis dari login)
                          </span>
                        ) : (
                          <span className="text-gray-400 font-normal">
                            (opsional)
                          </span>
                        )}
                      </label>
                      <div className="flex gap-2">
                        {(["", "A", "B"] as string[]).map((r: string) => (
                          <button
                            key={r}
                            onClick={() => !lockedFilter && setImportRombel(r)}
                            disabled={lockedFilter}
                            style={
                              importRombel === r
                                ? { background: "#0369a1", color: "white" }
                                : {
                                    background: lockedFilter
                                      ? "#f9fafb"
                                      : "white",
                                    color: lockedFilter ? "#9ca3af" : "#374151",
                                  }
                            }
                            className={`flex-1 py-2 rounded-lg text-xs font-semibold border border-gray-300 transition ${
                              lockedFilter ? "cursor-not-allowed" : ""
                            }`}
                          >
                            {r === "" ? "Semua Rombel" : "Rombel " + r}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ── Target Kelas Nilai (kolom yang diisi) — hanya operator ── */}
                  {!lockedFilter && (
                    <div className="border border-indigo-200 bg-indigo-50 rounded-xl p-4 space-y-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-indigo-600 mb-1">
                          📝 Target Kelas Nilai
                        </p>
                        <p className="text-xs text-indigo-500">
                          Kolom nilai mana yang akan diisi (boleh berbeda dengan
                          kelas siswa sekarang)
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                          Nilai dimasukkan ke Kelas
                        </label>
                        <div className="grid grid-cols-6 gap-1.5">
                          {["1", "2", "3", "4", "5", "6"].map((k) => {
                            const kelasColors: Record<
                              string,
                              { bg: string; active: string }
                            > = {
                              "1": { bg: "#dbeafe", active: "#2563eb" },
                              "2": { bg: "#dcfce7", active: "#16a34a" },
                              "3": { bg: "#fef9c3", active: "#ca8a04" },
                              "4": { bg: "#ffedd5", active: "#ea580c" },
                              "5": { bg: "#f3e8ff", active: "#9333ea" },
                              "6": { bg: "#fee2e2", active: "#dc2626" },
                            };
                            const c = kelasColors[k];
                            return (
                              <button
                                key={k}
                                onClick={() => setImportNilaiKelas(k)}
                                style={
                                  importNilaiKelas === k
                                    ? {
                                        background: c.active,
                                        color: "white",
                                        border: `2px solid ${c.active}`,
                                      }
                                    : {
                                        background: c.bg,
                                        color: "#374151",
                                        border: "2px solid transparent",
                                      }
                                }
                                className="py-2 rounded-lg text-sm font-bold transition"
                              >
                                {k}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pilih Semester */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Target Semester
                    </label>
                    <div className="flex gap-2">
                      {(["s1", "s2"] as const).map((sem) => (
                        <button
                          key={sem}
                          onClick={() => setImportSemester(sem)}
                          style={
                            importSemester === sem
                              ? { background: "#7c3aed", color: "white" }
                              : { background: "white", color: "#374151" }
                          }
                          className="flex-1 py-2.5 rounded-lg text-sm font-semibold border border-gray-300 transition"
                        >
                          {sem === "s1" ? "📘 Semester 1" : "📗 Semester 2"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Info kolom target */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">
                      Nilai akan disimpan ke kolom:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {[
                        "pai",
                        "ppkn",
                        "bind",
                        "mat",
                        "ipas",
                        "sbdp",
                        "pjok",
                        "bing",
                        "bdaerah",
                      ].map((p) => (
                        <span
                          key={p}
                          className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-mono font-semibold"
                        >
                          {p}
                          {lockedFilter ? importKelas : importNilaiKelas}
                          {importSemester}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Upload file */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Pilih File Excel (.xlsx / .xls)
                    </label>
                    <div
                      onClick={() => importFileRef.current?.click()}
                      className="border-2 border-dashed border-purple-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition"
                    >
                      <div className="text-4xl mb-2">📊</div>
                      <p className="text-sm font-medium text-gray-600">
                        Klik untuk memilih file Excel
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        .xlsx atau .xls · Nilai masuk ke{" "}
                        <b>
                          Kelas {lockedFilter ? importKelas : importNilaiKelas}
                        </b>{" "}
                        ·{" "}
                        {importSemester === "s1" ? "Semester 1" : "Semester 2"}
                      </p>
                    </div>
                    <input
                      ref={importFileRef}
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleImportFile(f);
                        e.target.value = "";
                      }}
                    />
                  </div>
                  {importStatus === "error" && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                      ⚠️ {importMsg}
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: parsing */}
              {importStatus === "parsing" && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3 animate-spin">⚙️</div>
                  <p className="text-gray-600 font-medium">{importMsg}</p>
                </div>
              )}

              {/* Step 3: preview hasil parsing */}
              {(importStatus === "preview" ||
                importStatus === "saving" ||
                importStatus === "done") && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">{importMsg}</p>
                    <div className="flex gap-2 text-xs">
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                        ✓ {importRows.filter((r) => r.matchedIndex >= 0).length}{" "}
                        cocok
                      </span>
                      <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                        ✗ {importRows.filter((r) => r.matchedIndex < 0).length}{" "}
                        tidak cocok
                      </span>
                    </div>
                  </div>
                  {/* Info target kolom */}
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2 text-xs text-indigo-700">
                    <b>Target nilai:</b> Kelas{" "}
                    {lockedFilter ? importKelas : importNilaiKelas} ·{" "}
                    {importSemester === "s1" ? "Semester 1" : "Semester 2"} |{" "}
                    <b>Siswa:</b> Kelas {importKelas}
                    {importRombel ? " Rombel " + importRombel : ""} →&nbsp;
                    {[
                      "pai",
                      "ppkn",
                      "bind",
                      "mat",
                      "ipas",
                      "sbdp",
                      "pjok",
                      "bing",
                      "bdaerah",
                    ].map((p) => (
                      <span key={p} className="font-mono mr-1">
                        {p}
                        {importKelas}
                        {importSemester}
                      </span>
                    ))}
                  </div>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table
                        className="text-xs"
                        style={{ width: "max-content", minWidth: "100%" }}
                      >
                        <thead>
                          <tr
                            style={{
                              background:
                                "linear-gradient(to right,#7c3aed,#4f46e5)",
                            }}
                            className="text-white"
                          >
                            <th className="px-3 py-2 text-left">
                              Nama di Excel
                            </th>
                            <th className="px-3 py-2 text-left">
                              Cocok dengan (di sistem)
                            </th>
                            <th
                              className="px-1 py-2 text-center"
                              style={{ minWidth: 38 }}
                            >
                              PAI
                            </th>
                            <th
                              className="px-1 py-2 text-center"
                              style={{ minWidth: 38 }}
                            >
                              PPKn
                            </th>
                            <th
                              className="px-1 py-2 text-center"
                              style={{ minWidth: 38 }}
                            >
                              B.Ind
                            </th>
                            <th
                              className="px-1 py-2 text-center"
                              style={{ minWidth: 38 }}
                            >
                              Mat
                            </th>
                            <th
                              className="px-1 py-2 text-center"
                              style={{ minWidth: 38 }}
                            >
                              IPAS
                            </th>
                            <th
                              className="px-1 py-2 text-center"
                              style={{ minWidth: 38 }}
                            >
                              SBdP
                            </th>
                            <th
                              className="px-1 py-2 text-center"
                              style={{ minWidth: 38 }}
                            >
                              PJOK
                            </th>
                            <th
                              className="px-1 py-2 text-center"
                              style={{ minWidth: 38 }}
                            >
                              B.Ing
                            </th>
                            <th
                              className="px-1 py-2 text-center"
                              style={{ minWidth: 38 }}
                            >
                              B.Dae
                            </th>
                            <th className="px-3 py-2 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importRows.map((row, i) => (
                            <tr
                              key={i}
                              className={
                                i % 2 === 0 ? "bg-white" : "bg-gray-50"
                              }
                            >
                              <td
                                className="px-3 py-2 font-medium text-gray-800"
                                style={{
                                  maxWidth: 130,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {row.nama}
                              </td>
                              <td
                                className="px-3 py-2 text-gray-500"
                                style={{
                                  maxWidth: 130,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {row.matched || (
                                  <span className="text-red-400 italic">
                                    Tidak ditemukan
                                  </span>
                                )}
                              </td>
                              {[
                                "pai",
                                "ppkn",
                                "bind",
                                "mat",
                                "ipas",
                                "sbdp",
                                "pjok",
                                "bing",
                                "bdaerah",
                              ].map((p) => {
                                const v = row.nilai[p] || "";
                                const n = parseInt(v);
                                const clr = !v
                                  ? "#d1d5db"
                                  : n >= 85
                                  ? "#166534"
                                  : n >= 70
                                  ? "#1d4ed8"
                                  : n >= 60
                                  ? "#a16207"
                                  : "#b91c1c";
                                return (
                                  <td
                                    key={p}
                                    className="px-1 py-2 text-center font-semibold"
                                    style={{ color: clr }}
                                  >
                                    {v || "—"}
                                  </td>
                                );
                              })}
                              <td className="px-3 py-2 text-center">
                                {row.matchedIndex >= 0 ? (
                                  <span className="text-green-600 font-bold">
                                    ✓
                                  </span>
                                ) : (
                                  <span className="text-red-500 font-bold">
                                    ✗
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {importStatus === "done" && (
                    <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm font-medium">
                      {importMsg}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center flex-shrink-0">
              <div className="text-xs text-gray-400 flex-1 text-center">
                {importStatus === "preview" &&
                  `Nilai → Kelas ${
                    lockedFilter ? importKelas : importNilaiKelas
                  } · ${
                    importSemester === "s1" ? "Semester 1" : "Semester 2"
                  } | Siswa Kelas ${importKelas}${
                    importRombel ? " Rombel " + importRombel : ""
                  } · ${
                    importRows.filter((r) => r.matchedIndex >= 0).length
                  } siswa akan diupdate`}
                {importStatus === "saving" && ""}
              </div>
              <div className="flex gap-2">
                {importStatus === "done" ? (
                  <button
                    onClick={() => setImportModal(false)}
                    style={{ background: "#7c3aed" }}
                    className="px-5 py-2 text-white rounded-lg text-sm font-semibold"
                  >
                    Selesai
                  </button>
                ) : importStatus === "preview" ? (
                  <>
                    <button
                      onClick={() => {
                        setImportStatus("idle");
                        setImportRows([]);
                      }}
                      className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium"
                    >
                      ← Ulangi
                    </button>
                    <button
                      onClick={handleImportSave}
                      style={{ background: "#7c3aed" }}
                      className="px-5 py-2 text-white rounded-lg text-sm font-semibold"
                    >
                      💾 Simpan{" "}
                      {importRows.filter((r) => r.matchedIndex >= 0).length}{" "}
                      Nilai
                    </button>
                  </>
                ) : importStatus !== "saving" ? (
                  <button
                    onClick={() => setImportModal(false)}
                    className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium"
                  >
                    Tutup
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

async function fetchPegawaiForPdf(
  kelas: string,
  rombel: string,
  allRows?: Pegawai[]
): Promise<{
  kepala: Pegawai | null;
  guru: Pegawai | null;
  allRows: Pegawai[];
}> {
  try {
    const rows: Pegawai[] =
      allRows ??
      (await (async () => {
        const res = await fetch(`${SCRIPT_URL}?action=getDataPegawai`);
        if (!res.ok) return [];
        const json = await res.json();
        if (!json.data || json.data.length < 2) return [];
        return json.data.slice(1).map((row: string[]) => ({
          nama: row[0] ?? "",
          jabatan: row[1] ?? "",
          kelas: row[2] ?? "",
          rombel: row[3] ?? "",
          nip: row[4] ?? "",
          tandaTangan: row[5] ?? "",
        }));
      })());
    const kepala =
      rows.find((p) => p.jabatan.toUpperCase().trim() === "KEPALA SEKOLAH") ||
      null;
    const guru =
      rows.find(
        (p) =>
          p.jabatan.toUpperCase().trim() === "GURU" &&
          String(p.kelas).trim() === String(kelas).trim() &&
          p.rombel.toUpperCase().trim() === rombel.toUpperCase().trim()
      ) || null;
    return { kepala, guru, allRows: rows };
  } catch {
    return { kepala: null, guru: null, allRows: [] };
  }
}

// ─── HALAMAN BUKU INDUK SISWA ─────────────────────────────────────────────────
function PageBukuInduk({
  initKelas = "",
  initRombel = "",
  lockedFilter = false,
  userRole = "OPERATOR",
  userKelas = "",
}: {
  initKelas?: string;
  initRombel?: string;
  lockedFilter?: boolean;
  userRole?: string;
  userKelas?: string;
} = {}) {
  const [students, setStudents] = useState<Record<string, string>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterKelas, setFilterKelas] = useState(initKelas);
  const [filterRombel, setFilterRombel] = useState(initRombel);
  const [filterTahunLulus, setFilterTahunLulus] = useState("");
  const [preview, setPreview] = useState<Record<string, string> | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Load jsPDF & html2canvas dari CDN
  useEffect(() => {
    const loadScript = (src: string) =>
      new Promise<void>((res, rej) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          res();
          return;
        }
        const s = document.createElement("script");
        s.src = src;
        s.onload = () => res();
        s.onerror = rej;
        document.head.appendChild(s);
      });
    loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
    )
      .then(() =>
        loadScript(
          "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"
        )
      )
      .catch(console.error);
  }, []);

  const handleDownloadPDF = async (s: Record<string, string>) => {
    setPdfLoading(true);
    try {
      const jsPDF = (window as any).jspdf?.jsPDF;
      const html2canvas = (window as any).html2canvas;
      if (!jsPDF || !html2canvas)
        throw new Error("Library PDF belum siap, coba lagi sebentar.");

      const { kepala, guru } = await fetchPegawaiForPdf(
        s.kelas || "",
        s.rombel || ""
      );

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const margin = 14;
      const contentW = pdfW - margin * 2;
      let y = margin;

      const checkY = (needed: number) => {
        if (y + needed > pdfH - margin) {
          pdf.addPage();
          y = margin;
        }
      };

      // ── HEADER (gambar via html2canvas) ──
      let fotoBase64 = "";
      if (s.fotoSiswa) {
        try {
          const fileIdMatch =
            s.fotoSiswa.match(/\/d\/([^/]+)/) ||
            s.fotoSiswa.match(/[?&]id=([^&]+)/);
          const fileId = fileIdMatch ? fileIdMatch[1] : "";
          if (fileId) {
            const resp = await fetch(
              `${SCRIPT_URL}?action=getFotoBase64&fileId=${fileId}`
            );
            if (resp.ok) {
              const json = await resp.json();
              if (json.base64 && json.mimeType)
                fotoBase64 = `data:${json.mimeType};base64,${json.base64}`;
            }
          }
        } catch {
          /* lanjut tanpa foto */
        }
      }

      const headerDiv = document.createElement("div");
      headerDiv.style.cssText =
        "position:fixed;left:-9999px;top:0;width:794px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;padding:20px 24px;border-radius:12px;display:flex;gap:16px;align-items:center;font-family:sans-serif";
      headerDiv.innerHTML = `
        <div style="flex-shrink:0">${
          fotoBase64
            ? `<img src="${fotoBase64}" style="width:80px;height:96px;object-fit:cover;border-radius:8px;border:3px solid rgba(255,255,255,0.5)" />`
            : `<div style="width:80px;height:96px;border-radius:8px;border:3px solid rgba(255,255,255,0.3);background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;font-size:36px">👤</div>`
        }
        </div>
        <div>
          <div style="font-size:10px;letter-spacing:3px;opacity:0.7;text-transform:uppercase;margin-bottom:6px">Buku Induk Siswa</div>
          <div style="font-size:22px;font-weight:800;margin-bottom:8px">${
            s.namaLengkap || "—"
          }</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;font-size:11px">
            ${
              s.nisn
                ? `<span style="background:rgba(255,255,255,0.2);padding:2px 10px;border-radius:20px"><b>NISN:</b> ${s.nisn}</span>`
                : ""
            }
            ${
              s.nis
                ? `<span style="background:rgba(255,255,255,0.2);padding:2px 10px;border-radius:20px"><b>NIS:</b> ${s.nis}</span>`
                : ""
            }
            ${
              s.nik
                ? `<span style="background:rgba(255,255,255,0.2);padding:2px 10px;border-radius:20px"><b>NIK:</b> ${s.nik}</span>`
                : ""
            }
            ${
              s.kelas
                ? `<span style="background:rgba(255,255,255,0.3);padding:2px 10px;border-radius:20px;font-weight:700">Kelas ${
                    s.kelas
                  }${s.rombel ? " – Rombel " + s.rombel : ""}</span>`
                : ""
            }
          </div>
        </div>`;
      document.body.appendChild(headerDiv);
      const headerCanvas = await html2canvas(headerDiv, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });
      document.body.removeChild(headerDiv);
      const headerImgH = headerCanvas.height * (contentW / headerCanvas.width);
      pdf.addImage(
        headerCanvas.toDataURL("image/png"),
        "PNG",
        margin,
        y,
        contentW,
        headerImgH
      );
      y += headerImgH + 6;

      // ── HELPER TEKS ──
      const addSectionTitle = (title: string, icon: string, color: string) => {
        checkY(10);
        pdf.setFillColor(color);
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.roundedRect(margin, y, contentW, 7, 1, 1, "F");
        pdf.text(`  ${title.toUpperCase()}`, margin + 3, y + 4.8);
        pdf.setTextColor(31, 41, 55);
        y += 9;
      };

      const addRow = (label: string, value: string) => {
        if (!value) return;
        checkY(8);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(156, 163, 175);
        pdf.text(label, margin + 2, y + 3);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(31, 41, 55);
        const lines = pdf.splitTextToSize(value, contentW / 2 - 6);
        pdf.text(lines, margin + 2, y + 7);
        y += 5 + lines.length * 4;
      };

      const addTwoRows = (pairs: [string, string][]) => {
        const filled = pairs.filter(([, v]) => v);
        if (!filled.length) return;
        for (let i = 0; i < filled.length; i += 2) {
          const left = filled[i];
          const right = filled[i + 1];
          checkY(10);
          pdf.setFontSize(8);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(156, 163, 175);
          pdf.text(left[0], margin + 2, y + 3);
          if (right) pdf.text(right[0], margin + contentW / 2 + 2, y + 3);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(31, 41, 55);
          const lLines = pdf.splitTextToSize(left[1], contentW / 2 - 6);
          pdf.text(lLines, margin + 2, y + 7);
          if (right) {
            const rLines = pdf.splitTextToSize(right[1], contentW / 2 - 6);
            pdf.text(rLines, margin + contentW / 2 + 2, y + 7);
          }
          y +=
            5 +
            Math.max(
              lLines.length,
              right ? pdf.splitTextToSize(right[1], contentW / 2 - 6).length : 1
            ) *
              4;
        }
        y += 2;
      };

      const addDivider = () => {
        pdf.setDrawColor(229, 231, 235);
        pdf.line(margin, y, margin + contentW, y);
        y += 3;
      };

      // ── DATA PRIBADI ──
      addSectionTitle("Data Pribadi", "👤", "#4f46e5");
      addTwoRows([
        ["Nama Lengkap", s.namaLengkap],
        ["Nama Panggilan", s.namaPanggilan],
        ["Jenis Kelamin", s.jenisKelamin],
        ["Nomor KK", s.nomorKK],
        ["Tempat Lahir", s.tempatLahir],
        ["Tanggal Lahir", formatTanggal(s.tanggalLahir)],
        ["No. Reg. Akta Lahir", s.noRegAktaLahir],
        ["Agama", s.agama],
        ["Kewarganegaraan", s.kewarganegaraan],
        ["Anak ke Berapa", s.anakKeBerapa],
        ["Jumlah Saudara Kandung", s.anakKeDari],
        ["Status dalam Keluarga", s.statusDalamKeluarga],
        ["Tinggal Bersama", s.siswaTinggalBersama],
        ["Tempat Tinggal", s.tempatTinggal],
        ["Transportasi", s.transportasi],
        ["NIK", s.nik],
      ]);
      addDivider();

      // ── ALAMAT ──
      addSectionTitle("Alamat", "🏠", "#0369a1");
      addTwoRows([
        ["Jalan/Dusun", s.jalan],
        ["RT / RW", s.rt && s.rw ? `${s.rt} / ${s.rw}` : s.rt || s.rw],
        ["Kelurahan/Desa", s.kelurahanDesa],
        ["Kecamatan", s.kecamatan],
        ["Kota/Kabupaten", s.kotaKabupaten],
        ["Provinsi", s.propinsi],
        ["Kode Pos", s.kodePos],
        ["", ""],
      ]);
      addDivider();

      // ── DATA AYAH ──
      addSectionTitle("Data Ayah", "👨", "#065f46");
      addTwoRows([
        ["Nama Ayah", s.namaAyah],
        ["Tempat Lahir", s.tempatLahirAyah],
        ["Agama", s.agamaAyah],
        ["Kewarganegaraan", s.kewarganegaraanAyah],
        ["Pendidikan", s.pendidikanAyah],
        ["Pekerjaan", s.pekerjaanAyah],
        ["Penghasilan", s.penghasilanAyah],
        ["Alamat Kantor", s.alamatKantorAyah],
        ["Alamat Rumah", s.alamatRumahAyah],
        ["", ""],
      ]);
      addDivider();

      // ── DATA IBU ──
      addSectionTitle("Data Ibu", "👩", "#9d174d");
      addTwoRows([
        ["Nama Ibu", s.namaIbu],
        ["Tempat Lahir", s.tempatLahirIbu],
        ["Agama", s.agamaIbu],
        ["Kewarganegaraan", s.kewarganegaraanIbu],
        ["Bahasa Ibu", s.bahasaIbu],
        ["Pendidikan", s.pendidikanIbu],
        ["Pekerjaan", s.pekerjaanIbu],
        ["Penghasilan", s.penghasilanIbu],
        ["Alamat Rumah", s.alamatRumahIbu],
        ["", ""],
      ]);
      addDivider();

      // ── DATA WALI ──
      if (s.namaWali) {
        addSectionTitle("Data Wali", "🧑", "#92400e");
        addTwoRows([
          ["Nama Wali", s.namaWali],
          ["Tempat Lahir", s.tempatLahirWali],
          ["Agama", s.agamaWali],
          ["Kewarganegaraan", s.kewarganegaraanWali],
          ["Bahasa", s.bahasaWali],
          ["Pekerjaan", s.pekerjaanWali],
          ["Alamat Kantor", s.alamatKantorWali],
          ["Alamat Rumah", s.alamatRumahWali],
        ]);
        addDivider();
      }

      // ── DATA FISIK ──
      addSectionTitle("Data Fisik & Kesejahteraan", "📏", "#1d4ed8");
      addTwoRows([
        ["Tinggi Badan (cm)", s.tinggiBadan],
        ["Berat Badan (kg)", s.beratBadan],
        ["Lingkar Kepala (cm)", s.lingkarKepala],
        ["Jarak Sekolah (km)", s.jarakSekolahKm],
        ["Jarak Sekolah (jam)", s.jarakSekolahJam],
        ["Jenis Kesejahteraan", s.jenisKesejahteraan],
        ["Nomor Kartu", s.nomorKartu],
        ["Nama di Kartu", s.namaDiKartu],
      ]);
      addDivider();

      // ── NILAI RAPOR ──
      addSectionTitle("Nilai Rapor", "", "#059669");

      const mapelList = [
        { label: "PAI", p: "pai" },
        { label: "PPKn", p: "ppkn" },
        { label: "B. Indonesia", p: "bind" },
        { label: "Matematika", p: "mat" },
        { label: "IPAS", p: "ipas" },
        { label: "SBdP", p: "sbdp" },
        { label: "PJOK", p: "pjok" },
        { label: "B. Inggris", p: "bing" },
        { label: "B. Daerah", p: "bdaerah" },
      ];

      // Ambil data guru per kelas (hanya untuk operator)
      const isOperator = userRole === "OPERATOR";
      let pegawaiRows: {
        nama: string;
        jabatan: string;
        kelas: string;
        rombel: string;
        nip: string;
      }[] = [];
      if (isOperator) {
        try {
          const resPeg = await fetch(`${SCRIPT_URL}?action=getDataPegawai`);
          if (resPeg.ok) {
            const jsonPeg = await resPeg.json();
            if (jsonPeg.data && jsonPeg.data.length > 1) {
              pegawaiRows = jsonPeg.data.slice(1).map((row: string[]) => ({
                nama: row[0] ?? "",
                jabatan: row[1] ?? "",
                kelas: row[2] ?? "",
                rombel: row[3] ?? "",
                nip: row[4] ?? "",
              }));
            }
          }
        } catch {
          /* lanjut tanpa data guru */
        }
      }

      const getGuruNama = (kelas: string, rombel: string) => {
        const found = pegawaiRows.find(
          (p) =>
            p.jabatan.toUpperCase().trim() === "GURU" &&
            String(p.kelas).trim() === String(kelas).trim() &&
            p.rombel.toUpperCase().trim() === rombel.toUpperCase().trim()
        );
        return found?.nama || "";
      };

      // Tentukan kelas yang ditampilkan berdasarkan role
      const kelasYangDitampilkan: number[] = isOperator
        ? [1, 2, 3, 4, 5, 6]
        : [parseInt(String(s.kelas || "1").trim())];

      // Lebar kolom menyesuaikan jumlah kelas
      const mapelColW = 28;
      const nilaiColW =
        (contentW - mapelColW) / (kelasYangDitampilkan.length * 2);

      checkY(60);

      // ── Header baris 1: "Mata Pelajaran" + "Kelas 1" ... "Kelas 6"
      const kelasColors: Record<string, [number, number, number]> = {
        "1": [59, 130, 246],
        "2": [34, 197, 94],
        "3": [234, 179, 8],
        "4": [249, 115, 22],
        "5": [168, 85, 247],
        "6": [239, 68, 68],
      };

      pdf.setFontSize(7);
      pdf.setFont("helvetica", "bold");

      // Background header "Mata Pelajaran"
      pdf.setFillColor(249, 250, 251);
      pdf.rect(margin, y, mapelColW, 6, "F");
      pdf.setTextColor(107, 114, 128);
      pdf.text("Mata Pelajaran", margin + 1, y + 4);

      // Header kelas
      for (let ki = 0; ki < kelasYangDitampilkan.length; ki++) {
        const k = kelasYangDitampilkan[ki];
        const kx = margin + mapelColW + ki * nilaiColW * 2;
        const [r, g, b] = kelasColors[String(k)];
        pdf.setFillColor(r, g, b);
        pdf.rect(kx, y, nilaiColW * 2, 6, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.text(`Kelas ${k}`, kx + nilaiColW - 3, y + 4, { align: "center" });
      }
      y += 6;

      // ── Header baris 2: S1 / S2 per kelas
      pdf.setFontSize(6.5);
      pdf.rect(margin, y, mapelColW, 5, "F");
      pdf.setFillColor(249, 250, 251);
      pdf.rect(margin, y, mapelColW, 5, "F");

      for (let ki = 0; ki < kelasYangDitampilkan.length; ki++) {
        const k = kelasYangDitampilkan[ki];
        const kx = margin + mapelColW + ki * nilaiColW * 2;
        // S1
        pdf.setFillColor(219, 234, 254);
        pdf.rect(kx, y, nilaiColW, 5, "F");
        pdf.setTextColor(29, 78, 216);
        pdf.setFont("helvetica", "bold");
        pdf.text("S1", kx + nilaiColW / 2, y + 3.5, { align: "center" });
        // S2
        pdf.setFillColor(220, 252, 231);
        pdf.rect(kx + nilaiColW, y, nilaiColW, 5, "F");
        pdf.setTextColor(22, 101, 52);
        pdf.text("S2", kx + nilaiColW + nilaiColW / 2, y + 3.5, {
          align: "center",
        });
      }
      y += 5;

      // ── Garis bawah header
      pdf.setDrawColor(229, 231, 235);
      pdf.line(margin, y, margin + contentW, y);

      // ── Baris nilai per mapel
      mapelList.forEach((mp, ri) => {
        checkY(6);
        // Zebra stripe
        if (ri % 2 === 0) {
          pdf.setFillColor(255, 255, 255);
        } else {
          pdf.setFillColor(249, 250, 251);
        }
        pdf.rect(margin, y, contentW, 5.5, "F");

        // Label mapel
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(55, 65, 81);
        pdf.text(mp.label, margin + 1, y + 3.8);

        // Nilai per kelas
        for (let ki = 0; ki < kelasYangDitampilkan.length; ki++) {
          const k = kelasYangDitampilkan[ki];
          const kx = margin + mapelColW + ki * nilaiColW * 2;
          const v1 = String(s[`${mp.p}${k}s1`] || "");
          const v2 = String(s[`${mp.p}${k}s2`] || "");

          const setNilaiColor = (val: string) => {
            const n = parseInt(val);
            if (!val || isNaN(n)) {
              pdf.setTextColor(209, 213, 219);
              return;
            }
            if (n >= 85) pdf.setTextColor(22, 101, 52);
            else if (n >= 70) pdf.setTextColor(29, 78, 216);
            else if (n >= 60) pdf.setTextColor(161, 98, 7);
            else pdf.setTextColor(185, 28, 28);
          };

          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(7);
          setNilaiColor(v1);
          pdf.text(v1 || "—", kx + nilaiColW / 2, y + 3.8, { align: "center" });
          setNilaiColor(v2);
          pdf.text(v2 || "—", kx + nilaiColW + nilaiColW / 2, y + 3.8, {
            align: "center",
          });
        }

        // Garis bawah tipis
        pdf.setDrawColor(243, 244, 246);
        pdf.line(margin, y + 5.5, margin + contentW, y + 5.5);
        y += 5.5;
      });

      // ── Baris RATA-RATA
      checkY(6);
      pdf.setFillColor(241, 245, 249);
      pdf.rect(margin, y, contentW, 5.5, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.setTextColor(55, 65, 81);
      pdf.text("RATA-RATA", margin + 1, y + 3.8);

      for (let ki = 0; ki < kelasYangDitampilkan.length; ki++) {
        const k = kelasYangDitampilkan[ki];
        const kx = margin + mapelColW + ki * nilaiColW * 2;
        for (const sem of ["s1", "s2"]) {
          const vals = mapelList
            .map((mp) => parseInt(String(s[`${mp.p}${k}${sem}`] || "")))
            .filter((n) => !isNaN(n));
          const avg = vals.length
            ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
            : null;
          const ox = sem === "s1" ? 0 : nilaiColW;

          if (avg !== null) {
            if (avg >= 85) pdf.setTextColor(22, 101, 52);
            else if (avg >= 70) pdf.setTextColor(29, 78, 216);
            else if (avg >= 60) pdf.setTextColor(161, 98, 7);
            else pdf.setTextColor(185, 28, 28);
            pdf.text(String(avg), kx + ox + nilaiColW / 2, y + 3.8, {
              align: "center",
            });
          } else {
            pdf.setTextColor(209, 213, 219);
            pdf.text("—", kx + ox + nilaiColW / 2, y + 3.8, {
              align: "center",
            });
          }
        }
      }
      pdf.setDrawColor(229, 231, 235);
      pdf.line(margin, y + 5.5, margin + contentW, y + 5.5);
      y += 5.5;

      // ── Baris GURU KELAS (hanya operator)
      if (isOperator) {
        checkY(8);
        pdf.setFillColor(239, 246, 255);
        pdf.rect(margin, y, contentW, 7, "F");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7);
        pdf.setTextColor(29, 78, 216);
        pdf.text("Guru Kelas", margin + 1, y + 4.5);

        for (let ki = 0; ki < kelasYangDitampilkan.length; ki++) {
          const k = kelasYangDitampilkan[ki];
          const kx = margin + mapelColW + ki * nilaiColW * 2;
          // Cari guru untuk kelas ini
          const guruNama = getGuruNama(String(k), s.rombel || "");
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(55, 65, 81);
          // Potong nama jika terlalu panjang
          const maxW = nilaiColW * 2 - 2;
          const namaTeks = guruNama || "—";
          const truncated = pdf.splitTextToSize(namaTeks, maxW)[0];
          pdf.text(truncated, kx + nilaiColW, y + 4.5, { align: "center" });
        }
        pdf.setDrawColor(229, 231, 235);
        pdf.line(margin, y + 7, margin + contentW, y + 7);
        y += 7;
      }

      y += 4;

      // ── TANDA TANGAN ──
      checkY(50);
      pdf.setDrawColor(229, 231, 235);
      pdf.setFillColor(240, 249, 255);
      pdf.roundedRect(margin, y, contentW, 6, 1, 1, "F");
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(3, 105, 161);
      pdf.text("TANDA TANGAN", margin + 3, y + 4.2);
      const today = new Date();
      const tglTtd = `Makassar, ${today.getDate()} ${
        [
          "Januari",
          "Februari",
          "Maret",
          "April",
          "Mei",
          "Juni",
          "Juli",
          "Agustus",
          "September",
          "Oktober",
          "November",
          "Desember",
        ][today.getMonth()]
      } ${today.getFullYear()}`;
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(156, 163, 175);
      pdf.setFontSize(7);
      pdf.text(tglTtd, margin + contentW - 2, y + 4.2, { align: "right" });
      y += 10;

      const ttdColW = contentW / 2;
      const drawTtdBox = async (
        label: string,
        p: typeof kepala,
        xOffset: number
      ) => {
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(107, 114, 128);
        pdf.text(label, margin + xOffset + ttdColW / 2, y, { align: "center" });
        let ttdY = y + 4;

        if (p?.tandaTangan && p.tandaTangan.startsWith("data:image")) {
          try {
            const imgH = 20;
            pdf.addImage(
              p.tandaTangan,
              "PNG",
              margin + xOffset + 10,
              ttdY,
              ttdColW - 20,
              imgH
            );
            ttdY += imgH + 2;
          } catch {
            ttdY += 22;
          }
        } else {
          ttdY += 22;
        }

        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(31, 41, 55);
        pdf.setFontSize(9);
        pdf.text(
          p?.nama || "____________________",
          margin + xOffset + ttdColW / 2,
          ttdY + 4,
          { align: "center" }
        );
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(107, 114, 128);
        pdf.setFontSize(8);
        pdf.text(
          `NIP. ${p?.nip || "____________________"}`,
          margin + xOffset + ttdColW / 2,
          ttdY + 9,
          { align: "center" }
        );
      };

      if (isOperator) {
        // Operator: hanya Kepala Sekolah, posisi tengah
        const centerOffset = contentW / 2 - ttdColW / 2;
        await drawTtdBox("Kepala Sekolah", kepala, centerOffset);
      } else {
        // Guru: Kepala Sekolah kiri + Guru Kelas kanan
        const ttdStartY = y;
        await drawTtdBox("Kepala Sekolah", kepala, 0);
        y = ttdStartY;
        await drawTtdBox(
          `Guru Kelas ${s.kelas || ""} Rombel ${s.rombel || ""}`,
          guru,
          ttdColW
        );
      }

      pdf.save(`BukuInduk_${s.namaLengkap || "siswa"}.pdf`);
    } catch (err: any) {
      console.error(err);
      alert("Gagal membuat PDF: " + (err?.message || "Silakan coba lagi."));
    } finally {
      setPdfLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${SCRIPT_URL}?action=getData`);
      if (!res.ok) throw new Error("Gagal mengambil data.");
      const json = await res.json();
      if (json.data && json.data.length > 1) {
        const rows = json.data.slice(1).map((row: string[]) => {
          const obj: Record<string, string> = {};
          COLUMNS.forEach((col, i) => {
            obj[col.key] = row[i] ?? "";
          });
          return obj;
        });
        setStudents(rows);
      } else {
        setStudents([]);
      }
    } catch (e: any) {
      setError(e.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = students.filter((s) => {
    const matchSearch =
      (s.namaLengkap || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.nisn || "").includes(search);
    const matchKelas = filterKelas
      ? String(s.kelas || "")
          .trim()
          .toLowerCase() === filterKelas.toLowerCase()
      : true;
    const matchRombel = filterRombel
      ? String(s.rombel || "")
          .trim()
          .toUpperCase() === filterRombel.toUpperCase()
      : true;
    const matchTahunLulus =
      filterKelas.toLowerCase() === "lulus" && filterTahunLulus
        ? String(s.tahunLulus || "").trim() === filterTahunLulus
        : true;
    return matchSearch && matchKelas && matchRombel && matchTahunLulus;
  });

  const kelasColorStyle: Record<string, { background: string; color: string }> =
    {
      "1": { background: "#dbeafe", color: "#1d4ed8" },
      "2": { background: "#dcfce7", color: "#15803d" },
      "3": { background: "#fef9c3", color: "#a16207" },
      "4": { background: "#ffedd5", color: "#c2410c" },
      "5": { background: "#f3e8ff", color: "#7e22ce" },
      "6": { background: "#fee2e2", color: "#b91c1c" },
    };
  const defaultKelasStyle = { background: "#f3f4f6", color: "#6b7280" };

  return (
    <div className="p-6 md:p-8">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative w-full sm:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Cari nama atau NISN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
          <select
            value={filterKelas}
            onChange={(e) => {
              if (!lockedFilter) {
                setFilterKelas(e.target.value);
                setFilterTahunLulus("");
              }
            }}
            disabled={lockedFilter}
            className={`px-3 py-2.5 border rounded-lg text-sm focus:outline-none bg-white ${
              lockedFilter
                ? "border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50"
                : "border-gray-300 focus:ring-2 focus:ring-purple-400"
            }`}
          >
            <option value="">Semua Kelas</option>
            {[1, 2, 3, 4, 5, 6].map((k) => (
              <option key={k} value={String(k)}>
                Kelas {k}
              </option>
            ))}
            <option value="lulus">Lulus</option>
          </select>
          {filterKelas.toLowerCase() === "lulus" && (
            <select
              value={filterTahunLulus}
              onChange={(e) => setFilterTahunLulus(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
            >
              <option value="">Semua Tahun Lulus</option>
              {Array.from(
                new Set(
                  students
                    .filter(
                      (s) =>
                        String(s.kelas || "").toLowerCase() === "lulus" &&
                        s.tahunLulus
                    )
                    .map((s) => s.tahunLulus)
                )
              )
                .sort((a, b) => Number(b) - Number(a))
                .map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
            </select>
          )}
          <select
            value={filterRombel}
            onChange={(e) => !lockedFilter && setFilterRombel(e.target.value)}
            disabled={lockedFilter}
            className={`px-3 py-2.5 border rounded-lg text-sm focus:outline-none bg-white ${
              lockedFilter
                ? "border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50"
                : "border-gray-300 focus:ring-2 focus:ring-purple-400"
            }`}
          >
            <option value="">Semua Rombel</option>
            <option value="A">Rombel A</option>
            <option value="B">Rombel B</option>
          </select>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          style={{ background: "#7c3aed" }}
          className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 whitespace-nowrap"
        >
          ↻ {loading ? "Memuat..." : "Refresh Data"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          ⚠️ {error}
        </div>
      )}

      {loading && students.length === 0 && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-12 bg-gray-100 rounded-lg animate-pulse"
            />
          ))}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📚</div>
          <p className="font-medium">
            {students.length === 0
              ? "Belum ada data peserta didik."
              : "Tidak ada hasil pencarian."}
          </p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr
                style={{
                  background: "linear-gradient(to right,#7c3aed,#4f46e5)",
                }}
                className="text-white"
              >
                <th className="px-4 py-3 text-left font-semibold">No</th>
                <th className="px-4 py-3 text-left font-semibold">
                  Nama Lengkap
                </th>
                <th className="px-4 py-3 text-left font-semibold">NISN</th>
                <th className="px-4 py-3 text-left font-semibold">Kelas</th>
                <th className="px-4 py-3 text-left font-semibold">Rombel</th>
                {userRole !== "GURU" && (
                  <th className="px-4 py-3 text-left font-semibold">
                    Tahun Lulus
                  </th>
                )}
                <th className="px-4 py-3 text-left font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr
                  key={i}
                  className={`${
                    i % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-purple-50 transition`}
                >
                  <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">
                    <div className="flex items-center gap-2">
                      {s.fotoSiswa ? (
                        <img
                          src={convertDriveUrl(s.fotoSiswa)}
                          alt=""
                          style={{
                            width: 32,
                            height: 32,
                            objectFit: "cover",
                            borderRadius: "50%",
                            flexShrink: 0,
                            border: "2px solid #e9d5ff",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: "#f3e8ff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 14,
                            flexShrink: 0,
                          }}
                        >
                          👤
                        </div>
                      )}
                      {s.namaLengkap || "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                    {s.nisn || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      style={
                        kelasColorStyle[String(s.kelas).trim()] ||
                        defaultKelasStyle
                      }
                      className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    >
                      {s.kelas ? `Kelas ${s.kelas}` : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.rombel || "—"}</td>
                  {userRole !== "GURU" && (
                    <td className="px-4 py-3 text-center">
                      {s.tahunLulus ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                          {s.tahunLulus}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setPreview(s)}
                        style={{ background: "#7c3aed" }}
                        className="px-3 py-1.5 text-white text-xs font-semibold rounded-lg transition shadow-sm"
                      >
                        📋 Lihat
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(s)}
                        disabled={pdfLoading}
                        style={{
                          background: pdfLoading ? "#9ca3af" : "#dc2626",
                        }}
                        className="px-3 py-1.5 text-white text-xs font-semibold rounded-lg transition shadow-sm disabled:cursor-not-allowed"
                      >
                        {pdfLoading ? "⏳..." : "⬇ PDF"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-gray-400 text-right">
        Menampilkan {filtered.length} dari {students.length} data
      </p>

      {/* ══ MODAL BUKU INDUK ══════════════════════════════════════════════════ */}
      {preview && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setPreview(null)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
              width: "100%",
              maxWidth: 860,
              height: "92vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                background: "linear-gradient(135deg,#4f46e5,#7c3aed,#6d28d9)",
                padding: "20px 28px",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                  {/* Foto siswa */}
                  {preview.fotoSiswa ? (
                    <img
                      src={convertDriveUrl(preview.fotoSiswa)}
                      alt="Foto Siswa"
                      style={{
                        width: 80,
                        height: 96,
                        objectFit: "cover",
                        borderRadius: 10,
                        border: "3px solid rgba(255,255,255,0.5)",
                        flexShrink: 0,
                        background: "#fff",
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 80,
                        height: 96,
                        borderRadius: 10,
                        border: "3px solid rgba(255,255,255,0.3)",
                        background: "rgba(255,255,255,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 32,
                        flexShrink: 0,
                        color: "white",
                      }}
                    >
                      👤
                    </div>
                  )}
                  <div style={{ color: "white" }}>
                    <p
                      style={{
                        fontSize: 10,
                        letterSpacing: 3,
                        opacity: 0.7,
                        textTransform: "uppercase",
                        marginBottom: 6,
                      }}
                    >
                      Buku Induk Siswa
                    </p>
                    <h2
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        marginBottom: 8,
                        lineHeight: 1.2,
                      }}
                    >
                      {preview.namaLengkap || "—"}
                    </h2>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 6,
                        fontSize: 11,
                      }}
                    >
                      {preview.nisn && (
                        <span
                          style={{
                            background: "rgba(255,255,255,0.2)",
                            padding: "3px 10px",
                            borderRadius: 20,
                          }}
                        >
                          <b>NISN:</b> {preview.nisn}
                        </span>
                      )}
                      {preview.nis && (
                        <span
                          style={{
                            background: "rgba(255,255,255,0.2)",
                            padding: "3px 10px",
                            borderRadius: 20,
                          }}
                        >
                          <b>NIS:</b> {preview.nis}
                        </span>
                      )}
                      {preview.nik && (
                        <span
                          style={{
                            background: "rgba(255,255,255,0.2)",
                            padding: "3px 10px",
                            borderRadius: 20,
                          }}
                        >
                          <b>NIK:</b> {preview.nik}
                        </span>
                      )}
                      {preview.kelas && (
                        <span
                          style={{
                            background: "rgba(255,255,255,0.3)",
                            padding: "3px 10px",
                            borderRadius: 20,
                            fontWeight: 700,
                          }}
                        >
                          Kelas {preview.kelas}
                          {preview.rombel ? ` – Rombel ${preview.rombel}` : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setPreview(null)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.2)",
                    border: "none",
                    color: "white",
                    fontSize: 20,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Body */}
            <div
              style={{
                overflowY: "scroll",
                flexGrow: 1,
                flexShrink: 1,
                flexBasis: 0,
                minHeight: 0,
                padding: "20px 28px",
                background: "white",
              }}
            >
              {/* Data Pribadi sections */}
              {[
                {
                  title: "Data Pribadi",
                  icon: "👤",
                  color: "#4f46e5",
                  keys: [
                    "namaLengkap",
                    "namaPanggilan",
                    "jenisKelamin",
                    "nomorKK",
                    "tempatLahir",
                    "tanggalLahir",
                    "noRegAktaLahir",
                    "agama",
                    "kewarganegaraan",
                    "anakKeBerapa",
                    "anakKeDari",
                    "statusDalamKeluarga",
                    "siswaTinggalBersama",
                    "tempatTinggal",
                    "transportasi",
                    "nik",
                  ],
                },
                {
                  title: "Alamat",
                  icon: "🏠",
                  color: "#0369a1",
                  keys: [
                    "jalan",
                    "rt",
                    "rw",
                    "kelurahanDesa",
                    "kecamatan",
                    "kotaKabupaten",
                    "propinsi",
                    "kodePos",
                  ],
                },
                {
                  title: "Data Ayah",
                  icon: "👨",
                  color: "#065f46",
                  keys: [
                    "namaAyah",
                    "tempatLahirAyah",
                    "agamaAyah",
                    "kewarganegaraanAyah",
                    "pendidikanAyah",
                    "pekerjaanAyah",
                    "penghasilanAyah",
                    "alamatKantorAyah",
                    "alamatRumahAyah",
                  ],
                },
                {
                  title: "Data Ibu",
                  icon: "👩",
                  color: "#9d174d",
                  keys: [
                    "namaIbu",
                    "tempatLahirIbu",
                    "agamaIbu",
                    "kewarganegaraanIbu",
                    "bahasaIbu",
                    "pendidikanIbu",
                    "pekerjaanIbu",
                    "penghasilanIbu",
                    "alamatRumahIbu",
                  ],
                },
                {
                  title: "Data Wali",
                  icon: "🧑‍⚖️",
                  color: "#92400e",
                  keys: [
                    "namaWali",
                    "tempatLahirWali",
                    "agamaWali",
                    "kewarganegaraanWali",
                    "bahasaWali",
                    "pekerjaanWali",
                    "alamatKantorWali",
                    "alamatRumahWali",
                  ],
                },
                {
                  title: "Data Fisik",
                  icon: "📏",
                  color: "#1d4ed8",
                  keys: [
                    "tinggiBadan",
                    "beratBadan",
                    "lingkarKepala",
                    "jarakSekolahKm",
                    "jarakSekolahJam",
                  ],
                },
                {
                  title: "Data Kesejahteraan",
                  icon: "💳",
                  color: "#6b21a8",
                  keys: ["jenisKesejahteraan", "nomorKartu", "namaDiKartu"],
                },
              ].map((sec) => {
                const filled = sec.keys.filter((k) => preview[k]);
                if (!filled.length) return null;
                return (
                  <div
                    key={sec.title}
                    style={{
                      marginBottom: 14,
                      border: "1px solid #e5e7eb",
                      borderRadius: 10,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        background: `${sec.color}12`,
                        borderBottom: "1px solid #e5e7eb",
                        padding: "7px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span style={{ fontSize: 13 }}>{sec.icon}</span>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 11,
                          color: sec.color,
                          textTransform: "uppercase",
                          letterSpacing: 1,
                        }}
                      >
                        {sec.title}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                      }}
                    >
                      {filled.map((k, idx) => {
                        const col = COLUMNS.find((c) => c.key === k);
                        const val =
                          k === "tanggalLahir"
                            ? formatTanggal(preview[k])
                            : preview[k] || "";
                        return (
                          <div
                            key={k}
                            style={{
                              padding: "6px 14px",
                              borderBottom: "1px solid #f3f4f6",
                              background: idx % 2 === 0 ? "white" : "#fafafa",
                            }}
                          >
                            <div
                              style={{
                                fontSize: 10,
                                color: "#9ca3af",
                                marginBottom: 1,
                              }}
                            >
                              {col?.label || k}
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: "#1f2937",
                                fontWeight: 500,
                              }}
                            >
                              {val}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Tabel Nilai Rapor */}
              <div
                style={{
                  marginBottom: 14,
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    background: "#f0fdf4",
                    borderBottom: "1px solid #e5e7eb",
                    padding: "7px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span style={{ fontSize: 13 }}>📊</span>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: 11,
                      color: "#166534",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    Nilai Rapor Kelas 1 – 6
                  </span>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      fontSize: 11,
                      borderCollapse: "collapse",
                    }}
                  >
                    <thead>
                      <tr style={{ background: "#f9fafb" }}>
                        <th
                          style={{
                            padding: "8px 14px",
                            textAlign: "left",
                            borderBottom: "1px solid #e5e7eb",
                            color: "#6b7280",
                            fontWeight: 600,
                          }}
                        >
                          Mata Pelajaran
                        </th>
                        {[1, 2, 3, 4, 5, 6].map((k) => (
                          <th
                            key={k}
                            colSpan={2}
                            style={{
                              padding: "8px 6px",
                              textAlign: "center",
                              borderBottom: "1px solid #e5e7eb",
                              borderLeft: "1px solid #e5e7eb",
                              fontWeight: 700,
                              color: "#374151",
                            }}
                          >
                            Kelas {k}
                          </th>
                        ))}
                      </tr>
                      <tr style={{ background: "#f3f4f6" }}>
                        <th
                          style={{
                            padding: "5px 14px",
                            borderBottom: "1px solid #e5e7eb",
                            color: "#9ca3af",
                            fontWeight: 500,
                            fontSize: 10,
                          }}
                        ></th>
                        {([1, 2, 3, 4, 5, 6] as number[]).reduce(
                          (acc: JSX.Element[], k: number) =>
                            acc.concat(
                              (
                                [
                                  ["S1", "#dbeafe", "#1d4ed8"],
                                  ["S2", "#dcfce7", "#166534"],
                                ] as string[][]
                              ).map(([lbl, bg, clr]) => (
                                <th
                                  key={`${k}${lbl}`}
                                  style={{
                                    padding: "4px 6px",
                                    textAlign: "center",
                                    borderBottom: "1px solid #e5e7eb",
                                    borderLeft: "1px solid #f3f4f6",
                                    minWidth: 36,
                                    fontSize: 10,
                                    fontWeight: 600,
                                    background: bg,
                                    color: clr,
                                  }}
                                >
                                  {lbl}
                                </th>
                              ))
                            ),
                          []
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: "PAI", p: "pai" },
                        { label: "PPKn", p: "ppkn" },
                        { label: "B. Indonesia", p: "bind" },
                        { label: "Matematika", p: "mat" },
                        { label: "IPAS", p: "ipas" },
                        { label: "SBdP", p: "sbdp" },
                        { label: "PJOK", p: "pjok" },
                        { label: "B. Inggris", p: "bing" },
                        { label: "B. Daerah", p: "bdaerah" },
                      ].map((mp, ri) => (
                        <tr
                          key={mp.p}
                          style={{
                            background: ri % 2 === 0 ? "white" : "#fafafa",
                          }}
                        >
                          <td
                            style={{
                              padding: "5px 14px",
                              fontWeight: 600,
                              color: "#374151",
                              borderBottom: "1px solid #f3f4f6",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {mp.label}
                          </td>
                          {([1, 2, 3, 4, 5, 6] as number[]).reduce(
                            (acc: JSX.Element[], k: number) =>
                              acc.concat(
                                (["s1", "s2"] as string[]).map(
                                  (sem: string) => {
                                    const val =
                                      preview[`${mp.p}${k}${sem}`] || "";
                                    const n = parseInt(val);
                                    const bg = !val
                                      ? "#f9fafb"
                                      : n >= 85
                                      ? "#f0fdf4"
                                      : n >= 70
                                      ? "#eff6ff"
                                      : n >= 60
                                      ? "#fefce8"
                                      : "#fef2f2";
                                    const clr = !val
                                      ? "#d1d5db"
                                      : n >= 85
                                      ? "#166534"
                                      : n >= 70
                                      ? "#1d4ed8"
                                      : n >= 60
                                      ? "#a16207"
                                      : "#b91c1c";
                                    return (
                                      <td
                                        key={`${k}${sem}`}
                                        style={{
                                          padding: "5px 6px",
                                          textAlign: "center",
                                          borderBottom: "1px solid #f3f4f6",
                                          borderLeft: "1px solid #f3f4f6",
                                          background: bg,
                                          color: clr,
                                          fontWeight: val ? 700 : 400,
                                          fontSize: 11,
                                        }}
                                      >
                                        {val || "—"}
                                      </td>
                                    );
                                  }
                                )
                              ),
                            []
                          )}
                        </tr>
                      ))}
                      <tr
                        style={{
                          background: "#f9fafb",
                          borderTop: "2px solid #e5e7eb",
                        }}
                      >
                        <td
                          style={{
                            padding: "5px 14px",
                            fontWeight: 700,
                            color: "#374151",
                            fontSize: 10,
                          }}
                        >
                          RATA-RATA
                        </td>
                        {([1, 2, 3, 4, 5, 6] as number[]).reduce(
                          (acc: JSX.Element[], k: number) =>
                            acc.concat(
                              (["s1", "s2"] as string[]).map((sem: string) => {
                                const vals = (
                                  [
                                    "pai",
                                    "ppkn",
                                    "bind",
                                    "mat",
                                    "ipas",
                                    "sbdp",
                                    "pjok",
                                    "bing",
                                    "bdaerah",
                                  ] as string[]
                                )
                                  .map((p: string) =>
                                    parseInt(preview[`${p}${k}${sem}`] || "")
                                  )
                                  .filter((n: number) => !isNaN(n));
                                const avg = vals.length
                                  ? Math.round(
                                      vals.reduce(
                                        (a: number, b: number) => a + b,
                                        0
                                      ) / vals.length
                                    )
                                  : null;
                                const bg = !avg
                                  ? "#f9fafb"
                                  : avg >= 85
                                  ? "#dcfce7"
                                  : avg >= 70
                                  ? "#dbeafe"
                                  : avg >= 60
                                  ? "#fef9c3"
                                  : "#fee2e2";
                                const clr = !avg
                                  ? "#9ca3af"
                                  : avg >= 85
                                  ? "#166534"
                                  : avg >= 70
                                  ? "#1d4ed8"
                                  : avg >= 60
                                  ? "#a16207"
                                  : "#b91c1c";
                                return (
                                  <td
                                    key={`${k}${sem}`}
                                    style={{
                                      padding: "5px 6px",
                                      textAlign: "center",
                                      background: bg,
                                      color: clr,
                                      fontWeight: 700,
                                      borderLeft: "1px solid #e5e7eb",
                                      fontSize: 11,
                                    }}
                                  >
                                    {avg ?? "—"}
                                  </td>
                                );
                              })
                            ),
                          []
                        )}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "14px 28px",
                borderTop: "1px solid #e5e7eb",
                background: "#fafafa",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 12, color: "#9ca3af" }}>
                {preview.namaLengkap} · Kelas {preview.kelas || "—"}{" "}
                {preview.rombel || ""}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownloadPDF(preview)}
                  disabled={pdfLoading}
                  style={{ background: pdfLoading ? "#9ca3af" : "#dc2626" }}
                  className="px-5 py-2 text-white rounded-lg transition text-sm font-semibold shadow-sm disabled:opacity-60"
                >
                  {pdfLoading ? "⏳ Membuat PDF..." : "⬇ Download PDF"}
                </button>
                <button
                  onClick={() => setPreview(null)}
                  className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium shadow-sm"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HALAMAN DATA PEGAWAI ─────────────────────────────────────────────────────
type Pegawai = {
  nama: string;
  jabatan: string;
  kelas: string;
  rombel: string;
  nip: string;
  tandaTangan: string;
};

const EMPTY_PEGAWAI: Pegawai = {
  nama: "",
  jabatan: "",
  kelas: "",
  rombel: "",
  nip: "",
  tandaTangan: "",
};

import SignatureCanvas from "react-signature-canvas";

const SignaturePad = ({
  onBase64Change,
  existingBase64,
  active,
  canvasRef,
}: {
  onBase64Change: (base64: string) => void;
  existingBase64?: string;
  active: boolean;
  canvasRef: React.RefObject<SignatureCanvas>;
}) => {
  const handleSave = () => {
    if (canvasRef.current && !canvasRef.current.isEmpty()) {
      const base64 = canvasRef.current.toDataURL("image/png");
      onBase64Change(base64);
    }
  };

  const handleClear = () => {
    canvasRef.current?.clear();
    onBase64Change("");
  };

  return (
    <div>
      <div style={{ position: "relative" }}>
        <SignatureCanvas
          ref={canvasRef}
          penColor="black"
          canvasProps={{
            style: {
              width: "100%",
              height: "160px",
              border: "1px solid #d1d5db",
              borderRadius: 8,
              opacity: !active ? 0.5 : 1,
              pointerEvents: !active ? "none" : "auto",
              background: active ? "#fff" : "#f9fafb",
              display: "block",
            },
          }}
        />
        {!active && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(200,200,200,0.3)",
              borderRadius: 8,
            }}
          >
            <span style={{ color: "#666", fontSize: 12 }}>
              Aktifkan mode edit untuk menggambar
            </span>
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={!active}
          className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium disabled:opacity-40"
        >
          💾 Simpan TTD
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={!active}
          className="px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium disabled:opacity-40"
        >
          🗑️ Hapus
        </button>
      </div>
      {existingBase64 && existingBase64.startsWith("data:image") && (
        <div className="mt-2">
          <p className="text-xs text-gray-500 mb-1">Tanda tangan tersimpan:</p>
          <img
            src={existingBase64}
            alt="TTD"
            style={{
              maxWidth: 200,
              height: 60,
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              display: "block",
            }}
          />
        </div>
      )}
    </div>
  );
};

function PagePegawai({
  readOnly = false,
  guruKelas = "",
  guruRombel = "",
}: {
  readOnly?: boolean;
  guruKelas?: string;
  guruRombel?: string;
} = {}) {
  const [pegawai, setPegawai] = useState<Pegawai[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterJabatan, setFilterJabatan] = useState("");
  const [filterKelas, setFilterKelas] = useState("");
  const [filterRombel, setFilterRombel] = useState("");

  // Modal tambah
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<Pegawai>(EMPTY_PEGAWAI);
  const [addBase64, setAddBase64] = useState("");
  const addCanvasRef = useRef<SignatureCanvas>(null);

  const [addStatus, setAddStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  // Modal edit
  const [editing, setEditing] = useState<{
    data: Pegawai;
    rowIndex: number;
  } | null>(null);
  const [editForm, setEditForm] = useState<Pegawai>(EMPTY_PEGAWAI);
  const [editBase64, setEditBase64] = useState("");
  const editCanvasRef = useRef<SignatureCanvas>(null);

  const [editStatus, setEditStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  // Modal hapus
  const [deleteTarget, setDeleteTarget] = useState<{
    data: Pegawai;
    rowIndex: number;
  } | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  // Modal detail
  const [selected, setSelected] = useState<Pegawai | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${SCRIPT_URL}?action=getDataPegawai`);
      if (!res.ok) throw new Error("Gagal mengambil data.");
      const json = await res.json();
      if (json.data && json.data.length > 1) {
        const rows: Pegawai[] = json.data.slice(1).map((row: string[]) => ({
          nama: row[0] ?? "",
          jabatan: row[1] ?? "",
          kelas: row[2] ?? "",
          rombel: row[3] ?? "",
          nip: row[4] ?? "",
          tandaTangan: row[5] ?? "",
        }));
        setPegawai(rows);
      } else {
        setPegawai([]);
      }
    } catch (e: any) {
      setError(e.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = pegawai.filter((p) => {
    if (readOnly) {
      const jabatanUpper = p.jabatan.toUpperCase().trim();
      const isKepalaSekolah = jabatanUpper === "KEPALA SEKOLAH";
      const isGuruYbs =
        jabatanUpper === "GURU" &&
        String(p.kelas).trim() === String(guruKelas).trim() &&
        p.rombel.toUpperCase().trim() === guruRombel.toUpperCase().trim();
      return isKepalaSekolah || isGuruYbs;
    }
    const matchSearch = [p.nama, p.nip]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchJabatan = filterJabatan
      ? p.jabatan.toUpperCase() === filterJabatan.toUpperCase()
      : true;
    const matchKelas = filterKelas
      ? String(p.kelas).trim() === filterKelas
      : true;
    const matchRombel = filterRombel
      ? p.rombel.toUpperCase() === filterRombel.toUpperCase()
      : true;
    return matchSearch && matchJabatan && matchKelas && matchRombel;
  });

  // ── TAMBAH ──
  const handleAdd = async () => {
    setAddStatus("loading");
    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addPegawai",
          ...addForm,
          tandaTangan: addBase64 || "",
        }),
      });
      setAddStatus("success");
      setPegawai((prev) => [
        ...prev,
        { ...addForm, tandaTangan: addBase64 || "" },
      ]);
      setTimeout(() => {
        setShowAdd(false);
        setAddForm(EMPTY_PEGAWAI);
        setAddBase64("");
        addCanvasRef.current?.clear();
        setAddStatus("idle");
      }, 1500);
    } catch {
      setAddStatus("error");
    }
  };

  // ── EDIT ──
  const openEdit = (p: Pegawai, idx: number) => {
    setEditForm({ ...p });
    setEditBase64("");
    editCanvasRef.current?.clear();
    setEditing({ data: p, rowIndex: idx });
    setEditStatus("idle");
  };

  const handleEdit = async () => {
    if (!editing) return;
    setEditStatus("loading");
    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updatePegawai",
          rowIndex: editing.rowIndex + 2,
          data: {
            ...editForm,
            tandaTangan: editBase64 || editing.data.tandaTangan || "",
          },
        }),
      });
      setEditStatus("success");
      setPegawai((prev) =>
        prev.map((p, i) =>
          i === editing.rowIndex
            ? {
                ...editForm,
                tandaTangan: editBase64 || editing.data.tandaTangan || "",
              }
            : p
        )
      );
      setTimeout(() => {
        setEditing(null);
        setEditBase64("");
        editCanvasRef.current?.clear();
        setEditStatus("idle");
      }, 1500);
    } catch {
      setEditStatus("error");
    }
  };

  // ── HAPUS ──
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteStatus("loading");
    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deletePegawai",
          rowIndex: deleteTarget.rowIndex + 2,
        }),
      });
      setDeleteStatus("success");
      setPegawai((prev) => prev.filter((_, i) => i !== deleteTarget.rowIndex));
      setTimeout(() => {
        setDeleteTarget(null);
        setDeleteStatus("idle");
      }, 1500);
    } catch {
      setDeleteStatus("error");
    }
  };

  const jabatanColor = (j: string) => {
    if (j.toUpperCase() === "OPERATOR")
      return { background: "#dbeafe", color: "#1d4ed8" };
    if (j.toUpperCase() === "GURU")
      return { background: "#d1fae5", color: "#065f46" };
    return { background: "#f3f4f6", color: "#374151" };
  };

  return (
    <div className="p-6 md:p-8">
      {/* ── TOOLBAR ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1 flex-wrap">
          <div className="relative w-full sm:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Cari nama atau NIP..."
              value={search}
              onChange={(e) => !readOnly && setSearch(e.target.value)}
              disabled={readOnly}
              className={`w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                readOnly
                  ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                  : "border-gray-300 focus:ring-orange-400"
              }`}
            />
          </div>
          <select
            value={filterJabatan}
            onChange={(e) => !readOnly && setFilterJabatan(e.target.value)}
            disabled={readOnly}
            className={`px-3 py-2.5 border rounded-lg text-sm focus:outline-none bg-white ${
              readOnly
                ? "border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50"
                : "border-gray-300 focus:ring-2 focus:ring-orange-400"
            }`}
          >
            <option value="">Semua Jabatan</option>
            <option value="OPERATOR">Operator</option>
            <option value="GURU">Guru</option>
          </select>
          <select
            value={filterKelas}
            onChange={(e) => !readOnly && setFilterKelas(e.target.value)}
            disabled={readOnly}
            className={`px-3 py-2.5 border rounded-lg text-sm focus:outline-none bg-white ${
              readOnly
                ? "border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50"
                : "border-gray-300 focus:ring-2 focus:ring-orange-400"
            }`}
          >
            <option value="">Semua Kelas</option>
            {[1, 2, 3, 4, 5, 6].map((k) => (
              <option key={k} value={String(k)}>
                Kelas {k}
              </option>
            ))}
          </select>
          <select
            value={filterRombel}
            onChange={(e) => !readOnly && setFilterRombel(e.target.value)}
            disabled={readOnly}
            className={`px-3 py-2.5 border rounded-lg text-sm focus:outline-none bg-white ${
              readOnly
                ? "border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50"
                : "border-gray-300 focus:ring-2 focus:ring-orange-400"
            }`}
          >
            <option value="">Semua Rombel</option>
            <option value="A">Rombel A</option>
            <option value="B">Rombel B</option>
          </select>
        </div>
        <div className="flex gap-2">
          {!readOnly && (
            <button
              onClick={() => {
                setShowAdd(true);
                setAddForm(EMPTY_PEGAWAI);
                setAddStatus("idle");
              }}
              style={{ background: "#ea580c" }}
              className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-lg transition whitespace-nowrap"
            >
              + Tambah Pegawai
            </button>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            style={{ background: "#2563eb" }}
            className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 whitespace-nowrap"
          >
            ↻ {loading ? "Memuat..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          ⚠️ {error}
        </div>
      )}

      {loading && pegawai.length === 0 && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-12 bg-gray-100 rounded-lg animate-pulse"
            />
          ))}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">👨‍🏫</div>
          <p className="font-medium">
            {pegawai.length === 0
              ? "Belum ada data pegawai."
              : "Tidak ada hasil pencarian."}
          </p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr
                style={{
                  background: "linear-gradient(to right,#ea580c,#f97316)",
                }}
                className="text-white"
              >
                <th className="px-4 py-3 text-left font-semibold">No</th>
                <th className="px-4 py-3 text-left font-semibold">Nama</th>
                <th className="px-4 py-3 text-left font-semibold">Jabatan</th>
                <th className="px-4 py-3 text-left font-semibold">Kelas</th>
                <th className="px-4 py-3 text-left font-semibold">Rombel</th>
                <th className="px-4 py-3 text-left font-semibold">NIP</th>
                <th className="px-4 py-3 text-left font-semibold">
                  Tanda Tangan
                </th>
                <th className="px-4 py-3 text-left font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const realIndex = pegawai.indexOf(p);
                return (
                  <tr
                    key={i}
                    className={`${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-orange-50 transition`}
                  >
                    <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {p.nama || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        style={jabatanColor(p.jabatan)}
                        className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      >
                        {p.jabatan || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.kelas ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                          {p.kelas}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.rombel ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                          {p.rombel}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                      {p.nip || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {p.tandaTangan &&
                      p.tandaTangan.startsWith("data:image") ? (
                        <img
                          src={p.tandaTangan}
                          alt="TTD"
                          style={{
                            width: 80,
                            height: 32,
                            objectFit: "contain",
                          }}
                        />
                      ) : p.tandaTangan ? (
                        <a
                          href={p.tandaTangan}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 underline"
                        >
                          Lihat ↗
                        </a>
                      ) : (
                        <span className="text-xs text-gray-300">Belum ada</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setSelected(p)}
                          style={{ background: "#2563eb" }}
                          className="px-2.5 py-1.5 text-white text-xs font-semibold rounded-lg shadow-sm"
                        >
                          Detail
                        </button>
                        {!readOnly && (
                          <>
                            <button
                              onClick={() => openEdit(p, realIndex)}
                              style={{ background: "#f59e0b" }}
                              className="px-2.5 py-1.5 text-white text-xs font-semibold rounded-lg shadow-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setDeleteTarget({
                                  data: p,
                                  rowIndex: realIndex,
                                });
                                setDeleteStatus("idle");
                              }}
                              style={{ background: "#ef4444" }}
                              className="px-2.5 py-1.5 text-white text-xs font-semibold rounded-lg shadow-sm"
                            >
                              Hapus
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-gray-400 text-right">
        Menampilkan {filtered.length} dari {pegawai.length} data pegawai
      </p>

      {/* ══ MODAL DETAIL ══ */}
      {selected && (
        <div style={modalOverlay} onClick={() => setSelected(null)}>
          <div
            style={{
              ...modalBox,
              maxWidth: 520,
              height: "85vh",
              maxHeight: "85vh",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                background: "linear-gradient(to right,#ea580c,#f97316)",
              }}
              className="px-6 py-5 text-white flex items-start justify-between flex-shrink-0"
            >
              <div>
                <p className="text-orange-100 text-xs uppercase tracking-widest mb-1">
                  Detail Pegawai
                </p>
                <h2 className="text-xl font-bold">{selected.nama || "—"}</h2>
                <span
                  style={jabatanColor(selected.jabatan)}
                  className="mt-1 inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold"
                >
                  {selected.jabatan || "—"}
                </span>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="ml-4 w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-xl font-bold"
              >
                ×
              </button>
            </div>
            <div style={modalBody}>
              {[
                { label: "Nama Lengkap", value: selected.nama },
                { label: "Jabatan", value: selected.jabatan },
                { label: "Kelas", value: selected.kelas },
                { label: "Rombel", value: selected.rombel },
                { label: "NIP", value: selected.nip },
              ].map((r) =>
                r.value ? (
                  <div
                    key={r.label}
                    className="flex gap-2 py-1.5 border-b border-gray-100"
                  >
                    <span className="w-40 flex-shrink-0 text-gray-500 text-sm">
                      {r.label}
                    </span>
                    <span className="text-gray-800 text-sm font-medium">
                      {r.value}
                    </span>
                  </div>
                ) : null
              )}
              {selected.tandaTangan && (
                <div className="mt-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-2">
                    Tanda Tangan
                  </p>
                  <img
                    src={convertDriveUrl(selected.tandaTangan)}
                    alt="Tanda Tangan"
                    className="max-h-32 border rounded-lg shadow-sm"
                  />
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end flex-shrink-0">
              <button
                onClick={() => setSelected(null)}
                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium shadow-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL TAMBAH — BODY ══ */}
      {showAdd && (
        <div
          style={modalOverlay}
          onClick={() => addStatus !== "loading" && setShowAdd(false)}
        >
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                background: "linear-gradient(to right,#ea580c,#f97316)",
              }}
              className="px-6 py-5 text-white flex items-start justify-between flex-shrink-0"
            >
              <div>
                <p className="text-orange-100 text-xs uppercase tracking-widest mb-1">
                  Tambah Pegawai
                </p>
                <h2 className="text-xl font-bold">Data Pegawai Baru</h2>
              </div>
              <button
                onClick={() => addStatus !== "loading" && setShowAdd(false)}
                className="ml-4 w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-xl font-bold transition"
              >
                ×
              </button>
            </div>

            <div style={modalBody}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={addForm.nama}
                    onChange={(e) =>
                      setAddForm((prev) => ({ ...prev, nama: e.target.value }))
                    }
                    className={INPUT_EDIT_CLASS}
                    placeholder="Nama lengkap pegawai"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    NIP
                  </label>
                  <input
                    type="text"
                    value={addForm.nip}
                    onChange={(e) =>
                      setAddForm((prev) => ({ ...prev, nip: e.target.value }))
                    }
                    className={INPUT_EDIT_CLASS}
                    placeholder="Nomor Induk Pegawai"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Jabatan
                  </label>
                  <select
                    value={addForm.jabatan}
                    onChange={(e) =>
                      setAddForm((prev) => ({
                        ...prev,
                        jabatan: e.target.value,
                      }))
                    }
                    className={INPUT_EDIT_CLASS}
                  >
                    <option value="">-- Pilih --</option>
                    <option value="OPERATOR">Operator</option>
                    <option value="GURU">Guru</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Kelas
                  </label>
                  <select
                    value={addForm.kelas}
                    onChange={(e) =>
                      setAddForm((prev) => ({ ...prev, kelas: e.target.value }))
                    }
                    className={INPUT_EDIT_CLASS}
                  >
                    <option value="">-- Pilih --</option>
                    {[1, 2, 3, 4, 5, 6].map((k) => (
                      <option key={k} value={String(k)}>
                        Kelas {k}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Rombel
                  </label>
                  <select
                    value={addForm.rombel}
                    onChange={(e) =>
                      setAddForm((prev) => ({
                        ...prev,
                        rombel: e.target.value,
                      }))
                    }
                    className={INPUT_EDIT_CLASS}
                  >
                    <option value="">-- Pilih --</option>
                    <option value="A">Rombel A</option>
                    <option value="B">Rombel B</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-gray-500 mb-2">
                    Tanda Tangan{" "}
                    <span className="text-gray-400 font-normal">
                      (gambar di area putih)
                    </span>
                  </label>
                  <SignaturePad
                    canvasRef={addCanvasRef}
                    onBase64Change={setAddBase64}
                    existingBase64={addBase64}
                    active={true}
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between flex-shrink-0">
              <div className="text-sm">
                {addStatus === "loading" && (
                  <span className="text-orange-600 font-medium">
                    Menyimpan...
                  </span>
                )}
                {addStatus === "success" && (
                  <span className="text-green-600 font-medium">
                    ✓ Berhasil ditambahkan!
                  </span>
                )}
                {addStatus === "error" && (
                  <span className="text-red-600 font-medium">
                    Gagal menyimpan. Coba lagi.
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => addStatus !== "loading" && setShowAdd(false)}
                  className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                >
                  Batal
                </button>
                <button
                  onClick={handleAdd}
                  disabled={addStatus === "loading"}
                  style={{ background: "#ea580c" }}
                  className="px-5 py-2 text-white rounded-lg transition text-sm font-semibold shadow-sm disabled:opacity-60"
                >
                  {addStatus === "loading" ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL EDIT — BODY ══ */}
      {editing && (
        <div
          style={modalOverlay}
          onClick={() => editStatus !== "loading" && setEditing(null)}
        >
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                background: "linear-gradient(to right,#f59e0b,#f97316)",
              }}
              className="px-6 py-5 text-white flex items-start justify-between flex-shrink-0"
            >
              <div>
                <p className="text-amber-100 text-xs uppercase tracking-widest mb-1">
                  Edit Pegawai
                </p>
                <h2 className="text-xl font-bold">
                  {editing.data.nama || "—"}
                </h2>
              </div>
              <button
                onClick={() => editStatus !== "loading" && setEditing(null)}
                className="ml-4 w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-xl font-bold transition"
              >
                ×
              </button>
            </div>

            <div style={modalBody}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={editForm.nama}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, nama: e.target.value }))
                    }
                    className={INPUT_EDIT_CLASS}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    NIP
                  </label>
                  <input
                    type="text"
                    value={editForm.nip}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, nip: e.target.value }))
                    }
                    className={INPUT_EDIT_CLASS}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Jabatan
                  </label>
                  <select
                    value={editForm.jabatan}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        jabatan: e.target.value,
                      }))
                    }
                    className={INPUT_EDIT_CLASS}
                  >
                    <option value="">-- Pilih --</option>
                    <option value="OPERATOR">Operator</option>
                    <option value="GURU">Guru</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Kelas
                  </label>
                  <select
                    value={editForm.kelas}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        kelas: e.target.value,
                      }))
                    }
                    className={INPUT_EDIT_CLASS}
                  >
                    <option value="">-- Pilih --</option>
                    {[1, 2, 3, 4, 5, 6].map((k) => (
                      <option key={k} value={String(k)}>
                        Kelas {k}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Rombel
                  </label>
                  <select
                    value={editForm.rombel}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        rombel: e.target.value,
                      }))
                    }
                    className={INPUT_EDIT_CLASS}
                  >
                    <option value="">-- Pilih --</option>
                    <option value="A">Rombel A</option>
                    <option value="B">Rombel B</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-gray-500 mb-2">
                    Tanda Tangan Baru{" "}
                    <span className="text-gray-400 font-normal">
                      (gambar ulang untuk mengganti yang lama)
                    </span>
                  </label>
                  <SignaturePad
                    canvasRef={editCanvasRef}
                    onBase64Change={setEditBase64}
                    existingBase64={editBase64 || editing.data.tandaTangan}
                    active={true}
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between flex-shrink-0">
              <div className="text-sm">
                {editStatus === "loading" && (
                  <span className="text-amber-600 font-medium">
                    Menyimpan...
                  </span>
                )}
                {editStatus === "success" && (
                  <span className="text-green-600 font-medium">
                    ✓ Data berhasil diperbarui!
                  </span>
                )}
                {editStatus === "error" && (
                  <span className="text-red-600 font-medium">
                    Gagal menyimpan. Coba lagi.
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => editStatus !== "loading" && setEditing(null)}
                  className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                >
                  Batal
                </button>
                <button
                  onClick={handleEdit}
                  disabled={editStatus === "loading"}
                  style={{ background: "#f59e0b" }}
                  className="px-5 py-2 text-white rounded-lg transition text-sm font-semibold shadow-sm disabled:opacity-60"
                >
                  {editStatus === "loading"
                    ? "Menyimpan..."
                    : "Simpan Perubahan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL HAPUS ══ */}
      {deleteTarget && (
        <div
          style={modalOverlay}
          onClick={() => deleteStatus !== "loading" && setDeleteTarget(null)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
              width: "100%",
              maxWidth: 440,
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                background: "linear-gradient(to right,#ef4444,#e11d48)",
              }}
              className="px-6 py-5 text-white"
            >
              <h2 className="text-lg font-bold">Konfirmasi Hapus</h2>
              <p className="text-red-100 text-sm mt-0.5">
                Tindakan ini tidak dapat dibatalkan
              </p>
            </div>
            <div className="p-6">
              <p className="text-gray-700 text-sm mb-2">
                Anda yakin ingin menghapus data pegawai:
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
                <p className="font-bold text-red-800">
                  {deleteTarget.data.nama || "—"}
                </p>
                <p className="text-red-600 text-sm">
                  {deleteTarget.data.jabatan} · NIP:{" "}
                  {deleteTarget.data.nip || "—"}
                </p>
              </div>
              {deleteStatus === "error" && (
                <p className="text-red-600 text-sm mb-3">
                  Gagal menghapus. Coba lagi.
                </p>
              )}
              {deleteStatus === "success" && (
                <p className="text-green-600 text-sm mb-3">
                  ✓ Data berhasil dihapus.
                </p>
              )}
            </div>
            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button
                onClick={() =>
                  deleteStatus !== "loading" && setDeleteTarget(null)
                }
                className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={
                  deleteStatus === "loading" || deleteStatus === "success"
                }
                style={{ background: "#ef4444" }}
                className="px-5 py-2 text-white rounded-lg text-sm font-semibold shadow-sm disabled:opacity-60"
              >
                {deleteStatus === "loading" ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── APP UTAMA ────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [page, setPage] = useState<
    "form" | "data" | "nilai" | "buku" | "pegawai"
  >("form");

  // Jika belum login → tampilkan halaman login
  if (!user) {
    return (
      <PageLogin
        onLogin={(u) => {
          setUser(u);
          // Guru langsung ke halaman nilai
          setPage(u.role === "GURU" ? "nilai" : "form");
        }}
      />
    );
  }

  const isGuru = user.role === "GURU";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-800">
            Sistem Data Peserta Didik
          </h1>
          <p className="text-blue-400 text-sm mt-1">
            Pendaftaran &amp; Manajemen Data Siswa
          </p>
        </div>

        {/* Info bar login */}
        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-blue-100 px-5 py-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Masuk sebagai:</span>
            <span
              style={
                isGuru
                  ? { background: "#d1fae5", color: "#065f46" }
                  : { background: "#dbeafe", color: "#1d4ed8" }
              }
              className="px-2.5 py-0.5 rounded-full text-xs font-bold"
            >
              {isGuru
                ? `👩‍🏫 Guru Kelas ${user.kelas} Rombel ${user.rombel}`
                : "👨‍💼 Operator"}
            </span>
          </div>
          <button
            onClick={() => {
              setUser(null);
              setPage("form");
            }}
            className="text-xs text-gray-400 hover:text-red-500 transition font-medium"
          >
            Keluar ↩
          </button>
        </div>

        {/* Tab navigasi — hanya tampil untuk Operator */}
        {!isGuru && (
          <div className="flex rounded-t-xl overflow-hidden shadow border border-b-0 border-blue-200">
            {(
              [
                { id: "form", label: "📝 Form Peserta Didik Baru" },
                { id: "pegawai", label: "👨‍🏫 Data Pegawai" },
                { id: "data", label: "📋 Data Peserta Didik" },
                { id: "nilai", label: "📊 Input Nilai Rapor" },
                { id: "buku", label: "📚 Buku Induk Siswa" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPage(tab.id)}
                style={
                  page === tab.id
                    ? {
                        background: "linear-gradient(to right,#2563eb,#4f46e5)",
                      }
                    : {}
                }
                className={`flex-1 py-4 text-sm font-semibold transition-all duration-200 ${
                  page === tab.id
                    ? "text-white"
                    : "bg-white text-gray-500 hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Untuk Guru: tab Data Peserta Didik + Input Nilai */}
        {isGuru && (
          <div className="flex rounded-t-xl overflow-hidden shadow border border-b-0 border-emerald-200">
            {(
              [
                { id: "data", label: "📋 Data Peserta Didik" },
                { id: "pegawai", label: "👨‍🏫 Data Pegawai" },
                { id: "nilai", label: "📊 Input Nilai Rapor" },
                { id: "buku", label: "📚 Buku Induk Siswa" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPage(tab.id)}
                style={
                  page === tab.id
                    ? {
                        background: "linear-gradient(to right,#059669,#0d9488)",
                      }
                    : {}
                }
                className={`flex-1 py-4 text-sm font-semibold transition-all duration-200 ${
                  page === tab.id
                    ? "text-white"
                    : "bg-white text-gray-500 hover:bg-emerald-50 hover:text-emerald-700"
                }`}
              >
                {tab.label}
                {tab.id === "nilai"
                  ? ` — Kelas ${user.kelas} Rombel ${user.rombel}`
                  : ""}
              </button>
            ))}
          </div>
        )}

        <div className="bg-white rounded-b-2xl shadow-xl overflow-hidden border border-t-0 border-blue-100">
          {isGuru ? (
            page === "data" ? (
              <PageData
                initKelas={user.kelas}
                initRombel={user.rombel}
                lockedFilter={true}
              />
            ) : page === "nilai" ? (
              <PageNilai
                initKelas={user.kelas}
                initRombel={user.rombel}
                lockedFilter={true}
              />
            ) : page === "pegawai" ? (
              <PagePegawai
                readOnly={true}
                guruKelas={user.kelas}
                guruRombel={user.rombel}
              />
            ) : (
              <PageBukuInduk
                initKelas={user.kelas}
                initRombel={user.rombel}
                lockedFilter={true}
                userRole={user.role}
                userKelas={user.kelas}
              />
            )
          ) : page === "form" ? (
            <PageForm />
          ) : page === "data" ? (
            <PageData />
          ) : page === "nilai" ? (
            <PageNilai />
          ) : page === "pegawai" ? (
            <PagePegawai />
          ) : (
            <PageBukuInduk />
          )}
          <div className="px-8 py-4 bg-gray-50 text-center text-xs text-gray-400 border-t">
            Data disimpan di Google Sheet "DataPribadi" ·{" "}
            {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </div>
  );
}
