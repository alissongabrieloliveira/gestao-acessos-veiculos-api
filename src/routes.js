const express = require("express");
const routes = express.Router();

const AuthController = require("./controllers/AuthController");
const authMiddleware = require("./middlewares/authMiddleware");
const UserController = require("./controllers/UserController");

// Rota Pública
routes.post("/login", AuthController.login);

// --- A partir daqui, todas as rotas exigem Login ---
routes.use(authMiddleware);

// --- Rotas de usuarios ---
routes.get("/usuarios", UserController.index);
routes.post("/usuarios", UserController.create);
routes.put("/usuarios/:id", UserController.update);
routes.delete("/usuarios/:id", UserController.delete);

// Rota de teste para ver quem está logado
routes.get("/me", (req, res) => {
  return res.json({ ok: true, userId: req.userId, userType: req.userType });
});

module.exports = routes;
