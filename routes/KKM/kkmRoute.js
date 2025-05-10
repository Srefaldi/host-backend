import express from "express";
import { getKkm, setKkm } from "../../controller/KKM/KkmController.js";
import { verifyUser, adminOnly } from "../../middleware/Login/AuthUser.js";

const router = express.Router();

// Endpoint untuk mendapatkan semua KKM (semua user terautentikasi)
router.get("/kkm", verifyUser, getKkm);
// Endpoint untuk membuat atau memperbarui KKM (hanya admin)
router.post("/kkm", verifyUser, adminOnly, setKkm);

export default router;
