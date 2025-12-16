const knex = require("../database/connection");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

module.exports = {
  async login(req, res) {
    // Log para confirmar que a requisição chegou
    console.log("--> Iniciando Controller de Login...");

    try {
      const { email, senha } = req.body;
      console.log(`1. Tentando logar com e-mail: ${email}`);

      // 1. Verificar se o usuário existe
      const user = await knex("usuarios").where({ email }).first();

      if (!user) {
        console.log("--> Falha: Usuário não encontrado no banco.");
        return res.status(401).json({ error: "Usuário não encontrado." });
      }

      console.log("2. Usuário encontrado. ID:", user.id);
      console.log(
        "--> Hash no banco:",
        user.senha_hash ? "Existe" : "Vazio/Undefined"
      );

      if (!user.senha_hash) {
        console.error("ERRO CRÍTICO: A coluna senha_hash veio vazia do banco!");
        return res
          .status(500)
          .json({ error: "Erro interno: Usuário sem senha cadastrada." });
      }

      // 2. Verificar se a senha está correta
      const checkPassword = await bcrypt.compare(senha, user.senha_hash);

      if (!checkPassword) {
        console.log("--> Falha: Senha não bate com o hash.");
        return res.status(401).json({ error: "Senha incorreta." });
      }

      // 3. Verificar se está ativo
      if (user.ativo === false) {
        // Comparação explícita para evitar falsos negativos
        console.log("--> Falha: Usuário inativo.");
        return res.status(401).json({ error: "Usuário inativo." });
      }

      console.log("3. Autenticação OK. Gerando Token...");

      // Verificação de segurança do JWT
      if (!process.env.JWT_SECRET) {
        console.error(
          "ERRO FATAL: A variável JWT_SECRET não existe no Railway!"
        );
        throw new Error("Configuração ausente: JWT_SECRET");
      }

      // 4. Gerar o Token JWT
      const token = jwt.sign(
        { id: user.id, nome: user.nome, tipo: user.tipo_de_usuario },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      console.log("4. Token gerado com sucesso. Retornando resposta.");

      return res.json({
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          tipo_de_usuario: user.tipo_de_usuario,
        },
        token,
      });
    } catch (error) {
      // Debug
      console.error("!!! ERRO 500 CAPTURADO !!!");
      console.error(error);
      console.error("Mensagem do erro:", error.message);

      return res.status(500).json({ error: "Erro interno no servidor." });
    }
  },
};
