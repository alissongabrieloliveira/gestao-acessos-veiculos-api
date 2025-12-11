const knex = require("../database/connection");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

module.exports = {
  async login(req, res) {
    const { email, senha } = req.body;

    try {
      // 1. Verificar se o usuário existe
      const user = await knex("usuarios").where({ email }).first();

      if (!user) {
        return res.status(401).json({ error: "Usuário não encontrado." });
      }

      // 2. Verificar se a senha está correta
      const checkPassword = await bcrypt.compare(senha, user.senha_hash);

      if (!checkPassword) {
        return res.status(401).json({ error: "Senha incorreta." });
      }

      // 3. Verificar se está ativo
      if (!user.ativo) {
        return res.status(401).json({ error: "Usuário inativo." });
      }

      // 4. Gerar o Token JWT
      // O token vai carregar o ID e o Nome do usuário
      const token = jwt.sign(
        { id: user.id, nome: user.nome, tipo: user.tipo_de_usuario },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      // Retornar dados do usuário (menos a senha) e o token
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
      console.error(error);
      return res.status(500).json({ error: "Erro ao realizar login." });
    }
  },
};
