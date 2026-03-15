function corsMiddleware({ allowedOrigins }) {
  return (req, res, next) => {
    const requestOrigin = req.headers.origin;
    const isAllowedOrigin = !requestOrigin || allowedOrigins.includes(requestOrigin);

    if (isAllowedOrigin) {
      if (requestOrigin) {
        res.setHeader('Access-Control-Allow-Origin', requestOrigin);
        res.setHeader('Vary', 'Origin');
      }
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    return next();
  };
}

module.exports = {
  corsMiddleware,
};
