const knex = require("../database/connection");

module.exports = {
  // LISTAR (Com Join para trazer o nome do tipo)
  async index(req, res) {
    try {
      const pessoas = await knex("pessoas")
        .join(
          "tipos_de_pessoas",
          "pessoas.tipo_pessoa_id",
          "=",
          "tipos_de_pessoas.id"
        )
        .select(
          "pessoas.*",
          "tipos_de_pessoas.nome as tipo_descricao" // Para não confundir com o nome da pessoa
        )
        .orderBy("pessoas.nome");

      return res.json(pessoas);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao listar pessoas." });
    }
  },

  // CRIAR
  async create(req, res) {
    const { nome, documento, telefone, tipo_pessoa_id } = req.body;

    // Validação básica
    if (!nome || !documento || !tipo_pessoa_id) {
      return res
        .status(400)
        .json({ error: "Nome, Documento e Tipo são obrigatórios." });
    }

    try {
      // 1. Verifica se já existe alguém com esse documento (CPF/RG)
      const pessoaExists = await knex("pessoas").where({ documento }).first();

      if (pessoaExists) {
        return res.status(400).json({
          error: "Já existe uma pessoa cadastrada com este documento.",
        });
      }

      // 2. Insere
      await knex("pessoas").insert({
        nome,
        documento,
        telefone,
        tipo_pessoa_id,
      });

      return res.status(201).send({
        message: "Pessoa cadastrada com sucesso.",
      });
    } catch (error) {
      return res.status(500).json({ error: "Erro ao cadastrar pessoa." });
    }
  },

  // ATUALIZAR
  async update(req, res) {
    const { id } = req.params;
    const { nome, documento, telefone, tipo_pessoa_id } = req.body;

    try {
      // Verifica se o documento novo pertence a OUTRA pessoa (para evitar duplicidade na edição)
      const pessoaComDocumento = await knex("pessoas")
        .where({ documento })
        .first();

      if (pessoaComDocumento && pessoaComDocumento.id != id) {
        return res
          .status(400)
          .json({ error: "Este documento já pertence a outra pessoa." });
      }

      await knex("pessoas").where({ id }).update({
        nome,
        documento,
        telefone,
        tipo_pessoa_id,
        updated_at: new Date(),
      });

      return res.send({
        message: "Pessoa atualizada com sucesso.",
      });
    } catch (error) {
      return res.status(500).json({ error: "Erro ao atualizar pessoa." });
    }
  },

  // DELETAR
  async delete(req, res) {
    const { id } = req.params;

    try {
      await knex("pessoas").where({ id }).del();
      return res.status(204).send();
    } catch (error) {
      // Se a pessoa tiver movimentações registradas, o banco bloqueia (o que é correto)
      if (error.code === "23503") {
        return res.status(400).json({
          error:
            "Não é possível excluir esta pessoa pois ela possui histórico de movimentações.",
        });
      }
      return res.status(500).json({ error: "Erro ao deletar pessoa." });
    }
  },

  // LISTAR TIPOS (Auxiliar para o select do frontend)
  async getTypes(req, res) {
    try {
      const tipos = await knex("tipos_de_pessoas").select("*");
      return res.json(tipos);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao buscar tipos de pessoas" });
    }
  },
};
