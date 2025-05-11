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
const exportScoresToJSON = async (req, res) => {
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

    res.status(200).json(usersWithScores);
  } catch (error) {
    console.error("Error di exportScoresToJSON:", error.message);
    res
      .status(500)
      .json({ msg: "Terjadi kesalahan pada server", error: error.message });
  }
};

export {
  getScores,
  getScoresByUserId,
  createScore,
  exportScoresToExcel,
  exportScoresToJSON,
};
