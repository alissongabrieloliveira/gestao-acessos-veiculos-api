require("dotenv").config();
const express = require("express");
const cors = require("cors");
const routes = require("./routes");

const app = express();

// Configurações
app.use(cors()); // Permite acesso do Frontend
app.use(express.json()); // Permite leitura de JSON no corpo das requisições

// Rotas
app.use(routes);

// Tratamento de erros genérico (Opcional, mas recomendado)
app.use((error, req, res, next) => {
  console.error(error);
  return res.status(500).json({ error: "Erro interno do servidor" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
