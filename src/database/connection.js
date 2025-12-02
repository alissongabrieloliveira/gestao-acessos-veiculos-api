const knex = require("knex");
const configuration = require("../../knexfile");

// Seleciona a configuração de 'development'
const connection = knex(configuration.development);

module.exports = connection;
