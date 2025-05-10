import User from "../../models/LOGIN/UserModel.js";
import argon2 from "argon2";

// Token rahasia statis
const STUDENT_TOKEN = process.env.STUDENT_TOKEN || "123";

// Login Controller
export const Login = async (req, res) => {
  try {
    const user = await User.findOne({
      where: {
        nis: req.body.nis,
      },
    });

    if (!user) {
      return res.status(404).json({ msg: "User tidak ditemukan" });
    }

    const match = await argon2.verify(user.password, req.body.password);
    if (!match) {
      return res.status(400).json({ msg: "Password salah" });
    }

    req.session.userId = user.uuid;
    const { uuid, name, nis, role } = user;
    res.status(200).json({ uuid, name, nis, role });
  } catch (error) {
    res.status(500).json({ msg: "Terjadi kesalahan pada server" });
  }
};

// Controller untuk mendapatkan informasi pengguna yang sedang login
export const Me = async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ msg: "Mohon login ke akun anda" });
  }

  try {
    const user = await User.findOne({
      attributes: ["uuid", "name", "nis", "role", "progress"],
      where: {
        uuid: req.session.userId,
      },
    });

    if (!user) {
      return res.status(404).json({ msg: "User tidak ditemukan" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error di Me:", error.message);
    res.status(500).json({ msg: "Terjadi kesalahan pada server" });
  }
};

// Controller untuk logout
export const logOut = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(400).json({ msg: "Tidak dapat logout" });
    }
    res.status(200).json({ msg: "Berhasil logout" });
  });
};

// Controller untuk registrasi guru
export const RegisterGuru = async (req, res) => {
  const { fullName, nip, password, school } = req.body;

  if (!fullName || !nip || !password || !school) {
    return res.status(400).json({ msg: "Semua kolom wajib diisi" });
  }

  const existingUser = await User.findOne({
    where: { nis: nip },
  });
  if (existingUser) {
    return res.status(400).json({ msg: "NIP sudah terdaftar" });
  }

  try {
    const hashPassword = await argon2.hash(password);
    await User.create({
      name: fullName,
      nis: nip,
      password: hashPassword,
      role: "admin",
      school,
      status: "BELUM SELESAI",
    });
    res.status(201).json({ msg: "Registrasi guru berhasil" });
  } catch (error) {
    console.error("Error during registration:", error.message);
    console.error("Stack trace:", error.stack);
    res
      .status(500)
      .json({ msg: "Terjadi kesalahan pada server", error: error.message });
  }
};

// Controller untuk registrasi siswa
export const RegisterSiswa = async (req, res) => {
  console.log("Request body:", req.body); // Log untuk debugging
  const { fullName, nis, password, class: studentClass, token } = req.body;

  // Validasi input
  if (!fullName || !nis || !password || !studentClass || !token) {
    return res.status(400).json({ msg: "Semua kolom wajib diisi" });
  }

  // Validasi token
  if (token !== STUDENT_TOKEN) {
    return res.status(403).json({ msg: "Token tidak valid" });
  }

  // Cek apakah NIS sudah terdaftar
  const existingUser = await User.findOne({
    where: { nis },
  });
  if (existingUser) {
    return res.status(400).json({ msg: "NIS sudah terdaftar" });
  }

  try {
    const hashPassword = await argon2.hash(password);
    await User.create({
      name: fullName,
      nis,
      password: hashPassword,
      role: "user",
      class: studentClass,
      status: "BELUM SELESAI",
    });
    res.status(201).json({ msg: "Registrasi siswa berhasil" });
  } catch (error) {
    console.error("Error during student registration:", error.message);
    console.error("Stack trace:", error.stack);
    res
      .status(500)
      .json({ msg: "Terjadi kesalahan pada server", error: error.message });
  }
};
