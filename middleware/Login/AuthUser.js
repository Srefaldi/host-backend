import User from "../../models/LOGIN/UserModel.js";

export const verifyUser = async (req, res, next) => {
  if (!req.session.userId) {
    console.log("verifyUser: Tidak ada userId di sesi");
    return res.status(401).json({ msg: "Mohon login ke akun anda" });
  }
  try {
    const user = await User.findOne({
      where: {
        uuid: req.session.userId,
      },
    });
    if (!user) {
      console.log(
        "verifyUser: User tidak ditemukan untuk userId:",
        req.session.userId
      );
      return res.status(404).json({ msg: "User tidak ditemukan" });
    }
    req.userId = user.id;
    req.role = user.role;
    console.log("verifyUser: User diverifikasi:", user.nis, user.role);
    next();
  } catch (error) {
    console.error("verifyUser: Error:", error.message);
    return res.status(500).json({ msg: "Terjadi kesalahan pada server" });
  }
};

export const adminOnly = async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: {
        uuid: req.session.userId,
      },
    });
    if (!user) {
      console.log(
        "adminOnly: User tidak ditemukan untuk userId:",
        req.session.userId
      );
      return res.status(404).json({ msg: "User tidak ditemukan" });
    }
    if (user.role !== "admin") {
      console.log("adminOnly: Akses ditolak untuk user:", user.nis, user.role);
      return res.status(403).json({ msg: "Akses ditolak" });
    }
    console.log("adminOnly: Akses admin diberikan untuk user:", user.nis);
    next();
  } catch (error) {
    console.error("adminOnly: Error:", error.message);
    return res.status(500).json({ msg: "Terjadi kesalahan pada server" });
  }
};
