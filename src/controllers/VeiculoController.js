const knex = require("../database/connection");

module.exports = {
  // LISTAR
  async index(req, res) {
    try {
      // Filtra via query params se quisermos só frota ou só terceiros
      // Ex: /veiculos?frota=true
      const { frota } = req.query;

      const query = knex("veiculos").orderBy("modelo");

      if (frota === "true") {
        query.where({ veiculo_de_frota_propria: true });
      } else if (frota === "false") {
        query.where({ veiculo_de_frota_propria: false });
      }

      const veiculos = await query;
      return res.json(veiculos);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao listar veículos." });
    }
  },

  // CRIAR
  async create(req, res) {
    const { placa, modelo, cor, veiculo_de_frota_propria } = req.body;

    if (!placa || !modelo) {
      return res
        .status(400)
        .json({ error: "Placa e Modelo são obrigatórios." });
    }

    try {
      // 1. Verifica duplicidade de placa
      // Converte para maiúsculo para garantir padronização
      const placaUpper = placa.toUpperCase();

      const veiculoExists = await knex("veiculos")
        .where({ placa: placaUpper })
        .first();

      if (veiculoExists) {
        return res
          .status(400)
          .json({ error: "Veículo já cadastrado com esta placa." });
      }

      await knex("veiculos").insert({
        placa: placaUpper,
        modelo,
        cor,
        veiculo_de_frota_propria: veiculo_de_frota_propria || false,
      });

      return res.status(201).send({
        message: "Veículo cadastrado com sucesso.",
      });
    } catch (error) {
      return res.status(500).json({ error: "Erro ao cadastrar veículo." });
    }
  },

  // ATUALIZAR
  async update(req, res) {
    const { id } = req.params;
    const { placa, modelo, cor, veiculo_de_frota_propria } = req.body;

    try {
      const placaUpper = placa ? placa.toUpperCase() : null;

      // Se estiver trocando a placa, verifica se já não existe em outro carro
      if (placaUpper) {
        const veiculoComPlaca = await knex("veiculos")
          .where({ placa: placaUpper })
          .first();
        if (veiculoComPlaca && veiculoComPlaca.id != id) {
          return res
            .status(400)
            .json({ error: "Esta placa já pertence a outro veículo." });
        }
      }

      await knex("veiculos").where({ id }).update({
        placa: placaUpper, // Se não enviou placa, o knex ignoraria se fosse undefined
        modelo,
        cor,
        veiculo_de_frota_propria,
        updated_at: new Date(),
      });

      return res.send({
        message: "Veículo atualizado com sucesso.",
      });
    } catch (error) {
      return res.status(500).json({ error: "Erro ao atualizar veículo." });
    }
  },

  // DELETAR
  async delete(req, res) {
    const { id } = req.params;

    try {
      await knex("veiculos").where({ id }).del();
      return res.status(204).send({
        message: "Veículo deletado com sucesso.",
      });
    } catch (error) {
      if (error.code === "23503") {
        return res.status(400).json({
          error:
            "Não é possível excluir este veículo pois ele possui histórico de movimentações.",
        });
      }
      return res.status(500).json({ error: "Erro ao deletar veículo." });
    }
  },
};
