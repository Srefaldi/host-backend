import User from "../../models/LOGIN/UserModel.js";
import Score from "../../models/MateriSkor/SkorModel.js";
import { promisify } from "util";
import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import XLSX from "xlsx";

const execAsync = promisify(exec);

const getScores = async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ msg: "Mohon login ke akun anda" });
  }
  try {
    const user = await User.findOne({
      attributes: ["name", "nis"],
      where: { uuid: req.session.userId },
    });
    if (!user) {
      return res.status(404).json({ msg: "User tidak ditemukan" });
    }
    const scores = await Score.findAll({
      where: { user_id: req.session.userId },
      attributes: ["type", "chapter", "score", "created_at"],
    });
    res.status(200).json({
      user,
      scores,
    });
  } catch (error) {
    console.error("Error di getScores:", error.message);
    res
      .status(500)
      .json({ msg: "Terjadi kesalahan pada server", error: error.message });
  }
};

const getScoresByUserId = async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ msg: "Mohon login ke akun anda" });
  }

  const { user_id } = req.params;

  try {
    const user = await User.findOne({
      attributes: ["name", "nis"],
      where: { uuid: user_id, role: "user" },
    });

    if (!user) {
      return res
        .status(404)
        .json({ msg: "User tidak ditemukan atau bukan siswa" });
    }

    const scores = await Score.findAll({
      where: { user_id },
      attributes: ["type", "chapter", "score", "created_at"],
    });

    res.status(200).json({
      user,
      scores,
    });
  } catch (error) {
    console.error("Error di getScoresByUserId:", error.message);
    res
      .status(500)
      .json({ msg: "Terjadi kesalahan pada server", error: error.message });
  }
};

const createScore = async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ msg: "Mohon login ke akun anda" });
  }

  if (!req.body) {
    return res.status(400).json({ msg: "Request body tidak ditemukan" });
  }

  const { user_id, type, chapter, score } = req.body;

  if (!user_id || !type || score === undefined) {
    return res
      .status(400)
      .json({ msg: "user_id, type, dan score wajib diisi" });
  }

  if (!["latihan", "evaluasi", "evaluasi_akhir"].includes(type)) {
    return res
      .status(400)
      .json({ msg: "Type harus latihan, evaluasi, atau evaluasi_akhir" });
  }

  if (
    type !== "evaluasi_akhir" &&
    (chapter < 1 || chapter > 6 || !Number.isInteger(chapter))
  ) {
    return res.status(400).json({
      msg: "Chapter harus integer antara 1 dan 6 untuk latihan atau evaluasi",
    });
  }
  if (type === "evaluasi_akhir" && chapter !== undefined) {
    return res
      .status(400)
      .json({ msg: "Evaluasi akhir tidak memerlukan chapter" });
  }

  if (typeof score !== "number" || score < 0 || score > 100) {
    return res.status(400).json({ msg: "Score harus angka antara 0 dan 100" });
  }

  const loggedInUser = await User.findOne({
    where: { uuid: req.session.userId },
  });

  if (!loggedInUser) {
    return res.status(404).json({ msg: "Pengguna yang login tidak ditemukan" });
  }

  if (loggedInUser.role === "user" && user_id !== req.session.userId) {
    return res
      .status(403)
      .json({ msg: "Anda hanya dapat menambahkan skor untuk diri sendiri" });
  }

  const user = await User.findOne({
    where: { uuid: user_id, role: "user" },
  });
  if (!user) {
    return res
      .status(404)
      .json({ msg: "User tidak ditemukan atau bukan siswa" });
  }

  try {
    await Score.create({
      user_id,
      type,
      chapter: type === "evaluasi_akhir" ? null : chapter,
      score,
    });
    res.status(201).json({ msg: "Skor berhasil ditambahkan" });
  } catch (error) {
    console.error("Error di createScore:", error.message);
    res
      .status(500)
      .json({ msg: "Terjadi kesalahan pada server", error: error.message });
  }
};

const exportScoresToPDF = async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ msg: "Mohon login ke akun anda" });
  }

  const { class: userClass } = req.query;

  try {
    // Memeriksa apakah pdflatex tersedia
    console.log("Memeriksa pdflatex...");
    try {
      const { stdout } = await execAsync("pdflatex --version");
      console.log("pdflatex terinstal:", stdout);
    } catch (error) {
      console.error("pdflatex tidak ditemukan:", error.message);
      return res.status(500).json({
        msg: "pdflatex tidak terinstal atau tidak ditemukan di PATH",
        error: error.message,
      });
    }

    // Mengambil data pengguna
    console.log("Mengambil data pengguna...");
    const whereClause = { role: "user" };
    if (userClass) {
      whereClause.class = userClass;
    }

    const users = await User.findAll({
      attributes: ["uuid", "name", "nis", "class"],
      where: whereClause,
      order: [["name", "ASC"]],
    });

    if (!users.length) {
      console.log("Tidak ada siswa ditemukan");
      return res.status(404).json({
        msg: `Tidak ada siswa ditemukan untuk kelas ${
          userClass || "semua kelas"
        }`,
      });
    }
    console.log(`Ditemukan ${users.length} siswa`);

    console.log("Mengambil skor pengguna...");
    const usersWithScores = await Promise.all(
      users.map(async (user) => {
        const scores = await Score.findAll({
          where: { user_id: user.uuid },
          attributes: ["type", "chapter", "score"],
        });
        return { ...user.toJSON(), scores };
      })
    );
    console.log("Skor pengguna diambil");

    // Logging data pengguna untuk debugging
    usersWithScores.forEach((user, index) => {
      console.log(`Data pengguna ${index + 1}:`, {
        nis: user.nis,
        name: user.name,
        class: user.class,
      });
    });

    // Fungsi untuk meng-escape karakter LaTeX dengan logging
    const escapeLatex = (str) => {
      if (!str) return "-";
      const originalStr = str;
      str = str
        .replace(/&/g, "\\&")
        .replace(/%/g, "\\%")
        .replace(/\$/g, "\\$")
        .replace(/#/g, "\\#")
        .replace(/_/g, "\\_")
        .replace(/{/g, "\\{")
        .replace(/}/g, "\\}")
        .replace(/~/g, "\\textasciitilde{}")
        .replace(/\^/g, "\\textasciicircum{}")
        .replace(/\\/g, "\\textbackslash{}")
        .replace(/[-\u001F\u007F-\uFFFF]/g, ""); // Hapus karakter kontrol dan non-ASCII
      if (originalStr !== str) {
        console.log(`Karakter di-escape: "${originalStr}" menjadi "${str}"`);
      }
      return str;
    };

    // Membuat konten LaTeX
    console.log("Membuat konten LaTeX...");
    let latexContent = `
\\documentclass[a4paper,12pt]{article}
\\usepackage{geometry}
\\geometry{a4paper, margin=1in}
\\usepackage{booktabs}
\\usepackage{longtable}
\\usepackage{pdflscape}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{lmodern}
\\usepackage{array}
\\usepackage{colortbl}
\\definecolor{gray}{rgb}{0.9,0.9,0.9}

\\begin{document}

\\begin{landscape}
\\begin{center}
{\\Large \\textbf{Daftar Nilai Siswa ${escapeLatex(
      userClass ? `- Kelas ${userClass}` : ""
    )}}}
\\end{center}

\\vspace{0.5cm}

\\begin{longtable}{|c|c|c|*{6}{c}|*{6}{c}|c|}
\\hline
\\rowcolor{gray}
\\textbf{NIS} & \\textbf{Nama} & \\textbf{Kelas} & \\multicolumn{6}{c|}{\\textbf{Latihan Bab}} & \\multicolumn{6}{c|}{\\textbf{Kuis Bab}} & \\textbf{Evaluasi Akhir} \\\\
\\cline{4-15}
\\rowcolor{gray}
& & & 1 & 2 & 3 & 4 & 5 & 6 & 1 & 2 & 3 & 4 & 5 & 6 & \\\\
\\hline
\\endhead
`;

    usersWithScores.forEach((user) => {
      const getScore = (scores, type, chapter) => {
        const score = scores.find(
          (s) =>
            s.type === type &&
            (type === "evaluasi_akhir" ? true : s.chapter === chapter)
        );
        return score ? Math.floor(score.score) : "-";
      };

      latexContent += `${escapeLatex(user.nis)} & ${escapeLatex(
        user.name
      )} & ${escapeLatex(user.class || "-")} & `;
      for (let i = 1; i <= 6; i++) {
        latexContent += `${getScore(user.scores, "latihan", i)} & `;
      }
      for (let i = 1; i <= 6; i++) {
        latexContent += `${getScore(user.scores, "evaluasi", i)} & `;
      }
      latexContent += `${getScore(
        user.scores,
        "evaluasi_akhir",
        null
      )} \\\\ \\hline\n`;
    });

    latexContent += `
\\end{longtable}
\\end{landscape}
\\end{document}
`;

    // Menulis file LaTeX
    console.log("Menulis file LaTeX...");
    const tempDir = path.join(process.cwd(), "temp");
    await fs.mkdir(tempDir, { recursive: true });
    const texFilePath = path.join(tempDir, `scores_${Date.now()}.tex`);
    const pdfFilePath = texFilePath.replace(".tex", ".pdf");

    try {
      await fs.writeFile(texFilePath, latexContent, "utf8");
      console.log("File LaTeX ditulis ke:", texFilePath);
    } catch (error) {
      console.error("Gagal menulis file LaTeX:", error.message);
      return res.status(500).json({
        msg: "Gagal menulis file LaTeX",
        error: error.message,
      });
    }

    // Mengompilasi LaTeX ke PDF dengan dua kali kompilasi
    console.log("Mengompilasi LaTeX ke PDF...");
    try {
      for (let i = 0; i < 2; i++) {
        console.log(`Menjalankan pdflatex ke-${i + 1}...`);
        const { stdout, stderr } = await execAsync(
          `pdflatex -interaction=nonstopmode -output-directory=${tempDir} ${texFilePath}`,
          { timeout: 30000 }
        );
        console.log(`pdflatex run ${i + 1} stdout:`, stdout);
        if (stderr) {
          console.warn(`pdflatex run ${i + 1} stderr:`, stderr);
        }
      }
      console.log("PDF berhasil dikompilasi:", pdfFilePath);
    } catch (error) {
      console.error("Gagal mengompilasi LaTeX:", error.message);
      const logFilePath = texFilePath.replace(".tex", ".log");
      let logContent = "";
      try {
        logContent = await fs.readFile(logFilePath, "utf8");
        console.log("Isi file log LaTeX:", logContent);
      } catch (logError) {
        console.error("Gagal membaca file log LaTeX:", logError.message);
      }
      return res.status(500).json({
        msg: "Gagal menghasilkan PDF",
        error: error.message,
        latexLog: logContent,
      });
    }

    // Membaca dan mengirim PDF
    console.log("Membaca file PDF...");
    let pdfBuffer;
    try {
      pdfBuffer = await fs.readFile(pdfFilePath);
      console.log("File PDF berhasil dibaca");
    } catch (error) {
      console.error("Gagal membaca file PDF:", error.message);
      return res.status(500).json({
        msg: "Gagal membaca file PDF",
        error: error.message,
      });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Daftar_Nilai_${escapeLatex(
        userClass || "Semua_Kelas"
      )}.pdf`
    );
    res.send(pdfBuffer);
    console.log("File PDF dikirim ke klien");

    // Membersihkan file sementara
    console.log("Membersihkan file sementara...");
    const cleanupFiles = [
      texFilePath,
      pdfFilePath,
      texFilePath.replace(".tex", ".aux"),
      texFilePath.replace(".tex", ".log"),
      texFilePath.replace(".tex", ".out"),
    ];
    for (const file of cleanupFiles) {
      await fs.unlink(file).catch((err) => {
        console.warn(`Gagal menghapus ${file}:`, err.message);
      });
    }
    console.log("File sementara dibersihkan");
  } catch (error) {
    console.error("Error di exportScoresToPDF:", error.message);
    return res.status(500).json({
      msg: "Terjadi kesalahan pada server",
      error: error.message,
    });
  }
};

const exportScoresToExcel = async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ msg: "Mohon login ke akun anda" });
  }

  const { class: userClass } = req.query;

  try {
    const whereClause = { role: "user" };
    if (userClass) {
      whereClause.class = userClass;
    }

    const users = await User.findAll({
      attributes: ["uuid", "name", "nis", "class"],
      where: whereClause,
      order: [["name", "ASC"]],
    });

    const usersWithScores = await Promise.all(
      users.map(async (user) => {
        const scores = await Score.findAll({
          where: { user_id: user.uuid },
          attributes: ["type", "chapter", "score"],
        });
        return { ...user.toJSON(), scores };
      })
    );

    // Menyiapkan data untuk Excel
    const data = usersWithScores.map((user) => {
      const getScore = (scores, type, chapter) => {
        const score = scores.find(
          (s) =>
            s.type === type &&
            (type === "evaluasi_akhir" ? true : s.chapter === chapter)
        );
        return score ? Math.floor(score.score) : "-";
      };

      return {
        NIS: user.nis,
        Nama: user.name,
        Kelas: user.class || "-",
        "Latihan Bab 1": getScore(user.scores, "latihan", 1),
        "Latihan Bab 2": getScore(user.scores, "latihan", 2),
        "Latihan Bab 3": getScore(user.scores, "latihan", 3),
        "Latihan Bab 4": getScore(user.scores, "latihan", 4),
        "Latihan Bab 5": getScore(user.scores, "latihan", 5),
        "Latihan Bab 6": getScore(user.scores, "latihan", 6),
        "Kuis Bab 1": getScore(user.scores, "evaluasi", 1),
        "Kuis Bab 2": getScore(user.scores, "evaluasi", 2),
        "Kuis Bab 3": getScore(user.scores, "evaluasi", 3),
        "Kuis Bab 4": getScore(user.scores, "evaluasi", 4),
        "Kuis Bab 5": getScore(user.scores, "evaluasi", 5),
        "Kuis Bab 6": getScore(user.scores, "evaluasi", 6),
        "Evaluasi Akhir": getScore(user.scores, "evaluasi_akhir", null),
      };
    });

    // Membuat workbook Excel
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daftar Nilai");

    // Mengatur lebar kolom
    ws["!cols"] = [
      { wch: 15 },
      { wch: 30 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
    ];

    // Menghasilkan file Excel
    const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Daftar_Nilai_${userClass || "Semua_Kelas"}.xlsx`
    );
    res.send(excelBuffer);
  } catch (error) {
    console.error("Error di exportScoresToExcel:", error.message);
    res
      .status(500)
      .json({ msg: "Terjadi kesalahan pada server", error: error.message });
  }
};

export {
  getScores,
  getScoresByUserId,
  createScore,
  exportScoresToPDF,
  exportScoresToExcel,
};
