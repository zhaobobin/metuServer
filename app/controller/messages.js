// app/controller/messages.js
'use strict';

const Controller = require('egg').Controller;

class MessagesController extends Controller {

  // 列表
  async list() {
    const { ctx } = this;
    const res = await ctx.service.messages.list();
    ctx.helper.success({ ctx, res });
  }

  // 详情
  async detail() {
    const { ctx } = this;
    const res = await ctx.service.messages.detail();
    ctx.helper.success({ ctx, res });
  }

  // 创建
  async create() {
    const { ctx } = this;
    await ctx.service.messages.create();
    ctx.helper.success({ ctx });
  }

  // 修改
  async patch() {
    const { ctx } = this;
    if (ctx.state.user._id !== ctx.state.message.send_from.toString()) ctx.throw(401, { error_key: 'auth', message: '没有操作权限' });
    const res = await ctx.service.messages.update();
    ctx.helper.success({ ctx, res });
  }

  // 删除
  async del() {
    const { ctx } = this;
    if (ctx.state.user.type !== 'admin' && ctx.state.user._id !== ctx.state.message.send_from.toString()) ctx.throw(401, { error_key: 'auth', message: '没有操作权限' });
    await ctx.service.messages.del();
    ctx.helper.success({ ctx });
  }

}

module.exports = MessagesController;
