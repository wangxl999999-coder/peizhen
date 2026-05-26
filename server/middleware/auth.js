const jwt = require('jsonwebtoken');
const config = require('../config');
const { error } = require('../utils/response');

function auth(roles = ['user', 'companion', 'admin']) {
  return async (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.json(error('请先登录', 401));
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      
      if (!roles.includes(decoded.role)) {
        return res.json(error('无权限访问', 403));
      }

      req.user = decoded;
      next();
    } catch (err) {
      return res.json(error('登录已过期，请重新登录', 401));
    }
  };
}

module.exports = auth;
