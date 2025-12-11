/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return (
    knex.schema
      // 1. Corrigir Movimentações de Acessos
      .alterTable("movimentacoes_acessos", (table) => {
        // Alteramos o tipo para decimal com 2 casas de precisão
        table.decimal("km_entrada", 10, 2).alter();
        table.decimal("km_saida", 10, 2).alter();
      })

      // 2. Corrigir Movimentações de Frota
      .alterTable("movimentacoes_frota", (table) => {
        table.decimal("km_entrada", 10, 2).alter();
        table.decimal("km_saida", 10, 2).alter();
      })
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  // Reverter (não recomendado neste caso, pois perde precisão)
  return knex.schema
    .alterTable("movimentacoes_acessos", (table) => {
      table.float("km_entrada").alter();
      table.float("km_saida").alter();
    })
    .alterTable("movimentacoes_frota", (table) => {
      table.float("km_entrada").alter();
      table.float("km_saida").alter();
    });
};
