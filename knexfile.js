const path = require("path");
require("dotenv").config();

// Converter a String do Railway em Objeto para o Knex/PG
function parseConnection(url) {
  if (!url) return {};

  try {
    const dbUrl = new URL(url);
    return {
      host: dbUrl.hostname,
      port: dbUrl.port,
      user: dbUrl.username,
      password: dbUrl.password, // Decodifica automaticamente a senha da URL
      database: dbUrl.pathname.split("/")[1],
      ssl: { rejectUnauthorized: false }, // OBRIGATÓRIO para Supabase
    };
  } catch (e) {
    console.error("Erro ao fazer parse da URL do banco:", e);
    return {};
  }
}

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
  // Configuração Local
  development: {
    client: "pg",
    connection: {
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 5432,
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
    // Usa a função para entregar o objeto mastigado para o Knex
    connection: parseConnection(process.env.DATABASE_URL),
    migrations: {
      directory: path.resolve(__dirname, "src", "database", "migrations"),
    },
    seeds: {
      directory: path.resolve(__dirname, "src", "database", "seeds"),
    },
    useNullAsDefault: true,
  },
};
