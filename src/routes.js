const express = require("express");
const routes = express.Router();

const AuthController = require("./controllers/AuthController");
const authMiddleware = require("./middlewares/authMiddleware");
const UserController = require("./controllers/UserController");
const SetorController = require("./controllers/SetorController");
const PostoControleController = require("./controllers/PostoControleController");

// Rota Pública
routes.post("/login", AuthController.login);

// --- A partir daqui, todas as rotas exigem Login ---
routes.use(authMiddleware);

// --- Rotas de usuarios ---
routes.get("/usuarios", UserController.index);
routes.post("/usuarios", UserController.create);
routes.put("/usuarios/:id", UserController.update);
routes.delete("/usuarios/:id", UserController.delete);

// --- Setores ---
routes.get("/setores", SetorController.index);
routes.post("/setores", SetorController.create);
routes.put("/setores/:id", SetorController.update);
routes.delete("/setores/:id", SetorController.delete);

// --- Postos de Controle ---
routes.get("/postos", PostoControleController.index);
routes.post("/postos", PostoControleController.create);
routes.put("/postos/:id", PostoControleController.update);
routes.delete("/postos/:id", PostoControleController.delete);

// Rota de teste para ver quem está logado
routes.get("/me", (req, res) => {
  return res.json({ ok: true, userId: req.userId, userType: req.userType });
});

module.exports = routes;
