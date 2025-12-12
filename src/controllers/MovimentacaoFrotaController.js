const knex = require("../database/connection");

module.exports = {
  // LISTAR
  async index(req, res) {
    try {
      const { status } = req.query; // ?status=saiu (em viagem) ou ?status=patio (disponível)

      const query = knex("movimentacoes_frota")
        .join("pessoas", "movimentacoes_frota.id_pessoa", "=", "pessoas.id") // Motorista
        .join("veiculos", "movimentacoes_frota.id_veiculo", "=", "veiculos.id")
        .leftJoin(
          "cidades",
          "movimentacoes_frota.id_cidade_de_destino",
          "=",
          "cidades.id"
        )
        .select(
          "movimentacoes_frota.*",
          "pessoas.nome as motorista_nome",
          "veiculos.placa",
          "veiculos.modelo",
          "cidades.nome as cidade_destino",
          "cidades.uf as cidade_uf"
        )
        .orderBy("movimentacoes_frota.data_hora_entrada", "desc");

      if (status) {
        query.where("movimentacoes_frota.status", status);
      }

      const movimentacoes = await query;
      return res.json(movimentacoes);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao listar frota." });
    }
  },

  // LISTAR (Com filtros de data, nome e placa)
  async index(req, res) {
    try {
      const { status, data_inicio, data_fim, nome, placa } = req.query;

      const query = knex("movimentacoes_frota")
        .join("pessoas", "movimentacoes_frota.id_pessoa", "=", "pessoas.id")
        .join("veiculos", "movimentacoes_frota.id_veiculo", "=", "veiculos.id")
        .leftJoin(
          "cidades",
          "movimentacoes_frota.id_cidade_de_destino",
          "=",
          "cidades.id"
        )
        .select(
          "movimentacoes_frota.*",
          "pessoas.nome as motorista_nome",
          "veiculos.placa",
          "veiculos.modelo",
          "cidades.nome as cidade_destino",
          "cidades.uf as cidade_uf"
        )
        .orderBy("movimentacoes_frota.data_hora_entrada", "desc");

      if (status) {
        query.where("movimentacoes_frota.status", status);
      }

      if (data_inicio) {
        query.where(
          "movimentacoes_frota.data_hora_entrada",
          ">=",
          `${data_inicio} 00:00:00`
        );
      }
      if (data_fim) {
        query.where(
          "movimentacoes_frota.data_hora_entrada",
          "<=",
          `${data_fim} 23:59:59`
        );
      }

      // --- Novos filtros ---
      if (nome) {
        query.where("pessoas.nome", "ilike", `%${nome}%`);
      }
      if (placa) {
        query.where("veiculos.placa", "ilike", `%${placa}%`);
      }

      const movimentacoes = await query;
      return res.json(movimentacoes);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao listar frota." });
    }
  },

  // SAÍDA DE VEÍCULO (Início da Viagem)
  async saida(req, res) {
    const {
      id_pessoa,
      id_veiculo,
      id_posto_controle_entrada, // Posto de onde saiu
      km_entrada, // Odômetro na saída
      id_cidade_de_destino,
      motivo_saida,
      observacao,
    } = req.body;

    const id_usuario_entrada = req.userId;

    if (!id_veiculo || !km_entrada || !id_cidade_de_destino) {
      return res
        .status(400)
        .json({ error: "Veículo, KM e Destino são obrigatórios." });
    }

    try {
      // 1. Validar se o veículo é de frota própria
      const veiculo = await knex("veiculos").where({ id: id_veiculo }).first();
      if (!veiculo || !veiculo.veiculo_de_frota_propria) {
        return res
          .status(400)
          .json({ error: "Este veículo não pertence à frota ou não existe." });
      }

      // 2. Validar se o veículo JÁ ESTÁ em viagem (status = saiu)
      const emViagem = await knex("movimentacoes_frota")
        .where({ id_veiculo, status: "saiu" })
        .first();

      if (emViagem) {
        return res.status(400).json({
          error:
            'Este veículo já consta como "Em Viagem". Registre o retorno antes.',
        });
      }

      // 3. Cria o registro de Saída
      await knex("movimentacoes_frota").insert({
        id_pessoa,
        id_veiculo,
        id_usuario_entrada,
        id_posto_controle_entrada,
        km_entrada,
        id_cidade_de_destino,
        motivo_saida,
        observacao,
        data_hora_entrada: new Date(), // Hora da saída da empresa
        status: "saiu",
      });

      return res.status(201).send({
        message: "Saída registrada com sucesso.",
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ error: "Erro ao registrar saída de frota." });
    }
  },

  // RETORNO DE VEÍCULO (Fim da Viagem)
  async retorno(req, res) {
    const { id } = req.params; // ID da movimentação
    const {
      id_posto_controle_saida, // Posto onde chegou
      km_saida, // Odômetro na chegada
      observacao,
    } = req.body;

    const id_usuario_saida = req.userId;

    if (!km_saida) {
      return res.status(400).json({ error: "KM de retorno é obrigatório." });
    }

    try {
      // 1. Busca a viagem aberta
      const viagem = await knex("movimentacoes_frota")
        .where({ id, status: "saiu" })
        .first();

      if (!viagem) {
        return res
          .status(400)
          .json({ error: "Viagem não encontrada ou já finalizada." });
      }

      // 2. Validação Lógica: KM de volta não pode ser menor que KM de ida
      if (parseFloat(km_saida) < parseFloat(viagem.km_entrada)) {
        return res.status(400).json({
          error: `KM final (${km_saida}) não pode ser menor que o inicial (${viagem.km_entrada}).`,
        });
      }

      // 3. Atualiza (Fecha a viagem)
      const observacaoFinal = observacao
        ? viagem.observacao
          ? `${viagem.observacao} | Retorno: ${observacao}`
          : observacao
        : viagem.observacao;

      await knex("movimentacoes_frota").where({ id }).update({
        id_usuario_saida,
        id_posto_controle_saida,
        km_saida,
        data_hora_saida: new Date(), // Hora da chegada na empresa
        observacao: observacaoFinal,
        status: "patio", // Veículo disponível novamente
      });

      return res.send({
        message: "Retorno registrado com sucesso.",
      });
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Erro ao registrar retorno de frota." });
    }
  },

  // EDIÇÃO COMPLETA (ADMIN)
  async update(req, res) {
    const { id } = req.params;
    const {
      id_pessoa, // Motorista
      id_veiculo,
      id_cidade_de_destino,
      id_posto_controle_entrada, // Posto Saída (início)
      id_posto_controle_saida, // Posto Chegada (fim)
      km_entrada, // KM Saída
      km_saida, // KM Chegada
      motivo_saida,
      observacao,
    } = req.body;

    if (req.userType !== "admin")
      return res.status(403).json({ error: "Sem permissão." });

    try {
      await knex("movimentacoes_frota")
        .where({ id })
        .update({
          id_pessoa,
          id_veiculo,
          id_cidade_de_destino,
          id_posto_controle_entrada,
          id_posto_controle_saida: id_posto_controle_saida || null,
          km_entrada,
          km_saida: km_saida || null,
          motivo_saida,
          observacao,
          status: km_saida ? "patio" : "saiu", // Se tem KM de volta, tá no pátio
          data_hora_saida: km_saida
            ? knex.raw("COALESCE(data_hora_saida, NOW())")
            : null,
        });
      return res.send();
    } catch (error) {
      return res.status(500).json({ error: "Erro ao atualizar frota." });
    }
  },

  async delete(req, res) {
    const { id } = req.params;
    if (req.userType !== "admin")
      return res.status(403).json({ error: "Sem permissão." });

    try {
      await knex("movimentacoes_frota").where({ id }).del();
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: "Erro ao excluir." });
    }
  },
};
