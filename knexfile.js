// server/knexfile.js
require("dotenv").config();

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
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
      directory: "./src/database/seeds",
    },
    useNullAsDefault: true,
  },
};
