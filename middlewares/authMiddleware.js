import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res
      .status(401)
      .json({ message: 'Acesso negado. Nenhum token fornecido.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    req.unidade_selecionada = req.header('UNIDADE');
    next();
  } catch (err) {
    res.status(403).json({ message: 'Token inválido.' });
  }
};

export default authMiddleware;
