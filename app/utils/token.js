/**
 * 生成token
 * iat: 签发时间
 * exp: 过期时间
 */
'use strict';

const jwt = require('jsonwebtoken');
const PrivateKey = require('../../config/server').jwtSecret;

// 生成Token - 全局中间件
exports.getToken = function(user) {
  return jwt.sign(
    { data: { _id: user._id, type: user.type } },
    PrivateKey,
    { expiresIn: '1d' }
  );
};

// 校验Token
exports.verifyToken = async function(ctx, next) {
  if (ctx.state.jwt_error) {
    ctx.throw(401, { error_key: 'auth', message: ctx.state.jwt_error });
  }
  await next();
};