// app/service/access.js
'use strict';

const Service = require('egg').Service;
const getToken = require('../utils/token').getToken;

class AccessService extends Service {
  constructor(ctx) {
    super(ctx);
    this.rule = {
      loginByPsd: {
        mobile: { type: 'string', required: true, allowEmpty: false },
        password: { type: 'string', required: true, allowEmpty: false },
      },
      loginBySms: {
        smscode: { type: 'string', required: true, allowEmpty: false },
        password: { type: 'string', required: true, allowEmpty: false },
      },
      register: {
        mobile: { type: 'string', required: true },
        nickname: { type: 'string', required: true },
        password: { type: 'string', required: true },
      },
      checkphone: {
        mobile: { type: 'string', required: true, allowEmpty: false },
      },
    };
    this.select = '+mobile +avatar_url';
  }

  // 检查手机号
  async checkMobile() {
    const { ctx } = this;
    ctx.validate(this.rule.checkphone, ctx.request.body);
    const user = await ctx.model.User.findOne({ mobile: ctx.request.body.mobile });
    // if (!user) ctx.throw(404, { error_key: 'mobile', message: '手机号未注册' });
    let res;
    switch (ctx.request.body.action) {
      case 'login':
        res = user ? { message: '手机号已注册' } : { error_key: 'mobile', message: '手机号未注册' };
        break;
      case 'register':
        res = user ? { error_key: 'mobile', message: '手机号已注册' } : { message: '手机号未注册' };
        break;
      case 'reset':
        res = user ? { message: '手机号已注册' } : { error_key: 'mobile', message: '手机号未注册' };
        break;
      default:
        res = user ? { message: '手机号已注册' } : { error_key: 'mobile', message: '手机号未注册' };
        break;
    }
    return res;
  }

  // 账户验证 - 比对短信验证码
  async accountAuth() {
    const { ctx } = this;
    const body = ctx.request.body;
    const user = await ctx.model.User.findOne({ _id: ctx.state.user._id }).select('+mobile');
    await ctx.service.sms.verify({
      mobile: user.mobile,
      smscode: body.smscode,
    });
    return true;
  }

  // 注册
  async register() {
    const { ctx } = this;
    const body = ctx.request.body;
    ctx.validate(this.rule.register, body);

    if (!body.smscode) {
      ctx.throw(403, { error_key: 'smscode', message: '验证码不能为空' });
    }

    const res = await ctx.model.User.findOne({ $or: [{ mobile: body.mobile }, { nickname: body.nickname }] })
      .select('+mobile');
    if (res) {
      if (body.mobile === res.mobile) {
        ctx.throw(409, { error_key: 'mobile', message: '手机号已注册' });
      }
      if (body.nickname === res.nickname) {
        ctx.throw(409, { error_key: 'nickname', message: '昵称已被占用' });
      }
    }
    await ctx.service.sms.verify({ mobile: body.mobile, smscode: body.smscode });

    ctx.request.body.password = ctx.service.crypto.Decrypt(body.mobile, body.password);
    const user = await ctx.model.User.add(ctx);
    return { detail: user, token: getToken(user) }; // 生成Token令牌
  }

  // 登录
  async login() {
    const { ctx } = this;
    let res;
    switch (ctx.request.body.loginType) {
      case 'psd': res = await this.loginByPsd(); break;
      case 'sms': res = await this.loginBySms(); break;
      default: res = await this.loginByPsd(); break;
    }
    ctx.state.user = res.detail;
    return res;
  }

  // 密码登录
  async loginByPsd() {

    const { ctx } = this;

    const body = ctx.request.body;

    ctx.validate(this.rule.loginByPsd, body);

    // 查找用户
    const user = await ctx.model.User.findOne({ mobile: body.mobile })
      .select(`+password ${this.select}`)
      .lean()
      .exec();
    if (!user) {
      ctx.throw(404, { error_key: 'mobile', message: '手机号未注册' });
    }

    // 解密密码
    body.password = ctx.service.crypto.Decrypt(body.mobile, body.password);
    if (!body.password) {
      ctx.throw(401, { error_key: 'password', message: '登录密码错误' });
    }

    // 比对密码
    const verifyPsd = await ctx.compare(body.password, user.password);
    if (!verifyPsd) {
      ctx.throw(401, { error_key: 'password', message: '登录密码错误' });
    }

    user.mobile = ctx.helper.filterTel(user.mobile);
    delete user.password;
    return { detail: user, token: getToken(user) }; // 生成Token令牌
  }

  // 短信登录
  async loginBySms() {

    const { ctx } = this;
    const body = ctx.request.body;
    ctx.validate(this.rule.loginBySms, body);

    const user = await ctx.model.User.findOne({ mobile: body.mobile })
      .select(`+password ${this.select}`)
      .lean()
      .exec();
    if (!user) {
      ctx.throw(404, { error_key: 'mobile', message: '手机号未注册' });
    }

    if (user) {
      await ctx.service.sms.verify({ mobile: body.mobile, smscode: body.smscode });
      user.mobile = ctx.helper.filterTel(user.mobile);
      delete user.password;
    } else { // 自动创建新帐号
      const newUser = await ctx.model.User.add(ctx);
      newUser.mobile = ctx.helper.filterTel(newUser.mobile);
      delete newUser.password;
    }
    return { detail: user, token: getToken(user) }; // 生成Token令牌
  }

  // 验证token - 只返回用户基本信息
  async token() {
    const { ctx } = this;
    const user = await ctx.model.User.detail({
      id: ctx.state.user._id,
      select: this.select,
    });
    if (!user) {
      ctx.throw(404, { error_key: 'user', message: '用户不存在' });
    }
    user.mobile = ctx.helper.filterTel(user.mobile);
    return user;
  }

  // 退出
  static logout() {
    const { ctx } = this;
    delete ctx.state.user;
    return { message: '退出成功' };
  }

}

module.exports = AccessService;
