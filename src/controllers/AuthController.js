const knex = require("../database/connection");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

module.exports = {
  async login(req, res) {
    const { email, senha } = req.body;

    try {
      // 1. Busca o usuário pelo e-mail
      const user = await knex("usuarios").where({ email }).first();

      if (!user) {
        // Por segurança, não informamos se o erro foi no e-mail ou na senha
        return res.status(401).json({ error: "E-mail ou senha incorretos." });
      }

      // 2. Compara a senha enviada com o Hash do banco
      const checkPassword = await bcrypt.compare(senha, user.senha_hash);

      if (!checkPassword) {
        return res.status(401).json({ error: "E-mail ou senha incorretos." });
      }

      // 3. Verifica se o usuário está ativo
      if (user.ativo === false) {
        return res
          .status(401)
          .json({ error: "Usuário inativo. Contate o administrador." });
      }

      // 4. Gera o Token JWT
      const token = jwt.sign(
        { id: user.id, nome: user.nome, tipo: user.tipo_de_usuario },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      // Remove a senha do objeto de retorno para não enviar para o frontend
      const { senha_hash, ...userData } = user;

      return res.json({
        user: userData,
        token,
      });
    } catch (error) {
      console.error("Erro no AuthController:", error); // log para monitoramento interno
      return res.status(500).json({ error: "Erro interno no servidor." });
    }
  },
};
