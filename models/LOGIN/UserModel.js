import { Sequelize, DataTypes } from "sequelize";
import db from "../../config/LOGIN/Database.js";

const Users = db.define(
  "users",
  {
    uuid: {
      type: DataTypes.STRING,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
      validate: {
        notEmpty: true,
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 100],
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    nis: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    school: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        notEmpty: {
          msg: "Sekolah tidak boleh kosong jika diisi",
        },
      },
    },
    class: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        notEmpty: {
          msg: "Kelas tidak boleh kosong jika diisi",
        },
      },
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "BELUM SELESAI",
      validate: {
        notEmpty: true,
        isIn: [["SELESAI", "BELUM SELESAI"]],
      },
    },
    progress: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: null,
      validate: {
        min: 0,
        max: 100,
      },
    },
  },
  {
    freezeTableName: true,
  }
);

export default Users;
