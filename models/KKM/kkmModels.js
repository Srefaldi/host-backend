import { DataTypes } from "sequelize";
import db from "../../config/LOGIN/Database.js";
import Evaluation from "../EVALUASI/EvaluasiModel.js";

const Kkm = db.define(
  "kkm",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    evaluation_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "evaluations",
        key: "id",
      },
    },
    kkm: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        max: 100,
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

Evaluation.hasOne(Kkm, { foreignKey: "evaluation_id" });
Kkm.belongsTo(Evaluation, { foreignKey: "evaluation_id" });

export default Kkm;
