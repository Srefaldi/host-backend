import express from "express";
import cors from "cors";
import session from "express-session";
import dotenv from "dotenv";
import db from "./config/LOGIN/Database.js";
import SequelizeStore from "connect-session-sequelize";
import UserRoute from "./routes/Login/UserRoute.js";
import AuthRoute from "./routes/Login/AuthRoute.js";
import ScoreRoute from "./routes/Score/ScoreRoute.js";
import QuestionRoute from "./routes/Evaluasi/EvaluasiRoute.js";
import KkmRoute from "./routes/KKM/kkmRoute.js";
import User from "./models/LOGIN/UserModel.js";
import Score from "./models/MateriSkor/SkorModel.js";
import Evaluation from "./models/EVALUASI/EvaluasiModel.js";
import Question from "./models/EVALUASI/Soal.js";
import Kkm from "./models/KKM/kkmModels.js";

dotenv.config();
const app = express();

// ⛳️ Penting untuk deployment (Railway / proxy)
app.set("trust proxy", 1);

const sessionStore = SequelizeStore(session.Store);
const store = new sessionStore({
  db: db,
  checkExpirationInterval: 15 * 60 * 1000,
  expiration: 24 * 60 * 60 * 1000,
});

// Sinkronisasi database dan model
(async () => {
  try {
    await store.sync({ force: false });
    console.log("Sessions table synced");
    await Kkm.sync({ force: false });
    console.log("KKM table synced");
    await Question.sync({ force: false });
    console.log("Questions table synced");
    await Score.sync({ force: false });
    console.log("Scores table synced");
    await Evaluation.sync({ force: false });
    console.log("Evaluations table synced");
    await User.sync({ force: false });
    console.log("Users table synced");

    const evaluations = await Evaluation.findAll();
    if (evaluations.length === 0) {
      for (let i = 1; i <= 6; i++) {
        await Evaluation.create({ type: "bab", chapter: i });
      }
      await Evaluation.create({ type: "evaluasi_akhir" });
      console.log("Evaluations initialized");
    }

    const kkmRecords = await Kkm.findAll();
    if (kkmRecords.length === 0) {
      const evaluations = await Evaluation.findAll();
      for (const evaluation of evaluations) {
        await Kkm.create({ evaluation_id: evaluation.id, kkm: 75 });
      }
      console.log("KKM initialized with default value 75");
    }
  } catch (error) {
    console.error("Error syncing database:", error);
  }
})();

// ✅ Konfigurasi CORS
const allowedOrigins = [
  "http://localhost:3000",
  "https://host-frontend-five.vercel.app", // Ganti dengan URL frontend Anda
];

app.use(
  cors({
    credentials: true,
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  })
);

// ✅ Tangani permintaan OPTIONS secara eksplisit
app.options("*", cors());

// ✅ Konfigurasi session
app.use(
  session({
    secret: process.env.SESS_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
      secure: process.env.NODE_ENV === "production" ? true : false,
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Body parser
app.use(express.json());

// ✅ Logging sesi dan cookie (untuk debug)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log("[DEBUG] Origin:", req.headers.origin);
  console.log("[DEBUG] Session ID:", req.sessionID);
  console.log("[DEBUG] Session userId:", req.session.userId);
  console.log("[DEBUG] Cookies:", req.headers.cookie);
  next();
});

// ⛳️ Gunakan route
app.use(UserRoute);
app.use(AuthRoute);
app.use(ScoreRoute);
app.use(QuestionRoute);
app.use(KkmRoute);

// ✅ Jalankan server
const PORT = process.env.APP_PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
