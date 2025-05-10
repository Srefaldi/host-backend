import { DataTypes } from "sequelize";
import db from "../../config/LOGIN/Database.js";
import Evaluation from "../EVALUASI/EvaluasiModel.js";

const Question = db.define(
  "questions",
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
    question_text: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    option_a: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    option_b: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    option_c: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    option_d: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    option_e: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    correct_answer: {
      type: DataTypes.ENUM("A", "B", "C", "D", "E"),
      allowNull: false,
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

Evaluation.hasMany(Question, { foreignKey: "evaluation_id" });
Question.belongsTo(Evaluation, { foreignKey: "evaluation_id" });

export default Question;
