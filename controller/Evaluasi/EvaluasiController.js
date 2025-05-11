import Evaluation from "../../models/EVALUASI/EvaluasiModel.js";
import Question from "../../models/EVALUASI/Soal.js";

// Create Evaluation
const createEvaluation = async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ msg: "Mohon login ke akun anda" });
  }

  const { type, chapter } = req.body;

  // Validasi input
  if (!type) {
    return res.status(400).json({ msg: "Tipe evaluasi wajib diisi" });
  }

  if (!["bab", "evaluasi_akhir"].includes(type)) {
    return res
      .status(400)
      .json({ msg: "Tipe harus 'bab' atau 'evaluasi_akhir'" });
  }

  if (
    type === "bab" &&
    (!chapter || chapter < 1 || chapter > 6 || !Number.isInteger(chapter))
  ) {
    return res
      .status(400)
      .json({ msg: "Chapter harus integer antara 1 dan 6 untuk evaluasi bab" });
  }

  if (type === "evaluasi_akhir" && chapter !== undefined) {
    return res
      .status(400)
      .json({ msg: "Evaluasi akhir tidak memerlukan chapter" });
  }

  try {
    const evaluation = await Evaluation.create({
      type,
      chapter: type === "bab" ? chapter : null,
    });
    console.log("Evaluation created:", evaluation);
    res.status(201).json({ msg: "Evaluasi berhasil dibuat", evaluation });
  } catch (error) {
    console.error("Error di createEvaluation:", error.message);
    res
      .status(500)
      .json({ msg: "Terjadi kesalahan pada server", error: error.message });
  }
};

// Create Question
const createQuestion = async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ msg: "Mohon login ke akun anda" });
  }

  const {
    evaluation_id,
    question_text,
    option_a,
    option_b,
    option_c,
    option_d,
    option_e,
    correct_answer,
  } = req.body;

  // Validasi input
  if (
    !evaluation_id ||
    !question_text ||
    !option_a ||
    !option_b ||
    !option_c ||
    !option_d ||
    !option_e ||
    !correct_answer
  ) {
    return res.status(400).json({ msg: "Semua kolom wajib diisi" });
  }

  if (!["A", "B", "C", "D", "E"].includes(correct_answer)) {
    return res
      .status(400)
      .json({ msg: "Jawaban benar harus A, B, C, D, atau E" });
  }

  // Validasi evaluation_id
  const evaluation = await Evaluation.findOne({ where: { id: evaluation_id } });
  if (!evaluation) {
    return res.status(404).json({ msg: "Evaluasi tidak ditemukan" });
  }

  try {
    const question = await Question.create({
      evaluation_id,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      option_e,
      correct_answer,
    });
    console.log("Question created:", question);
    res.status(201).json({ msg: "Soal berhasil dibuat", question });
  } catch (error) {
    console.error("Error di createQuestion:", error.message);
    res
      .status(500)
      .json({ msg: "Terjadi kesalahan pada server", error: error.message });
  }
};

// Get Question by ID
const getQuestionById = async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ msg: "Mohon login ke akun anda" });
  }

  const { id } = req.params;

  try {
    const question = await Question.findOne({
      where: { id },
      attributes: [
        "id",
        "evaluation_id",
        "question_text",
        "option_a",
        "option_b",
        "option_c",
        "option_d",
        "option_e",
        "correct_answer",
      ],
    });

    if (!question) {
      return res.status(404).json({ msg: "Soal tidak ditemukan" });
    }

    console.log("Question fetched:", question);
    res.status(200).json(question);
  } catch (error) {
    console.error("Error di getQuestionById:", error.message);
    res
      .status(500)
      .json({ msg: "Terjadi kesalahan pada server", error: error.message });
  }
};

// Get All Questions for an Evaluation
const getQuestionsByEvaluation = async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ msg: "Mohon login ke akun anda" });
  }

  const { evaluation_id } = req.params;

  try {
    const evaluation = await Evaluation.findOne({
      where: { id: evaluation_id },
    });
    if (!evaluation) {
      return res.status(404).json({ msg: "Evaluasi tidak ditemukan" });
    }

    const questions = await Question.findAll({
      where: { evaluation_id },
      attributes: [
        "id",
        "evaluation_id",
        "question_text",
        "option_a",
        "option_b",
        "option_c",
        "option_d",
        "option_e",
        "correct_answer",
      ],
    });

    console.log("Questions fetched for evaluation:", evaluation_id, questions);
    res.status(200).json({
      evaluation,
      questions,
    });
  } catch (error) {
    console.error("Error di getQuestionsByEvaluation:", error.message);
    res
      .status(500)
      .json({ msg: "Terjadi kesalahan pada server", error: error.message });
  }
};

// Update Question
const updateQuestion = async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ msg: "Mohon login ke akun anda" });
  }

  const { id } = req.params;
  const {
    evaluation_id,
    question_text,
    option_a,
    option_b,
    option_c,
    option_d,
    option_e,
    correct_answer,
  } = req.body;

  console.log("updateQuestion request:", { id, ...req.body }); // Debugging

  // Validasi input
  if (
    !evaluation_id ||
    !question_text ||
    !option_a ||
    !option_b ||
    !option_c ||
    !option_d ||
    !option_e ||
    !correct_answer
  ) {
    return res.status(400).json({ msg: "Semua kolom wajib diisi" });
  }

  if (!["A", "B", "C", "D", "E"].includes(correct_answer)) {
    return res
      .status(400)
      .json({ msg: "Jawaban benar harus A, B, C, D, atau E" });
  }

  // Validasi evaluation_id
  const evaluation = await Evaluation.findOne({ where: { id: evaluation_id } });
  if (!evaluation) {
    return res.status(404).json({ msg: "Evaluasi tidak ditemukan" });
  }

  try {
    const question = await Question.findOne({ where: { id } });
    if (!question) {
      return res.status(404).json({ msg: "Soal tidak ditemukan" });
    }

    await Question.update(
      {
        evaluation_id,
        question_text,
        option_a,
        option_b,
        option_c,
        option_d,
        option_e,
        correct_answer,
      },
      { where: { id } }
    );
    console.log("Question updated:", id);
    res.status(200).json({ msg: "Soal berhasil diperbarui" });
  } catch (error) {
    console.error("Error di updateQuestion:", error.message);
    res
      .status(500)
      .json({ msg: "Terjadi kesalahan pada server", error: error.message });
  }
};

// Delete Question
const deleteQuestion = async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ msg: "Mohon login ke akun anda" });
  }

  const { id } = req.params;

  try {
    const question = await Question.findOne({ where: { id } });
    if (!question) {
      return res.status(404).json({ msg: "Soal tidak ditemukan" });
    }

    await Question.destroy({ where: { id } });
    console.log("Question deleted:", id);
    res.status(200).json({ msg: "Soal berhasil dihapus" });
  } catch (error) {
    console.error("Error di deleteQuestion:", error.message);
    res
      .status(500)
      .json({ msg: "Terjadi kesalahan pada server", error: error.message });
  }
};

// Get All Evaluations
const getEvaluations = async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ msg: "Mohon login ke akun anda" });
  }

  try {
    const evaluations = await Evaluation.findAll({
      attributes: ["id", "type", "chapter"],
    });
    console.log("Evaluations fetched:", evaluations);
    res.status(200).json(evaluations);
  } catch (error) {
    console.error("Error di getEvaluations:", error.message);
    res
      .status(500)
      .json({ msg: "Terjadi kesalahan pada server", error: error.message });
  }
};

export {
  createEvaluation,
  createQuestion,
  getQuestionById,
  getQuestionsByEvaluation,
  updateQuestion,
  deleteQuestion,
  getEvaluations,
};
