require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const jwt = require("jsonwebtoken");

const { db, dbPath } = require("./db");

// Rotas
const authRoutes = require("./routes/auth");
const statsRoutes = require("./routes/stats");
const categoriesRoutes = require("./routes/categories");
const itemsRoutes = require("./routes/items");
const logsRoutes = require("./routes/logs");
const usersRoutes = require("./routes/users");

const app = express();

app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
app.use(cors({ origin: [corsOrigin], credentials: true }));

/**
 * ✅ Middleware GLOBAL
 * - injeta req.db (pra TODAS as rotas usarem o sqlite)
 * - injeta req.user (se token válido)
 */
app.use((req, res, next) => {
  req.db = db;

  const auth = req.headers.authorization;

  if (auth && auth.startsWith("Bearer ")) {
    const token = auth.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch {
      req.user = null;
    }
  } else {
    req.user = null;
  }

  next();
});

app.get("/api/health", (req, res) => res.json({ ok: true, db: dbPath }));

// Rotas
app.use("/api", authRoutes);
app.use("/api", statsRoutes);
app.use("/api", categoriesRoutes);
app.use("/api", itemsRoutes);
app.use("/api", logsRoutes);
app.use("/api/users", usersRoutes);

// Fallback
app.use((req, res) => res.status(404).json({ error: "Not found" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API rodando em http://localhost:${PORT}`));
