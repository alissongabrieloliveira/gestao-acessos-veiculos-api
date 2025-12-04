const knex = require("../database/connection");

module.exports = {
  async resumo(req, res) {
    try {
      // Define o início do dia atual (00:00:00)
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      // Executa todas as consultas em paralelo para ser super rápido
      const [veiculosNoPatio, frotaEmAcao, entradasHoje, saidasHoje, recentes] =
        await Promise.all([
          // 1. Contar veículos no pátio
          knex("movimentacoes_acessos")
            .where("status", "patio")
            .count()
            .first(),

          // 2. Contar frota viajando
          knex("movimentacoes_frota").where("status", "saiu").count().first(),

          // 3. Contar entradas de hoje (maior ou igual a 00:00 de hoje)
          knex("movimentacoes_acessos")
            .where("data_hora_entrada", ">=", hoje)
            .count()
            .first(),

          // 4. Contar saídas de hoje
          knex("movimentacoes_acessos")
            .where("data_hora_saida", ">=", hoje)
            .count()
            .first(),

          // 5. Buscar as 5 últimas movimentações para a lista
          knex("movimentacoes_acessos")
            .join(
              "pessoas",
              "movimentacoes_acessos.id_pessoa",
              "=",
              "pessoas.id"
            )
            .leftJoin(
              "veiculos",
              "movimentacoes_acessos.id_veiculo",
              "=",
              "veiculos.id"
            )
            .select(
              "movimentacoes_acessos.id",
              "movimentacoes_acessos.data_hora_entrada",
              "movimentacoes_acessos.status",
              "pessoas.nome as pessoa_nome",
              "veiculos.modelo as veiculo_modelo",
              "veiculos.placa as veiculo_placa"
            )
            .orderBy("movimentacoes_acessos.data_hora_entrada", "desc")
            .limit(5),
        ]);

      // O Postgres retorna o count como string, converter para Number
      return res.json({
        veiculosNoPatio: Number(veiculosNoPatio.count),
        frotaEmAcao: Number(frotaEmAcao.count),
        entradasHoje: Number(entradasHoje.count),
        saidasHoje: Number(saidasHoje.count),
        recentes, // Array com os 5 últimos
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ error: "Erro ao buscar resumo do dashboard." });
    }
  },
};
