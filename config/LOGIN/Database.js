import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const db = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    define: {
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
      freezeTableName: true,
    },
    dialectOptions: {
      charset: "utf8mb4",
    },
  }
);

db.authenticate()
  .then(() => console.log("Database connected"))
  .catch((err) => console.error("Database connection error:", err));

export default db;
