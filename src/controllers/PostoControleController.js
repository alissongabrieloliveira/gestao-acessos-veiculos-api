const knex = require("../database/connection");

module.exports = {
  // LISTAR
  async index(req, res) {
    try {
      const postos = await knex("postos_controle").orderBy("nome");
      return res.json(postos);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao listar postos." });
    }
  },

  // CRIAR
  async create(req, res) {
    const { nome } = req.body;

    if (!nome) {
      return res.status(400).json({ error: "Nome do posto é obrigatório." });
    }

    try {
      await knex("postos_controle").insert({ nome });
      return res.status(201).send({
        message: "Posto de controle criado com sucesso.",
      });
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Erro ao criar posto de controle." });
    }
  },

  // ATUALIZAR
  async update(req, res) {
    const { id } = req.params;
    const { nome } = req.body;

    try {
      await knex("postos_controle").where({ id }).update({
        nome,
        updated_at: new Date(),
      });
      return res.send({
        message: "Posto de controle atualizado com sucesso.",
      });
    } catch (error) {
      return res.status(500).json({ error: "Erro ao atualizar posto." });
    }
  },

  // DELETAR
  async delete(req, res) {
    const { id } = req.params;

    try {
      await knex("postos_controle").where({ id }).del();
      return res.status(204).send({
        message: "Posto de controle deletado com sucesso.",
      });
    } catch (error) {
      if (error.code === "23503") {
        return res.status(400).json({
          error:
            "Não é possível excluir este posto pois existem registros vinculados a ele.",
        });
      }
      return res.status(500).json({ error: "Erro ao deletar posto." });
    }
  },
};
