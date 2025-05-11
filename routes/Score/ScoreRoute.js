import express from "express";
import {
  getScores,
  getScoresByUserId,
  createScore,
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

// Endpoint untuk ekspor skor ke Excel (hanya admin)
router.get("/scores/export/excel", verifyUser, adminOnly, exportScoresToExcel);
router.get("/scores/export/json", verifyUser, adminOnly, exportScoresToJSON);
export default router;
