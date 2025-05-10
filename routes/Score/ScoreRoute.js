import express from "express";
import {
  getScores,
  getScoresByUserId,
  createScore,
  exportScoresToPDF,
  exportScoresToExcel,
} from "../../controller/LOGIN/SkorController.js";
import { verifyUser, adminOnly } from "../../middleware/Login/AuthUser.js";

const router = express.Router();

// Endpoint untuk mendapatkan skor pengguna yang login (semua user terautentikasi)
router.get("/scores", verifyUser, getScores);
// Endpoint untuk mendapatkan skor berdasarkan user_id (hanya admin)
router.get("/scores/:user_id", verifyUser, adminOnly, getScoresByUserId);
// Endpoint untuk membuat skor (semua user terautentikasi)
router.post("/scores", verifyUser, createScore);
// Endpoint untuk ekspor skor ke PDF (hanya admin)
router.get("/scores/export/pdf", verifyUser, adminOnly, exportScoresToPDF);
// Endpoint untuk ekspor skor ke Excel (hanya admin)
router.get("/scores/export/excel", verifyUser, adminOnly, exportScoresToExcel);

export default router;
