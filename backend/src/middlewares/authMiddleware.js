function authMiddleware(req, res, next) {
  const pin = req.headers['x-admin-pin'] || req.query.pin || req.body.pin;
  const configuredPin = process.env.ADMIN_PIN || '1234';

  if (!pin || String(pin).trim() !== String(configuredPin).trim()) {
    return res.status(401).json({
      error: 'Acesso negado. PIN da Coroa inválido!',
    });
  }

  next();
}

module.exports = { authMiddleware };
