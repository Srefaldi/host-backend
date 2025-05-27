import User from "../../models/LOGIN/UserModel.js";
import argon2 from "argon2";

// Token rahasia statis
const STUDENT_TOKEN = process.env.STUDENT_TOKEN || "HAYQK";

// Login Controller
export const Login = async (req, res) => {
  console.log(
    `[LOGIN] Received login request: NIS=${req.body.nis}, Body:`,
    req.body
  );
  try {
    // Validasi input
    if (!req.body.nis || !req.body.password) {
      console.log(
        `[LOGIN] Missing required fields: NIS=${req.body.nis}, Password=${!!req
          .body.password}`
      );
      return res.status(400).json({ msg: "NIS dan password wajib diisi" });
    }

    // Cari pengguna di database
    console.log(`[LOGIN] Searching for user with NIS=${req.body.nis}`);
    const user = await User.findOne({
      where: {
        nis: req.body.nis,
      },
    });

    if (!user) {
      console.log(`[LOGIN] User with NIS ${req.body.nis} not found`);
      return res.status(404).json({ msg: "User tidak ditemukan" });
    }
    console.log(`[LOGIN] User found: NIS=${user.nis}, UUID=${user.uuid}`);

    // Verifikasi password
    console.log(`[LOGIN] Verifying password for NIS=${req.body.nis}`);
    const match = await argon2.verify(user.password, req.body.password);
    if (!match) {
      console.log(`[LOGIN] Incorrect password for NIS=${req.body.nis}`);
      return res.status(400).json({ msg: "Password salah" });
    }
    console.log(`[LOGIN] Password verified for NIS=${req.body.nis}`);

    // Simpan sesi
    console.log(
      `[LOGIN] Saving session for user: NIS=${user.nis}, UUID=${user.uuid}`
    );
    req.session.userId = user.uuid;

    // Verifikasi sesi tersimpan
    if (req.session.userId !== user.uuid) {
      console.error(
        `[LOGIN] Failed to save session: userId not set in session`
      );
      return res.status(500).json({ msg: "Gagal menyimpan sesi" });
    }
    console.log(
      `[LOGIN] Session created: sessionID=${req.sessionID}, userId=${req.session.userId}`
    );

    // Simpan sesi secara eksplisit
    req.session.save((err) => {
      if (err) {
        console.error(`[LOGIN] Error saving session: ${err.message}`);
        return res.status(500).json({ msg: "Gagal menyimpan sesi" });
      }
      console.log(`[LOGIN] Session saved successfully for NIS=${user.nis}`);

      // Kirim respons
      const { uuid, name, nis, role } = user;
      console.log(
        `[LOGIN] Login successful: NIS=${nis}, Name=${name}, Role=${role}`
      );
      res.status(200).json({ uuid, name, nis, role });
    });
  } catch (error) {
    console.error(`[LOGIN] Error: ${error.message}, Stack: ${error.stack}`);
    res
      .status(500)
      .json({ msg: "Terjadi kesalahan pada server", error: error.message });
  }
};

// Controller untuk mendapatkan informasi pengguna yang sedang login
export const Me = async (req, res) => {
  console.log(
    `Me request: sessionID: ${req.sessionID}, userId: ${req.session.userId}`
  );
  if (!req.session.userId) {
    console.log("Me failed: No userId in session");
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
      console.log(
        `Me failed: User not found for userId: ${req.session.userId}`
      );
      return res.status(404).json({ msg: "User tidak ditemukan" });
    }

    console.log(`Me successful: User found - ${user.nis}`);
    res.status(200).json(user);
  } catch (error) {
    console.error(`Me error: ${error.message}`);
    res.status(500).json({ msg: "Terjadi kesalahan pada server" });
  }
};

// Controller untuk logout
export const logOut = (req, res) => {
  console.log(`Logout request: sessionID: ${req.sessionID}`);
  req.session.destroy((err) => {
    if (err) {
      console.error(`Logout error: ${err.message}`);
      return res.status(400).json({ msg: "Tidak dapat logout" });
    }
    console.log("Logout successful");
    res.status(200).json({ msg: "Berhasil logout" });
  });
};

// Controller untuk registrasi guru
export const RegisterGuru = async (req, res) => {
  const { fullName, nip, password, school } = req.body;

  if (!fullName || !nip || !password || !school) {
    console.log("RegisterGuru failed: Missing required fields");
    return res.status(400).json({ msg: "Semua kolom wajib diisi" });
  }

  const existingUser = await User.findOne({
    where: { nis: nip },
  });
  if (existingUser) {
    console.log(`RegisterGuru failed: NIP ${nip} already registered`);
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
    console.log(`RegisterGuru successful: NIP ${nip}`);
    res.status(201).json({ msg: "Registrasi guru berhasil" });
  } catch (error) {
    console.error(`RegisterGuru error: ${error.message}`);
    res
      .status(500)
      .json({ msg: "Terjadi kesalahan pada server", error: error.message });
  }
};

// Controller untuk registrasi siswa
export const RegisterSiswa = async (req, res) => {
  console.log("RegisterSiswa request:", req.body);
  const { fullName, nis, password, class: studentClass, token } = req.body;

  // Validasi input
  if (!fullName || !nis || !password || !studentClass || !token) {
    console.log("RegisterSiswa failed: Missing required fields");
    return res.status(400).json({ msg: "Semua kolom wajib diisi" });
  }

  // Validasi token
  if (token !== STUDENT_TOKEN) {
    console.log("RegisterSiswa failed: Invalid token");
    return res.status(403).json({ msg: "Token tidak valid" });
  }

  // Cek apakah NIS sudah terdaftar
  const existingUser = await User.findOne({
    where: { nis },
  });
  if (existingUser) {
    console.log(`RegisterSiswa failed: NIS ${nis} already registered`);
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
    console.log(`RegisterSiswa successful: NIS ${nis}`);
    res.status(201).json({ msg: "Registrasi siswa berhasil" });
  } catch (error) {
    console.error(`RegisterSiswa error: ${error.message}`);
    res
      .status(500)
      .json({ msg: "Terjadi kesalahan pada server", error: error.message });
  }
};
