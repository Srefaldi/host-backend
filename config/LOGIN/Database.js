import { Sequelize } from "sequelize";

const db = new Sequelize("Csharp_db", "root", "", {
  host: "localhost",
  dialect: "mysql",
  define: {
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
    freezeTableName: true,
  },
  dialectOptions: {
    charset: "utf8mb4",
  },
});

db.authenticate()
  .then(() => console.log("Database connected"))
  .catch((err) => console.error("Database connection error:", err));

export default db;
