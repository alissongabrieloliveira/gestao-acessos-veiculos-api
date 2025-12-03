const knex = require("../database/connection");

module.exports = {
  // LISTAR
  async index(req, res) {
    const cidades = await knex("cidades").orderBy("nome");
    return res.json(cidades);
  },

  // CRIAR
  async create(req, res) {
    const { nome, uf } = req.body;
    try {
      await knex("cidades").insert({ nome, uf });
      return res.status(201).send({
        message: "Cidade cadastrada com sucesso.",
      });
    } catch (error) {
      return res.status(500).json({ error: "Erro ao cadastrar cidade" });
    }
  },
};
