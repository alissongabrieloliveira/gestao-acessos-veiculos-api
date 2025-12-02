const express = require("express");
const routes = express.Router();

const AuthController = require("./controllers/AuthController");
const authMiddleware = require("./middlewares/authMiddleware");

// Rota Pública
routes.post("/login", AuthController.login);

// --- A partir daqui, todas as rotas exigem Login ---
routes.use(authMiddleware);

// Rota de teste para ver quem está logado
routes.get("/me", (req, res) => {
  return res.json({ ok: true, userId: req.userId, userType: req.userType });
});

module.exports = routes;
