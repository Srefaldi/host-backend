import express from "express";
import {
  Login,
  logOut,
  Me,
  RegisterGuru,
  RegisterSiswa,
} from "../../controller/LOGIN/Auth.js";

const router = express.Router();

router.get("/me", Me);
router.post("/login", Login);
router.post("/register-guru", RegisterGuru);
router.post("/register-siswa", RegisterSiswa); // Endpoint baru
router.delete("/logout", logOut);

export default router;
