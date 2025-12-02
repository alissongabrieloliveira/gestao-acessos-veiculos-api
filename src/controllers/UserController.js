const knex = require("../database/connection");
const bcrypt = require("bcryptjs");

module.exports = {
  // LISTAR TODOS OS USUÁRIOS
  async index(req, res) {
    try {
      // Selecionamos apenas os campos seguros
      const users = await knex("usuarios").select(
        "id",
        "nome",
        "email",
        "tipo_de_usuario",
        "ativo",
        "created_at"
      );

      return res.json(users);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao listar usuários" });
    }
  },

  // CRIAR NOVO USUÁRIO
  async create(req, res) {
    // Apenas Admins podem criar usuários
    if (req.userType !== "admin") {
      return res.status(403).json({
        error: "Acesso negado. Apenas administradores podem criar usuários.",
      });
    }

    const { nome, email, senha, tipo_de_usuario } = req.body;

    try {
      // Verifica se e-mail já existe
      const userExists = await knex("usuarios").where({ email }).first();
      if (userExists) {
        return res.status(400).json({ error: "E-mail já cadastrado." });
      }

      // Criptografa a senha
      const salt = await bcrypt.genSalt(10);
      const senha_hash = await bcrypt.hash(senha, salt);

      await knex("usuarios").insert({
        nome,
        email,
        senha_hash,
        tipo_de_usuario: tipo_de_usuario || "operador", // padrão é operador
        ativo: true,
      });

      return res.status(201).send({
        message: "Usuário criado com sucesso",
      }); // 201 = Created
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao criar usuário" });
    }
  },

  // ATUALIZAR USUÁRIO (Editar nome, permissão, ativar/desativar ou trocar senha)
  async update(req, res) {
    if (req.userType !== "admin") {
      return res.status(403).json({ error: "Acesso negado." });
    }

    const { id } = req.params;
    const { nome, email, senha, tipo_de_usuario, ativo } = req.body;

    try {
      // Objeto com dados a serem atualizados
      let updateData = {
        nome,
        email,
        tipo_de_usuario,
        ativo,
        updated_at: new Date(),
      };

      // Se enviou senha nova, faz o hash. Se não enviou, mantém a antiga.
      if (senha) {
        const salt = await bcrypt.genSalt(10);
        updateData.senha_hash = await bcrypt.hash(senha, salt);
      }

      await knex("usuarios").where({ id }).update(updateData);

      return res.send();
    } catch (error) {
      return res.status(500).json({ error: "Erro ao atualizar usuário" });
    }
  },

  // DELETAR USUÁRIO
  async delete(req, res) {
    if (req.userType !== "admin") {
      return res.status(403).json({ error: "Acesso negado." });
    }

    const { id } = req.params;

    try {
      // Evitar que o admin se delete a si mesmo
      if (Number(id) === req.userId) {
        return res
          .status(400)
          .json({ error: "Você não pode excluir sua própria conta." });
      }

      await knex("usuarios").where({ id }).del();

      return res.status(204).send({
        message: "Usuário deletado com sucesso",
      }); // 204 = No Content
    } catch (error) {
      return res.status(500).json({ error: "Erro ao deletar usuário" });
    }
  },
};
