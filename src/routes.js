const express = require("express");
const routes = express.Router();

// Rota de teste para ver se a API está viva
routes.get("/", (req, res) => {
  return res.json({ message: "Sistema de Portaria - API Online" });
});

module.exports = routes;
