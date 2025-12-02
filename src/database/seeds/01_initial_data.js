const bcrypt = require("bcryptjs");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // 1. Limpar tabelas (ordem inversa para respeitar chaves estrangeiras)
  // Usamos .del() ao invés de truncate para evitar problemas de FK em alguns ambientes
  await knex("movimentacoes_frota").del();
  await knex("movimentacoes_acessos").del();
  await knex("usuarios").del();
  await knex("pessoas").del();
  await knex("tipos_de_pessoas").del();

  // 2. Inserir Tipos de Pessoas
  await knex("tipos_de_pessoas").insert([
    { id: 1, nome: "Colaborador" },
    { id: 2, nome: "Terceiro" },
    { id: 3, nome: "Visitante" },
  ]);

  // 3. Criar Usuário Admin
  // A senha será '123456'
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash("123456", salt);

  await knex("usuarios").insert([
    {
      nome: "Administrador",
      email: "admin@sistema.com",
      senha_hash: hash,
      tipo_de_usuario: "admin",
      ativo: true,
    },
  ]);
};
