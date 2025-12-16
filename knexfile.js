// server/knexfile.js
const path = require("path");
require("dotenv").config();

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
  // Configuração Local
  development: {
    client: "pg",
    connection: {
      host: process.env.DB_HOST || "localhost",
      database: process.env.DB_NAME || "gestao_veiculos",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "sua_senha",
    },
    migrations: {
      directory: "./src/database/migrations",
    },
    seeds: {
      directory: path.resolve(__dirname, "src", "database", "seeds"),
    },
    useNullAsDefault: true,
  },

  // Configuração de Produção
  production: {
    client: "pg",
    // URL completa do banco nesta variável
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // Obrigatório para Supabase/Heroku/Render
    },
    migrations: {
      directory: path.resolve(__dirname, "src", "database", "migrations"),
    },
    seeds: {
      directory: path.resolve(__dirname, "src", "database", "seeds"),
    },
    useNullAsDefault: true,
  },
};
