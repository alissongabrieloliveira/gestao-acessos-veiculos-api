const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization;

  // 1. Verifica se o header authorization existe
  if (!authHeader) {
    return res.status(401).json({ error: "Token não fornecido." });
  }

  // O formato geralmente é "Bearer <token>"
  // Vamos dividir a string para pegar só o token
  const parts = authHeader.split(" ");

  if (parts.length !== 2) {
    return res.status(401).json({ error: "Erro no formato do Token." });
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ error: "Token malformatado." });
  }

  // 2. Verifica a validade do token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Token inválido." });
    }

    // 3. Inclui o ID do usuário na requisição para as próximas rotas usarem
    req.userId = decoded.id;
    req.userType = decoded.tipo; // Útil para verificar permissões depois

    return next();
  });
};
