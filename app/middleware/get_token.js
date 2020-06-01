'use strict'

const auth = require('basic-auth')
const jwt = require('jsonwebtoken')
const PrivateKey = require('../../config/server').jwtSecret

// 截取Token
module.exports = () => {
  return async function(ctx, next) {
    const BasicAuth = auth(ctx.request)
    if (BasicAuth) {
      try {
        ctx.state.user = jwt.verify(BasicAuth.name, PrivateKey).data // 保存用户信息
      } catch (err) {
        ctx.state.jwt_error = err.message
      }
    }
    await next()
  }
}