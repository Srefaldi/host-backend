import Kkm from "../../models/KKM/kkmModels.js";
import Evaluation from "../../models/EVALUASI/EvaluasiModel.js";

// Get All KKM
const getKkm = async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ msg: "Mohon login ke akun anda" });
  }

  try {
    const kkm = await Kkm.findAll({
      include: [
        {
          model: Evaluation,
          attributes: ["id", "type", "chapter"],
        },
      ],
    });
    console.log("KKM fetched:", kkm);
    res.status(200).json(kkm);
  } catch (error) {
    console.error("Error di getKkm:", error.message);
    res
      .status(500)
      .json({ msg: "Terjadi kesalahan pada server", error: error.message });
  }
};

// Create or Update KKM
const setKkm = async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ msg: "Mohon login ke akun anda" });
  }

  const { evaluation_id, kkm } = req.body;

  // Validasi input
  if (!evaluation_id || kkm === undefined) {
    return res.status(400).json({ msg: "evaluation_id dan kkm wajib diisi" });
  }

  if (typeof kkm !== "number" || kkm < 0 || kkm > 100) {
    return res.status(400).json({ msg: "KKM harus angka antara 0 dan 100" });
  }

  // Validasi evaluation_id
  const evaluation = await Evaluation.findOne({ where: { id: evaluation_id } });
  if (!evaluation) {
    return res.status(404).json({ msg: "Evaluasi tidak ditemukan" });
  }

  try {
    const existingKkm = await Kkm.findOne({ where: { evaluation_id } });
    if (existingKkm) {
      // Update KKM
      await Kkm.update(
        { kkm, updated_at: new Date() },
        { where: { evaluation_id } }
      );
      console.log("KKM updated:", evaluation_id);
      res.status(200).json({ msg: "KKM berhasil diperbarui" });
    } else {
      // Create KKM
      await Kkm.create({
        evaluation_id,
        kkm,
      });
      console.log("KKM created:", evaluation_id);
      res.status(201).json({ msg: "KKM berhasil dibuat" });
    }
  } catch (error) {
    console.error("Error di setKkm:", error.message);
    res
      .status(500)
      .json({ msg: "Terjadi kesalahan pada server", error: error.message });
  }
};

export { getKkm, setKkm };
