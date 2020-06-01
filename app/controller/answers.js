// app/controller/answers.js
'use strict';

const Controller = require('egg').Controller;

class AnswersController extends Controller {

  // 列表
  async list() {
    const { ctx } = this;
    const res = await ctx.service.answers.list();
    ctx.helper.success({ ctx, res });
  }

  // 详情
  async detail() {
    const { ctx } = this;
    const res = await ctx.service.answers.detail();
    ctx.helper.success({ ctx, res });
  }

  // 创建
  async create() {
    const { ctx } = this;
    const res = await ctx.service.answers.create();
    ctx.helper.success({ ctx, res: res._id, message: '添加成功' });
  }

  // 修改
  async patch() {
    const { ctx } = this;
    if (ctx.state.user._id !== ctx.state.answer.answerer.toString()) ctx.throw(401, { error_key: 'auth', message: '没有操作权限' });
    const res = await ctx.service.answers.update();
    ctx.helper.success({ ctx, res });
  }

  // 删除
  async del() {
    const { ctx } = this;
    if (ctx.state.user._id !== ctx.state.answer.answerer.toString()) ctx.throw(401, { error_key: 'auth', message: '没有操作权限' });
    await ctx.service.answers.del();
    ctx.helper.success({ ctx });
  }

  // 点赞回答
  async favor() {
    const { ctx } = this;
    if (ctx.state.user._id === ctx.state.answer.answerer.toString()) ctx.throw(401, { error_key: 'auth', message: '不能点赞自己' });
    await ctx.service.answers.favor();
    ctx.helper.success({ ctx });
  }

  // 取消点赞回答
  async unfavor() {
    const { ctx } = this;
    if (ctx.state.user._id === ctx.state.answer.answerer.toString()) ctx.throw(401, { error_key: 'auth', message: '不能点赞自己' });
    await ctx.service.answers.unfavor();
    ctx.helper.success({ ctx });
  }

  // 点赞该回答的用户列表
  async favorList() {
    const { ctx } = this;
    const res = await ctx.service.answers.favorList();
    ctx.helper.success({ ctx, res });
  }

  // 收藏回答
  async collect() {
    const { ctx } = this;
    await ctx.service.answers.collect();
    ctx.helper.success({ ctx });
  }

  // 取消收藏回答
  async uncollect() {
    const { ctx } = this;
    await ctx.service.answers.uncollect();
    ctx.helper.success({ ctx });
  }

  // 收藏该回答的用户列表
  async collectList() {
    const { ctx } = this;
    const res = await ctx.service.answers.collectList();
    ctx.helper.success({ ctx, res });
  }

}

module.exports = AnswersController;
