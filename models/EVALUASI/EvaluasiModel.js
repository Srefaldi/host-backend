import { DataTypes } from "sequelize";
import db from "../../config/LOGIN/Database.js";

const Evaluation = db.define(
  "evaluations",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    type: {
      type: DataTypes.ENUM("bab", "evaluasi_akhir"),
      allowNull: false,
    },
    chapter: {
      type: DataTypes.INTEGER,
      allowNull: true, // Null untuk evaluasi akhir
      validate: {
        isIn: {
          args: [[1, 2, 3, 4, 5, 6]],
          msg: "Chapter harus antara 1 dan 6 untuk evaluasi bab",
        },
      },
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default Evaluation;
