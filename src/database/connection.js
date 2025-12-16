const knex = require("knex");
const configuration = require("../../knexfile");

// Pega o ambiente atual (production no Railway, development no PC)
const config = configuration[process.env.NODE_ENV || "development"];

const connection = knex(config);

module.exports = connection;
