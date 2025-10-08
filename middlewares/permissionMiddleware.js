import jwt from 'jsonwebtoken';

const permissionMiddleware = (requiredPermissions = []) => {
  return (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res
        .status(401)
        .json({ message: 'Acesso negado. Nenhum token fornecido.' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (requiredPermissions.includes(decoded.permissao)) {
        req.user = decoded; // Adiciona o usuário decodificado ao objeto req
        next();
      } else {
        res.status(403).json({ message: 'Permissão negada.' });
      }
    } catch (err) {
      res.status(401).json({ message: 'Token inválido.' });
    }
  };
};

export default permissionMiddleware;
