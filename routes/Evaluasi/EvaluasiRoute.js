import express from "express";
import {
  createEvaluation,
  createQuestion,
  getQuestionById,
  getQuestionsByEvaluation,
  updateQuestion,
  deleteQuestion,
  getEvaluations,
} from "../../controller/Evaluasi/EvaluasiController.js";
import { verifyUser, adminOnly } from "../../middleware/Login/AuthUser.js";

const router = express.Router();

// Endpoint untuk membuat evaluasi (hanya admin)
router.post("/evaluations", verifyUser, adminOnly, createEvaluation);
// Endpoint untuk membuat soal (hanya admin)
router.post("/questions", verifyUser, adminOnly, createQuestion);
// Endpoint untuk mendapatkan soal berdasarkan ID (semua user terautentikasi)
router.get("/questions/:id", verifyUser, getQuestionById);
// Endpoint untuk mendapatkan soal berdasarkan evaluation_id (semua user terautentikasi)
router.get(
  "/questions/evaluation/:evaluation_id",
  verifyUser,
  getQuestionsByEvaluation
);
// Endpoint untuk memperbarui soal (hanya admin)
router.patch("/questions/:id", verifyUser, adminOnly, updateQuestion);
// Endpoint untuk menghapus soal (hanya admin)
router.delete("/questions/:id", verifyUser, adminOnly, deleteQuestion);
// Endpoint untuk mendapatkan semua evaluasi (semua user terautentikasi)
router.get("/evaluations", verifyUser, getEvaluations);

export default router;
