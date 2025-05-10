import User from "../../models/LOGIN/UserModel.js";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

const getUsers = async (req, res) => {
  try {
    const { class: userClass } = req.query;
    const whereClause = { role: "user" };
    if (userClass) {
      whereClause.class = userClass;
    }
    const users = await User.findAll({
      attributes: [
        "uuid",
        "name",
        "nis",
        "role",
        "school",
        "class",
        "status",
        "progress",
      ],
      where: whereClause,
    });
    res.status(200).json(users);
  } catch (error) {
    console.error("Error di getUsers:", error.message);
    res.status(500).json({ msg: "Terjadi kesalahan pada server" });
  }
};

const getClasses = async (req, res) => {
  try {
    const classes = await User.findAll({
      attributes: ["class"],
      where: { role: "user" },
      group: ["class"],
      order: [["class", "ASC"]],
    });
    const classList = classes.map((item) => item.class).filter((cls) => cls); // Filter out null or empty classes
    res.status(200).json(classList);
  } catch (error) {
    console.error("Error di getClasses:", error.message);
    res.status(500).json({ msg: "Terjadi kesalahan pada server" });
  }
};

const getUsersById = async (req, res) => {
  try {
    const user = await User.findOne({
      attributes: [
        "uuid",
        "name",
        "nis",
        "role",
        "school",
        "class",
        "status",
        "progress",
      ],
      where: { uuid: req.params.id },
    });
    if (!user) {
      return res.status(404).json({ msg: "User tidak ditemukan" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error di getUsersById:", error.message);
    res.status(500).json({ msg: "Terjadi kesalahan pada server" });
  }
};

const createUsers = async (req, res) => {
  const {
    name,
    email,
    nis,
    password,
    role,
    school,
    class: userClass,
    status,
    progress,
  } = req.body;
  try {
    if (status && !["SELESAI", "BELUM SELESAI"].includes(status)) {
      return res
        .status(400)
        .json({ msg: "Status harus SELESAI atau BELUM SELESAI" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      uuid: uuidv4(),
      name,
      email,
      nis,
      password: hashedPassword,
      role,
      school,
      class: userClass,
      status: status || "BELUM SELESAI",
      progress,
    });
    res.status(201).json({ msg: "User berhasil dibuat" });
  } catch (error) {
    console.error("Error di createUsers:", error.message);
    res
      .status(500)
      .json({ msg: "Terjadi kesalahan pada server", error: error.message });
  }
};

const updateUsers = async (req, res) => {
  const {
    name,
    email,
    nis,
    password,
    role,
    school,
    class: userClass,
    status,
    progress,
  } = req.body;
  try {
    const user = await User.findOne({ where: { uuid: req.params.id } });
    if (!user) {
      return res.status(404).json({ msg: "User tidak ditemukan" });
    }
    if (status && !["SELESAI", "BELUM SELESAI"].includes(status)) {
      return res
        .status(400)
        .json({ msg: "Status harus SELESAI atau BELUM SELESAI" });
    }
    const updatedData = {
      name,
      email,
      nis,
      role,
      school,
      class: userClass,
      status: status || user.status,
      progress,
    };
    if (password) {
      updatedData.password = await bcrypt.hash(password, 10);
    }
    await User.update(updatedData, { where: { uuid: req.params.id } });
    res.status(200).json({ msg: "User berhasil diperbarui" });
  } catch (error) {
    console.error("Error di updateUsers:", error.message);
    res
      .status(500)
      .json({ msg: "Terjadi kesalahan pada server", error: error.message });
  }
};

const delateUsers = async (req, res) => {
  try {
    const user = await User.findOne({ where: { uuid: req.params.id } });
    if (!user) {
      return res.status(404).json({ msg: "User tidak ditemukan" });
    }
    await User.destroy({ where: { uuid: req.params.id } });
    res.status(200).json({ msg: "User berhasil dihapus" });
  } catch (error) {
    console.error("Error di delateUsers:", error.message);
    res.status(500).json({ msg: "Terjadi kesalahan pada server" });
  }
};

const updateProgress = async (req, res) => {
  const { progress } = req.body;
  try {
    const user = await User.findOne({ where: { uuid: req.params.id } });
    if (!user) {
      return res.status(404).json({ msg: "User tidak ditemukan" });
    }
    if (progress < 0 || progress > 100) {
      return res.status(400).json({ msg: "Progress harus antara 0 dan 100" });
    }
    const status = progress === 100 ? "SELESAI" : "BELUM SELESAI";
    await User.update({ progress, status }, { where: { uuid: req.params.id } });
    res.status(200).json({ msg: "Progress dan status berhasil diperbarui" });
  } catch (error) {
    console.error("Error di updateProgress:", error.message);
    res.status(500).json({ msg: "Terjadi kesalahan pada server" });
  }
};

export {
  getUsers,
  getClasses,
  getUsersById,
  createUsers,
  updateUsers,
  delateUsers,
  updateProgress,
};
