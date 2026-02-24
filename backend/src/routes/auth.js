const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { get } = require("../db");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};

    // ⚠️ aqui trocamos password_hash -> password
    const user = await get(
      "SELECT id, username, name, role, password, active FROM users WHERE username = ?",
      [username]
    );

    if (!user) return res.status(401).json({ error: "Usuário ou senha inválidos" });

    // se você ainda não criou o active, isso evita crash
    if (typeof user.active !== "undefined" && Number(user.active) === 0) {
      return res.status(403).json({ error: "Usuário desativado" });
    }

    const dbPass = user.password || "";

    // ✅ compatível com: senha já hash (bcrypt) OU senha antiga em texto puro
    let ok = false;
    if (dbPass.startsWith("$2a$") || dbPass.startsWith("$2b$") || dbPass.startsWith("$2y$")) {
      ok = await bcrypt.compare(password || "", dbPass);
    } else {
      ok = (password || "") === dbPass;
    }

    if (!ok) return res.status(401).json({ error: "Usuário ou senha inválidos" });

    const token = jwt.sign(
      { id: user.id, username: user.username, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    return res.json({
      token,
      user: { id: user.id, username: user.username, name: user.name, role: user.role },
    });
  } catch (e) {
    console.error("login error", e);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
});

module.exports = router;
