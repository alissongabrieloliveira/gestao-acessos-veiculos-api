const bcrypt = require("bcryptjs");

exports.seed = async function (knex) {
  // 1. Limpa usuários existentes (Cuidado se já tiver dados)
  // await knex('usuarios').del();

  // 2. Gera o hash da senha "123456"
  const hashedPassword = await bcrypt.hash("123456", 8);

  // 3. Verifica se o admin já existe para não duplicar
  const userExists = await knex("usuarios")
    .where({ email: "admin@portaria.com" })
    .first();

  if (!userExists) {
    await knex("usuarios").insert({
      nome: "Administrador Supremo",
      email: "admin@portaria.com",
      senha_hash: hashedPassword,
      tipo_de_usuario: "admin",
      ativo: true,
    });
    console.log("Usuario Admin criado com sucesso!");
  }
};
