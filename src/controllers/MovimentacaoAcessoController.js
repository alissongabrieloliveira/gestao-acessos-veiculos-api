const knex = require("../database/connection");

module.exports = {
  // LISTAR (Dashboard e Histórico)
  async index(req, res) {
    try {
      const { status } = req.query; // Filtra por status 'patio' ou 'saiu'

      const query = knex("movimentacoes_acessos")
        .join("pessoas", "movimentacoes_acessos.id_pessoa", "=", "pessoas.id")
        .leftJoin(
          "veiculos",
          "movimentacoes_acessos.id_veiculo",
          "=",
          "veiculos.id"
        )
        .join(
          "setores",
          "movimentacoes_acessos.id_setor_visitado",
          "=",
          "setores.id"
        )
        .join(
          "postos_controle as posto_ent",
          "movimentacoes_acessos.id_posto_controle_entrada",
          "=",
          "posto_ent.id"
        )
        .leftJoin(
          "postos_controle as posto_sai",
          "movimentacoes_acessos.id_posto_controle_saida",
          "=",
          "posto_sai.id"
        )
        .select(
          "movimentacoes_acessos.*",
          "pessoas.nome as pessoa_nome",
          "pessoas.documento as pessoa_documento",
          "veiculos.placa as veiculo_placa",
          "veiculos.modelo as veiculo_modelo",
          "setores.nome as setor_nome",
          "posto_ent.nome as posto_entrada_nome",
          "posto_sai.nome as posto_saida_nome"
        )
        .orderBy("movimentacoes_acessos.data_hora_entrada", "desc");

      if (status) {
        query.where("movimentacoes_acessos.status", status);
      }

      const movimentacoes = await query;
      return res.json(movimentacoes);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao listar movimentações." });
    }
  },

  // LISTAR (Com filtros de data)
  async index(req, res) {
    try {
      const { status, data_inicio, data_fim } = req.query;

      const query = knex("movimentacoes_acessos")
        .join("pessoas", "movimentacoes_acessos.id_pessoa", "=", "pessoas.id")
        .leftJoin(
          "veiculos",
          "movimentacoes_acessos.id_veiculo",
          "=",
          "veiculos.id"
        )
        .join(
          "setores",
          "movimentacoes_acessos.id_setor_visitado",
          "=",
          "setores.id"
        )
        .join(
          "postos_controle as posto_ent",
          "movimentacoes_acessos.id_posto_controle_entrada",
          "=",
          "posto_ent.id"
        )
        .leftJoin(
          "postos_controle as posto_sai",
          "movimentacoes_acessos.id_posto_controle_saida",
          "=",
          "posto_sai.id"
        )
        .select(
          "movimentacoes_acessos.*",
          "pessoas.nome as pessoa_nome",
          "pessoas.documento as pessoa_documento",
          "veiculos.placa as veiculo_placa",
          "veiculos.modelo as veiculo_modelo",
          "setores.nome as setor_nome",
          "posto_ent.nome as posto_entrada_nome",
          "posto_sai.nome as posto_saida_nome"
        )
        .orderBy("movimentacoes_acessos.data_hora_entrada", "desc");

      if (status) {
        query.where("movimentacoes_acessos.status", status);
      }

      // Filtro de Data
      if (data_inicio) {
        query.where(
          "movimentacoes_acessos.data_hora_entrada",
          ">=",
          `${data_inicio} 00:00:00`
        );
      }
      if (data_fim) {
        query.where(
          "movimentacoes_acessos.data_hora_entrada",
          "<=",
          `${data_fim} 23:59:59`
        );
      }

      const movimentacoes = await query;
      return res.json(movimentacoes);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao listar movimentações." });
    }
  },

  // REGISTRAR ENTRADA
  async entrada(req, res) {
    const {
      id_pessoa,
      id_veiculo,
      id_setor_visitado,
      id_posto_controle_entrada,
      km_entrada,
      motivo_da_visita,
      observacao,
    } = req.body;

    const id_usuario_entrada = req.userId; // Pega do token de quem está logado

    if (!id_pessoa || !id_setor_visitado || !id_posto_controle_entrada) {
      return res
        .status(400)
        .json({ error: "Pessoa, Setor e Posto de Controle são obrigatórios." });
    }

    try {
      // 1. Regra de Negócio: Verificar se a pessoa já está no pátio
      const estaNoPatio = await knex("movimentacoes_acessos")
        .where({ id_pessoa, status: "patio" })
        .first();

      if (estaNoPatio) {
        return res.status(400).json({
          error:
            'Esta pessoa já consta como "Em Pátio". Registre a saída primeiro.',
        });
      }

      // 2. Cria o registro de entrada
      await knex("movimentacoes_acessos").insert({
        id_pessoa,
        id_veiculo: id_veiculo || null, // Pode ser null (a pé)
        id_usuario_entrada,
        id_posto_controle_entrada,
        id_setor_visitado,
        km_entrada: km_entrada || null,
        motivo_da_visita,
        observacao,
        data_hora_entrada: new Date(),
        status: "patio",
      });

      return res.status(201).send({
        message: "Entrada registrada com sucesso.",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao registrar entrada." });
    }
  },

  // REGISTRAR SAÍDA
  async saida(req, res) {
    const { id } = req.params; // ID da Movimentação
    const { id_posto_controle_saida, km_saida, observacao } = req.body;

    const id_usuario_saida = req.userId;

    if (!id_posto_controle_saida) {
      return res
        .status(400)
        .json({ error: "Informe o posto de controle de saída." });
    }

    try {
      // 1. Verifica se a movimentação existe e está aberta
      const movimentacao = await knex("movimentacoes_acessos")
        .where({ id, status: "patio" })
        .first();

      if (!movimentacao) {
        return res
          .status(400)
          .json({ error: "Movimentação não encontrada ou já finalizada." });
      }

      // 2. Atualiza para status "saiu"
      // Se vier observação nova, concatenamos ou substituímos. Aqui vou substituir/adicionar.
      const observacaoFinal = observacao
        ? movimentacao.observacao
          ? `${movimentacao.observacao} | Saída: ${observacao}`
          : observacao
        : movimentacao.observacao;

      await knex("movimentacoes_acessos")
        .where({ id })
        .update({
          id_usuario_saida,
          id_posto_controle_saida,
          km_saida: km_saida || null,
          data_hora_saida: new Date(),
          observacao: observacaoFinal,
          status: "saiu",
        });

      return res.send({
        message: "Saída registrada com sucesso.",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao registrar saída." });
    }
  },
};
