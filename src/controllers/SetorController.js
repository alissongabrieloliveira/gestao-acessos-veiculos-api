const knex = require("../database/connection");

module.exports = {
  // LISTAR
  async index(req, res) {
    try {
      const setores = await knex("setores").orderBy("nome");
      return res.json(setores);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao listar setores." });
    }
  },

  // CRIAR
  async create(req, res) {
    const { nome } = req.body;

    if (!nome) {
      return res.status(400).json({ error: "Nome do setor é obrigatório." });
    }

    try {
      await knex("setores").insert({ nome });
      return res.status(201).send({
        message: "Setor criado com sucesso.",
      });
    } catch (error) {
      return res.status(500).json({ error: "Erro ao criar setor." });
    }
  },

  // ATUALIZAR
  async update(req, res) {
    const { id } = req.params;
    const { nome } = req.body;

    try {
      await knex("setores").where({ id }).update({
        nome,
        updated_at: new Date(),
      });
      return res.send({
        message: "Setor atualizado com sucesso.",
      });
    } catch (error) {
      return res.status(500).json({ error: "Erro ao atualizar setor." });
    }
  },

  // DELETAR
  async delete(req, res) {
    const { id } = req.params;

    try {
      // Se já houver movimentações vinculadas a este setor,
      // o banco vai travar (Constraint Error). Isso é bom para integridade.
      await knex("setores").where({ id }).del();
      return res.status(204).send({
        message: "Setor deletado com sucesso.",
      });
    } catch (error) {
      // Código 23503 é o erro de chave estrangeira no Postgres (dependência)
      if (error.code === "23503") {
        return res.status(400).json({
          error:
            "Não é possível excluir este setor pois existem registros vinculados a ele.",
        });
      }
      return res.status(500).json({ error: "Erro ao deletar setor." });
    }
  },
};
