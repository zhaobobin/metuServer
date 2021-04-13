// app/controller/access.js
'use strict';

const Controller = require('egg').Controller;

class AccessController extends Controller {

  // 检查手机号
  async checkMobile() {
    const { ctx } = this;
    const res = await ctx.service.access.checkMobile();
    ctx.helper.success({ ctx, res });
  }

  // 账户验证
  async accountAuth() {
    const { ctx } = this;
    await ctx.service.access.accountAuth();
    ctx.helper.success({ ctx, message: 'success' });
  }

  // 注册
  async register() {
    const { ctx } = this;
    const res = await ctx.service.access.register();
    ctx.helper.success({ ctx, res });
  }

  // 用户登入
  async login() {
    const { ctx } = this;
    const res = await ctx.service.access.login();
    ctx.helper.success({ ctx, res });
  }

  // 用户token
  async token() {
    const { ctx } = this;
    const res = await ctx.service.access.token();
    ctx.helper.success({ ctx, res });
  }

  // 发送邮箱验证码
  async emailcode() {
    const { ctx } = this;
    const message = await ctx.service.email.send();
    ctx.helper.success({ ctx, message });
  }

  // 发送短信验证码
  async smscode() {
    const { ctx } = this;
    const message = await ctx.service.sms.send();
    ctx.helper.success({ ctx, message });
  }

  // 检查短信验证码
  async checkSmscode() {
    const { ctx } = this;
    const message = await ctx.service.sms.checkSmscode();
    ctx.helper.success({ ctx, message });
  }

  // 用户登出
  async logout() {
    const { ctx } = this;
    ctx.service.access.logout();
    ctx.helper.success({ ctx });
  }

  // 微信登录
  async wechatLoginAuth() {
    const { ctx } = this;
    const res = await ctx.service.wechat.wechatLoginAuth();
    ctx.helper.success({ ctx, res });
  }

  // 微博登录
  async weiboLoginAuth() {
    const { ctx } = this;
    const res = await ctx.service.weibo.weiboLoginAuth();
    ctx.helper.success({ ctx, res });
  }

  // QQ登录
  async qqLoginAuth() {
    const { ctx } = this;
    const res = await await ctx.service.qq.qqLoginAuth();
    ctx.helper.success({ ctx, res });
  }

}

module.exports = AccessController;
